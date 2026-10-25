import React, { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler'; // cooperates with the chart's drag handles
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AudienceChart from '../components/AudienceChart';
import PressableScale from '../components/PressableScale';
import Wavy from '../components/Wavy';
import { BAR_HEIGHT, barBottom } from '../components/FloatingBottomBar';
import { colors, fonts } from '../theme';
import type { IconName } from '../types';

type Props = { onBack: () => void; notify: (msg: string) => void };

const HOURS = [15, 16, 17, 18, 19, 20];
const DAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
// Audience volume (%) per hour slot for each weekday.
const DATA: Record<string, number[]> = {
  MO: [30, 45, 52, 40, 35, 28],
  TU: [22, 30, 48, 58, 44, 38],
  WE: [35, 28, 40, 50, 62, 55],
  TH: [48, 52, 36, 30, 45, 60],
  FR: [25, 40, 66, 70, 52, 34],
  SA: [40, 58, 64, 52, 66, 72],
  SU: [56, 34, 43, 69, 72, 58],
};
const DATES = [
  { day: 7, suffix: 'th', month: 'April' },
  { day: 12, suffix: 'th', month: 'April' },
  { day: 19, suffix: 'th', month: 'April' },
  { day: 23, suffix: 'rd', month: 'April' },
];
const TIMES = [
  { t: '6:00', ap: 'PM' },
  { t: '7:30', ap: 'PM' },
  { t: '9:00', ap: 'PM' },
  { t: '12:00', ap: 'PM' },
];

function HeaderCircle({ icon, onPress, active }: { icon: IconName; onPress: () => void; active?: boolean }) {
  return (
    <PressableScale onPress={onPress} style={styles.circle}>
      <Feather name={icon} size={19} color={active ? colors.magenta : colors.ink} />
    </PressableScale>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <View style={styles.badge}>
      <View style={StyleSheet.absoluteFill}>
        <Wavy size={54} color={color} points={9} amp={0.1} />
      </View>
      {children}
    </View>
  );
}

function DayPill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const pop = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <Animated.View style={style}>
      <PressableScale
        scaleTo={0.9}
        onPress={() => {
          pop.value = withSequence(withSpring(1.12, { damping: 6, stiffness: 400 }), withSpring(1, { damping: 8 }));
          onPress();
        }}
        style={[styles.day, selected && { backgroundColor: colors.black }]}
      >
        <Text style={[styles.dayText, selected && { color: colors.white }]}>{label}</Text>
      </PressableScale>
    </Animated.View>
  );
}

export default function DetailsScreen({ onBack, notify }: Props) {
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const chartW = W - 40;

  const [saved, setSaved] = useState(false);
  const [dateIdx, setDateIdx] = useState(0);
  const [timeIdx, setTimeIdx] = useState(0);
  const [day, setDay] = useState('SU');
  const [range, setRange] = useState({ start: 1, end: 2 }); // 16:00 → 17:00

  const values = DATA[day];
  const date = DATES[dateIdx];
  const time = TIMES[timeIdx];
  const hoursSel = range.end - range.start;

  // "Filter 1h" cycles the width of the analysed window: 1h → 2h → 3h → 1h.
  const cycleFilter = () => {
    const len = (hoursSel % 3) + 1;
    const end = Math.min(HOURS.length - 1, range.start + len);
    const start = Math.max(0, end - len);
    setRange({ start, end });
  };

  const bottomPad = barBottom(insets.bottom) + BAR_HEIGHT + 24;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      {/* header */}
      <View style={styles.header}>
        <HeaderCircle icon="chevron-left" onPress={onBack} />
        <Text style={styles.headerTitle}>Event details</Text>
        <View style={styles.headerRight}>
          <HeaderCircle
            icon="bookmark"
            active={saved}
            onPress={() => {
              setSaved((s) => !s);
              notify(saved ? 'Removed from saved' : 'Event saved');
            }}
          />
          <HeaderCircle icon="search" onPress={() => notify('Search coming soon')} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        bounces
      >
        {/* date & time */}
        <Animated.View entering={FadeInDown.delay(60).springify().damping(13)} style={styles.dtRow}>
          <PressableScale style={styles.dtCol} onPress={() => setDateIdx((i) => (i + 1) % DATES.length)}>
            <Text style={styles.dtLabel}>Date</Text>
            <View style={styles.dtBody}>
              <Badge color={colors.magenta}>
                <Feather name="calendar" size={20} color={colors.white} />
              </Badge>
              <View>
                <Text style={styles.dtValue}>
                  {date.day}
                  <Text style={styles.sup}>{date.suffix}</Text>
                </Text>
                <Text style={styles.dtValue}>{date.month}</Text>
              </View>
            </View>
          </PressableScale>

          <PressableScale style={styles.dtCol} onPress={() => setTimeIdx((i) => (i + 1) % TIMES.length)}>
            <Text style={styles.dtLabel}>Time</Text>
            <View style={styles.dtBody}>
              <Badge color={colors.starYellow}>
                <Feather name="clock" size={20} color={colors.ink} />
              </Badge>
              <View>
                <Text style={styles.dtValue}>{time.t}</Text>
                <Text style={styles.dtValue}>{time.ap}</Text>
              </View>
            </View>
          </PressableScale>

          <PressableScale
            style={styles.next}
            onPress={() => {
              setDateIdx((i) => (i + 1) % DATES.length);
              setTimeIdx((i) => (i + 1) % TIMES.length);
            }}
          >
            <Feather name="chevron-right" size={20} color={colors.ink} />
          </PressableScale>
        </Animated.View>

        {/* audience flow */}
        <Animated.View entering={FadeInDown.delay(140).springify().damping(13)} style={styles.flow}>
          <View style={styles.flowHead}>
            <Text style={styles.flowTitle}>Audience Flow</Text>
            <PressableScale style={styles.filter} onPress={cycleFilter}>
              <Text style={styles.filterText}>Filter {hoursSel}h</Text>
              <Feather name="chevron-down" size={14} color={colors.white} />
            </PressableScale>
          </View>

          <View style={styles.days}>
            {DAYS.map((d) => (
              <DayPill key={d} label={d} selected={d === day} onPress={() => setDay(d)} />
            ))}
          </View>

          <View style={{ marginTop: 14 }}>
            <AudienceChart
              values={values}
              hours={HOURS}
              width={chartW}
              start={range.start}
              end={range.end}
              onCommit={(start, end) => setRange({ start, end })}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: { fontFamily: fonts.regular, fontSize: 16, color: colors.ink },
  headerRight: { flexDirection: 'row', gap: 8 },
  circle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dtRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 26,
  },
  dtCol: { marginRight: 22 },
  dtLabel: { fontFamily: fonts.medium, fontSize: 26, color: colors.ink, marginBottom: 12 },
  dtBody: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  dtValue: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 17, color: colors.ink },
  sup: { fontSize: 9, lineHeight: 10 },
  next: {
    marginLeft: 'auto',
    width: 44,
    height: 78,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flow: { paddingHorizontal: 20, marginTop: 34 },
  flowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flowTitle: { fontFamily: fonts.medium, fontSize: 26, color: colors.ink },
  filter: {
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    backgroundColor: colors.black,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterText: { fontFamily: fonts.medium, fontSize: 13, color: colors.white },
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  day: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontFamily: fonts.medium, fontSize: 12, color: colors.ink },
});
