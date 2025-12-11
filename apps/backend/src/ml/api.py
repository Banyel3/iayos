"""
Django Ninja API Endpoints for ML Predictions

Provides REST API endpoints for:
1. Real-time completion time predictions
2. Model status and metrics
3. Batch predictions
"""

from typing import List, Optional
from decimal import Decimal
from datetime import datetime

from ninja import Router, Schema
from ninja.security import HttpBearer
from django.http import HttpRequest

# Create router
router = Router(tags=["ml"])


# ============================================================================
# Request/Response Schemas
# ============================================================================

class PredictionRequest(Schema):
    """Request schema for completion time prediction."""
    category_id: int
    budget: float
    urgency: str = "MEDIUM"  # LOW, MEDIUM, HIGH
    materials: List[str] = []
    job_type: str = "LISTING"  # LISTING or INVITE
    worker_id: Optional[int] = None
    location: Optional[str] = None


class PredictionResponse(Schema):
    """Response schema for completion time prediction."""
    predicted_hours: Optional[float] = None
    confidence_interval_lower: Optional[float] = None
    confidence_interval_upper: Optional[float] = None
    confidence_level: float = 0.0
    formatted_duration: str = "Unknown"
    source: str = "unknown"
    error: Optional[str] = None


class BatchPredictionRequest(Schema):
    """Request schema for batch predictions."""
    job_ids: List[int]


class BatchPredictionItem(Schema):
    """Single item in batch prediction response."""
    job_id: int
    predicted_hours: Optional[float] = None
    confidence_interval_lower: Optional[float] = None
    confidence_interval_upper: Optional[float] = None
    formatted_duration: str = "Unknown"


class BatchPredictionResponse(Schema):
    """Response schema for batch predictions."""
    predictions: List[BatchPredictionItem]
    total: int


class ModelStatusResponse(Schema):
    """Response schema for model status."""
    tensorflow_available: bool = False
    model_loaded: bool = False
    model_exists: bool = False
    trained_at: Optional[str] = None
    training_samples: Optional[int] = None
    test_rmse_hours: Optional[float] = None
    test_mae_hours: Optional[float] = None
    test_mape: Optional[float] = None
    note: Optional[str] = None


class TrainingStatusResponse(Schema):
    """Response schema for training status."""
    success: bool
    message: str
    epochs_run: Optional[int] = None
    training_time_seconds: Optional[float] = None
    train_samples: Optional[int] = None
    test_rmse_hours: Optional[float] = None
    test_mae_hours: Optional[float] = None
    error: Optional[str] = None


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/predict-completion-time", response=PredictionResponse)
def predict_completion_time(request: HttpRequest, data: PredictionRequest):
    """
    Predict job completion time.
    
    Uses LSTM neural network trained on historical job data.
    Falls back to statistical estimates if model unavailable.
    
    Returns:
        - predicted_hours: Estimated completion time in hours
        - confidence_interval: 95% confidence range (lower, upper)
        - confidence_level: How confident the prediction is (0-1)
        - formatted_duration: Human-readable duration string
        - source: 'model' or 'fallback'
    """
    from ml.prediction_service import predict_completion_time as predict
    
    job_data = {
        'category_id': data.category_id,
        'budget': data.budget,
        'urgency': data.urgency,
        'materials': data.materials,
        'job_type': data.job_type,
        'worker_id': data.worker_id,
        'location': data.location,
    }
    
    prediction = predict(job_data)
    
    # Extract confidence interval
    ci = prediction.get('confidence_interval')
    ci_lower = ci[0] if ci else None
    ci_upper = ci[1] if ci else None
    
    return PredictionResponse(
        predicted_hours=prediction.get('predicted_hours'),
        confidence_interval_lower=ci_lower,
        confidence_interval_upper=ci_upper,
        confidence_level=prediction.get('confidence_level', 0.0),
        formatted_duration=prediction.get('formatted_duration', 'Unknown'),
        source=prediction.get('source', 'unknown'),
        error=prediction.get('error')
    )


