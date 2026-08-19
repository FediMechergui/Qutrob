import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { COLORS, FONTS, SHADOWS, BORDER_RADIUS, SPACING } from '../constants/theme';
import { scaleFontSize, useResponsive } from "../utils/responsive";

// Static styling details (fonts, borders) still use launch-time width;
// the wheel geometry itself is computed live inside the component.
const isSmallDevice = Dimensions.get("window").width < 360;

interface LetterWheelProps {
  letters: [string, string, string];
  onRotate: () => void;
  disabled?: boolean;
  isSpinning?: boolean;
  /** Points the next spin will cost (0 = free). Shown on the wheel. */
  spinCost?: number;
}

// Height-aware wheel size - smaller on short screens.
// Computed at render time from the live window size so the wheel adapts to
// rotation, foldables, and browser resizing.
function getWheelGeometry(r: ReturnType<typeof useResponsive>) {
  let wheelSize = r.isSmall
    ? Math.min(r.width * 0.7, 220)
    : r.isMedium
    ? Math.min(r.width * 0.68, 240)
    : Math.min(r.width * 0.65, 260);

  if (r.isShort) {
    wheelSize = Math.min(wheelSize, r.hp(28)); // Max 28% of screen height
  } else if (r.isMediumHeight) {
    wheelSize = Math.min(wheelSize, r.hp(30)); // Max 30% of screen height
  }

  const letterBoxSize = r.isShort ? 38 : r.isSmall ? 42 : r.isMedium ? 46 : 50;

  return { wheelSize, letterBoxSize };
}

