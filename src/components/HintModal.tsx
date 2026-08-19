import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import {
  COLORS,
  FONTS,
  SHADOWS,
  BORDER_RADIUS,
  SPACING,
} from "../constants/theme";
import { scaleFontSize, wp, hp } from "../utils/responsive";

const { width } = Dimensions.get("window");
const isSmallDevice = width < 360;
const isMediumDevice = width >= 360 && width < 414;

const getResponsiveSize = (base: number, small: number, medium: number) => {
  if (isSmallDevice) return small;
  if (isMediumDevice) return medium;
  return base;
};

interface HintModalProps {
  visible: boolean;
  hints: { title: string; text: string; meaning?: string }[];
  hintsUsed: number;
  maxHints: number;
  /** Points deducted for the next hint (escalates per hint and difficulty). */
  nextHintCost?: number;
  onUseHint: () => void;
  onClose: () => void;
}

export const HintModal: React.FC<HintModalProps> = ({
  visible,
  hints,
  hintsUsed,
  maxHints,
  nextHintCost = 10,
  onUseHint,
  onClose,
}) => {
  const canUseHint = hintsUsed < maxHints && hintsUsed < hints.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>💡 التلميحات</Text>
            <Text style={styles.hintsCount}>
              {hintsUsed} / {maxHints}
            </Text>
          </View>

          {/* Decorative line */}
          <View style={styles.decorativeLine}>
            <View style={styles.lineSegment} />
            <View style={styles.lineDiamond} />
            <View style={styles.lineSegment} />
          </View>

          {/* Hints list */}
          <View style={styles.hintsList}>
            {hints.slice(0, hintsUsed).map((hint, index) => (
              <View key={index} style={styles.hintItem}>
                <View style={styles.hintNumber}>
                  <Text style={styles.hintNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.hintContent}>
                  <Text style={styles.hintTitle}>{hint.title}</Text>
                  <Text style={styles.hintText}>{hint.text}</Text>
                  {hint.meaning && (
                    <Text style={styles.hintMeaning}>{hint.meaning}</Text>
                  )}
                </View>
              </View>
            ))}

            {hintsUsed === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>لم تستخدم أي تلميحات بعد</Text>
                <Text style={styles.emptySubtext}>
                  التلميحات تتدرج من الأسهل إلى الأوضح، وتزداد كلفتها
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.useHintButton,
                !canUseHint && styles.disabledButton,
              ]}
              onPress={onUseHint}
              disabled={!canUseHint}
            >
              <Text style={styles.useHintText}>
                {canUseHint
                  ? `استخدم تلميح (−${nextHintCost} نقطة)`
                  : "لا توجد تلميحات متاحة"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(44, 24, 16, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: getResponsiveSize(SPACING.lg, SPACING.md, SPACING.md),
  },
  container: {
    width: wp(90),
    maxWidth: Math.min(wp(90), 360),
    backgroundColor: COLORS.parchment,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: isSmallDevice ? 2 : 3,
    borderColor: COLORS.inkGold,
    overflow: "hidden",
    ...SHADOWS.large,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
    backgroundColor: COLORS.parchmentDark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inkGold,
  },
  title: {
    fontSize: scaleFontSize(isSmallDevice ? 18 : 20),
    color: COLORS.inkBrown,
    ...FONTS.arabicTitle,
  },
  hintsCount: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: COLORS.turquoise,
    ...FONTS.arabicText,
    backgroundColor: COLORS.parchmentLight,
    paddingHorizontal: getResponsiveSize(SPACING.sm, SPACING.xs, SPACING.xs),
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  decorativeLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
  },
  lineSegment: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.inkGold,
    marginHorizontal: SPACING.md,
  },
  lineDiamond: {
    width: isSmallDevice ? 8 : 10,
    height: isSmallDevice ? 8 : 10,
    backgroundColor: COLORS.inkGold,
    transform: [{ rotate: "45deg" }],
  },
  hintsList: {
    padding: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
    minHeight: isSmallDevice ? 120 : 150,
  },
  hintItem: {
    flexDirection: "row-reverse",
    marginBottom: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
    backgroundColor: COLORS.parchmentLight,
    borderRadius: BORDER_RADIUS.md,
    padding: getResponsiveSize(SPACING.sm, SPACING.xs, SPACING.xs),
    borderWidth: 1,
    borderColor: COLORS.copperAccent,
  },
  hintNumber: {
    width: isSmallDevice ? 24 : 28,
    height: isSmallDevice ? 24 : 28,
    borderRadius: isSmallDevice ? 12 : 14,
    backgroundColor: COLORS.turquoise,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: getResponsiveSize(SPACING.sm, SPACING.xs, SPACING.xs),
  },
  hintNumberText: {
    color: COLORS.textLight,
    fontSize: scaleFontSize(isSmallDevice ? 12 : 14),
    fontWeight: "bold",
  },
  hintContent: {
    flex: 1,
  },
  hintTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: COLORS.inkBrown,
    marginBottom: SPACING.xs,
    textAlign: "right",
    ...FONTS.arabicTitle,
  },
  hintText: {
    fontSize: scaleFontSize(isSmallDevice ? 12 : 14),
    color: COLORS.textSecondary,
    lineHeight: isSmallDevice ? 20 : 22,
    textAlign: "right",
    ...FONTS.arabicText,
  },
  hintMeaning: {
    fontSize: scaleFontSize(isSmallDevice ? 10 : 12),
    color: COLORS.turquoise,
    marginTop: SPACING.xs,
    fontStyle: "italic",
    textAlign: "right",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: getResponsiveSize(SPACING.xl, SPACING.lg, SPACING.lg),
  },
  emptyText: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: COLORS.textSecondary,
    ...FONTS.arabicText,
  },
  emptySubtext: {
    fontSize: scaleFontSize(isSmallDevice ? 11 : 13),
    color: COLORS.copperAccent,
    marginTop: SPACING.xs,
  },
  actions: {
    padding: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
    gap: SPACING.sm,
  },
  useHintButton: {
    backgroundColor: COLORS.turquoise,
    paddingVertical: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    ...SHADOWS.small,
  },
  disabledButton: {
    backgroundColor: COLORS.parchmentDark,
    opacity: 0.6,
  },
  useHintText: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: COLORS.textLight,
    ...FONTS.arabicText,
  },
  closeButton: {
    backgroundColor: COLORS.parchmentLight,
    paddingVertical: getResponsiveSize(SPACING.md, SPACING.sm, SPACING.sm),
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.inkBrown,
  },
  closeText: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: COLORS.inkBrown,
    ...FONTS.arabicText,
  },
});
