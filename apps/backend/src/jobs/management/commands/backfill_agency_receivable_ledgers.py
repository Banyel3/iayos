from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Accounts, Job
from jobs.payment_buffer_service import reconcile_missing_agency_receivables_for_account


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
        parser.add_argument(
            "--account-id",
            type=int,
            default=None,
            help="Restrict backfill to a specific agency accountID.",
        )

    def handle(self, *args, **options):
        dry_run = bool(options.get("dry_run") or not options.get("execute"))
        limit = max(1, int(options.get("limit") or 500))
        account_id = options.get("account_id")

        self.stdout.write(
            self.style.NOTICE(
                f"Starting agency receivable backfill ({'DRY RUN' if dry_run else 'EXECUTE'}) at {timezone.now().isoformat()}"
            )
        )

        scanned = 0
        repaired = 0
        skipped = 0
        errors = 0
        reasons = {
            "error": 0,
        }

        target_accounts = []
        if account_id:
            account = Accounts.objects.filter(accountID=account_id).first()
            if not account:
                self.stderr.write(self.style.ERROR(f"Account #{account_id} not found"))
                return
            target_accounts = [account]
        else:
            target_accounts = list(
                Accounts.objects.filter(
                    accountID__in=Job.objects.filter(
                        assignedAgencyFK__isnull=False,
                        status="COMPLETED",
                    ).values_list("assignedAgencyFK__accountFK_id", flat=True).distinct()
                )
            )

        for account in target_accounts:
            result = reconcile_missing_agency_receivables_for_account(
                account=account,
                limit=limit,
                dry_run=dry_run,
            )

            scanned += int(result.get("scanned") or 0)
            repaired += int(result.get("repaired") or 0)
            skipped += int(result.get("skipped") or 0)
            errors += int(result.get("errors") or 0)

            for key, value in (result.get("reasons") or {}).items():
                reasons[key] = reasons.get(key, 0) + int(value or 0)

        self.stdout.write("\nReconciliation Report")
        self.stdout.write("---------------------")
        self.stdout.write(f"Scanned:  {scanned}")
        self.stdout.write(f"Repaired: {repaired}")
        self.stdout.write(f"Skipped:  {skipped}")
        self.stdout.write(f"Errors:   {errors}")
        self.stdout.write("Reasons:")
        for key, value in reasons.items():
            self.stdout.write(f"  - {key}: {value}")
