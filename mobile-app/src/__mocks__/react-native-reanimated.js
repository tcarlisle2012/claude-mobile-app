// Minimal mock for react-native-reanimated v4 (avoids importing native modules)
const { View } = require('react-native');

const noOp = () => {};
const identity = (v) => v;

module.exports = {
  __esModule: true,
  default: {
    createAnimatedComponent: (component) => component,
    addWhitelistedNativeProps: noOp,
    addWhitelistedUIProps: noOp,
    call: noOp,
    event: noOp,
    Value: jest.fn(),
    Node: jest.fn(),
    Clock: jest.fn(),
  },
  useSharedValue: (init) => ({ value: init }),
  useAnimatedStyle: () => ({}),
  useAnimatedGestureHandler: () => ({}),
  useDerivedValue: (fn) => ({ value: fn() }),
  useAnimatedScrollHandler: () => noOp,
  useAnimatedRef: () => ({ current: null }),
  withTiming: identity,
  withSpring: identity,
  withDecay: identity,
  withDelay: (_, anim) => anim,
  withSequence: identity,
  withRepeat: identity,
  cancelAnimation: noOp,
  Easing: {
    linear: identity,
    ease: identity,
    bezier: () => identity,
    in: identity,
    out: identity,
    inOut: identity,
  },
  FadeIn: { duration: () => ({ build: noOp }) },
  FadeOut: { duration: () => ({ build: noOp }) },
  Layout: { duration: () => ({ build: noOp }) },
  SlideInRight: { duration: () => ({ build: noOp }) },
  SlideOutLeft: { duration: () => ({ build: noOp }) },
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  interpolate: identity,
  Extrapolation: { CLAMP: 'clamp' },
  measure: noOp,
  scrollTo: noOp,
  createAnimatedComponent: (component) => component,
};
