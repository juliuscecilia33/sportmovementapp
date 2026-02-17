from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import json
import os
from datetime import datetime
from pathlib import Path
import shutil
import numpy as np

app = FastAPI(title="Sports Movement Analysis API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOAD_DIR = Path("uploads")
RESULTS_DIR = Path("results")
MODEL_DIR = Path("models")
UPLOAD_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)
MODEL_DIR.mkdir(exist_ok=True)

# MediaPipe Pose model path
MODEL_PATH = MODEL_DIR / "pose_landmarker_heavy.task"


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Sports Movement Analysis API"}


@app.post("/api/analyze-video")
async def analyze_video(file: UploadFile = File(...)):
    """
    Analyze video and extract pose keypoints using MediaPipe Pose.
    Returns frame-by-frame keypoint data.
    """
    try:
        # Validate file type
        if not file.content_type.startswith("video/"):
            raise HTTPException(status_code=400, detail="File must be a video")

        # Check if model exists
        if not MODEL_PATH.exists():
            raise HTTPException(
                status_code=500,
                detail="Pose model file not found. Please run setup to download the model."
            )

        # Save uploaded video
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        video_filename = f"{timestamp}_{file.filename}"
        video_path = UPLOAD_DIR / video_filename

        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process video with MediaPipe Pose Landmarker
        cap = cv2.VideoCapture(str(video_path))

        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not open video file")

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        frames_data = []
        frame_count = 0

        # Create PoseLandmarker options
        base_options = python.BaseOptions(model_asset_path=str(MODEL_PATH))
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )

        # Create PoseLandmarker
        with vision.PoseLandmarker.create_from_options(options) as landmarker:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                # Convert BGR to RGB
                image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                # Create MediaPipe Image
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)

                # Calculate timestamp in milliseconds
                timestamp_ms = int((frame_count / fps) * 1000) if fps > 0 else frame_count * 33

                # Process with MediaPipe
                results = landmarker.detect_for_video(mp_image, timestamp_ms)

                # Extract keypoints
                frame_keypoints = []
                if results.pose_landmarks:
                    # Get the first detected pose (usually there's only one)
                    for pose_landmarks in results.pose_landmarks:
                        for idx, landmark in enumerate(pose_landmarks):
                            frame_keypoints.append({
                                "id": idx,
                                "name": vision.PoseLandmark(idx).name,
                                "x": landmark.x,  # Normalized [0, 1]
                                "y": landmark.y,  # Normalized [0, 1]
                                "z": landmark.z,  # Depth relative to hips
                                "visibility": landmark.visibility  # Confidence [0, 1]
                            })

                frames_data.append({
                    "frame_number": frame_count,
                    "timestamp": frame_count / fps if fps > 0 else 0,
                    "keypoints": frame_keypoints
                })

                frame_count += 1

        cap.release()

        # Prepare analysis results
        analysis_result = {
            "video_filename": file.filename,
            "processed_at": datetime.now().isoformat(),
            "video_info": {
                "fps": fps,
                "total_frames": total_frames,
                "width": width,
                "height": height,
                "duration_seconds": total_frames / fps if fps > 0 else 0
            },
            "keypoints_per_frame": 33,  # MediaPipe Pose has 33 landmarks
            "frames": frames_data
        }

        # Save results to JSON file
        result_filename = f"{timestamp}_{Path(file.filename).stem}_analysis.json"
        result_path = RESULTS_DIR / result_filename

        with open(result_path, "w") as f:
            json.dump(analysis_result, f, indent=2)

        # Return analysis results
        return JSONResponse(content={
            "success": True,
            "message": "Video analyzed successfully",
            "result_file": result_filename,
            "analysis": analysis_result
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
