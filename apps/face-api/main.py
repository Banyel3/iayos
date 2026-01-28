"""
MediaPipe Face Detection Microservice

A lightweight FastAPI service for face detection.
Uses Google's MediaPipe - optimized for low memory usage (~150MB).

Endpoints:
- GET /health - Health check
- POST /detect - Detect faces in an image
"""

import io
import os
import logging
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
import numpy as np
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MediaPipe configuration
MIN_DETECTION_CONFIDENCE = float(os.getenv("MIN_DETECTION_CONFIDENCE", "0.5"))

# Global face detector
face_detector = None


def load_mediapipe():
    """Load MediaPipe face detection model on startup"""
    global face_detector
    
    try:
        import time
        start = time.time()
        logger.info("🔄 Loading MediaPipe Face Detection...")
        
        import mediapipe as mp
        
        # Use the face detection module
        mp_face_detection = mp.solutions.face_detection
        
        # Initialize with model selection 0 (short-range, faster) or 1 (full-range)
        # Short-range is optimized for faces within 2 meters, perfect for ID photos
        face_detector = mp_face_detection.FaceDetection(
            model_selection=0,  # 0 = short-range (fast), 1 = full-range
            min_detection_confidence=MIN_DETECTION_CONFIDENCE
        )
        
        elapsed = time.time() - start
        logger.info(f"✅ MediaPipe loaded in {elapsed:.1f}s")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to load MediaPipe: {e}")
        return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup"""
    load_mediapipe()
    yield
    # Cleanup
    if face_detector:
        face_detector.close()


app = FastAPI(
    title="Face Detection API",
    description="Lightweight face detection using MediaPipe",
    version="1.0.0",
    lifespan=lifespan
)


# Response models
class DetectionResult(BaseModel):
    detected: bool
    count: int
    confidence: float
    faces: list = []
    error: Optional[str] = None


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if face_detector is not None else "degraded",
        "model": "mediapipe",
        "model_loaded": face_detector is not None
    }


@app.post("/detect", response_model=DetectionResult)
async def detect_faces(file: UploadFile = File(...)):
    """
    Detect faces in an uploaded image.
    
    Returns:
    - detected: bool - whether any faces were found
    - count: int - number of faces detected
    - confidence: float - highest face confidence score
    - faces: list - face bounding boxes
    """
    if face_detector is None:
        raise HTTPException(status_code=503, detail="Face detection model not loaded")
    
    try:
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array for MediaPipe
        img_array = np.array(image)
        
        # Detect faces
        results = face_detector.process(img_array)
        
        if not results.detections:
            return DetectionResult(
                detected=False,
                count=0,
                confidence=0.0,
                faces=[]
            )
        
        # Extract face info
        face_data = []
        max_confidence = 0.0
        img_height, img_width = img_array.shape[:2]
        
        for detection in results.detections:
            # Get confidence score
            score = detection.score[0] if detection.score else 0.0
            
            if score > max_confidence:
                max_confidence = score
            
            # Get bounding box (relative coordinates)
            bbox = detection.location_data.relative_bounding_box
            
            # Convert to absolute coordinates
            x_min = int(bbox.xmin * img_width)
            y_min = int(bbox.ymin * img_height)
            x_max = int((bbox.xmin + bbox.width) * img_width)
            y_max = int((bbox.ymin + bbox.height) * img_height)
            
            face_data.append({
                "bbox": {
                    "x_min": max(0, x_min),
                    "y_min": max(0, y_min),
                    "x_max": min(img_width, x_max),
                    "y_max": min(img_height, y_max)
                },
                "confidence": float(score),
                "has_embedding": False  # MediaPipe doesn't provide embeddings
            })
        
        return DetectionResult(
            detected=True,
            count=len(results.detections),
            confidence=float(max_confidence),
            faces=face_data
        )
        
    except Exception as e:
        logger.error(f"Detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/verify")
async def verify_faces(
    file1: UploadFile = File(..., description="First image"),
    file2: UploadFile = File(..., description="Second image")
):
    """
    Check if faces exist in both images.
    
    Note: MediaPipe doesn't support face matching/recognition.
    This endpoint only verifies that faces are detected in both images.
    For actual face matching, manual review is required.
    
    Returns:
    - face1_detected: bool
    - face2_detected: bool
    - note: Explanation that matching requires manual review
    """
    if face_detector is None:
        raise HTTPException(status_code=503, detail="Face detection model not loaded")
    
    try:
        # Process first image
        contents1 = await file1.read()
        image1 = Image.open(io.BytesIO(contents1))
        if image1.mode != 'RGB':
            image1 = image1.convert('RGB')
        results1 = face_detector.process(np.array(image1))
        face1_detected = bool(results1.detections)
        
        # Process second image
        contents2 = await file2.read()
        image2 = Image.open(io.BytesIO(contents2))
        if image2.mode != 'RGB':
            image2 = image2.convert('RGB')
        results2 = face_detector.process(np.array(image2))
        face2_detected = bool(results2.detections)
        
        return {
            "face1_detected": face1_detected,
            "face2_detected": face2_detected,
            "match": None,  # Cannot determine match with MediaPipe
            "similarity": None,
            "note": "Face matching not available with MediaPipe. Manual review required for identity verification."
        }
        
    except Exception as e:
        logger.error(f"Verification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
