import React, { useState, useEffect, useCallback } from "react";
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
  COLORS,
  FONTS,
  SHADOWS,
  BORDER_RADIUS,
  SPACING,
} from "../constants/theme";
import {
  QutrabRoundData,
  QutrabTriangle,
  generateQutrabRound,
} from "../data/qutrabData";
import { ClamAnimation, LevelDiveModal, DiveSection } from "../components";
import { ARABIC_PROVERBS } from "../services/arabicApi";
import {
  scaleFontSize,
  isShortScreen,
} from "../utils/responsive";
import {
  saveQutrabSession,
  getQutrabSession,
  clearQutrabSession,
  addToTotalScore,
  updateTotalStreak,
  updateHighScore,
  getGlobalScores,
  saveCompletedLevel,
  saveGameHistory,
  unlockCard,
} from "../services/database";
import {
  QUTRAB_DIFFICULTY_CONFIG,
  calculateQutrabRoundScore,
  difficultyForLevel,
} from "../utils/scoring";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const isSmallDevice = SCREEN_WIDTH < 360;
const isMediumDevice = SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 414;

const getResponsiveSize = (
  base: number,
  small: number,
  medium: number,
  short?: number
) => {
  if (isShortScreen && short !== undefined) return short;
  if (isSmallDevice) return small;
  if (isMediumDevice) return medium;
  return base;
};

type Difficulty = "easy" | "medium" | "hard";

interface Match {
  wordKey: "fatha" | "damma" | "kasra";
  meaningKey: "fatha" | "damma" | "kasra";
}

const DIFFICULTY_CONFIG = QUTRAB_DIFFICULTY_CONFIG;

