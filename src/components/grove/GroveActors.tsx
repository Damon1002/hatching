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
    const tilt = hopping ? (facing === 1 ? -0.15 : 0.15) * Math.sin(hopT * Math.PI) : 0;
    return [{ translateX: px }, { translateY: py }, { scaleX: facing }, { rotate: tilt }];
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

  // Tail path & spade
  const tailPath = `M ${-s * 0.35} ${-s * 0.25} Q ${-s * 0.95} ${-s * 0.4} ${-s * 1.15} ${-s * 0.75}`;
  const tailSpade = `M ${-s * 1.15} ${-s * 0.75} L ${-s * 1.35} ${-s * 0.9} L ${-s * 1.2} ${-s * 1.1} L ${-s * 1.05} ${-s * 0.85} Z`;

  // Horns
  const hornLeft = `M ${-s * 0.15} ${-s * 1.15} Q ${-s * 0.35} ${-s * 1.55} ${-s * 0.52} ${-s * 1.62} Q ${-s * 0.22} ${-s * 1.35} ${-s * 0.02} ${-s * 1.12} Z`;
  const hornRight = `M ${s * 0.05} ${-s * 1.15} Q ${s * 0.25} ${-s * 1.55} ${s * 0.42} ${-s * 1.62} Q ${s * 0.15} ${-s * 1.35} ${s * 0.18} ${-s * 1.12} Z`;

  // Back spines
  const spine1 = `M ${-s * 0.25} ${-s * 0.75} L ${-s * 0.42} ${-s * 0.95} L ${-s * 0.12} ${-s * 0.85} Z`;
  const spine2 = `M ${-s * 0.05} ${-s * 0.92} L ${-s * 0.18} ${-s * 1.12} L ${s * 0.08} ${-s * 1.0} Z`;

  // Wings (Dragon Bat-Wing shape)
  const wingLeft = `M 0 ${-s * 0.55} Q ${-s * 0.8} ${-s * 1.25} ${-s * 1.15} ${-s * 1.05} Q ${-s * 0.85} ${-s * 0.65} ${-s * 0.6} ${-s * 0.35} Q ${-s * 0.3} ${-s * 0.45} 0 ${-s * 0.55} Z`;
  const wingRight = `M 0 ${-s * 0.55} Q ${s * 0.8} ${-s * 1.25} ${s * 1.15} ${-s * 1.05} Q ${s * 0.85} ${-s * 0.65} ${s * 0.6} ${-s * 0.35} Q ${s * 0.3} ${-s * 0.45} 0 ${-s * 0.55} Z`;

  return (
    <Group transform={transform}>
      {/* Ground Shadow */}
      <Group transform={shadowTransform}>
        <Oval x={-s * 0.55} y={-s * 0.1} width={s * 1.1} height={s * 0.28} color="rgba(15,35,22,0.28)" />
      </Group>

      {/* Dragon Tail */}
      <Group transform={tailWag} origin={{ x: -s * 0.35, y: -s * 0.25 }}>
        <Path path={tailPath} color={mainColor} style="stroke" strokeWidth={Math.max(2.5, s * 0.16)} strokeCap="round" />
        <Path path={tailSpade} color={darkColor} />
      </Group>

      {/* Dragon Back Spines */}
      <Path path={spine1} color={darkColor} />
      <Path path={spine2} color={darkColor} />

      {/* Dragon Wings */}
      <Group transform={wing} origin={{ x: 0, y: -s * 0.55 }}>
        <Path path={wingLeft} color={darkColor} opacity={0.92} />
        <Path path={wingRight} color={lightColor} opacity={0.92} />
      </Group>

      {/* Dragon Body */}
      <Oval x={-s * 0.5} y={-s * 0.78} width={s * 1.0} height={s * 0.85} color={mainColor} />
      {/* Soft Belly Plate */}
      <Oval x={-s * 0.15} y={-s * 0.65} width={s * 0.6} height={s * 0.65} color={bellyColor} />

      {/* Dragon Horns */}
      <Path path={hornLeft} color={hornColor} />
      <Path path={hornRight} color={hornColor} />

      {/* Dragon Head */}
      <Oval x={-s * 0.38} y={-s * 1.3} width={s * 0.88} height={s * 0.72} color={mainColor} />
      {/* Dragon Snout / Cheeks */}
      <Oval x={s * 0.08} y={-s * 1.02} width={s * 0.45} height={s * 0.36} color={lightColor} />
      {/* Cute Nostril */}
      <Circle cx={s * 0.38} cy={-s * 0.88} r={s * 0.035} color={darkColor} />

      {/* Dragon Eyes (Anime Sparkle) */}
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
