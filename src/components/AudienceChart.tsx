import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  SharedValue,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, fonts } from '../theme';
import { PAD_X, PLOT_H, TOP, findPeak, smoothPath, windowAverage, yOf } from '../utils/curve';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

const LABEL_H = 34;
export const CHART_H = TOP + PLOT_H + LABEL_H;
const SNAP = { damping: 14, stiffness: 190 };

type Props = {
  values: number[];
  hours: number[];
  width: number;
  /** Selected window as slot indices (start < end). */
  start: number;
  end: number;
  onCommit: (start: number, end: number) => void;
};

function Dot({
  i,
  x,
  from,
  to,
  prog,
  last,
}: {
  i: number;
  x: number;
  from: SharedValue<number[]>;
  to: SharedValue<number[]>;
  prog: SharedValue<number>;
  last: boolean;
}) {
  const props = useAnimatedProps(() => {
    const a = from.value[i];
    const b = to.value[i];
    return { cy: yOf(a + (b - a) * prog.value) };
  });
  return (
    <AnimatedCircle
      cx={x}
      r={last ? 6 : 5}
      fill={last ? colors.magenta : colors.white}
      stroke={last ? 'rgba(255,255,255,0.85)' : 'rgba(184,48,127,0.35)'}
      strokeWidth={last ? 3 : 2}
      animatedProps={props as any}
    />
  );
}

/**
 * Audience-flow curve with hourly gridlines, hatched selection window and two draggable
 * handles. Values animate smoothly when the day changes.
 */
