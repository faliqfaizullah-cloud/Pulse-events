import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeOutUp, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';

export default function Toast({ message }: { message: string | null }) {
  const insets = useSafeAreaInsets();
  if (!message) return null;
  return (
    <Animated.View
      key={message}
      entering={FadeInUp.springify().damping(14)}
      exiting={FadeOutUp.duration(180)}
      pointerEvents="none"
      style={[styles.wrap, { top: insets.top + 10 }]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 100,
    backgroundColor: colors.black,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  text: { color: colors.white, fontFamily: fonts.medium, fontSize: 14 },
});
