"""
Django App Configuration for ML Module
"""

from django.apps import AppConfig


class MlConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ml'
    verbose_name = 'Machine Learning'
    
    def ready(self):
        """
        Called when Django starts.
        Can be used to pre-load models for faster first prediction.
        """
        # Optionally pre-load the model on startup
        # Uncomment to enable:
        # from ml.prediction_service import get_predictor
        # get_predictor()
        pass
