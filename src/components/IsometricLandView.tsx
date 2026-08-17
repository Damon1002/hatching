import React, { useEffect } from 'react';
import {
  Image,
  PanResponder,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient as SvgRadialGradient,
  Stop,
} from 'react-native-svg';

const BLENDER_2D_ASSET = require('../../assets/tiles/blender-cube-land-2d.png');

interface IsometricLandViewProps {
  isFocusing?: boolean;
  progress?: number;
}

export function IsometricLandView({
  isFocusing = false,
  progress = 0,
}: IsometricLandViewProps) {
  const { width: windowWidth } = useWindowDimensions();
  const sceneSize = Math.min(windowWidth - 20, 340);

  // 1. Animation Shared Values
  const entryScale = useSharedValue(0.01);
  const floatY = useSharedValue(0);
  const dragRotateZ = useSharedValue(0);
  const dragTranslateX = useSharedValue(0);
  const eggPulse = useSharedValue(1);
  const auraGlow = useSharedValue(0.85);

  useEffect(() => {
    // A. Cinematic Spring Pop-in Entrance
    entryScale.value = withSpring(1, { damping: 11, stiffness: 140 });

    // B. Idle Island Levitation Float
    floatY.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(5, { duration: 2400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // C. Egg Life Pulse & Aura
    eggPulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.96, { duration: 1600, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    auraGlow.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.85, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  // 2. Interactive Touch Drag Tilt (Parallax response)
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        dragRotateZ.value = Math.max(-12, Math.min(12, gestureState.dx * 0.15));
        dragTranslateX.value = Math.max(-18, Math.min(18, gestureState.dx * 0.2));
      },
      onPanResponderRelease: () => {
        dragRotateZ.value = withSpring(0, { damping: 12, stiffness: 180 });
        dragTranslateX.value = withSpring(0, { damping: 12, stiffness: 180 });
      },
    })
  ).current;

  // 3. Animated Styles
  const islandAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: entryScale.value },
      { translateY: floatY.value },
      { translateX: dragTranslateX.value },
      { rotateZ: `${dragRotateZ.value}deg` },
    ],
  }));

  const shadowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: withTiming(floatY.value < 0 ? 0.94 : 1.06, { duration: 300 }) },
      { scaleY: withTiming(floatY.value < 0 ? 0.94 : 1.06, { duration: 300 }) },
    ],
    opacity: withTiming(floatY.value < 0 ? 0.35 : 0.5, { duration: 300 }),
  }));

  const eggAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: eggPulse.value }],
  }));

  const auraAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: auraGlow.value }],
  }));

  return (
    <View
      style={[styles.container, { width: sceneSize, height: sceneSize }]}
      {...panResponder.panHandlers}
    >
      {/* Background Soft Sunlight Aura */}
      <Animated.View style={[styles.sunlightAura, auraAnimatedStyle]} />

      {/* Floating Island Shadow on the ground */}
      <Animated.View style={[styles.groundShadowWrap, shadowAnimatedStyle]}>
        <View style={styles.groundShadow} />
      </Animated.View>

      {/* 2D ISOMETRIC BLENDER CUBE LAND */}
      <Animated.View style={[styles.islandWrap, islandAnimatedStyle]}>
        <Image
          source={BLENDER_2D_ASSET}
          style={styles.islandImage}
          resizeMode="contain"
        />

        {/* Center Hero: Glowing Dragon Egg resting on 16-cube land */}
        <Animated.View style={[styles.eggOverlay, eggAnimatedStyle]}>
          <Svg width={68} height={82} viewBox="0 0 68 82">
            <Defs>
              <SvgRadialGradient id="eggGrad2D" cx="36%" cy="32%" r="65%">
                <Stop offset="0%" stopColor="#FFF9E6" />
                <Stop offset="30%" stopColor="#F9C868" />
                <Stop offset="70%" stopColor="#E08B32" />
                <Stop offset="100%" stopColor="#874312" />
              </SvgRadialGradient>

              <SvgLinearGradient id="eggCrack2D" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" />
                <Stop offset="50%" stopColor="#FFE066" />
                <Stop offset="100%" stopColor="#FF9900" />
              </SvgLinearGradient>
            </Defs>

            {/* Egg Shadow on Top Plates */}
            <Ellipse cx={34} cy={72} rx={20} ry={6} fill="rgba(35, 45, 20, 0.45)" />

            {/* Egg Body */}
            <G transform="translate(34, 40)">
              <Path
                d="M 0,-36 C -18,-36 -26,-6 -26,14 C -26,28 -15,34 0,34 C 15,34 26,28 26,14 C 26,-6 18,-36 0,-36 Z"
                fill="url(#eggGrad2D)"
              />

              {/* Dragon Scale Texture Rings */}
              <Path
                d="M -13,-9 Q 0,0 13,-9"
                stroke="#B86618"
                strokeWidth={1.8}
                fill="none"
                strokeLinecap="round"
                opacity={0.6}
              />
              <Path
                d="M -16,7 Q 0,17 16,7"
                stroke="#B86618"
                strokeWidth={1.8}
                fill="none"
                strokeLinecap="round"
                opacity={0.6}
              />

              {/* Glowing Dragon Life Energy Crack */}
              <Path
                d="M 0,-16 L -5,-7 L 5,2 L -2,13 L 3,22"
                stroke="url(#eggCrack2D)"
                strokeWidth={2.4}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M -5,-7 L -11,-2"
                stroke="#FFE066"
                strokeWidth={1.5}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d="M 5,2 L 11,6"
                stroke="#FFE066"
                strokeWidth={1.5}
                fill="none"
                strokeLinecap="round"
              />

              {/* Specular Highlight */}
              <Ellipse
                cx={-6}
                cy={-22}
                rx={7}
                ry={3.5}
                fill="#FFFFFF"
                opacity={0.6}
                transform="rotate(-20 -6 -22)"
              />
            </G>
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sunlightAura: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(235, 245, 195, 0.18)',
  },
  groundShadowWrap: {
    position: 'absolute',
    bottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groundShadow: {
    width: 220,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 45, 35, 0.35)',
  },
  islandWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  islandImage: {
    width: 300,
    height: 235,
  },
  eggOverlay: {
    position: 'absolute',
    top: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
