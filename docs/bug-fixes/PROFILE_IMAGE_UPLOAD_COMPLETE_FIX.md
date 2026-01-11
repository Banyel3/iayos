# Profile Image Upload Complete Fix

## Date: October 14, 2025

## Issues Fixed

### Issue 1: Import Error

**Error:** `AttributeError: 'builtin_function_or_method' object has no attribute 'time'`

### Issue 2: Database Field Too Short

**Error:** `value too long for type character varying(50)`

### Issue 3: Next.js Image Configuration

**Error:** `hostname "agtldjbubhrrsxnsdaxc.supabase.co" is not configured under images`

---

## Root Causes & Solutions

### 1. Import Error Fix

**Problem:**

```python
from time import time  # ❌ Imports the function directly
```

When code called `time.time()`, it was actually calling `function.time()` which doesn't exist.

**Solution:**

```python
import time  # ✅ Imports the module
```

Now `time.time()` correctly calls the `time()` function from the time module.

**File Modified:** `apps/backend/src/iayos_project/utils.py`

---

### 2. Database Field Length Fix

**Problem:**

```python
profileImg = models.CharField(max_length=50)  # ❌ Too short for Supabase URLs
```

Supabase storage URLs are typically 100-500 characters long:

```
https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_6/profileImage/avatar.png
```

This URL is ~105 characters, exceeding the 50-character limit.

**Solution:**

```python
profileImg = models.CharField(max_length=500)  # ✅ Sufficient for URLs
```

**File Modified:** `apps/backend/src/accounts/models.py`

**Migration:** User confirmed migrations completed successfully

---

### 3. Next.js Image Configuration Fix

**Problem:**
Next.js requires explicit configuration to load images from external domains for security reasons.

**Solution:**
Added Supabase domain to allowed image sources in `next.config.ts`:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'agtldjbubhrrsxnsdaxc.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**',
    },
  ],
},
```

**File Modified:** `apps/frontend_web/next.config.ts`

**Benefits:**

- ✅ Allows Next.js `<Image>` component to load Supabase images
- ✅ Maintains security by only allowing specific domain/path
- ✅ Enables image optimization features
- ✅ Prevents CORS issues

---

## Complete Fix Summary

### Backend Changes

#### 1. `apps/backend/src/iayos_project/utils.py`

```python
# Before
from time import time

# After
import time
```

#### 2. `apps/backend/src/accounts/models.py`

```python
# Before
profileImg = models.CharField(max_length=50)

# After
profileImg = models.CharField(max_length=500)  # Increased for Supabase storage URLs
```

#### 3. Database Migration

```bash
# User ran:
py manage.py makemigrations
py manage.py migrate
```

### Frontend Changes

#### 4. `apps/frontend_web/next.config.ts`

```typescript
// Added images configuration
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'agtldjbubhrrsxnsdaxc.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**',
    },
  ],
},
```

---

## Testing Checklist

### Backend Testing

- [x] Fixed import error
- [x] Fixed database field length
- [x] Migration completed
- [ ] Test profile image upload endpoint
- [ ] Verify image URL is saved correctly
- [ ] Check URL length is within limits

### Frontend Testing

- [x] Added Supabase to allowed image domains
- [ ] Test image display with `<Image>` component
- [ ] Verify image loads without console errors
- [ ] Test image upload flow end-to-end

### End-to-End Testing

1. [ ] Login as a user
2. [ ] Go to profile edit page
3. [ ] Click "Edit Image" or "Upload Profile Image"
4. [ ] Select an image file (JPEG, PNG, WEBP)
5. [ ] Upload the image
6. [ ] Verify backend returns 200 success
7. [ ] Verify image URL is saved in database
8. [ ] Verify image displays on profile page
9. [ ] Refresh page and verify image persists
10. [ ] Check console for no errors

---

## URL Structure

### Supabase Storage URLs

Profile images are stored with this structure:

```
https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_{userID}/profileImage/avatar.png
```

**Components:**

- **Base URL:** `https://agtldjbubhrrsxnsdaxc.supabase.co`
- **Storage Path:** `/storage/v1/object/public`
- **Bucket:** `users`
- **User Path:** `user_{userID}/profileImage/`
- **Filename:** `avatar.png` (or custom name)

**Example:**

```
https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_6/profileImage/avatar.png
```

---

## Next.js Image Configuration Explained

### remotePatterns vs domains

**Old Way (domains):**

