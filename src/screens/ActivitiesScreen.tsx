import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EventStickerCard from '../components/EventStickerCard';
import PressableScale from '../components/PressableScale';
import Wavy from '../components/Wavy';
import { BAR_HEIGHT, barBottom } from '../components/FloatingBottomBar';
import { colors, fonts } from '../theme';

type Props = { onStart: () => void; notify: (msg: string) => void };

const clamp = (v: number, lo: number, hi: number) => {
  'worklet';
  return Math.min(Math.max(v, lo), hi);
};

export default function ActivitiesScreen({ onStart, notify }: Props) {
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();

  // Pan anywhere → stickers tilt/shift at different depths (parallax), then spring home.
  const px = useSharedValue(0);
  const py = useSharedValue(0);
  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .activeOffsetY([-8, 8])
    .onUpdate((e) => {
      px.value = clamp(e.translationX / 6, -26, 26);
      py.value = clamp(e.translationY / 6, -26, 26);
    })
    .onEnd(() => {
      px.value = withSpring(0, { damping: 8, stiffness: 120 });
      py.value = withSpring(0, { damping: 8, stiffness: 120 });
    });

  const sq = W * 0.52;
  const circ = W * 0.62;
  const burst = W * 0.34;

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.root}>
        {/* green blob, top centre */}
        <View style={[styles.blob, { left: W * 0.14, top: -W * 0.3 }]} pointerEvents="none">
          <Wavy size={W * 0.62} color={colors.blob} kind="blob" />
        </View>

        {/* status pill, top left */}
        <View style={[styles.statusPill, { top: insets.top + 10 }]}>
          <View style={styles.greenDot} />
        </View>

        {/* headline */}
        <Animated.View
          entering={FadeInDown.delay(80).springify().damping(13)}
          style={[styles.head, { top: insets.top + 74 }]}
        >
          <Text style={styles.h1}>Activities</Text>
          <Text style={styles.h2}>just for your taste</Text>
        </Animated.View>

        {/* stickers */}
        <EventStickerCard
          shape="circle"
          color={colors.sticker.blue}
          size={circ}
          title="Charity event"
          date="10/05/24"
          rotate={0}
          textRotate={36}
          titleSize={22}
          depth={0.7}
          left={-W * 0.04}
          top={W * 1.22}
          phase={2}
          px={px}
          py={py}
          onPress={() => notify('Charity event · 10/05/24')}
        />
        <EventStickerCard
          shape="square"
          color={colors.sticker.yellow}
          size={sq}
          title="Opera"
          date="23/04/24"
          rotate={9}
          textRotate={-6}
          titleSize={21}
          depth={1.4}
          left={W * 0.43}
          top={W * 0.62}
          phase={1}
          px={px}
          py={py}
          onPress={() => notify('Opera · 23/04/24')}
        />
        <EventStickerCard
          shape="starburst"
          color={colors.sticker.pink}
          size={burst}
          title="Festival"
          date="30/05/24"
          rotate={0}
          textRotate={-52}
          titleSize={18}
          depth={1.1}
          left={W * 0.0}
          top={W * 0.86}
          phase={0}
          px={px}
          py={py}
          onPress={() => notify('Festival · 30/05/24')}
        />

        {/* prompt + CTA */}
        <View style={[styles.cta, { bottom: barBottom(insets.bottom) + BAR_HEIGHT + 18 }]}>
          <Text style={styles.prompt}>{'Have you\npicked\nyour next\nevent?'}</Text>
          <PressableScale style={styles.startBtn} onPress={onStart}>
            <Text style={styles.startText}>Start</Text>
            <Feather name="arrow-right" size={16} color={colors.white} />
          </PressableScale>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  blob: { position: 'absolute' },
  statusPill: {
    position: 'absolute',
    left: 22,
    width: 58,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.black,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 8,
  },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ADE80' },
  head: { position: 'absolute', left: 24, right: 24 },
  h1: { fontFamily: fonts.extra, fontSize: 42, lineHeight: 46, color: colors.ink, letterSpacing: -0.8 },
  h2: {
    fontFamily: fonts.light,
    fontSize: 42,
    lineHeight: 46,
    color: colors.ink,
    letterSpacing: -0.8,
    width: 280,
    transform: [{ skewX: '-10deg' }],
  },
  cta: { position: 'absolute', right: 22, alignItems: 'flex-start', gap: 14 },
  prompt: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 17, color: colors.ink },
  startBtn: {
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 22,
    backgroundColor: colors.black,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startText: { color: colors.white, fontFamily: fonts.medium, fontSize: 15 },
});
