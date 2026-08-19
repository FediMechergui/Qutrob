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
- Identify valid trilateral Arabic roots from up to 6 permutation options
- Validity is judged against the **complete Lisān al-ʿArab root inventory** — a real root is never marked wrong
- Difficulty genuinely shapes the questions: easy levels draw from 🟢 roots, hard levels reach 🔴 and rarer Lisān-only vocabulary
- Progressive hints (count → first letter → meaning) priced per difficulty; first wheel spin per round is free, later spins cost points
- Learn root meanings with detailed explanations and poetry examples (أمثلة شعرية)
- No repeated questions within a session; instant أحسنت popups with real proverbs, «هل تعلم» facts and unlockable root cards

#### مثلث قطرب (Qutrab's Triangle)
- Match words with meanings based on the vowel of the first letter
- **30 vetted triangles**: 23 from Qutrub's original مثلث as versified by Ibn Zurayq (with the verse shown after each round) + 7 textbook classics
- Difficulty progresses with level (easy → medium → hard)

### 📚 Rich Content
- **6,700+ valid triliteral roots**: the full Lisān al-ʿArab inventory ([lisan345](https://github.com/git85hub/lisan345)) merged with the project's own annotated roots
- **~3,500 annotated roots** with meaning, hint, examples, difficulty and linguistic analysis; **1,900+** with poetry
- **58 educational facts** (`أحسنت.json`) shown as «هل تعلم»
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

Channels are wired in `eas.json` (development / preview / production). `runtimeVersion` in `app.json` is pinned explicitly and tracks **native** compatibility — bump it only when native modules or the SDK change (then rebuild); JS/data-only releases keep it and ship instantly to every installed build. `version` is the marketing version and can change freely.

---

## 🧪 Testing

Game logic (scoring, hints, round generation, data integrity, the data pipeline) is covered by Jest:

```bash
npm test          # run the suite
npm run test:watch
npm run typecheck # TypeScript check
```

## 🗂 Data pipeline

Raw sources live in `data/` (see [data/README.md](data/README.md)); the app bundles only the compact outputs in `src/data/generated/`. After editing any source:

```bash
npm run build:data
```

The script normalises roots (spaces, tashkeel, hamza forms, `هـ`), de-duplicates ~2,000 repeated rows, reconciles weak-root spellings with Lisān (بكي ↔ بكو), drops unreconcilable typos, and emits `roots.json`, `rootEntries.json`, `rootAliases.json` and `stats.json`. A test asserts the committed outputs match a fresh build.

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
│   │   ├── generated/         # Output of scripts/build-data.js (what the app bundles)
│   │   ├── arabicDatabase.ts  # Root universe + annotations + permutation helpers
│   │   ├── qutrabData.ts      # 30 vetted Qutrub triangles
│   │   ├── proverbs.ts        # Real proverbs for level completion
│   │   └── videos.ts          # Reward video registry
│   ├── utils/
│   │   ├── scoring.ts      # Scoring, hints, spin/hint costs (unit-tested)
│   │   ├── random.ts       # Fisher-Yates shuffle helpers
│   │   └── responsive.ts   # Static + live (hook-based) responsive helpers
│   └── constants/          # Theme
├── data/                   # Raw sources (not bundled) — see data/README.md
│   ├── القطوف.json, ابدذر.json, ز الى ع.json, أحسنت.json, win.json
│   └── external/lisan345/  # Lisān al-ʿArab root inventory (attribution inside)
├── scripts/build-data.js   # Data pipeline
└── package.json
```

---

## 📊 Data Sources

| Source | Content | Size |
|------|---------|---------|
| [lisan345](https://github.com/git85hub/lisan345) (Elmaz 2026) | Every triliteral root in Lisān al-ʿArab — validity ground truth | 6,529 |
| `القطوف.json` | Annotated roots: meaning, hint, examples, difficulty, poetry, analysis | ~3,300 unique |
| `ابدذر.json` / `ز الى ع.json` | Older annotated volumes (أ–ذ, ذ–ع) | ~170 extra roots |
| نظم مثلث قطرب (Ibn Zurayq) | Canonical Qutrub triangles with verses | 23 (+7 classics) |
| `أحسنت.json` | Educational facts («هل تعلم») | 58 |

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
