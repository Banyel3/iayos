"""
LSTM Model Architecture for Job Completion Time Prediction

This module defines:
1. LSTM neural network architecture using TensorFlow/Keras
2. Model configuration and hyperparameters
3. Model saving/loading utilities
4. Confidence interval estimation
"""

import os
import json
import logging
from typing import Dict, Tuple, Optional, Any
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)


class ModelConfig:
    """Configuration for the LSTM model."""
    
    # Model architecture
    LSTM_UNITS_1 = 64
    LSTM_UNITS_2 = 32
    DENSE_UNITS = 16
    DROPOUT_RATE = 0.2
    
    # Training parameters
    LEARNING_RATE = 0.001
    BATCH_SIZE = 32
    EPOCHS = 100
    EARLY_STOPPING_PATIENCE = 10
    
    # Input configuration
    SEQUENCE_LENGTH = 1  # Single timestep for now (can expand for sequences)
    
    # Paths
    MODEL_DIR = Path(__file__).parent / 'saved_models'
    MODEL_NAME = 'job_completion_lstm'
    
    @classmethod
    def to_dict(cls) -> Dict[str, Any]:
        """Export config as dictionary."""
        return {
            'lstm_units_1': cls.LSTM_UNITS_1,
            'lstm_units_2': cls.LSTM_UNITS_2,
            'dense_units': cls.DENSE_UNITS,
            'dropout_rate': cls.DROPOUT_RATE,
            'learning_rate': cls.LEARNING_RATE,
            'batch_size': cls.BATCH_SIZE,
            'epochs': cls.EPOCHS,
            'early_stopping_patience': cls.EARLY_STOPPING_PATIENCE,
            'sequence_length': cls.SEQUENCE_LENGTH,
        }


def build_lstm_model(input_dim: int, config: ModelConfig = ModelConfig) -> 'tf.keras.Model':
    """
    Build the LSTM model for completion time prediction.
    
    Architecture:
    - Input: (batch_size, sequence_length, features)
    - LSTM layer 1: 64 units with dropout
    - LSTM layer 2: 32 units
    - Dense: 16 units
    - Output: 1 unit (predicted log-hours)
    
    Args:
        input_dim: Number of input features
        config: Model configuration class
        
    Returns:
        Compiled Keras model
    """
    try:
        import tensorflow as tf
        from tensorflow import keras
        from tensorflow.keras import layers, regularizers
    except ImportError:
        raise ImportError(
            "TensorFlow is required. Install with: pip install tensorflow"
        )
    
    # Build model
    model = keras.Sequential([
        # Input layer - reshape to sequence format
        layers.Input(shape=(config.SEQUENCE_LENGTH, input_dim)),
        
        # First LSTM layer with return sequences for stacking
        layers.LSTM(
            config.LSTM_UNITS_1,
            return_sequences=True,
            kernel_regularizer=regularizers.l2(0.01),
            dropout=config.DROPOUT_RATE,
            recurrent_dropout=config.DROPOUT_RATE
        ),
        
        # Second LSTM layer
        layers.LSTM(
            config.LSTM_UNITS_2,
            kernel_regularizer=regularizers.l2(0.01),
            dropout=config.DROPOUT_RATE
        ),
        
        # Dense layer
        layers.Dense(
            config.DENSE_UNITS,
            activation='relu',
            kernel_regularizer=regularizers.l2(0.01)
        ),
        layers.Dropout(config.DROPOUT_RATE),
        
        # Output layer (single value: log-transformed hours)
        layers.Dense(1)
    ])
    
    # Compile with Adam optimizer
    optimizer = keras.optimizers.Adam(learning_rate=config.LEARNING_RATE)
    
    model.compile(
        optimizer=optimizer,
        loss='mse',
        metrics=['mae']
    )
    
    logger.info(f"Built LSTM model with input dim: {input_dim}")
    model.summary(print_fn=logger.info)
    
    return model


def build_ensemble_model(input_dim: int, n_models: int = 3) -> list:
    """
    Build an ensemble of LSTM models for uncertainty estimation.
    
    Args:
        input_dim: Number of input features
        n_models: Number of models in ensemble
        
    Returns:
        List of Keras models
    """
    models = []
    for i in range(n_models):
        model = build_lstm_model(input_dim)
        models.append(model)
        logger.info(f"Built ensemble model {i + 1}/{n_models}")
    
    return models


