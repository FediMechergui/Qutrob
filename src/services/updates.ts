// Over-the-air updates (expo-updates / EAS Update).
//
// Two entry points share this module:
//   • App launch: silent check → fetch → reload (never blocks the UI).
//   • The «تحديثات» button on the Home screen: explicit check with user
//     feedback, so players can pull a new version on demand.

import { Platform } from "react-native";
import * as Updates from "expo-updates";
import Constants from "expo-constants";

export type UpdateCheckResult =
  | { status: "unavailable"; reason: string }
  | { status: "up-to-date" }
  | { status: "downloaded" }
  | { status: "error"; message: string };

export interface VersionInfo {
  appVersion: string;
  runtimeVersion: string;
  updateId: string | null;
  channel: string | null;
  isEmbedded: boolean;
  createdAt: Date | null;
}

/** Whether OTA updates can work in this environment. */
export function updatesSupported(): { ok: boolean; reason?: string } {
  if (Platform.OS === "web") return { ok: false, reason: "التحديثات الفورية غير متاحة على الويب" };
  if (__DEV__) return { ok: false, reason: "التحديثات الفورية معطّلة في وضع التطوير" };
  if (!Updates.isEnabled) return { ok: false, reason: "التحديثات الفورية غير مفعّلة في هذا الإصدار" };
  return { ok: true };
}

/** Current build/update identifiers for display. */
export function getVersionInfo(): VersionInfo {
  return {
    appVersion: Constants.expoConfig?.version ?? "—",
    runtimeVersion:
      (typeof Updates.runtimeVersion === "string" && Updates.runtimeVersion) ||
      (typeof Constants.expoConfig?.runtimeVersion === "string"
        ? Constants.expoConfig.runtimeVersion
        : "—"),
    updateId: Updates.updateId ?? null,
    channel: Updates.channel ?? null,
    isEmbedded: Updates.isEmbeddedLaunch,
    createdAt: Updates.createdAt ?? null,
  };
}

/**
 * Check for an update and download it if available.
 * Does NOT reload — the caller decides when (immediately on launch, or after
 * telling the user when triggered manually).
 */
export async function checkAndDownloadUpdate(): Promise<UpdateCheckResult> {
  const support = updatesSupported();
  if (!support.ok) return { status: "unavailable", reason: support.reason! };

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return { status: "up-to-date" };
    await Updates.fetchUpdateAsync();
    return { status: "downloaded" };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { status: "error", message };
  }
}

/** Restart into the downloaded update. */
export async function applyDownloadedUpdate(): Promise<void> {
  await Updates.reloadAsync();
}
