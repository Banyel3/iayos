from datetime import date
from decimal import Decimal

from django.core.management import call_command
from django.test import TestCase

from accounts.models import (
    Accounts,
    Agency,
    BackjobScheduleConfirmation,
    ClientProfile,
    DailyAttendance,
    DailyJobExtension,
    DailyRateChange,
    DailySkipDayRequest,
    DisputeEvidence,
    Job,
    JobApplication,
    JobDispute,
    JobEmployeeAssignment,
    JobLog,
    JobMaterial,
    JobPhoto,
    JobReview,
    JobSkillSlot,
    JobWorkerAssignment,
    Notification,
    PriceNegotiation,
    Profile,
    ReviewSkillTag,
    SavedJob,
    Specializations,
    Transaction,
    Wallet,
    WorkerProfile,
    workerSpecialization,
)
from agency.models import AgencyEmployee
from profiles.models import Conversation, ConversationParticipant, Message, MessageAttachment


class WipeJobsCommandTests(TestCase):
    def setUp(self):
        self.client_account = Accounts.objects.create_user(
            email="wipe-client@test.com",
            password="password123",
            isVerified=True,
        )
        self.worker_account = Accounts.objects.create_user(
            email="wipe-worker@test.com",
            password="password123",
            isVerified=True,
        )
        self.agency_owner_account = Accounts.objects.create_user(
            email="wipe-agency@test.com",
            password="password123",
            isVerified=True,
        )

        self.client_profile = Profile.objects.create(
            accountFK=self.client_account,
            profileType="CLIENT",
            firstName="Client",
            lastName="Wipe",
        )
        self.worker_profile = Profile.objects.create(
            accountFK=self.worker_account,
            profileType="WORKER",
            firstName="Worker",
            lastName="Wipe",
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
            specializationName="Plumbing",
            minimumRate=Decimal("500.00"),
        )
        self.worker_skill = workerSpecialization.objects.create(
            workerID=self.worker_record,
            specializationID=self.specialization,
            experienceYears=2,
            certification="TESDA",
        )

        self.agency = Agency.objects.create(
            accountFK=self.agency_owner_account,
            businessName="Wipe Agency",
        )
        self.agency_employee = AgencyEmployee.objects.create(
            agency=self.agency_owner_account,
            firstName="Agency",
            lastName="Worker",
            name="Agency Worker",
            email="employee@test.com",
        )

        self.client_wallet = Wallet.objects.create(
            accountFK=self.client_account,
            balance=Decimal("1234.56"),
            reservedBalance=Decimal("200.00"),
            pendingEarnings=Decimal("100.00"),
            autoWithdrawEnabled=True,
        )

    def _create_job_graph(self):
        job = Job.objects.create(
            clientID=self.client_record,
            title="Wipe test job",
            description="Delete this job graph",
            categoryID=self.specialization,
            budget=Decimal("1000.00"),
            location="Zamboanga",
            assignedWorkerID=self.worker_record,
            assignedAgencyFK=self.agency,
            status=Job.JobStatus.IN_PROGRESS,
            clientConfirmedWorkStarted=True,
        )

        JobPhoto.objects.create(jobID=job, photoURL="https://example.com/job.jpg")
        JobLog.objects.create(
            jobID=job,
            oldStatus=Job.JobStatus.ACTIVE,
            newStatus=Job.JobStatus.IN_PROGRESS,
        )

        application = JobApplication.objects.create(
            jobID=job,
            workerID=self.worker_record,
            proposalMessage="I can do this",
            proposedBudget=Decimal("950.00"),
            budgetOption=JobApplication.BudgetOption.NEGOTIATE,
        )
        SavedJob.objects.create(jobID=job, workerID=self.worker_record)
        PriceNegotiation.objects.create(
            application=application,
            actor=PriceNegotiation.Actor.WORKER,
            round_number=1,
            proposed_budget=Decimal("900.00"),
            status=PriceNegotiation.NegotiationStatus.PENDING,
        )

        slot = JobSkillSlot.objects.create(
            jobID=job,
            specializationID=self.specialization,
            workers_needed=1,
            budget_allocated=Decimal("1000.00"),
        )
        assignment = JobWorkerAssignment.objects.create(
            jobID=job,
            skillSlotID=slot,
            workerID=self.worker_record,
            assignment_status=JobWorkerAssignment.AssignmentStatus.ACTIVE,
        )
        JobEmployeeAssignment.objects.create(
            job=job,
            employee=self.agency_employee,
            status=JobEmployeeAssignment.AssignmentStatus.ASSIGNED,
            skill_slot=slot,
        )

        DailyAttendance.objects.create(
            jobID=job,
            workerID=self.worker_record,
            assignmentID=assignment,
            date=date.today(),
            status=DailyAttendance.AttendanceStatus.PRESENT,
        )
        DailyJobExtension.objects.create(
            jobID=job,
            additional_days=1,
            additional_escrow=Decimal("200.00"),
            reason="Need one more day",
            requested_by=DailyJobExtension.RequestedBy.CLIENT,
            requestedByUser=self.client_account,
        )
        DailyRateChange.objects.create(
            jobID=job,
            old_rate=Decimal("500.00"),
            new_rate=Decimal("550.00"),
            reason="Scope changed",
            effective_date=date.today(),
            requested_by=DailyRateChange.RequestedBy.CLIENT,
            requestedByUser=self.client_account,
        )
        DailySkipDayRequest.objects.create(
            jobID=job,
            request_date=date.today(),
            requestedByUser=self.worker_account,
        )

        dispute = JobDispute.objects.create(
            jobID=job,
            disputedBy=JobDispute.DisputedBy.CLIENT,
            reason="Issue",
            description="Test dispute",
            jobAmount=Decimal("1000.00"),
            disputedAmount=Decimal("300.00"),
        )
        DisputeEvidence.objects.create(
            disputeID=dispute,
            imageURL="https://example.com/evidence.jpg",
            uploadedBy=self.client_account,
        )
        BackjobScheduleConfirmation.objects.create(
            disputeID=dispute,
            assignmentID=assignment,
            confirmedBy=self.client_account,
        )

        review = JobReview.objects.create(
            jobID=job,
            reviewerID=self.client_account,
            revieweeID=self.worker_account,
            reviewerType=JobReview.ReviewerType.CLIENT,
            rating=Decimal("4.50"),
            comment="Good work",
        )
        ReviewSkillTag.objects.create(
            reviewID=review,
            workerSpecializationID=self.worker_skill,
        )
        JobMaterial.objects.create(
            jobID=job,
            name="Pipe",
            source=JobMaterial.SourceType.TO_PURCHASE,
        )

        conversation = Conversation.objects.create(
            client=self.client_profile,
            worker=self.worker_profile,
            relatedJobPosting=job,
        )
        ConversationParticipant.objects.create(
            conversation=conversation,
            profile=self.client_profile,
            participant_type=ConversationParticipant.ParticipantType.CLIENT,
        )
        msg = Message.objects.create(
            conversationID=conversation,
            sender=self.client_profile,
            messageText="hello",
        )
        MessageAttachment.objects.create(
            messageID=msg,
            fileURL="https://example.com/file.jpg",
        )

        Transaction.objects.create(
            walletID=self.client_wallet,
            transactionType=Transaction.TransactionType.PAYMENT,
            amount=Decimal("500.00"),
            balanceAfter=Decimal("734.56"),
            status=Transaction.TransactionStatus.COMPLETED,
            relatedJobPosting=job,
            referenceNumber=f"ESCROW-{job.jobID}-20260101010101",
        )
        Transaction.objects.create(
            walletID=self.client_wallet,
            transactionType=Transaction.TransactionType.FEE,
            amount=Decimal("50.00"),
            balanceAfter=Decimal("684.56"),
            status=Transaction.TransactionStatus.COMPLETED,
            relatedJobPosting=None,
            referenceNumber=f"JOB-{job.jobID}-FINAL-WALLET-20260101010101",
        )
        Transaction.objects.create(
            walletID=self.client_wallet,
            transactionType=Transaction.TransactionType.DEPOSIT,
            amount=Decimal("100.00"),
            balanceAfter=Decimal("784.56"),
            status=Transaction.TransactionStatus.COMPLETED,
            relatedJobPosting=None,
            referenceNumber="DEPOSIT-KEEP-001",
        )
        Transaction.objects.create(
            walletID=self.client_wallet,
            transactionType=Transaction.TransactionType.EARNING,
            amount=Decimal("25.00"),
            balanceAfter=Decimal("809.56"),
            status=Transaction.TransactionStatus.COMPLETED,
            relatedJobPosting=None,
            referenceNumber=f"DAILY-AUTO-REL-{job.jobID}",
        )
        Transaction.objects.create(
            walletID=self.client_wallet,
            transactionType=Transaction.TransactionType.EARNING,
            amount=Decimal("30.00"),
            balanceAfter=Decimal("839.56"),
            status=Transaction.TransactionStatus.COMPLETED,
            relatedJobPosting=None,
            referenceNumber=f"BACKFILL-JOB-{job.jobID}-RELEASED-COMPAT",
        )

        Notification.objects.create(
            accountFK=self.client_account,
            notificationType=Notification.NotificationType.JOB_UPDATED,
            title="Job updated",
            message="Job update notification tied to job",
            relatedJobID=job.jobID,
        )
        Notification.objects.create(
            accountFK=self.client_account,
            notificationType=Notification.NotificationType.SYSTEM,
            title="Keep me",
            message="Unrelated notification should remain",
            relatedJobID=999999,
        )

        return job

    def test_wipe_jobs_removes_full_job_graph_and_job_origin_transactions(self):
        job = self._create_job_graph()

        call_command("wipe_jobs")

        self.assertEqual(Job.objects.count(), 0)
        self.assertEqual(JobPhoto.objects.count(), 0)
        self.assertEqual(JobLog.objects.count(), 0)
        self.assertEqual(JobApplication.objects.count(), 0)
        self.assertEqual(SavedJob.objects.count(), 0)
        self.assertEqual(PriceNegotiation.objects.count(), 0)
        self.assertEqual(JobSkillSlot.objects.count(), 0)
        self.assertEqual(JobWorkerAssignment.objects.count(), 0)
        self.assertEqual(JobEmployeeAssignment.objects.count(), 0)
        self.assertEqual(DailyAttendance.objects.count(), 0)
        self.assertEqual(DailyJobExtension.objects.count(), 0)
        self.assertEqual(DailyRateChange.objects.count(), 0)
        self.assertEqual(DailySkipDayRequest.objects.count(), 0)
        self.assertEqual(JobDispute.objects.count(), 0)
        self.assertEqual(DisputeEvidence.objects.count(), 0)
        self.assertEqual(BackjobScheduleConfirmation.objects.count(), 0)
        self.assertEqual(JobReview.objects.count(), 0)
        self.assertEqual(ReviewSkillTag.objects.count(), 0)
        self.assertEqual(JobMaterial.objects.count(), 0)
        self.assertEqual(Conversation.objects.count(), 0)
        self.assertEqual(ConversationParticipant.objects.count(), 0)
        self.assertEqual(Message.objects.count(), 0)
        self.assertEqual(MessageAttachment.objects.count(), 0)

        self.assertFalse(
            Transaction.objects.filter(referenceNumber__startswith="ESCROW-").exists()
        )
        self.assertFalse(
            Transaction.objects.filter(referenceNumber__startswith="JOB-").exists()
        )
        self.assertFalse(
            Transaction.objects.filter(
                referenceNumber__startswith="DAILY-AUTO-REL-"
            ).exists()
        )
        self.assertFalse(
            Transaction.objects.filter(referenceNumber__startswith="BACKFILL-JOB-").exists()
        )
        self.assertTrue(
            Transaction.objects.filter(referenceNumber="DEPOSIT-KEEP-001").exists()
        )

        self.assertFalse(Notification.objects.filter(relatedJobID=job.jobID).exists())
        self.assertTrue(Notification.objects.filter(relatedJobID=999999).exists())

        self.client_wallet.refresh_from_db()
        self.assertEqual(self.client_wallet.balance, Decimal("0.00"))
        self.assertEqual(self.client_wallet.reservedBalance, Decimal("0.00"))
        self.assertEqual(self.client_wallet.pendingEarnings, Decimal("0.00"))
        self.assertFalse(self.client_wallet.autoWithdrawEnabled)
        self.assertIsNone(self.client_wallet.preferredPaymentMethodID)
        self.assertIsNone(self.client_wallet.lastAutoWithdrawAt)