export const QutrabScreen: React.FC<{
  onBack?: () => void;
  onOpenVideoReward?: () => void;
  resumeGame?: boolean;
  playerId?: number;
}> = ({ onBack, onOpenVideoReward, resumeGame = false, playerId }) => {
  // Game state
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [level, setLevel] = useState(1);
  const [roundInLevel, setRoundInLevel] = useState(0);
  const [roundData, setRoundData] = useState<QutrabRoundData | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);
  // Track used triangle IDs to prevent repeats within a session
  const [usedTriangleIds, setUsedTriangleIds] = useState<Set<number>>(new Set());
  // Level-complete pearl: triangles seen this level + dive-deeper view
  const [levelTriangles, setLevelTriangles] = useState<QutrabTriangle[]>([]);
  const [showLevelDive, setShowLevelDive] = useState(false);
  const [levelCardSaved, setLevelCardSaved] = useState(false);

  // UI state
  const [showDifficultySelect, setShowDifficultySelect] = useState(false); // Start game directly, no difficulty selection
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<
    "fatha" | "damma" | "kasra" | null
  >(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  
  // أحسنت popup state
  const [showAhsantPopup, setShowAhsantPopup] = useState(false);
  const [ahsantMessage, setAhsantMessage] = useState<{
    title: string;
    content: string;
    verse?: string;
  } | null>(null);

  // Animation
  const fadeAnim = useState(new Animated.Value(0))[0];

  const difficultyConfig = DIFFICULTY_CONFIG[difficulty];

  // Load saved data
  useEffect(() => {
    loadSavedData();
  }, [playerId]);

  const loadSavedData = async () => {
    try {
      if (playerId) {
        const globalScores = await getGlobalScores(playerId);
        setHighScore(globalScores.qutrab_high_score);
      }

      // Check if we should resume a game
      if (resumeGame && playerId) {
        const savedSession = await getQutrabSession(playerId);
        if (savedSession && savedSession.is_paused === 1) {
          // Restore game state (difficulty follows the level)
          const savedLevel = savedSession.current_level;
          const savedDifficulty = difficultyForLevel(savedLevel);
          setDifficulty(savedDifficulty);
          setLevel(savedLevel);
          setRoundInLevel(savedSession.round_in_level);
          setScore(savedSession.score);
          setStreak(savedSession.streak);
          setShowDifficultySelect(false);

          // Generate a new round with fresh usedTriangleIds
          const newUsedIds = new Set<number>();
          const newRound = generateQutrabRound(savedDifficulty, newUsedIds);
          setRoundData(newRound);
          newUsedIds.add(newRound.triangle.id);
          setUsedTriangleIds(newUsedIds);
        }
      } else {
        // Start game directly without difficulty selection
        const newUsedIds = new Set<number>();
        const newRound = generateQutrabRound("easy", newUsedIds);
        setRoundData(newRound);
        newUsedIds.add(newRound.triangle.id);
        setUsedTriangleIds(newUsedIds);
      }

      setIsLoading(false);

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

  // Generate new round from the current difficulty tier, excluding used triangles
  const generateNewRound = useCallback(() => {
    const newRound = generateQutrabRound(difficulty, usedTriangleIds);
    setRoundData(newRound);
    setSelectedWord(null);
    setMatches([]);
    setRevealed(false);
    // Track this triangle as used
    setUsedTriangleIds((prev) => new Set([...prev, newRound.triangle.id]));
  }, [difficulty, usedTriangleIds]);

  // Start game at level 1 (easy tier)
  const handleStartGame = useCallback((selectedDifficulty?: Difficulty) => {
    const startDifficulty = selectedDifficulty || "easy";
    setDifficulty(startDifficulty);
    setShowDifficultySelect(false);
    setLevel(1);
    setRoundInLevel(0);
    setScore(0);
    setStreak(0);

    // Reset used triangles for new game session
    const newUsedIds = new Set<number>();
    const newRound = generateQutrabRound(startDifficulty, newUsedIds);
    setRoundData(newRound);
    setSelectedWord(null);
    setMatches([]);
    setRevealed(false);
    // Track this triangle as used
    newUsedIds.add(newRound.triangle.id);
    setUsedTriangleIds(newUsedIds);
  }, []);

  // Handle word selection
  const handleWordSelect = (wordKey: "fatha" | "damma" | "kasra") => {
    if (revealed) return;
    if (matches.some((m) => m.wordKey === wordKey)) return;
    setSelectedWord(wordKey);
  };

  // Handle meaning selection
  const handleMeaningSelect = (meaningKey: "fatha" | "damma" | "kasra") => {
    if (revealed) return;
    if (!selectedWord) {
      Alert.alert("تنبيه", "اختر الكلمة أولاً");
      return;
    }
    if (matches.some((m) => m.meaningKey === meaningKey)) return;

    const newMatch: Match = { wordKey: selectedWord, meaningKey };
    setMatches([...matches, newMatch]);
    setSelectedWord(null);
  };

  // Check if a match is correct
  const isMatchCorrect = (match: Match): boolean => {
    return match.wordKey === match.meaningKey;
  };

  // Calculate score
  const calculateRoundScore = useCallback(() => {
    return calculateQutrabRoundScore({
      correctMatches: matches.filter(isMatchCorrect).length,
      basePoints: difficultyConfig.basePoints,
      streak,
    });
  }, [matches, streak, difficultyConfig]);

  // Check answers - show أحسنت popup immediately after checking
  const handleCheckAnswers = useCallback(async () => {
    if (matches.length < 3) {
      Alert.alert("تنبيه", "الرجاء مطابقة جميع الكلمات بمعانيها");
      return;
    }

    setRevealed(true);

    const result = calculateRoundScore();
    const newScore = score + result.pointsEarned;
    setScore(newScore);

    // Remember this level's triangles for the pearl card
    if (roundData) {
      setLevelTriangles((prev) =>
        prev.some((t) => t.id === roundData.triangle.id)
          ? prev
          : [...prev, roundData.triangle]
      );
    }

    const newStreak = result.isPerfect ? streak + 1 : 0;
    setStreak(newStreak);

    if (playerId) {
      // Bank the points earned this round exactly once
      if (result.pointsEarned > 0) {
        await addToTotalScore(playerId, result.pointsEarned);
      }

      if (newScore > highScore) {
        setHighScore(newScore);
        await updateHighScore(playerId, "qutrab", newScore);
      }

      await updateTotalStreak(playerId, newStreak);
    } else if (newScore > highScore) {
      setHighScore(newScore);
    }

    // Show أحسنت popup IMMEDIATELY after checking answers
    if (roundData) {
      const triangle = roundData.triangle;
      const correctCount = result.correct;
      const summary =
        `${triangle.fatha.word}: ${triangle.fatha.meaning}\n` +
        `${triangle.kasra.word}: ${triangle.kasra.meaning}\n` +
        `${triangle.damma.word}: ${triangle.damma.meaning}`;
      let title = "";

      if (correctCount === 3) {
        title = `أحسنت! مثلث "${triangle.base}" ✅`;
      } else if (correctCount >= 1) {
        title = `جيد! ${correctCount}/3 إجابات صحيحة — مثلث "${triangle.base}"`;
      } else {
        title = `حاول مرة أخرى! — مثلث "${triangle.base}"`;
      }

      setAhsantMessage({
        title,
        content: summary,
        verse: triangle.verse,
      });
      setShowAhsantPopup(true);
    }
  }, [matches, calculateRoundScore, score, highScore, playerId, streak, roundData]);

  // Next round
  const handleNextRound = useCallback(async () => {
    const nextRoundInLevel = roundInLevel + 1;

    if (nextRoundInLevel >= difficultyConfig.roundsPerLevel) {
      // Save completed level to database.
      // (Round points were already banked in handleCheckAnswers.)
      if (playerId) {
        await saveCompletedLevel(playerId, "qutrab", level.toString());
        await saveGameHistory(playerId, "qutrab", score, streak, level);
      }
      setLevelCardSaved(false);
      setShowLevelComplete(true);
    } else {
      setRoundInLevel(nextRoundInLevel);
      generateNewRound();
    }
  }, [
    roundInLevel,
    difficultyConfig.roundsPerLevel,
    generateNewRound,
    playerId,
    level,
    score,
    streak,
  ]);

  const levelProverb = ARABIC_PROVERBS[(level - 1) % ARABIC_PROVERBS.length];

  // Sections of the level's dive-deeper card
  const buildLevelDiveSections = useCallback((): DiveSection[] => {
    const sections: DiveSection[] = [
      { heading: "📜 المثل", body: levelProverb.text, quote: levelProverb.meaning },
    ];
    if (levelTriangles.length > 0) {
      sections.push({
        heading: `🔺 مثلثات هذا المستوى (${levelTriangles.length})`,
        items: levelTriangles.map((t) => ({
          title: t.base,
          text:
            `${t.fatha.word}: ${t.fatha.meaning}\n` +
            `${t.kasra.word}: ${t.kasra.meaning}\n` +
            `${t.damma.word}: ${t.damma.meaning}`,
          note: t.verse ? `من نظم مثلث قطرب: ${t.verse.replace(/\n/g, " / ")}` : undefined,
        })),
      });
    }
    return sections;
  }, [levelProverb, levelTriangles]);

  // Save the level's pearl as a card in البطاقات
  const handleSaveLevelCard = useCallback(async () => {
    if (!playerId || levelCardSaved) return;
    try {
      await unlockCard(playerId, {
        id: `pearl-qutrab-L${level}-${(level - 1) % ARABIC_PROVERBS.length}`,
        title: `🦪 لؤلؤة مثلث قطرب — المستوى ${level}`,
        description: `${levelProverb.text} — ${levelProverb.meaning}`,
        notes: levelTriangles.map(
          (t) => `🔺 ${t.base}: ${t.fatha.word} / ${t.kasra.word} / ${t.damma.word}`
        ),
      });
      setLevelCardSaved(true);
    } catch (e) {
      console.error("Error saving level card:", e);
    }
  }, [playerId, levelCardSaved, level, levelProverb, levelTriangles]);

  // Next level - difficulty follows the level progression (easy → medium → hard)
  const handleNextLevel = useCallback(() => {
    setShowLevelComplete(false);
    setShowLevelDive(false);
    setLevelTriangles([]);
    const nextLevel = level + 1;
    const nextDifficulty = difficultyForLevel(nextLevel);

    setLevel(nextLevel);
    setDifficulty(nextDifficulty);
    setRoundInLevel(0);

    // Generate new round from the new tier (excluding used)
    const newRound = generateQutrabRound(nextDifficulty, usedTriangleIds);
    setRoundData(newRound);
    setSelectedWord(null);
    setMatches([]);
    setRevealed(false);
    // Track this triangle as used
    setUsedTriangleIds((prev) => new Set([...prev, newRound.triangle.id]));
  }, [level, usedTriangleIds]);

  // Reset game
  const handleResetGame = useCallback(() => {
    setShowPauseModal(false);
    Alert.alert("إعادة اللعب", "هل أنت متأكد من إعادة اللعب من البداية؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "نعم",
        onPress: async () => {
          if (playerId) {
            await clearQutrabSession(playerId);
          }
          setShowDifficultySelect(true);
          setLevel(1);
          setRoundInLevel(0);
          setScore(0);
          setStreak(0);
          setMatches([]);
          setRevealed(false);
          setShowLevelComplete(false);
          // Reset used triangles for fresh game
          setUsedTriangleIds(new Set());
        },
      },
    ]);
  }, [playerId]);

  // Pause game - save progress and show pause modal
  const handlePauseGame = useCallback(async () => {
    // Auto-save progress when pausing
    if (playerId) {
      await saveQutrabSession(playerId, {
        difficulty,
        currentLevel: level,
        roundInLevel,
        score,
        streak,
        isPaused: true,
      });
    }
    setShowPauseModal(true);
  }, [playerId, difficulty, level, roundInLevel, score, streak]);

  // Resume from pause
  const handleResumePause = useCallback(() => {
    setShowPauseModal(false);
  }, []);

  // Quit game with confirmation
  const handleQuitGame = useCallback(() => {
    Alert.alert("الخروج من اللعبة", "هل تريد حفظ التقدم والخروج؟", [
      {
        text: "إلغاء",
        style: "cancel",
        onPress: () => setShowPauseModal(false),
      },
      {
        text: "خروج بدون حفظ",
        style: "destructive",
        onPress: async () => {
          if (playerId) {
            await clearQutrabSession(playerId);
          }
          setShowPauseModal(false);
          if (onBack) onBack();
        },
      },
      {
        text: "حفظ والخروج",
        onPress: async () => {
          // Save current progress to SQLite.
          // (Earned points and streak are already banked per round.)
          if (playerId) {
            await saveQutrabSession(playerId, {
              difficulty,
              currentLevel: level,
              roundInLevel,
              score,
              streak,
              isPaused: true,
            });
          }
          setShowPauseModal(false);
          if (onBack) onBack();
        },
      },
    ]);
  }, [playerId, difficulty, level, roundInLevel, score, streak, onBack]);

  // Handle video reward - save progress before opening video
  const handleVideoReward = useCallback(async () => {
    // Save progress before watching video
    if (playerId) {
      await saveQutrabSession(playerId, {
        difficulty,
        currentLevel: level,
        roundInLevel,
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

  // Get color for word/meaning based on match state
  const getMatchColor = (
    key: "fatha" | "damma" | "kasra",
    type: "word" | "meaning"
  ) => {
    if (!revealed) {
      const matchIndex = matches.findIndex((m) =>
        type === "word" ? m.wordKey === key : m.meaningKey === key
      );
      if (matchIndex >= 0) {
        const colors = [COLORS.turquoise, COLORS.copperAccent, COLORS.burgundy];
        return colors[matchIndex % colors.length];
      }
      if (selectedWord === key && type === "word") {
        return COLORS.inkGold;
      }
      return null;
    }

    const match = matches.find((m) =>
      type === "word" ? m.wordKey === key : m.meaningKey === key
    );
    if (match) {
      return isMatchCorrect(match) ? COLORS.correct : COLORS.incorrect;
    }
    return null;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  // Difficulty selection
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
            {onBack && (
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Text style={styles.backButtonText}>← رجوع</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.gameTitle}>مثلث قطرب</Text>
            <Text style={styles.gameSubtitle}>
              طابق الكلمات بمعانيها حسب التشكيل
            </Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                الفَتْحَة (ـَ) • الضَّمَّة (ـُ) • الكَسْرَة (ـِ)
              </Text>
              <Text style={styles.infoSubtext}>
                تغيّر الحركة على الحرف الأول يغيّر المعنى
              </Text>
            </View>

            <Text style={styles.difficultyTitle}>اختر مستوى الصعوبة</Text>

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
                <Text style={styles.difficultyPoints}>
                  {DIFFICULTY_CONFIG[diff].basePoints} نقطة لكل مطابقة صحيحة
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

  // Level complete
  if (showLevelComplete) {
    const currentProverb = levelProverb;
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
              proverbMeaning={currentProverb.meaning ?? ""}
              onDive={() => setShowLevelDive(true)}
              diveLabel="اغطس لتعرف المزيد"
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

            <LevelDiveModal
              visible={showLevelDive}
              title={`لؤلؤة المستوى ${level}`}
              subtitle={`${difficultyConfig.nameAr} · ${levelTriangles.length} مثلث`}
              sections={buildLevelDiveSections()}
              onClose={() => setShowLevelDive(false)}
              onSaveCard={playerId ? handleSaveLevelCard : undefined}
              cardSaved={levelCardSaved}
            />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Main game
  return (
    <LinearGradient
      colors={[COLORS.parchment, COLORS.parchmentLight, COLORS.parchment]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.parchment} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.pauseButton}
              onPress={handlePauseGame}
            >
              <Text style={styles.pauseButtonText}>⏸️</Text>
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>مثلث قطرب</Text>
              <Text style={styles.difficultyBadge}>
                {difficultyConfig.nameAr}
              </Text>
            </View>

            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>النقاط</Text>
              <Text style={styles.scoreValue}>{score}</Text>
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

          {roundData && (
            <>
              {/* Base word display */}
              <View style={styles.baseWordContainer}>
                <Text style={styles.baseWordLabel}>الجذر:</Text>
                <Text style={styles.baseWord}>{roundData.triangle.base}</Text>
              </View>

              {/* Instructions */}
              <Text style={styles.instructions}>
                {selectedWord
                  ? "الآن اختر المعنى المناسب"
                  : "اختر الكلمة ثم طابقها بمعناها"}
              </Text>

              {/* Words section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>الكلمات</Text>
                <View style={styles.itemsRow}>
                  {roundData.words.map((item, index) => {
                    const matchColor = getMatchColor(item.key, "word");
                    const isMatched = matches.some(
                      (m) => m.wordKey === item.key
                    );
                    return (
                      <TouchableOpacity
                        key={`word-${index}`}
                        style={[
                          styles.wordCard,
                          matchColor && { borderColor: matchColor },
                          selectedWord === item.key && styles.wordCardSelected,
                          isMatched && styles.wordCardMatched,
                        ]}
                        onPress={() => handleWordSelect(item.key)}
                        disabled={revealed || isMatched}
                      >
                        <Text
                          style={[
                            styles.wordText,
                            matchColor && { color: matchColor },
                          ]}
                        >
                          {item.word}
                        </Text>
                        <Text style={styles.harakaLabel}>
                          {item.key === "fatha"
                            ? "فَتحة"
                            : item.key === "damma"
                            ? "ضَمّة"
                            : "كَسرة"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Meanings section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>المعاني</Text>
                <View style={styles.meaningsColumn}>
                  {roundData.meanings.map((item, index) => {
                    const matchColor = getMatchColor(item.key, "meaning");
                    const isMatched = matches.some(
                      (m) => m.meaningKey === item.key
                    );
                    return (
                      <TouchableOpacity
                        key={`meaning-${index}`}
                        style={[
                          styles.meaningCard,
                          matchColor && { borderColor: matchColor },
                          isMatched && styles.meaningCardMatched,
                        ]}
                        onPress={() => handleMeaningSelect(item.key)}
                        disabled={revealed || isMatched || !selectedWord}
                      >
                        <Text
                          style={[
                            styles.meaningCardText,
                            matchColor && { color: matchColor },
                          ]}
                        >
                          {item.meaning}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.actionButtons}>
                {!revealed ? (
                  <TouchableOpacity
                    style={[
                      styles.checkButton,
                      matches.length < 3 && styles.buttonDisabled,
                    ]}
                    onPress={handleCheckAnswers}
                    disabled={matches.length < 3}
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

              {/* Results after reveal */}
              {revealed && (
                <View style={styles.resultsContainer}>
                  <Text style={styles.resultsTitle}>النتيجة</Text>
                  {matches.map((match, index) => {
                    const isCorrect = isMatchCorrect(match);
                    const wordData = roundData.words.find(
                      (w) => w.key === match.wordKey
                    );
                    const meaningData = roundData.meanings.find(
                      (m) => m.key === match.meaningKey
                    );
                    return (
                      <View
                        key={index}
                        style={[
                          styles.resultItem,
                          isCorrect
                            ? styles.resultCorrect
                            : styles.resultIncorrect,
                        ]}
                      >
                        <Text style={styles.resultWord}>
                          {wordData?.word} {isCorrect ? "✓" : "✗"}
                        </Text>
                        <Text style={styles.resultMeaning}>
                          {meaningData?.meaning}
                        </Text>
                        {!isCorrect && (
                          <Text style={styles.correctAnswer}>
                            الإجابة الصحيحة:{" "}
                            {roundData.triangle[match.wordKey].meaning}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                  <Text style={styles.scoreResult}>
                    +{calculateRoundScore().pointsEarned} نقطة
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* أحسنت Popup Modal - shows immediately after checking answers */}
        <Modal
          visible={showAhsantPopup}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAhsantPopup(false)}
        >
          <View style={styles.ahsantOverlay}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.ahsantCard}
              onPress={() => setShowAhsantPopup(false)}
            >
              <Text style={styles.ahsantEmoji}>🤿</Text>
              <Text style={styles.ahsantTitle}>
                {ahsantMessage?.title || 'أحسنت!'}
              </Text>
              <Text style={styles.ahsantContent}>
                {ahsantMessage?.content || ''}
              </Text>
              {ahsantMessage?.verse ? (
                <View style={styles.ahsantVerseBox}>
                  <Text style={styles.ahsantVerseLabel}>من نظم مثلث قطرب:</Text>
                  <Text style={styles.ahsantVerse}>{ahsantMessage.verse}</Text>
                </View>
              ) : null}
              <Text style={styles.ahsantHint}>اضغط للمتابعة</Text>
            </TouchableOpacity>
          </View>
        </Modal>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: getResponsiveSize(SPACING.xxl, SPACING.xl, SPACING.xl),
  },
  // Difficulty selection
  difficultyContainer: {
    flex: 1,
    padding: getResponsiveSize(SPACING.xl, SPACING.md, SPACING.lg),
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: SPACING.lg,
    right: SPACING.lg,
    padding: SPACING.sm,
  },
  backButtonText: {
    fontSize: scaleFontSize(16),
    color: COLORS.inkBrown,
    ...FONTS.arabicText,
  },
  gameTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 32 : 40),
    color: COLORS.inkGold,
    textAlign: "center",
    marginBottom: SPACING.xs,
    ...FONTS.arabicTitle,
  },
  gameSubtitle: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.lg,
    ...FONTS.arabicText,
  },
  infoBox: {
    backgroundColor: COLORS.parchmentLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.inkGold,
  },
  infoText: {
    fontSize: scaleFontSize(isSmallDevice ? 16 : 20),
    color: COLORS.inkBrown,
    textAlign: "center",
    ...FONTS.arabicTitle,
  },
  infoSubtext: {
    fontSize: scaleFontSize(isSmallDevice ? 12 : 14),
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.xs,
    ...FONTS.arabicText,
  },
  difficultyTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 18 : 22),
    color: COLORS.inkBrown,
    textAlign: "center",
    marginBottom: SPACING.md,
    ...FONTS.arabicTitle,
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
  // Main game header
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
    fontSize: scaleFontSize(isSmallDevice ? 20 : 26),
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
  scoreContainer: {
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: scaleFontSize(isSmallDevice ? 10 : 12),
    color: COLORS.textSecondary,
    ...FONTS.arabicText,
  },
  scoreValue: {
    fontSize: scaleFontSize(isSmallDevice ? 18 : 22),
    color: COLORS.inkGold,
    ...FONTS.arabicTitle,
  },
  // Progress
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
  // Base word
  baseWordContainer: {
    alignItems: "center",
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.parchmentLight,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.inkGold,
    marginBottom: SPACING.md,
  },
  baseWordLabel: {
    fontSize: scaleFontSize(isSmallDevice ? 12 : 14),
    color: COLORS.textSecondary,
    ...FONTS.arabicText,
  },
  baseWord: {
    fontSize: scaleFontSize(isSmallDevice ? 36 : 48),
    color: COLORS.inkBrown,
    ...FONTS.arabicTitle,
  },
  instructions: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: COLORS.turquoise,
    textAlign: "center",
    marginBottom: SPACING.md,
    ...FONTS.arabicText,
  },
  // Sections
  sectionContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 16 : 18),
    color: COLORS.inkBrown,
    textAlign: "center",
    marginBottom: SPACING.sm,
    ...FONTS.arabicTitle,
  },
  itemsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: SPACING.sm,
  },
  wordCard: {
    flex: 1,
    backgroundColor: COLORS.parchmentLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.inkBrown,
    ...SHADOWS.small,
  },
  wordCardSelected: {
    borderColor: COLORS.inkGold,
    backgroundColor: COLORS.inkGoldLight,
  },
  wordCardMatched: {
    opacity: 0.7,
  },
  wordText: {
    fontSize: scaleFontSize(isSmallDevice ? 22 : 28),
    color: COLORS.inkBrown,
    ...FONTS.arabicTitle,
  },
  harakaLabel: {
    fontSize: scaleFontSize(isSmallDevice ? 10 : 12),
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    ...FONTS.arabicText,
  },
  meaningsColumn: {
    gap: SPACING.sm,
  },
  meaningCard: {
    backgroundColor: COLORS.parchmentLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.copperAccent,
    ...SHADOWS.small,
  },
  meaningCardMatched: {
    opacity: 0.7,
  },
  meaningCardText: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: COLORS.inkBrown,
    textAlign: "right",
    ...FONTS.arabicText,
  },
  // Action buttons
  actionButtons: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
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
  // Results
  resultsContainer: {
    margin: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.parchmentLight,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inkGold,
  },
  resultsTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 16 : 18),
    color: COLORS.inkBrown,
    textAlign: "center",
    marginBottom: SPACING.md,
    ...FONTS.arabicTitle,
  },
  resultItem: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  resultCorrect: {
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.correct,
  },
  resultIncorrect: {
    backgroundColor: "rgba(198, 40, 40, 0.1)",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.incorrect,
  },
  resultWord: {
    fontSize: scaleFontSize(isSmallDevice ? 16 : 18),
    color: COLORS.inkBrown,
    textAlign: "right",
    ...FONTS.arabicTitle,
  },
  resultMeaning: {
    fontSize: scaleFontSize(isSmallDevice ? 12 : 14),
    color: COLORS.textSecondary,
    textAlign: "right",
    ...FONTS.arabicText,
  },
  correctAnswer: {
    fontSize: scaleFontSize(isSmallDevice ? 11 : 13),
    color: COLORS.correct,
    textAlign: "right",
    marginTop: SPACING.xs,
    fontStyle: "italic",
    ...FONTS.arabicText,
  },
  scoreResult: {
    fontSize: scaleFontSize(isSmallDevice ? 18 : 22),
    color: COLORS.inkGold,
    textAlign: "center",
    marginTop: SPACING.md,
    ...FONTS.arabicTitle,
  },
  // Level complete
  levelCompleteContainer: {
    flex: 1,
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
    marginBottom: SPACING.xl,
    ...FONTS.arabicText,
  },
  levelScoreContainer: {
    alignItems: "center",
    padding: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
    backgroundColor: COLORS.parchmentLight,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.inkGold,
    marginVertical: SPACING.lg,
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
    marginTop: SPACING.lg,
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
  // أحسنت popup styles
  ahsantOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  ahsantCard: {
    backgroundColor: COLORS.parchment,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: "90%",
    maxWidth: 350,
    borderWidth: 3,
    borderColor: COLORS.inkGold,
    alignItems: "center",
    ...SHADOWS.large,
  },
  ahsantEmoji: {
    fontSize: scaleFontSize(50),
    marginBottom: SPACING.md,
  },
  ahsantTitle: {
    fontSize: scaleFontSize(22),
    color: COLORS.inkBrown,
    textAlign: "center",
    marginBottom: SPACING.md,
    ...FONTS.arabicTitle,
  },
  ahsantContent: {
    fontSize: scaleFontSize(14),
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: SPACING.md,
    ...FONTS.arabicText,
  },
  ahsantHint: {
    fontSize: scaleFontSize(12),
    color: COLORS.inkGold,
    textAlign: "center",
    marginTop: SPACING.sm,
    ...FONTS.arabicText,
  },
  ahsantVerseBox: {
    width: "100%",
    backgroundColor: COLORS.parchmentDark,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderRightWidth: 3,
    borderRightColor: COLORS.inkGold,
    marginBottom: SPACING.sm,
  },
  ahsantVerseLabel: {
    fontSize: scaleFontSize(11),
    color: COLORS.inkGold,
    textAlign: "right",
    marginBottom: 2,
    ...FONTS.arabicTitle,
  },
  ahsantVerse: {
    fontSize: scaleFontSize(13),
    color: COLORS.inkBrown,
    textAlign: "center",
    lineHeight: 22,
    fontStyle: "italic",
    ...FONTS.arabicText,
  },
});

export default QutrabScreen;
