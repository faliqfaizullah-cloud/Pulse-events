import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  /** Pressed scale. The spec asks for a slight shrink: scale(0.96). */
  scaleTo?: number;
  children?: React.ReactNode;
};

/** Pressable that squishes to 0.96 on press and springs back with a little overshoot. */
export default function PressableScale({
  style,
  scaleTo = 0.96,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        s.value = withSpring(scaleTo, { damping: 15, stiffness: 420 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withSpring(1, { damping: 8, stiffness: 300 });
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, anim]}>{children}</Animated.View>
    </Pressable>
  );
}
