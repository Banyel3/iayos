"""Profile metrics helpers for dashboard/profile screens."""
from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

from django.utils import timezone

from django.db.models import Avg as _Avg

from .models import (
    Accounts,
    Job,
    JobApplication,
    JobReview,
    JobWorkerAssignment,
    Profile,
    Transaction,
    Wallet,
)


def _get_payment_status(wallet: Optional[Wallet]) -> Tuple[bool, Optional[str]]:
    """Return whether the user has a verified payment method and the timestamp."""
    if not wallet:
        return False, None

    latest_verified = (
        Transaction.objects.filter(
            walletID=wallet,
            transactionType=Transaction.TransactionType.DEPOSIT,
            status=Transaction.TransactionStatus.COMPLETED,
        )
        .order_by("-completedAt", "-createdAt")
        .first()
    )
    if not latest_verified:
        return False, None

    timestamp = latest_verified.completedAt or latest_verified.createdAt
    return True, timestamp.isoformat() if timestamp else None


def _get_client_response_rate(profile: Profile) -> Tuple[float, int]:
    """Calculate response rate for client job applications."""
    client_profile = getattr(profile, "clientprofile", None)
    if client_profile is None:
        return 0.0, 0
    total_apps = JobApplication.objects.filter(jobID__clientID=client_profile).count()
    if total_apps == 0:
        return 0.0, 0

    responded = JobApplication.objects.filter(jobID__clientID=client_profile).exclude(
        status=JobApplication.ApplicationStatus.PENDING
    ).count()
    rate = round((responded / total_apps) * 100, 1)
    return rate, total_apps


def _get_worker_response_rate(profile: Profile) -> Tuple[float, int]:
    """Calculate response rate for worker job applications."""
    worker_profile = getattr(profile, "workerprofile", None)
    if worker_profile is None:
        return 0.0, 0

    total_apps = JobApplication.objects.filter(workerID=worker_profile).count()
    if total_apps == 0:
        return 0.0, 0

    responded = JobApplication.objects.filter(workerID=worker_profile).exclude(
        status=JobApplication.ApplicationStatus.PENDING
    ).count()
    rate = round((responded / total_apps) * 100, 1)
    return rate, total_apps


def _get_jobs_completed(profile: Optional[Profile]) -> int:
    """Count completed jobs for the active profile."""
    if not profile:
        return 0

    if profile.profileType == "CLIENT":
        client_profile = getattr(profile, "clientprofile", None)
        if client_profile is None:
            return 0
        return Job.objects.filter(
            clientID=client_profile,
            status=Job.JobStatus.COMPLETED,
        ).count()

    if profile.profileType == "WORKER":
        worker_profile = getattr(profile, "workerprofile", None)
        if worker_profile is None:
            return 0

        direct_completed = Job.objects.filter(
            assignedWorkerID=worker_profile,
            status=Job.JobStatus.COMPLETED,
        ).count()

        team_completed = JobWorkerAssignment.objects.filter(
            workerID=worker_profile,
            jobID__status=Job.JobStatus.COMPLETED,
            assignment_status__in=[
                JobWorkerAssignment.AssignmentStatus.ACTIVE,
                JobWorkerAssignment.AssignmentStatus.COMPLETED,
            ],
        ).values("jobID").distinct().count()

        return direct_completed + team_completed

    return 0


def get_profile_metrics(account: Accounts) -> Dict[str, Any]:
    """Aggregate trust & performance metrics for the authenticated account."""
    profile_type = getattr(account, "profile_type", None)

    profile_qs = Profile.objects.select_related("clientprofile", "workerprofile").filter(
        accountFK=account
    )
    if profile_type in ("WORKER", "CLIENT"):
        profile = profile_qs.filter(profileType=profile_type).first()
    else:
        profile = profile_qs.order_by("-profileID").first()

    wallet = getattr(account, "wallet", None)
    payment_verified, payment_verified_at = _get_payment_status(wallet)

    response_rate = None
    response_sample = 0
    if profile and profile.profileType == "CLIENT" and hasattr(profile, "clientprofile"):
        response_rate, response_sample = _get_client_response_rate(profile)
    elif profile and profile.profileType == "WORKER" and hasattr(profile, "workerprofile"):
        response_rate, response_sample = _get_worker_response_rate(profile)

    rating_value = 0.0
    rating_count = 0
    rating_breakdown: Optional[Dict[str, int]] = None
    try:
        # Scope rating to the currently active profile (WORKER or CLIENT)
        # so dual-profile users don't mix role-specific review scores.
        target_profile = None
        if profile and profile.profileType in ("WORKER", "CLIENT"):
            target_profile = profile
        elif profile_type in ("WORKER", "CLIENT"):
            target_profile = Profile.objects.filter(
                accountFK=account,
                profileType=profile_type,
            ).first()

        if target_profile:
            scoped_reviews = JobReview.objects.filter(
                revieweeProfileID=target_profile,
                status='ACTIVE'
            )
            if not scoped_reviews.exists():
                legacy_reviewer_type = 'CLIENT' if target_profile.profileType == 'WORKER' else 'WORKER'
                scoped_reviews = JobReview.objects.filter(
                    revieweeID=account,
                    reviewerType=legacy_reviewer_type,
                    status='ACTIVE',
                )
            avg = scoped_reviews.aggregate(avg=_Avg('rating'))['avg']
            rating_value = round(float(avg or 0), 1)
            rating_count = scoped_reviews.count()
    except Exception:
        # Lack of reviews shouldn't break the endpoint
        rating_value = 0.0
        rating_count = 0
        rating_breakdown = None

    return {
        "profile_type": profile.profileType if profile else None,
        "payment_method_verified": payment_verified,
        "payment_method_verified_at": payment_verified_at,
        "response_rate": response_rate,
        "response_rate_sample": response_sample,
        "rating": rating_value,
        "total_reviews": rating_count,
        "rating_breakdown": rating_breakdown,
        "jobs_completed": _get_jobs_completed(profile),
        "generated_at": timezone.now().isoformat(),
    }
