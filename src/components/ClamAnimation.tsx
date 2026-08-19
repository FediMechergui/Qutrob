import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  COLORS,
  FONTS,
  SHADOWS,
  BORDER_RADIUS,
  SPACING,
} from "../constants/theme";
import {
  scaleFontSize,
  wp,
  hp,
  moderateScale,
  SCREEN,
} from "../utils/responsive";

// Import the clam image
const clamImage = require("../../clam.png");

interface ClamAnimationProps {
  isOpen: boolean;
  proverb: string;
  proverbMeaning: string;
  onAnimationComplete?: () => void;
  /**
   * When provided, a scuba-diver icon appears under the pearl's text; tapping
   * it "dives deeper" into the full context of the card.
   */
  onDive?: () => void;
  diveLabel?: string;
}

const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 360;
const isMediumDevice = width >= 360 && width < 414;

// Responsive clam sizing based on both width and height
const CLAM_WIDTH = Math.min(
  isSmallDevice ? width * 0.9 : isMediumDevice ? width * 0.85 : width * 0.8,
  340
);
const CLAM_HEIGHT = CLAM_WIDTH * (isSmallDevice ? 0.7 : 0.8);

export const ClamAnimation: React.FC<ClamAnimationProps> = ({
  isOpen,
  proverb,
  proverbMeaning,
  onAnimationComplete,
  onDive,
  diveLabel = "اغطس لتعرف المزيد",
}) => {
  const [animationPhase, setAnimationPhase] = useState<
    "closed" | "opening" | "open" | "revealing"
  >("closed");

  // Animation values
  const topShellRotation = useRef(new Animated.Value(0)).current;
  const bottomShellRotation = useRef(new Animated.Value(0)).current;
  const pearlScale = useRef(new Animated.Value(0)).current;
  const pearlOpacity = useRef(new Animated.Value(0)).current;
  const pearlGlow = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const shellBounce = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const containerScale = useRef(new Animated.Value(0.8)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      runOpeningAnimation();
    } else {
      resetAnimation();
    }
  }, [isOpen]);

  const resetAnimation = () => {
    setAnimationPhase("closed");
    topShellRotation.setValue(0);
    bottomShellRotation.setValue(0);
    pearlScale.setValue(0);
    pearlOpacity.setValue(0);
    pearlGlow.setValue(0);
    textOpacity.setValue(0);
    shellBounce.setValue(0);
    sparkleOpacity.setValue(0);
    containerScale.setValue(0.8);
    bubbleAnim.setValue(0);
  };

  const runOpeningAnimation = () => {
    setAnimationPhase("opening");

    // Sequence of animations like a GIF
    Animated.sequence([
      // Phase 1: Container appears with bounce
      Animated.spring(containerScale, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),

      // Phase 2: Bubbles appear
      Animated.timing(bubbleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),

      // Phase 3: Shell shakes before opening
      Animated.sequence([
        Animated.timing(shellBounce, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shellBounce, {
          toValue: -1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shellBounce, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shellBounce, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),

      // Phase 4: Shells open
      Animated.parallel([
        Animated.timing(topShellRotation, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(bottomShellRotation, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      // Phase 5: Pearl appears
      Animated.parallel([
        Animated.spring(pearlScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(pearlOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),

      // Phase 6: Sparkles and glow
      Animated.parallel([
        Animated.timing(sparkleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pearlGlow, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),

      // Phase 7: Text reveals
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAnimationPhase("open");

      // Start continuous glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pearlGlow, {
            toValue: 1.3,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pearlGlow, {
            toValue: 0.8,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      onAnimationComplete?.();
    });
  };

  // Interpolations
  const topShellRotate = topShellRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-55deg"],
  });

  const bottomShellRotate = bottomShellRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "20deg"],
  });

  const shellShake = shellBounce.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-3deg", "0deg", "3deg"],
  });

  return (
    <Animated.View
      style={[styles.container, { transform: [{ scale: containerScale }] }]}
    >
      {/* Bubbles */}
      <Animated.View style={[styles.bubblesContainer, { opacity: bubbleAnim }]}>
        {[...Array(6)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.bubble,
              {
                left: 20 + ((i * 50) % 200),
                bottom: 30 + ((i * 20) % 80),
                width: 8 + (i % 3) * 4,
                height: 8 + (i % 3) * 4,
                opacity: bubbleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.6 - i * 0.08],
                }),
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Clam Image */}
      <View style={styles.clamContainer}>
        <Animated.View
          style={[
            styles.clamImageContainer,
            {
              transform: [{ rotateZ: shellShake }],
            },
          ]}
        >
          <Image
            source={clamImage}
            style={styles.clamImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Pearl/Gift with proverb - positioned over the clam */}
        <Animated.View
          style={[
            styles.pearlContainer,
            {
              opacity: pearlOpacity,
              transform: [{ scale: pearlScale }],
            },
          ]}
        >
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.pearlGlow,
              {
                opacity: pearlGlow.interpolate({
                  inputRange: [0, 1, 1.3],
                  outputRange: [0, 0.4, 0.6],
                }),
                transform: [{ scale: pearlGlow }],
              },
            ]}
          />

          {/* Sparkles */}
          <Animated.View
            style={[styles.sparklesContainer, { opacity: sparkleOpacity }]}
          >
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.sparkle,
                  {
                    top: 10 + Math.sin(i * 0.8) * 50,
                    left: 20 + Math.cos(i * 0.8) * 80,
                    transform: [{ rotate: `${i * 45}deg` }],
                  },
                ]}
              />
            ))}
          </Animated.View>

          {/* Pearl/Gift content */}
          <View style={styles.pearl}>
            <View style={styles.pearlShine} />
            <Animated.View style={{ opacity: textOpacity }}>
              <Text style={styles.proverbText}>{proverb}</Text>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerDiamond} />
                <View style={styles.dividerLine} />
              </View>
              <Text style={styles.meaningText}>{proverbMeaning}</Text>

              {/* Scuba diver: dive deeper into the card's context */}
              {onDive && (
                <TouchableOpacity
                  style={styles.diveButton}
                  onPress={onDive}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={diveLabel}
                >
                  <Text style={styles.diveIcon}>🤿</Text>
                  <Text style={styles.diveLabel}>{diveLabel}</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      {/* Title */}
      <Animated.View style={{ opacity: textOpacity }}>
        <Text style={styles.title}>🏆 مبروك! 🏆</Text>
        <Text style={styles.subtitle}>لقد أكملت المستوى</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: isSmallDevice ? SPACING.md : SPACING.lg,
  },
  bubblesContainer: {
    position: "absolute",
    width: CLAM_WIDTH,
    height: CLAM_HEIGHT,
  },
  bubble: {
    position: "absolute",
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  clamContainer: {
    width: CLAM_WIDTH,
    height: CLAM_HEIGHT + (isSmallDevice ? 60 : 100),
    alignItems: "center",
    justifyContent: "center",
  },
  clamImageContainer: {
    position: "absolute",
    width: CLAM_WIDTH,
    height: CLAM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  clamImage: {
    width: CLAM_WIDTH,
    height: CLAM_HEIGHT,
  },
  pearlContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    top: isSmallDevice ? -15 : -20,
  },
  pearlGlow: {
    position: "absolute",
    width: CLAM_WIDTH * 0.9,
    height: CLAM_HEIGHT * 0.75,
    borderRadius: CLAM_WIDTH * 0.45,
    backgroundColor: COLORS.inkGoldLight,
  },
  sparklesContainer: {
    position: "absolute",
    width: CLAM_WIDTH * 0.9,
    height: CLAM_HEIGHT * 0.8,
  },
  sparkle: {
    position: "absolute",
    width: isSmallDevice ? 10 : 12,
    height: isSmallDevice ? 10 : 12,
    backgroundColor: COLORS.inkGold,
  },
  pearl: {
    width: CLAM_WIDTH * (isSmallDevice ? 0.85 : 0.82),
    minHeight: CLAM_HEIGHT * (isSmallDevice ? 0.5 : 0.55),
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.parchmentLight,
    borderWidth: isSmallDevice ? 2 : 3,
    borderColor: COLORS.inkGold,
    padding: isSmallDevice ? SPACING.sm : SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.large,
  },
  pearlShine: {
    position: "absolute",
    top: isSmallDevice ? 8 : 10,
    right: isSmallDevice ? 12 : 15,
    width: isSmallDevice ? 16 : 20,
    height: isSmallDevice ? 16 : 20,
    borderRadius: isSmallDevice ? 8 : 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  proverbText: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 17),
    color: COLORS.inkBrown,
    textAlign: "center",
    lineHeight: moderateScale(isSmallDevice ? 22 : 28),
    ...FONTS.arabicTitle,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: isSmallDevice ? SPACING.xs : SPACING.sm,
  },
  dividerLine: {
    width: isSmallDevice ? 30 : 40,
    height: 2,
    backgroundColor: COLORS.inkGold,
  },
  dividerDiamond: {
    width: isSmallDevice ? 6 : 8,
    height: isSmallDevice ? 6 : 8,
    backgroundColor: COLORS.inkGold,
    transform: [{ rotate: "45deg" }],
    marginHorizontal: SPACING.xs,
  },
  meaningText: {
    fontSize: scaleFontSize(isSmallDevice ? 11 : 13),
    color: COLORS.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  diveButton: {
    marginTop: isSmallDevice ? SPACING.sm : SPACING.md,
    alignSelf: "center",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.turquoise,
    paddingVertical: isSmallDevice ? 4 : 6,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    ...SHADOWS.small,
  },
  diveIcon: {
    fontSize: scaleFontSize(isSmallDevice ? 18 : 22),
  },
  diveLabel: {
    fontSize: scaleFontSize(isSmallDevice ? 11 : 13),
    color: COLORS.textLight,
    ...FONTS.arabicTitle,
  },
  title: {
    fontSize: scaleFontSize(isSmallDevice ? 22 : 26),
    color: COLORS.inkGold,
    marginTop: isSmallDevice ? SPACING.md : SPACING.lg,
    ...FONTS.arabicTitle,
  },
  subtitle: {
    fontSize: scaleFontSize(isSmallDevice ? 14 : 16),
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    ...FONTS.arabicText,
  },
});
