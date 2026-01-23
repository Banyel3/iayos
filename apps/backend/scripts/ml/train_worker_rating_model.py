#!/usr/bin/env python
"""
Standalone Training Script for Worker Profile Rating Model

This script trains the Worker Rating LSTM model locally and saves the artifacts
to the ml_models directory. The trained model files can then be copied to the
Docker container.

Usage:
    python scripts/train_worker_rating_model.py

The model will be saved to apps/backend/src/ml_models/ directory.
After training, copy the model files to the Docker container:
    docker cp apps/backend/src/ml_models/worker_rating_model.keras iayos-backend-dev:/app/apps/backend/src/ml_models/
    docker cp apps/backend/src/ml_models/worker_rating_extractor.pkl iayos-backend-dev:/app/apps/backend/src/ml_models/
    docker cp apps/backend/src/ml_models/worker_rating_config.pkl iayos-backend-dev:/app/apps/backend/src/ml_models/
"""

import os
import sys
import logging
from datetime import datetime

# Add the backend src directory to path for imports
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)  # iayos root
BACKEND_SRC = os.path.join(PROJECT_ROOT, 'apps', 'backend', 'src')
sys.path.insert(0, BACKEND_SRC)

# Now we can import from ml module
# IMPORTANT: These imports must come from the ml module (not defined locally)
# for pickle compatibility when loading in Docker container
from ml.worker_rating_feature_engineering import (
    WorkerRatingFeatureExtractor,
    WorkerRatingDatasetBuilder
)
from ml.worker_rating_model import (
    WorkerRatingModelConfig,
    build_worker_rating_model,
    save_worker_rating_model
)
from ml.worker_rating_training import WorkerRatingTrainingPipeline

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Main training function."""
    print("=" * 70)
    print("Worker Profile Rating Model Training Script")
    print("=" * 70)
    
    # Configuration
    CSV_PATH = os.path.join(PROJECT_ROOT, 'Datasets', 'global_freelancers_raw.csv')
    MODEL_DIR = os.path.join(BACKEND_SRC, 'ml_models')
    
    # Check CSV exists
    if not os.path.exists(CSV_PATH):
        print(f"❌ ERROR: CSV file not found at {CSV_PATH}")
        print("Please ensure the dataset file exists.")
        sys.exit(1)
    
    print(f"\n📂 CSV Path: {CSV_PATH}")
    print(f"📂 Model Output: {MODEL_DIR}")
    
    # Create model directory
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Training configuration
    config = WorkerRatingModelConfig(
        input_dim=43,  # Will be updated by pipeline
        lstm_units_1=64,
        lstm_units_2=32,
        dense_units=16,
        dropout_rate=0.2,
        learning_rate=0.001,
        output_dim=1
    )
    
    print(f"\n🔧 Model Configuration:")
    print(f"   - LSTM Layer 1: {config.lstm_units_1} units")
    print(f"   - LSTM Layer 2: {config.lstm_units_2} units")
    print(f"   - Dense Layer: {config.dense_units} units")
    print(f"   - Dropout: {config.dropout_rate}")
    print(f"   - Learning Rate: {config.learning_rate}")
    
    # Training parameters
    EPOCHS = 100
    BATCH_SIZE = 32
    
    print(f"\n📊 Training Parameters:")
    print(f"   - Max Epochs: {EPOCHS}")
    print(f"   - Batch Size: {BATCH_SIZE}")
    print(f"   - Early Stopping Patience: 15 epochs")
    print(f"   - LR Reduction Patience: 7 epochs")
    
    # Initialize pipeline
    print("\n🚀 Initializing Training Pipeline...")
    pipeline = WorkerRatingTrainingPipeline(
        model_dir=MODEL_DIR,
        config=config
    )
    
    # Train model
    print("\n🏋️ Starting Training...")
    start_time = datetime.now()
    
    try:
        result = pipeline.train(
            csv_path=CSV_PATH,
            epochs=EPOCHS,
            batch_size=BATCH_SIZE,
            include_db=False,  # CSV only for training
            verbose=1
        )
    except Exception as e:
        print(f"\n❌ Training failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    training_time = (datetime.now() - start_time).total_seconds()
    
    # Print results
    print("\n" + "=" * 70)
    print("Training Results")
    print("=" * 70)
    
    if result.get('success'):
        print(f"\n✅ Training completed successfully!")
        print(f"\n📈 Dataset Statistics:")
        print(f"   - Training samples: {result['training_samples']}")
        print(f"   - Validation samples: {result['validation_samples']}")
        print(f"   - Test samples: {result['test_samples']}")
        print(f"   - Feature dimension: {result['feature_dim']}")
        
        print(f"\n📊 Training Metrics:")
        metrics = result['metrics']
        print(f"   - Epochs trained: {result['epochs_trained']}")
        print(f"   - Training time: {training_time:.1f} seconds")
        
        print(f"\n📉 Final Losses:")
        print(f"   - Train Loss (MSE): {metrics['train_loss']:.4f}")
        print(f"   - Train MAE: {metrics['train_mae']:.2f} score units")
        print(f"   - Val Loss (MSE): {metrics['val_loss']:.4f}")
        print(f"   - Val MAE: {metrics['val_mae']:.2f} score units")
        
        print(f"\n🎯 Test Set Performance:")
        print(f"   - Test Loss (MSE): {metrics['test_loss']:.4f}")
        print(f"   - Test MAE: {metrics['test_mae']:.2f} score units")
        print(f"   - Test RMSE: {metrics['test_rmse']:.2f} score units")
        
        print(f"\n💾 Model Files Saved to: {MODEL_DIR}")
        print("   - worker_rating_model.keras (model weights)")
        print("   - worker_rating_extractor.pkl (feature extractor)")
        print("   - worker_rating_config.pkl (configuration)")
        print("   - worker_rating_history.json (training history)")
        
        # Calculate file sizes
        model_path = os.path.join(MODEL_DIR, 'worker_rating_model.keras')
        if os.path.exists(model_path):
            model_size = os.path.getsize(model_path) / 1024
            print(f"\n📦 Model Size: {model_size:.2f} KB")
        
        print("\n" + "-" * 70)
        print("🐳 To copy model to Docker container, run:")
        print("-" * 70)
        print(f"docker cp {MODEL_DIR}/worker_rating_model.keras iayos-backend-dev:/app/apps/backend/src/ml_models/")
        print(f"docker cp {MODEL_DIR}/worker_rating_extractor.pkl iayos-backend-dev:/app/apps/backend/src/ml_models/")
        print(f"docker cp {MODEL_DIR}/worker_rating_config.pkl iayos-backend-dev:/app/apps/backend/src/ml_models/")
        
    else:
        print(f"\n❌ Training failed: {result.get('error', 'Unknown error')}")
        sys.exit(1)
    
    print("\n" + "=" * 70)
    print("Training Complete!")
    print("=" * 70)


if __name__ == '__main__':
    main()