@router.post("/predict-for-job/{job_id}", response=PredictionResponse)
def predict_for_existing_job(request: HttpRequest, job_id: int):
    """
    Predict completion time for an existing job.
    
    Uses actual job data from database.
    
    Args:
        job_id: Job primary key
        
    Returns:
        Prediction response
    """
    from accounts.models import Job
    from ml.prediction_service import predict_for_job_instance
    
    try:
        job = Job.objects.select_related(
            'categoryID',
            'assignedWorkerID',
            'assignedWorkerID__profileID'
        ).get(pk=job_id)
    except Job.DoesNotExist:
        return PredictionResponse(
            error=f"Job {job_id} not found",
            source="error"
        )
    
    prediction = predict_for_job_instance(job)
    
    ci = prediction.get('confidence_interval')
    ci_lower = ci[0] if ci else None
    ci_upper = ci[1] if ci else None
    
    return PredictionResponse(
        predicted_hours=prediction.get('predicted_hours'),
        confidence_interval_lower=ci_lower,
        confidence_interval_upper=ci_upper,
        confidence_level=prediction.get('confidence_level', 0.0),
        formatted_duration=prediction.get('formatted_duration', 'Unknown'),
        source=prediction.get('source', 'unknown'),
        error=prediction.get('error')
    )


@router.post("/batch-predict", response=BatchPredictionResponse)
def batch_predict_completion_times(request: HttpRequest, data: BatchPredictionRequest):
    """
    Batch predict completion times for multiple jobs.
    
    Efficiently predicts for multiple jobs in a single request.
    
    Args:
        job_ids: List of job IDs to predict for
        
    Returns:
        List of predictions
    """
    from ml.prediction_service import batch_predict
    
    predictions_dict = batch_predict(data.job_ids)
    
    predictions = []
    for job_id in data.job_ids:
        pred = predictions_dict.get(job_id, {})
        ci = pred.get('confidence_interval')
        
        predictions.append(BatchPredictionItem(
            job_id=job_id,
            predicted_hours=pred.get('predicted_hours'),
            confidence_interval_lower=ci[0] if ci else None,
            confidence_interval_upper=ci[1] if ci else None,
            formatted_duration=pred.get('formatted_duration', 'Unknown')
        ))
    
    return BatchPredictionResponse(
        predictions=predictions,
        total=len(predictions)
    )


@router.get("/model-status", response=ModelStatusResponse)
def get_model_status(request: HttpRequest):
    """
    Get ML model status and metrics.
    
    Returns information about the currently loaded model.
    """
    from ml.prediction_service import get_prediction_stats, TENSORFLOW_AVAILABLE, ML_SERVICE_URL
    from ml.training import get_model_info
    import httpx
    
    stats = get_prediction_stats()
    model_info = get_model_info()
    
    # Check if ML microservice is available
    ml_service_available = False
    if not TENSORFLOW_AVAILABLE:
        try:
            with httpx.Client(timeout=2.0) as client:
                response = client.get(f"{ML_SERVICE_URL}/api/ml/model-status")
                ml_service_available = response.status_code == 200
        except:
            pass
    
    note = None
    if not TENSORFLOW_AVAILABLE:
        if ml_service_available:
            note = "TensorFlow not installed locally. Using ML microservice for predictions."
        else:
            note = "TensorFlow not installed. ML microservice not available. Using fallback statistical estimates."
    
    return ModelStatusResponse(
        tensorflow_available=TENSORFLOW_AVAILABLE,
        model_loaded=stats.get('model_loaded', False) or ml_service_available,
        model_exists=model_info.get('exists', False),
        trained_at=model_info.get('trained_at'),
        training_samples=model_info.get('training_samples'),
        test_rmse_hours=model_info.get('test_rmse_hours'),
        test_mae_hours=model_info.get('test_mae_hours'),
        test_mape=model_info.get('test_mape'),
        note=note
    )


@router.get("/dataset-stats")
def get_dataset_statistics(request: HttpRequest):
    """
    Get statistics about available training data.
    
    Useful for monitoring data quality and deciding when to retrain.
    """
    from ml.data_preprocessing import JobFeatureExtractor, DatasetBuilder
    
    extractor = JobFeatureExtractor()
    builder = DatasetBuilder(extractor)
    stats = builder.get_statistics()
    
    return stats


