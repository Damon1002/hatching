import React from 'react';
import { Circle, Group, Image as SkiaImage, Oval, Path, useImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { groveLocomotion, resolveRubyClip, sampleRubyPose, type RubyClipControl } from '../../dragon/rubyPuppet';
export type { RubyClipControl };
import { shade } from '../../grove/color';
import { sx, sy, type IsoCamera } from '../../grove/iso';
import { GROVE_LOOP_MS } from '../../grove/types';
import type { GroveCreature, GroveTree, GroveTuft } from '../../grove/types';

const TAU = Math.PI * 2;

/**
 * Generate a closed Skia path string for an organic blob shape.
 * Uses 3 sine harmonics seeded from `seed` to deform a base ellipse,
 * then connects points with quadratic bezier curves for smoothness.
 */
/**
 * Generates an umbrella canopy tier with rounded scalloped petal lobes matching the pagoda style.
 */
/**
 * Generates an umbrella canopy tier with rounded scalloped petal lobes matching the pagoda style.
 */
function scallopTierPath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  height: number,
  topRx: number,
  numPetals: number,
  petalDepth: number,
): string {
  const topY = cy - height;
  const d: string[] = [`M ${cx - topRx} ${topY}`];

  // Top neck curve
  d.push(`Q ${cx} ${topY - topRx * 0.25} ${cx + topRx} ${topY}`);

  // Right flank down to right corner
  d.push(`Q ${cx + rx * 1.02} ${cy - height * 0.4} ${cx + rx} ${cy}`);

  // Scalloped bottom hem from right (angle 0) across front to left (angle PI)
  for (let i = 0; i < numPetals; i++) {
    const tStart = (i / numPetals) * Math.PI;
    const tEnd = ((i + 1) / numPetals) * Math.PI;
    const tMid = (tStart + tEnd) / 2.0;

    const tipR = rx + petalDepth;
    const tipRy = ry + petalDepth * 0.65;
    const tipX = cx + tipR * Math.cos(tMid);
    const tipY = cy + tipRy * Math.sin(tMid);

    const endX = cx + rx * Math.cos(tEnd);
    const endY = cy + ry * Math.sin(tEnd);

    d.push(`Q ${tipX.toFixed(1)} ${tipY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`);
  }

  // Left flank back to top neck
  d.push(`Q ${cx - rx * 1.02} ${cy - height * 0.4} ${cx - topRx} ${topY}`);
  d.push('Z');
  return d.join(' ');
}

/**
 * Generates the top smooth glossy dome cap.
 */
function topDomePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx} ${cy} C ${cx - rx} ${cy - ry * 1.85} ${cx + rx} ${cy - ry * 1.85} ${cx + rx} ${cy} Q ${cx} ${cy + ry * 0.35} ${cx - rx} ${cy} Z`;
}

/**
 * Generates the translucent jelly ribbon band highlight on the top dome.
 */
function jellyHighlightBandPath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx * 0.75} ${cy - ry * 0.85} Q ${cx} ${cy - ry * 1.05} ${cx + rx * 0.75} ${cy - ry * 0.85} Q ${cx + rx * 0.85} ${cy - ry * 0.4} ${cx + rx * 0.72} ${cy - ry * 0.4} Q ${cx} ${cy - ry * 0.58} ${cx - rx * 0.72} ${cy - ry * 0.4} Z`;
}

/**
 * Generates the flared wooden tree trunk with root toe claws.
 */
function flaredTrunkPath(
  cx: number,
  cy: number,
  trunkW: number,
  trunkH: number,
  flareW: number,
): string {
  const topY = cy - trunkH;
  const d: string[] = [`M ${cx - trunkW * 0.5} ${topY}`];

  // Left flank curving down to left root toe
  d.push(`Q ${cx - trunkW * 0.35} ${cy - trunkH * 0.4} ${cx - flareW} ${cy}`);

  // 5 Root toe claws along the ground
  d.push(`Q ${cx - flareW * 0.6} ${cy + flareW * 0.12} ${cx - flareW * 0.3} ${cy + flareW * 0.06}`);
  d.push(`Q ${cx} ${cy + flareW * 0.16} ${cx + flareW * 0.3} ${cy + flareW * 0.06}`);
  d.push(`Q ${cx + flareW * 0.6} ${cy + flareW * 0.12} ${cx + flareW} ${cy}`);

  // Right flank curving back up to trunk neck
  d.push(`Q ${cx + trunkW * 0.35} ${cy - trunkH * 0.4} ${cx + trunkW * 0.5} ${topY}`);
  d.push('Z');
  return d.join(' ');
}

