const RN = require('react-native');

export const Swipeable = 'Swipeable';
export const DrawerLayout = 'DrawerLayout';
export const State = {};
export const ScrollView = RN.ScrollView;
export const Switch = RN.Switch;
export const TextInput = RN.TextInput;
export const FlatList = RN.FlatList;
export const NativeViewGestureHandler = 'NativeViewGestureHandler';
export const TapGestureHandler = 'TapGestureHandler';
export const FlingGestureHandler = 'FlingGestureHandler';
export const ForceTouchGestureHandler = 'ForceTouchGestureHandler';
export const LongPressGestureHandler = 'LongPressGestureHandler';
export const PanGestureHandler = 'PanGestureHandler';
export const PinchGestureHandler = 'PinchGestureHandler';
export const RotationGestureHandler = 'RotationGestureHandler';
export const RawButton = 'RawButton';
export const BaseButton = 'BaseButton';
export const RectButton = 'RectButton';
export const BorderlessButton = 'BorderlessButton';
export const gestureHandlerRootHOC = (component) => component;
export const GestureHandlerRootView = RN.View;
export const Directions = {};
export const Gesture = {
  Pan: () => ({
    onStart: () => Gesture.Pan(),
    onUpdate: () => Gesture.Pan(),
    onEnd: () => Gesture.Pan(),
  }),
  Tap: () => ({
    onStart: () => Gesture.Tap(),
    onEnd: () => Gesture.Tap(),
  }),
};
export const GestureDetector = RN.View;
