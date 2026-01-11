import requests

url = 'http://localhost:8000/api/agency/upload'

# replace with a valid session cookies if auth required; for cookie_auth we need the 'access' cookie
cookies = {
    # 'access': '<JWT_ACCESS_TOKEN_HERE>'
}

files = {
    'business_permit': ('permit.pdf', b'PDF-DATA', 'application/pdf'),
    'rep_front': ('rep_front.jpg', b'JPEG-DATA', 'image/jpeg'),
    'rep_back': ('rep_back.jpg', b'JPEG-DATA', 'image/jpeg'),
    'address_proof': ('address.pdf', b'PDF-DATA', 'application/pdf'),
    'auth_letter': ('auth.pdf', b'PDF-DATA', 'application/pdf'),
}

data = {
    'accountID': '1',
    'businessName': 'Test Agency',
    'businessDesc': 'Test desc'
}

r = requests.post(url, data=data, files=files, cookies=cookies)
print('status:', r.status_code)
try:
    print('json:', r.json())
except Exception:
    print('text:', r.text)
