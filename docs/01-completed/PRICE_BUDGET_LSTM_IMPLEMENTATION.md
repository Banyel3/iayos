# Price Budget LSTM Model Implementation ✅

**Status**: ✅ COMPLETE  
**Date**: December 11, 2025  
**Type**: Machine Learning Feature - Price Budget Prediction

## Overview

LSTM neural network model that predicts price ranges (min, suggested, max) for job postings based on category, title, description, urgency, and skill level. All prices are in PHP (Philippine Peso).

## Architecture

The system uses a **microservice architecture** for ML predictions:

```
┌─────────────────────┐     ┌───────────────────────┐
│   Main Backend      │────▶│    ML Microservice    │
│   (Alpine Linux)    │     │   (Debian + TensorFlow)│
│   Port 8000         │     │   Port 8002           │
│   - No TensorFlow   │     │   - Full TensorFlow   │
│   - Proxies to ML   │     │   - Runs LSTM model   │
└─────────────────────┘     └───────────────────────┘
```

**Why two containers?**

- TensorFlow requires glibc (not available on Alpine Linux)
- Main backend uses Alpine for smaller image size
- ML service uses Debian slim for TensorFlow compatibility

## Implementation Summary

### Files Created

1. **`ml/price_feature_engineering.py`** (547 lines)
   - `PriceFeatureExtractor` class for feature extraction
   - `PriceDatasetBuilder` class for preparing training data
   - `CURRENCY_TO_PHP` dictionary for currency conversion
   - 60 total features: text (5) + metadata (3) + tag basic (2) + category one-hot (30) + tag one-hot (20)

2. **`ml/price_model.py`** (280 lines)
   - `PriceModelConfig` dataclass with model hyperparameters
   - `build_price_lstm_model()` - Creates LSTM architecture
   - `save_price_model()` / `load_price_model()` - Model persistence
   - `predict_price_range()` - Make predictions

3. **`ml/price_training.py`** (285 lines)
   - `PriceTrainingPipeline` class with complete training workflow
   - Supports CSV and database data sources
   - Implements early stopping, learning rate reduction, and model checkpointing

4. **`scripts/train_price_model.py`** (286 lines)
   - Standalone training script
   - Imports `PriceFeatureExtractor` from ml module for pickle compatibility
   - Model saved to `ml/saved_models/price_budget_lstm/`

5. **`ml/management/commands/train_price_budget.py`** (186 lines)
   - Django management command: `python manage.py train_price_budget`

### API Endpoints

| Endpoint                     | Method | Description                  |
| ---------------------------- | ------ | ---------------------------- |
| `/api/ml/predict-price`      | POST   | Predict price range for job  |
| `/api/ml/price-model-status` | GET    | Get model status and metrics |
| `/api/ml/train-price-model`  | POST   | Trigger model training       |

### Model Architecture

```
Input(60 features) → LSTM(64, dropout=0.2) → LSTM(32) → Dense(16, ReLU) → Dropout(0.2) → Dense(3)
                                                                                          ↓
                                                                              [min_price, suggested_price, max_price]
```

- **Input**: 60 features (text stats, urgency, skill level, category one-hot, tag one-hot)
- **Output**: 3 values (min, suggested, max prices in log scale)
- **Parameters**: 44,995 trainable parameters (175.76 KB)

## Training Results

**Dataset**: `Datasets/freelancer_job_postings.csv`

- Total rows: 9,196
- Fixed-price jobs: 7,322
- Valid samples after processing: 7,321
- Split: Train (5,125) / Validation (1,098) / Test (1,098)

**Training Metrics**:

- Epochs run: 47 (early stopping)
- Training time: 22 seconds
- Best validation loss: 2.31 (epoch 37)

**Test Set Metrics**:
| Output | RMSE (PHP) | MAE (PHP) | MAPE |
|--------|-----------|----------|------|
| min_price | ₱70,215 | ₱13,193 | 133.9% |
| suggested_price | ₱115,641 | ₱22,221 | 174.4% |
| max_price | ₱161,857 | ₱31,579 | 190.4% |

**Overall Test Metrics**:

- Combined RMSE: ₱121,793
- Combined MAE: ₱22,331

> Note: High MAPE is expected since freelancer prices vary enormously (from $20 to $50,000+ USD). The model provides reasonable guidance for typical job postings.

## Usage

### API Request

```bash
curl -X POST http://localhost:8000/api/ml/predict-price \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build a responsive e-commerce website",
    "description": "Need a full stack developer to build an e-commerce website...",
    "category": "Web Development",
    "tags": ["php", "mysql", "javascript"],
    "urgency": "MEDIUM",
    "skill_level": "INTERMEDIATE"
  }'
```

### API Response