export function GroveTreeSprite({
  tree,
  z,
  camera,
  time,
  leaf,
  leafDark,
  leafAccent,
  bark,
  snowy,
  progress,
  focusing,
}: {
  tree: GroveTree;
  z: number;
  camera: IsoCamera;
  time: SharedValue<number>;
  leaf: string;
  leafDark: string;
  leafAccent: string;
  bark: string;
  snowy: boolean;
  progress?: SharedValue<number>;
  focusing?: SharedValue<number>;
}) {
  const originX = sx(tree.x + 0.5, tree.y + 0.5, camera);
  const originY = sy(tree.x + 0.5, tree.y + 0.5, z, camera);
  const s = camera.tw * tree.scale;
  const phase = tree.phase;
  const targetGrowth = tree.growth; // Target unlocked form (1 = Basic, 2 = Advanced, 3 = Majestic)

  // 1. Continuous Live Growth Scale
  const liveGrowthScale = useDerivedValue(() => {
    if (!focusing || focusing.value < 0.05 || !progress) {
      return 1.0;
    }
    return 0.35 + progress.value * 0.65;
  });

  // 2. Continuous Tier Cascading Inflation (0.0 to 1.0)
  const tier3Inflation = useDerivedValue(() => {
    if (!focusing || focusing.value < 0.05 || !progress) {
      return targetGrowth >= 2 ? 1.0 : 0.0;
    }
    const p = progress.value;
    if (targetGrowth === 1) return 0.0;
    if (targetGrowth === 2) {
      if (p < 0.35) return 0.0;
      const t = Math.min(1.0, (p - 0.35) / 0.35);
      return t * t * (3 - 2 * t);
    }
    // Form 3
    if (p < 0.25) return 0.0;
    if (p < 0.55) {
      const t = (p - 0.25) / 0.30;
      return t * t * (3 - 2 * t);
    }
    return 1.0;
  });

  const tier4Inflation = useDerivedValue(() => {
    if (!focusing || focusing.value < 0.05 || !progress) {
      return targetGrowth === 3 ? 1.0 : 0.0;
    }
    const p = progress.value;
    if (targetGrowth !== 3 || p < 0.65) return 0.0;
    const t = Math.min(1.0, (p - 0.65) / 0.30);
    return t * t * (3 - 2 * t);
  });

  // Scaled down to 1/3 of previous size so it sits perfectly on the isometric tile
  const formScale = targetGrowth === 3 ? 0.58 : targetGrowth === 2 ? 0.46 : 0.36;
  const treeSize = s * formScale;

  // Trunk Geometry
  const trunkW = treeSize * 0.16;
  const trunkH = treeSize * (targetGrowth === 3 ? 0.28 : targetGrowth === 2 ? 0.25 : 0.22);
  const flareW = treeSize * (targetGrowth === 3 ? 0.26 : targetGrowth === 2 ? 0.22 : 0.18);
  const trunkShape = flaredTrunkPath(originX, originY, trunkW, trunkH, flareW);

  // Vertical Tier Stacking Coordinates (Proportions matching reference)
  const tier4Y = originY - trunkH - treeSize * 0.02;
  const tier3Y = tier4Y - treeSize * 0.12;
  const tier2Y = tier3Y - treeSize * 0.11;
  const tier1Y = tier2Y - treeSize * 0.10;
  const domeY = tier1Y - treeSize * 0.09;

  // Parametric Scalloped Tier Paths
  const t4Path = scallopTierPath(originX, tier4Y, treeSize * 0.62, treeSize * 0.17, treeSize * 0.19, treeSize * 0.44, 17, treeSize * 0.06);
  const t3Path = scallopTierPath(originX, tier3Y, treeSize * 0.50, treeSize * 0.14, treeSize * 0.17, treeSize * 0.35, 13, treeSize * 0.05);
  const t2Path = scallopTierPath(originX, tier2Y, treeSize * 0.39, treeSize * 0.11, treeSize * 0.15, treeSize * 0.27, 11, treeSize * 0.045);
  const t1Path = scallopTierPath(originX, tier1Y, treeSize * 0.29, treeSize * 0.09, treeSize * 0.13, treeSize * 0.20, 9, treeSize * 0.04);
  
  const domeRx = treeSize * 0.20;
  const domeRy = treeSize * 0.18;
  const domePath = topDomePath(originX, domeY, domeRx, domeRy);
  const jellyBand = jellyHighlightBandPath(originX, domeY, domeRx, domeRy);

  // Reference Palette
  const colorDome = '#FFDF28';
  const colorTier1 = '#F2BF15';
  const colorTier2 = '#E99E10';
  const colorTier3 = '#DB7E0C';
  const colorTier4 = '#C9610B';

  const strokeDome = '#E5B800';
  const strokeTier1 = '#C99805';
  const strokeTier2 = '#BF7505';
  const strokeTier3 = '#AC5B05';
  const strokeTier4 = '#9B4504';

  const colorTrunk = '#532F15';
  const strokeTrunk = '#381C08';

  // Ground Shadow (Compact proportional shadow)
  const shadowRadius = treeSize * 0.32;

  // Reanimated GPU Wind Sway
  const transform = useDerivedValue(() => {
    const sway = Math.sin((time.value / GROVE_LOOP_MS) * TAU + phase) * 0.028;
    const scale = liveGrowthScale.value;
    return [
      { scaleX: scale },
      { scaleY: scale },
      { rotate: sway },
    ];
  });

  // Floating Golden Firefly Particles for Form 3
  const mote1Y = useDerivedValue(() => domeY - treeSize * 0.15 + Math.sin((time.value / GROVE_LOOP_MS) * TAU * 1.5 + phase) * 6);
  const mote2Y = useDerivedValue(() => tier2Y + Math.cos((time.value / GROVE_LOOP_MS) * TAU * 1.2 + phase + 1.5) * 7);
  const moteOpacity = useDerivedValue(() => tier4Inflation.value * (0.75 + Math.sin((time.value / GROVE_LOOP_MS) * TAU * 2) * 0.25));

  return (
    <Group>
      {/* 1. Soft Ground Shadow */}
      <Oval
        x={originX - shadowRadius * 1.0}
        y={originY - shadowRadius * 0.30}
        width={shadowRadius * 2.0}
        height={shadowRadius * 0.60}
        color="rgba(25, 40, 10, 0.26)"
      />

      {/* 2. Parametric Scalloped Tree Rig with GPU Wind Sway */}
      <Group transform={transform} origin={{ x: originX, y: originY }}>
        {/* Flared Stylized Wood Trunk with Root Toes */}
        <Path path={trunkShape} color={colorTrunk} />
        <Path path={trunkShape} color={strokeTrunk} style="stroke" strokeWidth={1.5} />

        {/* Vertical Trunk Grain Lines */}
        <Path
          path={`M ${originX - trunkW * 0.15} ${originY - trunkH} Q ${originX - trunkW * 0.2} ${originY - trunkH * 0.4} ${originX - flareW * 0.35} ${originY}`}
          color={strokeTrunk}
          style="stroke"
          strokeWidth={1.0}
        />
        <Path
          path={`M ${originX + trunkW * 0.15} ${originY - trunkH} Q ${originX + trunkW * 0.2} ${originY - trunkH * 0.4} ${originX + flareW * 0.35} ${originY}`}
          color={strokeTrunk}
          style="stroke"
          strokeWidth={1.0}
        />

        {/* Tier 4: Bottom Grand Skirt (Form 3) */}
        {targetGrowth === 3 ? (
          <Group opacity={tier4Inflation}>
            <Path path={t4Path} color={colorTier4} />
            <Path path={t4Path} color={strokeTier4} style="stroke" strokeWidth={1.2} />
          </Group>
        ) : null}

        {/* Tier 3: Lower-Mid Frills (Form 2 & 3) */}
        {targetGrowth >= 2 ? (
          <Group opacity={tier3Inflation}>
            <Path path={t3Path} color={colorTier3} />
            <Path path={t3Path} color={strokeTier3} style="stroke" strokeWidth={1.2} />
          </Group>
        ) : null}

        {/* Tier 2: Mid Frills (Form 1, 2, 3) */}
        <Path path={t2Path} color={colorTier2} />
        <Path path={t2Path} color={strokeTier2} style="stroke" strokeWidth={1.2} />

        {/* Tier 1: Upper-Mid Frills (Form 1, 2, 3) */}
        <Path path={t1Path} color={colorTier1} />
        <Path path={t1Path} color={strokeTier1} style="stroke" strokeWidth={1.2} />

        {/* Top Tier: Glossy Jelly Dome Cap */}
        <Path path={domePath} color={colorDome} />
        <Path path={domePath} color={strokeDome} style="stroke" strokeWidth={1.2} />

        {/* Top Dome Translucent Jelly Ribbon Highlight */}
        <Path path={jellyBand} color="rgba(255, 252, 200, 0.55)" />

        {/* Specular Droplet Highlight Beads */}
        <Circle cx={originX + domeRx * 0.4} cy={domeY - domeRy * 0.95} r={domeRx * 0.16} color="rgba(255, 255, 255, 0.85)" />
        <Circle cx={originX - domeRx * 0.38} cy={domeY - domeRy * 0.75} r={domeRx * 0.11} color="rgba(255, 255, 255, 0.65)" />
        <Circle cx={originX + domeRx * 0.15} cy={domeY - domeRy * 0.55} r={domeRx * 0.08} color="rgba(255, 255, 255, 0.75)" />
      </Group>

      {/* 3. Floating Fairy Firefly Motes (Form 3) */}
      {targetGrowth === 3 ? (
        <Group opacity={moteOpacity}>
          <Circle cx={originX - treeSize * 0.28} cy={mote1Y} r={s * 0.035} color="#FFE66D" />
          <Circle cx={originX + treeSize * 0.30} cy={mote2Y} r={s * 0.028} color="#FFD166" />
        </Group>
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
  speciesId = 'baby_sky_drake',
  dragonClip = 'auto',
  dragonSize = 0.25,
}: {
  creature: GroveCreature;
  homeZ: number;
  destZ: number;
  camera: IsoCamera;
  time: SharedValue<number>;
  speciesId?: string;
  dragonClip?: RubyClipControl;
  dragonSize?: number;
}) {
  if (speciesId === 'emberwing') {
    return (
      <RubyDragonCreature
        creature={creature}
        homeZ={homeZ}
        destZ={destZ}
        camera={camera}
        time={time}
        clip={dragonClip}
        sizeMul={dragonSize}
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
      sizeMul={dragonSize}
    />
  );
}

// Registered puppet layers from red-dragon-puppet-layers/layer_manifest.json.
const PUPPET_BACK_WING = require('../../../assets/dragon/ruby/puppet/layer_back_wing.png');
const PUPPET_FRONT_WING = require('../../../assets/dragon/ruby/puppet/layer_front_wing.png');
const PUPPET_HEAD = require('../../../assets/dragon/ruby/puppet/layer_head.png');
const PUPPET_LEG_LEFT = require('../../../assets/dragon/ruby/puppet/layer_leg_left.png');
const PUPPET_LEG_RIGHT = require('../../../assets/dragon/ruby/puppet/layer_leg_right.png');
const PUPPET_TORSO = require('../../../assets/dragon/ruby/puppet/layer_neck_and_torso.png');
const PUPPET_TAIL = require('../../../assets/dragon/ruby/puppet/layer_tail.png');

const PUPPET_CANVAS = { w: 1359, h: 1158 };
const PUPPET_ANCHOR = { x: 928, y: 1110 };
const PUPPET_HEIGHT_TILES = 1.48;

const PUPPET_LAYERS = {
  backWing: { origin: { x: 820, y: 350 }, size: { w: 420, h: 300 }, pivot: { x: 0.17, y: 0.27 } },
  tail: { origin: { x: 65, y: 555 }, size: { w: 850, h: 535 }, pivot: { x: 0.92, y: 0.48 } },
  frontWing: { origin: { x: 215, y: 350 }, size: { w: 665, h: 440 }, pivot: { x: 0.88, y: 0.22 } },
  torso: { origin: { x: 565, y: 320 }, size: { w: 625, h: 815 }, pivot: { x: 0.55, y: 0.62 } },
  legLeft: { origin: { x: 649, y: 714 }, size: { w: 294, h: 412 }, pivot: { x: 0.5924, y: 0.1722 } },
  legRight: { origin: { x: 927, y: 718 }, size: { w: 284, h: 398 }, pivot: { x: 0.3881, y: 0.1753 } },
  head: { origin: { x: 535, y: 5 }, size: { w: 805, h: 535 }, pivot: { x: 0.53, y: 0.84 } },
} as const;

type PuppetLayerSpec = (typeof PUPPET_LAYERS)[keyof typeof PUPPET_LAYERS];

function puppetLayout(layer: PuppetLayerSpec, scale: number) {
  return {
    x: (layer.origin.x - PUPPET_ANCHOR.x) * scale,
    y: (layer.origin.y - PUPPET_ANCHOR.y) * scale,
    w: layer.size.w * scale,
    h: layer.size.h * scale,
    ox: (layer.origin.x + layer.size.w * layer.pivot.x - PUPPET_ANCHOR.x) * scale,
    oy: (layer.origin.y + layer.size.h * layer.pivot.y - PUPPET_ANCHOR.y) * scale,
  };
}

function RubyDragonCreature({
  creature,
  homeZ,
  destZ,
  camera,
  time,
  clip = 'auto',
  sizeMul = 1,
}: {
  creature: GroveCreature;
  homeZ: number;
  destZ: number;
  camera: IsoCamera;
  time: SharedValue<number>;
  clip?: RubyClipControl;
  sizeMul?: number;
}) {
  const imgBackWing = useImage(PUPPET_BACK_WING);
  const imgFrontWing = useImage(PUPPET_FRONT_WING);
  const imgHead = useImage(PUPPET_HEAD);
  const imgLegLeft = useImage(PUPPET_LEG_LEFT);
  const imgLegRight = useImage(PUPPET_LEG_RIGHT);
  const imgTorso = useImage(PUPPET_TORSO);
  const imgTail = useImage(PUPPET_TAIL);

  const tw = camera.tw;
  const ox = camera.ox;
  const oy = camera.oy;
  const homeX = creature.homeX;
  const homeY = creature.homeY;
  const destX = creature.destX;
  const destY = creature.destY;
  const phase = creature.phase;
  const scale = (tw * PUPPET_HEIGHT_TILES * sizeMul) / PUPPET_CANVAS.h;
  const backWing = puppetLayout(PUPPET_LAYERS.backWing, scale);
  const tail = puppetLayout(PUPPET_LAYERS.tail, scale);
  const frontWing = puppetLayout(PUPPET_LAYERS.frontWing, scale);
  const torso = puppetLayout(PUPPET_LAYERS.torso, scale);
  const legLeft = puppetLayout(PUPPET_LAYERS.legLeft, scale);
  const legRight = puppetLayout(PUPPET_LAYERS.legRight, scale);
  const head = puppetLayout(PUPPET_LAYERS.head, scale);

  const transform = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const loc = groveLocomotion(u);
    const resolved = resolveRubyClip(loc.clip, clip);
    const stride = resolved === 'walk' && loc.clip === 'idle' ? u * 4 : loc.stride;
    const pose = sampleRubyPose(resolved, stride, (time.value / GROVE_LOOP_MS) * TAU + phase);
    const facing = loc.outBound ? (destX >= homeX ? 1 : -1) : homeX >= destX ? 1 : -1;
    const cx = homeX + (destX - homeX) * loc.travel + 0.5;
    const cy = homeY + (destY - homeY) * loc.travel + 0.5;
    const z = homeZ + (destZ - homeZ) * loc.travel;
    const px = Math.round(ox + (cx - cy) * tw * 0.5);
    const py = Math.round(oy + (cx + cy) * tw * 0.25 - z * tw) + pose.rootBob * scale;
    const breathe = resolved === 'idle' ? 1 + Math.sin((time.value / GROVE_LOOP_MS) * TAU * 1.4 + phase) * 0.006 : 1;
    return [
      { translateX: px },
      { translateY: py },
      { scaleX: facing * breathe },
      { scaleY: breathe },
      { rotate: pose.rootTilt * (facing === 1 ? 1 : -1) },
    ];
  });

  const shadowTransform = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    const loc = groveLocomotion(u);
    const resolved = resolveRubyClip(loc.clip, clip);
    const stride = resolved === 'walk' && loc.clip === 'idle' ? u * 4 : loc.stride;
    const pose = sampleRubyPose(resolved, stride, (time.value / GROVE_LOOP_MS) * TAU + phase);
    const squash = 1 - Math.min(0.04, pose.rootBob / 400);
    return [{ scaleX: 1 + (1 - squash) * 0.12 }, { scaleY: squash }];
  });

  const backWingT = useDerivedValue(() => jointWorld(time.value, clip, phase, scale).backWing);
  const frontWingT = useDerivedValue(() => jointWorld(time.value, clip, phase, scale).frontWing);
  const tailT = useDerivedValue(() => jointWorld(time.value, clip, phase, scale).tail);
  const torsoT = useDerivedValue(() => jointWorld(time.value, clip, phase, scale).torso);
  const legLeftT = useDerivedValue(() => jointWorld(time.value, clip, phase, scale).legLeft);
  const legRightT = useDerivedValue(() => jointWorld(time.value, clip, phase, scale).legRight);
  const headT = useDerivedValue(() => jointWorld(time.value, clip, phase, scale).head);

  return (
    <Group transform={transform}>
      <Group transform={shadowTransform}>
        <Oval
          x={-tw * 0.42 * sizeMul}
          y={-tw * 0.06 * sizeMul}
          width={tw * 0.84 * sizeMul}
          height={tw * 0.2 * sizeMul}
          color="rgba(35,10,22,0.32)"
        />
      </Group>

      {imgBackWing ? (
        <Group transform={backWingT} origin={{ x: backWing.ox, y: backWing.oy }}>
          <SkiaImage image={imgBackWing} x={backWing.x} y={backWing.y} width={backWing.w} height={backWing.h} fit="fill" />
        </Group>
      ) : null}

      {imgTail ? (
        <Group transform={tailT} origin={{ x: tail.ox, y: tail.oy }}>
          <SkiaImage image={imgTail} x={tail.x} y={tail.y} width={tail.w} height={tail.h} fit="fill" />
        </Group>
      ) : null}

      {imgFrontWing ? (
        <Group transform={frontWingT} origin={{ x: frontWing.ox, y: frontWing.oy }}>
          <SkiaImage image={imgFrontWing} x={frontWing.x} y={frontWing.y} width={frontWing.w} height={frontWing.h} fit="fill" />
        </Group>
      ) : null}

      <Group transform={torsoT} origin={{ x: torso.ox, y: torso.oy }}>
        {imgTorso ? (
          <SkiaImage image={imgTorso} x={torso.x} y={torso.y} width={torso.w} height={torso.h} fit="fill" />
        ) : null}
      </Group>

      {imgLegLeft ? (
        <Group transform={legLeftT} origin={{ x: legLeft.ox, y: legLeft.oy }}>
          <SkiaImage image={imgLegLeft} x={legLeft.x} y={legLeft.y} width={legLeft.w} height={legLeft.h} fit="fill" />
        </Group>
      ) : null}

      {imgLegRight ? (
        <Group transform={legRightT} origin={{ x: legRight.ox, y: legRight.oy }}>
          <SkiaImage image={imgLegRight} x={legRight.x} y={legRight.y} width={legRight.w} height={legRight.h} fit="fill" />
        </Group>
      ) : null}

      {imgHead ? (
        <Group transform={headT} origin={{ x: head.ox, y: head.oy }}>
          <SkiaImage image={imgHead} x={head.x} y={head.y} width={head.w} height={head.h} fit="fill" />
        </Group>
      ) : null}
    </Group>
  );
}

