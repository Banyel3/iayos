"""
Worker Profile Rating LSTM Model Architecture

This module defines:
1. WorkerRatingModelConfig - Configuration dataclass
2. build_worker_rating_model - Model architecture builder
3. save/load functions for model persistence
"""

import os
import pickle
import logging
from dataclasses import dataclass, asdict
from typing import Optional, Tuple

import tensorflow as tf
from tensorflow import keras
from keras import layers, Model

logger = logging.getLogger(__name__)


@dataclass
class WorkerRatingModelConfig:
    """
    Configuration for Worker Rating LSTM Model.
    
    Attributes:
        input_dim: Number of input features (43 from feature extractor)
        lstm_units_1: Units in first LSTM layer
        lstm_units_2: Units in second LSTM layer
        dense_units: Units in dense layer before output
        dropout_rate: Dropout rate for regularization
        learning_rate: Adam optimizer learning rate
        output_dim: Output dimension (1 for single score)
    """
    input_dim: int = 43  # 12 base features + 20 countries + 11 skills
    lstm_units_1: int = 64
    lstm_units_2: int = 32
    dense_units: int = 16
    dropout_rate: float = 0.2
    learning_rate: float = 0.001
    output_dim: int = 1  # Single profile score
    
    def to_dict(self):
        return asdict(self)
    
    @classmethod
    def from_dict(cls, d: dict) -> 'WorkerRatingModelConfig':
        return cls(**d)


def build_worker_rating_model(config: WorkerRatingModelConfig) -> Model:
    """
    Build LSTM model for worker profile rating prediction.
    
    Architecture:
        Input (batch, input_dim) 
        → Reshape (batch, 1, input_dim)  # Add time dimension for LSTM
        → LSTM (64 units, return_sequences=True, dropout=0.2)
        → LSTM (32 units, dropout=0.2)
        → Dense (16 units, ReLU)
        → Dropout (0.2)
        → Dense (1 unit, Sigmoid * 100)  # Output 0-100 score
    
    Args:
        config: WorkerRatingModelConfig with model parameters
        
    Returns:
        Compiled Keras Model
    """
    # Input layer
    inputs = keras.Input(shape=(config.input_dim,), name='worker_features')
    
    # Reshape for LSTM (add timestep dimension)
    # Shape: (batch_size, 1, input_dim)
    x = layers.Reshape((1, config.input_dim))(inputs)
    
    # First LSTM layer with dropout
    x = layers.LSTM(
        config.lstm_units_1,
        return_sequences=True,
        dropout=config.dropout_rate,
        recurrent_dropout=config.dropout_rate / 2,
        name='lstm_1'
    )(x)
    
    # Second LSTM layer
    x = layers.LSTM(
        config.lstm_units_2,
        return_sequences=False,
        dropout=config.dropout_rate,
        recurrent_dropout=config.dropout_rate / 2,
        name='lstm_2'
    )(x)
    
    # Dense layer with ReLU
    x = layers.Dense(
        config.dense_units,
        activation='relu',
        name='dense_hidden'
    )(x)
    
    # Dropout for regularization
    x = layers.Dropout(config.dropout_rate)(x)
    
    # Output layer - sigmoid scaled to 0-100
    # Using sigmoid activation and multiplying by 100 for score range
    output_raw = layers.Dense(1, activation='sigmoid', name='output_raw')(x)
    output = layers.Lambda(lambda x: x * 100.0, name='profile_score')(output_raw)
    
    # Build model
    model = Model(inputs=inputs, outputs=output, name='worker_rating_model')
    
    # Compile with MSE loss for regression
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=config.learning_rate),
        loss='mse',
        metrics=['mae']
    )
    
    return model


