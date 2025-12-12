"""
Reset test accounts for team job testing
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def create_or_reset_account(email, password, first_name, last_name, profile_type, wallet_balance=10000):
    """Create a test account or login if exists"""
    
    # Try to login first
    r = requests.post(f'{BASE_URL}/mobile/auth/login', json={'email': email, 'password': password})
    if r.status_code == 200:
        print(f"✅ {email} exists and can login")
        token = r.json().get('access')
        return token
    
    # Try to register
    print(f"  Attempting to register {email}...")
    r = requests.post(f'{BASE_URL}/mobile/auth/register', json={
        'email': email,
        'password': password,
        'first_name': first_name,
        'last_name': last_name,
        'profile_type': profile_type
    })
    
    if r.status_code in [200, 201]:
        print(f"✅ {email} registered successfully")
        data = r.json()
        return data.get('access') or data.get('token')
    else:
        print(f"❌ Failed to register {email}: {r.status_code} - {r.text[:200]}")
        return None

def main():
    print("="*70)
    print(" RESET TEST ACCOUNTS")
    print("="*70)
    
    # Client account
    print("\n📋 Client Account")
    client_token = create_or_reset_account(
        "testclient_team@test.com", "test123456",
        "Test", "Client", "CLIENT"
    )
    
    # Worker accounts
    print("\n📋 Worker Accounts")
    workers = [
        ("testworker1_team@test.com", "Worker1", "Team"),
        ("testworker2_team@test.com", "Worker2", "Team"),
        ("testworker3_team@test.com", "Worker3", "Team"),
    ]
    
    worker_tokens = []
    for email, first, last in workers:
        token = create_or_reset_account(email, "test123456", first, last, "WORKER")
        if token:
            worker_tokens.append((email, token))
    
    print(f"\n📋 Summary: Client: {'✅' if client_token else '❌'}, Workers: {len(worker_tokens)}/3")
    
    # Add wallet balance to client
    if client_token:
        print("\n📋 Adding wallet balance to client...")
        headers = {'Authorization': f'Bearer {client_token}', 'Content-Type': 'application/json'}
        
        # Check current balance
        r = requests.get(f'{BASE_URL}/accounts/wallet/balance', headers=headers)
        if r.status_code == 200:
            balance = r.json().get('balance', 0)
            print(f"   Current balance: ₱{balance}")
        
        # We need to add balance via direct DB or admin
        print("   Note: To add balance, use admin panel or deposit funds")

if __name__ == "__main__":
    main()
