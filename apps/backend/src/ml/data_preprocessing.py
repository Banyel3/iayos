"""
Data Preprocessing Module for Job Completion Time Prediction

This module handles:
1. Feature extraction from Job, WorkerProfile, and related models
2. Data normalization and encoding
3. Sequence preparation for LSTM model
4. Train/validation/test splitting
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timedelta
from decimal import Decimal
import logging

from django.db.models import Avg, Count, F, Q
from django.utils import timezone

logger = logging.getLogger(__name__)


class JobFeatureExtractor:
    """
    Extracts and preprocesses features from Job model for ML training/prediction.
    
    Features extracted:
    - Job characteristics (budget, urgency, materials count)
    - Category information (one-hot encoded)
    - Worker historical performance metrics
    - Temporal features (day of week, hour of day)
    """
    
    # Mapping for urgency levels to numeric values
    URGENCY_MAPPING = {
        'LOW': 0,
        'MEDIUM': 1,
        'HIGH': 2
    }
    
    # Maximum number of categories for one-hot encoding
    MAX_CATEGORIES = 30
    
    def __init__(self):
        self.category_encoder: Dict[int, int] = {}
        self.budget_mean: float = 0.0
        self.budget_std: float = 1.0
        self.is_fitted: bool = False
        
    def fit(self, jobs_queryset) -> 'JobFeatureExtractor':
        """
        Fit the feature extractor on training data.
        
        Args:
            jobs_queryset: Django queryset of completed Job objects
            
        Returns:
            self for method chaining
        """
        from accounts.models import Job, Specializations
        
        # Get all unique categories and create encoding
        categories = list(Specializations.objects.values_list('specializationID', flat=True))
        self.category_encoder = {cat_id: idx for idx, cat_id in enumerate(categories[:self.MAX_CATEGORIES])}
        
        # Calculate budget statistics for normalization
        budget_values = list(jobs_queryset.values_list('budget', flat=True))
        if budget_values:
            self.budget_mean = float(np.mean([float(b) for b in budget_values]))
            self.budget_std = float(np.std([float(b) for b in budget_values]))
            if self.budget_std == 0:
                self.budget_std = 1.0
        
        self.is_fitted = True
        logger.info(f"Feature extractor fitted with {len(self.category_encoder)} categories")
        return self
    
    def extract_job_features(self, job) -> np.ndarray:
        """
        Extract features from a single Job instance.
        
        Args:
            job: Job model instance
            
        Returns:
            numpy array of features
        """
        features = []
        
        # 1. Budget (normalized)
        budget_normalized = (float(job.budget) - self.budget_mean) / self.budget_std
        features.append(budget_normalized)
        
        # 2. Urgency level (encoded)
        urgency_value = self.URGENCY_MAPPING.get(job.urgency, 1)
        features.append(urgency_value)
        
        # 3. Materials count
        materials_count = len(job.materialsNeeded) if job.materialsNeeded else 0
        features.append(min(materials_count, 10))  # Cap at 10
        
        # 4. Job type (0 = LISTING, 1 = INVITE)
        job_type = 1 if job.jobType == 'INVITE' else 0
        features.append(job_type)
        
        # 5. Category (one-hot encoded)
        category_one_hot = [0] * self.MAX_CATEGORIES
        if job.categoryID_id and job.categoryID_id in self.category_encoder:
            category_one_hot[self.category_encoder[job.categoryID_id]] = 1
        features.extend(category_one_hot)
        
        # 6. Temporal features
        if job.createdAt:
            # Day of week (0-6, normalized to 0-1)
            features.append(job.createdAt.weekday() / 6.0)
            # Hour of day (0-23, normalized to 0-1)
            features.append(job.createdAt.hour / 23.0)
            # Month of year (1-12, normalized to 0-1)
            features.append((job.createdAt.month - 1) / 11.0)
        else:
            features.extend([0.5, 0.5, 0.5])  # Default middle values
        
        return np.array(features, dtype=np.float32)
    
    def extract_worker_history_features(self, worker_id: Optional[int]) -> np.ndarray:
        """
        Extract historical performance features for a worker.
        
        Args:
            worker_id: WorkerProfile primary key or None
            
        Returns:
            numpy array of worker history features
        """
        from accounts.models import Job, JobReview, WorkerProfile, workerSpecialization
        
        # Default features if no worker assigned
        if worker_id is None:
            return np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0], dtype=np.float32)
        
        try:
            worker = WorkerProfile.objects.get(pk=worker_id)
        except WorkerProfile.DoesNotExist:
            return np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0], dtype=np.float32)
        
        # 1. Number of completed jobs
        completed_jobs = Job.objects.filter(
            assignedWorkerID=worker,
            status='COMPLETED'
        )
        completed_count = completed_jobs.count()
        completed_normalized = min(completed_count / 100.0, 1.0)  # Normalize to 0-1
        
        # 2. Average rating
        avg_rating = JobReview.objects.filter(
            revieweeID=worker.profileID.accountFK,
            status='ACTIVE'
        ).aggregate(avg=Avg('rating'))['avg'] or 3.0
        rating_normalized = float(avg_rating) / 5.0  # Normalize to 0-1
        
        # 3. Total earnings (normalized)
        earnings = float(worker.totalEarningGross) if worker.totalEarningGross else 0.0
        earnings_normalized = min(earnings / 100000.0, 1.0)  # Normalize to 0-1, cap at 100k
        
        # 4. Number of specializations
        specializations_count = workerSpecialization.objects.filter(workerID=worker).count()
        specs_normalized = min(specializations_count / 10.0, 1.0)  # Normalize to 0-1
        
        # 5. Average experience years across specializations
        avg_experience = workerSpecialization.objects.filter(
            workerID=worker
        ).aggregate(avg=Avg('experienceYears'))['avg'] or 0.0
        experience_normalized = min(float(avg_experience) / 20.0, 1.0)  # Normalize to 0-1, cap at 20 years
        
        # 6. Profile completion percentage
        profile_completion = worker.profile_completion_percentage / 100.0 if worker.profile_completion_percentage else 0.0
        
        return np.array([
            completed_normalized,
            rating_normalized,
            earnings_normalized,
            specs_normalized,
            experience_normalized,
            profile_completion
        ], dtype=np.float32)
    
    def extract_all_features(self, job) -> np.ndarray:
        """
        Extract all features for a job (job features + worker history).
        
        Args:
            job: Job model instance
            
        Returns:
            numpy array of all features
        """
        job_features = self.extract_job_features(job)
        
        # Get worker ID if assigned
        worker_id = None
        if job.assignedWorkerID_id:
            worker_id = job.assignedWorkerID_id
        
        worker_features = self.extract_worker_history_features(worker_id)
        
        return np.concatenate([job_features, worker_features])
    
    def get_feature_dimension(self) -> int:
        """
        Get the total feature dimension.
        
        Returns:
            int: Total number of features per sample
        """
        # Job features: 1 (budget) + 1 (urgency) + 1 (materials) + 1 (job_type) + 30 (category) + 3 (temporal) = 37
        # Worker features: 6
        return 37 + 6  # 43 total


class CompletionTimeCalculator:
    """
    Calculates actual completion time from job timestamps.
    Used to create training labels.
    """
    
    @staticmethod
    def calculate_completion_hours(job) -> Optional[float]:
        """
        Calculate actual completion time in hours.
        
        Args:
            job: Job model instance (must be COMPLETED status)
            
        Returns:
            float: Completion time in hours, or None if cannot be calculated
        """
        if job.status != 'COMPLETED':
            return None
        
        # Use worker marked complete time as end point
        end_time = job.workerMarkedCompleteAt or job.completedAt
        
        # Use work started time or escrow paid time as start point
        start_time = job.clientConfirmedWorkStartedAt or job.escrowPaidAt
        
        if not start_time or not end_time:
            # Fallback: use created -> completed time
            if job.completedAt and job.createdAt:
                delta = job.completedAt - job.createdAt
                return max(delta.total_seconds() / 3600, 0.5)  # Minimum 0.5 hours
            return None
        
        delta = end_time - start_time
        hours = delta.total_seconds() / 3600
        
        # Sanity checks
        if hours < 0.5:
            hours = 0.5  # Minimum 30 minutes
        if hours > 720:  # 30 days
            hours = 720  # Cap at 30 days
            
        return hours


class DatasetBuilder:
    """
    Builds training, validation, and test datasets from completed jobs.
    """
    
    def __init__(self, feature_extractor: JobFeatureExtractor):
        self.feature_extractor = feature_extractor
        self.completion_calculator = CompletionTimeCalculator()
    
    def build_dataset(self, 
                      min_completed_jobs: int = 50,
                      test_ratio: float = 0.15,
                      val_ratio: float = 0.15,
                      force: bool = False) -> Dict[str, np.ndarray]:
        """
        Build train/val/test datasets from completed jobs.
        
        Args:
            min_completed_jobs: Minimum number of jobs required
            test_ratio: Fraction of data for testing
            val_ratio: Fraction of data for validation
            force: If True, bypass minimum samples check (for testing)
            
        Returns:
            Dictionary with 'X_train', 'y_train', 'X_val', 'y_val', 'X_test', 'y_test'
        """
        from accounts.models import Job
        
        # Get completed jobs with required timestamps
        completed_jobs = Job.objects.filter(
            status='COMPLETED'
        ).select_related(
            'categoryID',
            'assignedWorkerID',
            'assignedWorkerID__profileID'
        ).order_by('completedAt')
        
        # Extract features and labels
        X_list = []
        y_list = []
        
        for job in completed_jobs:
            # Calculate completion time
            completion_hours = self.completion_calculator.calculate_completion_hours(job)
            if completion_hours is None:
                continue
            
            # Extract features
            features = self.feature_extractor.extract_all_features(job)
            
            X_list.append(features)
            y_list.append(completion_hours)
        
        if len(X_list) < min_completed_jobs and not force:
            logger.warning(f"Only {len(X_list)} valid completed jobs found, need at least {min_completed_jobs}")
            return {}
        
        if len(X_list) < 3:
            logger.error(f"Need at least 3 samples for train/val/test split, found {len(X_list)}")
            return {}
        
        if force and len(X_list) < min_completed_jobs:
            logger.warning(f"Force building dataset with {len(X_list)} samples (recommended: {min_completed_jobs}+)")
        
        X = np.array(X_list)
        y = np.array(y_list)
        
        logger.info(f"Built dataset with {len(X)} samples, feature dim: {X.shape[1]}")
        
        # Split data (chronologically to avoid data leakage)
        n_samples = len(X)
        n_test = int(n_samples * test_ratio)
        n_val = int(n_samples * val_ratio)
        n_train = n_samples - n_test - n_val
        
        # Log transform the target (hours) for better distribution
        y_log = np.log1p(y)
        
        return {
            'X_train': X[:n_train],
            'y_train': y_log[:n_train],
            'X_val': X[n_train:n_train + n_val],
            'y_val': y_log[n_train:n_train + n_val],
            'X_test': X[n_train + n_val:],
            'y_test': y_log[n_train + n_val:],
            'y_train_original': y[:n_train],
            'y_val_original': y[n_train:n_train + n_val],
            'y_test_original': y[n_train + n_val:],
        }
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get dataset statistics for monitoring.
        
        Returns:
            Dictionary of statistics
        """
        from accounts.models import Job
        
        completed_count = Job.objects.filter(status='COMPLETED').count()
        active_count = Job.objects.filter(status='ACTIVE').count()
        in_progress_count = Job.objects.filter(status='IN_PROGRESS').count()
        
        # Get completion time statistics
        completion_times = []
        completed_jobs = Job.objects.filter(status='COMPLETED')[:1000]  # Sample
        
        for job in completed_jobs:
            hours = self.completion_calculator.calculate_completion_hours(job)
            if hours:
                completion_times.append(hours)
        
        stats = {
            'total_completed_jobs': completed_count,
            'total_active_jobs': active_count,
            'total_in_progress_jobs': in_progress_count,
            'valid_samples_in_sample': len(completion_times),
        }
        
        if completion_times:
            stats.update({
                'avg_completion_hours': np.mean(completion_times),
                'median_completion_hours': np.median(completion_times),
                'std_completion_hours': np.std(completion_times),
                'min_completion_hours': np.min(completion_times),
                'max_completion_hours': np.max(completion_times),
            })
        
        return stats
