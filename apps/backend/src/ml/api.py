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
    model_loaded: bool
    model_exists: bool
    trained_at: Optional[str] = None
    training_samples: Optional[int] = None
    test_rmse_hours: Optional[float] = None
    test_mae_hours: Optional[float] = None
    test_mape: Optional[float] = None


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
    from ml.prediction_service import get_prediction_stats
    from ml.training import get_model_info
    
    stats = get_prediction_stats()
    model_info = get_model_info()
    
    return ModelStatusResponse(
        model_loaded=stats.get('model_loaded', False),
        model_exists=model_info.get('exists', False),
        trained_at=model_info.get('trained_at'),
        training_samples=model_info.get('training_samples'),
        test_rmse_hours=model_info.get('test_rmse_hours'),
        test_mae_hours=model_info.get('test_mae_hours'),
        test_mape=model_info.get('test_mape')
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

@router.post("/train", response=TrainingStatusResponse)
def trigger_training(request: HttpRequest, min_samples: int = 50):
    """
    Trigger model training (ADMIN ONLY).
    
    This is a long-running operation. Consider using async/background task
    in production.
    
    Args:
        min_samples: Minimum completed jobs required (default 50)
    """
    # TODO: Add admin authentication check
    # if not request.user.is_staff:
    #     return TrainingStatusResponse(success=False, error="Admin access required")
    
    from ml.training import TrainingPipeline
    
    try:
        pipeline = TrainingPipeline(verbose=False)
        result = pipeline.train(min_samples=min_samples)
        
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
