import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Atlas,
  BlurMask,
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Oval,
  Path,
  RadialGradient,
  Rect,
  RoundedRect,
  Skia,
  vec,
  useClock,
  useImage,
} from '@shopify/react-native-skia';
import {
  Easing,
  interpolate,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { DRAGON_ATLAS, getClipForState } from '../dragon/dragonAtlas';

export type DragonMotionState = 'resting' | 'focusing' | 'interrupted' | 'celebrating';
type Variant = 'realm' | 'rest' | 'focus';

const STATE_VALUE: Record<DragonMotionState, number> = {
  resting: 0,
  focusing: 1,
  interrupted: 2,
  celebrating: 3,
};

export function DragonScene({ variant, state = 'resting' }: { variant: Variant; state?: DragonMotionState }) {
  const { width: windowWidth } = useWindowDimensions();
  const width = windowWidth - 40;
  const height = variant === 'realm' ? 354 : 372;
  const reducedMotion = useReducedMotion();
  const clock = useClock();
  const stateValue = useSharedValue(STATE_VALUE[state]);

  useEffect(() => {
    stateValue.value = withTiming(STATE_VALUE[state], {
      duration: reducedMotion ? 120 : state === 'celebrating' ? 260 : 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [reducedMotion, state, stateValue]);

  const calmTime = useDerivedValue(() => (reducedMotion ? 0 : clock.value));
  const focusAmount = useDerivedValue(() => Math.min(stateValue.value, 1));
  const interruptedAmount = useDerivedValue(() => Math.max(0, 1 - Math.abs(stateValue.value - 2)));
  const celebrationAmount = useDerivedValue(() => Math.max(0, stateValue.value - 2));

  const fogX = useDerivedValue(() => Math.sin(calmTime.value / 9200) * 18);
  const fogOpacity = useDerivedValue(() => 0.035 + Math.sin(calmTime.value / 5100) * 0.009);
  const breathe = useDerivedValue(() => 1 + Math.sin(calmTime.value / 860) * 0.012);
  const tailAngle = useDerivedValue(() => Math.sin(calmTime.value / 2100) * 0.035);
  const firePulse = useDerivedValue(() => 1 + Math.sin(calmTime.value / 360) * 0.08);
  const dragonLift = useDerivedValue(() => {
    const celebrationWave = Math.sin(Math.min(1, celebrationAmount.value) * Math.PI) * -10;
    return celebrationWave + interruptedAmount.value * 3;
  });
  const dragonScale = useDerivedValue(() => breathe.value + celebrationAmount.value * 0.025);
  const dragonTransform = useDerivedValue(() => [
    { translateY: dragonLift.value },
    { scaleX: 2 - dragonScale.value },
    { scaleY: dragonScale.value },
  ]);
  const tailTransform = useDerivedValue(() => [{ rotate: tailAngle.value }]);
  const fireTransform = useDerivedValue(() => [{ scaleX: 2 - firePulse.value }, { scaleY: firePulse.value }]);
  const focusGlowOpacity = useDerivedValue(() => 0.08 + focusAmount.value * 0.13 + celebrationAmount.value * 0.16);
  const eyeHeight = useDerivedValue<number>(() => {
    if (reducedMotion) return 5;
    const cycle = calmTime.value % 6200;
    return cycle > 5850 && cycle < 5960 ? 0.8 : 5;
  });

  const dragonY = variant === 'realm' ? height - 183 : height - 255;
  const fireY = variant === 'realm' ? height - 113 : height - 196;

  return (
    <View style={StyleSheet.absoluteFill} accessibilityLabel={`Aeris is ${state}`}>
      <Canvas style={StyleSheet.absoluteFill} opaque>
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, height)}
            colors={variant === 'focus' ? ['#10231F', '#182820', '#0B1411'] : ['#274039', '#162820', '#0C1612']}
          />
        </Rect>

        <RealmBackdrop width={width} height={height} variant={variant} />

        <Group transform={useDerivedValue(() => [{ translateX: fogX.value }])} opacity={fogOpacity}>
          <Path
            path={`M-30 ${height * 0.47} C${width * 0.16} ${height * 0.34} ${width * 0.34} ${height * 0.55} ${width * 0.57} ${height * 0.43} C${width * 0.76} ${height * 0.32} ${width * 0.9} ${height * 0.5} ${width + 35} ${height * 0.38} L${width + 35} ${height * 0.66} L-30 ${height * 0.66} Z`}
            color="#BED1C7"
          >
            <BlurMask blur={18} style="normal" />
          </Path>
        </Group>

        <Circle cx={width * 0.75} cy={height * 0.72} r={67} opacity={focusGlowOpacity}>
          <RadialGradient c={vec(width * 0.75, height * 0.72)} r={67} colors={['#F2A65C', 'rgba(226,137,70,0)']} />
        </Circle>

        <Group transform={dragonTransform} origin={vec(width * 0.5, dragonY + 142)}>
          <DragonSpriteOrFallback
            width={width}
            y={dragonY}
            state={state}
            time={calmTime}
            eyeHeight={eyeHeight}
            tailTransform={tailTransform}
          />
        </Group>

        <Group transform={fireTransform} origin={vec(width - 69, fireY + 58)}>
          <HearthFire x={width - 98} y={fireY} />
        </Group>

        <Rect x={0} y={height - 55} width={width} height={55} color="rgba(5,12,9,0.37)" />
      </Canvas>
    </View>
  );
}

function RealmBackdrop({ width, height, variant }: { width: number; height: number; variant: Variant }) {
  return (
    <>
      <Circle cx={width * 0.78} cy={height * 0.2} r={54} color="rgba(227,226,203,0.09)">
        <BlurMask blur={24} style="normal" />
      </Circle>
      <Circle cx={width * 0.78} cy={height * 0.2} r={15} color="#CFD2C0" opacity={0.66} />
      <Path
        path={`M-25 ${height * 0.62} L${width * 0.16} ${height * 0.32} L${width * 0.29} ${height * 0.49} L${width * 0.45} ${height * 0.23} L${width * 0.64} ${height * 0.51} L${width * 0.77} ${height * 0.35} L${width + 25} ${height * 0.65} Z`}
      >
        <LinearGradient start={vec(0, height * 0.25)} end={vec(0, height * 0.72)} colors={['#315047', '#14271F']} />
      </Path>
      <Path
        path={`M-30 ${height * 0.73} C${width * 0.14} ${height * 0.56} ${width * 0.25} ${height * 0.72} ${width * 0.42} ${height * 0.57} C${width * 0.61} ${height * 0.42} ${width * 0.71} ${height * 0.7} ${width + 30} ${height * 0.48} L${width + 30} ${height} L-30 ${height} Z`}
        color="#13271F"
      />
      <Path
        path={`M-25 ${height * 0.83} C${width * 0.18} ${height * 0.67} ${width * 0.32} ${height * 0.86} ${width * 0.52} ${height * 0.7} C${width * 0.7} ${height * 0.57} ${width * 0.82} ${height * 0.78} ${width + 25} ${height * 0.66} L${width + 25} ${height} L-25 ${height} Z`}
        color="#0D1A15"
      />
      {variant === 'realm' && (
        <>
          <Path path={`M22 -10 C13 ${height * 0.2} 34 ${height * 0.38} 11 ${height * 0.58}`} color="rgba(5,13,10,0.58)" style="stroke" strokeWidth={15} />
          <Path path={`M23 ${height * 0.19} C57 ${height * 0.17} 64 ${height * 0.1} 82 ${height * 0.02}`} color="#15271F" style="stroke" strokeWidth={7} strokeCap="round" />
        </>
      )}
    </>
  );
}

function DragonSpriteOrFallback({
  width,
  y,
  state,
  time,
  eyeHeight,
  tailTransform,
}: {
  width: number;
  y: number;
  state: DragonMotionState;
  time: ReturnType<typeof useClock>;
  eyeHeight: ReturnType<typeof useDerivedValue<number>>;
  tailTransform: ReturnType<typeof useDerivedValue<{ rotate: number }[]>>;
}) {
  const atlasImage = useImage(DRAGON_ATLAS.source);
  const clip = getClipForState(state);
  const clipStartedAt = useSharedValue(0);

  useEffect(() => {
    clipStartedAt.value = time.value;
  }, [clipStartedAt, state, time]);

  const spriteRects = useDerivedValue(() => {
    const elapsedFrames = Math.floor(Math.max(0, time.value - clipStartedAt.value) / clip.frameDurationMs);
    const localFrame = clip.loop
      ? elapsedFrames % clip.frameCount
      : Math.min(elapsedFrames, clip.frameCount - 1);
    const frame = clip.start + localFrame;
    const column = frame % DRAGON_ATLAS.columns;
    const row = Math.floor(frame / DRAGON_ATLAS.columns);
    return [Skia.XYWHRect(column * DRAGON_ATLAS.frameWidth, row * DRAGON_ATLAS.frameHeight, DRAGON_ATLAS.frameWidth, DRAGON_ATLAS.frameHeight)];
  });
  const spriteTransforms = useMemo(
    () => [Skia.RSXform(DRAGON_ATLAS.displayScale, 0, width / 2 - 115, y - 35)],
    [width, y],
  );

  if (atlasImage) {
    return <Atlas image={atlasImage} sprites={spriteRects} transforms={spriteTransforms} />;
  }

  return <ProceduralDragon width={width} y={y} eyeHeight={eyeHeight} tailTransform={tailTransform} state={state} />;
}

function ProceduralDragon({
  width,
  y,
  eyeHeight,
  tailTransform,
  state,
}: {
  width: number;
  y: number;
  eyeHeight: ReturnType<typeof useDerivedValue<number>>;
  tailTransform: ReturnType<typeof useDerivedValue<{ rotate: number }[]>>;
  state: DragonMotionState;
}) {
  const x = width / 2 - 108;
  return (
    <>
      <Oval x={x + 25} y={y + 126} width={174} height={20} color="rgba(0,0,0,0.28)" />
      <Group transform={tailTransform} origin={vec(x + 166, y + 110)}>
        <Path
          path={`M${x + 151} ${y + 98} C${x + 194} ${y + 91} ${x + 208} ${y + 121} ${x + 250} ${y + 113} C${x + 264} ${y + 110} ${x + 271} ${y + 101} ${x + 267} ${y + 96} C${x + 254} ${y + 110} ${x + 235} ${y + 93} ${x + 207} ${y + 87} C${x + 186} ${y + 82} ${x + 164} ${y + 86} ${x + 148} ${y + 91} Z`}
        >
          <LinearGradient start={vec(x + 150, y + 88)} end={vec(x + 265, y + 116)} colors={['#66866F', '#2D4C3F']} />
        </Path>
        <Path path={`M${x + 255} ${y + 111} L${x + 274} ${y + 119} L${x + 268} ${y + 97} Z`} color="#88A087" />
      </Group>

      <Path
        path={`M${x + 31} ${y + 105} C${x + 19} ${y + 64} ${x + 44} ${y + 30} ${x + 91} ${y + 37} C${x + 128} ${y + 17} ${x + 180} ${y + 36} ${x + 186} ${y + 82} C${x + 192} ${y + 120} ${x + 158} ${y + 139} ${x + 103} ${y + 137} C${x + 65} ${y + 136} ${x + 40} ${y + 126} ${x + 31} ${y + 105} Z`}
      >
        <LinearGradient start={vec(x + 38, y + 31)} end={vec(x + 178, y + 137)} colors={['#78967E', '#4D715D', '#29483B']} />
      </Path>
      <Path path={`M${x + 78} ${y + 45} C${x + 57} ${y + 54} ${x + 48} ${y + 88} ${x + 65} ${y + 119} C${x + 75} ${y + 134} ${x + 91} ${y + 137} ${x + 108} ${y + 135} C${x + 93} ${y + 112} ${x + 89} ${y + 75} ${x + 78} ${y + 45} Z`} color="#B4A47F" opacity={0.72} />
      <Path path={`M${x + 122} ${y + 44} C${x + 146} ${y + 20} ${x + 177} ${y + 31} ${x + 184} ${y + 60} C${x + 157} ${y + 50} ${x + 143} ${y + 68} ${x + 130} ${y + 88} C${x + 125} ${y + 72} ${x + 121} ${y + 56} ${x + 122} ${y + 44} Z`} color="#345847" />
      <Path path={`M${x + 67} ${y + 46} C${x + 49} ${y + 27} ${x + 60} ${y + 5} ${x + 84} ${y + 3} C${x + 76} ${y + 20} ${x + 88} ${y + 34} ${x + 99} ${y + 43} Z`} color="#4D705B" />
      <Path path={`M${x + 88} ${y + 41} C${x + 71} ${y + 16} ${x + 84} ${y - 1} ${x + 110} ${y - 5} C${x + 98} ${y + 14} ${x + 106} ${y + 29} ${x + 117} ${y + 42} Z`} color="#5A7B65" />
      <Path
        path={`M${x + 67} ${y + 41} C${x + 75} ${y + 20} ${x + 102} ${y + 17} ${x + 121} ${y + 32} C${x + 137} ${y + 44} ${x + 138} ${y + 70} ${x + 122} ${y + 84} C${x + 104} ${y + 99} ${x + 71} ${y + 88} ${x + 62} ${y + 68} C${x + 58} ${y + 58} ${x + 61} ${y + 48} ${x + 67} ${y + 41} Z`}
      >
        <LinearGradient start={vec(x + 65, y + 27)} end={vec(x + 132, y + 91)} colors={['#7D9A81', '#4C705C']} />
      </Path>
      <Path path={`M${x + 75} ${y + 78} C${x + 89} ${y + 91} ${x + 110} ${y + 91} ${x + 122} ${y + 76}`} color="#244136" style="stroke" strokeWidth={3} strokeCap="round" />
      <RoundedRect x={x + 80} y={y + 53} width={5} height={eyeHeight} r={3} color={state === 'interrupted' ? '#D8A568' : '#F0C47A'} />
      <RoundedRect x={x + 102} y={y + 53} width={5} height={eyeHeight} r={3} color={state === 'interrupted' ? '#D8A568' : '#F0C47A'} />
      <Circle cx={x + 120} cy={y + 68} r={2.2} color="#14251E" />
      <Circle cx={x + 126} cy={y + 71} r={1.5} color="#14251E" />
      <Path path={`M${x + 39} ${y + 112} C${x + 34} ${y + 131} ${x + 47} ${y + 144} ${x + 69} ${y + 138} C${x + 58} ${y + 130} ${x + 58} ${y + 117} ${x + 66} ${y + 105} Z`} color="#315443" />
      <Path path={`M${x + 152} ${y + 115} C${x + 156} ${y + 137} ${x + 175} ${y + 143} ${x + 190} ${y + 127} C${x + 175} ${y + 132} ${x + 168} ${y + 119} ${x + 172} ${y + 104} Z`} color="#29493B" />
    </>
  );
}

function HearthFire({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Circle cx={x + 30} cy={y + 42} r={39} color="rgba(234,145,72,0.12)">
        <BlurMask blur={14} style="normal" />
      </Circle>
      <Path
        path={`M${x + 29} ${y + 59} C${x + 14} ${y + 52} ${x + 17} ${y + 38} ${x + 26} ${y + 28} C${x + 27} ${y + 38} ${x + 33} ${y + 37} ${x + 32} ${y + 21} C${x + 47} ${y + 34} ${x + 48} ${y + 50} ${x + 38} ${y + 58} C${x + 35} ${y + 61} ${x + 32} ${y + 61} ${x + 29} ${y + 59} Z`}
      >
        <LinearGradient start={vec(x + 30, y + 20)} end={vec(x + 30, y + 61)} colors={['#FFE5A9', '#ECA052', '#B5542C']} />
      </Path>
      <Path path={`M${x + 30} ${y + 58} C${x + 24} ${y + 53} ${x + 26} ${y + 45} ${x + 31} ${y + 40} C${x + 31} ${y + 47} ${x + 37} ${y + 47} ${x + 36} ${y + 52} C${x + 35} ${y + 57} ${x + 33} ${y + 59} ${x + 30} ${y + 58} Z`} color="#FFEAB9" />
      <Path path={`M${x + 11} ${y + 66} L${x + 49} ${y + 66} M${x + 16} ${y + 60} L${x + 44} ${y + 72} M${x + 43} ${y + 60} L${x + 17} ${y + 72}`} color="#5E3C2B" style="stroke" strokeWidth={5} strokeCap="round" />
    </>
  );
}
