# CrewUp App Icon & Splash Asset Guide

Source: the traced "Cu" logo mark (from the CrewUp logo kit) + the color tokens in `design-system.md`. Every asset below is generated from the same vector glyph, so they stay pixel-consistent with each other — no separate re-drawing per platform.

**Color choices used throughout this package** (and why): app icons use `ink` background (`#0E1113`) + `lime` mark (`#A8E05F`) — the same square badge treatment already established in the logo kit. Splash screens follow the design system's own contrast rule: light mode content on `ground` uses `ink` (not lime — lime fails as content color on light backgrounds per the design system's contrast table), dark mode content on `ground` uses `accent` lime (which is approved for both fill and content on dark surfaces).

---

## Folder map

```
svg/                          Editable vector sources — re-export from these if you need a size not included below
ios/                          iOS app icon PNGs
android/                      Android launcher icons, adaptive icon layers, Play Store icon
splash/                       Splash/launch screen assets, shared across both platforms
```

---

## `svg/` — vector sources

| File | What it is |
|---|---|
| `app-icon-square-flat.svg` | The master app icon artwork: full-bleed square, ink background, lime mark, no rounded corners baked in (the OS applies its own mask shape). Re-export this at any size you need beyond what's provided. |
| `adaptive-icon-background.svg` | Flat ink square, 108×108 unit canvas — the Android adaptive icon background layer. |
| `adaptive-icon-foreground.svg` | Lime mark on transparent, sized to sit inside Android's adaptive icon "safe zone" — the Android adaptive icon foreground layer. |
| `splash-mark-ink.svg` | The mark alone, ink-colored, transparent background — for light-mode splash screens. |
| `splash-mark-lime.svg` | The mark alone, lime-colored, transparent background — for dark-mode splash screens. |

---

## `ios/` — App icons

| File | Size (px) | Use |
|---|---|---|
| `AppIcon-1024.png` | 1024×1024 | **App Store listing icon — required.** Since Xcode 14, this is the *only* size Xcode's asset catalog needs in "single size" mode; it generates every on-device size automatically. |
| `AppIcon-180.png` | 180×180 | iPhone home screen @3x |
| `AppIcon-120.png` | 120×120 | iPhone home screen @2x |
| `AppIcon-167.png` | 167×167 | iPad Pro home screen @2x |
| `AppIcon-152.png` | 152×152 | iPad home screen @2x |
| `AppIcon-87.png` | 87×87 | Settings @3x |
| `AppIcon-80.png` | 80×80 | Spotlight @2x |
| `AppIcon-76.png` | 76×76 | iPad home screen @1x |
| `AppIcon-60.png` | 60×60 | iPhone notification @3x base |
| `AppIcon-58.png` | 58×58 | Settings @2x |
| `AppIcon-40.png` | 40×40 | Spotlight @1x / notification @2x |
| `AppIcon-29.png` | 29×29 | Settings @1x |
| `AppIcon-20.png` | 20×20 | Notification @1x |
| `AppIcon-1024-tinted-source.png` | 1024×1024 | Ink mark on **transparent** background — a monochrome source for iOS 18's Dark/Tinted app icon appearance modes. Wire this up in Xcode's icon composer; it's not a drop-in replacement for `AppIcon-1024.png`. |

**All standard sizes are provided but only `AppIcon-1024.png` is strictly required** for modern Xcode projects. Keep the rest if you're on an older Xcode version, or a build tool (Capacitor, Cordova, Fastlane) that expects the full explicit set.

No file here has transparency — Apple rejects a transparent App Store icon, and all corner-rounding is applied by iOS itself, not baked into the image.

---

## `android/` — Launcher icons

| File | Size (px) | Use |
|---|---|---|
| `playstore-icon-512.png` | 512×512 | **Play Console listing icon — required.** Opaque, no alpha, no baked corners (Google masks it). |
| `mipmap-mdpi/ic_launcher.png` | 48×48 | Legacy square launcher icon, mdpi |
| `mipmap-hdpi/ic_launcher.png` | 72×72 | Legacy square launcher icon, hdpi |
| `mipmap-xhdpi/ic_launcher.png` | 96×96 | Legacy square launcher icon, xhdpi |
| `mipmap-xxhdpi/ic_launcher.png` | 144×144 | Legacy square launcher icon, xxhdpi |
| `mipmap-xxxhdpi/ic_launcher.png` | 192×192 | Legacy square launcher icon, xxxhdpi |
| `mipmap-*/ic_launcher_round.png` | matching each density above | Circular-masked variant, for launchers that request a round icon on API < 26 |
| `adaptive-icon/ic_launcher_background.png` | 432×432 | Adaptive icon **background** layer (API 26+) — flat ink fill |
| `adaptive-icon/ic_launcher_foreground.png` | 432×432 | Adaptive icon **foreground** layer (API 26+) — lime mark, transparent background, sized inside Android's safe zone so it survives circle, squircle, or rounded-square masking on different OEM launchers |

Drop the `mipmap-*` folders straight into `android/app/src/main/res/` (they're already named and organized the way Android Studio expects). For the adaptive icon, reference the two layers from a `mipmap-anydpi-v26/ic_launcher.xml` in your project — that XML file isn't included here since it's project-specific wiring, not artwork.

---

## `splash/` — Launch screens

| File | Size (px) | Use |
|---|---|---|
| `splash-icon-ink.png` | 1200×~815 (transparent) | The mark alone, ink-colored. Feed this into a splash-screen library (`react-native-bootsplash`, `expo-splash-screen`) as the icon asset, paired with `#F7F8F4` as the configured background color, for **light mode**. |
| `splash-icon-lime.png` | 1200×~815 (transparent) | Same, lime-colored, paired with `#0E1113` as the background color, for **dark mode**. |
| `splash-light.png` | 1284×2778 | Fully composited fallback splash screen (ground `#F7F8F4` + ink mark), for setups without a splash library (e.g. a static launch image / launch storyboard image). |
| `splash-dark.png` | 1284×2778 | Same, dark mode (ground `#0E1113` + lime mark). |

**Why only one baked resolution per mode:** a splash screen here is just the mark centered on a flat color — there's no detail lost by scaling, so one large master per mode covers every device if your build pipeline scales it, and most modern splash APIs (Android 12+ Splash Screen API, iOS launch storyboards, Expo/bootsplash) composite the icon + color live rather than reading a pre-baked full-screen image. Use `splash-icon-*` + your platform's background-color config as the primary path; treat `splash-light.png` / `splash-dark.png` as a fallback for older/manual setups only.

---

## Open items (not covered by this package)

- **Xcode `Contents.json`** for the AppIcon asset catalog isn't generated here — add the PNGs to Xcode's asset catalog UI directly, or write the manifest to match your project's existing catalog structure.
- **`mipmap-anydpi-v26/ic_launcher.xml`** (the adaptive icon wiring file) is project-specific and not included.
- **Android 12+ Splash Screen API** theming (`windowSplashScreenBackground`, `windowSplashScreenAnimatedIcon`) needs to be set in `styles.xml` — the artwork here is enough for it, but the wiring is one of the "component-level mapping" open items already flagged in the design system's own Open Items section.
- **Notification/status-bar icon** (Android requires a separate flat-white silhouette for these, distinct from the launcher icon) isn't included — flag if needed.
