"""
Feature Engineering for Worker Profile Rating Model

This module handles:
1. Feature extraction from worker profiles, experience, certifications, and performance
2. CSV data loading and preprocessing (global_freelancers_raw.csv)
3. Database worker feature extraction
4. Country and skill one-hot encoding
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from decimal import Decimal
import logging
import re

logger = logging.getLogger(__name__)


# Top countries for one-hot encoding (based on dataset)
TOP_COUNTRIES = [
    'United States', 'India', 'United Kingdom', 'Germany', 'Australia',
    'Canada', 'France', 'Brazil', 'South Korea', 'Japan',
    'Italy', 'Spain', 'Russia', 'China', 'Indonesia',
    'Netherlands', 'Argentina', 'Mexico', 'Turkey', 'Egypt'
]

# Primary skills for one-hot encoding
SKILL_CATEGORIES = [
    'Web Development', 'Mobile Apps', 'AI', 'Machine Learning',
    'Data Analysis', 'UI/UX Design', 'Graphic Design', 'DevOps',
    'Blockchain Development', 'Cybersecurity', 'Other'
]


class WorkerRatingFeatureExtractor:
    """
    Extracts and preprocesses features for worker profile rating prediction.
    
    Features extracted (25 total):
    - Profile features: profile_completion, bio_length, has_avatar
    - Experience: years_of_experience, specializations_count
    - Credentials: certifications_count, verified_certs_ratio
    - Performance: completed_jobs, avg_rating, total_earnings_normalized
    - Activity: is_active
    - Demographics: country_one_hot (20), skill_one_hot (11)
    """
    
    MAX_COUNTRIES = 20
    MAX_SKILLS = 11
    
    def __init__(self):
        self.country_encoder: Dict[str, int] = {}
        self.skill_encoder: Dict[str, int] = {}
        self.is_fitted: bool = False
        self.feature_names: List[str] = []
        
    def fit(self, df: pd.DataFrame = None) -> 'WorkerRatingFeatureExtractor':
        """
        Fit the feature extractor on training data.
        
        Args:
            df: Pandas DataFrame from CSV
            
        Returns:
            self for method chaining
        """
        # Build country encoding
        self.country_encoder = {country: idx for idx, country in enumerate(TOP_COUNTRIES)}
        logger.info(f"Encoded {len(self.country_encoder)} countries")
        
        # Build skill encoding
        self.skill_encoder = {skill: idx for idx, skill in enumerate(SKILL_CATEGORIES)}
        logger.info(f"Encoded {len(self.skill_encoder)} skill categories")
        
        self.is_fitted = True
        self._build_feature_names()
        return self
    
    def _build_feature_names(self):
        """Build list of feature names for interpretability."""
        self.feature_names = [
            # Profile features (3)
            'profile_completion',
            'bio_length_normalized',
            'has_hourly_rate',
            # Experience features (2)
            'years_of_experience_normalized',
            'specializations_count_normalized',
            # Credentials (2)
            'certifications_count_normalized',
            'verified_certs_ratio',
            # Performance (4)
            'completed_jobs_normalized',
            'avg_rating_normalized',
            'total_earnings_normalized',
            'client_satisfaction_normalized',
            # Activity (1)
            'is_active',
        ]
        
        # Add country one-hot features
        for country in TOP_COUNTRIES:
            self.feature_names.append(f'country_{country.lower().replace(" ", "_")}')
        
        # Add skill one-hot features
        for skill in SKILL_CATEGORIES:
            self.feature_names.append(f'skill_{skill.lower().replace(" ", "_").replace("/", "_")}')
    
    def _parse_hourly_rate(self, rate_str: Any) -> float:
        """
        Parse hourly rate from various formats.
        
        Args:
            rate_str: Rate string like "100", "$40", "USD 75", or float
            
        Returns:
            Float value of hourly rate in USD
        """
        if pd.isna(rate_str) or rate_str == '' or rate_str is None:
            return 0.0
        
        if isinstance(rate_str, (int, float)):
            return float(rate_str)
        
        # Remove currency symbols and prefixes
        rate_str = str(rate_str).strip()
        rate_str = rate_str.replace('$', '').replace('USD', '').strip()
        
        try:
            return float(rate_str)
        except ValueError:
            return 0.0
    
    def _parse_is_active(self, active_str: Any) -> float:
        """
        Parse is_active from various formats.
        
        Args:
            active_str: Various formats: 0, 1, "yes", "no", "True", "False", "Y", "N"
            
        Returns:
            Float 1.0 (active) or 0.0 (inactive)
        """
        if pd.isna(active_str) or active_str == '' or active_str is None:
            return 0.5  # Unknown defaults to middle
        
        active_str = str(active_str).lower().strip()
        
        if active_str in ['1', 'true', 'yes', 'y']:
            return 1.0
        elif active_str in ['0', 'false', 'no', 'n']:
            return 0.0
        else:
            return 0.5  # Unknown
    
    def _parse_client_satisfaction(self, satisfaction_str: Any) -> float:
        """
        Parse client satisfaction from various formats.
        
        Args:
            satisfaction_str: Formats like "84%", "92", ""
            
        Returns:
            Float value normalized to 0-1
        """
        if pd.isna(satisfaction_str) or satisfaction_str == '' or satisfaction_str is None:
            return 0.5  # Unknown defaults to middle
        
        satisfaction_str = str(satisfaction_str).strip().replace('%', '')
        
        try:
            value = float(satisfaction_str)
            # Normalize to 0-1
            if value > 1:
                value = value / 100.0
            return min(max(value, 0.0), 1.0)
        except ValueError:
            return 0.5
    
    def extract_country_features(self, country: str) -> np.ndarray:
        """
        Extract one-hot encoded country features.
        
        Args:
            country: Country name
            
        Returns:
            numpy array of country one-hot encoding
        """
        country_one_hot = [0.0] * self.MAX_COUNTRIES
        
        if country and country in self.country_encoder:
            country_one_hot[self.country_encoder[country]] = 1.0
        
        return np.array(country_one_hot, dtype=np.float32)
    
    def extract_skill_features(self, skill: str) -> np.ndarray:
        """
        Extract one-hot encoded skill features.
        
        Args:
            skill: Primary skill name
            
        Returns:
            numpy array of skill one-hot encoding
        """
        skill_one_hot = [0.0] * self.MAX_SKILLS
        
        if skill:
            skill = skill.strip()
            if skill in self.skill_encoder:
                skill_one_hot[self.skill_encoder[skill]] = 1.0
            else:
                # Map to "Other"
                skill_one_hot[self.skill_encoder.get('Other', 10)] = 1.0
        
        return np.array(skill_one_hot, dtype=np.float32)
    
    def extract_features_from_csv_row(self, row: pd.Series) -> np.ndarray:
        """
        Extract all features from a CSV row.
        
        Args:
            row: Pandas Series representing one freelancer
            
        Returns:
            numpy array of all features
        """
        features = []
        
        # Profile features (3)
        # Profile completion: estimate from filled fields
        filled_fields = sum([
            1 if not pd.isna(row.get('name')) else 0,
            1 if not pd.isna(row.get('age')) else 0,
            1 if not pd.isna(row.get('country')) else 0,
            1 if not pd.isna(row.get('primary_skill')) else 0,
            1 if not pd.isna(row.get('years_of_experience')) else 0,
            1 if self._parse_hourly_rate(row.get('hourly_rate (USD)')) > 0 else 0,
        ])
        profile_completion = filled_fields / 6.0
        features.append(profile_completion)
        
        # Bio length: estimate from name complexity (CSV doesn't have bio)
        name = str(row.get('name', '')) if not pd.isna(row.get('name')) else ''
        bio_length_normalized = min(len(name) / 50.0, 1.0)
        features.append(bio_length_normalized)
        
        # Has hourly rate
        hourly_rate = self._parse_hourly_rate(row.get('hourly_rate (USD)'))
        has_hourly_rate = 1.0 if hourly_rate > 0 else 0.0
        features.append(has_hourly_rate)
        
        # Experience features (2)
        years_exp = row.get('years_of_experience', 0)
        years_exp = float(years_exp) if not pd.isna(years_exp) else 0.0
        years_exp_normalized = min(years_exp / 40.0, 1.0)  # Cap at 40 years
        features.append(years_exp_normalized)
        
        # Specializations: estimate as 1 for CSV (only primary_skill available)
        specs_count_normalized = 1.0 / 10.0  # Assume 1 specialization
        features.append(specs_count_normalized)
        
        # Credentials (2)
        # CSV doesn't have certifications, estimate from experience
        certs_estimate = min(years_exp / 10.0, 5) / 5.0  # More experience = more likely certs
        features.append(certs_estimate)
        
        # Verified certs ratio: estimate based on rating
        rating = row.get('rating', 0)
        rating = float(rating) if not pd.isna(rating) else 0.0
        verified_ratio = min(rating / 5.0, 1.0) * 0.5  # Higher rating = more likely verified
        features.append(verified_ratio)
        
        # Performance (4)
        # Completed jobs: estimate from experience
        completed_jobs_estimate = min(years_exp * 5, 100) / 100.0  # ~5 jobs per year
        features.append(completed_jobs_estimate)
        
        # Average rating
        avg_rating_normalized = rating / 5.0 if rating > 0 else 0.5
        features.append(avg_rating_normalized)
        
        # Total earnings: estimate from rate * experience
        earnings_estimate = hourly_rate * years_exp * 100  # Rough estimate
        earnings_normalized = min(earnings_estimate / 100000.0, 1.0)
        features.append(earnings_normalized)
        
        # Client satisfaction
        client_sat = self._parse_client_satisfaction(row.get('client_satisfaction'))
        features.append(client_sat)
        
        # Activity (1)
        is_active = self._parse_is_active(row.get('is_active'))
        features.append(is_active)
        
        # Demographics
        country = str(row.get('country', '')) if not pd.isna(row.get('country')) else ''
        country_features = self.extract_country_features(country)
        features.extend(country_features)
        
        skill = str(row.get('primary_skill', '')) if not pd.isna(row.get('primary_skill')) else ''
        skill_features = self.extract_skill_features(skill)
        features.extend(skill_features)
        
        return np.array(features, dtype=np.float32)
    
    def extract_features_from_worker(self, worker) -> np.ndarray:
        """
        Extract all features from a Django WorkerProfile instance.
        
        Args:
            worker: WorkerProfile model instance
            
        Returns:
            numpy array of all features
        """
        from accounts.models import Job, JobReview, workerSpecialization, WorkerCertification
        from profiles.models import WorkerPortfolio
        
        features = []
        
        # Profile features (3)
        profile_completion = (worker.profile_completion_percentage or 0) / 100.0
        features.append(profile_completion)
        
        bio = worker.bio or ''
        bio_length_normalized = min(len(bio) / 500.0, 1.0)
        features.append(bio_length_normalized)
        
        hourly_rate = float(worker.hourly_rate) if worker.hourly_rate else 0.0
        has_hourly_rate = 1.0 if hourly_rate > 0 else 0.0
        features.append(has_hourly_rate)
        
        # Experience features (2)
        # Get average experience from specializations
        specs = workerSpecialization.objects.filter(workerID=worker)
        specs_count = specs.count()
        avg_experience = 0.0
        if specs_count > 0:
            total_exp = sum(s.experienceYears or 0 for s in specs)
            avg_experience = total_exp / specs_count
        
        years_exp_normalized = min(avg_experience / 40.0, 1.0)
        features.append(years_exp_normalized)
        
        specs_count_normalized = min(specs_count / 10.0, 1.0)
        features.append(specs_count_normalized)
        
        # Credentials (2)
        certs = WorkerCertification.objects.filter(workerID=worker)
        certs_count = certs.count()
        certs_count_normalized = min(certs_count / 10.0, 1.0)
        features.append(certs_count_normalized)
        
        verified_certs = certs.filter(is_verified=True).count()
        verified_ratio = verified_certs / certs_count if certs_count > 0 else 0.0
        features.append(verified_ratio)
        
        # Performance (4)
        completed_jobs = Job.objects.filter(
            assignedWorkerID=worker,
            status='COMPLETED'
        ).count()
        completed_jobs_normalized = min(completed_jobs / 100.0, 1.0)
        features.append(completed_jobs_normalized)
        
        # Average rating from reviews
        reviews = JobReview.objects.filter(
            revieweeID=worker.profileID.accountFK,
            status='ACTIVE'
        )
        avg_rating = 0.0
        if reviews.exists():
            avg_rating = float(reviews.aggregate(avg=models.Avg('rating'))['avg'] or 0)
        avg_rating_normalized = avg_rating / 5.0 if avg_rating > 0 else 0.5
        features.append(avg_rating_normalized)
        
        # Total earnings
        total_earnings = float(worker.totalEarningGross) if worker.totalEarningGross else 0.0
        earnings_normalized = min(total_earnings / 500000.0, 1.0)  # PHP scale
        features.append(earnings_normalized)
        
        # Client satisfaction: estimate from rating
        client_sat = avg_rating / 5.0 if avg_rating > 0 else 0.5
        features.append(client_sat)
        
        # Activity (1)
        is_active = 1.0 if worker.availabilityStatus == 'AVAILABLE' else 0.5
        features.append(is_active)
        
        # Demographics (use "Other" for both since we don't have country/skill mapping)
        country_features = np.zeros(self.MAX_COUNTRIES, dtype=np.float32)
        features.extend(country_features)
        
        # Try to get primary skill from first specialization
        skill_features = np.zeros(self.MAX_SKILLS, dtype=np.float32)
        if specs.exists():
            first_spec = specs.first()
            if first_spec and first_spec.specializationID:
                spec_name = first_spec.specializationID.specializationName
                # Map to closest category
                for skill_cat in SKILL_CATEGORIES:
                    if skill_cat.lower() in spec_name.lower():
                        skill_features[self.skill_encoder[skill_cat]] = 1.0
                        break
                else:
                    skill_features[self.skill_encoder['Other']] = 1.0
        features.extend(skill_features)
        
        return np.array(features, dtype=np.float32)
    
    def get_feature_dim(self) -> int:
        """Get the total number of features."""
        # 3 profile + 2 experience + 2 credentials + 4 performance + 1 activity + 20 countries + 11 skills
        return 3 + 2 + 2 + 4 + 1 + self.MAX_COUNTRIES + self.MAX_SKILLS


class WorkerRatingDatasetBuilder:
    """
    Builds training dataset from CSV and/or Django models.
    """
    
    def __init__(self, feature_extractor: WorkerRatingFeatureExtractor):
        self.feature_extractor = feature_extractor
        
    def _calculate_target_score(self, row: pd.Series) -> Optional[float]:
        """
        Calculate target profile score from rating and client satisfaction.
        
        Formula: score = (rating/5 * 0.5) + (client_satisfaction * 0.5) scaled to 0-100
        
        Args:
            row: Pandas Series with 'rating' and 'client_satisfaction'
            
        Returns:
            Profile score 0-100, or None if insufficient data
        """
        rating = row.get('rating')
        satisfaction = row.get('client_satisfaction')
        
        # Need at least one metric
        has_rating = not pd.isna(rating) and rating != '' and float(rating) > 0
        
        if not has_rating:
            return None
        
        # Normalize rating to 0-1
        rating_score = float(rating) / 5.0 if has_rating else 0.5
        
        # Parse satisfaction
        sat_str = satisfaction
        if pd.isna(sat_str) or sat_str == '' or sat_str is None:
            sat_score = rating_score  # Use rating as proxy
        else:
            sat_str = str(sat_str).strip().replace('%', '')
            try:
                sat_score = float(sat_str) / 100.0 if float(sat_str) > 1 else float(sat_str)
            except ValueError:
                sat_score = rating_score
        
        # Weighted average: 50% rating, 50% satisfaction
        final_score = (rating_score * 0.5 + sat_score * 0.5) * 100.0
        
        return min(max(final_score, 0.0), 100.0)
    
    def load_csv_data(self, csv_path: str) -> Tuple[np.ndarray, np.ndarray]:
        """
        Load and process data from freelancer CSV.
        
        Args:
            csv_path: Path to global_freelancers_raw.csv
            
        Returns:
            Tuple of (features, targets) numpy arrays
        """
        logger.info(f"Loading CSV data from {csv_path}")
        df = pd.read_csv(csv_path)
        
        logger.info(f"Loaded {len(df)} rows from CSV")
        
        features_list = []
        targets_list = []
        skipped = 0
        
        for idx, row in df.iterrows():
            try:
                # Calculate target score
                target = self._calculate_target_score(row)
                
                if target is None:
                    skipped += 1
                    continue
                
                # Extract features
                features = self.feature_extractor.extract_features_from_csv_row(row)
                
                features_list.append(features)
                targets_list.append(target)
                
            except Exception as e:
                skipped += 1
                continue
        
        logger.info(f"Processed {len(features_list)} valid samples from CSV (skipped {skipped})")
        
        if len(features_list) == 0:
            return np.array([]), np.array([])
            
        return np.array(features_list), np.array(targets_list)
    
    def load_db_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """
        Load data from Django WorkerProfile model.
        
        Returns:
            Tuple of (features, targets) numpy arrays
        """
        from accounts.models import WorkerProfile, JobReview
        from django.db import models
        
        workers = WorkerProfile.objects.all().select_related('profileID')
        
        features_list = []
        targets_list = []
        
        for worker in workers:
            try:
                # Get average rating for this worker
                reviews = JobReview.objects.filter(
                    revieweeID=worker.profileID.accountFK,
                    status='ACTIVE'
                )
                
                if not reviews.exists():
                    continue  # Need at least one review for target
                
                avg_rating = float(reviews.aggregate(avg=models.Avg('rating'))['avg'] or 0)
                
                if avg_rating <= 0:
                    continue
                
                # Calculate target score from rating
                target = (avg_rating / 5.0) * 100.0
                
                # Extract features
                features = self.feature_extractor.extract_features_from_worker(worker)
                
                features_list.append(features)
                targets_list.append(target)
                
            except Exception as e:
                continue
        
        logger.info(f"Processed {len(features_list)} valid samples from database")
        
        if len(features_list) == 0:
            return np.array([]), np.array([])
            
        return np.array(features_list), np.array(targets_list)
    
    def build_dataset(
        self,
        csv_path: Optional[str] = None,
        include_db: bool = False,
        test_ratio: float = 0.15,
        val_ratio: float = 0.15,
        min_samples: int = 50
    ) -> Optional[Dict[str, np.ndarray]]:
        """
        Build combined dataset from CSV and database.
        
        Args:
            csv_path: Path to CSV file (required for training)
            include_db: Whether to include database workers
            test_ratio: Fraction for test set
            val_ratio: Fraction for validation set
            min_samples: Minimum samples required
            
        Returns:
            Dictionary with train/val/test splits or None if insufficient data
        """
        X_all, y_all = [], []
        
        # Load CSV data
        if csv_path:
            X_csv, y_csv = self.load_csv_data(csv_path)
            if len(X_csv) > 0:
                X_all.append(X_csv)
                y_all.append(y_csv)
        
        # Load database data
        if include_db:
            try:
                X_db, y_db = self.load_db_data()
                if len(X_db) > 0:
                    X_all.append(X_db)
                    y_all.append(y_db)
            except Exception as e:
                logger.warning(f"Could not load DB data: {e}")
        
        if not X_all:
            logger.error("No data loaded")
            return None
            
        # Combine all data
        X = np.concatenate(X_all, axis=0)
        y = np.concatenate(y_all, axis=0)
        
        logger.info(f"Total samples: {len(X)}")
        
        if len(X) < min_samples:
            logger.error(f"Insufficient samples: {len(X)} < {min_samples}")
            return None
        
        # Shuffle data
        indices = np.random.permutation(len(X))
        X = X[indices]
        y = y[indices]
        
        # Split data
        n_test = int(len(X) * test_ratio)
        n_val = int(len(X) * val_ratio)
        n_train = len(X) - n_test - n_val
        
        return {
            'X_train': X[:n_train],
            'y_train': y[:n_train],
            'X_val': X[n_train:n_train + n_val],
            'y_val': y[n_train:n_train + n_val],
            'X_test': X[n_train + n_val:],
            'y_test': y[n_train + n_val:],
        }