export default function AudienceChart({ values, hours, width, start, end, onCommit }: Props) {
  const N = values.length;
  const slotW = (width - PAD_X * 2) / (N - 1);
  const xs = useMemo(() => values.map((_, i) => PAD_X + i * slotW), [N, slotW]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- curve morph ------------------------------------------------------
  const from = useSharedValue<number[]>(values);
  const to = useSharedValue<number[]>(values);
  const prog = useSharedValue(1);
  const peak = useMemo(() => findPeak(values, xs), [values, xs]);
  const peakX = useSharedValue(peak.x);
  const peakY = useSharedValue(peak.y);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const cur = from.value.map((f, i) => f + (to.value[i] - f) * prog.value);
    from.value = cur;
    to.value = values;
    prog.value = 0;
    const cfg = { duration: 650, easing: Easing.out(Easing.cubic) };
    prog.value = withTiming(1, cfg);
    peakX.value = withTiming(peak.x, cfg);
    peakY.value = withTiming(peak.y, cfg);
  }, [values, peak, from, to, prog, peakX, peakY]);

  const lerped = () => {
    'worklet';
    const a = from.value;
    const b = to.value;
    const ys: number[] = [];
    for (let i = 0; i < a.length; i++) ys.push(yOf(a[i] + (b[i] - a[i]) * prog.value));
    return ys;
  };

  const mainProps = useAnimatedProps(() => ({ d: smoothPath(xs, lerped(), 0, N - 2) }));
  const tailProps = useAnimatedProps(() => ({ d: smoothPath(xs, lerped(), N - 2, N - 1) }));
  const peakDotProps = useAnimatedProps(() => ({ cx: peakX.value, cy: peakY.value }));
  const peakLineProps = useAnimatedProps(() => ({ x1: peakX.value, x2: peakX.value, y1: 46, y2: peakY.value }));
  const peakLabelStyle = useAnimatedStyle(() => ({ left: peakX.value - 40 }));

  // ---- selection window -------------------------------------------------
  const startX = useSharedValue(xs[start]);
  const endX = useSharedValue(xs[end]);
  const lastS = useSharedValue(start);
  const lastE = useSharedValue(end);
  const ctxS = useSharedValue(0);
  const ctxE = useSharedValue(0);
  const [live, setLive] = useState({ s: start, e: end });

  useEffect(() => {
    startX.value = withSpring(xs[start], SNAP);
    endX.value = withSpring(xs[end], SNAP);
    lastS.value = start;
    lastE.value = end;
    setLive({ s: start, e: end });
  }, [start, end, xs, startX, endX, lastS, lastE]);

  const hatchStyle = useAnimatedStyle(() => ({
    left: startX.value,
    width: Math.max(endX.value - startX.value, 0),
  }));
  const startHandleStyle = useAnimatedStyle(() => ({ left: startX.value - 13 }));
  const endHandleStyle = useAnimatedStyle(() => ({ left: endX.value - 13 }));
  const chipStyle = useAnimatedStyle(() => ({ left: (startX.value + endX.value) / 2 - 27 }));

  const startGesture = Gesture.Pan()
    .activeOffsetX([-4, 4])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      ctxS.value = startX.value;
    })
    .onUpdate((e) => {
      const nx = Math.min(Math.max(ctxS.value + e.translationX, xs[0]), endX.value - slotW);
      startX.value = nx;
      const idx = Math.round((nx - xs[0]) / slotW);
      if (idx !== lastS.value) {
        lastS.value = idx;
        runOnJS(setLive)({ s: idx, e: lastE.value });
      }
    })
    .onEnd(() => {
      startX.value = withSpring(xs[lastS.value], SNAP);
      runOnJS(onCommit)(lastS.value, lastE.value);
    });

  const endGesture = Gesture.Pan()
    .activeOffsetX([-4, 4])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      ctxE.value = endX.value;
    })
    .onUpdate((e) => {
      const nx = Math.max(Math.min(ctxE.value + e.translationX, xs[N - 1]), startX.value + slotW);
      endX.value = nx;
      const idx = Math.round((nx - xs[0]) / slotW);
      if (idx !== lastE.value) {
        lastE.value = idx;
        runOnJS(setLive)({ s: lastS.value, e: idx });
      }
    })
    .onEnd(() => {
      endX.value = withSpring(xs[lastE.value], SNAP);
      runOnJS(onCommit)(lastS.value, lastE.value);
    });

  const avg = useMemo(() => windowAverage(values, live.s, live.e), [values, live]);

  return (
    <View style={{ width, height: CHART_H }}>
      {/* hourly gridlines */}
      <Svg width={width} height={CHART_H} style={StyleSheet.absoluteFill}>
        {xs.map((x, i) => (
          <Line key={i} x1={x} x2={x} y1={TOP} y2={TOP + PLOT_H} stroke={colors.ink} strokeWidth={1} />
        ))}
      </Svg>

      {/* hatched selection window */}
      <Animated.View style={[styles.hatch, hatchStyle]} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="hatch" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
              <Line x1="0" y1="0" x2="0" y2="7" stroke={colors.magenta} strokeWidth="3.2" />
            </Pattern>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#hatch)" />
        </Svg>
      </Animated.View>

      {/* curve, dots, peak marker */}
      <Svg width={width} height={CHART_H} style={StyleSheet.absoluteFill} pointerEvents="none">
        <AnimatedLine animatedProps={peakLineProps as any} stroke={colors.ink} strokeWidth={1.5} strokeDasharray="3 3" />
        <AnimatedPath animatedProps={mainProps as any} stroke={colors.white} strokeWidth={2} fill="none" />
        <AnimatedPath
          animatedProps={tailProps as any}
          stroke={colors.magenta}
          strokeWidth={2}
          strokeDasharray="5 5"
          fill="none"
        />
        {xs.map((x, i) => (
          <Dot key={i} i={i} x={x} from={from} to={to} prog={prog} last={i === N - 1} />
        ))}
        <AnimatedCircle animatedProps={peakDotProps as any} r={6} fill={colors.black} stroke={colors.white} strokeWidth={2} />
      </Svg>

      {/* peak badge */}
      <Animated.View style={[styles.peak, peakLabelStyle]} pointerEvents="none">
        <Text style={styles.peakNum}>
          {Math.round(peak.value)}
          <Text style={styles.peakPct}>%</Text>
        </Text>
      </Animated.View>

      {/* live window average */}
      <Animated.View style={[styles.chip, chipStyle]} pointerEvents="none">
        <Text style={styles.chipText}>{avg}%</Text>
      </Animated.View>

      {/* drag handles */}
      <GestureDetector gesture={startGesture}>
        <Animated.View style={[styles.handle, startHandleStyle]} hitSlop={10}>
          <View style={styles.grip} />
          <View style={styles.grip} />
        </Animated.View>
      </GestureDetector>
      <GestureDetector gesture={endGesture}>
        <Animated.View style={[styles.handle, endHandleStyle]} hitSlop={10}>
          <View style={styles.grip} />
          <View style={styles.grip} />
        </Animated.View>
      </GestureDetector>

      {/* hour labels */}
      {xs.map((x, i) => (
        <Text key={i} style={[styles.hour, { left: x - 24 }]}>
          {String(hours[i]).padStart(2, '0')}:00
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hatch: { position: 'absolute', top: TOP, height: PLOT_H },
  peak: { position: 'absolute', top: 0, width: 80, alignItems: 'center' },
  peakNum: { fontFamily: fonts.medium, fontSize: 30, color: colors.ink },
  peakPct: { fontFamily: fonts.regular, fontSize: 15 },
  chip: {
    position: 'absolute',
    top: TOP + 8,
    width: 54,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontFamily: fonts.semi, fontSize: 12, color: colors.magenta },
  handle: {
    position: 'absolute',
    top: TOP + PLOT_H / 2 - 13,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.magenta,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  grip: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.magenta },
  hour: {
    position: 'absolute',
    top: TOP + PLOT_H + 10,
    width: 48,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.ink,
  },
});
