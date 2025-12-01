"""
Prediction Service for Job Completion Time

This module provides:
1. Real-time prediction service
2. Caching for performance
3. Prediction logging for monitoring
4. Fallback estimates when model unavailable

NOTE: TensorFlow is optional. If not installed, the service will use
fallback statistical estimates based on historical data.
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional
from decimal import Decimal
import os
import httpx

logger = logging.getLogger(__name__)

# ML Service URL (for when TensorFlow not available locally)
ML_SERVICE_URL = os.environ.get('ML_SERVICE_URL', 'http://ml:8002')

# Check if TensorFlow is available
TENSORFLOW_AVAILABLE = False
try:
    import tensorflow as tf
    TENSORFLOW_AVAILABLE = True
    logger.info(f"TensorFlow {tf.__version__} available for ML predictions")
except ImportError:
    logger.warning(
        "TensorFlow not installed locally. Will try ML microservice or use fallback estimates."
    )

# Cache the predictor instance
_predictor_instance = None
_predictor_loaded = False


def get_predictor():
    """
    Get or create the predictor instance (singleton pattern).
    
    Returns:
        CompletionTimePredictor instance or None if loading fails or TensorFlow unavailable
    """
    global _predictor_instance, _predictor_loaded
    
    if not TENSORFLOW_AVAILABLE:
        return None
    
    if not _predictor_loaded:
        try:
            from ml.models import CompletionTimePredictor
            _predictor_instance = CompletionTimePredictor()
            if _predictor_instance.load():
                logger.info("Predictor loaded successfully")
            else:
                logger.warning("Failed to load predictor model")
                _predictor_instance = None
        except Exception as e:
            logger.error(f"Error initializing predictor: {e}")
            _predictor_instance = None
        
        _predictor_loaded = True
    
    return _predictor_instance


def reload_predictor():
    """
    Force reload of the predictor (e.g., after retraining).
    """
    global _predictor_instance, _predictor_loaded
    _predictor_loaded = False
    _predictor_instance = None
    return get_predictor()


def predict_completion_time(job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Predict completion time for a job.
    
    This is the main entry point for predictions.
    Priority:
    1. Local TensorFlow model (if available)
    2. ML microservice (if running)
    3. Fallback statistical estimates
    
    Args:
        job_data: Dictionary with job attributes:
            - category_id: int
            - budget: Decimal or float
            - urgency: str ('LOW', 'MEDIUM', 'HIGH')
            - materials: list of str
            - job_type: str ('LISTING' or 'INVITE')
            - worker_id: int (optional)
            - location: str (optional)
            
    Returns:
        Dictionary with prediction:
        {
            'predicted_hours': float,
            'confidence_interval': (lower, upper),
            'confidence_level': float (0-1),
            'formatted_duration': str,
            'source': 'model' or 'microservice' or 'fallback'
        }
    """
    # Try local predictor first
    predictor = get_predictor()
    
    if predictor is not None:
        try:
            job = _create_job_proxy(job_data)
            prediction = predictor.predict(job)
            prediction['source'] = 'model'
            _log_prediction(job_data, prediction)
            return prediction
        except Exception as e:
            logger.error(f"Local prediction error: {e}")
    
    # Try ML microservice if local TensorFlow not available
    if not TENSORFLOW_AVAILABLE:
        try:
            prediction = _call_ml_service(job_data)
            if prediction and 'error' not in prediction:
                prediction['source'] = 'microservice'
                _log_prediction(job_data, prediction)
                return prediction
        except Exception as e:
            logger.warning(f"ML microservice unavailable: {e}")
    
    # Fallback to statistical estimates
    return _fallback_estimate(job_data)


