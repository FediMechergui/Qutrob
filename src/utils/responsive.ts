import {
  Dimensions,
  PixelRatio,
  Platform,
  useWindowDimensions,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Base dimensions (iPhone 11 / iPhone XR as reference)
const BASE_WIDTH = 414;
const BASE_HEIGHT = 896;

// Screen size categories
export const isSmallScreen = SCREEN_WIDTH < 360;
export const isMediumScreen = SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 414;
export const isLargeScreen = SCREEN_WIDTH >= 414;

// Height-based categories (critical for no-scroll layouts)
export const isShortScreen = SCREEN_HEIGHT < 700;
export const isMediumHeight = SCREEN_HEIGHT >= 700 && SCREEN_HEIGHT < 800;
export const isTallScreen = SCREEN_HEIGHT >= 800;

// Responsive scaling functions
export const scaleWidth = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const scaleHeight = (size: number): number => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Moderate scaling - doesn't scale as aggressively (good for fonts)
export const moderateScale = (size: number, factor: number = 0.5): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size + (scale - 1) * size * factor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Height-aware moderate scaling
export const moderateScaleHeight = (size: number, factor: number = 0.5): number => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  const newSize = size + (scale - 1) * size * factor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Font scaling with minimum and maximum limits
export const scaleFontSize = (size: number): number => {
  // Use height-aware scaling for short screens
  const heightFactor = isShortScreen ? 0.85 : isMediumHeight ? 0.92 : 1;
  const scaledSize = moderateScale(size, 0.4) * heightFactor;
  // Ensure minimum readable size and maximum comfortable size
  const minSize = Math.max(size * 0.7, 9);
  const maxSize = size * 1.2;
  return Math.min(Math.max(scaledSize, minSize), maxSize);
};

// Percentage of screen width
export const wp = (percentage: number): number => {
  return Math.round((percentage * SCREEN_WIDTH) / 100);
};

// Percentage of screen height
export const hp = (percentage: number): number => {
  return Math.round((percentage * SCREEN_HEIGHT) / 100);
};

// Get responsive padding based on screen size (height-aware)
export const getResponsivePadding = (base: number): number => {
  if (isShortScreen) return Math.round(base * 0.5);
  if (isSmallScreen) return Math.round(base * 0.6);
  if (isMediumScreen) return Math.round(base * 0.75);
  return base;
};

// Get responsive margin based on screen size (height-aware)
export const getResponsiveMargin = (base: number): number => {
  if (isShortScreen) return Math.round(base * 0.5);
  if (isSmallScreen) return Math.round(base * 0.6);
  if (isMediumScreen) return Math.round(base * 0.75);
  return base;
};

// Get responsive size based on both width and height
export const getResponsiveSize = (
  base: number,
  small: number,
  medium: number,
  short?: number
): number => {
  if (isShortScreen && short !== undefined) return short;
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return base;
};

// Screen dimensions export
export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: isSmallScreen,
  isMedium: isMediumScreen,
  isLarge: isLargeScreen,
  isShort: isShortScreen,
  isMediumHeight: isMediumHeight,
  isTall: isTallScreen,
  isWeb: Platform.OS === "web",
};

// Responsive spacing that adjusts to screen size
export const RESPONSIVE_SPACING = {
  xs: scaleWidth(isShortScreen ? 2 : 4),
  sm: scaleWidth(isShortScreen ? 4 : 8),
  md: scaleWidth(isShortScreen ? 8 : 16),
  lg: scaleWidth(isShortScreen ? 12 : 24),
  xl: scaleWidth(isShortScreen ? 16 : 32),
  xxl: scaleWidth(isShortScreen ? 24 : 48),
};

// ============ LIVE RESPONSIVE HOOK ============
// Unlike the module-level constants above (frozen at app launch), this hook
// re-computes on every window size change, so layouts adapt to rotation,
// foldables, split-screen, and browser resizing on web.

export interface ResponsiveInfo {
  width: number;
  height: number;
  isSmall: boolean;
  isMedium: boolean;
  isLarge: boolean;
  isShort: boolean;
  isMediumHeight: boolean;
  isTall: boolean;
  wp: (percentage: number) => number;
  hp: (percentage: number) => number;
  scaleFont: (size: number) => number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isSmall = width < 360;
  const isMedium = width >= 360 && width < 414;
  const isShort = height < 700;
  const isMediumH = height >= 700 && height < 800;

  const scaleFont = (size: number): number => {
    const heightFactor = isShort ? 0.85 : isMediumH ? 0.92 : 1;
    const scale = width / BASE_WIDTH;
    const moderate = size + (scale - 1) * size * 0.4;
    const scaledSize =
      Math.round(PixelRatio.roundToNearestPixel(moderate)) * heightFactor;
    const minSize = Math.max(size * 0.7, 9);
    const maxSize = size * 1.2;
    return Math.min(Math.max(scaledSize, minSize), maxSize);
  };

  return {
    width,
    height,
    isSmall,
    isMedium,
    isLarge: width >= 414,
    isShort,
    isMediumHeight: isMediumH,
    isTall: height >= 800,
    wp: (percentage: number) => Math.round((percentage * width) / 100),
    hp: (percentage: number) => Math.round((percentage * height) / 100),
    scaleFont,
  };
}

// Responsive font sizes
export const RESPONSIVE_FONTS = {
  xs: scaleFontSize(10),
  sm: scaleFontSize(12),
  md: scaleFontSize(14),
  lg: scaleFontSize(16),
  xl: scaleFontSize(18),
  xxl: scaleFontSize(24),
  title: scaleFontSize(28),
  heading: scaleFontSize(32),
  display: scaleFontSize(40),
  hero: scaleFontSize(48),
};