@router.post("/reload-model")
def reload_prediction_model(request: HttpRequest):
    """
    Reload the prediction model.
    
    Call this after retraining to use the new model.
    """
    from ml.prediction_service import reload_predictor
    
    predictor = reload_predictor()
    
    return {
        'success': predictor is not None,
        'message': 'Model reloaded successfully' if predictor else 'Failed to load model'
    }


# Note: Training endpoint is admin-only and should be behind authentication
# For now, training is triggered via management command: python manage.py train_completion_model

class TrainingRequest(Schema):
    """Request schema for training."""
    min_samples: int = 50
    epochs: int = 100
    batch_size: int = 8
    force: bool = False  # Bypass minimum samples check


# ============================================================================
# Price Budget Prediction Schemas
# ============================================================================

class PricePredictionRequest(Schema):
    """Request schema for price budget prediction."""
    category_id: Optional[int] = None
    title: str = ""
    description: str = ""
    urgency: str = "MEDIUM"  # LOW, MEDIUM, HIGH
    skill_level: str = "INTERMEDIATE"  # ENTRY, INTERMEDIATE, EXPERT
    materials: List[str] = []


class PricePredictionResponse(Schema):
    """Response schema for price budget prediction."""
    min_price: Optional[float] = None
    suggested_price: Optional[float] = None
    max_price: Optional[float] = None
    confidence: float = 0.0
    currency: str = "PHP"
    source: str = "unknown"
    error: Optional[str] = None


class PriceModelStatusResponse(Schema):
    """Response schema for price model status."""
    model_loaded: bool = False
    model_exists: bool = False
    trained_at: Optional[str] = None
    training_samples: Optional[int] = None
    test_rmse_php: Optional[float] = None
    test_mae_php: Optional[float] = None
    metrics_per_output: Optional[dict] = None


class PriceTrainingRequest(Schema):
    """Request schema for price model training."""
    csv_path: Optional[str] = None
    include_db: bool = True
    min_samples: int = 100
    epochs: int = 100
    force: bool = False


class PriceTrainingResponse(Schema):
    """Response schema for price model training."""
    success: bool
    message: str
    epochs_run: Optional[int] = None
    training_time_seconds: Optional[float] = None
    train_samples: Optional[int] = None
    test_rmse_php: Optional[float] = None
    test_mae_php: Optional[float] = None
    error: Optional[str] = None


# ============================================================================
# Price Budget Prediction Endpoints
# ============================================================================

