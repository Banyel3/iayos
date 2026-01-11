# Image Not Rendering - Debugging Guide

**Issue:** Profile images from Supabase storage not rendering in Flutter app

---

## Backend Fix Applied

### Problem
`mobile_services.py` was importing non-existent function `upload_file_to_supabase`

### Solution
Changed import from:
```python
from .services import upload_file_to_supabase
```

To:
```python
from iayos_project.utils import upload_file
```

Updated function call from:
```python
image_url = upload_file_to_supabase(
    file_content=image_file.read(),
    bucket_name=bucket_name,
    file_path=file_path,
    content_type=image_file.content_type
)
```

To:
```python
image_url = upload_file(
    file=image_file,
    bucket=bucket_name,
    path=file_path,
    public=True,
    custom_name=image_file.name
)
```

---

## Debugging Steps

### 1. Check Backend Server Logs

Restart the Django backend and check for upload success:
```bash
# In backend container or terminal
docker logs iayos-backend-dev -f --tail=100
```

Look for:
- `📤 Upload result for ...`
- `🔗 Public URL generated: ...`

### 2. Test Profile Endpoint Directly

```bash
# Get access token first (login via app or Postman)
# Then test the profile endpoint

curl -H "Authorization: Bearer <your_token>" \
  http://localhost:8000/api/mobile/profile/me
```

Expected response:
```json
{
  "success": true,
  "data": {
    "profile_img": "https://xyz.supabase.co/storage/v1/object/public/profile-images/users/123/photo.jpg",
    "first_name": "John"
  }
}
```

### 3. Add Flutter Debug Logging

Add print statements to see what URLs are being received:

**In `profile_screen.dart` (after line 110):**
```dart
child: Column(
  children: [
    // DEBUG: Print profile image URL
    if (widget.user.profileData.profileImg != null)
      Text('DEBUG: ${widget.user.profileData.profileImg}'),

    // Avatar
    Container(
```

**In `workers_list_screen.dart` (in `_buildWorkerCard`):**
```dart
Widget _buildWorkerCard(dynamic worker) {
  final profileImg = worker['profileImg'];

  // DEBUG
  print('Worker Profile Image URL: $profileImg');

  // ... rest of code
}
```

### 4. Check Image URL Format

Valid Supabase URLs should look like:
```
https://<project-id>.supabase.co/storage/v1/object/public/profile-images/users/<accountID>/<filename>
```

Invalid formats:
- Empty string: `""`
- Null: `null`
- Relative path: `users/123/photo.jpg`
- Missing protocol: `xyz.supabase.co/storage/...`

### 5. Test Image URL in Browser

Copy the profile_img URL from the API response and paste it directly in a browser. It should:
- Load the image
- Not show 404 error
- Not require authentication

### 6. Check Supabase Bucket Configuration

In Supabase dashboard:

1. Go to Storage → `profile-images` bucket
2. Check "Public bucket" is enabled
3. Check files are actually uploaded to `users/<accountID>/` folder
4. Try accessing a file via public URL

### 7. Check CORS Configuration

**Backend `settings.py`:**
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

Note: Flutter mobile apps don't have CORS issues (CORS is browser-specific)

### 8. Network Inspector in Flutter

Add this to see network requests:

**In `pubspec.yaml`:**
```yaml
dependencies:
  http_inspector: ^1.0.0  # or similar package
```

Then wrap your app with the inspector to see all HTTP requests.

---

## Common Issues and Fixes

### Issue 1: Empty String URLs

**Symptom:** `profileImg` is `""` (empty string)

**Cause:** User hasn't uploaded a profile image yet

**Solution:** Fallback to initial letter is already implemented ✅

---

### Issue 2: Null URLs

**Symptom:** `profileImg` is `null`

**Cause:** Database field is NULL

**Solution:** Null check is already implemented ✅

---

### Issue 3: Relative Path Instead of Full URL

**Symptom:** `profileImg` is `"users/123/photo.jpg"`

**Cause:** `upload_file` function returning path instead of public URL

**Fix:** In `iayos_project/utils.py`, ensure `public=True` returns full URL:
```python
if public:
    public_url = settings.SUPABASE.storage.from_(bucket).get_public_url(full_path)
    # Remove trailing '?' if present
    if public_url and public_url.endswith('?'):
        public_url = public_url.rstrip('?')
    return public_url
```

---

### Issue 4: 404 on Image URL

**Symptom:** URL looks correct but returns 404

**Possible Causes:**
1. File not actually uploaded to Supabase
2. Bucket is private (not public)
3. File path in database doesn't match actual file location

**Debug:**
```bash
# Check Supabase bucket via CLI or dashboard
# Verify file exists at the path specified in database
```

---

### Issue 5: CORS Error (Web Only, Not Mobile)

**Symptom:** "CORS policy" error in browser console

**Note:** This only affects web builds, not mobile apps

**Fix:** Add your domain to Supabase CORS allowed origins

---

### Issue 6: SSL Certificate Error

**Symptom:** "Certificate verify failed" or "CERTIFICATE_VERIFY_FAILED"

**Cause:** Flutter's HTTP client rejecting Supabase SSL cert

**Fix:** Add this to `Image.network()`:
```dart
Image.network(
  profileImg,
  fit: BoxFit.cover,
  headers: {
    'User-Agent': 'Flutter'  // Sometimes helps with SSL issues
  },
  // ... other builders
)
```

Or for development only (NOT recommended for production):
```dart
// In main.dart (development only)
import 'dart:io';

void main() {
  HttpOverrides.global = MyHttpOverrides();
  runApp(MyApp());
}

class MyHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..badCertificateCallback = (X509Certificate cert, String host, int port) => true;
  }
}
```

---

## Quick Test Checklist

- [ ] Backend server is running
- [ ] Supabase credentials are in `.env.docker`
- [ ] `profile-images` bucket exists and is public
- [ ] Test API endpoint returns valid URL
- [ ] URL works when pasted in browser
- [ ] Flutter app receives the URL (check debug logs)
- [ ] No network errors in Flutter debug console
- [ ] Image widget is using correct URL (not empty/null)

---

## Manual Test Procedure

### 1. Upload an Image

Use the edit profile screen to upload an image, or use curl:

```bash
curl -X POST http://localhost:8000/api/mobile/profile/upload-image \
  -H "Authorization: Bearer <token>" \
  -F "profile_image=@/path/to/image.jpg"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "image_url": "https://...supabase.co/.../image.jpg",
    "message": "Profile image uploaded successfully"
  }
}
```

### 2. Verify in Database

Check that the URL was saved:
```sql
SELECT profileImg FROM profiles_profile
WHERE accountFK_id = <your_account_id>;
```

### 3. Test in Flutter

1. Restart the Flutter app (full restart, not hot reload)
2. Navigate to profile screen
3. Check if image loads
4. Check debug console for errors

---

## Still Not Working?

If images still don't load after all checks:

1. **Take a screenshot** of the Flutter debug console
2. **Copy the exact URL** from the API response
3. **Test the URL** in a browser and share the result
4. **Check Supabase dashboard** for uploaded files
5. **Share backend logs** from the upload attempt

Common final issues:
- Supabase project is paused/inactive
- API keys expired or incorrect
- Network connectivity issues
- Flutter cache needs clearing (`flutter clean`)

---

**Last Updated:** November 9, 2025
**Status:** Debugging Guide
