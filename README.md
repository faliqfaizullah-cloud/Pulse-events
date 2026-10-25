# Pulse Events

A React Native (Expo SDK 53, TypeScript) recreation of the event discovery / management app from the reference video: three pastel screens, a floating black pill nav bar, and spring-driven micro-interactions (Reanimated 3 + Gesture Handler + SVG).

## Run

```bash
npm install
npx expo install --check   # optional: lets Expo pin any patch-level drift
npm run typecheck
npx expo start             # press "a" for Android, scan the QR with Expo Go, etc.
```

## Build an APK

**Option A – EAS (cloud, easiest)**
```bash
npm i -g eas-cli
eas login
eas build -p android --profile preview     # produces an installable .apk
```

**Option B – local Gradle (needs JDK 17 + Android SDK)**
```bash
npm run apk
# → android/app/build/outputs/apk/release/app-release.apk
```

**Option C – GitHub Actions**: push to GitHub, then run *Actions → Build Android APK → Run workflow* (or push a `v*` tag). The APK is uploaded as a build artifact. The release APK is signed with the debug keystore that Expo prebuild generates; add your own keystore before publishing to the Play Store.

## Structure

```
App.tsx                         font loading, screen state, animated background, toast
src/theme.ts                    colours / fonts / spring presets (edit to re-theme)
src/components/
  FloatingBottomBar.tsx         black pill nav (+ centre "+" capsule on Event details)
  CategoryAccordion.tsx         Friends / Work / Special stacked cards with spring physics
  EventStickerCard.tsx          floating sticker: idle bob, parallax tilt, tap pop
  AudienceChart.tsx             curve, hatched window, draggable handles, live window %
  PressableScale.tsx            scale(0.96) press feedback used everywhere
  Wavy.tsx, Toast.tsx
src/screens/                    HomeScreen, ActivitiesScreen, DetailsScreen
src/utils/                      shapes.ts (starburst/blob paths), curve.ts (spline maths)
```

## Interactions

- **Home** – tap a peeking card to spring it to the front; its options stagger in while the others fold behind. Tap options to toggle ✓. ✕ collapses the stack. "Create event" jumps to Event details.
- **Activities** – drag anywhere to tilt the stickers (parallax at different depths); they spring back on release. Tap a sticker to pop it. "Start →" opens Event details.
- **Event details** – tap Date / Time to cycle values, ›, bookmark to save. Pick a weekday and the curve morphs. Drag either handle to resize the hatched window (the white chip shows its live average); "Filter Nh" cycles the window width. The big % is the day's peak.
- Background colour glides yellow → cream → pink between screens.
