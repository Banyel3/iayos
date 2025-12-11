"""
LSTM Model Architecture for Price Budget Prediction

This module defines:
1. LSTM neural network architecture for price prediction (min, suggested, max)
2. Model configuration and hyperparameters
3. Model saving/loading utilities
"""

import os
import json
import logging
from typing import Dict, Tuple, Optional, Any
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)


class PriceModelConfig:
    """Configuration for the Price LSTM model."""
    
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
    SEQUENCE_LENGTH = 1  # Single timestep for tabular data
    
    # Output configuration
    OUTPUT_DIM = 3  # min_price, suggested_price, max_price
    
    # Paths
    MODEL_DIR = Path(__file__).parent / 'saved_models' / 'price_budget_lstm'
    MODEL_NAME = 'price_budget_lstm'
    
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
            'output_dim': cls.OUTPUT_DIM,
        }


def build_price_lstm_model(input_dim: int, config: PriceModelConfig = PriceModelConfig):
    """
    Build the LSTM model for price prediction.
    
    Architecture:
    - Input: (batch_size, sequence_length, features)
    - LSTM layer 1: 64 units with dropout
    - LSTM layer 2: 32 units
    - Dense: 16 units
    - Output: 3 units (min_price, suggested_price, max_price in log scale)
    
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
        
        # Output layer (3 values: log-transformed min, suggested, max)
        layers.Dense(config.OUTPUT_DIM)
    ])
    
    # Compile with Adam optimizer
    optimizer = keras.optimizers.Adam(learning_rate=config.LEARNING_RATE)
    
    model.compile(
        optimizer=optimizer,
        loss='mse',
        metrics=['mae']
    )
    
    logger.info(f"Built Price LSTM model with input dim: {input_dim}")
    model.summary(print_fn=logger.info)
    
    return model


def save_price_model(model, feature_extractor, metadata: Dict[str, Any]) -> str:
    """
    Save the trained model and associated artifacts.
    
    Args:
        model: Trained Keras model
        feature_extractor: Fitted PriceFeatureExtractor
        metadata: Training metadata (metrics, timestamps, etc.)
        
    Returns:
        Path to saved model directory
    """
    import pickle
    
    model_dir = PriceModelConfig.MODEL_DIR
    model_dir.mkdir(parents=True, exist_ok=True)
    
    # Save Keras model
    model_path = model_dir / 'model.keras'
    model.save(model_path)
    logger.info(f"Saved model to {model_path}")
    
    # Save feature extractor
    extractor_path = model_dir / 'feature_extractor.pkl'
    with open(extractor_path, 'wb') as f:
        pickle.dump(feature_extractor, f)
    logger.info(f"Saved feature extractor to {extractor_path}")
    
    # Save metadata
    metadata_path = model_dir / 'metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2, default=str)
    logger.info(f"Saved metadata to {metadata_path}")
    
    return str(model_dir)


def load_price_model() -> Tuple[Optional[Any], Optional[Any], Optional[Dict]]:
    """
    Load the trained model and associated artifacts.
    
    Returns:
        Tuple of (model, feature_extractor, metadata) or (None, None, None) if not found
    """
    import pickle
    
    # Import PriceFeatureExtractor BEFORE unpickling to ensure the class is available
    from ml.price_feature_engineering import PriceFeatureExtractor
    
    model_dir = PriceModelConfig.MODEL_DIR
    
    if not model_dir.exists():
        logger.warning(f"Model directory not found: {model_dir}")
        return None, None, None
    
    try:
        import tensorflow as tf
        
        # Load Keras model
        model_path = model_dir / 'model.keras'
        if not model_path.exists():
            logger.warning(f"Model file not found: {model_path}")
            return None, None, None
            
        model = tf.keras.models.load_model(model_path)
        logger.info(f"Loaded model from {model_path}")
        
        # Load feature extractor
        extractor_path = model_dir / 'feature_extractor.pkl'
        feature_extractor = None
        if extractor_path.exists():
            with open(extractor_path, 'rb') as f:
                feature_extractor = pickle.load(f)
            logger.info(f"Loaded feature extractor from {extractor_path}")
        
        # Load metadata
        metadata_path = model_dir / 'metadata.json'
        metadata = {}
        if metadata_path.exists():
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            logger.info(f"Loaded metadata from {metadata_path}")
        
        return model, feature_extractor, metadata
        
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return None, None, None


def predict_price_range(
    model,
    feature_extractor,
    category_id: Optional[int] = None,
    title: str = "",
    description: str = "",
    urgency: str = "MEDIUM",
    skill_level: str = "INTERMEDIATE",
    materials: list = None
) -> Dict[str, float]:
    """
    Predict price range for a job.
    
    Args:
        model: Trained Keras model
        feature_extractor: Fitted PriceFeatureExtractor
        category_id: Category/specialization ID
        title: Job title
        description: Job description
        urgency: Urgency level (LOW/MEDIUM/HIGH)
        skill_level: Skill level (ENTRY/INTERMEDIATE/EXPERT)
        materials: List of materials needed
        
    Returns:
        Dictionary with min_price, suggested_price, max_price, confidence
    """
    if materials is None:
        materials = []
    
    # Build features manually
    text_features = feature_extractor.extract_text_features(title, description)
    
    urgency_val = feature_extractor.URGENCY_MAPPING.get(urgency, 1) / 2.0
    skill_val = feature_extractor.SKILL_LEVEL_MAPPING.get(skill_level, 1) / 2.0
    materials_count = min(len(materials), 10) / 10.0
    
    metadata_features = np.array([urgency_val, skill_val, materials_count], dtype=np.float32)
    
    tag_features = np.array([
        1.0 if materials else 0.0,
        min(len(materials), 10) / 10.0,
    ] + [0.0] * 20, dtype=np.float32)
    
    category_features = feature_extractor.extract_category_features(category_id)
    
    # Combine features
    features = np.concatenate([
        text_features,
        metadata_features,
        tag_features[:2],
        category_features,
        tag_features[2:],
    ])
    
    # Reshape for LSTM: (batch, sequence, features)
    X = features.reshape(1, PriceModelConfig.SEQUENCE_LENGTH, -1)
    
    # Predict
    y_pred = model.predict(X, verbose=0)
    
    # Convert from log scale
    min_price = np.expm1(y_pred[0, 0])
    suggested_price = np.expm1(y_pred[0, 1])
    max_price = np.expm1(y_pred[0, 2])
    
    # Ensure logical ordering
    min_price = max(100, min_price)  # Minimum 100 PHP
    max_price = max(max_price, suggested_price * 1.1)
    min_price = min(min_price, suggested_price * 0.9)
    
    # Simple confidence based on prediction spread
    spread = (max_price - min_price) / suggested_price if suggested_price > 0 else 1.0
    confidence = max(0.3, min(0.95, 1.0 - spread))
    
    return {
        'min_price': round(float(min_price), 2),
        'suggested_price': round(float(suggested_price), 2),
        'max_price': round(float(max_price), 2),
        'confidence': round(float(confidence), 2),
        'currency': 'PHP'
    }
