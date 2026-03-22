from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import Job


class Command(BaseCommand):
    help = (
        "Backfill team jobs assigned to an agency but missing per-slot agency invite fields."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--execute",
            action="store_true",
            help="Apply updates. Without this flag, command runs in dry-run mode.",
        )
        parser.add_argument(
            "--job-id",
            type=int,
            default=0,
            help="Optional single job ID to backfill.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Optional max number of jobs to inspect.",
        )

    def _derive_invite_status(self, job: Job) -> str:
        raw = str(getattr(job, "inviteStatus", "") or "").upper()
        if raw in {"PENDING", "ACCEPTED", "REJECTED"}:
            return raw

        status = str(getattr(job, "status", "") or "").upper()
        if status == "ACTIVE":
            return "PENDING"
        if status in {"IN_PROGRESS", "COMPLETED", "CANCELLED"}:
            return "ACCEPTED"
        return "PENDING"

    def handle(self, *args, **options):
        execute = bool(options.get("execute"))
        job_id = int(options.get("job_id") or 0)
        limit = int(options.get("limit") or 0)

        mode_label = "EXECUTE" if execute else "DRY-RUN"
        self.stdout.write(
            self.style.WARNING(
                f"Running backfill_agency_team_slot_invites in {mode_label} mode"
            )
        )

        qs = (
            Job.objects.filter(is_team_job=True, assignedAgencyFK__isnull=False)
            .select_related("assignedAgencyFK")
            .prefetch_related("skill_slots")
            .order_by("jobID")
        )
        if job_id > 0:
            qs = qs.filter(jobID=job_id)
        if limit > 0:
            qs = qs[:limit]

        inspected = 0
        jobs_changed = 0
        slots_updated = 0
        jobs_with_conflicts = 0
        invite_status_fixed = 0

        for job in qs:
            inspected += 1
            assigned_agency = job.assignedAgencyFK
            if assigned_agency is None:
                continue

            slots = list(job.skill_slots.all())
            if not slots:
                continue

            target_status = self._derive_invite_status(job)

            has_assigned_agency_slot = any(
                slot.invited_agency_id == assigned_agency.agencyId for slot in slots
            )
            slots_missing_invitee = [
                slot for slot in slots if slot.invited_agency_id is None
            ]

            conflicting_slots = [
                slot
                for slot in slots
                if slot.invited_agency_id is not None
                and slot.invited_agency_id != assigned_agency.agencyId
            ]

            slot_updates = 0
            status_only_updates = 0
            responded_at_updates = 0

            if conflicting_slots and not slots_missing_invitee and not has_assigned_agency_slot:
                jobs_with_conflicts += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"job#{job.jobID}: skipped due to conflicting invited_agency slots"
                    )
                )
                continue

            if execute:
                with transaction.atomic():
                    if not has_assigned_agency_slot:
                        for slot in slots_missing_invitee:
                            slot.invited_agency = assigned_agency
                            slot.agency_invite_status = target_status
                            if target_status in {"ACCEPTED", "REJECTED"}:
                                slot.agency_invite_responded_at = (
                                    slot.agency_invite_responded_at or timezone.now()
                                )
                            else:
                                slot.agency_invite_responded_at = None
                            slot.save(
                                update_fields=[
                                    "invited_agency",
                                    "agency_invite_status",
                                    "agency_invite_responded_at",
                                    "updatedAt",
                                ]
                            )
                            slot_updates += 1

                    for slot in slots:
                        if slot.invited_agency_id != assigned_agency.agencyId:
                            continue
                        fields_to_update = []
                        if slot.agency_invite_status is None:
                            slot.agency_invite_status = target_status
                            fields_to_update.append("agency_invite_status")
                            status_only_updates += 1

                        if (
                            slot.agency_invite_status in {"ACCEPTED", "REJECTED"}
                            and slot.agency_invite_responded_at is None
                        ):
                            slot.agency_invite_responded_at = timezone.now()
                            fields_to_update.append("agency_invite_responded_at")
                            responded_at_updates += 1

                        if fields_to_update:
                            fields_to_update.extend(["updatedAt"])
                            slot.save(update_fields=fields_to_update)

                    if not job.inviteStatus:
                        job.inviteStatus = target_status
                        job.save(update_fields=["inviteStatus", "updatedAt"])
                        invite_status_fixed += 1
            else:
                slot_updates = 0 if has_assigned_agency_slot else len(slots_missing_invitee)
                status_only_updates = len(
                    [
                        slot
                        for slot in slots
                        if slot.invited_agency_id == assigned_agency.agencyId
                        and slot.agency_invite_status is None
                    ]
                )
                responded_at_updates = len(
                    [
                        slot
                        for slot in slots
                        if slot.invited_agency_id == assigned_agency.agencyId
                        and (slot.agency_invite_status or target_status)
                        in {"ACCEPTED", "REJECTED"}
                        and slot.agency_invite_responded_at is None
                    ]
                )

            total_slot_updates = slot_updates + status_only_updates + responded_at_updates
            if total_slot_updates > 0:
                jobs_changed += 1
                slots_updated += total_slot_updates

            self.stdout.write(
                f"job#{job.jobID}: target_status={target_status}, "
                f"set_invited_agency={slot_updates}, set_status={status_only_updates}, "
                f"set_responded_at={responded_at_updates}, dry_run={not execute}"
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Agency team slot invite backfill complete. "
                f"inspected={inspected}, jobs_changed={jobs_changed}, "
                f"slot_updates={slots_updated}, invite_status_fixed={invite_status_fixed}, "
                f"conflicts={jobs_with_conflicts}, mode={mode_label}"
            )
        )
