import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import FloatingBottomBar from './src/components/FloatingBottomBar';
import Toast from './src/components/Toast';
import HomeScreen from './src/screens/HomeScreen';
import ActivitiesScreen from './src/screens/ActivitiesScreen';
import DetailsScreen from './src/screens/DetailsScreen';
import { colors } from './src/theme';
import type { TabId } from './src/types';

type Screen = Exclude<TabId, 'profile'>;
const ORDER: Screen[] = ['home', 'activities', 'details'];

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  const [screen, setScreen] = useState<Screen>('home');
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Background colour glides yellow → cream → pink as you move between screens.
  const idx = useSharedValue(0);
  const bg = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(idx.value, [0, 1, 2], [colors.yellow, colors.cream, colors.pink]),
  }));

  const notify = useCallback((msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 1800);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const go = useCallback(
    (tab: TabId) => {
      if (tab === 'profile') {
        notify('Profile coming soon');
        return;
      }
      setScreen(tab);
      idx.value = withTiming(ORDER.indexOf(tab), { duration: 500 });
    },
    [idx, notify],
  );

  if (!fontsLoaded) return <View style={[styles.fill, { backgroundColor: colors.yellow }]} />;

  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <Animated.View style={[styles.fill, bg]}>
          <StatusBar style="dark" />

          <Animated.View
            key={screen}
            entering={FadeIn.duration(320)}
            exiting={FadeOut.duration(160)}
            style={StyleSheet.absoluteFill}
          >
            {screen === 'home' && (
              <HomeScreen onBack={() => go('activities')} onCreate={() => go('details')} notify={notify} />
            )}
            {screen === 'activities' && <ActivitiesScreen onStart={() => go('details')} notify={notify} />}
            {screen === 'details' && <DetailsScreen onBack={() => go('home')} notify={notify} />}
          </Animated.View>

          <FloatingBottomBar
            active={screen}
            onChange={go}
            showPlus={screen === 'details'}
            onPlus={() => notify('Event added to your plans ✓')}
          />
          <Toast message={toast} />
        </Animated.View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