class CompletionTimePredictor:
    """
    Main predictor class that handles model loading, prediction, and confidence intervals.
    """
    
    def __init__(self, model_path: Optional[Path] = None):
        """
        Initialize the predictor.
        
        Args:
            model_path: Path to saved model directory
        """
        self.model = None
        self.feature_extractor = None
        self.metadata: Dict[str, Any] = {}
        self.model_path = model_path or ModelConfig.MODEL_DIR
        self._loaded = False
    
    def load(self) -> bool:
        """
        Load the trained model and metadata.
        
        Returns:
            True if successfully loaded, False otherwise
        """
        try:
            import tensorflow as tf
        except ImportError:
            logger.error("TensorFlow not installed")
            return False
        
        model_file = self.model_path / f'{ModelConfig.MODEL_NAME}.keras'
        metadata_file = self.model_path / f'{ModelConfig.MODEL_NAME}_metadata.json'
        extractor_file = self.model_path / f'{ModelConfig.MODEL_NAME}_extractor.json'
        
        if not model_file.exists():
            logger.warning(f"Model file not found: {model_file}")
            return False
        
        try:
            # Load model
            self.model = tf.keras.models.load_model(str(model_file))
            logger.info(f"Loaded model from {model_file}")
            
            # Load metadata
            if metadata_file.exists():
                with open(metadata_file, 'r') as f:
                    self.metadata = json.load(f)
                logger.info(f"Loaded metadata: {self.metadata}")
            
            # Load feature extractor parameters
            if extractor_file.exists():
                from ml.data_preprocessing import JobFeatureExtractor
                self.feature_extractor = JobFeatureExtractor()
                
                with open(extractor_file, 'r') as f:
                    extractor_data = json.load(f)
                
                self.feature_extractor.category_encoder = {
                    int(k): v for k, v in extractor_data['category_encoder'].items()
                }
                self.feature_extractor.budget_mean = extractor_data['budget_mean']
                self.feature_extractor.budget_std = extractor_data['budget_std']
                self.feature_extractor.is_fitted = True
                
                logger.info("Loaded feature extractor parameters")
            
            self._loaded = True
            return True
            
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False
    
    def predict(self, job) -> Dict[str, Any]:
        """
        Predict completion time for a job.
        
        Args:
            job: Job model instance (can be unsaved)
            
        Returns:
            Dictionary with prediction results:
            {
                'predicted_hours': float,
                'confidence_interval': (lower, upper),
                'confidence_level': float (0-1),
                'formatted_duration': str
            }
        """
        if not self._loaded:
            if not self.load():
                return {
                    'error': 'Model not loaded',
                    'predicted_hours': None,
                    'confidence_interval': None,
                    'confidence_level': 0.0,
                    'formatted_duration': 'Unknown'
                }
        
        try:
            # Extract features
            features = self.feature_extractor.extract_all_features(job)
            
            # Reshape for LSTM: (1, sequence_length, features)
            X = features.reshape(1, ModelConfig.SEQUENCE_LENGTH, -1)
            
            # Predict (log-transformed)
            log_hours_pred = self.model.predict(X, verbose=0)[0][0]
            
            # Inverse log transform
            hours_pred = np.expm1(log_hours_pred)
            hours_pred = max(0.5, hours_pred)  # Minimum 30 minutes
            
            # Estimate confidence interval using model uncertainty
            confidence_interval = self._estimate_confidence(X, hours_pred)
            
            # Calculate confidence level based on worker history
            confidence_level = self._calculate_confidence_level(job)
            
            # Format duration
            formatted = self._format_duration(hours_pred)
            
            return {
                'predicted_hours': round(float(hours_pred), 2),
                'confidence_interval': (
                    round(float(confidence_interval[0]), 2),
                    round(float(confidence_interval[1]), 2)
                ),
                'confidence_level': round(float(confidence_level), 2),
                'formatted_duration': formatted
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {
                'error': str(e),
                'predicted_hours': None,
                'confidence_interval': None,
                'confidence_level': 0.0,
                'formatted_duration': 'Unknown'
            }
    
    def _estimate_confidence(self, X: np.ndarray, predicted_hours: float) -> Tuple[float, float]:
        """
        Estimate confidence interval for prediction.
        
        Uses Monte Carlo Dropout for uncertainty estimation.
        """
        try:
            import tensorflow as tf
            
            # Monte Carlo Dropout: Run multiple predictions with dropout enabled
            n_samples = 20
            predictions = []
            
            # Enable dropout during inference by using training=True
            for _ in range(n_samples):
                pred = self.model(X, training=True).numpy()[0][0]
                predictions.append(np.expm1(pred))
            
            predictions = np.array(predictions)
            mean_pred = np.mean(predictions)
            std_pred = np.std(predictions)
            
            # 95% confidence interval
            lower = max(0.5, mean_pred - 1.96 * std_pred)
            upper = mean_pred + 1.96 * std_pred
            
            return (lower, upper)
            
        except Exception as e:
            logger.warning(f"Confidence estimation failed: {e}, using fallback")
            # Fallback: +/- 30% of prediction
            return (predicted_hours * 0.7, predicted_hours * 1.3)
    
    def _calculate_confidence_level(self, job) -> float:
        """
        Calculate confidence level based on available data.
        
        Higher confidence when:
        - Worker has more completed jobs
        - Category has more historical data
        - All required fields are filled
        """
        confidence = 0.5  # Base confidence
        
        # Boost for assigned worker with history
        if job.assignedWorkerID_id:
            from accounts.models import Job
            worker_jobs = Job.objects.filter(
                assignedWorkerID_id=job.assignedWorkerID_id,
                status='COMPLETED'
            ).count()
            
            if worker_jobs >= 10:
                confidence += 0.2
            elif worker_jobs >= 5:
                confidence += 0.1
            elif worker_jobs >= 1:
                confidence += 0.05
        
        # Boost for category with history
        if job.categoryID_id:
            from accounts.models import Job
            category_jobs = Job.objects.filter(
                categoryID_id=job.categoryID_id,
                status='COMPLETED'
            ).count()
            
            if category_jobs >= 50:
                confidence += 0.15
            elif category_jobs >= 20:
                confidence += 0.1
            elif category_jobs >= 5:
                confidence += 0.05
        
        # Boost for filled fields
        if job.budget and float(job.budget) > 0:
            confidence += 0.05
        if job.materialsNeeded and len(job.materialsNeeded) > 0:
            confidence += 0.05
        
        return min(confidence, 0.95)  # Cap at 95%
    
    def _format_duration(self, hours: float) -> str:
        """
        Format hours into human-readable duration.
        
        Examples:
        - 0.5 -> "30 minutes"
        - 2.0 -> "2 hours"
        - 8.0 -> "1 day"
        - 24.0 -> "1 day"
        - 48.0 -> "2 days"
        """
        if hours < 1:
            minutes = int(hours * 60)
            return f"{minutes} minutes"
        elif hours < 24:
            if hours == int(hours):
                return f"{int(hours)} hour{'s' if hours > 1 else ''}"
            return f"{hours:.1f} hours"
        else:
            days = hours / 24
            if days == int(days):
                return f"{int(days)} day{'s' if days > 1 else ''}"
            return f"{days:.1f} days"


def save_model(model, 
               feature_extractor, 
               metadata: Dict[str, Any],
               model_dir: Optional[Path] = None):
    """
    Save trained model, feature extractor, and metadata.
    
    Args:
        model: Trained Keras model
        feature_extractor: Fitted JobFeatureExtractor instance
        metadata: Training metadata (metrics, timestamps, etc.)
        model_dir: Directory to save to
    """
    model_dir = model_dir or ModelConfig.MODEL_DIR
    model_dir.mkdir(parents=True, exist_ok=True)
    
    # Save Keras model
    model_file = model_dir / f'{ModelConfig.MODEL_NAME}.keras'
    model.save(str(model_file))
    logger.info(f"Saved model to {model_file}")
    
    # Save metadata
    metadata_file = model_dir / f'{ModelConfig.MODEL_NAME}_metadata.json'
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2, default=str)
    logger.info(f"Saved metadata to {metadata_file}")
    
    # Save feature extractor parameters
    extractor_file = model_dir / f'{ModelConfig.MODEL_NAME}_extractor.json'
    extractor_data = {
        'category_encoder': {str(k): v for k, v in feature_extractor.category_encoder.items()},
        'budget_mean': feature_extractor.budget_mean,
        'budget_std': feature_extractor.budget_std,
        'is_fitted': feature_extractor.is_fitted,
    }
    with open(extractor_file, 'w') as f:
        json.dump(extractor_data, f, indent=2)
    logger.info(f"Saved feature extractor to {extractor_file}")


def load_model(model_dir: Optional[Path] = None):
    """
    Load trained model and create predictor.
    
    Args:
        model_dir: Directory containing saved model
        
    Returns:
        CompletionTimePredictor instance
    """
    predictor = CompletionTimePredictor(model_dir)
    if predictor.load():
        return predictor
    return None
