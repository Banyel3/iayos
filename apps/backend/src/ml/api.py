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
    job_scope: str = "MINOR_REPAIR"  # MINOR_REPAIR, MODERATE_PROJECT, MAJOR_RENOVATION
    work_environment: str = "INDOOR"  # INDOOR, OUTDOOR, BOTH
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
                    job_scope=data.job_scope,
                    work_environment=data.work_environment,
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
                    'job_scope': data.job_scope,
                    'work_environment': data.work_environment,
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
    
    # Fallback: Use Philippine blue-collar category pricing
    try:
        from accounts.models import Specializations
        
        # Philippine blue-collar base pricing by category (in PHP)
        # Based on DOLE daily wage rates + market research for Zamboanga region
        PH_CATEGORY_PRICING = {
            # Category Name: (min, suggested, max) for moderate project
            'Plumbing': (500, 1500, 5000),
            'Electrical Work': (600, 2000, 8000),
            'Carpentry': (800, 2500, 10000),
            'Cleaning': (400, 800, 3000),
            'HVAC': (1000, 3500, 15000),
            'Painting': (800, 2000, 8000),
            'Masonry': (1000, 3000, 12000),
            'Welding': (800, 2500, 10000),
            'Home Repair': (500, 1500, 5000),
            'Appliance Repair': (400, 1000, 4000),
            'Roofing': (1500, 4000, 20000),
            'Landscaping': (600, 1500, 6000),
            'Flooring': (1200, 3500, 15000),
            'Pest Control': (800, 2000, 6000),
            'Moving': (500, 1500, 8000),
            'Demolition': (1000, 3000, 15000),
        }
        
        fallback_min = 500.0
        fallback_max = 5000.0
        fallback_suggested = 1500.0
        category_name = None
        
        if data.category_id:
            try:
                spec = Specializations.objects.get(pk=data.category_id)
                category_name = spec.specializationName
                
                # Try PH-specific pricing first
                if spec.specializationName in PH_CATEGORY_PRICING:
                    ph_pricing = PH_CATEGORY_PRICING[spec.specializationName]
                    fallback_min, fallback_suggested, fallback_max = ph_pricing
                elif spec.averageProjectCostMin and spec.averageProjectCostMax:
                    # Use database values if available
                    fallback_min = float(spec.averageProjectCostMin)
                    fallback_max = float(spec.averageProjectCostMax)
                    fallback_suggested = (fallback_min + fallback_max) / 2
                elif spec.minimumRate:
                    fallback_min = float(spec.minimumRate)
                    fallback_suggested = fallback_min * 1.5
                    fallback_max = fallback_min * 2.5
            except Specializations.DoesNotExist:
                pass
        
        # Text-based category detection if no category_id match
        if fallback_suggested == 1500.0 and data.title:
            title_lower = data.title.lower()
            for cat_name, pricing in PH_CATEGORY_PRICING.items():
                if cat_name.lower() in title_lower:
                    fallback_min, fallback_suggested, fallback_max = pricing
                    break
        
        # Adjust for urgency
        urgency_multiplier = {'LOW': 0.9, 'MEDIUM': 1.0, 'HIGH': 1.25}
        mult = urgency_multiplier.get(data.urgency, 1.0)
        
        # Adjust for skill level
        skill_multiplier = {'ENTRY': 0.8, 'INTERMEDIATE': 1.0, 'EXPERT': 1.4}
        mult *= skill_multiplier.get(data.skill_level, 1.0)
        
        # Adjust for job scope (CRITICAL: biggest impact on pricing)
        scope_multiplier = {'MINOR_REPAIR': 0.5, 'MODERATE_PROJECT': 1.0, 'MAJOR_RENOVATION': 2.5}
        mult *= scope_multiplier.get(data.job_scope, 1.0)
        
        # Adjust for work environment (outdoor may have slight premium)
        env_multiplier = {'INDOOR': 1.0, 'OUTDOOR': 1.08, 'BOTH': 1.12}
        mult *= env_multiplier.get(data.work_environment, 1.0)
        
        return PricePredictionResponse(
            min_price=round(fallback_min * mult, 2),
            suggested_price=round(fallback_suggested * mult, 2),
            max_price=round(fallback_max * mult, 2),
            confidence=0.5,  # Medium confidence - based on PH blue-collar data
            currency='PHP',
            source='fallback_ph'
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


# ============================================================================
# Worker Profile Rating Schemas
# ============================================================================

class WorkerRatingRequest(Schema):
    """Request schema for worker profile rating prediction."""
    # For API prediction with manual input
    profile_completion: Optional[float] = None  # 0-100
    bio_length: Optional[int] = None
    years_of_experience: Optional[float] = None
    specializations_count: Optional[int] = None
    certifications_count: Optional[int] = None
    verified_certifications: Optional[int] = None
    completed_jobs: Optional[int] = None
    avg_rating: Optional[float] = None  # 0-5
    total_earnings: Optional[float] = None
    hourly_rate: Optional[float] = None
    is_active: Optional[bool] = None
    country: Optional[str] = None
    primary_skill: Optional[str] = None


class WorkerRatingResponse(Schema):
    """Response schema for worker profile rating prediction."""
    profile_score: Optional[float] = None  # 0-100
    rating_category: str = "Unknown"  # Poor, Fair, Good, Excellent
    improvement_suggestions: List[str] = []
    source: str = "unknown"
    error: Optional[str] = None


class WorkerRatingModelStatusResponse(Schema):
    """Response schema for worker rating model status."""
    model_loaded: bool = False
    model_exists: bool = False
    trained_at: Optional[str] = None
    training_samples: Optional[int] = None
    test_rmse: Optional[float] = None
    test_mae: Optional[float] = None
    feature_dim: Optional[int] = None


class WorkerRatingTrainingRequest(Schema):
    """Request schema for worker rating model training."""
    csv_path: Optional[str] = None
    include_db: bool = False
    min_samples: int = 50
    epochs: int = 100


class WorkerRatingTrainingResponse(Schema):
    """Response schema for worker rating model training."""
    success: bool
    message: str
    epochs_run: Optional[int] = None
    training_time_seconds: Optional[float] = None
    train_samples: Optional[int] = None
    test_rmse: Optional[float] = None
    test_mae: Optional[float] = None
    error: Optional[str] = None


# ============================================================================
# Worker Profile Rating Endpoints
# ============================================================================

def _categorize_score(score: float) -> str:
    """Categorize profile score into rating tier."""
    if score >= 85:
        return "Excellent"
    elif score >= 70:
        return "Good"
    elif score >= 50:
        return "Fair"
    else:
        return "Poor"


def _generate_improvement_suggestions(data: WorkerRatingRequest, score: float) -> List[str]:
    """Generate improvement suggestions based on profile data."""
    suggestions = []
    
    # Profile completion
    if data.profile_completion and data.profile_completion < 80:
        suggestions.append("Complete your profile to at least 80% for better visibility")
    
    # Bio
    if data.bio_length is not None and data.bio_length < 100:
        suggestions.append("Add a detailed bio (at least 100 characters) describing your skills and experience")
    
    # Certifications
    if data.certifications_count is not None and data.certifications_count < 2:
        suggestions.append("Add professional certifications to build trust with clients")
    
    # Verified certifications
    if data.verified_certifications is not None and data.certifications_count and data.certifications_count > 0:
        if data.verified_certifications < data.certifications_count:
            suggestions.append("Get your certifications verified to increase your credibility")
    
    # Hourly rate
    if data.hourly_rate is not None and data.hourly_rate == 0:
        suggestions.append("Set a competitive hourly rate to attract clients")
    
    # Experience
    if data.years_of_experience is not None and data.years_of_experience < 2:
        suggestions.append("Gain more experience in your field to improve your profile score")
    
    # Specializations
    if data.specializations_count is not None and data.specializations_count < 2:
        suggestions.append("Add more specializations to showcase your diverse skills")
    
    # Rating
    if data.avg_rating is not None and data.avg_rating < 4.0:
        suggestions.append("Focus on delivering quality work to improve your average rating")
    
    return suggestions[:5]  # Return top 5 suggestions


@router.post("/predict-worker-rating", response=WorkerRatingResponse)
def predict_worker_rating(request: HttpRequest, data: WorkerRatingRequest):
    """
    Predict profile rating/score for a worker.
    
    Uses LSTM neural network trained on freelancer data.
    Returns a score 0-100 with improvement suggestions.
    
    Priority:
    1. Try local TensorFlow model (if available)
    2. Try ML microservice (http://ml:8002)
    3. Fall back to heuristic calculation
    
    Returns:
        - profile_score: Overall profile score 0-100
        - rating_category: Poor/Fair/Good/Excellent
        - improvement_suggestions: List of tips to improve score
        - source: 'model', 'ml_service', or 'fallback'
    """
    import httpx
    from ml.prediction_service import TENSORFLOW_AVAILABLE, ML_SERVICE_URL
    import numpy as np
    
    # Option 1: Try local TensorFlow model
    if TENSORFLOW_AVAILABLE:
        try:
            from ml.worker_rating_model import load_worker_rating_model
            from ml.worker_rating_feature_engineering import WorkerRatingFeatureExtractor
            
            model, feature_extractor, config = load_worker_rating_model()
            
            if model is not None and feature_extractor is not None:
                # Build feature array from request data
                features = _build_features_from_request(data, feature_extractor)
                
                # Predict
                prediction = model.predict(features.reshape(1, -1), verbose="0")
                score = float(prediction[0][0])
                score = max(0, min(100, score))  # Clamp to 0-100
                
                category = _categorize_score(score)
                suggestions = _generate_improvement_suggestions(data, score)
                
                return WorkerRatingResponse(
                    profile_score=round(score, 1),
                    rating_category=category,
                    improvement_suggestions=suggestions,
                    source='model'
                )
        except Exception as e:
            pass  # Fall through to ML service
    
    # Option 2: Try ML microservice
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.post(
                f"{ML_SERVICE_URL}/api/ml/predict-worker-rating",
                json=data.dict()
            )
            if response.status_code == 200:
                result = response.json()
                if result.get('source') in ['model', 'ml_service']:
                    return WorkerRatingResponse(
                        profile_score=result.get('profile_score'),
                        rating_category=result.get('rating_category', 'Unknown'),
                        improvement_suggestions=result.get('improvement_suggestions', []),
                        source='ml_service'
                    )
    except (httpx.ConnectError, httpx.TimeoutException):
        pass  # ML service unavailable
    
    # Fallback: Heuristic calculation
    try:
        score = _calculate_fallback_score(data)
        category = _categorize_score(score)
        suggestions = _generate_improvement_suggestions(data, score)
        
        return WorkerRatingResponse(
            profile_score=round(score, 1),
            rating_category=category,
            improvement_suggestions=suggestions,
            source='fallback'
        )
    except Exception as e:
        return WorkerRatingResponse(
            error=f"Prediction failed: {str(e)}",
            source='error'
        )


def _build_features_from_request(data: WorkerRatingRequest, feature_extractor):
    """Build feature array from API request data."""
    import numpy as np
    
    features = []
    
    # Profile features (3)
    profile_completion = (data.profile_completion or 50) / 100.0
    features.append(profile_completion)
    
    bio_length = data.bio_length or 0
    bio_normalized = min(bio_length / 500.0, 1.0)
    features.append(bio_normalized)
    
    has_hourly_rate = 1.0 if data.hourly_rate and data.hourly_rate > 0 else 0.0
    features.append(has_hourly_rate)
    
    # Experience features (2)
    years_exp = data.years_of_experience or 0
    years_normalized = min(years_exp / 40.0, 1.0)
    features.append(years_normalized)
    
    specs = data.specializations_count or 1
    specs_normalized = min(specs / 10.0, 1.0)
    features.append(specs_normalized)
    
    # Credentials (2)
    certs = data.certifications_count or 0
    certs_normalized = min(certs / 10.0, 1.0)
    features.append(certs_normalized)
    
    verified = data.verified_certifications or 0
    verified_ratio = verified / certs if certs > 0 else 0.0
    features.append(verified_ratio)
    
    # Performance (4)
    completed = data.completed_jobs or 0
    completed_normalized = min(completed / 100.0, 1.0)
    features.append(completed_normalized)
    
    rating = data.avg_rating or 0
    rating_normalized = rating / 5.0 if rating > 0 else 0.5
    features.append(rating_normalized)
    
    earnings = data.total_earnings or 0
    earnings_normalized = min(earnings / 500000.0, 1.0)
    features.append(earnings_normalized)
    
    # Client satisfaction (estimate from rating)
    client_sat = rating / 5.0 if rating > 0 else 0.5
    features.append(client_sat)
    
    # Activity (1)
    is_active = 1.0 if data.is_active else 0.5
    features.append(is_active)
    
    # Country one-hot (20)
    country_features = feature_extractor.extract_country_features(data.country or '')
    features.extend(country_features)
    
    # Skill one-hot (11)
    skill_features = feature_extractor.extract_skill_features(data.primary_skill or '')
    features.extend(skill_features)
    
    return np.array(features, dtype=np.float32)


def _calculate_fallback_score(data: WorkerRatingRequest) -> float:
    """Calculate profile score using heuristic weights."""
    score = 0.0
    
    # Profile completion: 20 points max
    if data.profile_completion:
        score += (data.profile_completion / 100.0) * 20
    
    # Bio: 5 points max
    if data.bio_length:
        score += min(data.bio_length / 200.0, 1.0) * 5
    
    # Experience: 15 points max
    if data.years_of_experience:
        score += min(data.years_of_experience / 10.0, 1.0) * 15
    
    # Certifications: 10 points max
    if data.certifications_count:
        score += min(data.certifications_count / 5.0, 1.0) * 5
        if data.verified_certifications:
            verified_ratio = data.verified_certifications / data.certifications_count
            score += verified_ratio * 5
    
    # Completed jobs: 15 points max
    if data.completed_jobs:
        score += min(data.completed_jobs / 50.0, 1.0) * 15
    
    # Average rating: 25 points max
    if data.avg_rating:
        score += (data.avg_rating / 5.0) * 25
    
    # Hourly rate set: 5 points
    if data.hourly_rate and data.hourly_rate > 0:
        score += 5
    
    # Activity bonus: 5 points
    if data.is_active:
        score += 5
    
    return min(score, 100.0)


@router.get("/worker-rating-for-profile/{worker_id}", response=WorkerRatingResponse)
def predict_worker_rating_for_profile(request: HttpRequest, worker_id: int):
    """
    Predict profile rating for an existing worker by ID.
    
    Args:
        worker_id: WorkerProfile primary key
        
    Returns:
        WorkerRatingResponse with profile score and suggestions
    """
    import httpx
    import numpy as np
    from ml.prediction_service import TENSORFLOW_AVAILABLE, ML_SERVICE_URL
    
    # Load worker profile
    from accounts.models import WorkerProfile, Job, JobReview, workerSpecialization, WorkerCertification
    from django.db import models
    
    try:
        worker = WorkerProfile.objects.select_related('profileID').get(pk=worker_id)
    except WorkerProfile.DoesNotExist:
        return WorkerRatingResponse(
            error=f"Worker {worker_id} not found",
            source='error'
        )
    
    # Gather worker data for prediction
    specs = workerSpecialization.objects.filter(workerID=worker)
    certs = WorkerCertification.objects.filter(workerID=worker)
    
    completed_jobs = Job.objects.filter(
        assignedWorkerID=worker,
        status='COMPLETED'
    ).count()
    
    reviews = JobReview.objects.filter(
        revieweeID=worker.profileID.accountFK,
        status='ACTIVE'
    )
    avg_rating = 0.0
    if reviews.exists():
        avg_rating = float(reviews.aggregate(avg=models.Avg('rating'))['avg'] or 0)
    
    # Build request data - check for availability status field
    is_active = False
    if hasattr(worker, 'availabilityStatus'):
        is_active = worker.availabilityStatus == 'AVAILABLE'
    elif hasattr(worker, 'isAvailable'):
        is_active = worker.isAvailable
    
    data = WorkerRatingRequest(
        profile_completion=worker.profile_completion_percentage,
        bio_length=len(worker.bio or ''),
        years_of_experience=sum(s.experienceYears or 0 for s in specs) / max(specs.count(), 1),
        specializations_count=specs.count(),
        certifications_count=certs.count(),
        verified_certifications=certs.filter(is_verified=True).count(),
        completed_jobs=completed_jobs,
        avg_rating=avg_rating,
        total_earnings=float(worker.totalEarningGross or 0),
        hourly_rate=float(worker.hourly_rate or 0),
        is_active=is_active
    )
    
    # Use predict function
    return predict_worker_rating(request, data)


@router.get("/worker-rating-model-status", response=WorkerRatingModelStatusResponse)
def get_worker_rating_model_status(request: HttpRequest):
    """
    Get worker rating model status and metrics.
    
    Returns information about the currently loaded worker rating model.
    """
    import httpx
    import os
    from ml.prediction_service import TENSORFLOW_AVAILABLE, ML_SERVICE_URL
    
    # Option 1: Try local model
    if TENSORFLOW_AVAILABLE:
        try:
            from ml.worker_rating_model import load_worker_rating_model
            
            model, feature_extractor, config = load_worker_rating_model()
            model_dir = 'ml_models'
            model_exists = os.path.exists(os.path.join(model_dir, 'worker_rating_model.keras'))
            
            # Load training history for metrics
            history_path = os.path.join(model_dir, 'worker_rating_history.json')
            trained_at = None
            training_samples = None
            test_mae = None
            test_rmse = None
            
            if os.path.exists(history_path):
                import json
                with open(history_path, 'r') as f:
                    history = json.load(f)
                    test_mae = history.get('val_mae', [None])[-1]
            
            return WorkerRatingModelStatusResponse(
                model_loaded=model is not None,
                model_exists=model_exists,
                trained_at=trained_at,
                training_samples=training_samples,
                test_rmse=test_rmse,
                test_mae=test_mae,
                feature_dim=config.input_dim if config else None
            )
        except Exception:
            pass
    
    # Option 2: Try ML microservice
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(f"{ML_SERVICE_URL}/api/ml/worker-rating-model-status")
            if response.status_code == 200:
                result = response.json()
                return WorkerRatingModelStatusResponse(
                    model_loaded=result.get('model_loaded', False),
                    model_exists=result.get('model_exists', False),
                    trained_at=result.get('trained_at'),
                    training_samples=result.get('training_samples'),
                    test_rmse=result.get('test_rmse'),
                    test_mae=result.get('test_mae'),
                    feature_dim=result.get('feature_dim')
                )
    except (httpx.ConnectError, httpx.TimeoutException):
        pass
    
    # Fallback: No model
    return WorkerRatingModelStatusResponse(
        model_loaded=False,
        model_exists=False
    )


@router.post("/train-worker-rating-model", response=WorkerRatingTrainingResponse)
def trigger_worker_rating_training(request: HttpRequest, data: WorkerRatingTrainingRequest):
    """
    Trigger worker rating model training (ADMIN ONLY).
    
    Note: Training should be run locally (not on Alpine Linux container)
    because TensorFlow is not available. Use the standalone script:
    python scripts/train_worker_rating_model.py
    
    Then copy model files to container:
    docker cp ml_models/worker_rating_* iayos-backend-dev:/app/apps/backend/src/ml_models/
    """
    try:
        import tensorflow as tf
    except ImportError:
        return WorkerRatingTrainingResponse(
            success=False,
            message="TensorFlow not available on this container",
            error="Run training locally with: python scripts/train_worker_rating_model.py"
        )
    
    from ml.worker_rating_training import WorkerRatingTrainingPipeline
    
    try:
        pipeline = WorkerRatingTrainingPipeline()
        
        # Get CSV path - use provided or default
        csv_path = data.csv_path
        if not csv_path:
            csv_path = 'Datasets/global_freelancers_raw.csv'
        
        result = pipeline.train(
            csv_path=csv_path,
            epochs=data.epochs,
            include_db=data.include_db
        )
        
        if result.get('success'):
            metrics = result.get('metrics', {})
            return WorkerRatingTrainingResponse(
                success=True,
                message="Worker rating model trained successfully",
                epochs_run=result.get('epochs_trained'),
                training_time_seconds=result.get('training_time_seconds'),
                train_samples=result.get('training_samples'),
                test_rmse=metrics.get('test_rmse'),
                test_mae=metrics.get('test_mae')
            )
        else:
            return WorkerRatingTrainingResponse(
                success=False,
                message="Training failed",
                error=result.get('error')
            )
    except Exception as e:
        return WorkerRatingTrainingResponse(
            success=False,
            message="Training error",
            error=str(e)
        )


# ============================================================================
# Job Suggestions Endpoint - Database-Driven
# ============================================================================

class JobSuggestionsRequest(Schema):
    category_id: int
    field: str = "title"  # title, description, materials, duration
    query: Optional[str] = None  # Optional partial text to filter
    limit: int = 8

class JobSuggestion(Schema):
    text: str
    frequency: int  # How many completed jobs used this

class JobSuggestionsResponse(Schema):
    suggestions: List[JobSuggestion]
    field: str
    category_name: Optional[str] = None
    source: str  # "database" or "fallback"


@router.post("/job-suggestions", response=JobSuggestionsResponse)
def get_job_suggestions(request: HttpRequest, data: JobSuggestionsRequest):
    """
    Returns suggestions for job fields (title, description, materials, duration)
    mined from completed/in-progress jobs in the same category.
    Falls back to hardcoded suggestions when DB has insufficient data.
    """
    from accounts.models import Job, Specializations
    from django.db.models import Count
    from django.db.models.functions import Lower

    category_name = None
    try:
        spec = Specializations.objects.get(specializationID=data.category_id)
        category_name = spec.specializationName
    except Specializations.DoesNotExist:
        pass

    suggestions = []

    # Query completed/in-progress jobs in this category
    base_qs = Job.objects.filter(
        categoryID_id=data.category_id,
        status__in=["COMPLETED", "IN_PROGRESS"],
    )

    if data.field == "title":
        # Get distinct titles, optionally filtered by partial match
        qs = base_qs.values_list("title", flat=True)
        if data.query and len(data.query) >= 2:
            qs = qs.filter(title__icontains=data.query)

        # Count frequency of each title (case-insensitive)
        title_counts = (
            base_qs.annotate(lower_title=Lower("title"))
            .values("lower_title")
            .annotate(freq=Count("jobID"))
            .order_by("-freq")
        )
        if data.query and len(data.query) >= 2:
            title_counts = title_counts.filter(title__icontains=data.query)
        title_counts = title_counts[: data.limit]

        # Get original-cased titles for display
        seen = set()
        for entry in title_counts:
            lower_t = entry["lower_title"]
            if lower_t not in seen:
                seen.add(lower_t)
                # Find an original-cased version
                original = base_qs.filter(title__iexact=lower_t).values_list("title", flat=True).first()
                if original:
                    suggestions.append(JobSuggestion(text=original, frequency=entry["freq"]))

    elif data.field == "description":
        # Get description snippets (first 120 chars) from completed jobs
        qs = base_qs.exclude(description="").exclude(description__isnull=True)
        if data.query and len(data.query) >= 2:
            qs = qs.filter(description__icontains=data.query)
        descs = qs.order_by("-jobID").values_list("description", flat=True)[: data.limit * 2]

        seen_lower = set()
        for desc in descs:
            snippet = desc[:120].strip()
            if snippet.lower() not in seen_lower:
                seen_lower.add(snippet.lower())
                suggestions.append(JobSuggestion(text=snippet, frequency=1))
            if len(suggestions) >= data.limit:
                break

    elif data.field == "materials":
        # Mine materialsNeeded JSON field for common material items
        qs = base_qs.exclude(materialsNeeded__isnull=True)
        if data.query and len(data.query) >= 2:
            qs = qs.filter(materialsNeeded__icontains=data.query)

        material_freq: dict = {}
        for materials_list in qs.values_list("materialsNeeded", flat=True)[: 200]:
            if isinstance(materials_list, list):
                for item in materials_list:
                    if isinstance(item, str) and item.strip():
                        key = item.strip().lower()
                        if data.query and len(data.query) >= 2 and data.query.lower() not in key:
                            continue
                        if key not in material_freq:
                            material_freq[key] = {"original": item.strip(), "count": 0}
                        material_freq[key]["count"] += 1

        sorted_materials = sorted(material_freq.values(), key=lambda x: -x["count"])
        for m in sorted_materials[: data.limit]:
            suggestions.append(JobSuggestion(text=m["original"], frequency=m["count"]))

    elif data.field == "duration":
        # Get common duration values
        qs = base_qs.exclude(expectedDuration__isnull=True).exclude(expectedDuration="")
        if data.query and len(data.query) >= 2:
            qs = qs.filter(expectedDuration__icontains=data.query)

        dur_counts = (
            qs.values("expectedDuration")
            .annotate(freq=Count("jobID"))
            .order_by("-freq")
        )[: data.limit]

        for entry in dur_counts:
            suggestions.append(
                JobSuggestion(text=entry["expectedDuration"], frequency=entry["freq"])
            )

    # Determine source
    source = "database" if suggestions else "fallback"

    # Fallback to hardcoded if DB returned nothing
    if not suggestions and data.field == "title" and category_name:
        FALLBACK_TITLES = {
            "Plumbing": ["Fix leaking pipe", "Install faucet", "Unclog toilet", "Repair shower", "Water tank cleaning"],
            "Electrical": ["Fix light fixture", "Repair outlet", "Install ceiling fan", "Rewiring work", "Breaker repair"],
            "Carpentry": ["Repair furniture", "Build cabinet", "Fix door lock", "Install shelving", "Deck repair"],
            "Painting": ["Exterior painting", "Interior room paint", "Fence painting", "Cabinet refinishing"],
            "Cleaning": ["Deep house cleaning", "Post-construction cleanup", "Office cleaning", "Window cleaning"],
            "Landscaping": ["Lawn mowing", "Tree trimming", "Garden maintenance", "Planting shrubs"],
            "Masonry": ["Wall repair", "Tile installation", "Floor leveling", "Concrete work"],
            "HVAC": ["AC cleaning", "Repair AC unit", "Install split type AC", "HVAC maintenance"],
            "Roofing": ["Fix roof leak", "Gutter cleaning", "Roof painting", "Roof replacement"],
            "Welding": ["Gate repair", "Window grill fabrication", "Steel frame welding", "Fence repair"],
            "Automotive": ["Engine tune-up", "Oil change", "Brake repair", "Electrical checkup"],
            "General Labor": ["Heavy lifting", "Hauling debris", "General assistance", "Packaging"],
            "Moving": ["House moving", "Office relocation", "Furniture transport"],
            "Delivery": ["Package delivery", "Food delivery", "Messenger service"],
        }
        fallback = FALLBACK_TITLES.get(category_name, [])
        if data.query and len(data.query) >= 2:
            fallback = [t for t in fallback if data.query.lower() in t.lower()]
        for t in fallback[: data.limit]:
            suggestions.append(JobSuggestion(text=t, frequency=0))

    if not suggestions and data.field == "materials" and category_name:
        FALLBACK_MATERIALS = {
            "Plumbing": ["PVC pipe", "Pipe wrench", "Teflon tape", "Faucet set", "Sealant"],
            "Electrical": ["Wire", "Electrical tape", "Circuit breaker", "LED bulb", "Outlet box"],
            "Carpentry": ["Plywood", "Nails", "Wood glue", "Sandpaper", "Hinges"],
            "Painting": ["Paint (latex)", "Paint roller", "Primer", "Brush set", "Masking tape"],
            "Cleaning": ["Cleaning solution", "Mop", "Sponge", "Disinfectant", "Trash bags"],
            "Masonry": ["Cement", "Sand", "Gravel", "Tiles", "Grout"],
            "HVAC": ["Refrigerant", "AC filter", "Copper tube", "Insulation tape"],
            "Roofing": ["Roofing nails", "GI sheet", "Waterproof sealant", "Gutter"],
            "Welding": ["Welding rod", "Steel bar", "Grinder disc", "Paint (anti-rust)"],
        }
        fallback = FALLBACK_MATERIALS.get(category_name, [])
        if data.query and len(data.query) >= 2:
            fallback = [m for m in fallback if data.query.lower() in m.lower()]
        for m in fallback[: data.limit]:
            suggestions.append(JobSuggestion(text=m, frequency=0))

    if not suggestions and data.field == "duration":
        FALLBACK_DURATIONS = ["1 hour", "2 hours", "3 hours", "Half day", "1 day", "2 days", "3 days", "1 week"]
        if data.query and len(data.query) >= 2:
            FALLBACK_DURATIONS = [d for d in FALLBACK_DURATIONS if data.query.lower() in d.lower()]
        for d in FALLBACK_DURATIONS[: data.limit]:
            suggestions.append(JobSuggestion(text=d, frequency=0))

    return JobSuggestionsResponse(
        suggestions=suggestions,
        field=data.field,
        category_name=category_name,
        source=source,
    )
