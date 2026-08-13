# 🌿 لُعبَة الجُذُور - Arabic Roots Game

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react)
![Expo](https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)
![Tests](https://img.shields.io/badge/Tests-Jest-C21325?style=for-the-badge&logo=jest)
![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey?style=for-the-badge)

**An educational Arabic language game focused on trilateral root recognition and vocabulary mastery**

[Features](#-features) • [Installation](#-installation) • [Gameplay](#-gameplay) • [Testing](#-testing) • [OTA Updates](#-ota-updates) • [Tech Stack](#-tech-stack)

</div>

---

## 📖 About

**لعبة الجذور** (Arabic Roots Game) is an interactive mobile application designed to help users learn and master Arabic trilateral roots (جذور ثلاثية). The game challenges players to identify valid Arabic roots from letter permutations while learning their meanings, poetry examples, and usage.

The app includes two game modes:
- **🌱 لعبة الجذور** - Identify valid Arabic roots from 3-letter combinations
- **🔺 مثلث قطرب** - Match words with their meanings based on vowel marks (tashkeel)

---

## ✨ Features

### 🎮 Game Modes

#### لعبة الجذور (Roots Game)
- Identify valid trilateral Arabic roots from 6 permutation options
- Learn root meanings with detailed explanations
- Discover poetry examples (أمثلة شعرية) for each root
- Mixed difficulty levels with per-level progression (easy → medium → hard)
- No repeated questions within a session
- Instant feedback with أحسنت (well done) popups and unlockable root cards

#### مثلث قطرب (Qutrab's Triangle)
- Match words with meanings based on vowel marks
- Learn how فتحة، ضمة، كسرة change word meanings
- Educational content about Arabic morphology

### 📚 Rich Content
- **~3,850 roots** from القطوف.json comprehensive database (plus ~1,800 more across the أ-ذ and ز-ع volumes)
- **58 educational facts** from أحسنت.json shown in success popups
- Unlockable knowledge cards for every root you discover
- Poetry examples and detailed linguistic explanations
- Reward videos that unlock into a rewatchable archive

### 🏆 Progress & Rewards
- Points banked per round, plus streak tracking (no double counting)
- Per-game high scores and a global total score
- Persistent progress with SQLite (localStorage fallback on web)
- Session save/resume for both game modes

### 🎨 Design
- Beautiful Arabic-inspired parchment UI
- RTL (Right-to-Left) optimized layout
- Live responsive layout (adapts to rotation, foldables, and browser resize)
- Smooth animations and transitions

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- npm
- iOS Simulator / Android Emulator / physical device with Expo Go

### Setup

```bash
# Clone the repository
git clone https://github.com/FediMechergui/Qutrob.git
cd Qutrob

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running the App

```bash
# Run on specific platform
npx expo start --android
npx expo start --ios
npx expo start --web
```

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android (production channel)
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

---

## 📡 OTA Updates

The app ships with [EAS Update](https://docs.expo.dev/eas-update/introduction/) (expo-updates). On every cold start it checks for a newer JS bundle on its channel, downloads it, and reloads — no store release needed for JS/data changes.

```bash
# Publish an over-the-air update to the production channel
eas update --channel production --message "Describe the change"

# Publish to the preview channel (internal builds)
eas update --channel preview --message "Describe the change"
```

Channels are wired in `eas.json` (development / preview / production); the runtime version follows the app version (`runtimeVersion.policy: appVersion`), so native changes require a new build while pure JS changes ship instantly.

---

## 🧪 Testing

Game logic (scoring, round generation, data integrity, shuffling) is covered by Jest:

```bash
npm test          # run the suite
npm run test:watch
npm run typecheck # TypeScript check
```

---

## 🎮 Gameplay

### لعبة الجذور (Roots Game)

1. **View Letters**: Three Arabic letters are displayed
2. **Select Roots**: Choose which 3-letter combinations are valid Arabic roots
3. **Check Answers**: Tap "تحقق" to verify your selections
4. **Learn**: See the أحسنت popup with root meaning and poetry, and unlock the root's card
5. **Progress**: Advance through rounds and levels; difficulty rises with level

### مثلث قطرب (Qutrab's Triangle)

1. **View Triangle**: See a base word with three vowel variations
2. **Match**: Connect each word form to its correct meaning
3. **Learn**: Understand how vowel marks change Arabic word meanings
4. **Feedback**: Get instant feedback on your matches

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **React Native 0.81** | Cross-platform mobile framework |
| **Expo SDK 54** | Development platform & tooling |
| **TypeScript** | Type-safe JavaScript |
| **expo-sqlite** | Local database (localStorage fallback on web) |
| **expo-video** | Reward video playback |
| **expo-updates** | Over-the-air JS updates (EAS Update) |
| **expo-linear-gradient** | UI gradients |
| **react-native-reanimated** | Smooth animations |
| **Jest (jest-expo)** | Unit tests for game logic and data |

---

## 📁 Project Structure

```
Qutrob/
├── App.tsx                 # App entry, navigation & OTA update check
├── src/
│   ├── screens/            # Welcome, Home, Game, Qutrab, VideoReward, VideoArchive
│   ├── components/         # LetterWheel, RootGrid, ClamAnimation, modals...
│   ├── services/
│   │   ├── arabicApi.ts    # Round generation from the roots databases
│   │   └── database.ts     # SQLite persistence (players, sessions, scores, cards, videos)
│   ├── data/
│   │   ├── arabicDatabase.ts  # Root dictionary built from the JSON volumes
│   │   ├── qutrabData.ts      # Qutrab triangles
│   │   └── videos.ts          # Reward video registry
│   ├── utils/
│   │   ├── scoring.ts      # Pure scoring logic (unit-tested)
│   │   ├── random.ts       # Fisher-Yates shuffle helpers
│   │   └── responsive.ts   # Static + live (hook-based) responsive helpers
│   └── constants/          # Theme
├── القطوف.json             # Main roots database (~3,850 entries)
├── أحسنت.json              # Educational facts (58 entries)
├── win.json                # Knowledge cards data
├── ابدذر.json              # Roots أ-ذ (~670 entries)
├── ز الى ع.json            # Roots ز-ع (~1,160 entries)
└── package.json
```

---

## 📊 Data Sources

| File | Content | Entries |
|------|---------|---------|
| `القطوف.json` | Arabic roots with meanings, difficulty, poetry | ~3,850 |
| `ابدذر.json` | Roots أ-ذ | ~670 |
| `ز الى ع.json` | Roots ز-ع | ~1,160 |
| `أحسنت.json` | Educational facts & motivational content | 58 |
| `win.json` | Knowledge cards (science, physics, tech) | 20 |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Fedi Mechergui**
- GitHub: [@FediMechergui](https://github.com/FediMechergui)

---

## 🙏 Acknowledgments

- Arabic linguistic data from classical Arabic dictionaries
- Poetry examples from classical Arabic literature
- Qutrab's Triangle concept from Arabic morphology studies

---

<div align="center">

**Made with ❤️ for Arabic language learners**

🌿 أصول الكلمات العربية 🌿

</div>
