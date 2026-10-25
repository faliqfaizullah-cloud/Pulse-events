import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Wavy from './Wavy';
import { colors, fonts } from '../theme';

type Props = {
  shape: 'starburst' | 'circle' | 'square';
  color: string;
  size: number;
  title: string;
  date: string;
  /** Resting rotation of the whole sticker (deg). */
  rotate?: number;
  /** Rotation of the label relative to the sticker (deg). */
  textRotate?: number;
  titleSize?: number;
  /** Parallax strength; closer layers move more. */
  depth?: number;
  left: number;
  top: number;
  /** Offsets the idle-float phase so stickers drift out of sync. */
  phase?: number;
  px: SharedValue<number>;
  py: SharedValue<number>;
  onPress?: () => void;
};

/** Floating organic event sticker with idle bobbing, parallax tilt and a tap "pop". */
export default function EventStickerCard({
  shape,
  color,
  size,
  title,
  date,
  rotate = 0,
  textRotate = 0,
  titleSize = 20,
  depth = 1,
  left,
  top,
  phase = 0,
  px,
  py,
  onPress,
}: Props) {
  const float = useSharedValue(0);
  const pop = useSharedValue(1);
  const spin = useSharedValue(0);

  useEffect(() => {
    float.value = withDelay(
      phase * 350,
      withRepeat(withTiming(1, { duration: 2600 + phase * 450, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [float, phase]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: px.value * depth },
      { translateY: py.value * depth + (float.value - 0.5) * 12 },
      { rotate: `${rotate + (float.value - 0.5) * 6 + px.value * depth * 0.18 + spin.value}deg` },
      { scale: pop.value },
    ],
  }));

  const handlePress = () => {
    pop.value = withSequence(withSpring(1.1, { damping: 6, stiffness: 400 }), withSpring(1, { damping: 7 }));
    spin.value = withSequence(withTiming(spin.value + 8, { duration: 120 }), withSpring(0, { damping: 5, stiffness: 120 }));
    onPress?.();
  };

  return (
    <Animated.View style={[{ position: 'absolute', left, top, width: size, height: size }, style]}>
      <Pressable onPress={handlePress} style={{ width: size, height: size }}>
        <View style={StyleSheet.absoluteFill}>
          {shape === 'starburst' && <Wavy size={size} color={color} points={9} amp={0.1} />}
          {shape === 'circle' && (
            <Svg width={size} height={size}>
              <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={color} />
            </Svg>
          )}
          {shape === 'square' && (
            <View style={{ width: size, height: size, borderRadius: size * 0.17, backgroundColor: color }} />
          )}
        </View>
        <View style={[styles.labelWrap, { transform: [{ rotate: `${textRotate}deg` }] }]}>
          <Text style={[styles.title, { fontSize: titleSize }]}>{title}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  labelWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.semi, color: colors.ink },
  date: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink, marginTop: 1 },
});
