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

const RUBY_IDLE = require('../../../assets/dragon/ruby/idle.png');
const RUBY_JUMP = require('../../../assets/dragon/ruby/jump.png');
const RUBY_HAPPY = require('../../../assets/dragon/ruby/happy.png');

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
  const rubyIdleImg = useImage(RUBY_IDLE);
  const rubyJumpImg = useImage(RUBY_JUMP);
  const rubyHappyImg = useImage(RUBY_HAPPY);

  const tw = camera.tw;
  const ox = camera.ox;
  const oy = camera.oy;
  const homeX = creature.homeX;
  const homeY = creature.homeY;
  const destX = creature.destX;
  const destY = creature.destY;
  const phase = creature.phase;
  const isRuby = speciesId === 'emberwing';
  const s = tw * 0.32;

  // Colors for vector Sky Drake
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

  const isHoppingSV = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    return u < 0.08 || (u >= 0.7 && u < 0.78) ? 1 : 0;
  });

  const wing = useDerivedValue(() => [
    { scaleY: 0.65 + 0.35 * Math.sin((time.value / GROVE_LOOP_MS) * TAU * 10 + phase) },
    { rotate: Math.sin((time.value / GROVE_LOOP_MS) * TAU * 10 + phase) * 0.12 },
  ]);

  const tailWag = useDerivedValue(() => [
    { rotate: Math.sin((time.value / GROVE_LOOP_MS) * TAU * 3 + phase) * 0.18 },
  ]);

  // Ruby Sprite Sizing
  const rw = tw * 0.96;
  const rh = rw * (115 / 130);

  // Sky Drake Paths
  const skyTailPath = `M ${-s * 0.35} ${-s * 0.25} Q ${-s * 0.95} ${-s * 0.4} ${-s * 1.15} ${-s * 0.75}`;
  const skyTailSpade = `M ${-s * 1.15} ${-s * 0.75} L ${-s * 1.35} ${-s * 0.9} L ${-s * 1.2} ${-s * 1.1} L ${-s * 1.05} ${-s * 0.85} Z`;
  const skyHornLeft = `M ${-s * 0.15} ${-s * 1.15} Q ${-s * 0.35} ${-s * 1.55} ${-s * 0.52} ${-s * 1.62} Q ${-s * 0.22} ${-s * 1.35} ${-s * 0.02} ${-s * 1.12} Z`;
  const skyHornRight = `M ${s * 0.05} ${-s * 1.15} Q ${s * 0.25} ${-s * 1.55} ${s * 0.42} ${-s * 1.62} Q ${s * 0.15} ${-s * 1.35} ${s * 0.18} ${-s * 1.12} Z`;
  const skyWingLeft = `M 0 ${-s * 0.55} Q ${-s * 0.8} ${-s * 1.25} ${-s * 1.15} ${-s * 1.05} Q ${-s * 0.85} ${-s * 0.65} ${-s * 0.6} ${-s * 0.35} Q ${-s * 0.3} ${-s * 0.45} 0 ${-s * 0.55} Z`;
  const skyWingRight = `M 0 ${-s * 0.55} Q ${s * 0.8} ${-s * 1.25} ${s * 1.15} ${-s * 1.05} Q ${s * 0.85} ${-s * 0.65} ${s * 0.6} ${-s * 0.35} Q ${s * 0.3} ${-s * 0.45} 0 ${-s * 0.55} Z`;
  const spine1 = `M ${-s * 0.25} ${-s * 0.75} L ${-s * 0.42} ${-s * 0.95} L ${-s * 0.12} ${-s * 0.85} Z`;
  const spine2 = `M ${-s * 0.05} ${-s * 0.92} L ${-s * 0.18} ${-s * 1.12} L ${s * 0.08} ${-s * 1.0} Z`;

  // Parametric Ruby Dragon Colors from reference palette
  const rubyMain = '#C83256';
  const rubyDark = '#7B1736';
  const rubyDeep = '#4E0E22';
  const rubyLight = '#E64D6F';
  const rubyBelly = '#FDE2C8';
  const rubyBellyHighlight = '#FFF3E8';
  const rubyScute = '#D47A6A';
  const rubyHorn = '#6E1428';
  const rubyAmberEye = '#FBB03B';

  // Long Neck & Head Articulation
  const neckWave = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    const hopT = u < 0.08 ? u / 0.08 : u >= 0.7 && u < 0.78 ? (u - 0.7) / 0.08 : 0;
    const air = hopping ? Math.sin(hopT * Math.PI) : 0;
    // Neck stretches forward and arches during hops, gently breathes during idle
    const stretch = air * 0.12 + (!hopping ? Math.sin((time.value / GROVE_LOOP_MS) * TAU * 2 + phase) * 0.03 : 0);
    const tilt = hopping ? air * 0.15 : Math.sin((time.value / GROVE_LOOP_MS) * TAU * 1.5 + phase) * 0.05;
    return [
      { scaleY: 1 + stretch },
      { scaleX: 1 - stretch * 0.4 },
      { rotate: tilt },
    ];
  });

  // Scalloped 3-Finger Wings Flapping
  const rubyWing = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    const freq = hopping ? 12 : 4;
    const amp = hopping ? 0.45 : 0.28;
    const wave = Math.sin((time.value / GROVE_LOOP_MS) * TAU * freq + phase);
    return [
      { scaleY: 0.75 + amp * wave },
      { scaleX: 0.9 + 0.15 * wave },
      { rotate: wave * 0.16 },
    ];
  });

  // Long Whip Tail Undulation
  const rubyTailWag = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const hopping = u < 0.08 || (u >= 0.7 && u < 0.78);
    const wave = Math.sin((time.value / GROVE_LOOP_MS) * TAU * (hopping ? 6 : 3) + phase);
    return [
      { rotate: wave * (hopping ? 0.25 : 0.18) },
      { scaleX: 1 + wave * 0.05 },
    ];
  });

  // Ruby Dragon Vector Geometries
  // 1. Long Whip Tail with Dorsal Spines
  const rubyTailPath = `M ${-s * 0.35} ${-s * 0.28} Q ${-s * 1.05} ${-s * 0.45} ${-s * 1.5} ${-s * 0.72} Q ${-s * 1.78} ${-s * 0.88} ${-s * 1.98} ${-s * 0.82}`;
  
  // 2. 4-Tier Spiky Horns / Head Crest
  const rCrest1 = `M ${s * 0.12} ${-s * 1.48} Q ${-s * 0.25} ${-s * 2.05} ${-s * 0.55} ${-s * 2.2} Q ${-s * 0.15} ${-s * 1.75} ${s * 0.26} ${-s * 1.5} Z`;
  const rCrest2 = `M ${s * 0.05} ${-s * 1.38} Q ${-s * 0.42} ${-s * 1.82} ${-s * 0.75} ${-s * 1.92} Q ${-s * 0.3} ${-s * 1.55} ${s * 0.15} ${-s * 1.38} Z`;
  const rCrest3 = `M ${-s * 0.02} ${-s * 1.28} Q ${-s * 0.52} ${-s * 1.55} ${-s * 0.82} ${-s * 1.6} Q ${-s * 0.4} ${-s * 1.35} ${s * 0.08} ${-s * 1.25} Z`;
  const rCrest4 = `M ${s * 0.02} ${-s * 1.15} Q ${-s * 0.42} ${-s * 1.32} ${-s * 0.68} ${-s * 1.3} Q ${-s * 0.32} ${-s * 1.15} ${s * 0.1} ${-s * 1.1} Z`;

  // 3. Scalloped 3-Finger Wings
  const rWingLeft = `M 0 ${-s * 0.55} Q ${-s * 0.75} ${-s * 1.38} ${-s * 1.15} ${-s * 1.25} Q ${-s * 1.0} ${-s * 0.88} ${-s * 0.82} ${-s * 0.72} Q ${-s * 0.65} ${-s * 0.58} ${-s * 0.5} ${-s * 0.42} Q ${-s * 0.22} ${-s * 0.5} 0 ${-s * 0.55} Z`;
  const rWingRight = `M 0 ${-s * 0.55} Q ${s * 0.82} ${-s * 1.45} ${s * 1.22} ${-s * 1.32} Q ${s * 1.05} ${-s * 0.95} ${s * 0.9} ${-s * 0.75} Q ${s * 0.7} ${-s * 0.6} ${s * 0.52} ${-s * 0.42} Q ${s * 0.26} ${-s * 0.5} 0 ${-s * 0.55} Z`;

  // 4. Long Graceful S-Curve Neck Back Contour
  const rNeck = `M ${-s * 0.12} ${-s * 0.72} Q ${s * 0.08} ${-s * 1.1} ${s * 0.2} ${-s * 1.35} L ${s * 0.4} ${-s * 1.25} Q ${s * 0.28} ${-s * 0.92} ${s * 0.22} ${-s * 0.65} Z`;

  // 5. Continuous Peach/Cream Ventral Plate (from chin down throat, neck, and chest)
  const rVentralPlates = `M ${s * 0.22} ${-s * 1.22} Q ${s * 0.14} ${-s * 0.95} ${s * 0.08} ${-s * 0.7} Q ${-s * 0.02} ${-s * 0.45} ${s * 0.02} ${-s * 0.15} Q ${s * 0.16} ${-s * 0.12} ${s * 0.3} ${-s * 0.25} Q ${s * 0.42} ${-s * 0.48} ${s * 0.38} ${-s * 0.7} Q ${s * 0.35} ${-s * 0.95} ${s * 0.42} ${-s * 1.18} Z`;

  if (isRuby) {
    return (
      <Group transform={transform}>
        {/* Dynamic Ground Shadow */}
        <Group transform={shadowTransform}>
          <Oval x={-s * 0.7} y={-s * 0.1} width={s * 1.4} height={s * 0.28} color="rgba(30,12,20,0.32)" />
        </Group>

        {/* 1. Long Whip Tail with undulating wagging */}
        <Group transform={rubyTailWag} origin={{ x: -s * 0.35, y: -s * 0.28 }}>
          <Path path={rubyTailPath} color={rubyMain} style="stroke" strokeWidth={Math.max(3.5, s * 0.22)} strokeCap="round" />
          {/* Tail Underside Peach Strip */}
          <Path path={`M ${-s * 0.35} ${-s * 0.2} Q ${-s * 0.8} ${-s * 0.32} ${-s * 1.2} ${-s * 0.52}`} color={rubyBelly} style="stroke" strokeWidth={Math.max(1.5, s * 0.08)} strokeCap="round" />
          {/* Tail Spikes */}
          <Path path={`M ${-s * 0.7} ${-s * 0.45} L ${-s * 0.82} ${-s * 0.62} L ${-s * 0.6} ${-s * 0.5} Z`} color={rubyDeep} />
          <Path path={`M ${-s * 1.05} ${-s * 0.58} L ${-s * 1.16} ${-s * 0.74} L ${-s * 0.95} ${-s * 0.62} Z`} color={rubyDeep} />
          <Path path={`M ${-s * 1.4} ${-s * 0.7} L ${-s * 1.5} ${-s * 0.86} L ${-s * 1.3} ${-s * 0.74} Z`} color={rubyDeep} />
          <Path path={`M ${-s * 1.7} ${-s * 0.82} L ${-s * 1.78} ${-s * 0.95} L ${-s * 1.62} ${-s * 0.84} Z`} color={rubyDeep} />
        </Group>

        {/* 2. Back Dorsal Spines along spine */}
        <Path path={`M ${-s * 0.26} ${-s * 0.75} L ${-s * 0.42} ${-s * 0.98} L ${-s * 0.12} ${-s * 0.85} Z`} color={rubyDark} />
        <Path path={`M ${-s * 0.06} ${-s * 0.88} L ${-s * 0.2} ${-s * 1.1} L ${s * 0.08} ${-s * 0.96} Z`} color={rubyDark} />

        {/* 3. Back Left Wing (behind body) */}
        <Group transform={rubyWing} origin={{ x: 0, y: -s * 0.55 }}>
          <Path path={rWingLeft} color={rubyDeep} opacity={0.88} />
          <Path path={`M 0 ${-s * 0.55} Q ${-s * 0.6} ${-s * 1.05} ${-s * 1.15} ${-s * 1.25}`} color={rubyDark} style="stroke" strokeWidth={Math.max(1.5, s * 0.04)} strokeCap="round" />
        </Group>

        {/* 4. Main Body Torso */}
        <Oval x={-s * 0.5} y={-s * 0.78} width={s * 1.0} height={s * 0.85} color={rubyMain} />

        {/* 5. Articulated Long Graceful Neck & Head with Continuous Ventral Scutes */}
        <Group transform={neckWave} origin={{ x: 0, y: -s * 0.7 }}>
          {/* S-Curve Neck Mesh */}
          <Path path={rNeck} color={rubyMain} />
          
          {/* Continuous Peach/Cream Ventral Scute Base Band */}
          <Path path={rVentralPlates} color={rubyBelly} />
          {/* Soft Highlight center core */}
          <Path path={`M ${s * 0.2} ${-s * 1.15} Q ${s * 0.16} ${-s * 0.95} ${s * 0.12} ${-s * 0.7} Q ${s * 0.08} ${-s * 0.45} ${s * 0.1} ${-s * 0.2} Q ${s * 0.2} ${-s * 0.2} ${s * 0.26} ${-s * 0.45} Q ${s * 0.3} ${-s * 0.7} ${s * 0.28} ${-s * 0.95} Q ${s * 0.28} ${-s * 1.12} ${s * 0.32} ${-s * 1.15} Z`} color={rubyBellyHighlight} opacity={0.85} />

          {/* Individual Ventral Scute Plate Division Lines (Smiling concave curves matching reference) */}
          {/* Throat Scutes */}
          <Path path={`M ${s * 0.24} ${-s * 1.16} Q ${s * 0.32} ${-s * 1.14} ${s * 0.38} ${-s * 1.18}`} color={rubyScute} style="stroke" strokeWidth={Math.max(1, s * 0.02)} strokeCap="round" />
          <Path path={`M ${s * 0.18} ${-s * 1.04} Q ${s * 0.27} ${-s * 1.02} ${s * 0.36} ${-s * 1.06}`} color={rubyScute} style="stroke" strokeWidth={Math.max(1, s * 0.02)} strokeCap="round" />
          <Path path={`M ${s * 0.14} ${-s * 0.92} Q ${s * 0.24} ${-s * 0.9} ${s * 0.34} ${-s * 0.94}`} color={rubyScute} style="stroke" strokeWidth={Math.max(1, s * 0.02)} strokeCap="round" />
          {/* Lower Neck Scutes */}
          <Path path={`M ${s * 0.1} ${-s * 0.79} Q ${s * 0.22} ${-s * 0.76} ${s * 0.34} ${-s * 0.81}`} color={rubyScute} style="stroke" strokeWidth={Math.max(1, s * 0.02)} strokeCap="round" />
          {/* Chest Scutes */}
          <Path path={`M ${s * 0.06} ${-s * 0.65} Q ${s * 0.2} ${-s * 0.61} ${s * 0.36} ${-s * 0.67}`} color={rubyScute} style="stroke" strokeWidth={Math.max(1.2, s * 0.022)} strokeCap="round" />
          <Path path={`M ${s * 0.02} ${-s * 0.51} Q ${s * 0.18} ${-s * 0.46} ${s * 0.36} ${-s * 0.53}`} color={rubyScute} style="stroke" strokeWidth={Math.max(1.2, s * 0.022)} strokeCap="round" />
          {/* Abdominal / Tummy Scutes */}
          <Path path={`M ${-s * 0.01} ${-s * 0.37} Q ${s * 0.16} ${-s * 0.32} ${s * 0.33} ${-s * 0.39}`} color={rubyScute} style="stroke" strokeWidth={Math.max(1.2, s * 0.022)} strokeCap="round" />
          <Path path={`M ${s * 0.02} ${-s * 0.24} Q ${s * 0.14} ${-s * 0.2} ${s * 0.28} ${-s * 0.26}`} color={rubyScute} style="stroke" strokeWidth={Math.max(1.2, s * 0.022)} strokeCap="round" />

          {/* 4-Tier Spiky Head Crest Horns */}
          <Path path={rCrest4} color={rubyHorn} />
          <Path path={rCrest3} color={rubyHorn} />
          <Path path={rCrest2} color={rubyHorn} />
          <Path path={rCrest1} color={rubyHorn} />

          {/* Dragon Head Core */}
          <Oval x={-s * 0.15} y={-s * 1.42} width={s * 0.72} height={s * 0.58} color={rubyMain} />
          
          {/* Snout & Smile */}
          <Oval x={s * 0.2} y={-s * 1.25} width={s * 0.46} height={s * 0.34} color={rubyLight} />
          <Path path={`M ${s * 0.18} ${-s * 1.1} Q ${s * 0.35} ${-s * 1.08} ${s * 0.52} ${-s * 1.15}`} color={rubyDark} style="stroke" strokeWidth={Math.max(1, s * 0.02)} strokeCap="round" />
          <Circle cx={s * 0.48} cy={-s * 1.22} r={s * 0.035} color={rubyDeep} />

          {/* Big Warm Amber Eyes from reference */}
          <Oval x={s * 0.08} y={-s * 1.38} width={s * 0.26} height={s * 0.32} color={rubyDeep} />
          <Oval x={s * 0.1} y={-s * 1.36} width={s * 0.22} height={s * 0.28} color={rubyAmberEye} />
          <Oval x={s * 0.12} y={-s * 1.36} width={s * 0.12} height={s * 0.22} color="#1A0A14" />
          {/* Anime Eye Highlights */}
          <Circle cx={s * 0.14} cy={-s * 1.42} r={s * 0.065} color="#FFFFFF" />
          <Circle cx={s * 0.24} cy={-s * 1.28} r={s * 0.025} color="#FFE699" />
        </Group>

        {/* 6. Hero Front Scalloped Bat Wing */}
        <Group transform={rubyWing} origin={{ x: 0, y: -s * 0.55 }}>
          <Path path={rWingRight} color={rubyMain} opacity={0.95} />
          {/* Wing Struts */}
          <Path path={`M 0 ${-s * 0.55} Q ${s * 0.65} ${-s * 1.1} ${s * 1.22} ${-s * 1.32}`} color={rubyDark} style="stroke" strokeWidth={Math.max(1.8, s * 0.04)} strokeCap="round" />
          <Path path={`M 0 ${-s * 0.55} Q ${s * 0.55} ${-s * 0.85} ${s * 0.9} ${-s * 0.75}`} color={rubyDark} style="stroke" strokeWidth={Math.max(1.2, s * 0.03)} strokeCap="round" />
          <Path path={`M 0 ${-s * 0.55} Q ${s * 0.38} ${-s * 0.62} ${s * 0.52} ${-s * 0.42}`} color={rubyDark} style="stroke" strokeWidth={Math.max(1, s * 0.025)} strokeCap="round" />
        </Group>

        {/* 7. Hind & Front Paws with Claws */}
        <Oval x={-s * 0.42} y={-s * 0.18} width={s * 0.34} height={s * 0.22} color={rubyDark} />
        <Oval x={s * 0.12} y={-s * 0.18} width={s * 0.3} height={s * 0.22} color={rubyDark} />
        <Circle cx={-s * 0.42} cy={-s * 0.08} r={s * 0.025} color="#1A0A14" />
        <Circle cx={-s * 0.34} cy={-s * 0.06} r={s * 0.025} color="#1A0A14" />
        <Circle cx={s * 0.18} cy={-s * 0.08} r={s * 0.025} color="#1A0A14" />
        <Circle cx={s * 0.26} cy={-s * 0.06} r={s * 0.025} color="#1A0A14" />
      </Group>
    );
  }

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
