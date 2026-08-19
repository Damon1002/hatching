export const RUBY_CLIPS = ['idle', 'walk'] as const;
export type RubyClip = (typeof RUBY_CLIPS)[number];
export type RubyClipControl = 'auto' | RubyClip;

export type RubyJoint = {
  rotate: number;
  x: number;
  y: number;
};

export type RubyPose = {
  rootTilt: number;
  rootBob: number;
  backWing: RubyJoint;
  frontWing: RubyJoint;
  tail: RubyJoint;
  torso: RubyJoint;
  legLeft: RubyJoint;
  legRight: RubyJoint;
  head: RubyJoint;
};

export type RubyLocomotion = {
  travel: number;
  outBound: boolean;
  clip: RubyClip;
  stride: number;
};

const TAU = Math.PI * 2;
const WALK_OUT_END = 0.28;
const WALK_BACK_START = 0.50;
const WALK_BACK_END = 0.78;
const WALK_CYCLES = 3.5;

function joint(rotate = 0, x = 0, y = 0): RubyJoint {
  'worklet';
  return { rotate, x, y };
}

function smooth01(t: number): number {
  'worklet';
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
}

export function groveLocomotion(loop01: number): RubyLocomotion {
  'worklet';
  const u = ((loop01 % 1) + 1) % 1;
  if (u < WALK_OUT_END) {
    const stride = u / WALK_OUT_END;
    return { travel: smooth01(stride), outBound: true, clip: 'walk', stride };
  }
  if (u < WALK_BACK_START) {
    return { travel: 1, outBound: true, clip: 'idle', stride: 0 };
  }
  if (u < WALK_BACK_END) {
    const stride = (u - WALK_BACK_START) / (WALK_BACK_END - WALK_BACK_START);
    return { travel: 1 - smooth01(stride), outBound: false, clip: 'walk', stride };
  }
  return { travel: 0, outBound: false, clip: 'idle', stride: 0 };
}

export function resolveRubyClip(autoClip: RubyClip, control: RubyClipControl = 'auto'): RubyClip {
  'worklet';
  return control === 'auto' ? autoClip : control;
}

/**
 * Real-time Kinematic Worklet for lively, expressive 2.5D dragon puppet animation.
 * Features high-stepping leg gaits, energetic wing balance flapping, wave tail wagging,
 * and curious head bobbing.
 */
export function sampleRubyPose(clip: RubyClip, stride: number, idlePhase: number): RubyPose {
  'worklet';
  const breathe = Math.sin(idlePhase * 1.6);
  const breathSlow = Math.sin(idlePhase * 0.8);

  if (clip === 'walk') {
    // Walk cycle angular phase
    const th = stride * WALK_CYCLES * TAU;
    // Settle curve ensures smooth ease-in from standstill and ease-out to stop
    const settle = Math.sin(stride * Math.PI);

    // 1. Primary Leg Locomotion (High-stepping, alternating leg swings)
    // Left Leg (rear leg)
    const leftSwing = Math.sin(th) * 0.45 * settle;
    const leftLift = -Math.max(0, Math.sin(th)) * 42 * settle;
    const leftPush = Math.cos(th) * 20 * settle;

    // Right Leg (front leg, anti-phase by PI)
    const rightSwing = Math.sin(th + Math.PI) * 0.48 * settle;
    const rightLift = -Math.max(0, Math.sin(th + Math.PI)) * 48 * settle;
    const rightPush = Math.cos(th + Math.PI) * 22 * settle;

    // 2. Body Dynamics (Step bobbing & waddle tilt)
    const stepBob = -Math.abs(Math.sin(th)) * 22 * settle;
    const waddleTilt = Math.sin(th) * 0.085 * settle;
    const torsoCompression = Math.sin(th * 2) * 8 * settle;

    // 3. Wing Flapping (Flaps rhythmically to assist balance during locomotion)
    const wingFlap = Math.sin(th * 2 - 0.3) * 0.35 * settle;
    const backWingFlap = -Math.sin(th * 2 - 0.5) * 0.30 * settle;

    // 4. Tail Follow-Through (Sinusoidal wave lag behind hip motion)
    const tailSwing = Math.sin(th - 1.2) * 0.38 * settle;
    const tailBounce = Math.cos(th * 2 - 0.8) * 18 * settle;

    // 5. Head Dynamics (Curious bobbing & pecking pitch)
    const headNod = Math.sin(th * 2 + 0.4) * 0.20 * settle;
    const headBob = Math.sin(th * 2) * 10 * settle;

    return {
      rootTilt: waddleTilt,
      rootBob: stepBob,
      backWing: joint(backWingFlap + breathe * 0.03, 0, backWingFlap * 12),
      frontWing: joint(wingFlap + breathe * 0.035, 0, -wingFlap * 15),
      tail: joint(tailSwing + breathSlow * 0.05, 0, tailBounce),
      torso: joint(waddleTilt * 0.5, 0, torsoCompression + breathe * 2.5),
      legLeft: joint(leftSwing, leftPush, leftLift),
      legRight: joint(rightSwing, rightPush, rightLift),
      head: joint(headNod + breathe * 0.04, 0, headBob),
    };
  }

  // IDLE POSE (Gentle living creature breathing, subtle curious head tilt, soft tail wag)
  const idleCurious = Math.sin(idlePhase * 0.5);
  const idleWingTwitch = Math.sin(idlePhase * 2.2) * (Math.sin(idlePhase * 0.3) > 0.4 ? 0.10 : 0.03);
  const idleTailSway = Math.sin(idlePhase * 0.9) * 0.14;
  const idleHeadLook = Math.sin(idlePhase * 0.7) * 0.08;

  return {
    rootTilt: idleCurious * 0.018,
    rootBob: breathe * 2.0,
    backWing: joint(-idleWingTwitch * 0.8 + breathe * 0.03),
    frontWing: joint(idleWingTwitch + breathe * 0.04),
    tail: joint(idleTailSway + breathSlow * 0.06, 0, Math.sin(idlePhase * 1.4) * 4),
    torso: joint(0, 0, breathe * 4.0),
    legLeft: joint(idleCurious * 0.02),
    legRight: joint(-idleCurious * 0.02),
    head: joint(idleHeadLook + breathe * 0.05, 0, -breathe * 3),
  };
}
