"""
Standalone Training Script for Price Budget LSTM Model

This script trains the model using the ml.price_feature_engineering module,
then saves it to be loaded by the Django backend.

IMPORTANT: The PriceFeatureExtractor class is imported from ml.price_feature_engineering
so that the pickled object can be loaded correctly in the Django context.

Usage:
    python scripts/train_price_model.py
    python scripts/train_price_model.py --epochs 50 --csv Datasets/freelancer_job_postings.csv
"""

import os
import sys
import json
import pickle
import argparse
import logging
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

# Add the backend src to path so we can import the ml module
BACKEND_SRC = Path(__file__).parent.parent / 'apps' / 'backend' / 'src'
sys.path.insert(0, str(BACKEND_SRC))

# Import from the actual module - CRITICAL for pickle compatibility
from ml.price_feature_engineering import PriceFeatureExtractor, CURRENCY_TO_PHP

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def load_and_preprocess_csv(csv_path, feature_extractor):
    """Load CSV and preprocess data."""
    logger.info(f"Loading CSV from {csv_path}")
    df = pd.read_csv(csv_path)
    
    # Filter to fixed-price only
    df = df[df['rate_type'] == 'fixed']
    logger.info(f"Filtered to {len(df)} fixed-price jobs")
    
    # Remove rows with missing prices
    df = df.dropna(subset=['min_price', 'max_price', 'avg_price'])
    
    # Fit feature extractor on tags
    feature_extractor.fit(df)
    
    # Extract features and targets
    X_list = []
    y_list = []
    
    for _, row in df.iterrows():
        try:
            # Use the CSV-specific method
            features = feature_extractor.extract_features_from_csv_row(row)
            
            # Get prices and convert to PHP
            currency = row.get('currency', 'USD')
            min_price = feature_extractor.convert_to_php(float(row['min_price']), str(currency))
            max_price = feature_extractor.convert_to_php(float(row['max_price']), str(currency))
            avg_price = feature_extractor.convert_to_php(float(row['avg_price']), str(currency))
            
            # Skip invalid prices
            if min_price <= 0 or max_price <= 0 or avg_price <= 0:
                continue
            if min_price > max_price:
                min_price, max_price = max_price, min_price
            
            # Log-transform targets
            targets = [
                np.log1p(min_price),
                np.log1p(avg_price),  # suggested = average
                np.log1p(max_price)
            ]
            
            X_list.append(features)
            y_list.append(targets)
            
        except Exception as e:
            continue
    
    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.float32)
    
    logger.info(f"Processed {len(X)} valid samples")
    return X, y, feature_extractor


