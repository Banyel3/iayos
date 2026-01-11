# iAyos AI/ML Models Documentation

**Last Updated**: December 2025  
**Status**: Production Ready  
**Author**: iAyos Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Model 1: Job Completion Time Prediction](#model-1-job-completion-time-prediction)
4. [Model 2: Price Budget Prediction](#model-2-price-budget-prediction)
5. [Model 3: Worker Profile Rating Prediction](#model-3-worker-profile-rating-prediction)
6. [Feature Engineering](#feature-engineering)
7. [Training Pipeline](#training-pipeline)
8. [API Endpoints](#api-endpoints)
9. [Deployment & Infrastructure](#deployment--infrastructure)
10. [Retraining Guide](#retraining-guide)

---

## Overview

The iAyos platform implements three LSTM (Long Short-Term Memory) neural network models for predictive analytics:

| Model                         | Purpose                            | Output                           | Status        |
| ----------------------------- | ---------------------------------- | -------------------------------- | ------------- |
| **Completion Time Predictor** | Estimates how long a job will take | Hours (with confidence interval) | ✅ Production |
| **Price Budget Predictor**    | Recommends price range for jobs    | Min/Suggested/Max (PHP)          | ✅ Production |
| **Worker Profile Rating**     | Scores worker profile quality      | Score 0-100 + Suggestions        | ✅ Production |

All models use **TensorFlow 2.20.0** with the Keras Sequential API.

---

## Architecture

### Microservice Architecture

```
┌─────────────────────────┐         ┌─────────────────────────┐
│   Main Backend          │         │   ML Microservice       │
│   (iayos-backend-dev)   │ ──────▶ │   (iayos-ml-dev)        │
│                         │  HTTP   │                         │
│   • Alpine Linux        │         │   • Debian slim         │
│   • Port 8000           │         │   • Port 8002           │
│   • Django + Ninja API  │         │   • TensorFlow 2.20     │
│   • No TensorFlow       │         │   • Full LSTM models    │
│   • Proxies ML requests │         │   • GPU-ready           │
└─────────────────────────┘         └─────────────────────────┘
```

**Why Two Containers?**

- TensorFlow requires glibc (unavailable on Alpine Linux)
- Main backend uses Alpine for smaller image (~200MB vs ~2GB)
- ML service uses Debian slim for TensorFlow compatibility
- Separation allows independent scaling of ML workloads

### Request Flow

1. Client sends prediction request to main backend (port 8000)
2. Main backend checks if TensorFlow is available locally
3. If not, proxies request to ML microservice (port 8002)
4. ML service runs LSTM model inference
5. Results returned to client with `source: "ml_service"`

### Fallback Behavior

When ML service is unavailable:

- **Completion Time**: Returns statistical estimate based on category averages
- **Price Budget**: Returns database category averages with urgency/skill multipliers

---

## Model 1: Job Completion Time Prediction

### Purpose

Predicts how long a job will take to complete based on job characteristics and worker history.

### Model Architecture

```
Input(43 features)
    ↓
LSTM(64 units, return_sequences=True, dropout=0.2, L2=0.01)
    ↓
LSTM(32 units, dropout=0.2, L2=0.01)
    ↓
Dense(16 units, activation='relu', L2=0.01)
    ↓
Dropout(0.2)
    ↓
Dense(1 unit) → Output: log(hours)
```

### Hyperparameters

| Parameter                 | Value | Description                                |
| ------------------------- | ----- | ------------------------------------------ |
| `LSTM_UNITS_1`            | 64    | First LSTM layer units                     |
| `LSTM_UNITS_2`            | 32    | Second LSTM layer units                    |
| `DENSE_UNITS`             | 16    | Dense layer units                          |
| `DROPOUT_RATE`            | 0.2   | Dropout for regularization                 |
| `LEARNING_RATE`           | 0.001 | Adam optimizer learning rate               |
| `BATCH_SIZE`              | 32    | Training batch size                        |
| `EPOCHS`                  | 100   | Maximum training epochs                    |
| `EARLY_STOPPING_PATIENCE` | 10    | Epochs without improvement before stopping |
| `L2_REGULARIZATION`       | 0.01  | Weight regularization factor               |
| `SEQUENCE_LENGTH`         | 1     | Input sequence length (tabular data)       |

### Optimizer & Loss

```python
optimizer = keras.optimizers.Adam(learning_rate=0.001)
model.compile(
    optimizer=optimizer,
    loss='mse',           # Mean Squared Error
    metrics=['mae']       # Mean Absolute Error
)
```

### Training Callbacks

1. **EarlyStopping**: Stops training when validation loss stops improving
   - Monitor: `val_loss`
   - Patience: 10 epochs
   - Restore best weights: True

2. **ReduceLROnPlateau**: Reduces learning rate when loss plateaus
   - Monitor: `val_loss`
   - Factor: 0.5 (halves learning rate)
   - Patience: 5 epochs
   - Minimum LR: 1e-6

### Input Features (43 total)

**Job Features (37 features):**

| Feature                  | Type   | Range | Description                           |
| ------------------------ | ------ | ----- | ------------------------------------- |
| `budget_normalized`      | Float  | 0-1   | Job budget / 100,000                  |
| `urgency_value`          | Int    | 0-2   | LOW=0, MEDIUM=1, HIGH=2               |
| `materials_count`        | Int    | 0-10  | Number of required materials (capped) |
| `job_type`               | Int    | 0-1   | LISTING=0, INVITE=1                   |
| `category_one_hot[0-29]` | Binary | 0/1   | 30-dimensional category encoding      |
| `day_of_week`            | Float  | 0-1   | Weekday / 6                           |
| `hour_of_day`            | Float  | 0-1   | Hour / 23                             |
| `month_of_year`          | Float  | 0-1   | (Month - 1) / 11                      |

**Worker History Features (6 features):**

| Feature                 | Type  | Range | Description                   |
| ----------------------- | ----- | ----- | ----------------------------- |
| `completed_normalized`  | Float | 0-1   | Completed jobs / 100          |
| `rating_normalized`     | Float | 0-1   | Average rating / 5            |
| `earnings_normalized`   | Float | 0-1   | Total earnings / 100,000      |
| `specs_normalized`      | Float | 0-1   | Specializations count / 10    |
| `experience_normalized` | Float | 0-1   | Average experience years / 20 |
| `profile_completion`    | Float | 0-1   | Profile completion % / 100    |

### Target Variable

- **Raw**: Completion time in hours
- **Transformed**: `log1p(hours)` for better distribution
- **Inverse**: `expm1(prediction)` to get original scale

### Training Data Source

Jobs from Django ORM with:

- `status = 'COMPLETED'`
- Valid timestamps (`clientConfirmedWorkStartedAt` or `escrowPaidAt`, `workerMarkedCompleteAt` or `completedAt`)
- Completion time calculated as: `end_time - start_time`
- Minimum: 0.5 hours, Maximum: 720 hours (30 days)

### Files

| File                       | Lines | Description                                         |
| -------------------------- | ----- | --------------------------------------------------- |
| `ml/models.py`             | 459   | Model architecture, `CompletionTimePredictor` class |
| `ml/data_preprocessing.py` | 395   | `JobFeatureExtractor`, `DatasetBuilder`             |
| `ml/training.py`           | 334   | `TrainingPipeline` class                            |
| `ml/prediction_service.py` | ~300  | Prediction logic, caching, fallback                 |

---

## Model 2: Price Budget Prediction

### Purpose

Predicts recommended price range (min, suggested, max) for job postings based on category, title, description, urgency, and skill level.

### Model Architecture

```
Input(60 features)
    ↓
LSTM(64 units, return_sequences=True, dropout=0.2, recurrent_dropout=0.2, L2=0.01)
    ↓
LSTM(32 units, dropout=0.2, L2=0.01)
    ↓
Dense(16 units, activation='relu', L2=0.01)
    ↓
Dropout(0.2)
    ↓
Dense(3 units) → Output: [log(min_price), log(suggested_price), log(max_price)]
```

### Hyperparameters

| Parameter                 | Value | Description                                |
| ------------------------- | ----- | ------------------------------------------ |
| `LSTM_UNITS_1`            | 64    | First LSTM layer units                     |
| `LSTM_UNITS_2`            | 32    | Second LSTM layer units                    |
| `DENSE_UNITS`             | 16    | Dense layer units                          |
| `DROPOUT_RATE`            | 0.2   | Dropout for regularization                 |
| `LEARNING_RATE`           | 0.001 | Adam optimizer learning rate               |
| `BATCH_SIZE`              | 32    | Training batch size                        |
| `EPOCHS`                  | 100   | Maximum training epochs                    |
| `EARLY_STOPPING_PATIENCE` | 10    | Epochs without improvement before stopping |
| `L2_REGULARIZATION`       | 0.01  | Weight regularization factor               |
| `SEQUENCE_LENGTH`         | 1     | Input sequence length                      |
| `OUTPUT_DIM`              | 3     | min, suggested, max prices                 |

### Optimizer & Loss

```python
optimizer = keras.optimizers.Adam(learning_rate=0.001)
model.compile(
    optimizer=optimizer,
    loss='mse',           # Mean Squared Error on log-transformed targets
    metrics=['mae']       # Mean Absolute Error
)
```

### Input Features (60 total)

**Text Features (5 features):**

| Feature                  | Calculation      | Description                                |
| ------------------------ | ---------------- | ------------------------------------------ |
| `title_length`           | len(title) / 100 | Normalized title length                    |
| `title_word_count`       | words / 20       | Normalized word count                      |
| `description_length`     | len(desc) / 5000 | Normalized description length (capped 10k) |
| `description_word_count` | words / 500      | Normalized word count (capped 2k)          |
| `avg_word_length`        | avg / 10         | Average word length (complexity indicator) |

**Metadata Features (3 features):**

| Feature           | Values      | Description                                |
| ----------------- | ----------- | ------------------------------------------ |
| `urgency`         | 0/1/2 → 0-1 | LOW=0, MEDIUM=1, HIGH=2 (normalized by /2) |
| `skill_level`     | 0/1/2 → 0-1 | ENTRY=0, INTERMEDIATE=1, EXPERT=2          |
| `materials_count` | count / 10  | Number of materials needed                 |

**Tag Features (22 features):**

| Feature             | Type      | Description             |
| ------------------- | --------- | ----------------------- |
| `has_tags`          | Binary    | Whether job has tags    |
| `tag_count`         | Float 0-1 | Number of tags / 10     |
| `tag_one_hot[0-19]` | Binary    | Top 20 most common tags |

**Category Features (30 features):**

| Feature                  | Type   | Description                      |
| ------------------------ | ------ | -------------------------------- |
| `category_one_hot[0-29]` | Binary | 30-dimensional category encoding |

### Target Variables

- **Raw**: `[min_price, suggested_price, max_price]` in PHP
- **Transformed**: `log1p([min, suggested, max])` for better distribution
- **Inverse**: `expm1(prediction)` to get original scale
- **Currency**: All values converted to PHP using exchange rates

### Currency Conversion Rates

```python
CURRENCY_TO_PHP = {
    'PHP': 1.0,    'USD': 56.0,   'EUR': 61.0,   'GBP': 71.0,
    'INR': 0.67,   'AUD': 36.0,   'SGD': 42.0,   'CAD': 41.0,
    'NZD': 33.0,   'JPY': 0.37,   'CNY': 7.7,    'KRW': 0.041,
    'MYR': 12.5,   'THB': 1.6,    'VND': 0.0022, 'IDR': 0.0035,
}
```

### Training Data Sources

**Primary: Freelancer CSV Dataset**

- File: `Datasets/freelancer_job_postings.csv`
- Total rows: 9,196
- Fixed-price jobs (used): 7,322
- Columns used: `job_title`, `job_description`, `tags`, `min_price`, `max_price`, `avg_price`, `currency`, `rate_type`

**Secondary: iAyos Database**

- Jobs with `status='COMPLETED'` and `budget > 0`
- For DB jobs, estimated as: `min = budget * 0.8`, `max = budget * 1.2`

### Training Results

| Metric               | Value               |
| -------------------- | ------------------- |
| Training samples     | 5,125               |
| Validation samples   | 1,098               |
| Test samples         | 1,098               |
| Epochs run           | 41 (early stopping) |
| Training time        | ~26 seconds         |
| **Test MAE**         | **₱20,945**         |
| **Test RMSE**        | **₱122,157**        |
| Trainable parameters | 44,995 (175.76 KB)  |

**Per-Output Metrics:**

| Output          | RMSE (PHP) | MAE (PHP) | MAPE   |
| --------------- | ---------- | --------- | ------ |
| min_price       | ₱70,215    | ₱13,193   | 133.9% |
| suggested_price | ₱115,641   | ₱22,221   | 174.4% |
| max_price       | ₱161,857   | ₱31,579   | 190.4% |

### Files

| File                              | Lines | Description                                    |
| --------------------------------- | ----- | ---------------------------------------------- |
| `ml/price_model.py`               | 309   | Model architecture, `PriceModelConfig`         |
| `ml/price_feature_engineering.py` | 547   | `PriceFeatureExtractor`, `PriceDatasetBuilder` |
| `ml/price_training.py`            | 285   | `PriceTrainingPipeline` class                  |
| `scripts/train_price_model.py`    | 286   | Standalone training script                     |

---

## Feature Engineering

### Normalization Techniques

| Technique            | Used For                         | Formula                |
| -------------------- | -------------------------------- | ---------------------- |
| **Min-Max Scaling**  | Budget, temporal features        | `value / max_expected` |
| **One-Hot Encoding** | Categories, tags                 | Binary vectors         |
| **Log Transform**    | Target variables (prices, hours) | `log1p(value)`         |
| **Capping**          | Outliers                         | `min(value, cap)`      |

### Missing Value Handling

| Feature Type   | Strategy                                |
| -------------- | --------------------------------------- |
| Numerical      | Default to 0 or middle value (0.5)      |
| Categorical    | Default to unknown category (all zeros) |
| Worker history | Return zeros if no worker assigned      |
| Text           | Empty string → zero features            |

### Feature Importance Indicators

**Completion Time Model:**

1. Worker history features (rating, completed jobs)
2. Budget (correlates with complexity)
3. Category (job type affects duration)
4. Urgency level

**Price Budget Model:**

1. Category (strongest predictor)
2. Description length/complexity
3. Skill level required
4. Tags/keywords

---

## Training Pipeline

### Common Training Steps

1. **Data Loading**
   - From Django ORM (completed jobs)
   - From CSV file (freelancer dataset for price model)

2. **Feature Extraction**
   - Initialize feature extractor
   - Fit on training data (learn category encodings)
   - Transform all samples

3. **Dataset Splitting**
   - Default: 70% train / 15% validation / 15% test
   - Chronological split for completion time (prevents data leakage)
   - Random shuffle for price prediction

4. **Model Building**
   - Build LSTM architecture
   - Compile with Adam optimizer

5. **Training**
   - Fit with callbacks (early stopping, LR reduction)
   - Track validation loss for best model selection

6. **Evaluation**
   - Calculate metrics on test set
   - Transform predictions back to original scale
   - Report RMSE, MAE, MAPE

7. **Model Saving**
   - Keras model: `.keras` format
   - Feature extractor: `.pkl` (pickle)
   - Metadata: `.json`

### Training Commands

**Completion Time Model:**

```bash
# Django management command
docker exec iayos-backend-dev python manage.py train_completion_model

# Or via API
POST /api/ml/train
{
  "min_samples": 50,
  "epochs": 100,
  "batch_size": 32,
  "force": false
}
```

**Price Budget Model (run locally, then copy to container):**

```bash
# Run on host machine (requires TensorFlow)
cd apps/backend/src
python ../../../scripts/train_price_model.py

# Copy model to ML container
docker cp ml/saved_models/price_budget_lstm iayos-ml-dev:/app/apps/backend/src/ml/saved_models/
```

---

## API Endpoints

### Completion Time Prediction

| Endpoint                           | Method | Description                 |
| ---------------------------------- | ------ | --------------------------- |
| `/api/ml/predict-completion-time`  | POST   | Predict for new job data    |
| `/api/ml/predict-for-job/{job_id}` | POST   | Predict for existing job    |
| `/api/ml/batch-predict`            | POST   | Batch predictions           |
| `/api/ml/model-status`             | GET    | Get model status            |
| `/api/ml/dataset-stats`            | GET    | Get training data stats     |
| `/api/ml/reload-model`             | POST   | Reload model after training |
| `/api/ml/train`                    | POST   | Trigger training (admin)    |

**Example Request:**

```json
POST /api/ml/predict-completion-time
{
  "category_id": 3,
  "budget": 5000,
  "urgency": "HIGH",
  "materials": ["paint", "brushes"],
  "job_type": "LISTING",
  "worker_id": null
}
```

**Example Response:**

```json
{
  "predicted_hours": 4.5,
  "confidence_interval_lower": 2.8,
  "confidence_interval_upper": 7.2,
  "confidence_level": 0.75,
  "formatted_duration": "4-5 hours",
  "source": "ml_service"
}
```

### Price Budget Prediction

| Endpoint                     | Method | Description              |
| ---------------------------- | ------ | ------------------------ |
| `/api/ml/predict-price`      | POST   | Predict price range      |
| `/api/ml/price-model-status` | GET    | Get price model status   |
| `/api/ml/train-price-model`  | POST   | Trigger training (admin) |

**Example Request:**

```json
POST /api/ml/predict-price
{
  "category_id": 5,
  "title": "Build e-commerce website with payment integration",
  "description": "Need a full-featured e-commerce site with shopping cart, user authentication, payment gateway integration (GCash, PayPal), order management, and admin dashboard. Tech stack: React + Node.js preferred.",
  "urgency": "MEDIUM",
  "skill_level": "EXPERT",
  "materials": []
}
```

**Example Response:**

```json
{
  "min_price": 15000.5,
  "suggested_price": 35000.0,
  "max_price": 65000.75,
  "confidence": 0.72,
  "currency": "PHP",
  "source": "ml_service"
}
```

---

## Deployment & Infrastructure

### Docker Configuration

**ML Container (Dockerfile.ml):**

```dockerfile
FROM python:3.11-slim-bookworm
RUN pip install tensorflow==2.20.0 numpy pandas scikit-learn
COPY apps/backend/src/ml /app/apps/backend/src/ml
EXPOSE 8002
```

**docker-compose.dev.yml:**

```yaml
services:
  ml:
    build:
      context: .
      dockerfile: Dockerfile.ml
    ports:
      - "8002:8002"
    volumes:
      - ./apps/backend/src:/app/apps/backend/src
```

### Model Storage

```
apps/backend/src/ml/saved_models/
├── completion_time_lstm/
│   ├── completion_time_lstm.keras
│   ├── completion_time_lstm_metadata.json
│   └── completion_time_lstm_extractor.json
└── price_budget_lstm/
    ├── model.keras
    ├── feature_extractor.pkl
    └── metadata.json
```

### Environment Variables

| Variable               | Default          | Description                     |
| ---------------------- | ---------------- | ------------------------------- |
| `ML_SERVICE_URL`       | `http://ml:8002` | URL of ML microservice          |
| `TENSORFLOW_AVAILABLE` | Auto-detected    | Whether TensorFlow is installed |

---

## Retraining Guide

### When to Retrain

1. **Completion Time Model**: Every 1,000 new completed jobs
2. **Price Budget Model**: When market rates change significantly (quarterly)

### Retraining Steps

**1. Check current data availability:**

```bash
curl http://localhost:8000/api/ml/dataset-stats
```

**2. Trigger training:**

```bash
# Completion time
curl -X POST http://localhost:8000/api/ml/train \
  -H "Content-Type: application/json" \
  -d '{"min_samples": 100, "epochs": 100}'

# Price budget (run locally)
python scripts/train_price_model.py
```

**3. Copy model to container (if trained locally):**

```bash
docker cp ml/saved_models/price_budget_lstm iayos-ml-dev:/app/apps/backend/src/ml/saved_models/
```

**4. Reload model:**

```bash
curl -X POST http://localhost:8000/api/ml/reload-model
```

**5. Verify:**

```bash
curl http://localhost:8000/api/ml/model-status
curl http://localhost:8000/api/ml/price-model-status
```

### Monitoring Metrics

Track these metrics after retraining:

| Metric           | Completion Time | Price Budget           |
| ---------------- | --------------- | ---------------------- |
| Test RMSE        | Should decrease | Should decrease        |
| Test MAE         | Should decrease | Should decrease        |
| MAPE             | < 50% is good   | < 100% is acceptable   |
| Training samples | Monitor growth  | Monitor mix (CSV + DB) |

---

## Troubleshooting

### Common Issues

**1. "TensorFlow not installed" error**

- Main backend doesn't have TensorFlow (expected)
- Ensure ML container is running: `docker-compose up ml`

**2. Pickle load error (ModuleNotFoundError)**

- Feature extractor was pickled from wrong module path
- Solution: Retrain model using `scripts/train_price_model.py` which imports from `ml.price_feature_engineering`

**3. Model returns `source: "fallback"`**

- ML service unavailable or model not loaded
- Check ML container logs: `docker logs iayos-ml-dev`

**4. High MAPE on price predictions**

- High variance in freelancer dataset (global data vs local market)
- Expected: Model provides reasonable estimates, not exact values
- Consider training on more local (Philippine) data

### Debug Commands

```bash
# Check ML container status
docker ps | grep ml

# Check ML container logs
docker logs iayos-ml-dev --tail 50

# Test ML service directly
curl http://localhost:8002/api/ml/price-model-status

# Check model files exist
docker exec iayos-ml-dev ls -la /app/apps/backend/src/ml/saved_models/price_budget_lstm/
```

---

## Model 3: Worker Profile Rating Prediction

### Purpose

Predicts a profile quality score (0-100) for workers based on their profile completeness, experience, certifications, and performance history. This helps workers understand how their profile compares and provides actionable improvement suggestions.

### Model Architecture

```
Input(43 features)
    ↓
Reshape(1, 43) - Add time dimension for LSTM
    ↓
LSTM(64 units, return_sequences=True, dropout=0.2)
    ↓
LSTM(32 units, dropout=0.2)
    ↓
Dense(16 units, activation='relu')
    ↓
Dropout(0.2)
    ↓
Dense(1 unit, activation='sigmoid') × 100 → Output: Profile Score (0-100)
```

### Hyperparameters

| Parameter       | Value | Description                  |
| --------------- | ----- | ---------------------------- |
| `LSTM_UNITS_1`  | 64    | First LSTM layer units       |
| `LSTM_UNITS_2`  | 32    | Second LSTM layer units      |
| `DENSE_UNITS`   | 16    | Dense layer units            |
| `DROPOUT_RATE`  | 0.2   | Dropout for regularization   |
| `LEARNING_RATE` | 0.001 | Adam optimizer learning rate |
| `BATCH_SIZE`    | 32    | Training batch size          |
| `EPOCHS`        | 100   | Maximum training epochs      |
| `INPUT_DIM`     | 43    | Number of input features     |
| `OUTPUT_DIM`    | 1     | Single score output          |

### Optimizer & Loss

```python
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='mse',           # Mean Squared Error (for regression)
    metrics=['mae']       # Mean Absolute Error
)
```

### Training Callbacks

1. **EarlyStopping**: Stops training when validation loss stops improving
   - Monitor: `val_loss`
   - Patience: 15 epochs
   - Restore best weights: True

2. **ModelCheckpoint**: Saves best model during training
   - Monitor: `val_loss`
   - Save best only: True

3. **ReduceLROnPlateau**: Reduces learning rate when loss plateaus
   - Monitor: `val_loss`
   - Factor: 0.5
   - Patience: 7 epochs
   - Minimum LR: 1e-6

### Input Features (43 total)

**Profile Features (3 features):**

| Feature              | Type  | Range | Description                   |
| -------------------- | ----- | ----- | ----------------------------- |
| `profile_completion` | Float | 0-1   | Profile completion percentage |
| `bio_length_norm`    | Float | 0-1   | Bio length / 500              |
| `has_hourly_rate`    | Int   | 0-1   | Whether hourly rate is set    |

**Experience Features (2 features):**

| Feature          | Type  | Range | Description                |
| ---------------- | ----- | ----- | -------------------------- |
| `years_exp_norm` | Float | 0-1   | Years of experience / 40   |
| `specs_norm`     | Float | 0-1   | Specializations count / 10 |

**Credentials Features (2 features):**

| Feature          | Type  | Range | Description                  |
| ---------------- | ----- | ----- | ---------------------------- |
| `certs_norm`     | Float | 0-1   | Certifications count / 10    |
| `verified_ratio` | Float | 0-1   | Verified certs / total certs |

**Performance Features (4 features):**

| Feature         | Type  | Range | Description                  |
| --------------- | ----- | ----- | ---------------------------- |
| `jobs_norm`     | Float | 0-1   | Completed jobs / 100         |
| `rating_norm`   | Float | 0-1   | Average rating / 5           |
| `earnings_norm` | Float | 0-1   | Total earnings / 500,000     |
| `client_sat`    | Float | 0-1   | Client satisfaction (0-100)% |

**Activity Features (1 feature):**

| Feature     | Type  | Range   | Description                       |
| ----------- | ----- | ------- | --------------------------------- |
| `is_active` | Float | 0/0.5/1 | Active=1, Unknown=0.5, Inactive=0 |

**Demographics Features (31 features):**

| Feature               | Type   | Range | Description                      |
| --------------------- | ------ | ----- | -------------------------------- |
| `country_one_hot[20]` | Binary | 0/1   | Top 20 countries one-hot encoded |
| `skill_one_hot[11]`   | Binary | 0/1   | 11 skill categories one-hot      |

**Top 20 Countries:**
United States, India, United Kingdom, Germany, Australia, Canada, France, Brazil, South Korea, Japan, Italy, Spain, Russia, China, Indonesia, Netherlands, Argentina, Mexico, Turkey, Egypt

**Skill Categories:**
Web Development, Mobile Apps, AI, Machine Learning, Data Analysis, UI/UX Design, Graphic Design, DevOps, Blockchain Development, Cybersecurity, Other

### Target Variable

- **Source**: Composite score from `rating` (0-5) and `client_satisfaction` (0-100%)
- **Formula**: `(rating/5 * 0.5 + client_satisfaction/100 * 0.5) * 100`
- **Range**: 0-100 (profile quality score)
- **Categories**:
  - 85-100: Excellent
  - 70-84: Good
  - 50-69: Fair
  - 0-49: Poor

### Training Data Source

**Primary**: `global_freelancers_raw.csv` (1,001 freelancer records)

- Columns: freelancer_ID, name, gender, age, country, language, primary_skill, years_of_experience, hourly_rate (USD), rating (0-5), is_active, client_satisfaction
- Data cleaning: Parse `hourly_rate` ($40, USD 75), normalize `is_active` (0/1/yes/no/True/False), handle `client_satisfaction` (84%, 92, "")

**Secondary (Optional)**: Django WorkerProfile model with related models

- JobReview for average rating
- workerSpecialization for experience years
- WorkerCertification for credentials
- Job model for completed jobs count

### Files

| File                                      | Lines | Description                                                  |
| ----------------------------------------- | ----- | ------------------------------------------------------------ |
| `ml/worker_rating_feature_engineering.py` | ~500  | `WorkerRatingFeatureExtractor`, `WorkerRatingDatasetBuilder` |
| `ml/worker_rating_model.py`               | ~280  | Model architecture, config, save/load                        |
| `ml/worker_rating_training.py`            | ~285  | `WorkerRatingTrainingPipeline` class                         |
| `scripts/train_worker_rating_model.py`    | ~310  | Standalone training script                                   |

### API Endpoints

| Method | Endpoint                                 | Description                     |
| ------ | ---------------------------------------- | ------------------------------- |
| POST   | `/api/ml/predict-worker-rating`          | Predict profile score from data |
| GET    | `/api/ml/worker-rating-for-profile/{id}` | Predict for existing worker     |
| GET    | `/api/ml/worker-rating-model-status`     | Get model status and metrics    |
| POST   | `/api/ml/train-worker-rating-model`      | Trigger training (TF required)  |

### Response Format

```json
{
  "profile_score": 78.5,
  "rating_category": "Good",
  "improvement_suggestions": [
    "Add professional certifications to build trust with clients",
    "Get your certifications verified to increase your credibility",
    "Complete your profile to at least 80% for better visibility"
  ],
  "source": "model"
}
```

### Training Instructions

**Step 1**: Run training locally (TensorFlow required)

```bash
cd /path/to/iayos
python scripts/train_worker_rating_model.py
```

**Step 2**: Copy model files to Docker container

```bash
docker cp apps/backend/src/ml_models/worker_rating_model.keras iayos-backend-dev:/app/apps/backend/src/ml_models/
docker cp apps/backend/src/ml_models/worker_rating_extractor.pkl iayos-backend-dev:/app/apps/backend/src/ml_models/
docker cp apps/backend/src/ml_models/worker_rating_config.pkl iayos-backend-dev:/app/apps/backend/src/ml_models/
```

**Step 3**: Verify model loaded

```bash
curl http://localhost:8000/api/ml/worker-rating-model-status
```

### Fallback Behavior

When ML model is unavailable, uses heuristic scoring:

| Component          | Max Points | Calculation                          |
| ------------------ | ---------- | ------------------------------------ |
| Profile completion | 20         | completion% / 100 × 20               |
| Bio                | 5          | min(bio_length/200, 1) × 5           |
| Experience         | 15         | min(years/10, 1) × 15                |
| Certifications     | 10         | certs_count × 2 + verified_ratio × 5 |
| Completed jobs     | 15         | min(jobs/50, 1) × 15                 |
| Average rating     | 25         | rating/5 × 25                        |
| Hourly rate set    | 5          | 5 if set, else 0                     |
| Active status      | 5          | 5 if active, else 0                  |
| **Total**          | **100**    |                                      |

---

## Future Improvements

1. **Ensemble Models**: Train multiple models and average predictions
2. **Uncertainty Quantification**: Add Monte Carlo dropout for confidence intervals
3. **Feature Expansion**: Include more text features (TF-IDF, embeddings)
4. **Transfer Learning**: Use pre-trained language models for text features
5. **AutoML**: Automated hyperparameter tuning with Keras Tuner
6. **Model Versioning**: Track model versions with MLflow
7. **A/B Testing**: Compare model performance in production
8. **Local Data Training**: Train on Philippine-specific job data for better accuracy
9. **Worker Matching**: Use profile scores to match workers with appropriate jobs
10. **Gamification**: Integrate profile scores into worker achievement system

---

## References

- [TensorFlow LSTM Documentation](https://www.tensorflow.org/api_docs/python/tf/keras/layers/LSTM)
- [Keras Sequential Model Guide](https://keras.io/guides/sequential_model/)
- [Adam Optimizer Paper](https://arxiv.org/abs/1412.6980)
- [Early Stopping Best Practices](https://keras.io/api/callbacks/early_stopping/)

---

**Document Version**: 1.1  
**Last Reviewed**: December 2025  
**Maintainer**: iAyos ML Team
