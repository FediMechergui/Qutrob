import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  LetterWheel,
  RootGrid,
  ClamAnimation,
  HintModal,
  ScoreBoard,
  RootDefinitionModal,
} from "../components";
import { ClamCard } from "../components/ClamCard";
import {
  COLORS,
  FONTS,
  SHADOWS,
  BORDER_RADIUS,
  SPACING,
} from "../constants/theme";
import {
  generateRoundData,
  RoundData,
  ARABIC_PROVERBS,
  Difficulty,
} from "../services/arabicApi";
import { getRootInfo, canonicalRoot } from "../data/arabicDatabase";
import ahsantJson from "../../data/أحسنت.json";
import {
  saveRootsSession,
  getRootsSession,
  clearRootsSession,
  addToTotalScore,
  updateHighScore,
  updateTotalStreak,
  getGlobalScores,
  saveCompletedLevel,
  saveGameHistory,
  getUnlockedCards,
  unlockCard,
  UnlockedCard,
} from "../services/database";
import {
  ROOTS_DIFFICULTY_CONFIG,
  difficultyForLevel,
  calculateRootsRoundScore,
  buildHints,
  hintCost,
  spinCost,
} from "../utils/scoring";
import { pickRandom } from "../utils/random";
import { scaleFontSize } from "../utils/responsive";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Responsive sizing calculations
const isSmallDevice = SCREEN_WIDTH < 360;
const isMediumDevice = SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 414;
const isShortDevice = SCREEN_HEIGHT < 700;

const getResponsiveSize = (base: number, small: number, medium: number) => {
  if (isSmallDevice) return small;
  if (isMediumDevice) return medium;
  return base;
};

interface RootOption {
  root: string;
  isValid: boolean;
  isSelected: boolean;
  isRevealed: boolean;
}

// Difficulty settings (shared with scoring tests)
const DIFFICULTY_CONFIG = ROOTS_DIFFICULTY_CONFIG;

// Proverbs for each level completion
const LEVEL_PROVERBS = ARABIC_PROVERBS;

