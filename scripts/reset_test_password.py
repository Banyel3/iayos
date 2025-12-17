import os
import sys
sys.path.insert(0, '/app/apps/backend/src')
os.chdir('/app/apps/backend/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')

import django
django.setup()

from accounts.models import Accounts
from django.contrib.auth.hashers import make_password

# Update password for testclient
try:
    user = Accounts.objects.get(email='testclient@iayos.com')
    user.password = make_password('password123')
    user.save()
    print(f'✅ Password updated for {user.email}')
except Exception as e:
    print(f'❌ Error: {e}')
