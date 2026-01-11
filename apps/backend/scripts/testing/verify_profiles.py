#!/usr/bin/env python
import os
import sys
sys.path.insert(0, '/app/apps/backend/src')
os.chdir('/app/apps/backend/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')

import django
django.setup()

from accounts.models import Accounts, Profile

print('=' * 70)
print(' VERIFY PROFILE TYPES IN DATABASE')
print('=' * 70)

# Find the test users we just created
test_users = Accounts.objects.filter(email__contains='test').filter(email__contains='20251212').order_by('-accountID')[:5]

print(f'\nFound {test_users.count()} test users:\n')

for user in test_users:
    profile = Profile.objects.filter(accountFK=user).first()
    print(f'  Email: {user.email}')
    print(f'  Account ID: {user.accountID}')
    if profile:
        print(f'  Profile Type: {profile.profileType}')
        print(f'  Name: {profile.firstName} {profile.lastName}')
    else:
        print(f'  Profile: NOT FOUND')
    print()

print('=' * 70)