def save_worker_rating_model(
    model: Model,
    feature_extractor,
    config: WorkerRatingModelConfig,
    model_dir: str = 'ml_models'
) -> str:
    """
    Save model, feature extractor, and config to disk.
    
    Args:
        model: Trained Keras model
        feature_extractor: Fitted WorkerRatingFeatureExtractor
        config: Model configuration
        model_dir: Directory to save files
        
    Returns:
        Path to saved model directory
    """
    os.makedirs(model_dir, exist_ok=True)
    
    # Save model weights
    model_path = os.path.join(model_dir, 'worker_rating_model.keras')
    model.save(model_path)
    logger.info(f"Saved model to {model_path}")
    
    # Save feature extractor (must be imported from same module for pickle compatibility)
    extractor_path = os.path.join(model_dir, 'worker_rating_extractor.pkl')
    with open(extractor_path, 'wb') as f:
        pickle.dump(feature_extractor, f)
    logger.info(f"Saved feature extractor to {extractor_path}")
    
    # Save config
    config_path = os.path.join(model_dir, 'worker_rating_config.pkl')
    with open(config_path, 'wb') as f:
        pickle.dump(config.to_dict(), f)
    logger.info(f"Saved config to {config_path}")
    
    return model_dir


def load_worker_rating_model(
    model_dir: str = 'ml_models'
) -> Tuple[Optional[Model], Optional[object], Optional[WorkerRatingModelConfig]]:
    """
    Load model, feature extractor, and config from disk.
    
    Args:
        model_dir: Directory containing saved files
        
    Returns:
        Tuple of (model, feature_extractor, config) or (None, None, None) if not found
    """
    model_path = os.path.join(model_dir, 'worker_rating_model.keras')
    extractor_path = os.path.join(model_dir, 'worker_rating_extractor.pkl')
    config_path = os.path.join(model_dir, 'worker_rating_config.pkl')
    
    # Check all files exist
    if not all(os.path.exists(p) for p in [model_path, extractor_path, config_path]):
        logger.warning(f"Model files not found in {model_dir}")
        return None, None, None
    
    try:
        # Load model
        model = keras.models.load_model(model_path)
        logger.info(f"Loaded model from {model_path}")
        
        # Load feature extractor
        with open(extractor_path, 'rb') as f:
            feature_extractor = pickle.load(f)
        logger.info(f"Loaded feature extractor from {extractor_path}")
        
        # Load config
        with open(config_path, 'rb') as f:
            config_dict = pickle.load(f)
        config = WorkerRatingModelConfig.from_dict(config_dict)
        logger.info(f"Loaded config from {config_path}")
        
        return model, feature_extractor, config
        
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return None, None, None


def get_worker_rating_model_summary(config: WorkerRatingModelConfig) -> dict:
    """
    Get model architecture summary without building full model.
    
    Args:
        config: Model configuration
        
    Returns:
        Dictionary with model summary info
    """
    return {
        'name': 'Worker Profile Rating LSTM',
        'version': '1.0',
        'architecture': [
            f'Input: ({config.input_dim},)',
            f'Reshape: (1, {config.input_dim})',
            f'LSTM: {config.lstm_units_1} units (return_sequences=True)',
            f'LSTM: {config.lstm_units_2} units',
            f'Dense: {config.dense_units} units (ReLU)',
            f'Dropout: {config.dropout_rate}',
            'Dense: 1 unit (Sigmoid * 100)'
        ],
        'output': 'Profile score 0-100',
        'loss': 'MSE',
        'optimizer': f'Adam (lr={config.learning_rate})',
        'trainable_params': _estimate_params(config)
    }


def _estimate_params(config: WorkerRatingModelConfig) -> int:
    """Estimate total trainable parameters."""
    # LSTM 1: 4 * ((input_dim + lstm1) * lstm1 + lstm1) for each gate
    lstm1_params = 4 * ((config.input_dim + config.lstm_units_1) * config.lstm_units_1 + config.lstm_units_1)
    
    # LSTM 2: 4 * ((lstm1 + lstm2) * lstm2 + lstm2)
    lstm2_params = 4 * ((config.lstm_units_1 + config.lstm_units_2) * config.lstm_units_2 + config.lstm_units_2)
    
    # Dense hidden: lstm2 * dense + dense
    dense_params = config.lstm_units_2 * config.dense_units + config.dense_units
    
    # Output: dense * 1 + 1
    output_params = config.dense_units + 1
    
    return lstm1_params + lstm2_params + dense_params + output_params
