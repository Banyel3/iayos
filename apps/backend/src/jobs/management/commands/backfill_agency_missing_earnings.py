from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import Job, JobEmployeeAssignment, Transaction, Wallet
from jobs.payment_buffer_service import add_pending_earnings, get_payment_buffer_days


class Command(BaseCommand):
    help = "Backfill missing agency PENDING_EARNING transactions for completed paid jobs"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing")
        parser.add_argument("--limit", type=int, default=0, help="Max jobs to process (0 = all)")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        limit = options["limit"]

        queryset = Job.objects.select_related("assignedAgencyFK__accountFK").filter(
            status="COMPLETED",
            remainingPaymentPaid=True,
            assignedAgencyFK__isnull=False,
        ).order_by("jobID")

        if limit and limit > 0:
            queryset = queryset[:limit]

        scanned = 0
        repaired = 0
        skipped = 0

        for job in queryset:
            scanned += 1
            agency_account = getattr(job.assignedAgencyFK, "accountFK", None)
            if not agency_account:
                skipped += 1
                self.stdout.write(self.style.WARNING(f"SKIP job#{job.jobID}: no agency account"))
                continue

            has_receivable = Transaction.objects.filter(
                relatedJobPosting=job,
                walletID__accountFK=agency_account,
                transactionType__in=[
                    Transaction.TransactionType.PENDING_EARNING,
                    Transaction.TransactionType.EARNING,
                ],
            ).exists()

            if has_receivable:
                skipped += 1
                continue

            # Reconstruct agency receivable amount:
            # prefer sum of assignment paymentAmount, fallback to full job budget.
            assignment_total = Decimal("0.00")
            assignments = JobEmployeeAssignment.objects.filter(job=job)
            for assignment in assignments:
                share = assignment.paymentAmount or Decimal("0.00")
                if share > 0:
                    assignment_total += share

            amount = assignment_total if assignment_total > Decimal("0.00") else (job.budget or Decimal("0.00"))

            if amount <= Decimal("0.00"):
                skipped += 1
                self.stdout.write(self.style.WARNING(f"SKIP job#{job.jobID}: non-positive reconstructed amount"))
                continue

            if dry_run:
                repaired += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"DRY-RUN REPAIR job#{job.jobID}: would add pending earning ₱{amount} to agency {agency_account.email}"
                    )
                )
                continue

            with transaction.atomic():
                add_pending_earnings(
                    job=job,
                    recipient_account=agency_account,
                    amount=amount,
                    recipient_type="agency",
                )

                # Keep job flags coherent for repaired records.
                if not job.paymentReleaseDate:
                    job.paymentReleaseDate = timezone.now()
                if not job.paymentHeldReason:
                    job.paymentHeldReason = "BUFFER_PERIOD"
                job.save(update_fields=["paymentReleaseDate", "paymentHeldReason", "updatedAt"])

            repaired += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f"REPAIRED job#{job.jobID}: added pending earning ₱{amount} (buffer {get_payment_buffer_days()} days)"
                )
            )

        self.stdout.write(
            self.style.NOTICE(
                f"Backfill complete: scanned={scanned}, repaired={repaired}, skipped={skipped}, dry_run={dry_run}"
            )
        )
