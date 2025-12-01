"""
Training Pipeline for Job Completion Time Prediction Model

This module handles:
1. Data loading from Django ORM
2. Training loop with early stopping
3. Model checkpointing
4. Training metrics logging
5. Validation and evaluation
"""

import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)


class TrainingPipeline:
    """
    End-to-end training pipeline for the completion time prediction model.
    """
    
    def __init__(self, verbose: bool = True):
        """
        Initialize the training pipeline.
        
        Args:
            verbose: Whether to print training progress
        """
        self.verbose = verbose
        self.history = None
        self.model = None
        self.feature_extractor = None
        self.metrics: Dict[str, Any] = {}
    
    def train(self, 
              min_samples: int = 50,
              epochs: Optional[int] = None,
              batch_size: Optional[int] = None,
              validation_split: float = 0.15,
              test_split: float = 0.15,
              force: bool = False) -> Dict[str, Any]:
        """
        Run the full training pipeline.
        
        Args:
            min_samples: Minimum number of samples required to train
            epochs: Override default epochs
            batch_size: Override default batch size
            validation_split: Fraction of data for validation
            test_split: Fraction of data for testing
            force: If True, bypass minimum samples check (for testing)
            
        Returns:
            Dictionary with training results and metrics
        """
        try:
            import tensorflow as tf
            from tensorflow import keras
        except ImportError:
            raise ImportError("TensorFlow is required. Install with: pip install tensorflow")
        
        from ml.data_preprocessing import JobFeatureExtractor, DatasetBuilder
        from ml.models import build_lstm_model, save_model, ModelConfig
        
        logger.info("=" * 60)
        logger.info("Starting Training Pipeline")
        logger.info("=" * 60)
        
        # Step 1: Initialize feature extractor
        logger.info("Step 1: Initializing feature extractor...")
        self.feature_extractor = JobFeatureExtractor()
        
        # Step 2: Load and prepare data
        logger.info("Step 2: Loading and preparing data...")
        from accounts.models import Job
        
        completed_jobs = Job.objects.filter(status='COMPLETED')
        job_count = completed_jobs.count()
        
        if job_count < min_samples and not force:
            error_msg = f"Insufficient data: {job_count} completed jobs, need at least {min_samples}"
            logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg,
                'jobs_available': job_count,
                'jobs_required': min_samples
            }
        
        if force and job_count < min_samples:
            logger.warning(f"Force training with only {job_count} samples (recommended: {min_samples}+)")
        
        logger.info(f"Found {job_count} completed jobs")
        
        # Fit feature extractor
        self.feature_extractor.fit(completed_jobs)
        
        # Build dataset
        dataset_builder = DatasetBuilder(self.feature_extractor)
        dataset = dataset_builder.build_dataset(
            min_completed_jobs=min_samples,
            test_ratio=test_split,
            val_ratio=validation_split,
            force=force
        )
        
        if not dataset:
            return {
                'success': False,
                'error': 'Failed to build dataset - insufficient valid samples'
            }
        
        X_train = dataset['X_train']
        y_train = dataset['y_train']
        X_val = dataset['X_val']
        y_val = dataset['y_val']
        X_test = dataset['X_test']
        y_test = dataset['y_test']
        
        logger.info(f"Dataset splits: train={len(X_train)}, val={len(X_val)}, test={len(X_test)}")
        
        # Reshape for LSTM: (samples, sequence_length, features)
        X_train = X_train.reshape(-1, ModelConfig.SEQUENCE_LENGTH, X_train.shape[1])
        X_val = X_val.reshape(-1, ModelConfig.SEQUENCE_LENGTH, X_val.shape[1])
        X_test = X_test.reshape(-1, ModelConfig.SEQUENCE_LENGTH, X_test.shape[1])
        
        # Step 3: Build model
        logger.info("Step 3: Building LSTM model...")
        input_dim = X_train.shape[2]
        self.model = build_lstm_model(input_dim)
        
        # Step 4: Setup callbacks
        logger.info("Step 4: Setting up training callbacks...")
        
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=epochs or ModelConfig.EARLY_STOPPING_PATIENCE,
                restore_best_weights=True,
                verbose=1 if self.verbose else 0
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-6,
                verbose=1 if self.verbose else 0
            )
        ]
        
        # Step 5: Train
        logger.info("Step 5: Training model...")
        training_epochs = epochs or ModelConfig.EPOCHS
        training_batch_size = batch_size or ModelConfig.BATCH_SIZE
        
        start_time = datetime.now()
        
        self.history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=training_epochs,
            batch_size=training_batch_size,
            callbacks=callbacks,
            verbose=1 if self.verbose else 0
        )
        
        training_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"Training completed in {training_time:.2f} seconds")
        
        # Step 6: Evaluate on test set
        logger.info("Step 6: Evaluating on test set...")
        test_loss, test_mae = self.model.evaluate(X_test, y_test, verbose=0)
        
        # Calculate metrics in original scale
        y_pred_test = self.model.predict(X_test, verbose=0)
        y_pred_original = np.expm1(y_pred_test.flatten())
        y_test_original = np.expm1(y_test)
        
        # RMSE and MAE in original scale (hours)
        rmse = np.sqrt(np.mean((y_pred_original - y_test_original) ** 2))
        mae = np.mean(np.abs(y_pred_original - y_test_original))
        mape = np.mean(np.abs((y_pred_original - y_test_original) / y_test_original)) * 100
        
        # Step 7: Save model
        logger.info("Step 7: Saving model...")
        
        metadata = {
            'trained_at': datetime.now().isoformat(),
            'training_samples': len(X_train),
            'validation_samples': len(X_val),
            'test_samples': len(X_test),
            'input_dim': input_dim,
            'epochs_run': len(self.history.history['loss']),
            'final_train_loss': float(self.history.history['loss'][-1]),
            'final_val_loss': float(self.history.history['val_loss'][-1]),
            'test_loss': float(test_loss),
            'test_mae_log': float(test_mae),
            'test_rmse_hours': float(rmse),
            'test_mae_hours': float(mae),
            'test_mape': float(mape),
            'training_time_seconds': training_time,
            'config': ModelConfig.to_dict()
        }
        
        save_model(self.model, self.feature_extractor, metadata)
        
        # Store metrics
        self.metrics = {
            'success': True,
            'model_saved': True,
            'training_time_seconds': training_time,
            'epochs_run': len(self.history.history['loss']),
            'train_samples': len(X_train),
            'val_samples': len(X_val),
            'test_samples': len(X_test),
            'metrics': {
                'final_train_loss': float(self.history.history['loss'][-1]),
                'final_val_loss': float(self.history.history['val_loss'][-1]),
                'test_rmse_hours': float(rmse),
                'test_mae_hours': float(mae),
                'test_mape_percent': float(mape)
            }
        }
        
        logger.info("=" * 60)
        logger.info("Training Complete!")
        logger.info(f"Test RMSE: {rmse:.2f} hours")
        logger.info(f"Test MAE: {mae:.2f} hours")
        logger.info(f"Test MAPE: {mape:.2f}%")
        logger.info("=" * 60)
        
        return self.metrics
    
    def get_training_history(self) -> Optional[Dict[str, list]]:
        """
        Get training history.
        
        Returns:
            Dictionary with 'loss', 'val_loss', 'mae', 'val_mae' lists
        """
        if self.history is None:
            return None
        return self.history.history
    
    def evaluate_sample_predictions(self, n_samples: int = 5) -> list:
        """
        Run sample predictions to verify model is working.
        
        Args:
            n_samples: Number of sample predictions to run
            
        Returns:
            List of prediction results
        """
        from accounts.models import Job
        from ml.models import CompletionTimePredictor
        
        predictor = CompletionTimePredictor()
        if not predictor.load():
            return []
        
        # Get some recent completed jobs
        sample_jobs = Job.objects.filter(
            status='COMPLETED'
        ).order_by('-completedAt')[:n_samples]
        
        results = []
        for job in sample_jobs:
            prediction = predictor.predict(job)
            
            # Get actual completion time
            from ml.data_preprocessing import CompletionTimeCalculator
            actual_hours = CompletionTimeCalculator.calculate_completion_hours(job)
            
            results.append({
                'job_id': job.jobID,
                'job_title': job.title[:50],
                'category': job.categoryID.specializationName if job.categoryID else 'Unknown',
                'budget': float(job.budget),
                'actual_hours': actual_hours,
                'predicted_hours': prediction['predicted_hours'],
                'confidence_interval': prediction['confidence_interval'],
                'formatted': prediction['formatted_duration'],
                'error_hours': abs(actual_hours - prediction['predicted_hours']) if actual_hours and prediction['predicted_hours'] else None
            })
        
        return results


def retrain_model(min_samples: int = 50, verbose: bool = True) -> Dict[str, Any]:
    """
    Convenience function to retrain the model.
    
    Args:
        min_samples: Minimum samples required
        verbose: Print progress
        
    Returns:
        Training results
    """
    pipeline = TrainingPipeline(verbose=verbose)
    return pipeline.train(min_samples=min_samples)


def get_model_info() -> Dict[str, Any]:
    """
    Get information about the currently saved model.
    
    Returns:
        Model metadata or error info
    """
    from ml.models import ModelConfig
    import json
    
    metadata_file = ModelConfig.MODEL_DIR / f'{ModelConfig.MODEL_NAME}_metadata.json'
    
    if not metadata_file.exists():
        return {
            'exists': False,
            'message': 'No trained model found'
        }
    
    with open(metadata_file, 'r') as f:
        metadata = json.load(f)
    
    metadata['exists'] = True
    return metadata