@router.post("/predict-price", response=PricePredictionResponse)
def predict_price_budget(request: HttpRequest, data: PricePredictionRequest):
    """
    Predict price budget range for a job.
    
    Uses LSTM neural network trained on freelancer job data.
    Falls back to database averages if model unavailable.
    
    Priority:
    1. Try local TensorFlow model (if available)
    2. Try ML microservice (http://ml:8002)
    3. Fall back to database category averages
    
    Returns:
        - min_price: Minimum recommended price (PHP)
        - suggested_price: Suggested price (PHP)
        - max_price: Maximum recommended price (PHP)
        - confidence: How confident the prediction is (0-1)
        - currency: Always 'PHP'
        - source: 'model', 'ml_service', or 'fallback'
    """
    import httpx
    from ml.prediction_service import TENSORFLOW_AVAILABLE, ML_SERVICE_URL
    
    # Option 1: Try local TensorFlow model
    if TENSORFLOW_AVAILABLE:
        from ml.price_model import load_price_model, predict_price_range
        model, feature_extractor, metadata = load_price_model()
        
        if model is not None and feature_extractor is not None:
            try:
                prediction = predict_price_range(
                    model=model,
                    feature_extractor=feature_extractor,
                    category_id=data.category_id,
                    title=data.title,
                    description=data.description,
                    urgency=data.urgency,
                    skill_level=data.skill_level,
                    materials=data.materials
                )
                
                return PricePredictionResponse(
                    min_price=prediction['min_price'],
                    suggested_price=prediction['suggested_price'],
                    max_price=prediction['max_price'],
                    confidence=prediction['confidence'],
                    currency=str(prediction['currency']),
                    source='model'
                )
            except Exception as e:
                pass  # Fall through to ML service
    
    # Option 2: Try ML microservice
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.post(
                f"{ML_SERVICE_URL}/api/ml/predict-price",
                json={
                    'category_id': data.category_id,
                    'title': data.title,
                    'description': data.description,
                    'urgency': data.urgency,
                    'skill_level': data.skill_level,
                    'materials': data.materials
                }
            )
            if response.status_code == 200:
                result = response.json()
                # Only use ML service if it used the actual model
                if result.get('source') == 'model':
                    return PricePredictionResponse(
                        min_price=result['min_price'],
                        suggested_price=result['suggested_price'],
                        max_price=result['max_price'],
                        confidence=result.get('confidence', 0.7),
                        currency='PHP',
                        source='ml_service'
                    )
    except (httpx.ConnectError, httpx.TimeoutException):
        pass  # ML service unavailable, fall through to fallback
    
    # Fallback: Use database category averages
    try:
        from accounts.models import Specializations
        
        fallback_min = 500.0
        fallback_max = 5000.0
        fallback_suggested = 2000.0
        
        if data.category_id:
            try:
                spec = Specializations.objects.get(pk=data.category_id)
                if spec.averageProjectCostMin and spec.averageProjectCostMax:
                    fallback_min = float(spec.averageProjectCostMin)
                    fallback_max = float(spec.averageProjectCostMax)
                    fallback_suggested = (fallback_min + fallback_max) / 2
                elif spec.minimumRate:
                    fallback_min = float(spec.minimumRate)
                    fallback_suggested = fallback_min * 1.5
                    fallback_max = fallback_min * 2.5
            except Specializations.DoesNotExist:
                pass
        
        # Adjust for urgency
        urgency_multiplier = {'LOW': 0.9, 'MEDIUM': 1.0, 'HIGH': 1.2}
        mult = urgency_multiplier.get(data.urgency, 1.0)
        
        # Adjust for skill level
        skill_multiplier = {'ENTRY': 0.8, 'INTERMEDIATE': 1.0, 'EXPERT': 1.3}
        mult *= skill_multiplier.get(data.skill_level, 1.0)
        
        return PricePredictionResponse(
            min_price=round(fallback_min * mult, 2),
            suggested_price=round(fallback_suggested * mult, 2),
            max_price=round(fallback_max * mult, 2),
            confidence=0.3,  # Low confidence for fallback
            currency='PHP',
            source='fallback'
        )
        
    except Exception as e:
        return PricePredictionResponse(
            error=f"Prediction failed: {str(e)}",
            source='error'
        )


@router.get("/price-model-status", response=PriceModelStatusResponse)
def get_price_model_status(request: HttpRequest):
    """
    Get price prediction model status and metrics.
    
    Returns information about the currently loaded price model.
    Proxies to ML service if TensorFlow not available locally.
    """
    import httpx
    from ml.prediction_service import TENSORFLOW_AVAILABLE, ML_SERVICE_URL
    
    # Option 1: Try local model (if TensorFlow available)
    if TENSORFLOW_AVAILABLE:
        try:
            from ml.price_model import load_price_model, PriceModelConfig
            
            model, feature_extractor, metadata = load_price_model()
            model_dir = PriceModelConfig.MODEL_DIR
            model_exists = model_dir.exists() and (model_dir / 'model.keras').exists()
            
            return PriceModelStatusResponse(
                model_loaded=model is not None,
                model_exists=model_exists,
                trained_at=metadata.get('trained_at') if metadata else None,
                training_samples=metadata.get('training_samples') if metadata else None,
                test_rmse_php=metadata.get('test_rmse_php') if metadata else None,
                test_mae_php=metadata.get('test_mae_php') if metadata else None,
                metrics_per_output=metadata.get('metrics_per_output') if metadata else None
            )
        except Exception:
            pass  # Fall through to ML service
    
    # Option 2: Try ML microservice
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(f"{ML_SERVICE_URL}/api/ml/price-model-status")
            if response.status_code == 200:
                result = response.json()
                return PriceModelStatusResponse(
                    model_loaded=result.get('model_loaded', False),
                    model_exists=result.get('model_exists', False),
                    trained_at=result.get('trained_at'),
                    training_samples=result.get('training_samples'),
                    test_rmse_php=result.get('test_rmse_php'),
                    test_mae_php=result.get('test_mae_php'),
                    metrics_per_output=result.get('metrics_per_output')
                )
    except (httpx.ConnectError, httpx.TimeoutException):
        pass
    
    # Fallback: No model available
    return PriceModelStatusResponse(
        model_loaded=False,
        model_exists=False
    )


