"""
Worker Rating Training Pipeline

This module provides:
1. WorkerRatingTrainingPipeline - Main training orchestrator
2. Training callbacks (EarlyStopping, ModelCheckpoint, LearningRateReduction)
3. Training history visualization
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Optional

import numpy as np
import tensorflow as tf
from tensorflow import keras
from keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau, Callback

from ml.worker_rating_feature_engineering import (
    WorkerRatingFeatureExtractor,
    WorkerRatingDatasetBuilder
)
from ml.worker_rating_model import (
    WorkerRatingModelConfig,
    build_worker_rating_model,
    save_worker_rating_model
)

logger = logging.getLogger(__name__)


class LoggingCallback(Callback):
    """Custom callback for logging training progress."""
    
    def on_epoch_end(self, epoch, logs=None):
        logs = logs or {}
        loss = logs.get('loss', 0)
        mae = logs.get('mae', 0)
        val_loss = logs.get('val_loss', 0)
        val_mae = logs.get('val_mae', 0)
        
        logger.info(
            f"Epoch {epoch + 1}: "
            f"loss={loss:.4f}, mae={mae:.4f}, "
            f"val_loss={val_loss:.4f}, val_mae={val_mae:.4f}"
        )


class WorkerRatingTrainingPipeline:
    """
    Training pipeline for Worker Profile Rating model.
    
    Usage:
        pipeline = WorkerRatingTrainingPipeline()
        result = pipeline.train(
            csv_path='Datasets/global_freelancers_raw.csv',
            epochs=100,
            batch_size=32
        )
    """
    
    def __init__(
        self,
        model_dir: str = 'ml_models',
        config: Optional[WorkerRatingModelConfig] = None
    ):
        """
        Initialize training pipeline.
        
        Args:
            model_dir: Directory for saving model artifacts
            config: Model configuration (uses defaults if None)
        """
        self.model_dir = model_dir
        self.config = config or WorkerRatingModelConfig()
        self.feature_extractor = WorkerRatingFeatureExtractor()
        self.model = None
        self.history = None
        
    def _create_callbacks(self, checkpoint_path: str) -> list:
        """
        Create training callbacks.
        
        Args:
            checkpoint_path: Path to save best model checkpoint
            
        Returns:
            List of Keras callbacks
        """
        return [
            # Stop training when validation loss stops improving
            EarlyStopping(
                monitor='val_loss',
                patience=15,
                restore_best_weights=True,
                verbose=1
            ),
            # Save best model
            ModelCheckpoint(
                checkpoint_path,
                monitor='val_loss',
                save_best_only=True,
                verbose=1
            ),
            # Reduce learning rate when loss plateaus
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=7,
                min_lr=1e-6,
                verbose=1
            ),
            # Log progress
            LoggingCallback()
        ]
    
    def train(
        self,
        csv_path: str,
        epochs: int = 100,
        batch_size: int = 32,
        include_db: bool = False,
        verbose: int = 1
    ) -> Dict:
        """
        Train the worker rating model.
        
        Args:
            csv_path: Path to training CSV data
            epochs: Maximum training epochs
            batch_size: Training batch size
            include_db: Whether to include database workers
            verbose: Keras verbosity level
            
        Returns:
            Training result dictionary with metrics and model info
        """
        logger.info("=" * 60)
        logger.info("Starting Worker Rating Model Training")
        logger.info("=" * 60)
        
        start_time = datetime.now()
        
        # Step 1: Fit feature extractor
        logger.info("Step 1: Fitting feature extractor...")
        self.feature_extractor.fit()
        
        # Update config with actual feature dimension
        actual_dim = self.feature_extractor.get_feature_dim()
        logger.info(f"Feature dimension: {actual_dim}")
        self.config.input_dim = actual_dim
        
        # Step 2: Build dataset
        logger.info("Step 2: Building dataset...")
        dataset_builder = WorkerRatingDatasetBuilder(self.feature_extractor)
        dataset = dataset_builder.build_dataset(
            csv_path=csv_path,
            include_db=include_db,
            test_ratio=0.15,
            val_ratio=0.15
        )
        
        if dataset is None:
            return {
                'success': False,
                'error': 'Failed to build dataset - insufficient data'
            }
        
        X_train, y_train = dataset['X_train'], dataset['y_train']
        X_val, y_val = dataset['X_val'], dataset['y_val']
        X_test, y_test = dataset['X_test'], dataset['y_test']
        
        logger.info(f"Dataset splits: train={len(X_train)}, val={len(X_val)}, test={len(X_test)}")
        logger.info(f"Target range: min={y_train.min():.2f}, max={y_train.max():.2f}, mean={y_train.mean():.2f}")
        
        # Step 3: Build model
        logger.info("Step 3: Building model...")
        self.model = build_worker_rating_model(self.config)
        self.model.summary(print_fn=logger.info)
        
        # Step 4: Create callbacks
        os.makedirs(self.model_dir, exist_ok=True)
        checkpoint_path = os.path.join(self.model_dir, 'worker_rating_checkpoint.keras')
        callbacks = self._create_callbacks(checkpoint_path)
        
        # Step 5: Train model
        logger.info("Step 4: Training model...")
        self.history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=verbose
        )
        
        # Step 6: Evaluate on test set
        logger.info("Step 5: Evaluating on test set...")
        test_results = self.model.evaluate(X_test, y_test, verbose=0)
        test_loss, test_mae = test_results[0], test_results[1]
        
        # Calculate additional metrics
        predictions = self.model.predict(X_test, verbose=0).flatten()
        rmse = np.sqrt(np.mean((predictions - y_test) ** 2))
        
        logger.info(f"Test MSE: {test_loss:.4f}")
        logger.info(f"Test MAE: {test_mae:.4f}")
        logger.info(f"Test RMSE: {rmse:.4f}")
        
        # Step 7: Save model
        logger.info("Step 6: Saving model...")
        save_worker_rating_model(
            self.model,
            self.feature_extractor,
            self.config,
            self.model_dir
        )
        
        # Calculate training time
        training_time = (datetime.now() - start_time).total_seconds()
        
        # Build result
        result = {
            'success': True,
            'model_dir': self.model_dir,
            'epochs_trained': len(self.history.history['loss']),
            'training_samples': len(X_train),
            'validation_samples': len(X_val),
            'test_samples': len(X_test),
            'feature_dim': self.config.input_dim,
            'metrics': {
                'train_loss': float(self.history.history['loss'][-1]),
                'train_mae': float(self.history.history['mae'][-1]),
                'val_loss': float(self.history.history['val_loss'][-1]),
                'val_mae': float(self.history.history['val_mae'][-1]),
                'test_loss': float(test_loss),
                'test_mae': float(test_mae),
                'test_rmse': float(rmse)
            },
            'training_time_seconds': training_time,
            'config': self.config.to_dict(),
            'timestamp': datetime.now().isoformat()
        }
        
        # Save training history
        history_path = os.path.join(self.model_dir, 'worker_rating_history.json')
        with open(history_path, 'w') as f:
            history_data = {
                'loss': [float(v) for v in self.history.history['loss']],
                'mae': [float(v) for v in self.history.history['mae']],
                'val_loss': [float(v) for v in self.history.history['val_loss']],
                'val_mae': [float(v) for v in self.history.history['val_mae']],
            }
            json.dump(history_data, f, indent=2)
        
        logger.info("=" * 60)
        logger.info(f"Training complete! Time: {training_time:.1f}s")
        logger.info(f"Final Test MAE: {test_mae:.4f} (score units)")
        logger.info(f"Final Test RMSE: {rmse:.4f} (score units)")
        logger.info("=" * 60)
        
        return result
    
    def predict(self, worker_features: np.ndarray) -> float:
        """
        Predict profile score for a single worker.
        
        Args:
            worker_features: Feature array from feature extractor
            
        Returns:
            Profile score 0-100
        """
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        # Ensure correct shape
        if len(worker_features.shape) == 1:
            worker_features = worker_features.reshape(1, -1)
        
        prediction = self.model.predict(worker_features, verbose=0)
        return float(prediction[0][0])
    
    def predict_batch(self, features_batch: np.ndarray) -> np.ndarray:
        """
        Predict profile scores for multiple workers.
        
        Args:
            features_batch: Feature array of shape (n_workers, feature_dim)
            
        Returns:
            Array of profile scores
        """
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        predictions = self.model.predict(features_batch, verbose=0)
        return predictions.flatten()
