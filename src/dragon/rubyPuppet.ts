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
const WALK_OUT_END = 0.26;
const WALK_BACK_START = 0.52;
const WALK_BACK_END = 0.78;
const WALK_CYCLES = 3;

function joint(rotate = 0, x = 0, y = 0): RubyJoint {
  'worklet';
  return { rotate, x, y };
}

function smooth01(t: number): number {
  'worklet';
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
}

function lagSin(theta: number, lag: number): number {
  'worklet';
  return Math.sin(theta - lag);
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

export function sampleRubyPose(clip: RubyClip, stride: number, idlePhase: number): RubyPose {
  'worklet';
  const breathe = Math.sin(idlePhase);

  if (clip === 'walk') {
    const th = stride * WALK_CYCLES * TAU;
    const settle = Math.sin(stride * Math.PI);
    const hips = lagSin(th, 0) * settle;
    const chest = lagSin(th, 0.4) * settle;
    const headFollow = lagSin(th, 0.85) * settle;
    const tailFollow = lagSin(th, 2.55) * settle;
    const wingBalance = lagSin(th, 0.55) * settle;
    const rearStep = Math.max(0, lagSin(th, 0.15)) * settle;
    const frontStep = Math.max(0, lagSin(th, Math.PI + 0.15)) * settle;
    return {
      rootTilt: hips * 0.018,
      rootBob: Math.abs(chest) * 8,
      backWing: joint(wingBalance * -0.02 + breathe * 0.008),
      frontWing: joint(wingBalance * 0.028 + breathe * 0.01),
      tail: joint(tailFollow * 0.032 + breathe * 0.012),
      torso: joint(0, hips * 3, chest * 2 + breathe * 1.5),
      legLeft: joint(hips * 0.035, hips * 2, -rearStep * 16),
      legRight: joint(-hips * 0.05, -hips * 3, -frontStep * 22),
      head: joint(headFollow * -0.02 + breathe * 0.012, 0, Math.abs(headFollow) * -3),
    };
  }

  const curious = Math.sin(idlePhase * 0.55);
  return {
    rootTilt: curious * 0.006,
    rootBob: 0,
    backWing: joint(Math.sin(idlePhase * 0.9 + 0.4) * 0.016),
    frontWing: joint(Math.sin(idlePhase * 0.9) * 0.02),
    tail: joint(Math.sin(idlePhase * 0.7) * 0.026),
    torso: joint(0, 0, breathe * 2.2),
    legLeft: joint(curious * 0.008),
    legRight: joint(curious * -0.01),
    head: joint(breathe * 0.014 + curious * 0.012),
  };
}