@router.post("/train-price-model", response=PriceTrainingResponse)
def trigger_price_training(request: HttpRequest, data: PriceTrainingRequest):
    """
    Trigger price model training (ADMIN ONLY).
    
    This is a long-running operation. Consider using async/background task
    in production.
    
    Args:
        csv_path: Path to freelancer_job_postings.csv
        include_db: Whether to include database jobs (default True)
        min_samples: Minimum samples required (default 100)
        epochs: Number of training epochs (default 100)
        force: If True, bypass minimum samples check
    """
    try:
        import tensorflow as tf
    except ImportError:
        return PriceTrainingResponse(
            success=False,
            message="TensorFlow not available",
            error="TensorFlow is required for training. Install with: pip install tensorflow"
        )
    
    from ml.price_training import PriceTrainingPipeline
    
    try:
        pipeline = PriceTrainingPipeline(verbose=True)
        result = pipeline.train(
            csv_path=data.csv_path if data.csv_path else None,
            include_db=data.include_db,
            min_samples=data.min_samples,
            epochs=data.epochs,
            force=data.force
        )
        
        if result.get('success'):
            return PriceTrainingResponse(
                success=True,
                message="Price model trained successfully",
                epochs_run=result.get('epochs_run'),
                training_time_seconds=result.get('training_time_seconds'),
                train_samples=result.get('train_samples'),
                test_rmse_php=result.get('test_rmse_php'),
                test_mae_php=result.get('test_mae_php')
            )
        else:
            return PriceTrainingResponse(
                success=False,
                message="Training failed",
                error=result.get('error')
            )
            
    except Exception as e:
        return PriceTrainingResponse(
            success=False,
            message="Training error",
            error=str(e)
        )


@router.post("/train", response=TrainingStatusResponse)
def trigger_training(request: HttpRequest, data: TrainingRequest):
    """
    Trigger model training (ADMIN ONLY).
    
    This is a long-running operation. Consider using async/background task
    in production.
    
    Args:
        min_samples: Minimum completed jobs required (default 50)
        epochs: Number of training epochs (default 100)
        batch_size: Training batch size (default 8)
        force: If True, bypass minimum samples check for testing
    """
    # Check if TensorFlow is available
    from ml.prediction_service import TENSORFLOW_AVAILABLE
    
    if not TENSORFLOW_AVAILABLE:
        return TrainingStatusResponse(
            success=False,
            message="TensorFlow not available",
            error="TensorFlow is required for training. Install with: pip install -r requirements-ml.txt"
        )
    
    # TODO: Add admin authentication check
    # if not request.user.is_staff:
    #     return TrainingStatusResponse(success=False, error="Admin access required")
    
    from ml.training import TrainingPipeline
    
    try:
        pipeline = TrainingPipeline(verbose=False)
        result = pipeline.train(
            min_samples=data.min_samples,
            epochs=data.epochs,
            batch_size=data.batch_size,
            force=data.force
        )
        
        if result.get('success'):
            metrics = result.get('metrics', {})
            return TrainingStatusResponse(
                success=True,
                message="Model trained successfully",
                epochs_run=result.get('epochs_run'),
                training_time_seconds=result.get('training_time_seconds'),
                train_samples=result.get('train_samples'),
                test_rmse_hours=metrics.get('test_rmse_hours'),
                test_mae_hours=metrics.get('test_mae_hours')
            )
        else:
            return TrainingStatusResponse(
                success=False,
                message="Training failed",
                error=result.get('error')
            )
            
    except Exception as e:
        return TrainingStatusResponse(
            success=False,
            message="Training error",
            error=str(e)
        )
