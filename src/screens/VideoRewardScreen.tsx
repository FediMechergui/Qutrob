import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  BackHandler,
  TouchableOpacity,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEventListener } from "expo";
import { COLORS, FONTS } from "../constants/theme";
import { scaleFontSize } from "../utils/responsive";
import { unlockVideo, addToTotalScore } from "../services/database";
import { REWARD_VIDEOS, VIDEO_REWARD_POINTS } from "../data/videos";
import { pickRandom } from "../utils/random";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface VideoRewardScreenProps {
  onComplete: (earnedPoints: number) => void;
  onCancel: () => void;
  playerId?: number;
}

export const VideoRewardScreen: React.FC<VideoRewardScreenProps> = ({
  onComplete,
  onCancel,
  playerId,
}) => {
  // Pick a random video once on mount
  const [selectedVideo] = useState(() => pickRandom(REWARD_VIDEOS)!);
  const [progress, setProgress] = useState(0);
  const [showingCompletion, setShowingCompletion] = useState(false);
  const completedRef = useRef(false);

  const player = useVideoPlayer(selectedVideo.source, (p) => {
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });

  useEventListener(player, "timeUpdate", () => {
    const duration = player.duration || 0;
    if (duration > 0) {
      setProgress(Math.min(100, (player.currentTime / duration) * 100));
    }
  });

  useEventListener(player, "playToEnd", () => {
    handleVideoComplete();
  });

  // Hardware back = cancel (previously the user was trapped with no way out)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (!completedRef.current) {
          onCancel();
        }
        return true;
      }
    );
    return () => backHandler.remove();
  }, [onCancel]);

  const handleVideoComplete = async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setShowingCompletion(true);

    if (playerId) {
      // Unlock video in archive and award bonus points
      await unlockVideo(playerId, selectedVideo.filename, selectedVideo.title);
      await addToTotalScore(playerId, VIDEO_REWARD_POINTS);
    }

    // Show completion message briefly, then return
    setTimeout(() => {
      onComplete(VIDEO_REWARD_POINTS);
    }, 2500);
  };

  if (showingCompletion) {
    return (
      <View style={styles.completionContainer}>
        <StatusBar hidden />
        <Text style={styles.completionEmoji}>🎉</Text>
        <Text style={styles.completionTitle}>مبروك!</Text>
        <Text style={styles.completionSubtitle}>
          حصلت على {VIDEO_REWARD_POINTS} نقطة إضافية
        </Text>
        <Text style={styles.completionVideo}>
          تم فتح: {selectedVideo.title}
        </Text>
        <Text style={styles.completionHint}>
          يمكنك إعادة مشاهدة الفيديو من الأرشيف
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Video Player - Full Screen */}
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Overlay with progress */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.videoTitle}>{selectedVideo.title}</Text>
          <Text style={styles.bonusText}>
            🎁 +{VIDEO_REWARD_POINTS} نقطة عند الإكمال
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress)}% - أكمل الفيديو للحصول على المكافأة
          </Text>
        </View>
      </View>

      {/* Cancel button - leaving forfeits the reward but never traps the user */}
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 16,
  },
  videoTitle: {
    color: "#fff",
    fontSize: scaleFontSize(20),
    marginBottom: 8,
    ...FONTS.arabicTitle,
  },
  bonusText: {
    color: COLORS.inkGold,
    fontSize: scaleFontSize(16),
    ...FONTS.arabicText,
  },
  progressContainer: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 16,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.inkGold,
    borderRadius: 4,
  },
  progressText: {
    color: "#fff",
    fontSize: scaleFontSize(12),
    ...FONTS.arabicText,
  },
  cancelButton: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 20,
  },
  completionContainer: {
    flex: 1,
    backgroundColor: COLORS.parchment,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  completionEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: scaleFontSize(36),
    color: COLORS.inkGold,
    marginBottom: 10,
    ...FONTS.arabicTitle,
  },
  completionSubtitle: {
    fontSize: scaleFontSize(20),
    color: COLORS.turquoise,
    marginBottom: 20,
    ...FONTS.arabicText,
  },
  completionVideo: {
    fontSize: scaleFontSize(16),
    color: COLORS.inkBrown,
    marginBottom: 10,
    textAlign: "center",
    ...FONTS.arabicText,
  },
  completionHint: {
    fontSize: scaleFontSize(14),
    color: COLORS.textSecondary,
    textAlign: "center",
    ...FONTS.arabicText,
  },
});

export default VideoRewardScreen;
