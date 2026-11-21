# NuviX

An Android application for playing Xbox Cloud Gaming with an optimized, modern interface.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Expo](https://img.shields.io/badge/expo-58%2B-000000.svg)](https://expo.dev)

## ✨ What's New (v1.0.0)

### Complete Redesign
- **Modern Floating Menu**: Opens from bottom to top with smooth animation
- **Material 3 Expressive Design**: Modern and elegant interface
- **Native Web Rendering**: Optimized web view without heavy dependencies
- **Active Touch Controls**: Buttons and sticks with visual and haptic feedback
- **Redesigned Settings Panel**: Clean and intuitive interface

## 🎮 Features

### Floating Menu
- Central floating button that opens a menu with illustrative icons
- Menu slides up from bottom with spring animation
- Dark background with soft edges
- Visual indicator for active touch controls
- Smooth item entrance animation

### Touch Controls
- Xbox-inspired minimalist gamepad layout
- Face buttons (A, B, X, Y) with press feedback
- Shoulder buttons (LB, RB, LT, RT)
- System buttons (View ⧉, Menu ☰)
- Functional analog sticks with input mapping

### Settings Panel
- User-Agent mode: Mobile, Desktop, Smart TV, or Custom
- Interface zoom (90%, 100%, 110%, 125%)
- Behavior options (Wake Lock, Touch Controls)
- Microsoft account login integration

## 🌍 Supported Languages

The app supports **16 languages** with automatic detection:

| Language | Code |
|----------|------|
| English | 🇺🇸 |
| Portuguese (Brazil) | 🇧🇷 |
| Spanish | 🇪🇸 |
| German | 🇩🇪 |
| French | 🇫🇷 |
| Italian | 🇮🇹 |
| Dutch | 🇳🇱 |
| Polish | 🇵🇱 |
| Russian | 🇷🇺 |
| Ukrainian | 🇺🇦 |
| Japanese | 🇯🇵 |
| Korean | 🇰🇷 |
| Chinese (Simplified) | 🇨🇳 |
| Chinese (Traditional) | 🇹🇼 |
| Turkish | 🇹🇷 |
| Arabic | 🇸🇦 |

## 🚀 Getting Started

### Requirements

- Node.js 18+
- npm or yarn
- Android Studio (for Android) or Xcode (for iOS)
- Expo CLI: `npm install -g expo`

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/nuvi-x.git
cd nuvi-x

# Install dependencies
npm install

# Generate assets (icons)
npm run generate:icons

# Start development server
npm start
```

### Build for Android

```bash
# Using Expo Go (development)
npm run android

# Native build
npx expo prebuild
npx expo run:android
```

### Build for Web

```bash
npm run web
```

## ⚙️ Available Settings

| Setting | Options | Default |
|---------|---------|---------|
| User-Agent | Mobile, Desktop, Smart TV, Custom | Desktop |
| Zoom | 90%, 100%, 110%, 125% | 100% |
| Keep Awake | On/Off | On |
| Touch Controls | On/Off | Off |
| Language | Auto, PT, EN, ES, DE, FR, IT, NL, PL, RU, UK, ZH, JA, KO, TR, AR | Auto |

## 📦 Main Dependencies

- **Expo 58**: Main framework
- **React Native WebView**: Web rendering
- **Expo Video**: Video player for boot animation
- **Expo Haptics**: Haptic feedback
- **Expo Keep Awake**: Keep screen on
- **Async Storage**: Settings persistence

## 🔧 Project Structure

```
src/
├── boot/
│   └── BootAnimation.tsx      # Boot animation
├── ui/
│   ├── FloatingMenu.tsx       # Floating menu with animations
│   ├── SettingsPanel.tsx    # Settings panel
│   └── TouchControls.tsx    # Touch controls
├── web/
│   └── GameWebView.tsx      # Optimized native web view
├── hooks/
│   ├── useSpringAnimation.ts
│   ├── usePerformanceStats.ts
│   ├── useGameAnalysis.ts
│   └── useTheme.ts
├── utils/
│   └── bridge.ts           # JavaScript bridge for virtual gamepad
├── settings.ts              # Settings logic
├── theme.ts                # Material 3 Expressive theme
└── i18n.ts                 # Internationalization (16 languages)
```

## 🔒 Privacy

This is an unofficial application. It does not collect personal data or send usage information.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Legal Notice

This application is unofficial and not affiliated with Microsoft, Xbox, or Microsoft Gaming. Xbox Cloud Gaming requires a valid Xbox Game Pass Ultimate subscription.

## 🎨 Design Inspiration

NuviX (meaning "Cloud" in Portuguese/Latin) brings a fresh, modern experience to Xbox Cloud Gaming on Android with:

- **Cloud-inspired logo and branding**
- **Material 3 Expressive design language**
- **Clean, minimalist interface**
- **Smooth animations and transitions**
- **Intuitive touch controls**

---

**`NuviX`** - Cloud Gaming, Reimagined.