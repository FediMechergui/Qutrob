import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  COLORS,
  FONTS,
  SHADOWS,
  BORDER_RADIUS,
  SPACING,
} from "../constants/theme";
import { scaleFontSize } from "../utils/responsive";

const { height } = Dimensions.get("window");
const isSmallDevice = Dimensions.get("window").width < 360;

/** One block of the deep-dive card. */
export interface DiveSection {
  heading: string;
  body?: string;
  /** Optional list of sub-items (e.g. roots or triangle words with their meanings). */
  items?: { title: string; text: string; note?: string }[];
  /** Quoted block (verse, Lisān excerpt…). */
  quote?: string;
}

interface LevelDiveModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  sections: DiveSection[];
  onClose: () => void;
  /** When provided, shows a "save card" action. */
  onSaveCard?: () => void;
  cardSaved?: boolean;
}

/**
 * "Dive deeper" view opened from the scuba-diver icon in the level-complete
 * clam. Presents the full context behind the pearl: the proverb with its
 * explanation, a «هل تعلم» fact, and everything learned in the level.
 */
export const LevelDiveModal: React.FC<LevelDiveModalProps> = ({
  visible,
  title,
  subtitle,
  sections,
  onClose,
  onSaveCard,
  cardSaved = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.diver}>🤿</Text>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
          </View>
          <View style={styles.headerDecor}>
            <View style={styles.decorLine} />
            <View style={styles.decorDiamond} />
            <View style={styles.decorLine} />
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {sections.map((section, idx) => (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionHeading}>{section.heading}</Text>
                {section.body ? (
                  <Text style={styles.sectionBody}>{section.body}</Text>
                ) : null}
                {section.quote ? (
                  <View style={styles.quoteBox}>
                    <Text style={styles.quoteText}>{section.quote}</Text>
                  </View>
                ) : null}
                {section.items?.map((item, i) => (
                  <View key={i} style={styles.item}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemText}>{item.text}</Text>
                    {item.note ? (
                      <Text style={styles.itemNote}>{item.note}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {onSaveCard ? (
              <TouchableOpacity
                style={[styles.saveButton, cardSaved && styles.saveButtonDone]}
                onPress={onSaveCard}
                disabled={cardSaved}
              >
                <Text style={styles.saveButtonText}>
                  {cardSaved ? "✓ حُفظت البطاقة" : "🦪 احفظ هذه اللؤلؤة في بطاقاتي"}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>اصعد إلى السطح ↑</Text>
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
    backgroundColor: "rgba(10, 40, 60, 0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: height * 0.88,
    backgroundColor: COLORS.parchment,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: COLORS.turquoise,
    paddingTop: SPACING.md,
    ...SHADOWS.large,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  diver: {
    fontSize: scaleFontSize(36),
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: scaleFontSize(isSmallDevice ? 18 : 22),
    color: COLORS.inkBrown,
    textAlign: "right",
    ...FONTS.arabicTitle,
  },
  subtitle: {
    fontSize: scaleFontSize(12),
    color: COLORS.turquoise,
    textAlign: "right",
    marginTop: 2,
    ...FONTS.arabicText,
  },
  headerDecor: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: SPACING.sm,
  },
  decorLine: {
    width: 50,
    height: 2,
    backgroundColor: COLORS.turquoise,
  },
  decorDiamond: {
    width: 10,
    height: 10,
    backgroundColor: COLORS.turquoise,
    transform: [{ rotate: "45deg" }],
    marginHorizontal: SPACING.sm,
  },
  content: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  section: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.parchmentLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.ornamentBorder,
  },
  sectionHeading: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: COLORS.turquoise,
    textAlign: "right",
    marginBottom: SPACING.xs,
    ...FONTS.arabicTitle,
  },
  sectionBody: {
    fontSize: scaleFontSize(isSmallDevice ? 13 : 15),
    color: COLORS.inkBrown,
    textAlign: "right",
    lineHeight: isSmallDevice ? 22 : 26,
    ...FONTS.arabicText,
  },
  quoteBox: {
    backgroundColor: COLORS.parchmentDark,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    borderRightWidth: 3,
    borderRightColor: COLORS.inkGold,
    marginTop: SPACING.xs,
  },
  quoteText: {
    fontSize: scaleFontSize(isSmallDevice ? 12 : 14),
    color: COLORS.inkBrown,
    textAlign: "center",
    lineHeight: 22,
    fontStyle: "italic",
    ...FONTS.arabicText,
  },
  item: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.ornamentBorder,
  },
  itemTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 15 : 17),
    color: COLORS.inkGold,
    textAlign: "right",
    ...FONTS.arabicTitle,
  },
  itemText: {
    fontSize: scaleFontSize(isSmallDevice ? 12 : 14),
    color: COLORS.textSecondary,
    textAlign: "right",
    lineHeight: 22,
    ...FONTS.arabicText,
  },
  itemNote: {
    fontSize: scaleFontSize(11),
    color: COLORS.turquoise,
    textAlign: "right",
    marginTop: 2,
    fontStyle: "italic",
    ...FONTS.arabicText,
  },
  actions: {
    padding: SPACING.md,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.ornamentBorder,
  },
  saveButton: {
    backgroundColor: COLORS.inkGold,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  saveButtonDone: {
    backgroundColor: COLORS.correct,
  },
  saveButtonText: {
    fontSize: scaleFontSize(14),
    color: COLORS.parchment,
    ...FONTS.arabicTitle,
  },
  closeButton: {
    backgroundColor: COLORS.turquoise,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: scaleFontSize(14),
    color: COLORS.textLight,
    ...FONTS.arabicTitle,
  },
});

export default LevelDiveModal;
