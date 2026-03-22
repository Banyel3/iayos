from decimal import Decimal

from django.test import TestCase
from django.test.client import RequestFactory
from django.core.management import call_command

from accounts.models import (
    Accounts,
    Agency,
    ClientProfile,
    Job,
    JobSkillSlot,
    Profile,
    Specializations,
    Wallet,
    WorkerProfile,
    workerSpecialization,
)
from adminpanel.models import ContentModerationTerm
from jobs.team_job_services import create_team_job, early_complete_single_project_job
from jobs.api import accept_job_invite_worker
from jobs.text_moderation import validate_job_post_content
from agency.services import get_agency_jobs
from agency.api import accept_job_invite, reject_job_invite
import jobs.text_moderation as text_moderation


class TeamJobCreationFallbackTests(TestCase):
    def setUp(self):
        self.client_account = Accounts.objects.create_user(
            email="client-fallback@test.com",
            password="password123",
            isVerified=True,
            verification_level=2,
            KYCVerified=True,
        )
        self.client_profile = Profile.objects.create(
            accountFK=self.client_account,
            profileType="CLIENT",
            firstName="Client",
            lastName="Fallback",
        )
        self.client_profile_record = ClientProfile.objects.create(
            profileID=self.client_profile,
            description="",
            totalJobsPosted=0,
            clientRating=0,
            activeJobsCount=0,
        )
        Wallet.objects.create(
            accountFK=self.client_account, balance=Decimal("100000.00")
        )

        self.specialization = Specializations.objects.create(
            specializationName="Plumbing",
            minimumRate=Decimal("500.00"),
        )

    def test_requires_agency_fallback_when_no_freelancers_available(self):
        result = create_team_job(
            client_profile=self.client_profile,
            title="Team plumbing repair",
            description="Need team now",
            location="Test Location",
            total_budget=Decimal("5000.00"),
            skill_slots_data=[
                {
                    "specialization_id": self.specialization.specializationID,
                    "workers_needed": 2,
                    "skill_level_required": "ENTRY",
                }
            ],
            payment_method="WALLET",
            payment_model="PROJECT",
        )

        self.assertFalse(result.get("success"))
        self.assertTrue(result.get("requires_agency_fallback"))
        self.assertEqual(len(result.get("fallback_slots", [])), 1)
        self.assertEqual(
            result["fallback_slots"][0]["specialization_id"],
            self.specialization.specializationID,
        )

    def test_team_job_creation_succeeds_when_freelancer_exists(self):
        worker_account = Accounts.objects.create_user(
            email="worker-fallback@test.com",
            password="password123",
            isVerified=True,
            verification_level=2,
            KYCVerified=True,
        )
        worker_profile = Profile.objects.create(
            accountFK=worker_account,
            profileType="WORKER",
            firstName="Worker",
            lastName="One",
        )
        worker_record = WorkerProfile.objects.create(
            profileID=worker_profile,
            availability_status="AVAILABLE",
            is_available_daily_jobs=True,
        )
        workerSpecialization.objects.create(
            workerID=worker_record,
            specializationID=self.specialization,
            experienceYears=2,
            certification="TESDA NC II",
        )

        result = create_team_job(
            client_profile=self.client_profile,
            title="Team plumbing repair",
            description="Need team now",
            location="Test Location",
            total_budget=Decimal("5000.00"),
            skill_slots_data=[
                {
                    "specialization_id": self.specialization.specializationID,
                    "workers_needed": 2,
                    "skill_level_required": "ENTRY",
                }
            ],
            payment_method="WALLET",
            payment_model="PROJECT",
        )

        self.assertTrue(result.get("success"), msg=result.get("error"))
        self.assertIn("job_id", result)


