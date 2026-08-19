import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  checkAndDownloadUpdate,
  applyDownloadedUpdate,
  getVersionInfo,
} from "../services/updates";
import { LinearGradient } from "expo-linear-gradient";
import {
  COLORS,
  FONTS,
  SHADOWS,
  BORDER_RADIUS,
  SPACING,
} from "../constants/theme";
import {
  getGlobalScores,
  getCompletedLevels,
  getUnlockedCards,
  UnlockedCard,
} from "../services/database";
import {
  scaleFontSize,
  isShortScreen,
} from "../utils/responsive";

const { width, height } = Dimensions.get("window");

// Height-aware spacing
const COMPACT_SPACING = {
  xs: isShortScreen ? 2 : 4,
  sm: isShortScreen ? 4 : 8,
  md: isShortScreen ? 8 : 12,
  lg: isShortScreen ? 12 : 16,
  xl: isShortScreen ? 16 : 24,
};

interface HomeScreenProps {
  onStartGame: (resume?: boolean) => void;
  onStartQutrab: (resume?: boolean) => void;
  onOpenVideoArchive?: () => void;
  playerName?: string | null;
  hasActiveRootsGame?: boolean;
  hasActiveQutrabGame?: boolean;
  playerId?: number;
  refreshKey?: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartGame,
  onStartQutrab,
  onOpenVideoArchive,
  playerName,
  hasActiveRootsGame = false,
  hasActiveQutrabGame = false,
  playerId,
  refreshKey = 0,
}) => {
  const [completedLevelsCount, setCompletedLevelsCount] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalStreak, setTotalStreak] = useState(0);
  const [unlockedCards, setUnlockedCards] = useState<UnlockedCard[]>([]);
  const [showUnlockedModal, setShowUnlockedModal] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const versionInfo = getVersionInfo();

  useEffect(() => {
    loadData();
  }, [playerId, refreshKey]);

  // «تحديثات»: let the player pull the latest OTA update on demand
  const handleCheckForUpdates = async () => {
    if (checkingUpdate) return;
    setCheckingUpdate(true);
    try {
      const result = await checkAndDownloadUpdate();
      switch (result.status) {
        case "unavailable":
          Alert.alert("التحديثات", result.reason);
          break;
        case "up-to-date":
          Alert.alert(
            "لا توجد تحديثات",
            `أنت تستخدم أحدث إصدار (v${versionInfo.appVersion}).`
          );
          break;
        case "downloaded":
          Alert.alert(
            "تم تنزيل التحديث ✅",
            "سيُعاد تشغيل اللعبة الآن لتطبيق التعديلات الجديدة.",
            [
              {
                text: "إعادة التشغيل",
                onPress: () => {
                  applyDownloadedUpdate().catch(() => {
                    Alert.alert(
                      "تنبيه",
                      "تعذّر إعادة التشغيل تلقائياً. أغلق اللعبة وافتحها من جديد لتطبيق التحديث."
                    );
                  });
                },
              },
            ],
            { cancelable: false }
          );
          break;
        case "error":
          Alert.alert(
            "تعذّر التحقق من التحديثات",
            "تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى.\n\n" + result.message
          );
          break;
      }
    } finally {
      setCheckingUpdate(false);
    }
  };

  const loadData = async () => {
    if (!playerId) return;

    try {
      const [globalScore, rootsLevels, qutrabLevels, cards] =
        await Promise.all([
          getGlobalScores(playerId),
          getCompletedLevels(playerId, "roots"),
          getCompletedLevels(playerId, "qutrab"),
          getUnlockedCards(playerId),
        ]);

      setTotalScore(globalScore.total_score);
      setTotalStreak(globalScore.total_streak);
      setCompletedLevelsCount(rootsLevels.length + qutrabLevels.length);
      setUnlockedCards(cards);
    } catch (e) {
      console.error("Error loading home data:", e);
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "صباح الخير";
    if (hour >= 12 && hour < 17) return "مساء الخير";
    if (hour >= 17 && hour < 21) return "مساء النور";
    return "ليلة سعيدة";
  };

  return (
    <LinearGradient
      colors={[COLORS.parchmentDark, COLORS.parchment, COLORS.parchmentDark]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.parchmentDark}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Decorative Border */}
          <View style={styles.decorativeBorder}>
            <View style={styles.innerBorder}>
              {/* Player Greeting */}
              {playerName && (
                <View style={styles.greetingSection}>
                  <Text style={styles.greetingText}>
                    {getGreeting()}، {playerName}! 👋
                  </Text>
                </View>
              )}

              {/* Title Section */}
              <View style={styles.titleSection}>
                <View style={styles.titleDecoration}>
                  <View style={styles.decorLine} />
                  <View style={styles.decorDiamond} />
                  <View style={styles.decorLine} />
                </View>

                <Text style={styles.arabicTitle}>لُعبَة الجُذُور</Text>
                <Text style={styles.subtitle}>أصول الكلمات العربية</Text>

                <View style={styles.titleDecoration}>
                  <View style={styles.decorLine} />
                  <View style={styles.decorDiamond} />
                  <View style={styles.decorLine} />
                </View>
              </View>

              {/* Arabic Quote */}
              <View style={styles.quoteSection}>
                <Text style={styles.quoteText}>
                  «كم من جذرٍ في بطون المعاجم نائم .. يُحييه سائلُكُم بِحُسْنِ
                  طَلَبِ»
                </Text>
              </View>

              {/* Total Score Display */}
              <View style={styles.totalScoreContainer}>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreBoxLabel}>إجمالي النقاط</Text>
                  <Text style={styles.scoreBoxValue}>{totalScore}</Text>
                </View>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreBoxLabel}>أعلى سلسلة</Text>
                  <Text style={styles.scoreBoxValue}>{totalStreak} 🔥</Text>
                </View>
                <TouchableOpacity
                  style={styles.unlockedShortcut}
                  onPress={() => setShowUnlockedModal(true)}
                >
                  <Text style={styles.unlockedShortcutText}>📚 البطاقات</Text>
                </TouchableOpacity>
              </View>

              {/* Unlocked Cards Modal */}
              <Modal visible={showUnlockedModal} transparent animationType="slide">
                <View style={styles.unlockedOverlay}>
                  <View style={styles.unlockedContainer}>
                    <Text style={styles.unlockedTitle}>البطاقات المفتوحة</Text>
                    <ScrollView style={{ flex: 1, width: '100%' }}>
                      {unlockedCards.length === 0 ? (
                        <Text style={styles.unlockedEmpty}>لم تفتح أي بطاقة بعد</Text>
                      ) : (
                        unlockedCards.map((card) => (
                          <View key={card.id} style={styles.unlockedCard}>
                            <Text style={styles.unlockedCardTitle}>{card.title || `بطاقة ${card.id}`}</Text>
                            {card.description && (
                              <Text style={styles.unlockedCardAnalysis}>{card.description}</Text>
                            )}
                          </View>
                        ))
                      )}
                    </ScrollView>
                    <TouchableOpacity style={styles.unlockedClose} onPress={() => setShowUnlockedModal(false)}>
                      <Text style={styles.unlockedCloseText}>إغلاق</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              {/* Resume Section - Show if there are active games */}
              {(hasActiveRootsGame || hasActiveQutrabGame) && (
                <View style={styles.resumeSection}>
                  <Text style={styles.resumeTitle}>🎮 متابعة اللعب</Text>

                  {hasActiveRootsGame && (
                    <TouchableOpacity
                      style={styles.resumeButton}
                      onPress={() => onStartGame(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.resumeButtonText}>
                        استكمال لعبة الجذور
                      </Text>
                      <Text style={styles.resumeButtonHint}>
                        لديك لعبة متوقفة مؤقتاً
                      </Text>
                    </TouchableOpacity>
                  )}

                  {hasActiveQutrabGame && (
                    <TouchableOpacity
                      style={[styles.resumeButton, styles.resumeButtonQutrab]}
                      onPress={() => onStartQutrab(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.resumeButtonText}>
                        استكمال مثلث قطرب
                      </Text>
                      <Text style={styles.resumeButtonHint}>
                        لديك لعبة متوقفة مؤقتاً
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Buttons */}
              <View style={styles.buttonSection}>
                <Text style={styles.gameModeTitle}>اختر اللعبة</Text>

                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => onStartGame(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.playButtonText}>🌱 لُعبَة الجُذُور</Text>
                  <Text style={styles.gameDescription}>
                    اكتشف الجذور الصحيحة من الحروف
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.qutrabButton}
                  onPress={() => onStartQutrab(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.qutrabButtonText}>△ مُثَلَّث قُطرُب</Text>
                  <Text style={styles.gameDescription}>
                    طابق الكلمات بمعانيها حسب التشكيل
                  </Text>
                </TouchableOpacity>

                {/* Level selection removed for unified flow */}
              </View>

              {/* Video Archive Button */}
              {onOpenVideoArchive && (
                <TouchableOpacity
                  style={styles.archiveButton}
                  onPress={onOpenVideoArchive}
                  activeOpacity={0.8}
                >
                  <Text style={styles.archiveButtonText}>
                    📼 أرشيف الفيديوهات
                  </Text>
                </TouchableOpacity>
              )}

              {/* Updates button — pull the latest OTA release on demand */}
              <TouchableOpacity
                style={[styles.updateButton, checkingUpdate && styles.updateButtonBusy]}
                onPress={handleCheckForUpdates}
                disabled={checkingUpdate}
                activeOpacity={0.8}
              >
                {checkingUpdate ? (
                  <ActivityIndicator size="small" color={COLORS.inkBrown} />
                ) : (
                  <Text style={styles.updateButtonText}>⬇️ تنزيل التحديثات</Text>
                )}
                <Text style={styles.updateButtonHint}>
                  الإصدار {versionInfo.appVersion}
                  {versionInfo.updateId
                    ? ` · تحديث ${versionInfo.updateId.slice(0, 8)}`
                    : versionInfo.isEmbedded
                    ? " · الإصدار المضمّن"
                    : ""}
                </Text>
              </TouchableOpacity>

              {/* Footer with Islamic Pattern hint */}
              <View style={styles.footer}>
                <View style={styles.footerPattern}>
                  {[...Array(5)].map((_, i) => (
                    <View key={i} style={styles.patternDot} />
                  ))}
                </View>
                <Text style={styles.footerText}>اكتشف جمال اللغة العربية</Text>
                <Text style={styles.completedText}>
                  {completedLevelsCount} مستوى مكتمل
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: COMPACT_SPACING.sm,
    minHeight: "100%",
  },
  decorativeBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.inkGold,
    borderRadius: BORDER_RADIUS.lg,
    padding: COMPACT_SPACING.xs,
    backgroundColor: COLORS.parchment,
    ...SHADOWS.medium,
  },
  innerBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.copperAccent,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: COMPACT_SPACING.md,
    paddingVertical: COMPACT_SPACING.sm,
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingSection: {
    marginBottom: COMPACT_SPACING.xs,
  },
  greetingText: {
    fontSize: scaleFontSize(isShortScreen ? 14 : 16),
    color: COLORS.turquoise,
    textAlign: "center",
    ...FONTS.arabicText,
  },
  titleSection: {
    alignItems: "center",
  },
  titleDecoration: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: COMPACT_SPACING.xs,
  },
  decorLine: {
    width: isShortScreen ? 35 : 50,
    height: 2,
    backgroundColor: COLORS.inkGold,
  },
  decorDiamond: {
    width: isShortScreen ? 8 : 12,
    height: isShortScreen ? 8 : 12,
    backgroundColor: COLORS.inkGold,
    transform: [{ rotate: "45deg" }],
    marginHorizontal: COMPACT_SPACING.sm,
  },
  arabicTitle: {
    fontSize: scaleFontSize(isShortScreen ? 32 : 40),
    color: COLORS.inkBrown,
    marginBottom: 0,
    ...FONTS.arabicTitle,
  },
  subtitle: {
    fontSize: scaleFontSize(isShortScreen ? 13 : 16),
    color: COLORS.textSecondary,
    ...FONTS.arabicText,
  },
  quoteSection: {
    paddingHorizontal: COMPACT_SPACING.md,
    paddingVertical: COMPACT_SPACING.xs,
    marginTop: COMPACT_SPACING.xs,
    marginBottom: COMPACT_SPACING.sm,
    backgroundColor: COLORS.parchmentDark,
    borderRadius: BORDER_RADIUS.sm,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.inkGold,
  },
  quoteText: {
    fontSize: scaleFontSize(isShortScreen ? 11 : 13),
    color: COLORS.inkBrown,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: isShortScreen ? 18 : 22,
    ...FONTS.arabicText,
  },
  descriptionSection: {
    paddingHorizontal: COMPACT_SPACING.md,
    marginVertical: COMPACT_SPACING.sm,
  },
  description: {
    fontSize: scaleFontSize(14),
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    ...FONTS.arabicText,
  },
  highScoreContainer: {
    alignItems: "center",
    backgroundColor: COLORS.parchmentDark,
    paddingVertical: COMPACT_SPACING.sm,
    paddingHorizontal: COMPACT_SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.inkGold,
    marginBottom: COMPACT_SPACING.sm,
  },
  highScoreLabel: {
    fontSize: scaleFontSize(12),
    color: COLORS.textSecondary,
    ...FONTS.arabicText,
  },
  highScoreValue: {
    fontSize: scaleFontSize(isShortScreen ? 24 : 32),
    color: COLORS.inkGold,
    ...FONTS.arabicTitle,
  },
  completedText: {
    fontSize: scaleFontSize(10),
    color: COLORS.turquoise,
    marginTop: 2,
    ...FONTS.arabicText,
  },
  buttonSection: {
    width: "100%",
    gap: COMPACT_SPACING.sm,
  },
  gameModeTitle: {
    fontSize: scaleFontSize(isShortScreen ? 16 : 18),
    color: COLORS.inkBrown,
    textAlign: "center",
    marginBottom: COMPACT_SPACING.xs,
    ...FONTS.arabicTitle,
  },
  gameDescription: {
    fontSize: scaleFontSize(10),
    color: COLORS.textLight,
    marginTop: 2,
    opacity: 0.9,
    ...FONTS.arabicText,
  },
  playButton: {
    backgroundColor: COLORS.turquoise,
    paddingVertical: COMPACT_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    ...SHADOWS.small,
  },
  playButtonText: {
    fontSize: scaleFontSize(isShortScreen ? 18 : 20),
    color: COLORS.textLight,
    ...FONTS.arabicTitle,
  },
  qutrabButton: {
    backgroundColor: COLORS.copperAccent,
    paddingVertical: COMPACT_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    ...SHADOWS.small,
  },
  qutrabButtonText: {
    fontSize: scaleFontSize(isShortScreen ? 18 : 20),
    color: COLORS.textLight,
    ...FONTS.arabicTitle,
  },
  levelSelectButton: {
    backgroundColor: COLORS.parchmentLight,
    paddingVertical: COMPACT_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.inkBrown,
  },
  levelSelectText: {
    fontSize: scaleFontSize(isShortScreen ? 14 : 16),
    color: COLORS.inkBrown,
    ...FONTS.arabicText,
  },
  levelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: COMPACT_SPACING.xs,
    marginTop: COMPACT_SPACING.sm,
    paddingHorizontal: COMPACT_SPACING.sm,
  },
  levelButton: {
    width: isShortScreen ? 38 : 45,
    height: isShortScreen ? 38 : 45,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.parchmentLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.inkBrown,
    position: "relative",
  },
  levelCompleted: {
    backgroundColor: COLORS.correctLight,
    borderColor: COLORS.correct,
  },
  levelLocked: {
    backgroundColor: COLORS.parchmentDark,
    borderColor: COLORS.textSecondary,
    opacity: 0.6,
  },
  levelNumber: {
    fontSize: scaleFontSize(isShortScreen ? 16 : 18),
    color: COLORS.inkBrown,
    ...FONTS.arabicTitle,
  },
  levelNumberCompleted: {
    color: COLORS.textLight,
  },
  levelNumberLocked: {
    fontSize: scaleFontSize(14),
  },
  checkMark: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.correct,
    color: COLORS.textLight,
    width: 14,
    height: 14,
    borderRadius: 7,
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
    overflow: "hidden",
  },
  footer: {
    alignItems: "center",
    marginTop: COMPACT_SPACING.sm,
  },
  footerPattern: {
    flexDirection: "row",
    gap: COMPACT_SPACING.xs,
    marginBottom: COMPACT_SPACING.xs,
  },
  patternDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.inkGold,
  },
  footerText: {
    fontSize: scaleFontSize(12),
    color: COLORS.copperAccent,
    ...FONTS.arabicText,
  },
  // New styles for enhanced features
  totalScoreContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: COMPACT_SPACING.sm,
    gap: COMPACT_SPACING.sm,
  },
  scoreBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.parchmentDark,
    paddingVertical: COMPACT_SPACING.xs,
    paddingHorizontal: COMPACT_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.ornamentBorder,
  },
  scoreBoxLabel: {
    fontSize: scaleFontSize(10),
    color: COLORS.textSecondary,
    ...FONTS.arabicText,
  },
  scoreBoxValue: {
    fontSize: scaleFontSize(isShortScreen ? 18 : 20),
    color: COLORS.inkGold,
    marginTop: 1,
    ...FONTS.arabicTitle,
  },
  unlockedShortcut: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.parchmentDark,
    paddingVertical: COMPACT_SPACING.xs,
    paddingHorizontal: COMPACT_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.inkGold,
  },
  unlockedShortcutText: {
    fontSize: scaleFontSize(12),
    color: COLORS.inkBrown,
    ...FONTS.arabicTitle,
  },
  resumeSection: {
    width: "100%",
    backgroundColor: COLORS.parchmentLight,
    borderRadius: BORDER_RADIUS.md,
    padding: COMPACT_SPACING.sm,
    marginBottom: COMPACT_SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.inkGold,
    borderStyle: "dashed",
  },
  resumeTitle: {
    fontSize: scaleFontSize(14),
    color: COLORS.inkBrown,
    textAlign: "center",
    marginBottom: COMPACT_SPACING.xs,
    ...FONTS.arabicTitle,
  },
  resumeButton: {
    backgroundColor: COLORS.turquoise,
    paddingVertical: COMPACT_SPACING.xs,
    paddingHorizontal: COMPACT_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
    marginBottom: COMPACT_SPACING.xs,
  },
  resumeButtonQutrab: {
    backgroundColor: COLORS.copperAccent,
  },
  resumeButtonText: {
    fontSize: scaleFontSize(12),
    color: COLORS.textLight,
    ...FONTS.arabicTitle,
  },
  resumeButtonHint: {
    fontSize: scaleFontSize(9),
    color: COLORS.textLight,
    opacity: 0.8,
    marginTop: 1,
    ...FONTS.arabicText,
  },
  archiveButton: {
    width: "100%",
    backgroundColor: COLORS.parchmentLight,
    paddingVertical: COMPACT_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
    marginTop: COMPACT_SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.ornamentBorder,
  },
  archiveButtonText: {
    fontSize: scaleFontSize(12),
    color: COLORS.inkBrown,
    ...FONTS.arabicText,
  },
  updateButton: {
    width: "100%",
    backgroundColor: COLORS.parchmentDark,
    paddingVertical: COMPACT_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
    marginTop: COMPACT_SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.turquoise,
    minHeight: 40,
    justifyContent: "center",
  },
  updateButtonBusy: {
    opacity: 0.7,
  },
  updateButtonText: {
    fontSize: scaleFontSize(12),
    color: COLORS.turquoise,
    ...FONTS.arabicTitle,
  },
  updateButtonHint: {
    fontSize: scaleFontSize(9),
    color: COLORS.textSecondary,
    marginTop: 1,
    ...FONTS.arabicText,
  },
  unlockedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: COMPACT_SPACING.md,
  },
  unlockedContainer: {
    width: '100%',
    maxWidth: 360,
    maxHeight: 520,
    backgroundColor: COLORS.parchment,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.inkGold,
    padding: COMPACT_SPACING.md,
  },
  unlockedTitle: {
    fontSize: scaleFontSize(18),
    color: COLORS.inkBrown,
    marginBottom: COMPACT_SPACING.sm,
    textAlign: 'center',
    ...FONTS.arabicTitle,
  },
  unlockedEmpty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
  unlockedCard: {
    marginBottom: COMPACT_SPACING.sm,
    padding: COMPACT_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ornamentBorder,
  },
  unlockedCardTitle: {
    fontSize: scaleFontSize(14),
    color: COLORS.inkBrown,
    ...FONTS.arabicTitle,
  },
  unlockedCardAnalysis: {
    fontSize: scaleFontSize(12),
    color: COLORS.textSecondary,
    ...FONTS.arabicText,
  },
  unlockedClose: {
    marginTop: COMPACT_SPACING.sm,
    backgroundColor: COLORS.turquoise,
    paddingVertical: COMPACT_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  unlockedCloseText: {
    color: COLORS.textLight,
    fontSize: scaleFontSize(14),
    ...FONTS.arabicTitle,
  },
});