```typescript
images: {
  domains: ['agtldjbubhrrsxnsdaxc.supabase.co'],  // ⚠️ Deprecated
}
```

**New Way (remotePatterns):**

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',          // Only HTTPS allowed
      hostname: 'agtldjbubhrrsxnsdaxc.supabase.co',
      port: '',                   // Default port
      pathname: '/storage/v1/object/public/**',  // Only this path
    },
  ],
}
```

**Why remotePatterns is better:**

- ✅ More specific security controls
- ✅ Can restrict to specific paths
- ✅ Protocol enforcement
- ✅ Port specification
- ✅ Wildcard patterns supported
- ✅ Future-proof (recommended by Next.js)

---

## Image Upload Flow

### 1. Frontend → Backend

```typescript
const formData = new FormData();
formData.append("profile_image", imageFile);

const response = await fetch("/api/accounts/upload/profile-image", {
  method: "POST",
  body: formData,
  credentials: "include",
});
```

### 2. Backend Validation

```python
# Check file type
allowed_mime_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
if profile_image_file.content_type not in allowed_mime_types:
    raise ValueError("Invalid file type")

# Check file size
max_size = 5 * 1024 * 1024  # 5 MB
if profile_image_file.size > max_size:
    raise ValueError("File too large")
```

### 3. Upload to Supabase

```python
image_url = upload_profile_image(
    file=profile_image_file,
    user_id=user.accountID
)
# Returns: https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_6/profileImage/avatar.png
```

### 4. Save to Database

```python
profile.profileImg = image_url  # Now fits in VARCHAR(500)
profile.save()
```

### 5. Return to Frontend

```json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "image_url": "https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_6/profileImage/avatar.png",
  "accountID": "6"
}
```

### 6. Display Image

```tsx
<Image
  src={profile.profileImg} // Next.js now allows this domain
  alt="Profile"
  width={200}
  height={200}
/>
```

---

## Error Handling

### Backend Errors Handled:

- ✅ Invalid file type
- ✅ File too large (>5MB)
- ✅ User profile not found
- ✅ Upload to Supabase failed
- ✅ Database save failed

### Frontend Errors Handled:

- ✅ Invalid hostname (fixed with config)
- ✅ Image load failures
- ✅ Network errors

---

## Performance Considerations

### Image Optimization

Next.js automatically optimizes images when using the `<Image>` component:

- ✅ Automatic WebP conversion
- ✅ Responsive image sizing
- ✅ Lazy loading
- ✅ Blur-up placeholder support
- ✅ Prevents layout shift

### Recommended Image Component Usage:

```tsx
<Image
  src={profileImg}
  alt="Profile picture"
  width={200}
  height={200}
  className="rounded-full"
  quality={85}
  priority={false} // Use true for above-the-fold images
/>
```

---

## Security Considerations

### Backend:

- ✅ File type validation (only images)
- ✅ File size limits (5MB max)
- ✅ Authentication required
- ✅ User can only upload their own profile image

### Frontend:

- ✅ Domain whitelist in Next.js config
- ✅ Path restrictions (`/storage/v1/object/public/**`)
- ✅ HTTPS only
- ✅ No arbitrary external images allowed

---

## Future Enhancements

### Potential Improvements:

1. **Image Compression:** Compress images before upload
2. **Multiple Formats:** Accept more formats (GIF, SVG)
3. **Image Cropping:** Allow users to crop/resize
4. **Thumbnails:** Generate multiple sizes
5. **CDN:** Add CDN for faster delivery
6. **Validation:** Check image dimensions
7. **Progress:** Show upload progress
8. **Preview:** Show preview before upload

---

## Related Files

### Modified:

1. ✅ `apps/backend/src/iayos_project/utils.py`
2. ✅ `apps/backend/src/accounts/models.py`
3. ✅ `apps/frontend_web/next.config.ts`

### Related (Not Modified):

- `apps/backend/src/accounts/services.py` - Upload service logic
- `apps/backend/src/accounts/api.py` - API endpoint
- `apps/frontend_web/app/*/profile/page.tsx` - Profile pages using images

---

## Documentation Created:

1. ✅ `PROFILE_IMAGE_UPLOAD_FIX.md` - Initial import error fix
2. ✅ This document - Complete fix documentation

---

## Status

✅ **ALL FIXES COMPLETE**

- Import error fixed
- Database field length increased
- Migration completed
- Next.js image configuration added
- Ready for end-to-end testing

---

**Last Updated:** October 14, 2025
**Status:** ✅ Ready for Testing
