"""
Django Management Command for Training the Price Budget Prediction Model

Usage:
    python manage.py train_price_budget
    python manage.py train_price_budget --csv /path/to/freelancer_job_postings.csv
    python manage.py train_price_budget --min-samples 100 --epochs 50
    python manage.py train_price_budget --no-db  # CSV only
    python manage.py train_price_budget --verbose
"""

import logging
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Train the LSTM model for price budget prediction'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--csv',
            type=str,
            default=None,
            help='Path to freelancer_job_postings.csv file'
        )
        parser.add_argument(
            '--no-db',
            action='store_true',
            help='Skip database jobs, use only CSV data'
        )
        parser.add_argument(
            '--min-samples',
            type=int,
            default=100,
            help='Minimum number of samples required for training (default: 100)'
        )
        parser.add_argument(
            '--epochs',
            type=int,
            default=100,
            help='Number of training epochs (default: 100, with early stopping)'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=32,
            help='Training batch size (default: 32)'
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Print detailed training progress'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force training even with insufficient samples'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Check data availability without training'
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('='*60))
        self.stdout.write(self.style.NOTICE('Price Budget Prediction Model Training'))
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
            raise CommandError(
                'Pandas is required. Install with: pip install pandas'
            )
        
        # Check CSV file
        csv_path = options.get('csv')
        if csv_path:
            csv_file = Path(csv_path)
            if not csv_file.exists():
                raise CommandError(f'CSV file not found: {csv_path}')
            self.stdout.write(self.style.SUCCESS(f'  ✓ CSV file: {csv_path}'))
            
            # Quick preview of CSV
            df = pd.read_csv(csv_path, nrows=5)
            self.stdout.write(f'    Columns: {list(df.columns)}')
            
            # Count fixed-price jobs
            df_full = pd.read_csv(csv_path)
            total_rows = len(df_full)
            fixed_rows = len(df_full[df_full['rate_type'] == 'fixed'])
            self.stdout.write(f'    Total rows: {total_rows}')
            self.stdout.write(f'    Fixed-price jobs: {fixed_rows}')
        else:
            # Try to find default CSV location
            default_paths = [
                Path('/app/Datasets/freelancer_job_postings.csv'),
                Path('Datasets/freelancer_job_postings.csv'),
                Path('../../../Datasets/freelancer_job_postings.csv'),
            ]
            for p in default_paths:
                if p.exists():
                    csv_path = str(p)
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Found CSV at: {csv_path}'))
                    break
            
            if not csv_path:
                self.stdout.write(self.style.WARNING('  ⚠ No CSV file specified'))
        
        # Check database data
        include_db = not options.get('no_db')
        if include_db:
            self.stdout.write('\nChecking database data...')
            from accounts.models import Job
            completed_jobs = Job.objects.filter(status='COMPLETED', budget__gt=0).count()
            self.stdout.write(f'  Completed jobs with budget: {completed_jobs}')
        
        # Dry run - just check data
        if options.get('dry_run'):
            self.stdout.write(self.style.SUCCESS('\n✓ Dry run complete. Data sources available.'))
            return
        
        # Run training
        self.stdout.write('\n' + '='*60)
        self.stdout.write('Starting Training Pipeline...')
        self.stdout.write('='*60 + '\n')
        
        from ml.price_training import PriceTrainingPipeline
        
        pipeline = PriceTrainingPipeline(verbose=options.get('verbose', True))
        
        result = pipeline.train(
            csv_path=csv_path,
            include_db=include_db,
            min_samples=options['min_samples'],
            epochs=options['epochs'],
            batch_size=options['batch_size'],
            force=options.get('force', False)
        )
        
        if result.get('success'):
            self.stdout.write('\n' + '='*60)
            self.stdout.write(self.style.SUCCESS('✓ Training Complete!'))
            self.stdout.write('='*60)
            self.stdout.write(f"  Model saved to: {result.get('model_path')}")
            self.stdout.write(f"  Epochs run: {result.get('epochs_run')}")
            self.stdout.write(f"  Training time: {result.get('training_time_seconds', 0):.1f}s")
            self.stdout.write(f"  Training samples: {result.get('train_samples')}")
            self.stdout.write(f"  Test RMSE: ₱{result.get('test_rmse_php', 0):.2f}")
            self.stdout.write(f"  Test MAE: ₱{result.get('test_mae_php', 0):.2f}")
            
            # Per-output metrics
            metrics = result.get('metrics_per_output', {})
            if metrics:
                self.stdout.write('\nPer-output metrics:')
                for name, m in metrics.items():
                    self.stdout.write(f"  {name}: RMSE=₱{m['rmse_php']:.2f}, MAE=₱{m['mae_php']:.2f}, MAPE={m['mape']:.1f}%")
        else:
            self.stdout.write(self.style.ERROR(f"\n✗ Training failed: {result.get('error')}"))
            raise CommandError(result.get('error', 'Unknown error'))