```json
{
  "min_price": 1579.85,
  "suggested_price": 4122.69,
  "max_price": 6379.05,
  "confidence": 0.3,
  "currency": "PHP",
  "source": "ml_service"
}
```

### Source Values

| Source       | Description                                           |
| ------------ | ----------------------------------------------------- |
| `model`      | Local TensorFlow model (if available on main backend) |
| `ml_service` | ML microservice at port 8002 (recommended)            |
| `fallback`   | Database category averages (when ML unavailable)      |

### Priority Order

1. **Local TensorFlow** - If TensorFlow is available on main backend
2. **ML Microservice** - Proxy to http://ml:8002 (Debian container with TensorFlow)
3. **Database Fallback** - Use category averages from Specializations table

## Feature Engineering

### Text Features (5)

- `title_length` - Character count of title
- `title_word_count` - Word count of title
- `description_length` - Character count of description
- `description_word_count` - Word count of description
- `total_text_length` - Combined text length

### Metadata Features (3)

- `urgency` - Encoded as LOW=0, MEDIUM=1, HIGH=2
- `skill_level` - Encoded as ENTRY=0, INTERMEDIATE=1, EXPERT=2
- `tag_count` - Number of tags/skills

### Category One-Hot (30 features)

- Top 30 job categories from training data
- Unknown categories map to zeros

### Tag One-Hot (20 features)

- Top 20 most common tags from training data
- Other tags are ignored

## Currency Conversion

All prices converted to PHP using static exchange rates:

```python
CURRENCY_TO_PHP = {
    'USD': 56.50,
    'EUR': 61.00,
    'GBP': 71.00,
    'AUD': 37.00,
    'PHP': 1.0,
    # ... more currencies
}
```

## Known Limitations

1. **Container Architecture**: Requires ML microservice (Debian) to run the model. Main backend (Alpine) cannot run TensorFlow.

2. **High Price Variance**: Freelancer job prices have enormous variance ($20 to $50,000+), making precise predictions difficult. The model provides ranges rather than exact prices.

3. **Currency Rates**: Static exchange rates may drift over time. Consider updating `CURRENCY_TO_PHP` periodically.

4. **Category Coverage**: Limited to top 30 categories and top 20 tags from training data.

5. **Pickle Compatibility**: The `feature_extractor.pkl` must be created with the module-imported `PriceFeatureExtractor` class (not a local class definition).

## Docker Configuration

The ML service is defined in `docker-compose.dev.yml`:

```yaml
ml:
  build:
    context: .
    dockerfile: Dockerfile.ml
    target: ml-development
  container_name: iayos-ml-dev
  ports:
    - "8002:8002"
  volumes:
    - ./apps/backend/src:/app/src
    - ml-models:/app/src/ml/saved_models
  depends_on:
    - backend
```

And in `Dockerfile.ml`:

- Uses `python:3.12-slim` (Debian) for TensorFlow compatibility
- Installs `requirements-ml.txt` which includes TensorFlow

## Re-Training

### Local Training (Recommended)

```powershell
# Activate Python environment with TensorFlow
C:/Users/User/.virtualenvs/backend-u05thGBA/Scripts/python.exe scripts/train_price_model.py --epochs 50

# Copy model to ML container
docker cp apps/backend/src/ml/saved_models/price_budget_lstm iayos-ml-dev:/app/src/ml/saved_models/
```

### Inside ML Container

```bash
# The ML container has TensorFlow installed
docker exec -it iayos-ml-dev python src/manage.py train_price_budget --csv /path/to/csv --epochs 100
```

## Starting the ML Service

```powershell
# Start the ML container (if not running)
docker start iayos-ml-dev

# Or start with docker-compose
docker-compose -f docker-compose.dev.yml up ml
```

The ML service runs on port 8002 and is automatically used by the main backend for price predictions.

## Model Files

Location: `ml/saved_models/price_budget_lstm/`

| File                    | Size   | Description                    |
| ----------------------- | ------ | ------------------------------ |
| `model.keras`           | 580 KB | Trained Keras model            |
| `feature_extractor.pkl` | 1 KB   | Fitted feature extractor       |
| `metadata.json`         | 800 B  | Training metrics and timestamp |

**IMPORTANT**: The `feature_extractor.pkl` must be created using the script that imports `PriceFeatureExtractor` from `ml.price_feature_engineering` for pickle compatibility.

## Future Improvements

1. **TensorFlow Lite**: Convert model to TFLite format for lightweight inference
2. **ONNX Runtime**: Alternative inference engine that works on Alpine
3. **More Training Data**: Include iAyos platform job data
4. **Dynamic Currency Rates**: Fetch from external API
5. **Confidence Calibration**: Improve confidence score estimation
6. **Category Embeddings**: Replace one-hot with learned embeddings
