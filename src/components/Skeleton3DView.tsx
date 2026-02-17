import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSkeletonRenderer } from '../hooks/useSkeletonRenderer';
import { FrameData, CameraAngle, SkeletonConfig } from '../types/analysis';

interface Skeleton3DViewProps {
  frameData: FrameData | null;
  autoRotate?: boolean;
  style?: ViewStyle;
  config?: Partial<SkeletonConfig>;
}

export interface Skeleton3DViewRef {
  setCameraAngle: (angle: CameraAngle) => void;
  setCameraDistance: (distance: number) => void;
}

const defaultConfig: SkeletonConfig = {
  jointSize: 0.02,
  boneThickness: 0.01,
  visibilityThreshold: 0.4,
  showJointLabels: false,
};

const Skeleton3DView = forwardRef<Skeleton3DViewRef, Skeleton3DViewProps>(
  ({ frameData, autoRotate = false, style, config = {} }, ref) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const glContextRef = useRef<ExpoWebGLRenderingContext | null>(null);
    const lastScaleRef = useRef(1);

    const mergedConfig = { ...defaultConfig, ...config };
    const renderer = useSkeletonRenderer(mergedConfig);

    useImperativeHandle(ref, () => ({
      setCameraAngle: renderer.setCameraAngle,
      setCameraDistance: renderer.setCameraDistance,
    }));

    const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
      glContextRef.current = gl;

      renderer.initializeScene(gl);
      renderer.startRenderLoop(autoRotate);

      setIsInitialized(true);
    };

    useEffect(() => {
      if (isInitialized) {
        renderer.updateSkeleton(frameData);
      }
    }, [frameData, isInitialized]);

    // Pan gesture for orbiting camera
    const panGesture = Gesture.Pan()
      .onUpdate((event) => {
        renderer.orbitCamera(event.translationX, event.translationY);
      });

    // Pinch gesture for zooming
    const pinchGesture = Gesture.Pinch()
      .onUpdate((event) => {
        const scaleChange = event.scale / lastScaleRef.current;
        lastScaleRef.current = event.scale;

        // Invert scale: pinch in = zoom out, pinch out = zoom in
        renderer.setCameraDistance(2.5 / event.scale);
      })
      .onEnd(() => {
        lastScaleRef.current = 1;
      });

    const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

    return (
      <GestureDetector gesture={composedGesture}>
        <GLView style={[styles.container, style]} onContextCreate={onContextCreate} />
      </GestureDetector>
    );
  }
);

Skeleton3DView.displayName = 'Skeleton3DView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Skeleton3DView;
