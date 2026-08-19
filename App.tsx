import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import {
  checkAndDownloadUpdate,
  applyDownloadedUpdate,
} from "./src/services/updates";
import { HomeScreen, GameScreen, QutrabScreen } from "./src/screens";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { VideoRewardScreen } from "./src/screens/VideoRewardScreen";
import { VideoArchiveScreen } from "./src/screens/VideoArchiveScreen";
import {
  initDatabase,
  getPlayer,
  hasActiveGame,
  Player,
} from "./src/services/database";
import { COLORS } from "./src/constants/theme";

type Screen =
  | "welcome"
  | "home"
  | "game"
  | "qutrab"
  | "videoReward"
  | "videoArchive";
type RewardContext = "roots" | "qutrab" | null;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [isLoading, setIsLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [rewardContext, setRewardContext] = useState<RewardContext>(null);
  const [resumeRoots, setResumeRoots] = useState(false);
  const [resumeQutrab, setResumeQutrab] = useState(false);
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);

  // Initialize database on app start
  useEffect(() => {
    initializeApp();
    checkForOtaUpdate();
  }, []);

  // OTA updates: silently fetch and apply new JS bundles published via
  // `eas update`. No-op in development and on web; never blocks the UI.
  // (Players can also pull updates on demand from the Home screen.)
  const checkForOtaUpdate = async () => {
    const result = await checkAndDownloadUpdate();
    if (result.status === "downloaded") {
      try {
        await applyDownloadedUpdate();
      } catch (e) {
        console.warn("OTA reload failed:", e);
      }
    } else if (result.status === "error") {
      console.warn("OTA update check failed:", result.message);
    }
  };

  const initializeApp = async () => {
    try {
      // Initialize SQLite database
      await initDatabase();
      setDbInitialized(true);

      // Check for existing player
      const existingPlayer = await getPlayer();

      if (!existingPlayer) {
        setCurrentScreen("welcome");
      } else {
        setPlayer(existingPlayer);

        // Check for active games
        const activeGame = await hasActiveGame(existingPlayer.id);
        setResumeRoots(activeGame.roots);
        setResumeQutrab(activeGame.qutrab);
      }
    } catch (error) {
      console.error("Error initializing app:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWelcomeComplete = async (name: string, playerId: number) => {
    // Get the full player object from database
    const newPlayer = await getPlayer(playerId);
    if (newPlayer) {
      setPlayer(newPlayer);
    } else {
      // Fallback if getPlayer fails
      const now = new Date().toISOString();
      setPlayer({ id: playerId, name, created_at: now, last_played_at: now });
    }
    setCurrentScreen("home");
  };

  const handleStartGame = (resume: boolean = false) => {
    setResumeRoots(resume);
    setCurrentScreen("game");
  };

  const handleStartQutrab = (resume: boolean = false) => {
    setResumeQutrab(resume);
    setCurrentScreen("qutrab");
  };

  const handleBackToHome = async () => {
    // Refresh active game status
    if (player) {
      const activeGame = await hasActiveGame(player.id);
      setResumeRoots(activeGame.roots);
      setResumeQutrab(activeGame.qutrab);
    }
    setCurrentScreen("home");
    setHomeRefreshKey((k) => k + 1);
  };

  const handleOpenVideoReward = (context: RewardContext) => {
    setRewardContext(context);
    setCurrentScreen("videoReward");
  };

  const handleVideoRewardComplete = async (earnedPoints: number) => {
    // Refresh active game status after video
    if (player) {
      const activeGame = await hasActiveGame(player.id);
      setResumeRoots(activeGame.roots);
      setResumeQutrab(activeGame.qutrab);
    }

    // Return to the game that triggered the reward
    if (rewardContext === "roots") {
      setCurrentScreen("game");
    } else if (rewardContext === "qutrab") {
      setCurrentScreen("qutrab");
    } else {
      setCurrentScreen("home");
    }
    setRewardContext(null);
  };

  const handleVideoRewardCancel = () => {
    if (rewardContext === "roots") {
      setCurrentScreen("game");
    } else if (rewardContext === "qutrab") {
      setCurrentScreen("qutrab");
    } else {
      setCurrentScreen("home");
    }
    setRewardContext(null);
  };

  const handleOpenVideoArchive = () => {
    setCurrentScreen("videoArchive");
  };

  // Loading screen while initializing
  if (isLoading || !dbInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.turquoise} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (currentScreen === "welcome") {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  if (currentScreen === "videoReward") {
    return (
      <VideoRewardScreen
        onComplete={handleVideoRewardComplete}
        onCancel={handleVideoRewardCancel}
        playerId={player?.id || 0}
      />
    );
  }

  if (currentScreen === "videoArchive") {
    return (
      <VideoArchiveScreen
        onBack={handleBackToHome}
        playerId={player?.id || 0}
      />
    );
  }

  if (currentScreen === "game") {
    return (
      <GameScreen
        onBack={handleBackToHome}
        onOpenVideoReward={() => handleOpenVideoReward("roots")}
        resumeGame={resumeRoots}
        playerId={player?.id || 0}
      />
    );
  }

  if (currentScreen === "qutrab") {
    return (
      <QutrabScreen
        onBack={handleBackToHome}
        onOpenVideoReward={() => handleOpenVideoReward("qutrab")}
        resumeGame={resumeQutrab}
        playerId={player?.id || 0}
      />
    );
  }

  return (
    <HomeScreen
      onStartGame={handleStartGame}
      onStartQutrab={handleStartQutrab}
      onOpenVideoArchive={handleOpenVideoArchive}
      playerName={player?.name || null}
      playerId={player?.id || 0}
      hasActiveRootsGame={resumeRoots}
      hasActiveQutrabGame={resumeQutrab}
      refreshKey={homeRefreshKey}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.parchment,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: COLORS.inkBrown,
    fontFamily: "serif",
  },
});
