"""
Training Pipeline for Price Budget Prediction Model

This module handles:
1. Data loading from CSV and Django ORM
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


class PriceTrainingPipeline:
    """
    End-to-end training pipeline for the price budget prediction model.
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
    
    def train(
        self,
        csv_path: Optional[str] = None,
        include_db: bool = True,
        min_samples: int = 100,
        epochs: Optional[int] = None,
        batch_size: Optional[int] = None,
        validation_split: float = 0.15,
        test_split: float = 0.15,
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Run the full training pipeline.
        
        Args:
            csv_path: Path to freelancer_job_postings.csv
            include_db: Whether to include database jobs
            min_samples: Minimum number of samples required to train
            epochs: Override default epochs
            batch_size: Override default batch size
            validation_split: Fraction of data for validation
            test_split: Fraction of data for testing
            force: If True, bypass minimum samples check
            
        Returns:
            Dictionary with training results and metrics
        """
        try:
            import tensorflow as tf
            from tensorflow import keras
        except ImportError:
            raise ImportError("TensorFlow is required. Install with: pip install tensorflow")
        
        from ml.price_feature_engineering import PriceFeatureExtractor, PriceDatasetBuilder
        from ml.price_model import build_price_lstm_model, save_price_model, PriceModelConfig
        
        logger.info("=" * 60)
        logger.info("Starting Price Budget Training Pipeline")
        logger.info("=" * 60)
        
        # Step 1: Initialize feature extractor
        logger.info("Step 1: Initializing feature extractor...")
        self.feature_extractor = PriceFeatureExtractor()
        
        # Load CSV to fit feature extractor
        if csv_path:
            import pandas as pd
            df = pd.read_csv(csv_path)
            df = df[df['rate_type'] == 'fixed']  # Filter to fixed only
            self.feature_extractor.fit(df=df)
        else:
            self.feature_extractor.fit()
        
        # Step 2: Build dataset
        logger.info("Step 2: Loading and preparing data...")
        dataset_builder = PriceDatasetBuilder(self.feature_extractor)
        
        dataset = dataset_builder.build_dataset(
            csv_path=csv_path,
            include_db=include_db,
            test_ratio=test_split,
            val_ratio=validation_split,
            min_samples=min_samples if not force else 1
        )
        
        if dataset is None:
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
        
        total_samples = len(X_train) + len(X_val) + len(X_test)
        logger.info(f"Dataset splits: train={len(X_train)}, val={len(X_val)}, test={len(X_test)}")
        logger.info(f"Total samples: {total_samples}")
        
        if total_samples < min_samples and not force:
            error_msg = f"Insufficient data: {total_samples} samples, need at least {min_samples}"
            logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg,
                'samples_available': total_samples,
                'samples_required': min_samples
            }
        
        # Reshape for LSTM: (samples, sequence_length, features)
        X_train = X_train.reshape(-1, PriceModelConfig.SEQUENCE_LENGTH, X_train.shape[1])
        X_val = X_val.reshape(-1, PriceModelConfig.SEQUENCE_LENGTH, X_val.shape[1])
        X_test = X_test.reshape(-1, PriceModelConfig.SEQUENCE_LENGTH, X_test.shape[1])
        
        # Step 3: Build model
        logger.info("Step 3: Building Price LSTM model...")
        input_dim = X_train.shape[2]
        self.model = build_price_lstm_model(input_dim)
        
        # Step 4: Setup callbacks
        logger.info("Step 4: Setting up training callbacks...")
        
        training_epochs = epochs or PriceModelConfig.EPOCHS
        
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=PriceModelConfig.EARLY_STOPPING_PATIENCE,
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
        training_batch_size = batch_size or PriceModelConfig.BATCH_SIZE
        
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
        
        # Calculate metrics in original scale (PHP)
        y_pred_test = self.model.predict(X_test, verbose=0)
        
        # Convert from log scale
        y_pred_original = np.expm1(y_pred_test)
        y_test_original = np.expm1(y_test)
        
        # Calculate metrics for each output
        metrics_per_output = {}
        output_names = ['min_price', 'suggested_price', 'max_price']
        
        for i, name in enumerate(output_names):
            pred = y_pred_original[:, i]
            actual = y_test_original[:, i]
            
            rmse = np.sqrt(np.mean((pred - actual) ** 2))
            mae = np.mean(np.abs(pred - actual))
            # Avoid division by zero
            mape = np.mean(np.abs((pred - actual) / (actual + 1))) * 100
            
            metrics_per_output[name] = {
                'rmse_php': round(float(rmse), 2),
                'mae_php': round(float(mae), 2),
                'mape': round(float(mape), 2)
            }
            
            logger.info(f"  {name}: RMSE=₱{rmse:.2f}, MAE=₱{mae:.2f}, MAPE={mape:.1f}%")
        
        # Overall metrics
        overall_rmse = np.sqrt(np.mean((y_pred_original - y_test_original) ** 2))
        overall_mae = np.mean(np.abs(y_pred_original - y_test_original))
        
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
            'test_mae': float(test_mae),
            'test_rmse_php': float(overall_rmse),
            'test_mae_php': float(overall_mae),
            'metrics_per_output': metrics_per_output,
            'config': PriceModelConfig.to_dict(),
            'csv_path': csv_path,
            'include_db': include_db,
        }
        
        model_path = save_price_model(self.model, self.feature_extractor, metadata)
        
        # Step 8: Summary
        logger.info("=" * 60)
        logger.info("Training Complete!")
        logger.info(f"  Model saved to: {model_path}")
        logger.info(f"  Training time: {training_time:.2f} seconds")
        logger.info(f"  Epochs run: {len(self.history.history['loss'])}")
        logger.info(f"  Test RMSE: ₱{overall_rmse:.2f}")
        logger.info(f"  Test MAE: ₱{overall_mae:.2f}")
        logger.info("=" * 60)
        
        return {
            'success': True,
            'model_path': model_path,
            'epochs_run': len(self.history.history['loss']),
            'training_time_seconds': training_time,
            'train_samples': len(X_train),
            'val_samples': len(X_val),
            'test_samples': len(X_test),
            'test_rmse_php': float(overall_rmse),
            'test_mae_php': float(overall_mae),
            'metrics_per_output': metrics_per_output,
        }


def quick_train(csv_path: str = None, epochs: int = 50, min_samples: int = 100) -> Dict[str, Any]:
    """
    Quick training function for command-line usage.
    
    Args:
        csv_path: Path to CSV file
        epochs: Number of training epochs
        min_samples: Minimum samples required
        
    Returns:
        Training results dictionary
    """
    pipeline = PriceTrainingPipeline(verbose=True)
    return pipeline.train(
        csv_path=csv_path,
        include_db=True,
        epochs=epochs,
        min_samples=min_samples
    )
