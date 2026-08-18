import React from 'react';
import { Circle, Group, Image as SkiaImage, Oval, Path, useImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { shade } from '../../grove/color';
import { sx, sy, type IsoCamera } from '../../grove/iso';
import { GROVE_LOOP_MS } from '../../grove/types';
import type { GroveCreature, GroveTree, GroveTuft } from '../../grove/types';

const TAU = Math.PI * 2;

export function GroveTreeSprite({
  tree,
  z,
  camera,
  time,
  leaf,
  leafDark,
  bark,
  snowy,
}: {
  tree: GroveTree;
  z: number;
  camera: IsoCamera;
  time: SharedValue<number>;
  leaf: string;
  leafDark: string;
  bark: string;
  snowy: boolean;
}) {
  const originX = sx(tree.x + 0.5, tree.y + 0.5, camera);
  const originY = sy(tree.x + 0.5, tree.y + 0.5, z, camera);
  const s = camera.tw * tree.scale;
  const phase = tree.phase;
  const transform = useDerivedValue(() => [{ rotate: Math.sin((time.value / GROVE_LOOP_MS) * TAU + phase) * 0.035 }]);

  return (
    <Group transform={transform} origin={{ x: originX, y: originY }}>
      <Path
        path={`M${originX} ${originY} L${originX} ${originY - s * 0.44}`}
        color={bark}
        style="stroke"
        strokeWidth={Math.max(2, s * 0.075)}
        strokeCap="round"
      />
      <Oval x={originX - s * 0.33} y={originY - s * 0.92} width={s * 0.66} height={s * 0.58} color={leafDark} />
      <Oval x={originX - s * 0.26} y={originY - s * 0.98} width={s * 0.5} height={s * 0.42} color={leaf} />
      {snowy ? (
        <Oval x={originX - s * 0.22} y={originY - s * 1.02} width={s * 0.38} height={s * 0.16} color="#F4F8FA" />
      ) : null}
    </Group>
  );
}

export function GroveTuftSprite({
  tuft,
  z,
  camera,
  time,
  color,
  winter,
}: {
  tuft: GroveTuft;
  z: number;
  camera: IsoCamera;
  time: SharedValue<number>;
  color: string;
  winter: boolean;
}) {
  const bx = sx(tuft.x + 0.5, tuft.y + 0.5, camera);
  const by = sy(tuft.x + 0.5, tuft.y + 0.5, z, camera);
  const s = camera.tw * tuft.scale;
  const phase = tuft.phase;
  const bendScale = winter ? 0.08 : 0.22;
  const path = useDerivedValue(() => {
    const bend = Math.sin((time.value / GROVE_LOOP_MS) * TAU * 2 + phase) * bendScale;
    const len = s * 0.16;
    let d = '';
    for (let i = -1; i <= 1; i += 1) {
      const a = -Math.PI / 2 + i * 0.5 + bend;
      const x0 = bx + i * s * 0.04;
      d += `M${x0} ${by} Q${x0 + Math.cos(a) * len * 0.5} ${by + Math.sin(a) * len * 0.55} ${x0 + Math.cos(a) * len} ${by + Math.sin(a) * len} `;
    }
    return d;
  });

  return (
    <>
      <Path path={path} color={color} style="stroke" strokeWidth={Math.max(1.2, s * 0.028)} strokeCap="round" />
      {tuft.bud && !winter ? <Circle cx={bx} cy={by - s * 0.16} r={s * 0.034} color={tuft.bud} /> : null}
    </>
  );
}

const EGG_SOURCE = require('../../../assets/eggs/dragon-egg-red.png');
const EGG_ASPECT = 979 / 708;

const RUBY_SIT = require('../../../assets/dragon/ruby/postures/p6_relaxed_sit.png');
const RUBY_HOP = require('../../../assets/dragon/ruby/postures/p5_happy_hop.png');
const RUBY_CHEER = require('../../../assets/dragon/ruby/postures/p10_excited_cheer.png');
const RUBY_WINK = require('../../../assets/dragon/ruby/postures/p7_cute_wink.png');

export function GroveEgg({
  x,
  y,
  z,
  camera,
  time,
  progress,
  focusing,
}: {
  x: number;
  y: number;
  z: number;
  camera: IsoCamera;
  time: SharedValue<number>;
  progress: SharedValue<number>;
  focusing: SharedValue<number>;
}) {
  const eggImage = useImage(EGG_SOURCE);
  const gx = sx(x + 0.5, y + 0.5, camera);
  const gy = sy(x + 0.5, y + 0.5, z, camera);
  const s = camera.tw;
  const eggW = s * 0.95;
  const eggH = eggW * EGG_ASPECT;
  const lift = useDerivedValue(() => Math.sin((time.value / GROVE_LOOP_MS) * TAU) * s * 0.045);
  const bodyTransform = useDerivedValue(() => {
    const scale = 1 + Math.sin((time.value / GROVE_LOOP_MS) * TAU) * 0.018;
    return [{ translateY: lift.value }, { scale }];
  });
  const shadowTransform = useDerivedValue(() => {
    const air = -lift.value / Math.max(1, s);
    return [{ translateX: air * s * 0.22 }, { scaleX: 1 + air * 0.18 }, { scaleY: 1 - air * 0.12 }];
  });
  const glowOpacity = useDerivedValue(() => 0.12 + progress.value * 0.28 + focusing.value * 0.16);

  return (
    <Group>
      <Group transform={shadowTransform} origin={{ x: gx, y: gy }}>
        <Oval x={gx - s * 0.26} y={gy - s * 0.05} width={s * 0.52} height={s * 0.15} color="rgba(30,50,28,0.40)" />
      </Group>
      <Group transform={bodyTransform} origin={{ x: gx, y: gy - eggH * 0.52 }}>
        <Circle cx={gx} cy={gy - eggH * 0.42} r={s * 0.42} color="#F2A65C" opacity={glowOpacity} />
        {eggImage ? (
          <SkiaImage
            image={eggImage}
            x={gx - eggW / 2}
            y={gy - eggH + s * 0.04}
            width={eggW}
            height={eggH}
            fit="contain"
          />
        ) : null}
      </Group>
    </Group>
  );
}

export function GroveCreatureSprite({
  creature,
  homeZ,
  destZ,
  camera,
  time,
  speciesId = 'baby_sky_drake',
}: {
  creature: GroveCreature;
  homeZ: number;
  destZ: number;
  camera: IsoCamera;
  time: SharedValue<number>;
  speciesId?: string;
}) {
  if (speciesId === 'emberwing') {
    return (
      <RubyDragonCreature
        creature={creature}
        homeZ={homeZ}
        destZ={destZ}
        camera={camera}
        time={time}
      />
    );
  }

  return (
    <SkyDrakeCreature
      creature={creature}
      homeZ={homeZ}
      destZ={destZ}
      camera={camera}
      time={time}
    />
  );
}

function RubyDragonCreature({
  creature,
  homeZ,
  destZ,
  camera,
  time,
}: {
  creature: GroveCreature;
  homeZ: number;
  destZ: number;
  camera: IsoCamera;
  time: SharedValue<number>;
}) {
  const tw = camera.tw;
  const ox = camera.ox;
  const oy = camera.oy;
  const homeX = creature.homeX;
  const homeY = creature.homeY;
  const destX = creature.destX;
  const destY = creature.destY;
  const phase = creature.phase;
  const s = tw * 0.38;

  // Exact Color Palette from Reference Deconstruction Sheet
  const cWine = '#5B0F2A';     // Deep shadow & dorsal spine accents
  const cCrimson = '#A4184A';  // Darker muscle tone & wing bone
  const cRuby = '#D4275D';     // Main ruby body & neck
  const cHighlight = '#F7687D';// Soft upper specular highlight
  const cScuteLine = '#FFB89A';// Warm peach scute divider line
  const cBelly = '#FFE9CF';    // Cream underbelly plate
  const cWhite = '#FFFFFF';    // Specular eye highlight
  const cAmberTop = '#FFD24D'; // Golden amber iris top
  const cAmberBot = '#F89AC0'; // Amber iris gradient bottom
  const cCharcoal = '#0E0A0F'; // Pupil, claws, nostril

  // 1. DragonRoot Transform (Isometric motion, leap arc, facing, aerodynamic tilt)
  const transform = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    let f = 0;
    let facing = 1;
    if (u < 0.08) {
      f = workletSmooth(u / 0.08);
      facing = destX >= homeX ? 1 : -1;
    } else if (u < 0.7) {
      f = 1;
      facing = destX >= homeX ? 1 : -1;
    } else if (u < 0.78) {
      f = 1 - workletSmooth((u - 0.7) / 0.08);
      facing = homeX >= destX ? 1 : -1;
    } else {
      facing = homeX >= destX ? 1 : -1;
    }
    const cx = homeX + (destX - homeX) * f + 0.5;
    const cy = homeY + (destY - homeY) * f + 0.5;
    const z = homeZ + (destZ - homeZ) * f;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    const hopT = u < 0.08 ? u / 0.08 : u >= 0.7 && u < 0.78 ? (u - 0.7) / 0.08 : 0;
    const air = hopping ? Math.sin(hopT * Math.PI) : 0;
    const px = Math.round(ox + (cx - cy) * tw * 0.5);
    const py = Math.round(oy + (cx + cy) * tw * 0.25 - z * tw) - air * tw * 0.34;
    const tilt = hopping ? (facing === 1 ? -0.14 : 0.14) * Math.sin(hopT * Math.PI) : 0;
    const breathe = !hopping ? 1 + Math.sin((time.value / GROVE_LOOP_MS) * TAU * 2.2 + phase) * 0.018 : 1;
    return [
      { translateX: px },
      { translateY: py },
      { scaleX: facing * breathe },
      { scaleY: breathe },
      { rotate: tilt },
    ];
  });

  // Dynamic Ground Shadow
  const shadowTransform = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    const hopT = u < 0.08 ? u / 0.08 : u >= 0.7 && u < 0.78 ? (u - 0.7) / 0.08 : 0;
    const air = hopping ? Math.sin(hopT * Math.PI) : 0;
    return [{ translateX: air * tw * 0.14 }, { scale: 1 - air * 0.28 }];
  });

  // Torso Breathing Expansion
  const bodyBreathe = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    if (hopping) return [{ scale: 1 }];
    const b = Math.sin((time.value / GROVE_LOOP_MS) * TAU * 2.2 + phase);
    return [
      { scaleY: 1 + b * 0.025 },
      { scaleX: 1 - b * 0.012 },
    ];
  });

  // 2. Parametric 4-Joint Neck FK Chain
  const neck0Rot = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    const hopT = u < 0.08 ? u / 0.08 : u >= 0.7 && u < 0.78 ? (u - 0.7) / 0.08 : 0;
    const air = hopping ? Math.sin(hopT * Math.PI) : 0;
    const t = (time.value / GROVE_LOOP_MS) * TAU * 2.2 + phase;
    return [{ rotate: air * 0.1 + Math.sin(t) * 0.035 }];
  });

  const neck1Rot = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    const hopT = u < 0.08 ? u / 0.08 : u >= 0.7 && u < 0.78 ? (u - 0.7) / 0.08 : 0;
    const air = hopping ? Math.sin(hopT * Math.PI) : 0;
    const t = (time.value / GROVE_LOOP_MS) * TAU * 2.2 + phase - 0.25;
    return [{ rotate: air * 0.12 + Math.sin(t) * 0.045 }];
  });

  const neck2Rot = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    const hopT = u < 0.08 ? u / 0.08 : u >= 0.7 && u < 0.78 ? (u - 0.7) / 0.08 : 0;
    const air = hopping ? Math.sin(hopT * Math.PI) : 0;
    const t = (time.value / GROVE_LOOP_MS) * TAU * 2.2 + phase - 0.5;
    return [{ rotate: air * 0.14 + Math.sin(t) * 0.05 }];
  });

  const neck3Rot = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    const hopT = u < 0.08 ? u / 0.08 : u >= 0.7 && u < 0.78 ? (u - 0.7) / 0.08 : 0;
    const air = hopping ? Math.sin(hopT * Math.PI) : 0;
    const t = (time.value / GROVE_LOOP_MS) * TAU * 2.2 + phase - 0.75;
    return [{ rotate: air * 0.1 + Math.sin(t) * 0.04 }];
  });

  // Head Counterbalance Bob
  const headRot = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    const hopT = u < 0.08 ? u / 0.08 : u >= 0.7 && u < 0.78 ? (u - 0.7) / 0.08 : 0;
    const air = hopping ? Math.sin(hopT * Math.PI) : 0;
    const t = (time.value / GROVE_LOOP_MS) * TAU * 2.2 + phase - 1.0;
    return [{ rotate: -air * 0.15 + Math.sin(t) * 0.035 }];
  });

  // 3. Parametric 5-Joint Tail Traveling Wave Chain
  const tail0Rot = useDerivedValue(() => {
    const t = (time.value / GROVE_LOOP_MS) * TAU * 2.8 + phase;
    return [{ rotate: Math.sin(t) * 0.1 }];
  });
  const tail1Rot = useDerivedValue(() => {
    const t = (time.value / GROVE_LOOP_MS) * TAU * 2.8 + phase - 0.35;
    return [{ rotate: Math.sin(t) * 0.14 }];
  });
  const tail2Rot = useDerivedValue(() => {
    const t = (time.value / GROVE_LOOP_MS) * TAU * 2.8 + phase - 0.7;
    return [{ rotate: Math.sin(t) * 0.18 }];
  });
  const tail3Rot = useDerivedValue(() => {
    const t = (time.value / GROVE_LOOP_MS) * TAU * 2.8 + phase - 1.05;
    return [{ rotate: Math.sin(t) * 0.22 }];
  });
  const tail4Rot = useDerivedValue(() => {
    const t = (time.value / GROVE_LOOP_MS) * TAU * 2.8 + phase - 1.4;
    return [{ rotate: Math.sin(t) * 0.26 }];
  });

  // 4. 2-Bone Flapping Wings (FK Upper arm + Forearm drag)
  const wingUpperL = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    const freq = hopping ? 12 : 3.6;
    const amp = hopping ? 0.45 : 0.24;
    const w = Math.sin((time.value / GROVE_LOOP_MS) * TAU * freq + phase);
    return [
      { rotate: -0.18 + w * amp },
      { scaleY: 0.82 + 0.25 * w },
    ];
  });
  const wingForearmL = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    const freq = hopping ? 12 : 3.6;
    const amp = hopping ? 0.32 : 0.16;
    const w = Math.sin((time.value / GROVE_LOOP_MS) * TAU * freq + phase - 0.45);
    return [{ rotate: 0.12 + w * amp }];
  });

  const wingUpperR = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    const freq = hopping ? 12 : 3.6;
    const amp = hopping ? 0.48 : 0.26;
    const w = Math.sin((time.value / GROVE_LOOP_MS) * TAU * freq + phase);
    return [
      { rotate: -0.15 + w * amp },
      { scaleY: 0.85 + 0.28 * w },
    ];
  });
  const wingForearmR = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    const freq = hopping ? 12 : 3.6;
    const amp = hopping ? 0.36 : 0.18;
    const w = Math.sin((time.value / GROVE_LOOP_MS) * TAU * freq + phase - 0.45);
    return [{ rotate: 0.1 + w * amp }];
  });

  // 5. Eye Blink Worklet (blinks every 3.5s)
  const eyeBlink = useDerivedValue(() => {
    const cycle = (time.value + phase * 600) % 3600;
    if (cycle < 150) {
      const p = Math.sin((cycle / 150) * Math.PI);
      return [{ scaleY: Math.max(0.08, 1 - p * 0.95) }];
    }
    return [{ scaleY: 1 }];
  });

  // Parametric Wing Geometries
  const wingArmPath = `M 0 0 Q ${s * 0.42} ${-s * 0.48} ${s * 0.75} ${-s * 0.65}`;
  const wingForearmPath = `M ${s * 0.75} ${-s * 0.65} Q ${s * 0.95} ${-s * 0.55} ${s * 1.15} ${-s * 0.35}`;
  const wingMembraneHero = `M 0 0 Q ${s * 0.42} ${-s * 0.48} ${s * 0.75} ${-s * 0.65} Q ${s * 0.95} ${-s * 0.55} ${s * 1.15} ${-s * 0.35} Q ${s * 0.92} ${-s * 0.15} ${s * 0.78} 0 Q ${s * 0.58} ${s * 0.08} ${s * 0.42} ${s * 0.12} Q ${s * 0.2} ${s * 0.08} 0 0 Z`;

  // Modular Head Crest Spikes (Horns)
  const horn1 = `M ${s * 0.08} ${-s * 0.18} Q ${-s * 0.28} ${-s * 0.65} ${-s * 0.58} ${-s * 0.75} Q ${-s * 0.2} ${-s * 0.45} ${s * 0.22} ${-s * 0.18} Z`;
  const horn2 = `M ${s * 0.02} ${-s * 0.1} Q ${-s * 0.42} ${-s * 0.48} ${-s * 0.75} ${-s * 0.55} Q ${-s * 0.32} ${-s * 0.3} ${s * 0.12} ${-s * 0.08} Z`;
  const horn3 = `M ${-s * 0.04} 0 Q ${-s * 0.48} ${-s * 0.28} ${-s * 0.8} ${-s * 0.32} Q ${-s * 0.38} ${-s * 0.12} ${s * 0.05} ${s * 0.02} Z`;
  const horn4 = `M 0 ${s * 0.1} Q ${-s * 0.4} ${s * 0.1} ${-s * 0.68} ${s * 0.06} Q ${-s * 0.3} ${s * 0.22} ${s * 0.08} ${s * 0.14} Z`;

  return (
    <Group transform={transform}>
      {/* 1. Dynamic Ground Shadow */}
      <Group transform={shadowTransform}>
        <Oval x={-s * 0.7} y={-s * 0.1} width={s * 1.4} height={s * 0.32} color="rgba(35,10,22,0.32)" />
      </Group>

      {/* 2. Left Wing (Back Wing behind body) */}
      <Group transform={wingUpperL} origin={{ x: -s * 0.08, y: -s * 0.55 }}>
        <Path path={wingMembraneHero} color={cCrimson} opacity={0.88} />
        <Path path={wingArmPath} color={cWine} style="stroke" strokeWidth={Math.max(2, s * 0.04)} strokeCap="round" />
        <Group transform={wingForearmL} origin={{ x: s * 0.75, y: -s * 0.65 }}>
          <Path path={wingForearmPath} color={cWine} style="stroke" strokeWidth={Math.max(1.8, s * 0.035)} strokeCap="round" />
        </Group>
      </Group>

      {/* 3. Parametric 5-Segment Tail Traveling Wave Chain */}
      <Group transform={tail0Rot} origin={{ x: -s * 0.35, y: -s * 0.25 }}>
        {/* Tail Segment 0 (Base) */}
        <Oval x={-s * 0.45} y={-s * 0.35} width={s * 0.32} height={s * 0.28} color={cRuby} />
        <Path path={`M ${-s * 0.38} ${-s * 0.35} L ${-s * 0.48} ${-s * 0.52} L ${-s * 0.3} ${-s * 0.38} Z`} color={cWine} />

        <Group transform={tail1Rot} origin={{ x: -s * 0.42, y: -s * 0.25 }}>
          {/* Tail Segment 1 */}
          <Oval x={-s * 0.68} y={-s * 0.34} width={s * 0.3} height={s * 0.24} color={cRuby} />
          <Path path={`M ${-s * 0.6} ${-s * 0.34} L ${-s * 0.72} ${-s * 0.5} L ${-s * 0.52} ${-s * 0.36} Z`} color={cWine} />

          <Group transform={tail2Rot} origin={{ x: -s * 0.65, y: -s * 0.25 }}>
            {/* Tail Segment 2 */}
            <Oval x={-s * 0.9} y={-s * 0.32} width={s * 0.28} height={s * 0.22} color={cRuby} />
            <Path path={`M ${-s * 0.82} ${-s * 0.32} L ${-s * 0.94} ${-s * 0.48} L ${-s * 0.74} ${-s * 0.34} Z`} color={cWine} />

            <Group transform={tail3Rot} origin={{ x: -s * 0.88, y: -s * 0.25 }}>
              {/* Tail Segment 3 */}
              <Oval x={-s * 1.1} y={-s * 0.3} width={s * 0.25} height={s * 0.2} color={cRuby} />
              <Path path={`M ${-s * 1.02} ${-s * 0.3} L ${-s * 1.14} ${-s * 0.44} L ${-s * 0.96} ${-s * 0.32} Z`} color={cWine} />

              <Group transform={tail4Rot} origin={{ x: -s * 1.08, y: -s * 0.25 }}>
                {/* Tail Segment 4 + Tapered Whip Tip */}
                <Path path={`M ${-s * 1.08} ${-s * 0.25} Q ${-s * 1.35} ${-s * 0.32} ${-s * 1.58} ${-s * 0.48} Q ${-s * 1.3} ${-s * 0.2} ${-s * 1.08} ${-s * 0.18} Z`} color={cRuby} />
                <Path path={`M ${-s * 1.25} ${-s * 0.3} L ${-s * 1.38} ${-s * 0.42} L ${-s * 1.18} ${-s * 0.28} Z`} color={cWine} />
              </Group>
            </Group>
          </Group>
        </Group>
      </Group>

      {/* 4. Hind Left Leg (Large Muscular Thigh & Claws) */}
      <Oval x={-s * 0.48} y={-s * 0.42} width={s * 0.52} height={s * 0.46} color={cCrimson} />
      <Oval x={-s * 0.46} y={-s * 0.16} width={s * 0.34} height={s * 0.2} color={cWine} />
      <Circle cx={-s * 0.46} cy={-s * 0.06} r={s * 0.026} color={cCharcoal} />
      <Circle cx={-s * 0.38} cy={-s * 0.04} r={s * 0.026} color={cCharcoal} />
      <Circle cx={-s * 0.3} cy={-s * 0.04} r={s * 0.026} color={cCharcoal} />

      {/* 5. Main Torso Body */}
      <Group transform={bodyBreathe} origin={{ x: 0, y: -s * 0.35 }}>
        {/* Rounded Ruby Torso */}
        <Oval x={-s * 0.5} y={-s * 0.72} width={s * 1.0} height={s * 0.82} color={cRuby} />
        {/* Torso Top Highlight */}
        <Oval x={-s * 0.36} y={-s * 0.68} width={s * 0.65} height={s * 0.48} color={cHighlight} opacity={0.6} />

        {/* Chest & Belly Cream Underbelly Shield */}
        <Path path={`M ${s * 0.08} ${-s * 0.65} Q ${s * 0.38} ${-s * 0.55} ${s * 0.38} ${-s * 0.2} Q ${s * 0.22} ${-s * 0.1} ${s * 0.04} ${-s * 0.16} Q ${-s * 0.02} ${-s * 0.42} ${s * 0.08} ${-s * 0.65} Z`} color={cBelly} />
        {/* Chest Scute Divider Lines */}
        <Path path={`M ${s * 0.08} ${-s * 0.52} Q ${s * 0.24} ${-s * 0.48} ${s * 0.37} ${-s * 0.54}`} color={cScuteLine} style="stroke" strokeWidth={Math.max(1.2, s * 0.025)} strokeCap="round" />
        <Path path={`M ${s * 0.05} ${-s * 0.38} Q ${s * 0.22} ${-s * 0.34} ${s * 0.36} ${-s * 0.4}`} color={cScuteLine} style="stroke" strokeWidth={Math.max(1.2, s * 0.025)} strokeCap="round" />
        <Path path={`M ${s * 0.05} ${-s * 0.24} Q ${s * 0.18} ${-s * 0.2} ${s * 0.3} ${-s * 0.26}`} color={cScuteLine} style="stroke" strokeWidth={Math.max(1.2, s * 0.025)} strokeCap="round" />
      </Group>

      {/* 6. Parametric 4-Joint Neck FK Chain & Head Hierarchy */}
      {/* Neck Segment 0 (Lower Neck) */}
      <Group transform={neck0Rot} origin={{ x: s * 0.12, y: -s * 0.58 }}>
        <Path path={`M ${-s * 0.02} ${-s * 0.58} L ${s * 0.24} ${-s * 0.58} L ${s * 0.26} ${-s * 0.78} L ${0} ${-s * 0.78} Z`} color={cRuby} />
        {/* Ventral Scute Plate */}
        <Path path={`M ${s * 0.1} ${-s * 0.58} L ${s * 0.24} ${-s * 0.58} L ${s * 0.26} ${-s * 0.78} L ${s * 0.12} ${-s * 0.78} Z`} color={cBelly} />
        <Path path={`M ${s * 0.11} ${-s * 0.68} Q ${s * 0.2} ${-s * 0.66} ${s * 0.25} ${-s * 0.69}`} color={cScuteLine} style="stroke" strokeWidth={Math.max(1, s * 0.02)} strokeCap="round" />

        {/* Neck Segment 1 (Mid-Lower Neck) */}
        <Group transform={neck1Rot} origin={{ x: s * 0.13, y: -s * 0.78 }}>
          <Path path={`M 0 ${-s * 0.78} L ${s * 0.26} ${-s * 0.78} L ${s * 0.28} ${-s * 0.98} L ${s * 0.04} ${-s * 0.98} Z`} color={cRuby} />
          <Path path={`M ${s * 0.12} ${-s * 0.78} L ${s * 0.26} ${-s * 0.78} L ${s * 0.28} ${-s * 0.98} L ${s * 0.15} ${-s * 0.98} Z`} color={cBelly} />
          <Path path={`M ${s * 0.14} ${-s * 0.88} Q ${s * 0.22} ${-s * 0.86} ${s * 0.27} ${-s * 0.89}`} color={cScuteLine} style="stroke" strokeWidth={Math.max(1, s * 0.02)} strokeCap="round" />

          {/* Neck Segment 2 (Mid-Upper Neck) */}
          <Group transform={neck2Rot} origin={{ x: s * 0.16, y: -s * 0.98 }}>
            <Path path={`M ${s * 0.04} ${-s * 0.98} L ${s * 0.28} ${-s * 0.98} L ${s * 0.32} ${-s * 1.18} L ${s * 0.08} ${-s * 1.18} Z`} color={cRuby} />
            <Path path={`M ${s * 0.15} ${-s * 0.98} L ${s * 0.28} ${-s * 0.98} L ${s * 0.32} ${-s * 1.18} L ${s * 0.18} ${-s * 1.18} Z`} color={cBelly} />
            <Path path={`M ${s * 0.17} ${-s * 1.08} Q ${s * 0.25} ${-s * 1.06} ${s * 0.3} ${-s * 1.09}`} color={cScuteLine} style="stroke" strokeWidth={Math.max(1, s * 0.02)} strokeCap="round" />

            {/* Neck Segment 3 (Upper Neck / Throat) */}
            <Group transform={neck3Rot} origin={{ x: s * 0.2, y: -s * 1.18 }}>
              <Path path={`M ${s * 0.08} ${-s * 1.18} L ${s * 0.32} ${-s * 1.18} L ${s * 0.35} ${-s * 1.34} L ${s * 0.12} ${-s * 1.34} Z`} color={cRuby} />
              <Path path={`M ${s * 0.18} ${-s * 1.18} L ${s * 0.32} ${-s * 1.18} L ${s * 0.35} ${-s * 1.34} L ${s * 0.22} ${-s * 1.34} Z`} color={cBelly} />

              {/* 7. Head Hierarchy (Parented to Top of Neck with its own Pivot) */}
              <Group transform={headRot} origin={{ x: s * 0.22, y: -s * 1.34 }}>
                {/* Head Crest / Horn Spikes (Parented directly to skull) */}
                <Path path={horn4} color={cWine} />
                <Path path={horn3} color={cWine} />
                <Path path={horn2} color={cWine} />
                <Path path={horn1} color={cWine} />

                {/* Main Skull Core */}
                <Oval x={-s * 0.12} y={-s * 1.62} width={s * 0.72} height={s * 0.58} color={cRuby} />
                {/* Skull Top Highlight */}
                <Oval x={-s * 0.02} y={-s * 1.58} width={s * 0.48} height={s * 0.35} color={cHighlight} opacity={0.7} />

                {/* Snout & Cheeks */}
                <Oval x={s * 0.24} y={-s * 1.45} width={s * 0.46} height={s * 0.35} color={cHighlight} />
                {/* Cute Smiling Mouth Line */}
                <Path path={`M ${s * 0.22} ${-s * 1.28} Q ${s * 0.4} ${-s * 1.25} ${s * 0.56} ${-s * 1.32}`} color={cWine} style="stroke" strokeWidth={Math.max(1.2, s * 0.025)} strokeCap="round" />
                {/* Nostril */}
                <Circle cx={s * 0.52} cy={-s * 1.4} r={s * 0.035} color={cCharcoal} />

                {/* Modular Golden Amber Anime Eye with Specular Highlights & Blinking */}
                <Group transform={eyeBlink} origin={{ x: s * 0.24, y: -s * 1.46 }}>
                  {/* Eye Socket Contour */}
                  <Oval x={s * 0.12} y={-s * 1.58} width={s * 0.28} height={s * 0.34} color={cWine} />
                  {/* Amber Iris Top & Bottom */}
                  <Oval x={s * 0.14} y={-s * 1.56} width={s * 0.24} height={s * 0.3} color={cAmberTop} />
                  <Oval x={s * 0.16} y={-s * 1.48} width={s * 0.2} height={s * 0.18} color={cAmberBot} opacity={0.65} />
                  {/* Charcoal Pupil */}
                  <Oval x={s * 0.16} y={-s * 1.55} width={s * 0.14} height={s * 0.24} color={cCharcoal} />
                  {/* Specular Sparkles */}
                  <Circle cx={s * 0.18} cy={-s * 1.58} r={s * 0.065} color={cWhite} />
                  <Circle cx={s * 0.28} cy={-s * 1.45} r={s * 0.028} color={cAmberTop} />
                </Group>
              </Group>
            </Group>
          </Group>
        </Group>
      </Group>

      {/* 8. Hero Front Right Wing */}
      <Group transform={wingUpperR} origin={{ x: 0, y: -s * 0.55 }}>
        <Path path={wingMembraneHero} color={cRuby} opacity={0.96} />
        {/* Wing Struts */}
        <Path path={wingArmPath} color={cWine} style="stroke" strokeWidth={Math.max(2.2, s * 0.045)} strokeCap="round" />
        <Path path={`M 0 0 Q ${s * 0.45} ${-s * 0.25} ${s * 0.78} 0`} color={cWine} style="stroke" strokeWidth={Math.max(1.4, s * 0.03)} strokeCap="round" />
        <Path path={`M 0 0 Q ${s * 0.28} ${-s * 0.08} ${s * 0.42} ${s * 0.12}`} color={cWine} style="stroke" strokeWidth={Math.max(1.2, s * 0.025)} strokeCap="round" />
        <Group transform={wingForearmR} origin={{ x: s * 0.75, y: -s * 0.65 }}>
          <Path path={wingForearmPath} color={cWine} style="stroke" strokeWidth={Math.max(1.8, s * 0.035)} strokeCap="round" />
        </Group>
      </Group>

      {/* 9. Front Right Paw & Claws */}
      <Oval x={s * 0.1} y={-s * 0.22} width={s * 0.24} height={s * 0.3} color={cRuby} />
      <Oval x={s * 0.15} y={-s * 0.15} width={s * 0.28} height={s * 0.18} color={cWine} />
      <Circle cx={s * 0.18} cy={-s * 0.06} r={s * 0.024} color={cCharcoal} />
      <Circle cx={s * 0.26} cy={-s * 0.04} r={s * 0.024} color={cCharcoal} />
      <Circle cx={s * 0.34} cy={-s * 0.04} r={s * 0.024} color={cCharcoal} />
    </Group>
  );
}

