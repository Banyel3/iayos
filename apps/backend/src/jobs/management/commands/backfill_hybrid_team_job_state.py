from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Job
from profiles.models import Conversation, ConversationParticipant


class Command(BaseCommand):
    help = (
        "Backfill legacy hybrid/team jobs stuck in ACTIVE despite being fully staffed, "
        "and normalize team conversations to TEAM_GROUP with synced participants."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--execute",
            action="store_true",
            help="Apply updates. Without this flag, command runs in dry-run mode.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Optional max number of team jobs to inspect.",
        )

    def handle(self, *args, **options):
        execute = bool(options.get("execute"))
        limit = int(options.get("limit") or 0)

        mode_label = "EXECUTE" if execute else "DRY-RUN"
        self.stdout.write(
            self.style.WARNING(
                f"Running backfill_hybrid_team_job_state in {mode_label} mode"
            )
        )

        team_jobs = Job.objects.filter(is_team_job=True).order_by("-createdAt")
        if limit > 0:
            team_jobs = team_jobs[:limit]

        inspected = 0
        status_candidates = 0
        status_updated = 0
        conversation_normalized = 0
        participant_synced = 0

        for job in team_jobs:
            inspected += 1

            should_start = job.status == "ACTIVE" and job.can_start_team_job
            if should_start:
                status_candidates += 1

            client_profile = job.clientID.profileID if job.clientID else None
            conversation = Conversation.objects.filter(relatedJobPosting=job).first()

            # Build participant targets from current assignments.
            assignments = job.worker_assignments.filter(
                assignment_status__in=["ACTIVE", "COMPLETED"]
            ).select_related("workerID__profileID", "skillSlotID")

            expected_worker_profiles = [a.workerID.profileID for a in assignments]

            if execute:
                with transaction.atomic():
                    if should_start:
                        job.status = "IN_PROGRESS"
                        job.save(update_fields=["status", "updatedAt"])
                        status_updated += 1

                    if client_profile:
                        conversation, _ = Conversation.create_team_conversation(
                            job_posting=job,
                            client_profile=client_profile,
                        )

                        # Normalize legacy team conversations that may still be
                        # ONE_ON_ONE from older flows.
                        conv_fields = []
                        if conversation.conversation_type != "TEAM_GROUP":
                            conversation.conversation_type = "TEAM_GROUP"
                            conv_fields.append("conversation_type")
                        if conversation.worker_id is not None:
                            conversation.worker = None
                            conv_fields.append("worker")
                        if conversation.client_id is None:
                            conversation.client = client_profile
                            conv_fields.append("client")
                        if conv_fields:
                            conv_fields.append("updatedAt")
                            conversation.save(update_fields=conv_fields)

                        if conversation.conversation_type == "TEAM_GROUP":
                            conversation_normalized += 1

                        ConversationParticipant.objects.get_or_create(
                            conversation=conversation,
                            profile=client_profile,
                            defaults={"participant_type": "CLIENT"},
                        )

                        for assignment in assignments:
                            _, created = ConversationParticipant.objects.get_or_create(
                                conversation=conversation,
                                profile=assignment.workerID.profileID,
                                defaults={
                                    "participant_type": "WORKER",
                                    "skill_slot": assignment.skillSlotID,
                                },
                            )
                            if created:
                                participant_synced += 1
            else:
                would_normalize = bool(client_profile)
                status_note = "would-transition" if should_start else "status-ok"
                conv_note = (
                    "would-normalize-conversation" if would_normalize else "no-client"
                )
                self.stdout.write(
                    f"job#{job.jobID} ({job.status}) {status_note}, {conv_note}, workers={len(expected_worker_profiles)}"
                )

        self.stdout.write(
            self.style.SUCCESS(
                "Hybrid team backfill complete. "
                f"inspected={inspected}, status_candidates={status_candidates}, "
                f"status_updated={status_updated}, conversations_normalized={conversation_normalized}, "
                f"participants_added={participant_synced}, mode={mode_label}"
            )
        )