export const LetterWheel: React.FC<LetterWheelProps> = ({
  letters,
  onRotate,
  disabled = false,
  isSpinning = false,
  spinCost = 0,
}) => {
  const responsive = useResponsive();
  const { wheelSize, letterBoxSize } = getWheelGeometry(responsive);

  const sizeStyles = useMemo(
    () => ({
      container: {
        width: wheelSize,
        height: wheelSize,
      },
      outerRing: {
        width: wheelSize,
        height: wheelSize,
        borderRadius: wheelSize / 2,
      },
      innerRing: {
        width: wheelSize - 20,
        height: wheelSize - 20,
        borderRadius: (wheelSize - 20) / 2,
      },
      wheelContent: {
        width: wheelSize - 40,
        height: wheelSize - 40,
        borderRadius: (wheelSize - 40) / 2,
      },
      glowEffect: {
        width: wheelSize + 20,
        height: wheelSize + 20,
        borderRadius: (wheelSize + 20) / 2,
      },
      letterBox: {
        width: letterBoxSize,
        height: letterBoxSize,
      },
    }),
    [wheelSize, letterBoxSize]
  );

  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [displayLetters, setDisplayLetters] = useState(letters);

  // Update display letters when letters prop changes (after spin)
  useEffect(() => {
    if (!isSpinning) {
      setDisplayLetters(letters);
    }
  }, [letters, isSpinning]);

  // Handle spinning animation
  useEffect(() => {
    if (isSpinning) {
      // Start spinning animation
      Animated.parallel([
        Animated.loop(
          Animated.timing(spinAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Stop spinning
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
      scaleAnim.setValue(1);
    }
  }, [isSpinning]);

  const handlePress = () => {
    if (disabled || isSpinning) return;

    // Pulse animation on press
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    onRotate();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <TouchableOpacity
      style={[styles.container, sizeStyles.container]}
      onPress={handlePress}
      disabled={disabled || isSpinning}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.outerRing,
          sizeStyles.outerRing,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: isSpinning ? spin : "0deg" },
            ],
          },
        ]}
      >
        {/* Glow effect */}
        <Animated.View
          style={[styles.glowEffect, sizeStyles.glowEffect, { opacity: glowAnim }]}
        />

        <View style={[styles.innerRing, sizeStyles.innerRing]}>
          <View style={[styles.wheelContent, sizeStyles.wheelContent]}>
            {/* Decorative pattern */}
            <View style={styles.decorativeTop}>
              <View style={styles.decorDot} />
              <View style={styles.decorLine} />
              <View style={styles.decorDot} />
            </View>

            {/* Letters display */}
            <View style={styles.lettersContainer}>
              {displayLetters.map((letter, index) => (
                <Animated.View
                  key={`${letter}-${index}`}
                  style={[
                    styles.letterBox,
                    sizeStyles.letterBox,
                    isSpinning && styles.letterBoxSpinning,
                  ]}
                >
                  <Text
                    style={[
                      styles.letterText,
                      isSpinning && styles.letterTextSpinning,
                    ]}
                  >
                    {isSpinning ? "؟" : letter}
                  </Text>
                </Animated.View>
              ))}
            </View>

            {/* Rotate instruction */}
            <Text style={styles.rotateText}>
              {isSpinning
                ? "جاري التدوير..."
                : spinCost > 0
                ? `حروف جديدة (−${spinCost} نقطة) 🔄`
                : "اضغط لحروف جديدة 🔄"}
            </Text>

            {/* Decorative pattern */}
            <View style={styles.decorativeBottom}>
              <View style={styles.decorDot} />
              <View style={styles.decorLine} />
              <View style={styles.decorDot} />
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Corner decorations */}
      <View style={[styles.cornerDecoration, styles.topLeft]} />
      <View style={[styles.cornerDecoration, styles.topRight]} />
      <View style={[styles.cornerDecoration, styles.bottomLeft]} />
      <View style={[styles.cornerDecoration, styles.bottomRight]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    backgroundColor: COLORS.inkGold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.goldBorder,
    ...SHADOWS.large,
  },
  innerRing: {
    backgroundColor: COLORS.parchment,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.copperAccent,
  },
  wheelContent: {
    backgroundColor: COLORS.parchmentLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.inkGold,
  },
  decorativeTop: {
    position: "absolute",
    top: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  decorativeBottom: {
    position: "absolute",
    bottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  lettersContainer: {
    flexDirection: "row-reverse", // RTL for Arabic
    alignItems: "center",
    justifyContent: "center",
    gap: isSmallDevice ? SPACING.xs : SPACING.sm,
  },
  letterBox: {
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.parchment,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: isSmallDevice ? 1.5 : 2,
    borderColor: COLORS.inkBrown,
    ...SHADOWS.small,
  },
  letterText: {
    fontSize: scaleFontSize(isSmallDevice ? 28 : 36),
    color: COLORS.inkBrown,
    ...FONTS.arabicLetter,
  },
  rotateText: {
    marginTop: isSmallDevice ? SPACING.sm : SPACING.md,
    fontSize: scaleFontSize(isSmallDevice ? 12 : 14),
    color: COLORS.textSecondary,
    ...FONTS.arabicText,
  },
  glowEffect: {
    position: "absolute",
    backgroundColor: COLORS.inkGold,
    opacity: 0.3,
  },
  decorDot: {
    width: isSmallDevice ? 6 : 8,
    height: isSmallDevice ? 6 : 8,
    borderRadius: isSmallDevice ? 3 : 4,
    backgroundColor: COLORS.inkGold,
  },
  decorLine: {
    width: isSmallDevice ? 22 : 30,
    height: isSmallDevice ? 2 : 3,
    backgroundColor: COLORS.inkGold,
    marginHorizontal: isSmallDevice ? 3 : 5,
    borderRadius: 2,
  },
  letterBoxSpinning: {
    backgroundColor: COLORS.inkGold,
    opacity: 0.7,
  },
  letterTextSpinning: {
    color: COLORS.parchment,
    fontSize: scaleFontSize(isSmallDevice ? 22 : 28),
  },
  cornerDecoration: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: COLORS.inkGold,
    borderWidth: 2,
  },
  topLeft: {
    top: -5,
    left: -5,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: BORDER_RADIUS.sm,
  },
  topRight: {
    top: -5,
    right: -5,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: BORDER_RADIUS.sm,
  },
  bottomLeft: {
    bottom: -5,
    left: -5,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: BORDER_RADIUS.sm,
  },
  bottomRight: {
    bottom: -5,
    right: -5,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: BORDER_RADIUS.sm,
  },
});
