import React, { useEffect, useState } from 'react';
import {
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
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

const LAND_16_ASSET = require('../../assets/tiles/blender-cube-land-2d.png');
const LAND_25_ASSET = require('../../assets/tiles/blender-land-25-grid.png');

interface IsometricLandViewProps {
  isFocusing?: boolean;
  progress?: number;
  initialGridSize?: 16 | 25;
}

export function IsometricLandView({
  isFocusing = false,
  progress = 0,
  initialGridSize = 25,
}: IsometricLandViewProps) {
  const { width: windowWidth } = useWindowDimensions();
  const sceneSize = Math.min(windowWidth - 20, 350);

  const [currentGrid, setCurrentGrid] = useState<16 | 25>(initialGridSize);

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

  const handleToggleGrid = () => {
    // Pop animation on tier switch
    entryScale.value = 0.88;
    entryScale.value = withSpring(1, { damping: 12, stiffness: 160 });
    setCurrentGrid(prev => (prev === 16 ? 25 : 16));
  };

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

  const activeAsset = currentGrid === 25 ? LAND_25_ASSET : LAND_16_ASSET;

  return (
    <View
      style={[styles.container, { width: sceneSize, height: sceneSize }]}
      {...panResponder.panHandlers}
    >
      {/* Background Soft Sunlight Aura */}
      <Animated.View style={[styles.sunlightAura, auraAnimatedStyle]} />

      {/* Floating Island Shadow on the ground */}
      <Animated.View style={[styles.groundShadowWrap, shadowAnimatedStyle]}>
        <View
          style={[
            styles.groundShadow,
            currentGrid === 25 && { width: 245, height: 46, borderRadius: 23 },
          ]}
        />
      </Animated.View>

      {/* 2D ISOMETRIC BLENDER CUBE LAND */}
      <Animated.View style={[styles.islandWrap, islandAnimatedStyle]}>
        <Image
          source={activeAsset}
          style={[
            styles.islandImage,
            currentGrid === 25 ? styles.islandImage25 : styles.islandImage16,
          ]}
          resizeMode="contain"
        />

        {/* Center Hero: Glowing Dragon Egg resting on land */}
        <Animated.View
          style={[
            styles.eggOverlay,
            currentGrid === 25 ? { top: 48 } : { top: 52 },
            eggAnimatedStyle,
          ]}
        >
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

      {/* Grid Expansion Badge / Quick Switcher */}
      <TouchableOpacity
        style={styles.expansionBadge}
        activeOpacity={0.8}
        onPress={handleToggleGrid}
      >
        <Text style={styles.expansionBadgeText}>
          {currentGrid === 25 ? '✨ 25 Cubes (5x5)' : '🌱 16 Cubes (4x4)'}
        </Text>
      </TouchableOpacity>
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
    width: 260,
    height: 260,
    borderRadius: 130,
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
    width: 310,
    height: 240,
  },
  islandImage16: {
    width: 300,
    height: 235,
  },
  islandImage25: {
    width: 325,
    height: 250,
  },
  eggOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expansionBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  expansionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A5D4E',
  },
});