def build_model(input_dim):
    """Build the LSTM model."""
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers, regularizers
    
    model = keras.Sequential([
        layers.Input(shape=(1, input_dim)),
        
        layers.LSTM(
            64,
            return_sequences=True,
            kernel_regularizer=regularizers.l2(0.01),
            dropout=0.2,
            recurrent_dropout=0.2
        ),
        
        layers.LSTM(
            32,
            kernel_regularizer=regularizers.l2(0.01),
            dropout=0.2
        ),
        
        layers.Dense(
            16,
            activation='relu',
            kernel_regularizer=regularizers.l2(0.01)
        ),
        layers.Dropout(0.2),
        
        layers.Dense(3)  # Output: min, suggested, max (log scale)
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='mse',
        metrics=['mae']
    )
    
    return model


def train_model(X, y, epochs=100, batch_size=32, validation_split=0.15):
    """Train the model with early stopping."""
    from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
    from sklearn.model_selection import train_test_split
    
    # Split into train/val/test
    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, random_state=42)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42)
    
    logger.info(f"Dataset: train={len(X_train)}, val={len(X_val)}, test={len(X_test)}")
    
    # Reshape for LSTM: (samples, timesteps=1, features)
    X_train = X_train.reshape(-1, 1, X_train.shape[1])
    X_val = X_val.reshape(-1, 1, X_val.shape[1])
    X_test = X_test.reshape(-1, 1, X_test.shape[1])
    
    # Build model
    model = build_model(X_train.shape[2])
    model.summary()
    
    # Callbacks
    callbacks = [
        EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=0.0001
        )
    ]
    
    # Train
    logger.info(f"Training for up to {epochs} epochs...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=callbacks,
        verbose=1
    )
    
    # Evaluate on test set
    logger.info("Evaluating on test set...")
    y_pred = model.predict(X_test)
    
    # Calculate metrics per output
    output_names = ['min_price', 'suggested_price', 'max_price']
    metrics_per_output = {}
    
    for i, name in enumerate(output_names):
        y_true_orig = np.expm1(y_test[:, i])
        y_pred_orig = np.expm1(y_pred[:, i])
        
        rmse = np.sqrt(np.mean((y_true_orig - y_pred_orig) ** 2))
        mae = np.mean(np.abs(y_true_orig - y_pred_orig))
        mape = np.mean(np.abs((y_true_orig - y_pred_orig) / (y_true_orig + 1))) * 100
        
        metrics_per_output[name] = {
            'rmse_php': float(rmse),
            'mae_php': float(mae),
            'mape_percent': float(mape)
        }
        logger.info(f"  {name}: RMSE=₱{rmse:.2f}, MAE=₱{mae:.2f}, MAPE={mape:.1f}%")
    
    # Overall metrics
    y_true_all = np.expm1(y_test)
    y_pred_all = np.expm1(y_pred)
    overall_rmse = np.sqrt(np.mean((y_true_all - y_pred_all) ** 2))
    overall_mae = np.mean(np.abs(y_true_all - y_pred_all))
    
    return model, history, {
        'epochs_run': len(history.history['loss']),
        'test_rmse_php': float(overall_rmse),
        'test_mae_php': float(overall_mae),
        'metrics_per_output': metrics_per_output,
        'train_samples': len(X_train),
        'val_samples': len(X_val),
        'test_samples': len(X_test)
    }


def main():
    parser = argparse.ArgumentParser(description='Train Price Budget LSTM Model')
    parser.add_argument('--csv', type=str, default='Datasets/freelancer_job_postings.csv',
                        help='Path to CSV file')
    parser.add_argument('--epochs', type=int, default=100, help='Max epochs')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size')
    parser.add_argument('--output-dir', type=str, 
                        default='apps/backend/src/ml/saved_models/price_budget_lstm',
                        help='Output directory for model')
    args = parser.parse_args()
    
    logger.info("=" * 60)
    logger.info("Price Budget LSTM Model Training")
    logger.info("=" * 60)
    
    # Create feature extractor from the module
    feature_extractor = PriceFeatureExtractor()
    
    # Load and preprocess data
    X, y, feature_extractor = load_and_preprocess_csv(args.csv, feature_extractor)
    
    # Train
    start_time = datetime.now()
    model, history, metrics = train_model(X, y, epochs=args.epochs, batch_size=args.batch_size)
    training_time = (datetime.now() - start_time).total_seconds()
    
    # Save model
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save Keras model
    model_path = output_dir / 'model.keras'
    model.save(model_path)
    logger.info(f"Saved model to {model_path}")
    
    # Save feature extractor (now properly importable as ml.price_feature_engineering.PriceFeatureExtractor)
    extractor_path = output_dir / 'feature_extractor.pkl'
    with open(extractor_path, 'wb') as f:
        pickle.dump(feature_extractor, f)
    logger.info(f"Saved feature extractor to {extractor_path}")
    
    # Save metadata
    metadata = {
        'trained_at': datetime.now().isoformat(),
        'csv_path': args.csv,
        'training_time_seconds': training_time,
        **metrics
    }
    metadata_path = output_dir / 'metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved metadata to {metadata_path}")
    
    logger.info("=" * 60)
    logger.info("Training Complete!")
    logger.info(f"  Model saved to: {output_dir}")
    logger.info(f"  Training time: {training_time:.1f}s")
    logger.info(f"  Epochs run: {metrics['epochs_run']}")
    logger.info(f"  Test RMSE: ₱{metrics['test_rmse_php']:.2f}")
    logger.info(f"  Test MAE: ₱{metrics['test_mae_php']:.2f}")
    logger.info("=" * 60)


if __name__ == '__main__':
    main()
