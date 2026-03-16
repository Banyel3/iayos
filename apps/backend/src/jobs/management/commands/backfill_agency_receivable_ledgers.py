from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction as db_transaction
from django.db import models
from django.utils import timezone

from accounts.models import Job, JobEmployeeAssignment, Transaction, Wallet
from jobs.payment_buffer_service import add_pending_earnings, has_receivable_ledger_for_account


class Command(BaseCommand):
    help = (
        "Detect and repair completed agency jobs with missing receivable ledger rows "
        "(pending earning / earning)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Scan and report only; no changes written.",
        )
        parser.add_argument(
            "--execute",
            action="store_true",
            help="Apply repairs. If omitted, command behaves as dry-run.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=500,
            help="Max completed jobs to scan (default: 500).",
        )

    def _expected_receivable_amount(self, job: Job) -> Decimal:
        approved_assignments = JobEmployeeAssignment.objects.filter(
            job=job,
            clientApproved=True,
        )
        assignment_total = (
            approved_assignments.aggregate(total=models.Sum("paymentAmount")).get("total")
            if approved_assignments.exists()
            else None
        )

        if assignment_total and assignment_total > Decimal("0.00"):
            return Decimal(str(assignment_total))

        remaining = Decimal(str(job.remainingPayment or Decimal("0.00")))
        materials = Decimal(str(job.materialsCost or Decimal("0.00")))
        fallback = remaining + materials

        if fallback > Decimal("0.00"):
            return fallback

        return Decimal(str(job.budget or Decimal("0.00")))

    def handle(self, *args, **options):
        dry_run = bool(options.get("dry_run") or not options.get("execute"))
        limit = max(1, int(options.get("limit") or 500))

        self.stdout.write(
            self.style.NOTICE(
                f"Starting agency receivable backfill ({'DRY RUN' if dry_run else 'EXECUTE'}) at {timezone.now().isoformat()}"
            )
        )

        jobs_qs = (
            Job.objects.select_related("assignedAgencyFK__accountFK")
            .filter(
                assignedAgencyFK__isnull=False,
                status="COMPLETED",
                remainingPaymentPaid=True,
            )
            .order_by("-updatedAt")[:limit]
        )

        scanned = 0
        repaired = 0
        skipped = 0
        errors = 0
        reasons = {
            "already_has_receivable": 0,
            "no_agency_account": 0,
            "non_positive_expected_amount": 0,
            "repaired_pending": 0,
            "repaired_released_ledger_only": 0,
            "error": 0,
        }

        for job in jobs_qs:
            scanned += 1
            agency_account = getattr(getattr(job, "assignedAgencyFK", None), "accountFK", None)
            if not agency_account:
                skipped += 1
                reasons["no_agency_account"] += 1
                continue

            if has_receivable_ledger_for_account(job, agency_account):
                skipped += 1
                reasons["already_has_receivable"] += 1
                continue

            expected_amount = self._expected_receivable_amount(job)
            if expected_amount <= Decimal("0.00"):
                skipped += 1
                reasons["non_positive_expected_amount"] += 1
                continue

            if dry_run:
                self.stdout.write(
                    f"[DRY RUN] Job #{job.jobID} '{job.title}': missing receivable, expected amount ₱{expected_amount}"
                )
                continue

            try:
                with db_transaction.atomic():
                    if job.paymentReleasedToWorker:
                        # Already released historically: create a completed earning ledger row only.
                        wallet, _ = Wallet.objects.get_or_create(accountFK=agency_account)
                        Transaction.objects.create(
                            walletID=wallet,
                            transactionType="EARNING",
                            amount=expected_amount,
                            balanceAfter=wallet.balance,
                            status="COMPLETED",
                            description=f"[Backfill] Released earning ledger for completed agency job: {job.title}",
                            referenceNumber=f"BACKFILL-JOB-{job.jobID}-RELEASED-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                            relatedJobPosting=job,
                            completedAt=timezone.now(),
                        )
                        reasons["repaired_released_ledger_only"] += 1
                    else:
                        settlement = add_pending_earnings(
                            job=job,
                            recipient_account=agency_account,
                            amount=expected_amount,
                            recipient_type="agency",
                            idempotency_key=f"backfill-agency-{job.jobID}",
                        )
                        if not settlement.get("success"):
                            raise RuntimeError("pending settlement helper returned unsuccessful result")
                        reasons["repaired_pending"] += 1

                repaired += 1
            except Exception as exc:
                errors += 1
                reasons["error"] += 1
                self.stderr.write(f"Failed repair for Job #{job.jobID}: {exc}")

        self.stdout.write("\nReconciliation Report")
        self.stdout.write("---------------------")
        self.stdout.write(f"Scanned:  {scanned}")
        self.stdout.write(f"Repaired: {repaired}")
        self.stdout.write(f"Skipped:  {skipped}")
        self.stdout.write(f"Errors:   {errors}")
        self.stdout.write("Reasons:")
        for key, value in reasons.items():
            self.stdout.write(f"  - {key}: {value}")
