"""
InsightFace Microservice

A lightweight FastAPI service for face detection and verification.
Deployed separately from the main backend to avoid OOM issues.

Endpoints:
- GET /health - Health check
- POST /detect - Detect faces in an image
- POST /verify - Compare two faces for similarity
"""

import io
import os
import logging
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import numpy as np
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# InsightFace configuration
MODEL_NAME = os.getenv("INSIGHTFACE_MODEL", "buffalo_s")
DET_SIZE = int(os.getenv("INSIGHTFACE_DET_SIZE", "320"))
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.4"))

# Global face analysis instance
face_app = None


def load_insightface():
    """Load InsightFace model on startup"""
    global face_app
    
    try:
        import time
        start = time.time()
        logger.info(f"🔄 Loading InsightFace model: {MODEL_NAME}")
        
        from insightface.app import FaceAnalysis
        
        # Initialize with specific model
        face_app = FaceAnalysis(
            name=MODEL_NAME,
            providers=['CPUExecutionProvider']
        )
        
        # Prepare with detection size
        face_app.prepare(ctx_id=-1, det_size=(DET_SIZE, DET_SIZE))
        
        elapsed = time.time() - start
        logger.info(f"✅ InsightFace loaded in {elapsed:.1f}s")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to load InsightFace: {e}")
        return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup"""
    load_insightface()
    yield
    # Cleanup (nothing to do)


app = FastAPI(
    title="InsightFace API",
    description="Face detection and verification microservice",
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


class VerificationResult(BaseModel):
    match: bool
    similarity: float
    threshold: float
    face1_detected: bool
    face2_detected: bool
    error: Optional[str] = None


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if face_app is not None else "degraded",
        "model": MODEL_NAME,
        "model_loaded": face_app is not None
    }


@app.post("/detect", response_model=DetectionResult)
async def detect_faces(file: UploadFile = File(...)):
    """
    Detect faces in an uploaded image.
    
    Returns:
    - detected: bool - whether any faces were found
    - count: int - number of faces detected
    - confidence: float - highest face confidence score
    - faces: list - face bounding boxes and landmarks
    """
    if face_app is None:
        raise HTTPException(status_code=503, detail="Face detection model not loaded")
    
    try:
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        img_array = np.array(image)
        
        # Detect faces
        faces = face_app.get(img_array)
        
        if not faces:
            return DetectionResult(
                detected=False,
                count=0,
                confidence=0.0,
                faces=[]
            )
        
        # Extract face info
        face_data = []
        max_confidence = 0.0
        
        for face in faces:
            bbox = face.bbox.tolist()
            det_score = float(face.det_score)
            
            if det_score > max_confidence:
                max_confidence = det_score
            
            face_data.append({
                "bbox": {
                    "x_min": int(bbox[0]),
                    "y_min": int(bbox[1]),
                    "x_max": int(bbox[2]),
                    "y_max": int(bbox[3])
                },
                "confidence": det_score,
                "has_embedding": face.embedding is not None
            })
        
        return DetectionResult(
            detected=True,
            count=len(faces),
            confidence=max_confidence,
            faces=face_data
        )
        
    except Exception as e:
        logger.error(f"Detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/verify", response_model=VerificationResult)
async def verify_faces(
    file1: UploadFile = File(..., description="First image (e.g., ID photo)"),
    file2: UploadFile = File(..., description="Second image (e.g., selfie)")
):
    """
    Compare faces in two images for similarity.
    
    Returns:
    - match: bool - whether faces match (similarity > threshold)
    - similarity: float - cosine similarity score (0-1)
    - threshold: float - threshold used for matching
    """
    if face_app is None:
        raise HTTPException(status_code=503, detail="Face detection model not loaded")
    
    try:
        # Process first image
        contents1 = await file1.read()
        image1 = Image.open(io.BytesIO(contents1))
        if image1.mode != 'RGB':
            image1 = image1.convert('RGB')
        img1_array = np.array(image1)
        
        # Process second image
        contents2 = await file2.read()
        image2 = Image.open(io.BytesIO(contents2))
        if image2.mode != 'RGB':
            image2 = image2.convert('RGB')
        img2_array = np.array(image2)
        
        # Detect faces
        faces1 = face_app.get(img1_array)
        faces2 = face_app.get(img2_array)
        
        if not faces1:
            return VerificationResult(
                match=False,
                similarity=0.0,
                threshold=SIMILARITY_THRESHOLD,
                face1_detected=False,
                face2_detected=bool(faces2),
                error="No face detected in first image"
            )
        
        if not faces2:
            return VerificationResult(
                match=False,
                similarity=0.0,
                threshold=SIMILARITY_THRESHOLD,
                face1_detected=True,
                face2_detected=False,
                error="No face detected in second image"
            )
        
        # Get embeddings (use largest/most prominent face from each)
        face1 = max(faces1, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]))
        face2 = max(faces2, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]))
        
        if face1.embedding is None or face2.embedding is None:
            return VerificationResult(
                match=False,
                similarity=0.0,
                threshold=SIMILARITY_THRESHOLD,
                face1_detected=True,
                face2_detected=True,
                error="Could not extract face embeddings"
            )
        
        # Calculate cosine similarity
        embedding1 = face1.embedding
        embedding2 = face2.embedding
        
        similarity = float(np.dot(embedding1, embedding2) / 
                          (np.linalg.norm(embedding1) * np.linalg.norm(embedding2)))
        
        # Normalize to 0-1 range (cosine similarity can be -1 to 1)
        similarity = (similarity + 1) / 2
        
        return VerificationResult(
            match=similarity >= SIMILARITY_THRESHOLD,
            similarity=round(similarity, 4),
            threshold=SIMILARITY_THRESHOLD,
            face1_detected=True,
            face2_detected=True
        )
        
    except Exception as e:
        logger.error(f"Verification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
