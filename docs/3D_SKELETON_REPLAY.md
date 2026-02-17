# 3D Skeleton Replay Feature

## Overview

The 3D Skeleton Replay feature provides real-time synchronized playback of video analysis with an interactive 3D skeletal representation. This allows athletes and coaches to analyze movement from multiple angles with frame-by-frame precision.

## Features

### Video & 3D Synchronization
- **Split-screen layout**: Video (35% of screen) and 3D skeleton (45% of screen)
- **Real-time sync**: 3D skeleton updates automatically as video plays
- **Frame-perfect accuracy**: 30 FPS synchronization with pose data

### Interactive 3D Controls
- **Touch drag to orbit**: Swipe on 3D view to rotate camera around athlete
- **Pinch to zoom**: Pinch gesture to zoom in/out
- **Preset camera angles**: Front, Back, Left, Right, Top, 3/4 view buttons
- **Stylized rendering**: Color-coded body segments:
  - **Gold** - Head
  - **Red** - Torso
  - **Blue** - Arms
  - **Green** - Legs

### Playback Controls
- **Play/Pause**: Standard video playback controls
- **Frame-by-frame**: Previous/Next frame buttons for precise analysis
- **Timeline scrubber**: Seek to any point in the video
- **Speed control**: 0.25x, 0.5x, 1x, 2x playback speeds
- **Frame counter**: Real-time display of current frame number

## Technical Architecture

### Components

#### `VideoAnalysisScreen`
Main screen component that orchestrates all sub-components

**Location**: `src/screens/VideoAnalysisScreen.tsx`

#### `VideoPlayer`
Video playback with expo-av, emits playback status updates

**Location**: `src/components/VideoPlayer.tsx`
**Props**:
- `videoUri`: Path to video file
- `onPlaybackUpdate`: Callback for playback status changes

#### `Skeleton3DView`
3D rendering using expo-gl + Three.js with gesture controls

**Location**: `src/components/Skeleton3DView.tsx`
**Props**:
- `frameData`: Current frame's keypoint data
- `autoRotate`: Enable/disable auto-rotation
- `config`: Skeleton rendering configuration

#### `CameraControls`
Preset camera angle buttons

**Location**: `src/components/CameraControls.tsx`

#### `PlaybackControls`
Timeline, play/pause, frame navigation, speed controls

**Location**: `src/components/PlaybackControls.tsx`

### Services

#### `analysisLoader`
Loads and parses JSON analysis results from backend

**Location**: `src/services/analysisLoader.ts`
**Key functions**:
- `loadLatestAnalysis()`: Loads the most recent analysis
- `getFrameByTimestamp()`: Get frame data for a specific time
- `getFrameByNumber()`: Get frame data by frame number

#### `skeletonBuilder`
Defines MediaPipe pose skeleton structure and bone connections

**Location**: `src/services/skeletonBuilder.ts`
**Key functions**:
- `getSkeletonBones()`: Returns array of 37 bone connections
- `isBoneVisible()`: Checks if both keypoints in a bone are visible

### Hooks

#### `useSkeletonRenderer`
Manages Three.js scene, camera, and skeleton rendering

**Location**: `src/hooks/useSkeletonRenderer.ts`
**Features**:
- Scene initialization with lighting
- Dynamic skeleton mesh creation
- Camera positioning and orbiting
- Visibility-based rendering

#### `useVideoSync`
Synchronizes video playback with 3D skeleton updates

**Location**: `src/hooks/useVideoSync.ts`
**Features**:
- Frame interpolation based on timestamp
- Seek handling with debouncing
- Frame-by-frame navigation
- Speed control

### Data Flow

```
Backend Analysis (JSON)
        ↓
analysisLoader.loadLatestAnalysis()
        ↓
VideoAnalysisScreen (state management)
        ↓
    ┌───┴────┐
    ↓        ↓
VideoPlayer  Skeleton3DView
    ↓
useVideoSync (timestamp)
    ↓
getFrameByTimestamp()
    ↓
Skeleton3DView.updateSkeleton()
    ↓
useSkeletonRenderer (Three.js rendering)
```

