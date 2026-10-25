import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import PressableScale from './PressableScale';
import { colors, fonts } from '../theme';
import type { IconName } from '../types';

type CatId = 'special' | 'work' | 'friends';
type Category = { id: CatId; title: string; color: string; deep: string; icon: IconName };

// Back → front order of the default stack (Friends sits in front, as in the reference).
const CATS: Category[] = [
  { id: 'special', title: 'Special Events', color: colors.cardPink, deep: colors.cardPinkDeep, icon: 'star' },
  { id: 'work', title: 'Events for Work', color: colors.blue, deep: colors.blueDeep, icon: 'briefcase' },
  { id: 'friends', title: 'Events with Friends', color: colors.green, deep: colors.greenDeep, icon: 'users' },
];

const OPTIONS: { id: string; label: string; icon: IconName }[] = [
  { id: 'dates', label: 'Check dates', icon: 'calendar' },
  { id: 'soon', label: 'Coming soon', icon: 'clock' },
  { id: 'shared', label: 'Most shared', icon: 'send' },
];

// Layout metrics (px)
const PEEK = 50;
const HEADER_H = 58;
const ITEM_H = 52;
const GAP = 8;
const EXPANDED_H = HEADER_H + OPTIONS.length * ITEM_H + (OPTIONS.length - 1) * GAP + 22;
const ACTIVE_TOP = 2 * PEEK + 6;
export const ACCORDION_H = ACTIVE_TOP + EXPANDED_H + 16;

const SPR = { damping: 11, stiffness: 140, mass: 0.9 }; // lively, bouncy spring

type CardProps = {
  cat: Category;
  top: number;
  height: number;
  rotate: number;
  inset: number;
  zIndex: number;
  isActive: boolean;
  onPress: () => void;
  children?: React.ReactNode;
};

function StackCard({ cat, top, height, rotate, inset, zIndex, isActive, onPress, children }: CardProps) {
  const t = useSharedValue(top);
  const h = useSharedValue(height);
  const r = useSharedValue(rotate);
  const i = useSharedValue(inset);

  useEffect(() => {
    t.value = withSpring(top, SPR);
    h.value = withSpring(height, SPR);
    r.value = withSpring(rotate, SPR);
    i.value = withSpring(inset, SPR);
  }, [top, height, rotate, inset, t, h, r, i]);

  const style = useAnimatedStyle(() => ({
    top: t.value,
    height: Math.max(h.value, 0),
    left: i.value,
    right: i.value,
    transform: [{ rotate: `${r.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.card, { backgroundColor: cat.color, zIndex }, style]}>
      <Pressable onPress={onPress} disabled={isActive} style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {cat.title}
        </Text>
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={{ flex: 1 }} />
        <Feather name={cat.icon} size={20} color={colors.ink} />
      </Pressable>
      {children}
    </Animated.View>
  );
}

function OptionRow({
  option,
  deep,
  selected,
  index,
  onToggle,
}: {
  option: (typeof OPTIONS)[number];
  deep: string;
  selected: boolean;
  index: number;
  onToggle: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(90 + index * 70).springify().damping(11)}
      exiting={FadeOut.duration(110)}
    >
      <PressableScale
        onPress={onToggle}
        style={[
          styles.option,
          { backgroundColor: selected ? colors.white : 'rgba(255,255,255,0.28)' },
        ]}
      >
        <View style={[styles.optionIcon, { backgroundColor: selected ? deep : 'rgba(255,255,255,0.45)' }]}>
          <Feather
            name={selected ? 'check' : option.icon}
            size={16}
            color={selected ? colors.white : colors.ink}
          />
        </View>
        <Text style={styles.optionLabel}>{option.label}</Text>
        <Feather name="chevron-right" size={18} color={colors.ink} />
      </PressableScale>
    </Animated.View>
  );
}

/**
 * Stack of three folder-like cards. Tapping a peeking card springs it to the front and
 * expands its options while the other two fold back behind it. ✕ collapses everything.
 */
export default function CategoryAccordion() {
  const [active, setActive] = useState<CatId | null>('friends');
  const [selected, setSelected] = useState<Record<CatId, string[]>>({
    special: ['dates'],
    work: ['dates'],
    friends: ['dates'],
  });

  // Drives the ring colour of the ✕ button: Pink → Blue → Green accent transitions.
  const accent = useSharedValue(2);
  useEffect(() => {
    if (active) accent.value = withTiming(CATS.findIndex((c) => c.id === active), { duration: 450 });
  }, [active, accent]);
  const ringStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      accent.value,
      [0, 1, 2],
      [colors.cardPinkDeep, colors.blueDeep, colors.greenDeep],
    ),
  }));

  const toggle = (cat: CatId, opt: string) =>
    setSelected((s) => ({
      ...s,
      [cat]: s[cat].includes(opt) ? s[cat].filter((o) => o !== opt) : [...s[cat], opt],
    }));

  const others = CATS.filter((c) => c.id !== active);
  const collapsedBase = ACCORDION_H - CATS.length * (HEADER_H + 8) - 24;

  return (
    <View style={styles.container}>
      {CATS.map((cat, idx) => {
        const isActive = cat.id === active;
        let top: number, height: number, rotate: number, inset: number, z: number;
        if (active === null) {
          top = collapsedBase + idx * (HEADER_H + 8);
          height = HEADER_H;
          rotate = [-1.6, 1.4, 0][idx];
          inset = [10, 4, 0][idx];
          z = idx + 1;
        } else if (isActive) {
          top = ACTIVE_TOP;
          height = EXPANDED_H;
          rotate = 0;
          inset = 0;
          z = 10;
        } else {
          const k = others.findIndex((c) => c.id === cat.id);
          top = k * PEEK;
          height = HEADER_H + 40;
          rotate = k === 0 ? -3 : 2;
          inset = k === 0 ? 14 : 7;
          z = k + 1;
        }
        return (
          <StackCard
            key={cat.id}
            cat={cat}
            top={top}
            height={height}
            rotate={rotate}
            inset={inset}
            zIndex={z}
            isActive={isActive}
            onPress={() => setActive(cat.id)}
          >
            {isActive && (
              <View style={styles.body}>
                {OPTIONS.map((o, i) => (
                  <OptionRow
                    key={o.id}
                    option={o}
                    index={i}
                    deep={cat.deep}
                    selected={selected[cat.id].includes(o.id)}
                    onToggle={() => toggle(cat.id, o.id)}
                  />
                ))}
              </View>
            )}
          </StackCard>
        );
      })}

      {active !== null && (
        <Animated.View entering={FadeIn.springify().damping(10)} exiting={FadeOut.duration(120)} style={styles.closeWrap}>
          <PressableScale onPress={() => setActive(null)}>
            <Animated.View style={[styles.close, ringStyle]}>
              <Feather name="x" size={20} color={colors.ink} />
            </Animated.View>
          </PressableScale>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: ACCORDION_H },
  card: {
    position: 'absolute',
    borderRadius: 30,
    overflow: 'hidden',
    paddingHorizontal: 12,
  },
  header: {
    height: HEADER_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  title: { fontFamily: fonts.medium, fontSize: 18, color: colors.ink },
  dots: { flexDirection: 'row', gap: 4, marginLeft: 10 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.ink },
  body: { gap: GAP },
  option: {
    height: ITEM_H,
    borderRadius: ITEM_H / 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 14,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  closeWrap: { position: 'absolute', bottom: 0, alignSelf: 'center', zIndex: 50 },
  close: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.white,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