interface GameScreenProps {
  onBack?: () => void;
  onOpenVideoReward?: () => void;
  resumeGame?: boolean;
  playerId: number;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  onBack,
  onOpenVideoReward,
  resumeGame = false,
  playerId,
}) => {
  // Game state
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [level, setLevel] = useState(1);
  const [roundInLevel, setRoundInLevel] = useState(0);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [currentLetters, setCurrentLetters] = useState<
    [string, string, string]
  >(["ك", "ت", "ب"]);
  const [selectedRoots, setSelectedRoots] = useState<Set<string>>(new Set());
  const [revealedRoots, setRevealedRoots] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [spinsUsed, setSpinsUsed] = useState(0);
  const [highScore, setHighScore] = useState(0);
  // Track used roots to prevent repeats within a session
  const [usedRoots, setUsedRoots] = useState<Set<string>>(new Set());

  // UI state
  const [showHintModal, setShowHintModal] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  // difficulty selection removed — start game immediately
  const [showDifficultySelect, setShowDifficultySelect] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Popups and unlocks
  const [ahsant, setAhsant] = useState<any[]>([]);
  const [showClamPopup, setShowClamPopup] = useState(false);
  const [popupItem, setPopupItem] = useState<any | null>(null);
  const [unlockedCardsState, setUnlockedCardsState] = useState<UnlockedCard[]>([]);
  const [showUnlockedModal, setShowUnlockedModal] = useState(false);
  const [showClamCard, setShowClamCard] = useState(false);
  const [clamCardTitle, setClamCardTitle] = useState("");
  const [clamCardDescription, setClamCardDescription] = useState("");
  const [clamCardNotes, setClamCardNotes] = useState<string[]>([]);

  // Definition modal state (click to show)
  const [showDefinitionModal, setShowDefinitionModal] = useState(false);
  const [definitionRoot, setDefinitionRoot] = useState("");
  const [definitionMeaning, setDefinitionMeaning] = useState("");
  const [definitionPoetry, setDefinitionPoetry] = useState<string | undefined>(
    undefined
  );
  const [definitionDifficulty, setDefinitionDifficulty] = useState<
    "easy" | "medium" | "hard" | undefined
  >(undefined);

  // Animation
  const fadeAnim = useState(new Animated.Value(0))[0];

  const difficultyConfig = DIFFICULTY_CONFIG[difficulty];
  const currentProverb = LEVEL_PROVERBS[(level - 1) % LEVEL_PROVERBS.length];

  // Progressive hints (count → first letter → meanings), priced per difficulty
  const hints = roundData
    ? buildHints({
        validRoots: roundData.validRoots,
        meanings: roundData.meanings,
      })
    : [];
  const nextHintCost = hintCost(hintsUsed, difficultyConfig);

  const handleUseHint = useCallback(() => {
    if (hintsUsed >= hints.length) return;
    const cost = hintCost(hintsUsed, difficultyConfig);
    setHintsUsed((prev) => prev + 1);
    setScore((prev) => Math.max(0, prev - cost));
  }, [hintsUsed, hints.length, difficultyConfig]);

  // Load saved data
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      let restored = false;

      if (playerId) {
        const globalScores = await getGlobalScores(playerId);
        setHighScore(globalScores.roots_high_score);

        // Check if we should resume a game
        if (resumeGame) {
          const savedSession = await getRootsSession(playerId);
          if (savedSession && savedSession.is_paused) {
            // Restore game state
            const savedLevel = savedSession.current_level;
            setDifficulty(difficultyForLevel(savedLevel));
            setLevel(savedLevel);
            setRoundInLevel(savedSession.current_round);
            setScore(savedSession.score);
            setStreak(savedSession.streak);
            setShowDifficultySelect(false);

            // Generate a new round (exact round state is not persisted)
            const newUsedRoots = new Set<string>();
            const newRoundData = generateRoundData(
              difficultyForLevel(savedLevel),
              newUsedRoots
            );
            setRoundData(newRoundData);
            setCurrentLetters([...newRoundData.letters] as [
              string,
              string,
              string
            ]);
            newUsedRoots.add(newRoundData.usedKey);
            setUsedRoots(newUsedRoots);
            restored = true;
          }
        }
      }

      // Fresh game: generate the first round immediately so the grid is never empty
      if (!restored) {
        const newUsedRoots = new Set<string>();
        const newRoundData = generateRoundData("easy", newUsedRoots);
        setRoundData(newRoundData);
        setCurrentLetters([...newRoundData.letters] as [
          string,
          string,
          string
        ]);
        newUsedRoots.add(newRoundData.usedKey);
        setUsedRoots(newUsedRoots);
      }

      setIsLoading(false);

      // Load popup data (from project root JSON file)
      try {
        setAhsant(Array.isArray(ahsantJson as any) ? (ahsantJson as any) : []);
      } catch (e) {
        setAhsant([]);
      }

      // Load unlocked cards from the database
      try {
        const unlocked = playerId ? await getUnlockedCards(playerId) : [];
        setUnlockedCardsState(unlocked);
      } catch (e) {
        setUnlockedCardsState([]);
      }

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error("Error loading saved data:", error);
      setIsLoading(false);
    }
  };

  // Generate new round when starting or advancing.
  // Session difficulty stays stable within a level (it only changes with level
  // progression) so the number of rounds per level never shifts mid-level.
  const generateNewRound = useCallback(() => {
    const newRoundData = generateRoundData(difficulty, usedRoots);
    setRoundData(newRoundData);
    setCurrentLetters([...newRoundData.letters] as [string, string, string]);
    setSelectedRoots(new Set());
    setRevealedRoots(false);
    setHintsUsed(0);
    setSpinsUsed(0);
    setUsedRoots((prev) => new Set([...prev, newRoundData.usedKey]));
  }, [difficulty, usedRoots]);

  // Start game with selected difficulty
  const handleStartGame = useCallback((selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setShowDifficultySelect(false);
    setLevel(1);
    setRoundInLevel(0);
    setScore(0);
    setStreak(0);
    // Reset used roots for new game session
    const newUsedRoots = new Set<string>();

    // Generate first round with selected difficulty
    const newRoundData = generateRoundData(selectedDifficulty, newUsedRoots);
    setRoundData(newRoundData);
    setCurrentLetters([...newRoundData.letters] as [string, string, string]);
    setSelectedRoots(new Set());
    setRevealedRoots(false);
    setHintsUsed(0);
    setSpinsUsed(0);
    newUsedRoots.add(newRoundData.usedKey);
    setUsedRoots(newUsedRoots);
  }, []);

  // Handle letter rotation - generates completely NEW random letters.
  // The first spin per round is free; further spins cost points.
  const currentSpinCost = spinCost(spinsUsed, difficultyConfig);

  const handleRotate = useCallback(() => {
    if (isSpinning || revealedRoots) return;

    const cost = spinCost(spinsUsed, difficultyConfig);
    setSpinsUsed((prev) => prev + 1);
    if (cost > 0) setScore((prev) => Math.max(0, prev - cost));
    setIsSpinning(true);

    // Wait for spin animation (simulated delay)
    setTimeout(() => {
      // Generate completely new round with new letters (excluding already-used)
      const newRoundData = generateRoundData(difficulty, usedRoots);
      setRoundData(newRoundData);
      setCurrentLetters([...newRoundData.letters] as [string, string, string]);
      setSelectedRoots(new Set());
      setHintsUsed(0);
      setUsedRoots((prev) => new Set([...prev, newRoundData.usedKey]));
      setIsSpinning(false);
    }, 800);
  }, [difficulty, usedRoots, isSpinning, revealedRoots, spinsUsed, difficultyConfig]);

  // Generate root options from current round
  const rootOptions: RootOption[] =
    roundData?.permutations.map((root) => ({
      root,
      isValid: roundData.validRoots.includes(root),
      isSelected: selectedRoots.has(root),
      isRevealed: revealedRoots,
    })) || [];

  // Handle root selection
  const handleSelectRoot = useCallback(
    (root: string) => {
      if (revealedRoots) return;

      setSelectedRoots((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(root)) {
          newSet.delete(root);
        } else {
          newSet.add(root);
        }
        return newSet;
      });
    },
    [revealedRoots]
  );

  // Calculate score for current round
  const calculateRoundScore = useCallback(() => {
    if (!roundData)
      return {
        pointsEarned: 0,
        correct: 0,
        incorrect: 0,
        missed: 0,
        streakBonus: 0,
        isPerfect: false,
      };

    return calculateRootsRoundScore({
      validRoots: roundData.validRoots,
      selectedRoots,
      basePoints: difficultyConfig.basePoints,
      streak,
    });
  }, [roundData, selectedRoots, streak, difficultyConfig]);

  // Handle showing definition modal when clicking on valid root after reveal
  const handleRootPress = useCallback(
    (root: string) => {
      if (roundData && roundData.validRoots.includes(root)) {
        setDefinitionRoot(root);
        setDefinitionMeaning(
          roundData.meanings[root] ||
            roundData.successMessages[root] ||
            "جذر صحيح ورد في لسان العرب"
        );
        setDefinitionPoetry(roundData.poetryExamples[root]);
        setDefinitionDifficulty(roundData.difficulty || difficulty);
        setShowDefinitionModal(true);
      }
    },
    [roundData, difficulty]
  );

  // Handle check answers
  const handleCheckAnswers = useCallback(async () => {
    if (selectedRoots.size === 0) {
      Alert.alert("تنبيه", "الرجاء اختيار جذر واحد على الأقل");
      return;
    }

    setRevealedRoots(true);

    const result = calculateRoundScore();
    const newScore = score + result.pointsEarned;

    setScore(newScore);

    // Update streak
    let newStreak = streak;
    if (result.isPerfect) {
      newStreak = streak + 1;
      setStreak(newStreak);
    } else {
      newStreak = 0;
      setStreak(0);
    }

    if (playerId) {
      // Bank the points earned this round exactly once
      if (result.pointsEarned > 0) {
        await addToTotalScore(playerId, result.pointsEarned);
      }

      // Update high score in database
      if (newScore > highScore) {
        setHighScore(newScore);
        await updateHighScore(playerId, "roots", newScore);
      }

      // Update total streak in database
      await updateTotalStreak(playerId, newStreak);
    }

    // Show أحسنت popup IMMEDIATELY after each round with motivational message, root, explanation, variant, and proverb
    if (roundData) {
      const correctRoots = Array.from(selectedRoots).filter((root) =>
        roundData.validRoots.includes(root)
      );

      if (correctRoots.length === 0) return;

      // Prefer a root that has a written explanation for the popup
      const validRoot =
        correctRoots.find((r) => roundData.meanings?.[r]) || correctRoots[0];
      const rootInfo = getRootInfo(validRoot);
      const analysis =
        roundData.successMessages?.[validRoot] || rootInfo?.successMessage || "";
      const rootMeaning = roundData.meanings?.[validRoot] || rootInfo?.meaning || "";

      // Unlockable card built from the annotated entry (only when one exists)
      const unlockableCard =
        rootInfo && !rootInfo.isLisanOnly
          ? {
              id: `root-${canonicalRoot(validRoot)}`,
              title: `📜 ${validRoot}`,
              description: rootInfo.meaning || analysis,
              notes: [
                rootInfo.hint && rootInfo.hint !== rootInfo.meaning
                  ? `💡 ${rootInfo.hint}`
                  : null,
                rootInfo.examples ? `📌 ${rootInfo.examples}` : null,
                rootInfo.poetryExample ? `📜 ${rootInfo.poetryExample}` : null,
              ].filter(Boolean) as string[],
            }
          : null;

      // A random «هل تعلم» fact and a real proverb
      const ahsantFact = pickRandom(ahsant) ?? null;
      const proverb = pickRandom(ARABIC_PROVERBS) ?? null;

      setPopupItem({
        title: `🎉 أحسنت! الجذر "${validRoot}" صحيح ✅`,
        content: [
          analysis || (rootMeaning ? `معنى الجذر: ${rootMeaning}` : "أحسنت! لقد أجبت بشكل صحيح"),
          correctRoots.length > 1
            ? `✅ أصبت أيضاً: ${correctRoots.filter((r) => r !== validRoot).join("، ")}`
            : null,
          ahsantFact
            ? `💡 هل تعلم؟ ${ahsantFact.title}\n${
                Array.isArray(ahsantFact.content)
                  ? ahsantFact.content.join("\n")
                  : ahsantFact.content
              }`
            : null,
          proverb ? `📜 مثل: ${proverb.text}\n${proverb.meaning}` : null,
        ].filter(Boolean),
        unlockableCard,
      });
      setShowClamPopup(true);
    }
  }, [
    ahsant,
    selectedRoots,
    calculateRoundScore,
    score,
    highScore,
    streak,
    playerId,
    roundData,
  ]);

  // Handle next round
  const handleNextRound = useCallback(async () => {
    const nextRoundInLevel = roundInLevel + 1;

    if (nextRoundInLevel >= difficultyConfig.roundsPerLevel) {
      // Level complete! Save to database.
      // (Round points were already banked in handleCheckAnswers.)
      if (playerId) {
        await saveCompletedLevel(playerId, "roots", level.toString());
        await saveGameHistory(playerId, "roots", score, streak, level);
      }
      setShowClamPopup(false);
      setShowLevelComplete(true);
    } else {
      // Next round in same level
      setRoundInLevel(nextRoundInLevel);
      generateNewRound();
    }
  }, [
    roundInLevel,
    difficultyConfig.roundsPerLevel,
    level,
    generateNewRound,
    playerId,
    score,
    streak,
  ]);

  // Handle next level - difficulty follows the level progression
  const handleNextLevel = useCallback(async () => {
    setShowLevelComplete(false);

    const nextLevel = level + 1;
    const nextDifficulty = difficultyForLevel(nextLevel);

    setLevel(nextLevel);
    setDifficulty(nextDifficulty);
    setRoundInLevel(0);

    // Generate new round with potentially new difficulty (excluding used)
    const newRoundData = generateRoundData(nextDifficulty, usedRoots);
    setRoundData(newRoundData);
    setCurrentLetters([...newRoundData.letters] as [string, string, string]);
    setSelectedRoots(new Set());
    setRevealedRoots(false);
    setHintsUsed(0);
    setSpinsUsed(0);
    setUsedRoots((prev) => new Set([...prev, newRoundData.usedKey]));
  }, [level, usedRoots]);

  // Reset game
  const handleResetGame = useCallback(() => {
    setShowPauseModal(false);
    Alert.alert("إعادة اللعب", "هل أنت متأكد من إعادة اللعب من البداية؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "نعم",
        onPress: async () => {
          await clearRootsSession(playerId);
          setShowDifficultySelect(true);
          setLevel(1);
          setRoundInLevel(0);
          setScore(0);
          setStreak(0);
          setHintsUsed(0);
          setSpinsUsed(0);
          setSelectedRoots(new Set());
          setRevealedRoots(false);
          setShowLevelComplete(false);
          // Reset used roots for fresh game
          setUsedRoots(new Set());
        },
      },
    ]);
  }, [playerId]);

  // Pause game - save progress and show pause modal
  const handlePauseGame = useCallback(async () => {
    // Auto-save progress when pausing
    if (playerId) {
      await saveRootsSession(playerId, {
        difficulty,
        currentLevel: level,
        currentRound: roundInLevel,
        score,
        streak,
        isPaused: true,
      });
    }
    setShowPauseModal(true);
  }, [playerId, difficulty, level, roundInLevel, score, streak]);

  // Keep the latest session state in a ref so the unmount cleanup below runs
  // exactly once (an effect with state deps would re-run its cleanup on every
  // state change, which previously re-banked the score repeatedly).
  const sessionRef = useRef({ difficulty, level, roundInLevel, score, streak });
  useEffect(() => {
    sessionRef.current = { difficulty, level, roundInLevel, score, streak };
  }, [difficulty, level, roundInLevel, score, streak]);

  // Save session once when the screen unmounts (navigating away)
  useEffect(() => {
    return () => {
      const s = sessionRef.current;
      if (playerId) {
        saveRootsSession(playerId, {
          difficulty: s.difficulty,
          currentLevel: s.level,
          currentRound: s.roundInLevel,
          score: s.score,
          streak: s.streak,
          isPaused: true,
        }).catch(() => {
          // ignore - best-effort save on unmount
        });
      }
    };
  }, [playerId]);

  // Resume game from pause
  const handleResumePause = useCallback(() => {
    setShowPauseModal(false);
  }, []);

  // Quit game with confirmation
  const handleQuitGame = useCallback(() => {
    setShowPauseModal(false);
    setShowExitConfirm(true);
  }, []);

  // Confirm exit - save and go back
  // (Earned points and streak are already banked per round; only the session
  // position needs saving here.)
  const handleConfirmExit = useCallback(async () => {
    if (playerId) {
      await saveRootsSession(playerId, {
        difficulty,
        currentLevel: level,
        currentRound: roundInLevel,
        score,
        streak,
        isPaused: true,
      });
    }
    setShowExitConfirm(false);
    if (onBack) onBack();
  }, [playerId, difficulty, level, roundInLevel, score, streak, onBack]);

  // Cancel exit
  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  // Handle video reward - save progress before opening video
  const handleVideoReward = useCallback(async () => {
    // Save progress before watching video
    if (playerId) {
      await saveRootsSession(playerId, {
        difficulty,
        currentLevel: level,
        currentRound: roundInLevel,
        score,
        streak,
        isPaused: true,
      });
    }
    setShowPauseModal(false);
    if (onOpenVideoReward) {
      onOpenVideoReward();
    }
  }, [
    playerId,
    difficulty,
    level,
    roundInLevel,
    score,
    streak,
    onOpenVideoReward,
  ]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  // Difficulty selection screen
  if (showDifficultySelect) {
    return (
      <LinearGradient
        colors={[COLORS.parchment, COLORS.parchmentDark, COLORS.parchment]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={COLORS.parchment}
          />
          <Animated.View
            style={[styles.difficultyContainer, { opacity: fadeAnim }]}
          >
            <Text style={styles.difficultyTitle}>اختر مستوى الصعوبة</Text>
            <Text style={styles.difficultySubtitle}>
              كلما زادت الصعوبة، زادت النقاط
            </Text>

            {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
              <TouchableOpacity
                key={diff}
                style={[
                  styles.difficultyButton,
                  diff === "easy" && styles.difficultyEasy,
                  diff === "medium" && styles.difficultyMedium,
                  diff === "hard" && styles.difficultyHard,
                ]}
                onPress={() => handleStartGame(diff)}
              >
                <Text style={styles.difficultyButtonText}>
                  {DIFFICULTY_CONFIG[diff].nameAr}
                </Text>
                <Text style={styles.difficultyDesc}>
                  {diff === "easy" && "حروف شائعة - مناسب للمبتدئين"}
                  {diff === "medium" && "تحدي متوسط - لعشاق اللغة"}
                  {diff === "hard" && "تحدي صعب - للخبراء فقط"}
                </Text>
                <Text style={styles.difficultyPoints}>
                  {DIFFICULTY_CONFIG[diff].basePoints} نقطة لكل جذر صحيح
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.highScoreDisplay}>
              <Text style={styles.highScoreLabel}>أعلى نتيجة</Text>
              <Text style={styles.highScoreValue}>{highScore}</Text>
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Level complete screen with clam animation
  if (showLevelComplete) {
    return (
      <LinearGradient
        colors={[COLORS.parchment, COLORS.parchmentDark, COLORS.parchment]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={COLORS.parchment}
          />
          <ScrollView contentContainerStyle={styles.levelCompleteContainer}>
            <Text style={styles.levelCompleteTitle}>🎉 مبروك! 🎉</Text>
            <Text style={styles.levelCompleteSubtitle}>
              أكملت المستوى {level} ({difficultyConfig.nameAr})
            </Text>

            <ClamAnimation
              isOpen={true}
              proverb={currentProverb.text}
              proverbMeaning={currentProverb.meaning || ""}
            />

            <View style={styles.levelScoreContainer}>
              <Text style={styles.levelScoreLabel}>مجموع النقاط</Text>
              <Text style={styles.levelScoreValue}>{score}</Text>
            </View>

            <TouchableOpacity
              style={styles.nextLevelButton}
              onPress={handleNextLevel}
            >
              <Text style={styles.nextLevelButtonText}>المستوى التالي ←</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Main game screen
  return (
    <LinearGradient
      colors={[COLORS.parchment, COLORS.parchmentLight, COLORS.parchment]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.parchment} />

        <Modal
          visible={showClamPopup}
          transparent
          animationType="fade"
          onRequestClose={() => setShowClamPopup(false)}
        >
          <View style={styles.clamPopupOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => setShowClamPopup(false)}
            />
            <View style={styles.clamPopupCard}>
              <Text style={styles.clamPopupEmoji}>🎉</Text>
              <Text style={styles.clamPopupTitle}>
                {popupItem?.title || "أحسنت!"}
              </Text>
              {popupItem?.content &&
                Array.isArray(popupItem.content) &&
                popupItem.content.map((line: string, idx: number) => (
                  <Text key={idx} style={styles.clamPopupText}>
                    {line}
                  </Text>
                ))}

              {popupItem?.unlockableCard && (
                <TouchableOpacity
                  style={styles.diverButton}
                  onPress={async () => {
                    try {
                      if (playerId) {
                        await unlockCard(playerId, popupItem.unlockableCard);
                        const unlocked = await getUnlockedCards(playerId);
                        setUnlockedCardsState(unlocked);
                      }
                    } finally {
                      setClamCardTitle(
                        popupItem.unlockableCard.title || "بطاقة"
                      );
                      setClamCardDescription(
                        popupItem.unlockableCard.description || ""
                      );
                      setClamCardNotes(popupItem.unlockableCard.notes || []);
                      setShowClamPopup(false);
                      setShowClamCard(true);
                    }
                  }}
                >
                  <Text style={styles.diverEmoji}>🤿</Text>
                  <Text style={styles.diverText}>افتح بطاقة هذا الجذر</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.clamPopupCloseButton}
                onPress={() => setShowClamPopup(false)}
              >
                <Text style={styles.clamPopupHint}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <ClamCard
          visible={showClamCard}
          title={clamCardTitle}
          description={clamCardDescription}
          notes={clamCardNotes}
          onClose={() => setShowClamCard(false)}
        />

        <View style={styles.gameContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.pauseButton}
              onPress={handlePauseGame}
            >
              <Text style={styles.pauseButtonText}>⏸️</Text>
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>لعبة الجذور</Text>
              <Text style={styles.difficultyBadge}>
                {difficultyConfig.nameAr}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                style={[styles.hintButton, { marginRight: 8 }]}
                onPress={() => setShowHintModal(true)}
              >
                <Text style={styles.hintButtonText}>💡</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hintButton}
                onPress={() => setShowUnlockedModal(true)}
              >
                <Text style={styles.hintButtonText}>📚</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              المستوى {level} - السؤال {roundInLevel + 1}/
              {difficultyConfig.roundsPerLevel}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      ((roundInLevel + 1) / difficultyConfig.roundsPerLevel) *
                      100
                    }%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Score Board */}
          <View style={styles.scoreBoardContainer}>
            <ScoreBoard
              score={score}
              level={level}
              streak={streak}
              highScore={highScore}
            />
          </View>

          {/* Letter Wheel with random rotation */}
          <View style={styles.wheelContainer}>
            <LetterWheel
              letters={currentLetters}
              onRotate={handleRotate}
              disabled={revealedRoots}
              isSpinning={isSpinning}
              spinCost={currentSpinCost}
            />
          </View>

          {/* Root Grid */}
          <View style={styles.gridContainer}>
            <RootGrid
              options={rootOptions}
              onSelectRoot={handleSelectRoot}
              onRootPress={handleRootPress}
              disabled={revealedRoots || isSpinning}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {!revealedRoots ? (
              <TouchableOpacity
                style={[
                  styles.checkButton,
                  isSpinning && styles.buttonDisabled,
                ]}
                onPress={handleCheckAnswers}
                disabled={isSpinning}
              >
                <Text style={styles.checkButtonText}>تحقق من الإجابات</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNextRound}
              >
                <Text style={styles.nextButtonText}>
                  {roundInLevel < difficultyConfig.roundsPerLevel - 1
                    ? "السؤال التالي"
                    : "إنهاء المستوى"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Score breakdown after reveal */}
          {revealedRoots && (
            <View style={styles.scoreBreakdownCompact}>
              {(() => {
                const result = calculateRoundScore();
                return (
                  <Text style={styles.scoreBreakdownText}>
                    ✓ {result.correct} | ✗ {result.incorrect} | ○{" "}
                    {result.missed} | +{result.pointsEarned}
                  </Text>
                );
              })()}
              <Text style={styles.tapHintText}>
                {roundData?.hasExplanation
                  ? "اضغط على الجذر لمعرفة معناه"
                  : "جذر نادر من لسان العرب — اضغط عليه للتأكيد"}
              </Text>
            </View>
          )}
        </View>

        {/* Hint Modal */}
        <HintModal
          visible={showHintModal}
          hints={hints}
          hintsUsed={hintsUsed}
          maxHints={hints.length}
          nextHintCost={nextHintCost}
          onUseHint={handleUseHint}
          onClose={() => setShowHintModal(false)}
        />

        {/* Pause Modal */}
        <Modal
          visible={showPauseModal}
          transparent
          animationType="fade"
          onRequestClose={handleResumePause}
        >
          <View style={styles.pauseModalOverlay}>
            <View style={styles.pauseModalContent}>
              <Text style={styles.pauseModalTitle}>⏸️ اللعبة متوقفة</Text>

              <View style={styles.pauseModalStats}>
                <Text style={styles.pauseModalStat}>المستوى: {level}</Text>
                <Text style={styles.pauseModalStat}>النقاط: {score}</Text>
                <Text style={styles.pauseModalStat}>السلسلة: {streak} 🔥</Text>
              </View>

              <TouchableOpacity
                style={styles.pauseModalButton}
                onPress={handleResumePause}
              >
                <Text style={styles.pauseModalButtonText}>▶️ استمرار</Text>
              </TouchableOpacity>

              {onOpenVideoReward && (
                <TouchableOpacity
                  style={[
                    styles.pauseModalButton,
                    styles.pauseModalButtonVideo,
                  ]}
                  onPress={handleVideoReward}
                >
                  <Text style={styles.pauseModalButtonText}>
                    🎬 مكافأة فيديو (+100 نقطة)
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.pauseModalButton, styles.pauseModalButtonReset]}
                onPress={handleResetGame}
              >
                <Text style={styles.pauseModalButtonText}>⟳ إعادة اللعب</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pauseModalButton, styles.pauseModalButtonQuit]}
                onPress={handleQuitGame}
              >
                <Text style={styles.pauseModalButtonText}>🚪 خروج</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Exit Confirmation Modal */}
        <Modal
          visible={showExitConfirm}
          transparent
          animationType="fade"
          onRequestClose={handleCancelExit}
        >
          <View style={styles.pauseModalOverlay}>
            <View style={styles.pauseModalContent}>
              <Text style={styles.pauseModalTitle}>🚪 الخروج من اللعبة</Text>
              <Text style={styles.exitConfirmText}>
                سيتم حفظ تقدمك تلقائياً. هل تريد الخروج؟
              </Text>

              <View style={styles.exitConfirmButtons}>
                <TouchableOpacity
                  style={[styles.pauseModalButton, styles.exitConfirmButton]}
                  onPress={handleCancelExit}
                >
                  <Text style={styles.pauseModalButtonText}>إلغاء</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.pauseModalButton,
                    styles.pauseModalButtonQuit,
                    styles.exitConfirmButton,
                  ]}
                  onPress={handleConfirmExit}
                >
                  <Text style={styles.pauseModalButtonText}>خروج</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Root Definition Modal */}
        <RootDefinitionModal
          visible={showDefinitionModal}
          root={definitionRoot}
          meaning={definitionMeaning}
          poetryExample={definitionPoetry}
          difficulty={definitionDifficulty}
          onClose={() => setShowDefinitionModal(false)}
        />

        {/* Unlocked Cards Modal */}
        <Modal visible={showUnlockedModal} transparent animationType="slide">
          <View style={styles.unlockedOverlay}>
            <View style={styles.unlockedContainer}>
              <Text style={styles.unlockedTitle}>البطاقات المفتوحة</Text>
              <ScrollView style={{ flex: 1, width: "100%" }}>
                {unlockedCardsState.length === 0 ? (
                  <Text style={styles.unlockedEmpty}>لم تفتح أي بطاقة بعد</Text>
                ) : (
                  unlockedCardsState.map((card) => (
                    <View key={card.id} style={styles.unlockedCard}>
                      <Text style={styles.unlockedCardTitle}>
                        {card.title || `بطاقة ${card.card_id}`}
                      </Text>
                      {card.description && (
                        <Text style={styles.unlockedCardDesc}>
                          {card.description}
                        </Text>
                      )}
                      {card.notes.map((note, idx) => (
                        <Text key={idx} style={styles.unlockedCardAnalysis}>
                          {note}
                        </Text>
                      ))}
                    </View>
                  ))
                )}
              </ScrollView>

              <TouchableOpacity
                style={styles.pauseModalButton}
                onPress={() => setShowUnlockedModal(false)}
              >
                <Text style={styles.pauseModalButtonText}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.parchment,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: scaleFontSize(18),
    color: COLORS.inkBrown,
    ...FONTS.arabicText,
  },
  // Difficulty selection styles
  difficultyContainer: {
    flex: 1,
    padding: getResponsiveSize(SPACING.xl, SPACING.md, SPACING.lg),
    justifyContent: "center",
  },
  difficultyTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 26 : 32),
    color: COLORS.inkBrown,
    textAlign: "center",
    marginBottom: getResponsiveSize(SPACING.sm, SPACING.xs, SPACING.xs),
    ...FONTS.arabicTitle,
  },
  difficultySubtitle: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: getResponsiveSize(SPACING.xl, SPACING.lg, SPACING.lg),
    ...FONTS.arabicText,
  },
  difficultyButton: {
    padding: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
    borderWidth: 2,
    ...SHADOWS.medium,
  },
  difficultyEasy: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  difficultyMedium: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF9800",
  },
  difficultyHard: {
    backgroundColor: "#FFEBEE",
    borderColor: "#F44336",
  },
  difficultyButtonText: {
    fontSize: scaleFontSize(isSmallDevice ? 20 : 24),
    color: COLORS.inkBrown,
    textAlign: "center",
    ...FONTS.arabicTitle,
  },
  difficultyDesc: {
    fontSize: scaleFontSize(isSmallDevice ? 12 : 14),
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.xs,
    ...FONTS.arabicText,
  },
  difficultyPoints: {
    fontSize: scaleFontSize(isSmallDevice ? 10 : 12),
    color: COLORS.inkGold,
    textAlign: "center",
    marginTop: SPACING.xs,
    ...FONTS.arabicText,
  },
  highScoreDisplay: {
    marginTop: getResponsiveSize(SPACING.xl, SPACING.lg, SPACING.lg),
    alignItems: "center",
    padding: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
    backgroundColor: COLORS.parchmentLight,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.inkGold,
  },
  highScoreLabel: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: COLORS.textSecondary,
    ...FONTS.arabicText,
  },
  highScoreValue: {
    fontSize: scaleFontSize(isSmallDevice ? 28 : 36),
    color: COLORS.inkGold,
    ...FONTS.arabicTitle,
  },
  // Main game styles
  gameContent: {
    flex: 1,
    paddingBottom: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
    paddingVertical: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
  },
  titleContainer: {
    alignItems: "center",
  },
  resetButton: {
    width: getResponsiveSize(44, 36, 40),
    height: getResponsiveSize(44, 36, 40),
    borderRadius: getResponsiveSize(22, 18, 20),
    backgroundColor: COLORS.parchmentDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.inkGold,
  },
  resetButtonText: {
    fontSize: scaleFontSize(isSmallDevice ? 20 : 24),
    color: COLORS.inkBrown,
  },
  title: {
    fontSize: scaleFontSize(isSmallDevice ? 22 : 28),
    color: COLORS.inkBrown,
    ...FONTS.arabicTitle,
  },
  difficultyBadge: {
    fontSize: scaleFontSize(isSmallDevice ? 10 : 12),
    color: COLORS.inkGold,
    backgroundColor: COLORS.parchmentDark,
    paddingHorizontal: getResponsiveSize(SPACING.sm, SPACING.xs, SPACING.xs),
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: 2,
    overflow: "hidden",
    ...FONTS.arabicText,
  },
  hintButton: {
    width: getResponsiveSize(44, 36, 40),
    height: getResponsiveSize(44, 36, 40),
    borderRadius: getResponsiveSize(22, 18, 20),
    backgroundColor: COLORS.inkGold,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  hintButtonText: {
    fontSize: scaleFontSize(isSmallDevice ? 18 : 22),
  },
  progressContainer: {
    paddingHorizontal: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
    marginBottom: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
  },
  progressText: {
    fontSize: scaleFontSize(isSmallDevice ? 12 : 14),
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xs,
    ...FONTS.arabicText,
  },
  progressBar: {
    height: isSmallDevice ? 6 : 8,
    backgroundColor: COLORS.parchmentDark,
    borderRadius: isSmallDevice ? 3 : 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.inkGold,
    borderRadius: isSmallDevice ? 3 : 4,
  },
  scoreBoardContainer: {
    paddingHorizontal: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
    marginBottom: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
  },
  wheelContainer: {
    alignItems: "center",
    marginVertical: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
  },
  gridContainer: {
    paddingHorizontal: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
    marginBottom: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
  },
  actionButtons: {
    paddingHorizontal: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
    marginBottom: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
  },
  checkButton: {
    backgroundColor: COLORS.inkGold,
    padding: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
    ...SHADOWS.medium,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  checkButtonText: {
    fontSize: scaleFontSize(isSmallDevice ? 16 : 18),
    color: COLORS.parchment,
    ...FONTS.arabicTitle,
  },
  nextButton: {
    backgroundColor: COLORS.copperAccent,
    padding: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
    ...SHADOWS.medium,
  },
  nextButtonText: {
    fontSize: scaleFontSize(isSmallDevice ? 16 : 18),
    color: COLORS.parchment,
    ...FONTS.arabicTitle,
  },
  scoreBreakdownCompact: {
    paddingHorizontal: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
    alignItems: "center",
  },
  scoreBreakdownText: {
    fontSize: scaleFontSize(isSmallDevice ? 12 : 14),
    color: COLORS.inkBrown,
    ...FONTS.arabicText,
  },
  tapHintText: {
    fontSize: scaleFontSize(isSmallDevice ? 10 : 12),
    color: COLORS.inkGold,
    marginTop: SPACING.xs,
    ...FONTS.arabicText,
  },
  meaningsContainer: {
    margin: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
    padding: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
    backgroundColor: COLORS.parchmentLight,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inkGold,
  },
  meaningsTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 16 : 18),
    color: COLORS.inkBrown,
    marginBottom: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
    textAlign: "center",
    ...FONTS.arabicTitle,
  },
  meaningItem: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
    padding: getResponsiveSize(SPACING.sm, SPACING.xs, SPACING.xs),
    backgroundColor: COLORS.parchment,
    borderRadius: BORDER_RADIUS.md,
  },
  meaningRoot: {
    fontSize: scaleFontSize(isSmallDevice ? 18 : 20),
    color: COLORS.inkGold,
    marginLeft: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
    width: isSmallDevice ? 50 : 60,
    textAlign: "center",
    ...FONTS.arabicLetter,
  },
  meaningContent: {
    flex: 1,
  },
  meaningText: {
    fontSize: scaleFontSize(isSmallDevice ? 12 : 14),
    color: COLORS.textSecondary,
    textAlign: "right",
    ...FONTS.arabicText,
  },
  poetryContainer: {
    marginTop: SPACING.sm,
    padding: getResponsiveSize(SPACING.sm, SPACING.xs, SPACING.xs),
    backgroundColor: COLORS.parchmentDark,
    borderRadius: BORDER_RADIUS.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.inkGold,
  },
  poetryLabel: {
    fontSize: scaleFontSize(isSmallDevice ? 10 : 12),
    color: COLORS.inkGold,
    textAlign: "right",
    marginBottom: SPACING.xs,
    ...FONTS.arabicTitle,
  },
  poetryText: {
    fontSize: scaleFontSize(isSmallDevice ? 11 : 13),
    color: COLORS.inkBrown,
    textAlign: "right",
    lineHeight: isSmallDevice ? 18 : 22,
    fontStyle: "italic",
    ...FONTS.arabicText,
  },
  scoreBreakdown: {
    marginTop: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
    paddingTop: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
    borderTopWidth: 1,
    borderTopColor: COLORS.inkGold,
  },
  scoreBreakdownTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: COLORS.inkBrown,
    marginBottom: SPACING.sm,
    textAlign: "center",
    ...FONTS.arabicText,
  },
  scoreBreakdownItem: {
    fontSize: scaleFontSize(isSmallDevice ? 12 : 14),
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 4,
    ...FONTS.arabicText,
  },
  scoreBreakdownTotal: {
    fontSize: scaleFontSize(isSmallDevice ? 16 : 18),
    color: COLORS.inkGold,
    textAlign: "center",
    marginTop: SPACING.sm,
    ...FONTS.arabicTitle,
  },
  // Level complete styles
  levelCompleteContainer: {
    flexGrow: 1,
    padding: getResponsiveSize(SPACING.xl, SPACING.md, SPACING.lg),
    alignItems: "center",
    justifyContent: "center",
  },
  levelCompleteTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 28 : 36),
    color: COLORS.inkGold,
    textAlign: "center",
    marginBottom: SPACING.sm,
    ...FONTS.arabicTitle,
  },
  levelCompleteSubtitle: {
    fontSize: scaleFontSize(isSmallDevice ? 16 : 18),
    color: COLORS.inkBrown,
    textAlign: "center",
    marginBottom: getResponsiveSize(SPACING.xl, SPACING.lg, SPACING.lg),
    ...FONTS.arabicText,
  },
  levelScoreContainer: {
    alignItems: "center",
    padding: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
    backgroundColor: COLORS.parchmentLight,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.inkGold,
    marginVertical: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
    minWidth: isSmallDevice ? 160 : 200,
  },
  levelScoreLabel: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: COLORS.textSecondary,
    ...FONTS.arabicText,
  },
  levelScoreValue: {
    fontSize: scaleFontSize(isSmallDevice ? 36 : 48),
    color: COLORS.inkGold,
    ...FONTS.arabicTitle,
  },
  nextLevelButton: {
    backgroundColor: COLORS.inkGold,
    paddingHorizontal: getResponsiveSize(SPACING.xl, SPACING.lg, SPACING.lg),
    paddingVertical: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
    borderRadius: BORDER_RADIUS.lg,
    marginTop: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
    ...SHADOWS.large,
  },
  nextLevelButtonText: {
    fontSize: scaleFontSize(isSmallDevice ? 18 : 20),
    color: COLORS.parchment,
    ...FONTS.arabicTitle,
  },
  // Pause Modal Styles
  pauseButton: {
    padding: getResponsiveSize(SPACING.sm, SPACING.xs, SPACING.xs),
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.parchmentLight,
    borderWidth: 1,
    borderColor: COLORS.ornamentBorder,
  },
  pauseButtonText: {
    fontSize: scaleFontSize(isSmallDevice ? 18 : 22),
  },
  pauseModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  pauseModalContent: {
    backgroundColor: COLORS.parchment,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: "100%",
    maxWidth: 350,
    borderWidth: 3,
    borderColor: COLORS.inkGold,
    ...SHADOWS.large,
  },
  pauseModalTitle: {
    fontSize: scaleFontSize(26),
    color: COLORS.inkBrown,
    textAlign: "center",
    marginBottom: SPACING.lg,
    ...FONTS.arabicTitle,
  },
  pauseModalStats: {
    backgroundColor: COLORS.parchmentLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.ornamentBorder,
  },
  pauseModalStat: {
    fontSize: scaleFontSize(16),
    color: COLORS.inkBrown,
    textAlign: "center",
    marginVertical: 4,
    ...FONTS.arabicText,
  },
  pauseModalButton: {
    backgroundColor: COLORS.turquoise,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.medium,
  },
  pauseModalButtonText: {
    fontSize: scaleFontSize(16),
    color: COLORS.textLight,
    textAlign: "center",
    ...FONTS.arabicTitle,
  },
  pauseModalButtonVideo: {
    backgroundColor: COLORS.inkGold,
  },
  pauseModalButtonReset: {
    backgroundColor: COLORS.copperAccent,
  },
  pauseModalButtonQuit: {
    backgroundColor: COLORS.burgundy,
  },
  // Clam popup styles
  clamPopupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  clamPopupCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.parchmentLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.inkGold,
  },
  diverButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.parchment,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.inkGold,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  diverEmoji: {
    fontSize: scaleFontSize(22),
  },
  diverText: {
    fontSize: scaleFontSize(14),
    color: COLORS.inkBrown,
    ...FONTS.arabicTitle,
  },
  clamPopupCloseButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  clamPopupEmoji: {
    fontSize: scaleFontSize(36),
    marginBottom: SPACING.sm,
  },
  clamPopupTitle: {
    fontSize: scaleFontSize(18),
    color: COLORS.inkBrown,
    marginBottom: SPACING.xs,
    ...FONTS.arabicTitle,
  },
  clamPopupText: {
    fontSize: scaleFontSize(14),
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.sm,
    ...FONTS.arabicText,
  },
  clamPopupHint: {
    fontSize: scaleFontSize(12),
    color: COLORS.inkGold,
    marginTop: SPACING.xs,
    ...FONTS.arabicText,
  },
  unlockedOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  unlockedContainer: {
    width: "100%",
    maxWidth: 700,
    maxHeight: "80%",
    backgroundColor: COLORS.parchmentLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.inkGold,
  },
  unlockedTitle: {
    fontSize: scaleFontSize(18),
    color: COLORS.inkBrown,
    marginBottom: SPACING.sm,
    textAlign: "center",
    ...FONTS.arabicTitle,
  },
  unlockedEmpty: {
    fontSize: scaleFontSize(14),
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.md,
    ...FONTS.arabicText,
  },
  unlockedCard: {
    backgroundColor: COLORS.parchment,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.ornamentBorder,
  },
  unlockedCardTitle: {
    fontSize: scaleFontSize(16),
    color: COLORS.inkGold,
    marginBottom: SPACING.xs,
    ...FONTS.arabicTitle,
  },
  unlockedCardDesc: {
    fontSize: scaleFontSize(13),
    color: COLORS.inkBrown,
    marginBottom: SPACING.xs,
    ...FONTS.arabicText,
  },
  unlockedCardAnalysis: {
    fontSize: scaleFontSize(12),
    color: COLORS.textSecondary,
    ...FONTS.arabicText,
  },
  exitConfirmText: {
    fontSize: scaleFontSize(16),
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.lg,
    ...FONTS.arabicText,
  },
  exitConfirmButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  exitConfirmButton: {
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
});
