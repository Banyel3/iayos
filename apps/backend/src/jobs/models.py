from django.db import models
from accounts.models import Job, JobPhoto

# Re-export models from accounts for backwards compatibility
# The actual models are defined in accounts.models to avoid migration issues
# Alias Job as JobPosting for legacy code compatibility
JobPosting = Job
JobPostingPhoto = JobPhoto

__all__ = ['JobPosting', 'JobPostingPhoto', 'Job', 'JobPhoto']

