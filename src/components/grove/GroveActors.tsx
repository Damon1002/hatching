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

// Modular Rig Sprite Parts from reference deconstruction sheet
const IMG_TORSO = require('../../../assets/dragon/ruby/rig_parts/torso.png');
const IMG_NECK0 = require('../../../assets/dragon/ruby/rig_parts/neck_0.png');
const IMG_NECK1 = require('../../../assets/dragon/ruby/rig_parts/neck_1.png');
const IMG_NECK2 = require('../../../assets/dragon/ruby/rig_parts/neck_2.png');
const IMG_NECK3 = require('../../../assets/dragon/ruby/rig_parts/neck_3.png');
const IMG_HEAD_IDLE = require('../../../assets/dragon/ruby/rig_parts/head_idle.png');
const IMG_HEAD_CHEER = require('../../../assets/dragon/ruby/rig_parts/head_cheer.png');
const IMG_HEAD_WINK = require('../../../assets/dragon/ruby/rig_parts/head_wink.png');
const IMG_TAIL0 = require('../../../assets/dragon/ruby/rig_parts/tail_0.png');
const IMG_TAIL1 = require('../../../assets/dragon/ruby/rig_parts/tail_1.png');
const IMG_TAIL2 = require('../../../assets/dragon/ruby/rig_parts/tail_2.png');
const IMG_TAIL3 = require('../../../assets/dragon/ruby/rig_parts/tail_3.png');
const IMG_TAIL4 = require('../../../assets/dragon/ruby/rig_parts/tail_4.png');
const IMG_WING_L_BONE = require('../../../assets/dragon/ruby/rig_parts/wing_left_bone.png');
const IMG_WING_L_MEM = require('../../../assets/dragon/ruby/rig_parts/wing_left_membrane.png');
const IMG_WING_R_BONE = require('../../../assets/dragon/ruby/rig_parts/wing_right_bone.png');
const IMG_WING_R_MEM = require('../../../assets/dragon/ruby/rig_parts/wing_right_membrane.png');
const IMG_THIGH = require('../../../assets/dragon/ruby/rig_parts/back_thigh.png');
const IMG_PAW_BACK = require('../../../assets/dragon/ruby/rig_parts/paw_back.png');
const IMG_PAW_FRONT = require('../../../assets/dragon/ruby/rig_parts/paw_front.png');

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
  // Load modular image pieces
  const imgTorso = useImage(IMG_TORSO);
  const imgNeck0 = useImage(IMG_NECK0);
  const imgNeck1 = useImage(IMG_NECK1);
  const imgNeck2 = useImage(IMG_NECK2);
  const imgNeck3 = useImage(IMG_NECK3);
  const imgHeadIdle = useImage(IMG_HEAD_IDLE);
  const imgHeadCheer = useImage(IMG_HEAD_CHEER);
  const imgHeadWink = useImage(IMG_HEAD_WINK);
  const imgTail0 = useImage(IMG_TAIL0);
  const imgTail1 = useImage(IMG_TAIL1);
  const imgTail2 = useImage(IMG_TAIL2);
  const imgTail3 = useImage(IMG_TAIL3);
  const imgTail4 = useImage(IMG_TAIL4);
  const imgWingLBone = useImage(IMG_WING_L_BONE);
  const imgWingLMem = useImage(IMG_WING_L_MEM);
  const imgWingRBone = useImage(IMG_WING_R_BONE);
  const imgWingRMem = useImage(IMG_WING_R_MEM);
  const imgThigh = useImage(IMG_THIGH);
  const imgPawBack = useImage(IMG_PAW_BACK);
  const imgPawFront = useImage(IMG_PAW_FRONT);

  const tw = camera.tw;
  const ox = camera.ox;
  const oy = camera.oy;
  const homeX = creature.homeX;
  const homeY = creature.homeY;
  const destX = creature.destX;
  const destY = creature.destY;
  const phase = creature.phase;
  const s = tw * 0.42;

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

  const isHoppingSV = useDerivedValue(() => {
    const u = (((time.value % GROVE_LOOP_MS) + GROVE_LOOP_MS) % GROVE_LOOP_MS) / GROVE_LOOP_MS;
    return u < 0.08 || (u >= 0.7 && u < 0.78) ? 1 : 0;
  });

  return (
    <Group transform={transform}>
      {/* 1. Dynamic Ground Shadow */}
      <Group transform={shadowTransform}>
        <Oval x={-s * 0.7} y={-s * 0.1} width={s * 1.4} height={s * 0.32} color="rgba(35,10,22,0.32)" />
      </Group>

      {/* 2. Left Wing (Back Wing behind body) */}
      {imgWingLMem && (
        <Group transform={wingUpperL} origin={{ x: -s * 0.08, y: -s * 0.55 }}>
          <SkiaImage
            image={imgWingLMem}
            x={-s * 0.72}
            y={-s * 0.65}
            width={s * 1.15}
            height={s * 0.82}
            fit="contain"
            opacity={0.88}
          />
          {imgWingLBone && (
            <SkiaImage
              image={imgWingLBone}
              x={-s * 0.58}
              y={-s * 0.75}
              width={s * 0.95}
              height={s * 0.68}
              fit="contain"
            />
          )}
        </Group>
      )}

      {/* 3. Parametric 5-Segment Tail FK Chain with Reference Sprites */}
      <Group transform={tail0Rot} origin={{ x: -s * 0.35, y: -s * 0.25 }}>
        {imgTail0 && (
          <SkiaImage
            image={imgTail0}
            x={-s * 0.65}
            y={-s * 0.48}
            width={s * 0.78}
            height={s * 0.58}
            fit="contain"
          />
        )}
        <Group transform={tail1Rot} origin={{ x: -s * 0.45, y: -s * 0.25 }}>
          {imgTail1 && (
            <SkiaImage
              image={imgTail1}
              x={-s * 0.36}
              y={-s * 0.42}
              width={s * 0.38}
              height={s * 0.48}
              fit="contain"
            />
          )}
          <Group transform={tail2Rot} origin={{ x: -s * 0.65, y: -s * 0.25 }}>
            {imgTail2 && (
              <SkiaImage
                image={imgTail2}
                x={-s * 0.32}
                y={-s * 0.35}
                width={s * 0.34}
                height={s * 0.38}
                fit="contain"
              />
            )}
            <Group transform={tail3Rot} origin={{ x: -s * 0.85, y: -s * 0.25 }}>
              {imgTail3 && (
                <SkiaImage
                  image={imgTail3}
                  x={-s * 0.3}
                  y={-s * 0.28}
                  width={s * 0.32}
                  height={s * 0.3}
                  fit="contain"
                />
              )}
              <Group transform={tail4Rot} origin={{ x: -s * 1.05, y: -s * 0.25 }}>
                {imgTail4 && (
                  <SkiaImage
                    image={imgTail4}
                    x={-s * 0.52}
                    y={-s * 0.25}
                    width={s * 0.55}
                    height={s * 0.25}
                    fit="contain"
                  />
                )}
              </Group>
            </Group>
          </Group>
        </Group>
      </Group>

      {/* 4. Hind Left Leg (Large Muscular Thigh & Claws) */}
      {imgThigh && (
        <SkiaImage
          image={imgThigh}
          x={-s * 0.48}
          y={-s * 0.45}
          width={s * 0.55}
          height={s * 0.78}
          fit="contain"
        />
      )}
      {imgPawBack && (
        <SkiaImage
          image={imgPawBack}
          x={-s * 0.45}
          y={-s * 0.15}
          width={s * 0.38}
          height={s * 0.32}
          fit="contain"
        />
      )}

      {/* 5. Main Torso Body from Reference */}
      <Group transform={bodyBreathe} origin={{ x: 0, y: -s * 0.35 }}>
        {imgTorso && (
          <SkiaImage
            image={imgTorso}
            x={-s * 0.52}
            y={-s * 0.75}
            width={s * 0.98}
            height={s * 1.08}
            fit="contain"
          />
        )}
      </Group>

      {/* 6. Parametric 4-Joint Neck FK Chain & Head with Reference Sprites */}
      <Group transform={neck0Rot} origin={{ x: s * 0.12, y: -s * 0.58 }}>
        {imgNeck0 && (
          <SkiaImage
            image={imgNeck0}
            x={-s * 0.05}
            y={-s * 0.75}
            width={s * 0.42}
            height={s * 0.72}
            fit="contain"
          />
        )}
        <Group transform={neck1Rot} origin={{ x: s * 0.13, y: -s * 0.78 }}>
          {imgNeck1 && (
            <SkiaImage
              image={imgNeck1}
              x={-s * 0.03}
              y={-s * 0.75}
              width={s * 0.42}
              height={s * 0.72}
              fit="contain"
            />
          )}
          <Group transform={neck2Rot} origin={{ x: s * 0.16, y: -s * 0.98 }}>
            {imgNeck2 && (
              <SkiaImage
                image={imgNeck2}
                x={-s * 0.02}
                y={-s * 0.82}
                width={s * 0.4}
                height={s * 0.82}
                fit="contain"
              />
            )}
            <Group transform={neck3Rot} origin={{ x: s * 0.2, y: -s * 1.18 }}>
              {imgNeck3 && (
                <SkiaImage
                  image={imgNeck3}
                  x={-s * 0.02}
                  y={-s * 0.8}
                  width={s * 0.38}
                  height={s * 0.8}
                  fit="contain"
                />
              )}
              {/* 7. Head Hierarchy (Parented to Top of Neck with its own Pivot) */}
              <Group transform={headRot} origin={{ x: s * 0.22, y: -s * 1.34 }}>
                {isHoppingSV.value === 1 && imgHeadCheer ? (
                  <SkiaImage
                    image={imgHeadCheer}
                    x={-s * 0.15}
                    y={-s * 1.62}
                    width={s * 0.98}
                    height={s * 0.76}
                    fit="contain"
                  />
                ) : imgHeadIdle ? (
                  <SkiaImage
                    image={imgHeadIdle}
                    x={-s * 0.15}
                    y={-s * 1.62}
                    width={s * 0.98}
                    height={s * 0.75}
                    fit="contain"
                  />
                ) : null}
              </Group>
            </Group>
          </Group>
        </Group>
      </Group>

      {/* 8. Hero Front Right Wing */}
      {imgWingRMem && (
        <Group transform={wingUpperR} origin={{ x: 0, y: -s * 0.55 }}>
          <SkiaImage
            image={imgWingRMem}
            x={-s * 0.15}
            y={-s * 0.65}
            width={s * 1.18}
            height={s * 0.86}
            fit="contain"
            opacity={0.96}
          />
          {imgWingRBone && (
            <SkiaImage
              image={imgWingRBone}
              x={-s * 0.15}
              y={-s * 0.75}
              width={s * 0.98}
              height={s * 0.68}
              fit="contain"
            />
          )}
        </Group>
      )}

      {/* 9. Front Right Paw */}
      {imgPawFront && (
        <SkiaImage
          image={imgPawFront}
          x={s * 0.12}
          y={-s * 0.16}
          width={s * 0.32}
          height={s * 0.38}
          fit="contain"
        />
      )}
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
