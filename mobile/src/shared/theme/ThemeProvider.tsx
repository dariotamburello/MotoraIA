import {
  type ThemeColors,
  type ThemeMode,
  colorsDark,
  colorsLight,
  duration,
  easing,
  easingBezier,
  fontFamilies,
  fontWeights,
  radii,
  spacing,
  staggerStep,
  typeScale,
} from "@motora/design-tokens";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type ReactNode, createContext, useCallback, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "motora_theme_mode_v1";

export type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: {
    families: typeof fontFamilies;
    weights: typeof fontWeights;
    scale: typeof typeScale;
  };
  spacing: typeof spacing;
  radii: typeof radii;
  animations: {
    duration: typeof duration;
    easing: typeof easing;
    easingBezier: typeof easingBezier;
    staggerStep: typeof staggerStep;
  };
  setMode: (mode: ThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
  initialMode?: ThemeMode;
};

export function ThemeProvider({ children, initialMode = "dark" }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((persisted) => {
        if (persisted === "dark" || persisted === "light") {
          setModeState(persisted);
        }
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const colors = mode === "dark" ? colorsDark : colorsLight;
    return {
      mode,
      colors,
      typography: { families: fontFamilies, weights: fontWeights, scale: typeScale },
      spacing,
      radii,
      animations: { duration, easing, easingBezier, staggerStep },
      setMode,
    };
  }, [mode, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