function SkyDrakeCreature({
  creature,
  homeZ,
  destZ,
  camera,
  time,
}: {
  creature: GroveCreature;
  homeZ: number;
  destZ: number;
  camera: IsoCamera;
  time: SharedValue<number>;
}) {
  const tw = camera.tw;
  const ox = camera.ox;
  const oy = camera.oy;
  const homeX = creature.homeX;
  const homeY = creature.homeY;
  const destX = creature.destX;
  const destY = creature.destY;
  const phase = creature.phase;
  const s = tw * 0.32;

  const mainColor = creature.color;
  const darkColor = shade(mainColor, -0.28);
  const lightColor = shade(mainColor, 0.25);
  const bellyColor = '#FFF5DD';
  const hornColor = '#F5C252';

  const transform = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    let f = 0;
    let facing = 1;
    if (u < 0.08) {
      f = workletSmooth(u / 0.08);
      facing = destX >= homeX ? 1 : -1;
    } else if (u < 0.7) {
      f = 1;
      facing = destX >= homeX ? 1 : -1;
    } else if (u < 0.78) {
      f = 1 - workletSmooth((u - 0.7) / 0.08);
      facing = homeX >= destX ? 1 : -1;
    } else {
      facing = homeX >= destX ? 1 : -1;
    }
    const cx = homeX + (destX - homeX) * f + 0.5;
    const cy = homeY + (destY - homeY) * f + 0.5;
    const z = homeZ + (destZ - homeZ) * f;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    const hopT = u < 0.08 ? u / 0.08 : u >= 0.7 && u < 0.78 ? (u - 0.7) / 0.08 : 0;
    const air = hopping ? Math.sin(hopT * Math.PI) : 0;
    const px = Math.round(ox + (cx - cy) * tw * 0.5);
    const py = Math.round(oy + (cx + cy) * tw * 0.25 - z * tw) - air * tw * 0.32;
    const tilt = hopping ? (facing === 1 ? -0.12 : 0.12) * Math.sin(hopT * Math.PI) : 0;
    const breathe = !hopping ? 1 + Math.sin((time.value / GROVE_LOOP_MS) * TAU * 2) * 0.02 : 1;
    return [
      { translateX: px },
      { translateY: py },
      { scaleX: facing * breathe },
      { scaleY: breathe },
      { rotate: tilt },
    ];
  });

  const shadowTransform = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    const hopT = u < 0.08 ? u / 0.08 : u >= 0.7 && u < 0.78 ? (u - 0.7) / 0.08 : 0;
    const air = hopping ? Math.sin(hopT * Math.PI) : 0;
    return [{ translateX: air * tw * 0.14 }, { scale: 1 - air * 0.25 }];
  });

  const wing = useDerivedValue(() => [
    { scaleY: 0.65 + 0.35 * Math.sin((time.value / GROVE_LOOP_MS) * TAU * 10 + phase) },
    { rotate: Math.sin((time.value / GROVE_LOOP_MS) * TAU * 10 + phase) * 0.12 },
  ]);

  const tailWag = useDerivedValue(() => [
    { rotate: Math.sin((time.value / GROVE_LOOP_MS) * TAU * 3 + phase) * 0.18 },
  ]);

  const skyTailPath = `M ${-s * 0.35} ${-s * 0.25} Q ${-s * 0.95} ${-s * 0.4} ${-s * 1.15} ${-s * 0.75}`;
  const skyTailSpade = `M ${-s * 1.15} ${-s * 0.75} L ${-s * 1.35} ${-s * 0.9} L ${-s * 1.2} ${-s * 1.1} L ${-s * 1.05} ${-s * 0.85} Z`;
  const skyHornLeft = `M ${-s * 0.15} ${-s * 1.15} Q ${-s * 0.35} ${-s * 1.55} ${-s * 0.52} ${-s * 1.62} Q ${-s * 0.22} ${-s * 1.35} ${-s * 0.02} ${-s * 1.12} Z`;
  const skyHornRight = `M ${s * 0.05} ${-s * 1.15} Q ${s * 0.25} ${-s * 1.55} ${s * 0.42} ${-s * 1.62} Q ${s * 0.15} ${-s * 1.35} ${s * 0.18} ${-s * 1.12} Z`;
  const skyWingLeft = `M 0 ${-s * 0.55} Q ${-s * 0.8} ${-s * 1.25} ${-s * 1.15} ${-s * 1.05} Q ${-s * 0.85} ${-s * 0.65} ${-s * 0.6} ${-s * 0.35} Q ${-s * 0.3} ${-s * 0.45} 0 ${-s * 0.55} Z`;
  const skyWingRight = `M 0 ${-s * 0.55} Q ${s * 0.8} ${-s * 1.25} ${s * 1.15} ${-s * 1.05} Q ${s * 0.85} ${-s * 0.65} ${s * 0.6} ${-s * 0.35} Q ${s * 0.3} ${-s * 0.45} 0 ${-s * 0.55} Z`;
  const spine1 = `M ${-s * 0.25} ${-s * 0.75} L ${-s * 0.42} ${-s * 0.95} L ${-s * 0.12} ${-s * 0.85} Z`;
  const spine2 = `M ${-s * 0.05} ${-s * 0.92} L ${-s * 0.18} ${-s * 1.12} L ${s * 0.08} ${-s * 1.0} Z`;

  return (
    <Group transform={transform}>
      {/* Ground Shadow */}
      <Group transform={shadowTransform}>
        <Oval x={-s * 0.55} y={-s * 0.1} width={s * 1.1} height={s * 0.28} color="rgba(15,35,22,0.28)" />
      </Group>

      {/* Dragon Tail */}
      <Group transform={tailWag} origin={{ x: -s * 0.35, y: -s * 0.25 }}>
        <Path path={skyTailPath} color={mainColor} style="stroke" strokeWidth={Math.max(2.5, s * 0.16)} strokeCap="round" />
        <Path path={skyTailSpade} color={darkColor} />
      </Group>

      {/* Back Spines */}
      <Path path={spine1} color={darkColor} />
      <Path path={spine2} color={darkColor} />

      {/* Dragon Wings */}
      <Group transform={wing} origin={{ x: 0, y: -s * 0.55 }}>
        <Path path={skyWingLeft} color={darkColor} opacity={0.92} />
        <Path path={skyWingRight} color={lightColor} opacity={0.92} />
      </Group>

      {/* Dragon Body */}
      <Oval x={-s * 0.5} y={-s * 0.78} width={s * 1.0} height={s * 0.85} color={mainColor} />
      {/* Soft Belly Plate */}
      <Oval x={-s * 0.15} y={-s * 0.65} width={s * 0.6} height={s * 0.65} color={bellyColor} />

      {/* Dragon Horns */}
      <Path path={skyHornLeft} color={hornColor} />
      <Path path={skyHornRight} color={hornColor} />

      {/* Dragon Head */}
      <Oval x={-s * 0.38} y={-s * 1.3} width={s * 0.88} height={s * 0.72} color={mainColor} />
      {/* Dragon Snout / Cheeks */}
      <Oval x={s * 0.08} y={-s * 1.02} width={s * 0.45} height={s * 0.36} color={lightColor} />
      {/* Cute Nostril */}
      <Circle cx={s * 0.38} cy={-s * 0.88} r={s * 0.035} color={darkColor} />

      {/* Dragon Eyes */}
      <Oval x={-s * 0.12} y={-s * 1.18} width={s * 0.24} height={s * 0.3} color="#2A101E" />
      <Circle cx={-s * 0.05} cy={-s * 1.12} r={s * 0.065} color="#FFFFFF" />
      <Oval x={s * 0.18} y={-s * 1.18} width={s * 0.24} height={s * 0.3} color="#2A101E" />
      <Circle cx={s * 0.25} cy={-s * 1.12} r={s * 0.065} color="#FFFFFF" />

      {/* Dragon Claws / Feet */}
      <Oval x={-s * 0.4} y={-s * 0.16} width={s * 0.32} height={s * 0.2} color={darkColor} />
      <Oval x={s * 0.12} y={-s * 0.16} width={s * 0.32} height={s * 0.2} color={darkColor} />
    </Group>
  );
}

