import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS, SHADOWS, BORDER_RADIUS, SPACING } from '../constants/theme';
import { scaleFontSize } from '../utils/responsive';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 360;

interface RootDefinitionModalProps {
  visible: boolean;
  root: string;
  meaning: string;
  poetryExample?: string;
  onClose: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  /** Where the meaning comes from: hand annotation, Lisān excerpt, or none. */
  source?: 'annotated' | 'lisan' | 'none';
  /** The root's Lisān al-ʿArab excerpt, shown as extra context when the meaning is annotated. */
  lisanExcerpt?: string;
}

export const RootDefinitionModal: React.FC<RootDefinitionModalProps> = ({
  visible,
  root,
  meaning,
  poetryExample,
  onClose,
  difficulty,
  source = 'annotated',
  lisanExcerpt,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.rootText}>{root}</Text>
              {difficulty && (
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>
                    {difficulty === 'easy' ? 'سهل' : difficulty === 'medium' ? 'متوسط' : 'صعب'}
                  </Text>
                </View>
              )}
              <View style={styles.headerDecor}>
                <View style={styles.decorLine} />
                <View style={styles.decorDiamond} />
                <View style={styles.decorLine} />
              </View>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Meaning */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {source === 'lisan' ? '📖 جاء في لسان العرب' : '📖 المعنى'}
                </Text>
                <Text style={styles.meaningText}>{meaning}</Text>
                {source === 'lisan' && (
                  <Text style={styles.sourceNote}>
                    نص ابن منظور كما ورد في لسان العرب (ويكي مصدر)
                  </Text>
                )}
              </View>

              {/* Lisān excerpt alongside a hand-written meaning */}
              {source === 'annotated' && lisanExcerpt && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📚 في لسان العرب</Text>
                  <View style={styles.lisanBox}>
                    <Text style={styles.lisanText}>{lisanExcerpt}</Text>
                  </View>
                </View>
              )}

              {/* Poetry Example */}
              {poetryExample && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📜 الشاهد الشعري</Text>
                  <View style={styles.poetryBox}>
                    <Text style={styles.poetryText}>{poetryExample}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    maxHeight: height * 0.7,
    backgroundColor: COLORS.parchment,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 3,
    borderColor: COLORS.inkGold,
    ...SHADOWS.large,
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  rootText: {
    fontSize: scaleFontSize(48),
    color: COLORS.inkBrown,
    ...FONTS.arabicTitle,
  },
  difficultyBadge: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.turquoise,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  difficultyText: {
    color: COLORS.textLight,
    fontSize: scaleFontSize(14),
    ...FONTS.arabicTitle,
  },
  headerDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  decorLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.inkGold,
  },
  decorDiamond: {
    width: 10,
    height: 10,
    backgroundColor: COLORS.inkGold,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: SPACING.sm,
  },
  content: {
    maxHeight: height * 0.4,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: COLORS.turquoise,
    marginBottom: SPACING.xs,
    ...FONTS.arabicTitle,
    textAlign: 'right',
  },
  meaningText: {
    fontSize: scaleFontSize(isSmallDevice ? 15 : 17),
    color: COLORS.inkBrown,
    lineHeight: isSmallDevice ? 24 : 28,
    textAlign: 'right',
    ...FONTS.arabicText,
  },
  sourceNote: {
    fontSize: scaleFontSize(11),
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
    fontStyle: 'italic',
    ...FONTS.arabicText,
  },
  lisanBox: {
    backgroundColor: COLORS.parchmentLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderRightWidth: 3,
    borderRightColor: COLORS.turquoise,
  },
  lisanText: {
    fontSize: scaleFontSize(isSmallDevice ? 13 : 15),
    color: COLORS.inkBrown,
    lineHeight: isSmallDevice ? 22 : 26,
    textAlign: 'right',
    ...FONTS.arabicText,
  },
  poetryBox: {
    backgroundColor: COLORS.parchmentDark,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.inkGold,
  },
  poetryText: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: COLORS.inkBrown,
    lineHeight: isSmallDevice ? 24 : 28,
    textAlign: 'right',
    fontStyle: 'italic',
    ...FONTS.arabicText,
  },
  closeButton: {
    backgroundColor: COLORS.turquoise,
    margin: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: scaleFontSize(16),
    color: COLORS.textLight,
    ...FONTS.arabicTitle,
  },
});
