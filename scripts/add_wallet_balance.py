import os, sys
sys.path.insert(0, '/app/apps/backend/src')
os.chdir('/app/apps/backend/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
import django
django.setup()

from accounts.models import Accounts, Wallet
from django.contrib.auth.hashers import make_password
from decimal import Decimal

# Add balance to testclient
try:
    user = Accounts.objects.get(email='testclient@iayos.com')
    wallet, created = Wallet.objects.get_or_create(accountFK=user)
    wallet.balance = Decimal('50000.00')  # Add 50k for testing
    wallet.save()
    print(f'✅ Client wallet balance updated to ₱{wallet.balance}')
except Exception as e:
    print(f'❌ Client error: {e}')

# Reset testworker password
try:
    worker = Accounts.objects.get(email='testworker@iayos.com')
    worker.password = make_password('password123')
    worker.save()
    print(f'✅ Worker password updated')
except Exception as e:
    print(f'❌ Worker error: {e}')
