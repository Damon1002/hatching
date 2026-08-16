import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient as SvgRadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface DragonEggIslandProps {
  progress?: number; // 0 to 1
  isFocusing?: boolean;
  eggType?: 'ember' | 'jade' | 'celestia' | 'ginkgo';
}

export function DragonEggIsland({
  progress = 0,
  isFocusing = false,
  eggType = 'ember',
}: DragonEggIslandProps) {
  // Breathing and gentle levitation animation
  const breathe = useSharedValue(1);
  const floatY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.035, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.975, { duration: 2200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    floatY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(4, { duration: 2600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(isFocusing ? 0.85 : 0.6, { duration: 1800 }),
        withTiming(isFocusing ? 0.35 : 0.25, { duration: 1800 })
      ),
      -1,
      true
    );
  }, [isFocusing, breathe, floatY, glowOpacity]);

  const animatedEggStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { scale: breathe.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Size constants matching Forest UI circular island
  const size = 270;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Knob indicator position (top circle handle like Forest timer dial)
  const knobAngle = -90 + (progress || 0) * 360;
  const knobRad = (knobAngle * Math.PI) / 180;
  const knobRadius = radius;
  const knobX = center + knobRadius * Math.cos(knobRad);
  const knobY = center + knobRadius * Math.sin(knobRad);

  return (
    <View style={styles.container}>
      {/* Background Outer Glow Ring */}
      <Animated.View style={[styles.glowBackdrop, animatedGlowStyle]} />

      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Inner Disc Background Radial Gradient */}
          <SvgRadialGradient id="innerDiscGrad" cx="50%" cy="40%" r="55%">
            <Stop offset="0%" stopColor="#E9F7C8" stopOpacity="0.95" />
            <Stop offset="65%" stopColor="#C9E6A8" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#A8D68F" stopOpacity="0.75" />
          </SvgRadialGradient>

          {/* Golden Ring Gradient */}
          <SvgLinearGradient id="goldRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#EFE8BD" />
            <Stop offset="50%" stopColor="#DFD89F" />
            <Stop offset="100%" stopColor="#CFBE7E" />
          </SvgLinearGradient>

          {/* Grassy Island Top Gradient */}
          <SvgLinearGradient id="grassTopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#8AC66C" />
            <Stop offset="100%" stopColor="#5FA14E" />
          </SvgLinearGradient>

          {/* Island Earth Cliff Base */}
          <SvgLinearGradient id="soilCliffGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#6C5446" />
            <Stop offset="100%" stopColor="#4A3428" />
          </SvgLinearGradient>

          {/* Egg Shell Primary Gradient */}
          <SvgRadialGradient id="eggShineGrad" cx="38%" cy="32%" r="65%">
            <Stop offset="0%" stopColor="#FFF7E6" />
            <Stop offset="35%" stopColor="#F7C878" />
            <Stop offset="75%" stopColor="#D98A36" />
            <Stop offset="100%" stopColor="#8C4410" />
          </SvgRadialGradient>

          {/* Egg Crack Energy Glow */}
          <SvgLinearGradient id="crackGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="50%" stopColor="#FFE066" />
            <Stop offset="100%" stopColor="#FF9900" />
          </SvgLinearGradient>
        </Defs>

        {/* 1. Inner Circle Background */}
        <Circle cx={center} cy={center} r={radius - strokeWidth / 2 + 1} fill="url(#innerDiscGrad)" />

        {/* 2. Floating Island 3D Base */}
        <G transform={`translate(0, 10)`}>
          {/* Soil Cliff bottom volume */}
          <Path
            d={`
              M 48,150 
              C 48,190 222,190 222,150
              L 218,172
              C 200,206 70,206 52,172
              Z
            `}
            fill="url(#soilCliffGrad)"
          />
          {/* Soil Layer Details */}
          <Path
            d="M 65,168 Q 95,190 135,188 Q 175,186 205,168 Q 170,175 135,176 Q 100,177 65,168 Z"
            fill="#5D4336"
            opacity="0.6"
          />

          {/* Grassy Island Top Oval Disc */}
          <Ellipse cx={center} cy={150} rx={88} ry={30} fill="url(#grassTopGrad)" />

          {/* Grass Highlight Crest */}
          <Ellipse cx={center - 10} cy={144} rx={74} ry={22} fill="#A2DC84" opacity="0.45" />

          {/* Tiny Wild Sprout Flowers on Island */}
          <Circle cx={85} cy={148} r={2.5} fill="#FFF9E0" />
          <Circle cx={85} cy={148} r={1} fill="#F0A500" />

          <Circle cx={188} cy={146} r={3} fill="#FFF9E0" />
          <Circle cx={188} cy={146} r={1.2} fill="#F0A500" />

          <Circle cx={174} cy={155} r={2} fill="#FFF9E0" />
        </G>

        {/* 3. Outer Golden Ring Border */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#goldRingGrad)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* 4. Timer Dial Knob Indicator (Matching Forest Top Handle Dot) */}
        <Circle
          cx={knobX}
          cy={knobY}
          r={10.5}
          fill="#89BF46"
          stroke="#FFFFFF"
          strokeWidth={2}
        />
        <Circle cx={knobX} cy={knobY} r={5} fill="#6FA330" />
      </Svg>

      {/* 5. Center Dragon Egg (Animated, Replaceable for user's final asset) */}
      <Animated.View style={[styles.eggOverlay, animatedEggStyle]}>
        <Svg width={110} height={130} viewBox="0 0 110 130">
          {/* Egg Shadow on Grass */}
          <Ellipse cx={55} cy={122} rx={32} ry={9} fill="rgba(40, 70, 30, 0.45)" />

          {/* Egg Base Shape */}
          <Path
            d="M 55,10 C 24,10 12,50 12,82 C 12,110 30,122 55,122 C 80,122 98,110 98,82 C 98,50 86,10 55,10 Z"
            fill="url(#eggShineGrad)"
          />

          {/* Dragon Scale Pattern Overlay */}
          <Path
            d="M 38,45 Q 55,56 72,45"
            stroke="#C47325"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            opacity={0.6}
          />
          <Path
            d="M 28,65 Q 55,80 82,65"
            stroke="#C47325"
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
            opacity={0.6}
          />
          <Path
            d="M 32,88 Q 55,102 78,88"
            stroke="#A25514"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            opacity={0.5}
          />

          {/* Glowing Crack Rune (Indicates Hatching Life Energy) */}
          <Path
            d="M 55,38 L 49,52 L 62,64 L 54,78 L 60,94"
            stroke="url(#crackGlowGrad)"
            strokeWidth={2.8}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M 49,52 L 39,58"
            stroke="#FFEAA7"
            strokeWidth={1.8}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M 62,64 L 72,70"
            stroke="#FFEAA7"
            strokeWidth={1.8}
            fill="none"
            strokeLinecap="round"
          />

          {/* Top Egg Shell Specular Highlight */}
          <Ellipse cx={44} cy={28} rx={12} ry={6} fill="#FFFFFF" opacity={0.55} transform="rotate(-20 44 28)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 270,
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowBackdrop: {
    position: 'absolute',
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: 'rgba(235, 245, 195, 0.22)',
  },
  eggOverlay: {
    position: 'absolute',
    top: 52,
    left: 80,
    width: 110,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
