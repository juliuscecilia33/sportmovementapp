# Sports Movement Analysis API

FastAPI backend service for analyzing sports videos using MediaPipe Pose detection.

## Setup

1. Create a virtual environment:
```bash
python3 -m venv venv
```

2. Activate the virtual environment:
```bash
# On macOS/Linux
source venv/bin/activate

# On Windows
venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

Start the FastAPI server:
```bash
python main.py
```

Or use uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
- **GET** `/health`
- Returns server status

### Analyze Video
- **POST** `/api/analyze-video`
- Upload a video file for pose detection analysis
- Returns frame-by-frame keypoint data (33 landmarks per frame)
- Results are saved to `results/` directory

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## MediaPipe Pose Landmarks

The API detects 33 body landmarks per frame:
- 0-10: Face (nose, eyes, ears, mouth)
- 11-16: Upper body (shoulders, elbows, wrists)
- 17-22: Hands (pinky, index, thumb for each hand)
- 23-28: Lower body (hips, knees, ankles)
- 29-32: Feet (heel, foot index for each foot)

Each landmark includes:
- `x, y`: Normalized coordinates [0, 1]
- `z`: Depth relative to hips
- `visibility`: Confidence score [0, 1]
