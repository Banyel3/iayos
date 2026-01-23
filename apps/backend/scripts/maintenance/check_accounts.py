import os
import sys
sys.path.insert(0, '/app/apps/backend/src')
os.chdir('/app/apps/backend/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')

import django
django.setup()

from accounts.models import Accounts

users = Accounts.objects.filter(isVerified=True).order_by('-accountID')[:10]

print('Verified Accounts:')
for user in users:
    print(f'  {user.email} - ID: {user.accountID}, Verified: {user.isVerified}, Superuser: {user.is_superuser}')
