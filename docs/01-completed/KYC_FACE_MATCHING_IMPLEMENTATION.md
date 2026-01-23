# KYC Face Matching Implementation ✅

**Completed**: December 2025  
**Type**: Backend Enhancement - Identity Verification  
**Impact**: Improved KYC Security via Automated Face Comparison

---

## Overview

Added automatic face matching between ID photo and selfie during KYC upload. Uses CompreFace recognition API to extract face embeddings and calculates cosine similarity to verify the same person is in both images.

---

## What Was Implemented

### 1. Face Matching Service (`document_verification_service.py`)

**New Enum Value**:

```python
class RejectionReason(Enum):
    FACE_MISMATCH = "face_mismatch"  # NEW: Selfie doesn't match ID photo
```

**New Fields**:

```python
@dataclass
class VerificationResult:
    face_embedding: List[float] = field(default_factory=list)  # NEW
```

**New Methods**:

| Method                                               | Purpose                                          |
| ---------------------------------------------------- | ------------------------------------------------ |
| `_extract_face_embedding(image_data)`                | Extracts 512-dim face embedding using CompreFace |
| `compare_faces(id_data, selfie_data)`                | Compares two images and returns match result     |
| `_cosine_similarity(vec_a, vec_b)`                   | Calculates similarity between embedding vectors  |
| `verify_face_match(id_data, selfie_data, threshold)` | Convenience function for face verification       |

### 2. KYC Upload Integration (`services.py`)

**Flow**:

1. User uploads FRONTID + SELFIE images
2. Each document goes through existing AI verification
3. **NEW**: After document verification, face matching runs
4. If similarity < 80%, KYC is auto-rejected with `FACE_MISMATCH` reason
5. Result includes `face_match` object with similarity score

---

## Technical Details

### Face Embedding Extraction

```python
def _extract_face_embedding(self, image_data: bytes) -> Optional[List[float]]:
    """
    Uses CompreFace /api/v1/recognition/faces endpoint
    Returns 512-dimensional face embedding vector
    """
    # POST image to CompreFace
    # Parse face embedding from response
    # Return embedding or None if no face detected
```

### Cosine Similarity Calculation

```python
def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """
    cosine_sim = (A · B) / (||A|| × ||B||)
    Returns: 0.0 to 1.0 (1.0 = identical)
    """
```

### Face Comparison

```python
def compare_faces(self, id_image_data: bytes, selfie_image_data: bytes) -> Dict:
    """
    Returns: {
        "match": True/False,
        "similarity": 0.85,
        "threshold": 0.80,
        "id_face_detected": True,
        "selfie_face_detected": True
    }
    """
```

---

## Matching Threshold

- **Default Threshold**: 0.80 (80% similarity)
- **Match**: `similarity >= threshold`
- **Rejection**: `similarity < threshold`

This threshold balances security with usability:

- Too high (>0.90): May reject legitimate users with different lighting/angles
- Too low (<0.70): May accept different people

---

## API Response Changes

### Success Response

```json
{
    "message": "KYC documents uploaded successfully",
    "kyc_id": 123,
    "status": "PENDING",
    "files": [...],
    "face_match": {
        "match": true,
        "similarity": 0.87,
        "threshold": 0.80,
        "id_face_detected": true,
        "selfie_face_detected": true
    }
}
```

### Rejection Response (Face Mismatch)

```json
{
    "message": "KYC documents uploaded but verification failed",
    "kyc_id": 123,
    "status": "REJECTED",
    "rejection_reasons": [
        "Face mismatch: The selfie does not match the ID photo (similarity: 0.45)"
    ],
    "files": [...],
    "face_match": {
        "match": false,
        "similarity": 0.45,
        "threshold": 0.80
    }
}
```

---

## Error Handling

| Scenario               | Behavior                             |
| ---------------------- | ------------------------------------ |
| No face in ID          | Non-blocking, admin reviews manually |
| No face in selfie      | Non-blocking, admin reviews manually |
| CompreFace unavailable | Non-blocking, logs warning           |
| Network timeout        | Non-blocking, continues processing   |

The system is designed to fail gracefully - face matching errors don't block the entire KYC upload.

---

## Files Modified

### `apps/backend/src/accounts/document_verification_service.py`

- Added `FACE_MISMATCH` to `RejectionReason` enum
- Added `face_embedding` field to `VerificationResult`
- Added `_extract_face_embedding()` method (~35 lines)
- Added `compare_faces()` method (~45 lines)
- Added `_cosine_similarity()` helper (~15 lines)
- Added `verify_face_match()` convenience function (~25 lines)
- Updated `should_auto_reject()` with FACE_MISMATCH message

**Total**: ~120 lines added

### `apps/backend/src/accounts/services.py`

- Added import for `verify_face_match`
- Added `file_data_cache` dictionary to store raw image bytes
- Added file caching for FRONTID and SELFIE during upload loop
- Added face matching block after document verification (~40 lines)
- Added `face_match` to both success and rejection responses

**Total**: ~55 lines added

---

## Testing

### Prerequisites

1. CompreFace running on port 8100
2. Backend running with Django

### Test Cases

**1. Matching Faces (Happy Path)**

```bash
# Upload KYC with matching ID + selfie
# Expected: status=PENDING, face_match.match=true, similarity > 0.80
```

**2. Mismatched Faces**

```bash
# Upload KYC with different person's ID + selfie
# Expected: status=REJECTED, face_match.match=false, similarity < 0.80
```

**3. No Face Detected**

```bash
# Upload KYC with blurry/no-face images
# Expected: Non-blocking, face_match may have face_detected=false
```

**4. CompreFace Unavailable**

```bash
# Stop CompreFace container
# Expected: Face matching skipped, KYC continues normally
```

---

## Configuration

### CompreFace Settings

In `document_verification_service.py`:

```python
COMPREFACE_URL = "http://compreface:8100"  # Docker internal
COMPREFACE_API_KEY = os.environ.get('COMPREFACE_API_KEY', 'your-api-key')
```

### Similarity Threshold

In `services.py` (during face matching call):

```python
verify_face_match(
    id_image_data=...,
    selfie_image_data=...,
    similarity_threshold=0.80  # Adjustable
)
```

---

## Future Enhancements

1. **Liveness Detection**: Add anti-spoofing checks (not implemented per user request)
2. **Multiple Face Detection**: Handle cases with multiple faces in ID/selfie
3. **Face Quality Score**: Add quality assessment before comparison
4. **Threshold Tuning**: Admin UI to adjust similarity threshold
5. **Audit Logging**: Store face embeddings for compliance review

---

## Dependencies

- **CompreFace**: Face recognition service (Docker container)
- **NumPy**: For cosine similarity calculation (already in requirements.txt)

---

## Summary

| Feature                      | Status                                |
| ---------------------------- | ------------------------------------- |
| Face embedding extraction    | ✅ Complete                           |
| Cosine similarity comparison | ✅ Complete                           |
| Auto-rejection on mismatch   | ✅ Complete                           |
| Response includes face_match | ✅ Complete                           |
| Graceful error handling      | ✅ Complete                           |
| UI changes                   | ❌ Not needed (per user request)      |
| Liveness detection           | ❌ Not implemented (per user request) |

**Total Lines Added**: ~175 lines across 2 files
