# Job Image Upload Implementation

## Overview

Implemented job image upload functionality that allows clients to attach photos to job postings. Images are stored in Supabase storage with an organized folder structure.

## Storage Structure

- **Bucket**: `users` (existing public bucket)
- **Path Pattern**: `users/user_{userID}/job_{jobID}/filename.ext`
- **Example**: `users/user_123/job_456/kitchen_repair.jpg`

## Backend Changes

### 1. Updated `/apps/backend/src/jobs/api.py`

#### Added Imports

```python
from ninja import Router, File
from ninja.files import UploadedFile
from accounts.models import ..., JobPhoto
```

#### New Endpoint: Upload Job Image

**Route**: `POST /api/jobs/{job_id}/upload-image`

**Features**:

- Authentication required (cookie_auth)
- Validates user owns the job
- File type validation (JPEG, PNG, JPG, WEBP)
- File size validation (max 5MB)
- Uploads to Supabase storage
- Creates JobPhoto database record

**Request**:

- **Path Parameter**: `job_id` (int)
- **File**: `image` (UploadedFile)

**Response**:

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "image_url": "https://supabase.co/.../image.jpg",
  "photo_id": 123
}
```

**Error Responses**:

- 400: Invalid file type or size
- 404: Job not found or no permission
- 500: Upload failed

## Frontend Changes

### 1. Updated `/apps/frontend_web/app/dashboard/myRequests/page.tsx`

#### New State Variables

```typescript
const [selectedImages, setSelectedImages] = useState<File[]>([]);
const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
const [uploadingImages, setUploadingImages] = useState(false);
```

#### New Functions

**`handleImageSelect()`**

- Handles file input change event
- Validates file types (JPEG, PNG, JPG, WEBP)
- Validates file size (max 5MB per file)
- Creates preview URLs for selected images
- Allows multiple file selection

**`handleRemoveImage(index)`**

- Removes image from selection
- Revokes preview URL to prevent memory leaks

**Cleanup Effect**

- Revokes all preview URLs when component unmounts

#### Updated Job Submission Flow

```typescript
1. Create job posting via /api/jobs/create
2. Get job_posting_id from response
3. For each selected image:
   - Upload to /api/jobs/{job_id}/upload-image
   - Log errors if upload fails (doesn't block job creation)
4. Reset form including image states
5. Refresh page
```

#### New UI Components

**File Input** (hidden)

```tsx
<input
  type="file"
  id="job-images"
  accept="image/jpeg,image/png,image/jpg,image/webp"
  multiple
  onChange={handleImageSelect}
  className="hidden"
/>
```

**Upload Area** (clickable label)

- Upload icon with dashed border
- Hover effect (border turns blue)
- Help text: "PNG, JPG, WEBP up to 5MB each"

**Image Previews Grid**

- 3-column grid layout
- Thumbnail preview (24px height, object-cover)
- Remove button (red × on top-right corner)
- Only shows when images selected

**Updated Submit Button**

- Disabled during image upload
- Shows "Uploading images..." text when uploading
- Shows loading spinner for both posting and uploading

## Database Model

### JobPhoto (already existed)

```python
class JobPhoto(models.Model):
    photoID = BigAutoField(primary_key=True)
    jobID = ForeignKey(Job, related_name='photos')
    photoURL = CharField(max_length=255)
    fileName = CharField(max_length=255, null=True)
    uploadedAt = DateTimeField(auto_now_add=True)
```

## User Flow

### Posting a Job with Images

1. **Client opens "Post a Job" modal**
2. **Fills out job details** (title, description, budget, etc.)
3. **Clicks photo upload area**
   - Browser opens file picker
   - Can select multiple images
4. **Selected images appear as thumbnails**
   - Can remove individual images
   - Can add more images
5. **Clicks "Post Job" button**
   - Form validates (title, category, budget, location, etc.)
   - Job posting created in database
   - Images uploaded to Supabase storage (in parallel)
   - JobPhoto records created
   - Success message shown
6. **Modal closes and page refreshes**

## Validation & Error Handling

### Backend Validations

- ✅ User authentication required
- ✅ User must own the job
- ✅ File type must be image (JPEG, PNG, JPG, WEBP)
- ✅ File size must be ≤ 5MB
- ✅ Job must exist in database

### Frontend Validations

- ✅ File type checked before adding to selection
- ✅ File size checked before adding to selection
- ✅ Alert shown for invalid files
- ✅ Preview URLs cleaned up to prevent memory leaks

### Error Handling

- Backend errors logged to console
- Failed image uploads don't block job creation
- User still gets success message if job created
- Individual upload failures logged separately

## Storage Path Examples

```
users/
  user_1/
    job_1/
      kitchen_before.jpg
      kitchen_after.jpg
    job_2/
      plumbing_issue.png
  user_2/
    job_3/
      garden_photo1.jpg
      garden_photo2.jpg
      garden_photo3.webp
```

## Testing Checklist

- [ ] Upload single image (JPEG)
- [ ] Upload multiple images (PNG, JPG, WEBP)
- [ ] Try uploading invalid file type (should show alert)
- [ ] Try uploading file > 5MB (should show alert)
- [ ] Remove image from preview
- [ ] Create job without images (should work)
- [ ] Create job with images (should upload to correct path)
- [ ] Verify images stored in: users/user*{id}/job*{id}/
- [ ] Check JobPhoto records created in database
- [ ] Verify image URLs are accessible
- [ ] Check preview URLs cleaned up (no memory leaks)
- [ ] Verify submit button disabled during upload
- [ ] Test error handling (network error, server error)

## Future Enhancements

1. **Drag & Drop Support**
   - Add drag-and-drop zone for images
   - Visual feedback during drag

2. **Image Compression**
   - Client-side compression before upload
   - Reduce storage costs and upload time

3. **Image Cropping/Editing**
   - Allow users to crop images
   - Basic filters or adjustments

4. **Progress Indicator**
   - Show upload progress percentage
   - Individual progress for each image

5. **Image Reordering**
   - Allow users to reorder images
   - Set primary/featured image

6. **Display in Job Details**
   - Show uploaded images in job detail modal
   - Image gallery/carousel view

## Notes

- Images are uploaded **after** job creation succeeds
- Upload failures don't rollback the job creation
- Job ID is required for storage path (created before upload)
- All preview URLs are cleaned up on unmount
- Multiple images supported (no hard limit, but 5MB per file)
- Images are public (stored in public bucket)
- File names preserved from original upload