def _call_ml_service(job_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Call the ML microservice for prediction.
    
    Args:
        job_data: Job attributes dictionary
        
    Returns:
        Prediction dictionary or None if service unavailable
    """
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.post(
                f"{ML_SERVICE_URL}/api/ml/predict-completion-time",
                json={
                    'category_id': job_data.get('category_id'),
                    'budget': float(job_data.get('budget', 0)),
                    'urgency': job_data.get('urgency', 'MEDIUM'),
                    'materials': job_data.get('materials', []),
                    'job_type': job_data.get('job_type', 'LISTING'),
                    'worker_id': job_data.get('worker_id'),
                    'location': job_data.get('location'),
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'predicted_hours': data.get('predicted_hours'),
                    'confidence_interval': (
                        data.get('confidence_interval_lower'),
                        data.get('confidence_interval_upper')
                    ),
                    'confidence_level': data.get('confidence_level', 0.0),
                    'formatted_duration': data.get('formatted_duration', 'Unknown'),
                }
            else:
                logger.warning(f"ML service returned status {response.status_code}")
                return None
                
    except httpx.ConnectError:
        logger.debug("ML microservice not available (connection refused)")
        return None
    except Exception as e:
        logger.warning(f"Error calling ML microservice: {e}")
        return None


def predict_for_job_instance(job) -> Dict[str, Any]:
    """
    Predict completion time for an actual Job model instance.
    
    Args:
        job: Job model instance
        
    Returns:
        Prediction dictionary
    """
    # Build job_data for microservice/fallback
    job_data = {
        'category_id': job.categoryID_id,
        'budget': job.budget,
        'urgency': job.urgency,
        'materials': job.materialsNeeded,
        'job_type': job.jobType,
        'worker_id': job.assignedWorkerID_id,
    }
    
    # Try local predictor first
    predictor = get_predictor()
    
    if predictor is not None:
        try:
            prediction = predictor.predict(job)
            prediction['source'] = 'model'
            return prediction
        except Exception as e:
            logger.error(f"Prediction error for job {job.jobID}: {e}")
    
    # Try ML microservice
    if not TENSORFLOW_AVAILABLE:
        try:
            prediction = _call_ml_service(job_data)
            if prediction and 'error' not in prediction:
                prediction['source'] = 'microservice'
                return prediction
        except Exception as e:
            logger.warning(f"ML microservice unavailable: {e}")
    
    # Fallback to statistical estimates
    return _fallback_estimate(job_data)


def _create_job_proxy(job_data: Dict[str, Any]):
    """
    Create a proxy object that mimics a Job model instance.
    
    This allows predictions without creating actual database records.
    """
    from datetime import datetime
    from decimal import Decimal
    
    class JobProxy:
        def __init__(self, data):
            self.categoryID_id = data.get('category_id')
            self.budget = Decimal(str(data.get('budget', 0)))
            self.urgency = data.get('urgency', 'MEDIUM')
            self.materialsNeeded = data.get('materials', [])
            self.jobType = data.get('job_type', 'LISTING')
            self.assignedWorkerID_id = data.get('worker_id')
            self.createdAt = data.get('created_at', datetime.now())
            
            # For feature extractor compatibility
            self.categoryID = None
            if self.categoryID_id:
                try:
                    from accounts.models import Specializations
                    self.categoryID = Specializations.objects.get(pk=self.categoryID_id)
                except:
                    pass
    
    return JobProxy(job_data)


def _fallback_estimate(job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Provide fallback estimate when model is unavailable.
    
    Uses simple heuristics based on:
    - Category historical averages
    - Budget as proxy for complexity
    - Urgency level
    
    Args:
        job_data: Job attributes dictionary
        
    Returns:
        Estimation dictionary
    """
    from accounts.models import Job, Specializations
    from ml.data_preprocessing import CompletionTimeCalculator
    
    # Base estimate: 4 hours
    base_hours = 4.0
    
    # Adjust based on category historical data
    category_id = job_data.get('category_id')
    if category_id:
        try:
            # Get average completion time for this category
            category_jobs = Job.objects.filter(
                categoryID_id=category_id,
                status='COMPLETED'
            ).order_by('-completedAt')[:50]
            
            completion_times = []
            calculator = CompletionTimeCalculator()
            
            for job in category_jobs:
                hours = calculator.calculate_completion_hours(job)
                if hours:
                    completion_times.append(hours)
            
            if completion_times:
                base_hours = sum(completion_times) / len(completion_times)
                logger.info(f"Category {category_id} avg: {base_hours:.2f} hours from {len(completion_times)} jobs")
        except Exception as e:
            logger.warning(f"Category lookup failed: {e}")
    
    # Adjust based on budget
    budget = float(job_data.get('budget', 0))
    if budget > 0:
        # Higher budget typically means more complex work
        if budget > 10000:
            base_hours *= 1.5
        elif budget > 5000:
            base_hours *= 1.2
        elif budget < 500:
            base_hours *= 0.8
    
    # Adjust based on urgency
    urgency = job_data.get('urgency', 'MEDIUM')
    if urgency == 'HIGH':
        # High urgency jobs typically shorter (rushed)
        base_hours *= 0.85
    elif urgency == 'LOW':
        # Low urgency might stretch longer
        base_hours *= 1.1
    
    # Adjust based on materials count
    materials = job_data.get('materials', [])
    if len(materials) > 5:
        base_hours *= 1.15
    
    # Ensure reasonable bounds
    base_hours = max(0.5, min(base_hours, 720))  # 30 min to 30 days
    
    # Format duration
    if base_hours < 1:
        formatted = f"{int(base_hours * 60)} minutes"
    elif base_hours < 24:
        formatted = f"{base_hours:.1f} hours"
    else:
        days = base_hours / 24
        formatted = f"{days:.1f} days"
    
    return {
        'predicted_hours': round(base_hours, 2),
        'confidence_interval': (
            round(base_hours * 0.5, 2),
            round(base_hours * 2.0, 2)
        ),
        'confidence_level': 0.3,  # Low confidence for fallback
        'formatted_duration': formatted,
        'source': 'fallback',
        'note': 'Prediction based on historical averages (model not loaded)'
    }


def _log_prediction(job_data: Dict[str, Any], prediction: Dict[str, Any]):
    """
    Log prediction for monitoring and model performance tracking.
    
    In production, this could write to a database table or metrics system.
    """
    logger.info(
        f"Prediction: category={job_data.get('category_id')}, "
        f"budget={job_data.get('budget')}, "
        f"predicted_hours={prediction.get('predicted_hours')}, "
        f"confidence={prediction.get('confidence_level')}"
    )


def get_prediction_stats() -> Dict[str, Any]:
    """
    Get statistics about predictions.
    
    Returns:
        Dictionary with prediction statistics
    """
    from ml.training import get_model_info
    
    model_info = get_model_info()
    predictor = get_predictor()
    
    return {
        'model_loaded': predictor is not None,
        'model_info': model_info,
        'predictor_active': _predictor_loaded,
    }


def batch_predict(job_ids: list) -> Dict[int, Dict[str, Any]]:
    """
    Batch predict completion times for multiple jobs.
    
    Args:
        job_ids: List of job IDs
        
    Returns:
        Dictionary mapping job_id to prediction
    """
    from accounts.models import Job
    
    results = {}
    
    jobs = Job.objects.filter(jobID__in=job_ids).select_related(
        'categoryID',
        'assignedWorkerID',
        'assignedWorkerID__profileID'
    )
    
    for job in jobs:
        results[job.jobID] = predict_for_job_instance(job)
    
    return results