function jointWorld(clock: number, clip: RubyClipControl, phase: number, scale: number) {
  'worklet';
  const u = (((clock % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
  const loc = groveLocomotion(u);
  const resolved = resolveRubyClip(loc.clip, clip);
  const stride = resolved === 'walk' && loc.clip === 'idle' ? u * 4 : loc.stride;
  const pose = sampleRubyPose(resolved, stride, (clock / GROVE_LOOP_MS) * TAU + phase);
  const toT = (joint: { rotate: number; x: number; y: number }) => [
    { translateX: joint.x * scale },
    { translateY: joint.y * scale },
    { rotate: joint.rotate },
  ];
  return {
    backWing: toT(pose.backWing),
    frontWing: toT(pose.frontWing),
    tail: toT(pose.tail),
    torso: toT(pose.torso),
    legLeft: toT(pose.legLeft),
    legRight: toT(pose.legRight),
    head: toT(pose.head),
  };
}

function SkyDrakeCreature({
  creature,
  homeZ,
  destZ,
  camera,
  time,
  sizeMul = 1,
}: {
  creature: GroveCreature;
  homeZ: number;
  destZ: number;
  camera: IsoCamera;
  time: SharedValue<number>;
  sizeMul?: number;
}) {
  const tw = camera.tw;
  const ox = camera.ox;
  const oy = camera.oy;
  const homeX = creature.homeX;
  const homeY = creature.homeY;
  const destX = creature.destX;
  const destY = creature.destY;
  const phase = creature.phase;
  const s = tw * 0.32 * sizeMul;

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
