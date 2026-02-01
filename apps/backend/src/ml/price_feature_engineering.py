"""
Feature Engineering for Price Budget Prediction Model

This module handles:
1. Feature extraction from job descriptions, categories, and metadata
2. Currency conversion to PHP
3. Text feature extraction (simple: length, word count)
4. Category one-hot encoding
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from decimal import Decimal
from pathlib import Path
import logging
import re

logger = logging.getLogger(__name__)


# Currency conversion rates to PHP (as of 2025)
CURRENCY_TO_PHP = {
    'PHP': 1.0,
    'USD': 56.0,
    'EUR': 61.0,
    'GBP': 71.0,
    'INR': 0.67,
    'AUD': 36.0,
    'SGD': 42.0,
    'CAD': 41.0,
    'NZD': 33.0,
    'JPY': 0.37,
    'CNY': 7.7,
    'KRW': 0.041,
    'MYR': 12.5,
    'THB': 1.6,
    'VND': 0.0022,
    'IDR': 0.0035,
}


class PriceFeatureExtractor:
    """
    Extracts and preprocesses features for price prediction.
    
    Features extracted:
    - Category information (one-hot encoded)
    - Text features (title length, description length, word counts)
    - Urgency level
    - Skill level required
    - Materials count
    """
    
    # Mapping for urgency levels
    URGENCY_MAPPING = {
        'LOW': 0,
        'MEDIUM': 1,
        'HIGH': 2
    }
    
    # Mapping for skill levels
    SKILL_LEVEL_MAPPING = {
        'ENTRY': 0,
        'INTERMEDIATE': 1,
        'EXPERT': 2
    }
    
    # Mapping for job scope (affects pricing significantly)
    JOB_SCOPE_MAPPING = {
        'MINOR_REPAIR': 0,
        'MODERATE_PROJECT': 1,
        'MAJOR_RENOVATION': 2
    }
    
    # Mapping for work environment
    WORK_ENVIRONMENT_MAPPING = {
        'INDOOR': 0,
        'OUTDOOR': 1,
        'BOTH': 2
    }
    
    # Maximum categories for one-hot encoding
    MAX_CATEGORIES = 30
    
    def __init__(self):
        self.category_encoder: Dict[int, int] = {}
        self.tag_encoder: Dict[str, int] = {}
        self.is_fitted: bool = False
        self.feature_names: List[str] = []
        
    def fit(self, df: pd.DataFrame = None, jobs_queryset=None) -> 'PriceFeatureExtractor':
        """
        Fit the feature extractor on training data.
        
        Args:
            df: Pandas DataFrame from CSV (freelancer dataset)
            jobs_queryset: Django queryset of Job objects (optional)
            
        Returns:
            self for method chaining
        """
        # Build category encoding from database if available
        try:
            from accounts.models import Specializations
            categories = list(Specializations.objects.values_list('specializationID', flat=True))
            self.category_encoder = {cat_id: idx for idx, cat_id in enumerate(categories[:self.MAX_CATEGORIES])}
            logger.info(f"Loaded {len(self.category_encoder)} categories from database")
        except Exception as e:
            logger.warning(f"Could not load categories from DB: {e}")
            # Fallback: will encode categories as encountered
            
        # Extract unique tags from CSV if provided
        if df is not None and 'tags' in df.columns:
            all_tags = set()
            for tags_str in df['tags'].dropna():
                try:
                    # Tags are stored as string representation of list
                    tags = eval(tags_str) if isinstance(tags_str, str) else tags_str
                    if isinstance(tags, list):
                        all_tags.update([t.lower().strip() for t in tags])
                except:
                    pass
            
            # Keep top 50 most common tags
            top_tags = list(all_tags)[:50]
            self.tag_encoder = {tag: idx for idx, tag in enumerate(top_tags)}
            logger.info(f"Encoded {len(self.tag_encoder)} unique tags")
        
        self.is_fitted = True
        self._build_feature_names()
        return self
    
    def _build_feature_names(self):
        """Build list of feature names for interpretability."""
        self.feature_names = [
            'title_length',
            'title_word_count',
            'description_length',
            'description_word_count',
            'avg_word_length',
            'urgency',
            'skill_level',
            'job_scope',
            'work_environment',
            'materials_count',
            'has_tags',
            'tag_count',
        ]
        # Add category one-hot features
        for i in range(self.MAX_CATEGORIES):
            self.feature_names.append(f'category_{i}')
        # Add top tag features
        for i in range(min(20, len(self.tag_encoder))):
            self.feature_names.append(f'tag_{i}')
            
    def convert_to_php(self, amount: float, currency: str) -> float:
        """
        Convert amount from given currency to PHP.
        
        Args:
            amount: The monetary amount
            currency: Currency code (USD, EUR, etc.)
            
        Returns:
            Amount in PHP
        """
        currency = currency.upper() if currency else 'USD'
        rate = CURRENCY_TO_PHP.get(currency, CURRENCY_TO_PHP['USD'])
        return amount * rate
    
    def extract_text_features(self, title: str, description: str) -> np.ndarray:
        """
        Extract simple text features from title and description.
        
        Args:
            title: Job title string
            description: Job description string
            
        Returns:
            numpy array of text features
        """
        title = str(title) if title else ""
        description = str(description) if description else ""
        
        # Title features
        title_length = len(title)
        title_words = title.split()
        title_word_count = len(title_words)
        
        # Description features
        description_length = min(len(description), 10000)  # Cap at 10k chars
        desc_words = description.split()
        description_word_count = min(len(desc_words), 2000)  # Cap at 2k words
        
        # Average word length (complexity indicator)
        all_words = title_words + desc_words
        avg_word_length = np.mean([len(w) for w in all_words]) if all_words else 5.0
        
        return np.array([
            title_length / 100.0,  # Normalize
            title_word_count / 20.0,
            description_length / 5000.0,
            description_word_count / 500.0,
            avg_word_length / 10.0,
        ], dtype=np.float32)
    
    def extract_tag_features(self, tags: Any) -> np.ndarray:
        """
        Extract features from job tags.
        
        Args:
            tags: List of tags or string representation
            
        Returns:
            numpy array of tag features
        """
        # Parse tags if string
        if isinstance(tags, str):
            try:
                tags = eval(tags)
            except:
                tags = []
        
        if not isinstance(tags, list):
            tags = []
            
        tags = [t.lower().strip() for t in tags if t]
        
        # Basic tag features
        has_tags = 1.0 if tags else 0.0
        tag_count = min(len(tags), 10) / 10.0
        
        # One-hot for top tags
        tag_one_hot = [0.0] * 20
        for i, (tag, idx) in enumerate(list(self.tag_encoder.items())[:20]):
            if tag in tags:
                tag_one_hot[i] = 1.0
                
        return np.array([has_tags, tag_count] + tag_one_hot, dtype=np.float32)
    
    def extract_category_features(self, category_id: Optional[int]) -> np.ndarray:
        """
        Extract one-hot encoded category features.
        
        Args:
            category_id: Category/specialization ID
            
        Returns:
            numpy array of category one-hot encoding
        """
        category_one_hot = [0.0] * self.MAX_CATEGORIES
        
        if category_id is not None and category_id in self.category_encoder:
            category_one_hot[self.category_encoder[category_id]] = 1.0
            
        return np.array(category_one_hot, dtype=np.float32)
    
    def extract_features_from_csv_row(self, row: pd.Series) -> np.ndarray:
        """
        Extract all features from a CSV row.
        
        Args:
            row: Pandas Series representing one row
            
        Returns:
            numpy array of all features
        """
        # Text features
        text_features = self.extract_text_features(
            row.get('job_title', ''),
            row.get('job_description', '')
        )
        
        # Tag features
        tag_features = self.extract_tag_features(row.get('tags', []))
        
        # Category features (use 0 for CSV data - no category mapping)
        category_features = np.zeros(self.MAX_CATEGORIES, dtype=np.float32)
        
        # Metadata features - read from CSV if available (for synthetic PH data)
        urgency_str = str(row.get('urgency', 'MEDIUM')).upper()
        urgency = self.URGENCY_MAPPING.get(urgency_str, 1)
        
        skill_level_str = str(row.get('skill_level', 'INTERMEDIATE')).upper()
        skill_level = self.SKILL_LEVEL_MAPPING.get(skill_level_str, 1)
        
        job_scope_str = str(row.get('job_scope', 'MODERATE_PROJECT')).upper()
        job_scope = self.JOB_SCOPE_MAPPING.get(job_scope_str, 1)
        
        work_env_str = str(row.get('work_environment', 'INDOOR')).upper()
        work_environment = self.WORK_ENVIRONMENT_MAPPING.get(work_env_str, 0)
        
        # Count materials from tags if present
        tags = row.get('tags', [])
        if isinstance(tags, str):
            try:
                tags = eval(tags)
            except:
                tags = []
        materials_count = len(tags) if isinstance(tags, list) else 0
        
        metadata_features = np.array([
            urgency / 2.0,
            skill_level / 2.0,
            job_scope / 2.0,
            work_environment / 2.0,
            materials_count / 10.0,
        ], dtype=np.float32)
        
        # Combine all features
        all_features = np.concatenate([
            text_features,
            metadata_features,
            tag_features[:2],  # has_tags, tag_count
            category_features,
            tag_features[2:],  # tag one-hot
        ])
        
        return all_features
    
    def extract_features_from_job(self, job) -> np.ndarray:
        """
        Extract all features from a Django Job instance.
        
        Args:
            job: Job model instance
            
        Returns:
            numpy array of all features
        """
        # Text features
        text_features = self.extract_text_features(
            job.title,
            job.description
        )
        
        # Tag/materials features
        materials = job.materialsNeeded if job.materialsNeeded else []
        tag_features = np.array([
            1.0 if materials else 0.0,  # has_tags
            min(len(materials), 10) / 10.0,  # tag_count
        ] + [0.0] * 20, dtype=np.float32)  # No tag one-hot for DB jobs
        
        # Category features
        category_id = job.categoryID_id if job.categoryID_id else None
        category_features = self.extract_category_features(category_id)
        
        # Metadata features
        urgency = self.URGENCY_MAPPING.get(job.urgency, 1)
        
        # Get skill level from job's skill_level_required field, fallback to category
        skill_level = 1  # Default INTERMEDIATE
        if hasattr(job, 'skill_level_required') and job.skill_level_required:
            skill_level = self.SKILL_LEVEL_MAPPING.get(job.skill_level_required, 1)
        elif job.categoryID:
            skill_str = getattr(job.categoryID, 'skillLevel', 'INTERMEDIATE')
            skill_level = self.SKILL_LEVEL_MAPPING.get(skill_str, 1)
        
        # Get job_scope from job field
        job_scope = 1  # Default MODERATE_PROJECT
        if hasattr(job, 'job_scope') and job.job_scope:
            job_scope = self.JOB_SCOPE_MAPPING.get(job.job_scope, 1)
        
        # Get work_environment from job field
        work_environment = 0  # Default INDOOR
        if hasattr(job, 'work_environment') and job.work_environment:
            work_environment = self.WORK_ENVIRONMENT_MAPPING.get(job.work_environment, 0)
        
        materials_count = len(materials)
        
        metadata_features = np.array([
            urgency / 2.0,
            skill_level / 2.0,
            job_scope / 2.0,
            work_environment / 2.0,
            materials_count / 10.0,
        ], dtype=np.float32)
        
        # Combine all features
        all_features = np.concatenate([
            text_features,
            metadata_features,
            tag_features[:2],
            category_features,
            tag_features[2:],
        ])
        
        return all_features
    
    def get_feature_dim(self) -> int:
        """Get the total number of features."""
        # 5 text + 5 metadata (urgency, skill_level, job_scope, work_environment, materials_count) + 2 tag basic + 30 category + 20 tag one-hot
        return 5 + 5 + 2 + self.MAX_CATEGORIES + 20


class PriceDatasetBuilder:
    """
    Builds training dataset from CSV and/or Django models.
    """
    
    def __init__(self, feature_extractor: PriceFeatureExtractor):
        self.feature_extractor = feature_extractor
        
    def load_csv_data(self, csv_path: str, filter_fixed: bool = True, country_filter: Optional[str] = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Load and process data from CSV file.
        
        Args:
            csv_path: Path to CSV file (synthetic PH data or freelancer data)
            filter_fixed: If True, only include fixed-price jobs
            country_filter: If provided, filter by client_country (e.g., "Philippines")
            
        Returns:
            Tuple of (features, targets) numpy arrays
        """
        logger.info(f"Loading CSV data from {csv_path}")
        df = pd.read_csv(csv_path)
        
        # Filter by country if specified
        if country_filter and 'client_country' in df.columns:
            df = df[df['client_country'].str.contains(country_filter, case=False, na=False)]
            logger.info(f"Filtered to {len(df)} jobs from {country_filter}")
        
        # Filter to fixed-price only
        if filter_fixed and 'rate_type' in df.columns:
            df = df[df['rate_type'] == 'fixed']
            logger.info(f"Filtered to {len(df)} fixed-price jobs")
        
        # Remove rows with missing prices
        df = df.dropna(subset=['min_price', 'max_price', 'avg_price'])
        
        # Convert prices to PHP
        features_list = []
        targets_list = []
        
        for idx, row in df.iterrows():
            try:
                currency = row.get('currency', 'USD')
                
                # Convert prices to PHP
                min_price = self.feature_extractor.convert_to_php(row['min_price'], currency)
                max_price = self.feature_extractor.convert_to_php(row['max_price'], currency)
                avg_price = self.feature_extractor.convert_to_php(row['avg_price'], currency)
                
                # Skip invalid prices
                if min_price <= 0 or max_price <= 0 or avg_price <= 0:
                    continue
                if min_price > max_price:
                    continue
                    
                # Skip extremely high prices (outliers)
                if max_price > 5_000_000:  # 5M PHP cap
                    continue
                
                # Extract features
                features = self.feature_extractor.extract_features_from_csv_row(row)
                
                # Log-transform targets for better distribution
                targets = np.array([
                    np.log1p(min_price),
                    np.log1p(avg_price),  # suggested = avg
                    np.log1p(max_price),
                ], dtype=np.float32)
                
                features_list.append(features)
                targets_list.append(targets)
                
            except Exception as e:
                continue
        
        logger.info(f"Processed {len(features_list)} valid samples from CSV")
        
        return np.array(features_list), np.array(targets_list)
    
    def load_db_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """
        Load data from Django Job model.
        
        Returns:
            Tuple of (features, targets) numpy arrays
        """
        from accounts.models import Job
        
        # Get completed jobs with valid budgets
        jobs = Job.objects.filter(
            status='COMPLETED',
            budget__gt=0
        ).select_related('categoryID')
        
        features_list = []
        targets_list = []
        
        for job in jobs:
            try:
                budget = float(job.budget)
                
                # Skip invalid budgets
                if budget <= 0 or budget > 5_000_000:
                    continue
                
                # Extract features
                features = self.feature_extractor.extract_features_from_job(job)
                
                # For DB jobs, we only have final budget
                # Use budget as suggested, estimate min/max as ±20%
                suggested = budget
                min_price = budget * 0.8
                max_price = budget * 1.2
                
                # Log-transform targets
                targets = np.array([
                    np.log1p(min_price),
                    np.log1p(suggested),
                    np.log1p(max_price),
                ], dtype=np.float32)
                
                features_list.append(features)
                targets_list.append(targets)
                
            except Exception as e:
                continue
        
        logger.info(f"Processed {len(features_list)} valid samples from database")
        
        if len(features_list) == 0:
            return np.array([]), np.array([])
            
        return np.array(features_list), np.array(targets_list)
    
    def build_dataset(
        self,
        csv_path: Optional[str] = None,
        include_db: bool = True,
        test_ratio: float = 0.15,
        val_ratio: float = 0.15,
        min_samples: int = 50,  # Lower for synthetic data
        use_synthetic_ph: bool = True,  # Use PH blue-collar data by default
        country_filter: Optional[str] = None
    ) -> Optional[Dict[str, np.ndarray]]:
        """
        Build combined dataset from CSV and database.
        
        Args:
            csv_path: Path to CSV file (optional, overrides synthetic)
            include_db: Whether to include database jobs
            test_ratio: Fraction for test set
            val_ratio: Fraction for validation set
            min_samples: Minimum samples required
            use_synthetic_ph: Whether to use synthetic PH blue-collar dataset
            country_filter: Filter CSV by country (e.g., "Philippines")
            
        Returns:
            Dictionary with train/val/test splits or None if insufficient data
        """
        X_all, y_all = [], []
        
        # Determine CSV path
        if csv_path:
            # Use explicitly provided path
            data_path = csv_path
        elif use_synthetic_ph:
            # Use synthetic Philippine blue-collar dataset
            base_dir = Path(__file__).parent.parent.parent.parent
            data_path = base_dir / "scripts" / "ml" / "Datasets" / "ph_blue_collar_synthetic.csv"
            if data_path.exists():
                logger.info(f"Using synthetic PH blue-collar dataset: {data_path}")
            else:
                # Fallback to original (if synthetic doesn't exist)
                data_path = base_dir / "scripts" / "ml" / "Datasets" / "freelancer_job_postings.csv"
                logger.warning(f"Synthetic dataset not found, falling back to: {data_path}")
        else:
            data_path = None
        
        # Load CSV data
        if data_path:
            X_csv, y_csv = self.load_csv_data(str(data_path), country_filter=country_filter)
            if len(X_csv) > 0:
                X_all.append(X_csv)
                y_all.append(y_csv)
        
        # Load database data (iAyos completed jobs)
        if include_db:
            try:
                X_db, y_db = self.load_db_data()
                if len(X_db) > 0:
                    X_all.append(X_db)
                    y_all.append(y_db)
                    logger.info(f"Loaded {len(X_db)} jobs from iAyos database")
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
