"""
Django Management Command for Training the Completion Time Prediction Model

Usage:
    python manage.py train_completion_model
    python manage.py train_completion_model --min-samples 100
    python manage.py train_completion_model --epochs 50
    python manage.py train_completion_model --verbose
"""

import logging
from django.core.management.base import BaseCommand, CommandError

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Train the LSTM model for job completion time prediction'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--min-samples',
            type=int,
            default=50,
            help='Minimum number of completed jobs required for training (default: 50)'
        )
        parser.add_argument(
            '--epochs',
            type=int,
            default=None,
            help='Number of training epochs (default: 100, with early stopping)'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=None,
            help='Training batch size (default: 32)'
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Print detailed training progress'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Check data availability without training'
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('='*60))
        self.stdout.write(self.style.NOTICE('Job Completion Time Prediction Model Training'))
        self.stdout.write(self.style.NOTICE('='*60))
        
        # Check dependencies
        self.stdout.write('\nChecking dependencies...')
        try:
            import tensorflow as tf
            self.stdout.write(self.style.SUCCESS(f'  ✓ TensorFlow {tf.__version__}'))
        except ImportError:
            raise CommandError(
                'TensorFlow is required. Install with: pip install tensorflow'
            )
        
        try:
            import numpy as np
            self.stdout.write(self.style.SUCCESS(f'  ✓ NumPy {np.__version__}'))
        except ImportError:
            raise CommandError(
                'NumPy is required. Install with: pip install numpy'
            )
        
        try:
            import pandas as pd
            self.stdout.write(self.style.SUCCESS(f'  ✓ Pandas {pd.__version__}'))
        except ImportError:
            self.stdout.write(self.style.WARNING('  ⚠ Pandas not installed (optional)'))
        
        # Check data availability
        self.stdout.write('\nChecking data availability...')
        from accounts.models import Job
        
        completed_count = Job.objects.filter(status='COMPLETED').count()
        active_count = Job.objects.filter(status='ACTIVE').count()
        in_progress_count = Job.objects.filter(status='IN_PROGRESS').count()
        
        self.stdout.write(f'  Total completed jobs: {completed_count}')
        self.stdout.write(f'  Active jobs: {active_count}')
        self.stdout.write(f'  In-progress jobs: {in_progress_count}')
        
        min_samples = options['min_samples']
        
        if completed_count < min_samples:
            raise CommandError(
                f'Insufficient data: {completed_count} completed jobs, '
                f'need at least {min_samples}. '
                f'Use --min-samples to adjust threshold.'
            )
        
        self.stdout.write(self.style.SUCCESS(
            f'  ✓ Data check passed ({completed_count} >= {min_samples})'
        ))
        
        # Dry run check
        if options['dry_run']:
            self.stdout.write(self.style.SUCCESS('\n✓ Dry run complete. Ready for training.'))
            return
        
        # Run training
        self.stdout.write('\nStarting training...\n')
        
        from ml.training import TrainingPipeline
        
        pipeline = TrainingPipeline(verbose=options['verbose'])
        
        try:
            result = pipeline.train(
                min_samples=min_samples,
                epochs=options['epochs'],
                batch_size=options['batch_size']
            )
        except Exception as e:
            raise CommandError(f'Training failed: {e}')
        
        # Report results
        if result.get('success'):
            self.stdout.write('\n' + '='*60)
            self.stdout.write(self.style.SUCCESS('✓ Training Complete!'))
            self.stdout.write('='*60)
            
            metrics = result.get('metrics', {})
            
            self.stdout.write(f"\nTraining Summary:")
            self.stdout.write(f"  • Training samples: {result.get('train_samples')}")
            self.stdout.write(f"  • Validation samples: {result.get('val_samples')}")
            self.stdout.write(f"  • Test samples: {result.get('test_samples')}")
            self.stdout.write(f"  • Epochs run: {result.get('epochs_run')}")
            self.stdout.write(f"  • Training time: {result.get('training_time_seconds'):.2f}s")
            
            self.stdout.write(f"\nModel Performance:")
            self.stdout.write(f"  • Test RMSE: {metrics.get('test_rmse_hours'):.2f} hours")
            self.stdout.write(f"  • Test MAE: {metrics.get('test_mae_hours'):.2f} hours")
            self.stdout.write(f"  • Test MAPE: {metrics.get('test_mape_percent'):.2f}%")
            
            # Run sample predictions
            self.stdout.write(f"\nSample Predictions:")
            samples = pipeline.evaluate_sample_predictions(n_samples=3)
            
            for sample in samples:
                self.stdout.write(f"\n  Job: {sample['job_title']}")
                self.stdout.write(f"    Category: {sample['category']}")
                self.stdout.write(f"    Budget: ₱{sample['budget']:,.2f}")
                self.stdout.write(f"    Actual: {sample['actual_hours']:.2f} hours")
                self.stdout.write(f"    Predicted: {sample['predicted_hours']:.2f} hours ({sample['formatted']})")
                if sample['error_hours']:
                    self.stdout.write(f"    Error: {sample['error_hours']:.2f} hours")
            
            self.stdout.write('\n' + '='*60)
            self.stdout.write(self.style.SUCCESS(
                'Model saved to: apps/backend/src/ml/saved_models/'
            ))
            self.stdout.write(self.style.SUCCESS(
                'To use in API, call POST /api/ml/reload-model'
            ))
            
        else:
            raise CommandError(f"Training failed: {result.get('error')}")