class EarlyCompleteSingleProjectTests(TestCase):
    def setUp(self):
        self.client_account = Accounts.objects.create_user(
            email="client-early@test.com",
            password="password123",
            isVerified=True,
            verification_level=2,
            KYCVerified=True,
        )
        self.worker_account = Accounts.objects.create_user(
            email="worker-early@test.com",
            password="password123",
            isVerified=True,
            verification_level=2,
            KYCVerified=True,
        )

        self.client_profile = Profile.objects.create(
            accountFK=self.client_account,
            profileType="CLIENT",
            firstName="Client",
            lastName="Early",
        )
        self.worker_profile = Profile.objects.create(
            accountFK=self.worker_account,
            profileType="WORKER",
            firstName="Worker",
            lastName="Early",
        )

        self.client_record = ClientProfile.objects.create(
            profileID=self.client_profile,
            description="",
            totalJobsPosted=0,
            clientRating=0,
            activeJobsCount=0,
        )
        self.worker_record = WorkerProfile.objects.create(profileID=self.worker_profile)
        self.specialization = Specializations.objects.create(
            specializationName="Electrical",
            minimumRate=Decimal("300.00"),
        )

    def test_early_complete_requires_client_confirmed_work_started(self):
        job = Job.objects.create(
            clientID=self.client_record,
            title="Project job",
            description="Project description",
            categoryID=self.specialization,
            budget=Decimal("1000.00"),
            location="Test",
            jobType="INVITE",
            status="IN_PROGRESS",
            payment_model="PROJECT",
            assignedWorkerID=self.worker_record,
            clientConfirmedWorkStarted=False,
        )

        blocked = early_complete_single_project_job(job.jobID, self.client_account)
        self.assertFalse(blocked.get("success"))
        self.assertIn("confirm worker arrival", blocked.get("error", ""))

        job.clientConfirmedWorkStarted = True
        job.save(update_fields=["clientConfirmedWorkStarted"])

        allowed = early_complete_single_project_job(job.jobID, self.client_account)
        self.assertTrue(allowed.get("success"), msg=allowed.get("error"))


class JobInviteAcceptResponseTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

        self.client_account = Accounts.objects.create_user(
            email="invite-client@test.com",
            password="password123",
            isVerified=True,
            verification_level=2,
            KYCVerified=True,
        )
        self.worker_account = Accounts.objects.create_user(
            email="invite-worker@test.com",
            password="password123",
            isVerified=True,
            verification_level=2,
            KYCVerified=True,
        )

        self.client_profile = Profile.objects.create(
            accountFK=self.client_account,
            profileType="CLIENT",
            firstName="Client",
            lastName="Invite",
        )
        self.worker_profile = Profile.objects.create(
            accountFK=self.worker_account,
            profileType="WORKER",
            firstName="Worker",
            lastName="Invite",
        )

        self.client_record = ClientProfile.objects.create(
            profileID=self.client_profile,
            description="",
            totalJobsPosted=0,
            clientRating=0,
            activeJobsCount=0,
        )
        self.worker_record = WorkerProfile.objects.create(profileID=self.worker_profile)
        self.specialization = Specializations.objects.create(
            specializationName="General Repair",
            minimumRate=Decimal("200.00"),
        )
        workerSpecialization.objects.create(
            workerID=self.worker_record,
            specializationID=self.specialization,
            experienceYears=1,
            certification="Basic",
        )

    def test_accept_invite_response_matches_persisted_in_progress_status(self):
        job = Job.objects.create(
            clientID=self.client_record,
            title="Invite job",
            description="desc",
            categoryID=self.specialization,
            budget=Decimal("1000.00"),
            location="Test",
            jobType="INVITE",
            inviteStatus="PENDING",
            escrowPaid=True,
            status="ACTIVE",
            assignedWorkerID=self.worker_record,
        )

        request = self.factory.post(f"/api/jobs/{job.jobID}/accept-invite")
        request.auth = self.worker_account

        result = accept_job_invite_worker(request, job.jobID)

        self.assertIsInstance(result, dict)
        self.assertTrue(result.get("success"))
        self.assertEqual(result.get("job_status"), "IN_PROGRESS")

        job.refresh_from_db()
        self.assertEqual(job.status, "IN_PROGRESS")


class AgencyHybridInviteCompatibilityTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

        self.client_account = Accounts.objects.create_user(
            email="agency-client@test.com",
            password="password123",
            isVerified=True,
            verification_level=2,
            KYCVerified=True,
        )
        self.agency_account = Accounts.objects.create_user(
            email="agency-owner@test.com",
            password="password123",
            isVerified=True,
            verification_level=2,
            KYCVerified=True,
        )

        self.client_profile = Profile.objects.create(
            accountFK=self.client_account,
            profileType="CLIENT",
            firstName="Client",
            lastName="Agency",
        )
        self.client_record = ClientProfile.objects.create(
            profileID=self.client_profile,
            description="",
            totalJobsPosted=0,
            clientRating=0,
            activeJobsCount=0,
        )

        self.agency = Agency.objects.create(
            accountFK=self.agency_account,
            businessName="Team Agency",
        )

        self.specialization = Specializations.objects.create(
            specializationName="Masonry",
            minimumRate=Decimal("400.00"),
        )

    def _create_direct_agency_team_job(self, invite_status="PENDING", status="ACTIVE"):
        return Job.objects.create(
            clientID=self.client_record,
            title="Direct agency team job",
            description="desc",
            categoryID=self.specialization,
            budget=Decimal("1000.00"),
            escrowAmount=Decimal("500.00"),
            escrowPaid=True,
            location="Test",
            jobType="INVITE",
            inviteStatus=invite_status,
            status=status,
            is_team_job=True,
            assignedAgencyFK=self.agency,
        )

    def test_get_agency_jobs_includes_direct_agency_team_invites(self):
        self._create_direct_agency_team_job(invite_status="PENDING", status="ACTIVE")

        result = get_agency_jobs(
            account_id=self.agency_account.accountID,
            status_filter="ACTIVE",
            invite_status_filter="PENDING",
        )

        self.assertEqual(len(result["jobs"]), 1)
        self.assertEqual(result["jobs"][0]["inviteStatus"], "PENDING")
        self.assertEqual(result["jobs"][0]["is_team_job"], True)

    def test_accept_job_invite_falls_back_for_team_job_without_slot_invites(self):
        job = self._create_direct_agency_team_job(invite_status="PENDING", status="ACTIVE")

        request = self.factory.post(f"/api/agency/jobs/{job.jobID}/accept")
        request.auth = self.agency_account

        result = accept_job_invite(request, job.jobID)

        self.assertIsInstance(result, dict)
        self.assertTrue(result.get("success"), msg=result)
        self.assertEqual(result.get("invite_status"), "ACCEPTED")

        job.refresh_from_db()
        self.assertEqual(job.inviteStatus, "ACCEPTED")

    def test_reject_job_invite_falls_back_for_team_job_without_slot_invites(self):
        job = self._create_direct_agency_team_job(invite_status="PENDING", status="ACTIVE")

        request = self.factory.post(f"/api/agency/jobs/{job.jobID}/reject")
        request.auth = self.agency_account

        result = reject_job_invite(request, job.jobID, reason="No capacity")

        self.assertIsInstance(result, dict)
        self.assertTrue(result.get("success"), msg=result)
        self.assertEqual(result.get("invite_status"), "REJECTED")

        job.refresh_from_db()
        self.assertEqual(job.inviteStatus, "REJECTED")
        self.assertEqual(job.status, "CANCELLED")

    def test_backfill_sets_missing_slot_invite_fields(self):
        job = self._create_direct_agency_team_job(invite_status="PENDING", status="ACTIVE")
        slot = JobSkillSlot.objects.create(
            jobID=job,
            specializationID=self.specialization,
            workers_needed=2,
            budget_allocated=Decimal("1000.00"),
            skill_level_required="ENTRY",
            status="OPEN",
        )

        call_command("backfill_agency_team_slot_invites", "--execute")

        slot.refresh_from_db()
        self.assertEqual(slot.invited_agency_id, self.agency.agencyId)
        self.assertEqual(slot.agency_invite_status, "PENDING")


class JobContentModerationTests(TestCase):
    def test_clean_content_has_no_violations(self):
        violations = validate_job_post_content(
            title="Need reliable electrician",
            description="Install two outlets and check breaker panel.",
            location="Tetuan, Zamboanga City",
        )
        self.assertEqual(violations, {})

    def test_profanity_in_title_detected_with_positions(self):
        violations = validate_job_post_content(
            title="Need f*ck electrician",
            description="Standard wiring",
            location="Tetuan",
        )
        self.assertIn("title", violations)
        self.assertTrue(len(violations["title"]["matches"]) > 0)

    def test_profanity_in_slot_notes_detected(self):
        violations = validate_job_post_content(
            title="Need helper",
            description="Painting work",
            location="Tetuan",
            skill_slots=[{"notes": "gago workers only"}],
        )
        self.assertIn("skill_slots[0].notes", violations)

    def test_admin_managed_term_is_used(self):
        ContentModerationTerm.objects.create(
            term="verybadword",
            normalizedTerm="verybadword",
            isActive=True,
        )
        text_moderation._cached_patterns = {}
        text_moderation._cached_terms_expiry = 0
        violations = validate_job_post_content(
            title="Need verybadword electrician",
            description="Safe description",
            location="Tetuan",
        )
        self.assertIn("title", violations)
