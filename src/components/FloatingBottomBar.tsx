import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PressableScale from './PressableScale';
import { colors } from '../theme';
import type { IconName, TabId } from '../types';

export const BAR_HEIGHT = 64;
export const barBottom = (inset: number) => Math.max(inset, 12);

const ITEMS: { id: TabId; icon: IconName }[] = [
  { id: 'home', icon: 'home' },
  { id: 'activities', icon: 'compass' },
  { id: 'details', icon: 'bookmark' },
  { id: 'profile', icon: 'user' },
];

function NavItem({
  icon,
  active,
  onPress,
}: {
  icon: IconName;
  active: boolean;
  onPress: () => void;
}) {
  const a = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    a.value = withTiming(active ? 1 : 0, { duration: 220 });
  }, [active, a]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(a.value, [0, 1], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.2)']),
    transform: [{ scale: interpolate(a.value, [0, 1], [1, 1.06]) }],
  }));
  return (
    <PressableScale onPress={onPress} style={[styles.item, style] as any} hitSlop={6}>
      <Feather name={icon} size={21} color={colors.white} style={{ opacity: active ? 1 : 0.75 }} />
    </PressableScale>
  );
}

type Props = {
  active: TabId;
  onChange: (t: TabId) => void;
  /** Shows the large white "+" capsule in the centre (Event details screen). */
  showPlus?: boolean;
  onPlus?: () => void;
};

/** Black pill-shaped floating navigation bar. */
export default function FloatingBottomBar({ active, onChange, showPlus, onPlus }: Props) {
  const insets = useSafeAreaInsets();
  const rot = useSharedValue(0);
  const plusStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  const left = ITEMS.slice(0, 2);
  const right = ITEMS.slice(2);

  return (
    <View style={[styles.bar, { bottom: barBottom(insets.bottom) }]}>
      {left.map((it) => (
        <NavItem key={it.id} icon={it.icon} active={active === it.id} onPress={() => onChange(it.id)} />
      ))}
      {showPlus && (
        <Pressable
          onPress={() => {
            rot.value = withSpring(rot.value + 90, { damping: 9, stiffness: 160 });
            onPlus?.();
          }}
        >
          <Animated.View style={[styles.plus, plusStyle]}>
            <Feather name="plus" size={26} color={colors.black} />
          </Animated.View>
        </Pressable>
      )}
      {right.map((it) => (
        <NavItem key={it.id} icon={it.icon} active={active === it.id} onPress={() => onChange(it.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: colors.black,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  item: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
