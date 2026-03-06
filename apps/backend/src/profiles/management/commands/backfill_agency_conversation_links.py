from django.core.management.base import BaseCommand
from django.db import transaction

from profiles.models import Conversation


class Command(BaseCommand):
    help = (
        "Backfill agency-linked conversations by setting Conversation.agency "
        "from related job.assignedAgencyFK and clearing stale worker links."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview changes without writing to the database.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        self.stdout.write("=" * 72)
        self.stdout.write("BACKFILL: AGENCY CONVERSATION LINKS")
        self.stdout.write("=" * 72)

        candidates = (
            Conversation.objects.select_related("relatedJobPosting__assignedAgencyFK")
            .filter(relatedJobPosting__assignedAgencyFK__isnull=False)
            .order_by("conversationID")
        )

        total = candidates.count()
        repaired = 0
        already_ok = 0

        self.stdout.write(f"Found {total} agency-assigned job conversation(s).")

        with transaction.atomic():
            for conversation in candidates:
                expected_agency = conversation.relatedJobPosting.assignedAgencyFK
                if not expected_agency:
                    continue

                current_agency = conversation.agency
                needs_agency_fix = (
                    current_agency is None
                    or current_agency.agencyId != expected_agency.agencyId
                )
                needs_worker_fix = conversation.worker is not None

                if not needs_agency_fix and not needs_worker_fix:
                    already_ok += 1
                    continue

                repaired += 1
                update_fields = []
                if needs_agency_fix:
                    conversation.agency = expected_agency
                    update_fields.append("agency")
                if needs_worker_fix:
                    conversation.worker = None
                    update_fields.append("worker")

                self.stdout.write(
                    f"- Conversation {conversation.conversationID}: "
                    f"set agency={expected_agency.agencyId}, clear worker={needs_worker_fix}"
                )

                if not dry_run:
                    conversation.save(update_fields=update_fields)

            if dry_run:
                transaction.set_rollback(True)

        self.stdout.write("-" * 72)
        self.stdout.write(f"Already correct: {already_ok}")
        self.stdout.write(f"Repaired: {repaired}")
        self.stdout.write(f"Mode: {'DRY RUN' if dry_run else 'APPLIED'}")
        self.stdout.write("=" * 72)
