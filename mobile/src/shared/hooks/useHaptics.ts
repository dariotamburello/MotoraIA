import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useReducedMotion } from "./useReducedMotion";

export type HapticsApi = {
  light: () => void;
  medium: () => void;
  success: () => void;
  warning: () => void;
  error: () => void;
};

const isWeb = Platform.OS === "web";

export function useHaptics(): HapticsApi {
  const reduced = useReducedMotion();

  const guard = (fn: () => Promise<void> | void) => () => {
    if (isWeb || reduced) return;
    try {
      void fn();
    } catch {
      // no-op
    }
  };

  return {
    light: guard(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
    medium: guard(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
    success: guard(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
    warning: guard(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
    error: guard(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  };
}
