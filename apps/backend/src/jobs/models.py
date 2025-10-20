from django.db import models
from accounts.models import JobPosting, JobPostingPhoto

# Re-export models from accounts for backwards compatibility
# The actual models are defined in accounts.models to avoid migration issues
__all__ = ['JobPosting', 'JobPostingPhoto']