export function EmberMote({
  x,
  y,
  z,
  camera,
  progress,
  focusing,
  time,
}: {
  x: number;
  y: number;
  z: number;
  camera: IsoCamera;
  progress: SharedValue<number>;
  focusing: SharedValue<number>;
  time: SharedValue<number>;
}) {
  const bx = sx(x + 0.72, y + 0.38, camera);
  const by = sy(x + 0.72, y + 0.38, z, camera);
  const tw = camera.tw;
  const opacity = useDerivedValue(() => focusing.value * (0.25 + progress.value * 0.7));
  const transform = useDerivedValue(() => [
    { translateY: Math.sin((time.value / GROVE_LOOP_MS) * TAU * 2) * tw * 0.03 },
    { scale: 0.35 + progress.value * 0.65 },
  ]);

  return (
    <Group opacity={opacity} transform={transform} origin={{ x: bx, y: by }}>
      <Circle cx={bx} cy={by} r={tw * 0.055} color="#FFD36A" />
      <Circle cx={bx - tw * 0.012} cy={by - tw * 0.014} r={tw * 0.018} color="#FFF6D2" />
    </Group>
  );
}

export function WaterGlint({
  x,
  y,
  camera,
  time,
  phase,
}: {
  x: number;
  y: number;
  camera: IsoCamera;
  time: SharedValue<number>;
  phase: number;
}) {
  const x0 = sx(x + 0.28, y + 0.42, camera);
  const y0 = sy(x + 0.28, y + 0.42, -0.1, camera);
  const x1 = sx(x + 0.52, y + 0.42, camera);
  const opacity = useDerivedValue(() => {
    const wave = 0.5 + 0.5 * Math.sin((time.value / GROVE_LOOP_MS) * TAU * 2 + phase);
    return wave > 0.58 ? (wave - 0.58) * 1.6 : 0;
  });
  return (
    <Path
      path={`M${x0} ${y0} L${x1} ${y0}`}
      color="#FFFFFF"
      style="stroke"
      strokeWidth={Math.max(1, camera.tw * 0.03)}
      strokeCap="round"
      opacity={opacity}
    />
  );
}

function workletSmooth(t: number): number {
  'worklet';
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
}
