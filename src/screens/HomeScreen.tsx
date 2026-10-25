import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PressableScale from '../components/PressableScale';
import CategoryAccordion from '../components/CategoryAccordion';
import { BAR_HEIGHT, barBottom } from '../components/FloatingBottomBar';
import { colors, fonts } from '../theme';
import type { IconName } from '../types';

type Props = {
  onBack: () => void;
  onCreate: () => void;
  notify: (msg: string) => void;
};

function CircleButton({ icon, dot, onPress, tint }: { icon: IconName; dot?: boolean; onPress: () => void; tint?: string }) {
  return (
    <PressableScale onPress={onPress} style={[styles.circle, tint ? { backgroundColor: tint } : null]}>
      <Feather name={icon} size={20} color={colors.ink} />
      {dot && <View style={styles.redDot} />}
    </PressableScale>
  );
}

function Smiley() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Circle cx="10" cy="10" r="9" fill="none" stroke={colors.ink} strokeWidth="1.6" />
      <Circle cx="7" cy="8" r="1.1" fill={colors.ink} />
      <Circle cx="13" cy="8" r="1.1" fill={colors.ink} />
      <Path d="M5.8 11.8 Q10 16.4 14.2 11.8" stroke={colors.ink} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export default function HomeScreen({ onBack, onCreate, notify }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      {/* top bar */}
      <View style={styles.topBar}>
        <CircleButton icon="chevron-left" onPress={onBack} />
        <PressableScale style={styles.homeTitle} onPress={() => notify('Home')}>
          <Text style={styles.homeText}>Home</Text>
          <Feather name="chevron-down" size={16} color={colors.ink} />
        </PressableScale>
        <View style={styles.topRight}>
          <CircleButton icon="search" onPress={() => notify('Search coming soon')} />
          <CircleButton icon="bell" dot onPress={() => notify("You're all caught up")} />
        </View>
      </View>

      {/* headline */}
      <Animated.View entering={FadeInDown.delay(60).springify().damping(13)} style={styles.headWrap}>
        <Text style={styles.title}>{'Discover.\nCreate. Enjoy.'}</Text>
        <View style={styles.subRow}>
          <Text style={styles.sub}>Work hard, play hard</Text>
          <Smiley />
        </View>
      </Animated.View>

      {/* chips */}
      <Animated.View entering={FadeInDown.delay(140).springify().damping(13)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <CircleButton icon="star" tint={colors.starYellow} onPress={() => notify('Saved to favourites')} />
          <CircleButton icon="file-text" onPress={() => notify('Opening your event notes')} />
          <CircleButton icon="settings" dot onPress={() => notify('Settings coming soon')} />
          <PressableScale style={styles.commentsPill} onPress={() => notify('No new comments')}>
            <Feather name="message-circle" size={18} color={colors.white} />
            <Text style={styles.commentsText}>Comments</Text>
          </PressableScale>
          <PressableScale style={styles.createPill} onPress={onCreate}>
            <Feather name="plus" size={18} color={colors.ink} />
            <Text style={styles.createText}>Create event</Text>
          </PressableScale>
        </ScrollView>
      </Animated.View>

      {/* stacked category cards */}
      <View style={[styles.stack, { bottom: barBottom(insets.bottom) + BAR_HEIGHT + 4 }]}>
        <CategoryAccordion />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  circle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.magenta,
  },
  homeTitle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  homeText: { fontFamily: fonts.regular, fontSize: 16, color: colors.ink },
  topRight: { flexDirection: 'row', gap: 8 },
  headWrap: { paddingHorizontal: 20, marginTop: 26 },
  title: { fontFamily: fonts.medium, fontSize: 38, lineHeight: 42, color: colors.ink, letterSpacing: -0.5 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  sub: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  chips: { paddingHorizontal: 20, paddingTop: 22, gap: 10, alignItems: 'center' },
  commentsPill: {
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 18,
    backgroundColor: colors.black,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentsText: { color: colors.white, fontFamily: fonts.medium, fontSize: 15 },
  createPill: {
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createText: { color: colors.ink, fontFamily: fonts.medium, fontSize: 15 },
  stack: { position: 'absolute', left: 16, right: 16 },
});
