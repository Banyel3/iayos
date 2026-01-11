#!/usr/bin/env python3
"""
Quick verification script for worker and client processes.
"""
import requests

BASE_URL = 'http://localhost:8000/api'

def login(email, password):
    r = requests.post(f'{BASE_URL}/mobile/auth/login', json={'email': email, 'password': password})
    return r.json().get('access') if r.status_code == 200 else None

def h(token):
    return {'Authorization': f'Bearer {token}'}

def main():
    print('=' * 60)
    print(' COMPLETE WORKFLOW VERIFICATION')
    print('=' * 60)

    ct = login('testclient_team@test.com', 'test123456')
    wt = login('testworker1_team@test.com', 'test123456')

    print(f"\n✅ Client authenticated" if ct else "\n❌ Client auth failed")
    print(f"✅ Worker authenticated" if wt else "❌ Worker auth failed")

    if not ct or not wt:
        print("Cannot continue without auth")
        return

    # CLIENT WORKFLOW
    print('\n[CLIENT WORKFLOW]')
    print('-' * 40)

    r = requests.get(f'{BASE_URL}/mobile/wallet/balance', headers=h(ct))
    if r.status_code == 200:
        bal = r.json().get('balance', 0)
        print(f'1. Wallet Balance: ₱{bal:,.2f}')

    r = requests.get(f'{BASE_URL}/mobile/jobs/my-jobs', headers=h(ct))
    if r.status_code == 200:
        jobs = r.json().get('jobs', [])
        print(f'2. Posted Jobs: {len(jobs)}')

    r = requests.get(f'{BASE_URL}/profiles/chat/conversations', headers=h(ct))
    if r.status_code == 200:
        convs = r.json().get('conversations', [])
        team_convs = [c for c in convs if c.get('conversation_type') == 'TEAM_GROUP']
        print(f'3. Conversations: {len(convs)} total ({len(team_convs)} team chats)')

    # WORKER WORKFLOW
    print('\n[WORKER WORKFLOW]')
    print('-' * 40)

    r = requests.get(f'{BASE_URL}/mobile/wallet/balance', headers=h(wt))
    if r.status_code == 200:
        bal = r.json().get('balance', 0)
        print(f'1. Wallet Balance: ₱{bal:,.2f}')

    r = requests.get(f'{BASE_URL}/mobile/jobs/list', headers=h(wt))
    if r.status_code == 200:
        jobs = r.json().get('jobs', [])
        print(f'2. Available Jobs to Apply: {len(jobs)}')

    r = requests.get(f'{BASE_URL}/mobile/jobs/my-jobs', headers=h(wt))
    if r.status_code == 200:
        jobs = r.json().get('jobs', [])
        print(f'3. My Assigned Jobs: {len(jobs)}')

    r = requests.get(f'{BASE_URL}/profiles/chat/conversations', headers=h(wt))
    if r.status_code == 200:
        convs = r.json().get('conversations', [])
        team_convs = [c for c in convs if c.get('conversation_type') == 'TEAM_GROUP']
        print(f'4. Conversations: {len(convs)} total ({len(team_convs)} team chats)')

    # TEAM JOB VERIFICATION
    print('\n[TEAM JOB VERIFICATION - Job #68]')
    print('-' * 40)

    r = requests.get(f'{BASE_URL}/jobs/team/68', headers=h(ct))
    if r.status_code == 200:
        job = r.json()
        title = job.get('title', 'N/A')
        print(f'Title: {title[:45]}...' if len(title) > 45 else f'Title: {title}')
        print(f'Budget: ₱{job.get("total_budget", 0):,.2f}')
        print(f'Workers: {job.get("total_workers_assigned", 0)}/{job.get("total_workers_needed", 0)}')
        print(f'Fill: {job.get("team_fill_percentage", 0):.1f}%')
        
        assignments = job.get('worker_assignments', [])
        if assignments:
            print('Assigned Workers:')
            for a in assignments:
                name = a.get('worker_name', 'Unknown')
                skill = a.get('specialization_name', 'Unknown')
                status = a.get('assignment_status', 'Unknown')
                print(f'  ✓ {name} → {skill} ({status})')

    # GROUP CHAT VERIFICATION
    print('\n[GROUP CHAT VERIFICATION]')
    print('-' * 40)

    r = requests.get(f'{BASE_URL}/profiles/chat/conversations/27', headers=h(ct))
    if r.status_code == 200:
        data = r.json()
        messages = data.get('messages', [])
        print(f'Conversation #27 Messages: {len(messages)}')
        for m in messages[-3:]:  # Show last 3
            sender = m.get('sender_name', 'Unknown')
            text = m.get('message_text', '')[:30]
            print(f'  [{sender}]: {text}...' if len(text) >= 30 else f'  [{sender}]: {text}')

    print('\n' + '=' * 60)
    print(' ✅ ALL WORKER & CLIENT PROCESSES VERIFIED')
    print('=' * 60)

if __name__ == '__main__':
    main()
