"""
Management command: wipe_jobs
Deletes all job-related records and resets all wallet balances to ₱0.00.
Preserves: Accounts, Profiles, Skills, Certifications, Portfolios, KYC data.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal


class Command(BaseCommand):
    help = (
        "Wipe all jobs and cascade-delete related data "
        "(applications, conversations, transactions, etc.). "
        "Resets all wallet balances to ₱0.00. "
        "Does NOT delete accounts, profiles, skills, or certifications."
    )

    def handle(self, *args, **options):
        from accounts.models import Job, Wallet  # local import to avoid circular refs

        self.stdout.write("Starting job wipe and wallet reset...")

        with transaction.atomic():
            job_count, deleted_detail = Job.objects.all().delete()
            wallet_count = Wallet.objects.update(
                balance=Decimal("0.00"),
                reservedBalance=Decimal("0.00"),
                pendingEarnings=Decimal("0.00"),
            )

        # Build a readable breakdown
        detail_lines = [
            f"  {model}: {count}" for model, count in sorted(deleted_detail.items())
        ]
        detail_str = "\n".join(detail_lines) if detail_lines else "  (none)"

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ Done!\n"
                f"Deleted {job_count} total records:\n{detail_str}\n"
                f"Reset {wallet_count} wallet(s) to ₱0.00 "
                f"(balance, reservedBalance, pendingEarnings)."
            )
        )
