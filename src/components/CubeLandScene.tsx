import React, { useEffect } from 'react';
import {
  PanResponder,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  Polygon,
  RadialGradient as SvgRadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface CubeLandSceneProps {
  isFocusing?: boolean;
  progress?: number;
}

export function CubeLandScene({ isFocusing = false, progress = 0 }: CubeLandSceneProps) {
  const { width: windowWidth } = useWindowDimensions();
  const sceneSize = Math.min(windowWidth - 28, 330);

  // 1. Entry & Hovering Animations
  const entryScale = useSharedValue(0.01);
  const entryRotate = useSharedValue(-45);
  const floatY = useSharedValue(0);
  const touchRotateY = useSharedValue(0);
  const eggPulse = useSharedValue(1);

  useEffect(() => {
    // Cinematic Spring Entrance
    entryScale.value = withSpring(1, { damping: 11, stiffness: 140 });
    entryRotate.value = withTiming(0, { duration: 900, easing: Easing.out(Easing.back(1.5)) });

    // Idle Floating Levitation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(6, { duration: 2400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Egg Life Pulse
    eggPulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.97, { duration: 1800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  // 2. Interactive Pan Responder for 360 drag tilt
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        touchRotateY.value = Math.max(-28, Math.min(28, gestureState.dx * 0.25));
      },
      onPanResponderRelease: () => {
        touchRotateY.value = withSpring(0, { damping: 12, stiffness: 180 });
      },
    })
  ).current;

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: entryScale.value },
      { rotateZ: `${entryRotate.value + touchRotateY.value * 0.3}deg` },
    ],
  }));

  const animatedEggStyle = useAnimatedStyle(() => ({
    transform: [{ scale: eggPulse.value }],
  }));

  return (
    <View style={[styles.container, { width: sceneSize, height: sceneSize }]} {...panResponder.panHandlers}>
      {/* Ambient Floating Glow Backdrop */}
      <View style={styles.ambientGlow} />

      <Animated.View style={[styles.svgWrapper, animatedContainerStyle]}>
        <Svg width={sceneSize} height={sceneSize} viewBox="0 0 320 320">
          <Defs>
            {/* Top Grass Gradients */}
            <SvgLinearGradient id="grassTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#9BD873" />
              <Stop offset="50%" stopColor="#76BD54" />
              <Stop offset="100%" stopColor="#55993A" />
            </SvgLinearGradient>

            <SvgLinearGradient id="grassTopLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#B3E88E" />
              <Stop offset="100%" stopColor="#89CB67" />
            </SvgLinearGradient>

            {/* Earth Wall & Mud Gradients */}
            <SvgLinearGradient id="dirtLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#6E513E" />
              <Stop offset="100%" stopColor="#4A3426" />
            </SvgLinearGradient>

            <SvgLinearGradient id="dirtRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#563E2F" />
              <Stop offset="100%" stopColor="#36251A" />
            </SvgLinearGradient>

            {/* Stone Wall Cladding */}
            <SvgLinearGradient id="stoneWall" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#7A8B82" />
              <Stop offset="100%" stopColor="#4C5C54" />
            </SvgLinearGradient>

            {/* Dragon Egg Gradients */}
            <SvgRadialGradient id="eggGrad" cx="38%" cy="32%" r="65%">
              <Stop offset="0%" stopColor="#FFF9E6" />
              <Stop offset="30%" stopColor="#F9C868" />
              <Stop offset="70%" stopColor="#E08B32" />
              <Stop offset="100%" stopColor="#874312" />
            </SvgRadialGradient>

            <SvgLinearGradient id="eggCrack" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="50%" stopColor="#FFE066" />
              <Stop offset="100%" stopColor="#FF9900" />
            </SvgLinearGradient>
          </Defs>

          {/* ====================================================
              1. 3D ISOMETRIC CUBE LAND (4x4 Matrix matching cube-land.glb)
             ==================================================== */}
          <G transform="translate(160, 168)">
            {/* Ground Ambient Shadow */}
            <Ellipse cx={0} cy={72} rx={105} ry={36} fill="rgba(20, 48, 38, 0.45)" />

            {/* Island Bottom Base Point */}
            <Polygon
              points="0,62 -118,-6 0,-74 118,-6"
              fill="#261A13"
              opacity={0.3}
            />

            {/* Left Dirt Cliff Face */}
            <Polygon
              points="-118,-6 0,62 0,94 -118,26"
              fill="url(#dirtLeft)"
            />
            {/* Right Dirt Cliff Face */}
            <Polygon
              points="0,62 118,-6 118,26 0,94"
              fill="url(#dirtRight)"
            />

            {/* Stone Strata Banding Layer on Cliff */}
            <Polygon
              points="-118,8 -60,42 -60,54 -118,20"
              fill="url(#stoneWall)"
              opacity={0.85}
            />
            <Polygon
              points="60,42 118,8 118,20 60,54"
              fill="url(#stoneWall)"
              opacity={0.7}
            />

            {/* Top Main Isometric Grassy Surface */}
            <Polygon
              points="0,-74 118,-6 0,62 -118,-6"
              fill="url(#grassTop)"
            />

            {/* Isometric 4x4 Grid Sub-division Tiles */}
            {/* Front-Left Grass Tile (Tier 1) */}
            <Polygon
              points="-59,28 0,62 59,28 0,-6"
              fill="url(#grassTopLight)"
              stroke="#6CAE4A"
              strokeWidth={1.2}
            />
            {/* Front-Left Elevated Terrace Step */}
            <Polygon
              points="-88,-20 -29,14 -59,28 -118,-6"
              fill="#68AA46"
              stroke="#58963A"
              strokeWidth={1}
            />
            {/* Front-Right Terrace Step */}
            <Polygon
              points="29,14 88,-20 118,-6 59,28"
              fill="#58963A"
              stroke="#4E8832"
              strokeWidth={1}
            />
            {/* Back Terrace Step */}
            <Polygon
              points="0,-74 59,-40 0,-6 -59,-40"
              fill="url(#grassTopLight)"
              stroke="#76BD54"
              strokeWidth={1}
            />

            {/* ====================================================
                2. DETAILS ON CUBE LAND: Trees, Crystals, Wild Flowers
               ==================================================== */}
            {/* Mini Low-Poly Pine Tree (Back Left) */}
            <G transform="translate(-62, -42)">
              {/* Trunk */}
              <Rect x={-3} y={-8} width={6} height={12} fill="#563E2F" />
              {/* Tier 3 Leaves */}
              <Polygon points="0,-36 -14,-14 14,-14" fill="#3D7A46" />
              {/* Tier 2 Leaves */}
              <Polygon points="0,-26 -16,-6 16,-6" fill="#4B8E55" />
              {/* Tier 1 Leaves */}
              <Polygon points="0,-16 -18,4 18,4" fill="#5BA665" />
            </G>

            {/* Mini Low-Poly Oak Tree (Back Right) */}
            <G transform="translate(64, -36)">
              <Rect x={-3} y={-6} width={6} height={10} fill="#563E2F" />
              <Circle cx={0} cy={-18} r={14} fill="#4E9954" />
              <Circle cx={-5} cy={-22} r={10} fill="#62B569" />
              <Circle cx={6} cy={-16} r={9} fill="#438648" />
            </G>

            {/* Blue Energy Crystal Shard on Terraced Rock */}
            <Polygon points="-82,-2 -76,-16 -70,-2" fill="#4DD0E1" opacity={0.9} />
            <Polygon points="-76,-16 -70,-2 -74,4" fill="#00BCD4" opacity={0.8} />

            {/* Gold Crystal Ore Cluster */}
            <Polygon points="78,-4 84,-18 90,-4" fill="#FFD54F" opacity={0.95} />
            <Polygon points="84,-18 90,-4 86,2" fill="#FFA000" opacity={0.85} />

            {/* Tiny Forest Wild Flowers */}
            <Circle cx={-32} cy={34} r={2.5} fill="#FFF9E0" />
            <Circle cx={-32} cy={34} r={1} fill="#F0A500" />
            <Circle cx={36} cy={36} r={3} fill="#FFF9E0" />
            <Circle cx={36} cy={36} r={1.2} fill="#F0A500" />
            <Circle cx={-12} cy={48} r={2} fill="#FFD1DC" />
            <Circle cx={18} cy={46} r={2} fill="#E1BEE7" />

            {/* ====================================================
                3. CENTER PIECE: THE DRAGON EGG (Breathing & Glowing)
               ==================================================== */}
            <G transform="translate(0, -18)">
              {/* Egg Ground Shadow */}
              <Ellipse cx={0} cy={22} rx={22} ry={7} fill="rgba(30, 60, 25, 0.45)" />

              {/* Egg Base */}
              <Path
                d="M 0,-44 C -22,-44 -32,-8 -32,14 C -32,32 -18,40 0,40 C 18,40 32,32 32,14 C 32,-8 22,-44 0,-44 Z"
                fill="url(#eggGrad)"
              />

              {/* Scale Carving Textures */}
              <Path
                d="M -16,-12 Q 0,-2 16,-12"
                stroke="#B86618"
                strokeWidth={1.8}
                fill="none"
                strokeLinecap="round"
                opacity={0.65}
              />
              <Path
                d="M -22,8 Q 0,20 22,8"
                stroke="#B86618"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                opacity={0.65}
              />

              {/* Glowing Dragon Life Energy Crack */}
              <Path
                d="M 0,-22 L -6,-10 L 6,2 L -2,16 L 4,28"
                stroke="url(#eggCrack)"
                strokeWidth={2.6}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M -6,-10 L -14,-4"
                stroke="#FFE066"
                strokeWidth={1.6}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d="M 6,2 L 14,8"
                stroke="#FFE066"
                strokeWidth={1.6}
                fill="none"
                strokeLinecap="round"
              />

              {/* Top Specular Highlight */}
              <Ellipse
                cx={-8}
                cy={-28}
                rx={9}
                ry={4.5}
                fill="#FFFFFF"
                opacity={0.6}
                transform="rotate(-20 -8 -28)"
              />
            </G>
          </G>
        </Svg>
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
  ambientGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(235, 245, 195, 0.18)',
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
