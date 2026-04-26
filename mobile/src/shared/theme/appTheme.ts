import { useAuthStore } from "@/shared/stores/useAuthStore";
import { colorsDark } from "@motora/design-tokens";

/**
 * Paleta de colores compatibility shim.
 * Los valores son derivados de @motora/design-tokens (colorsDark) — no duplicar.
 * Mantenemos el shape legacy (AppColors flat) para no romper login/register/onboarding.
 * Código nuevo debe usar `useTheme()` de `@/shared/theme/ThemeProvider` directamente.
 */
export interface AppColors {
  background: string;
  card: string;
  border: string;
  mutedText: string;
  subtitle: string;
  body: string;
  heading: string;
  primary: string;
  success: string;
  warning: string;
  error: string;
  premium: string;
}

export interface AppTheme {
  colors: AppColors;
}

const BASE_COLORS: Omit<AppColors, "primary"> = {
  background: colorsDark.background.primary,
  card: colorsDark.background.secondary,
  border: colorsDark.border.default,
  mutedText: colorsDark.text.muted,
  subtitle: colorsDark.brand.metallic,
  body: colorsDark.text.body,
  heading: colorsDark.text.heading,
  success: colorsDark.status.ok,
  warning: colorsDark.status.warn,
  error: colorsDark.status.err,
  premium: colorsDark.premium.base,
};

export const CLIENT_THEME: AppTheme = {
  colors: {
    ...BASE_COLORS,
    primary: colorsDark.brand.primary,
  },
};

// Esmeralda BUSINESS — no está en design-tokens (token contextual de rol, no de marca).
// Se mantiene literal acá hasta que role-themes aterricen como tokens en una futura story.
const BUSINESS_PRIMARY = "#10B981";

export const BUSINESS_THEME: AppTheme = {
  colors: {
    ...BASE_COLORS,
    primary: BUSINESS_PRIMARY,
  },
};

export function useAppTheme(): AppTheme {
  const activeRole = useAuthStore((s) => s.activeRole);
  return activeRole === "BUSINESS" ? BUSINESS_THEME : CLIENT_THEME;
}