## Usage

### Basic Usage

1. Ensure a video has been analyzed by the backend
2. Launch the app - it will automatically load the latest analysis
3. Video will be paused at frame 0
4. Use playback controls to play/pause or navigate frames
5. Interact with 3D view to change camera angle

### Camera Controls

**Gesture Controls:**
- Drag to rotate camera around athlete
- Pinch to zoom in/out

**Button Controls:**
- Tap "Front", "Back", etc. for preset angles
- Use "3/4" for diagonal view (default)

### Frame-by-Frame Analysis

1. Pause the video
2. Use ◀◀ and ▶▶ buttons to step through frames
3. Observe 3D skeleton changes with each frame
4. Rotate camera to view movement from different angles

### Speed Control

- Use speed buttons (0.25x - 2x) to slow down or speed up playback
- Useful for analyzing fast movements (e.g., spikes, jumps)

## Configuration

### Skeleton Rendering Config

Edit `src/components/Skeleton3DView.tsx`:

```typescript
const defaultConfig: SkeletonConfig = {
  jointSize: 0.02,           // Size of joint spheres
  boneThickness: 0.01,       // Thickness of bone cylinders
  visibilityThreshold: 0.4,  // Min confidence to show keypoint
  showJointLabels: false,    // Display keypoint names
};
```

### Camera Defaults

Edit `src/hooks/useSkeletonRenderer.ts`:

```typescript
const cameraDistanceRef = useRef<number>(2.5);  // Default zoom distance
const cameraAngleRef = useRef<CameraAngle>('diagonal');  // Default angle
```

## Troubleshooting

### "No analysis data found"

**Cause**: Analysis JSON file not found
**Solution**: Run backend analysis on a video first

### Video not loading

**Cause**: Incorrect video file path
**Solution**: Update `videoUri` in `VideoAnalysisScreen.tsx` to point to your video file

### Skeleton not visible

**Cause**: Low confidence keypoints or empty frames
**Solution**:
- Check frames 0-37 may be empty (person not in frame)
- Lower `visibilityThreshold` in config
- Verify backend analysis generated keypoints

### Poor 3D performance

**Cause**: Device GPU limitations
**Solution**:
- Reduce `jointSize` and `boneThickness`
- Disable auto-rotate
- Lower playback speed

## Future Enhancements

### Planned Features
- **Ball detection**: Automatic detection of ball contact moments
- **Event markers**: Mark important moments (jumps, landings, spikes)
- **Joint angle measurements**: Real-time angle calculations
- **Comparison mode**: Side-by-side comparison of multiple recordings
- **Export**: Save 3D rendered views as video

### Technical Improvements
- Asset bundling for production deployment
- Multi-person skeleton support
- WebGL optimization for better mobile performance
- Caching layer for faster frame lookups

## Dependencies

- `expo-gl` (^16.0.10): OpenGL ES bindings
- `expo-three` (^8.0.0): Three.js integration for Expo
- `three` (^0.166.0): 3D rendering library
- `expo-av` (^16.0.8): Video playback
- `react-native-gesture-handler` (^2.23.3): Gesture recognition
- `@react-native-community/slider` (^4.6.2): Timeline scrubber

## Performance Metrics

- **Target FPS**: 30 (matches video FPS)
- **Skeleton update latency**: < 16ms
- **Memory usage**: ~50MB for full analysis (122 frames)
- **Bundle size impact**: +2.5MB (Three.js + dependencies)

## References

- [MediaPipe Pose Landmarker](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
- [Three.js Documentation](https://threejs.org/docs/)
- [Expo GL](https://docs.expo.dev/versions/latest/sdk/gl-view/)
- [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/)
