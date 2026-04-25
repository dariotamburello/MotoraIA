import { useAuthStore } from "@/shared/stores/useAuthStore";

/**
 * Paleta de colores completa de la app.
 * Los colores de Success, Warning y Error son invariables entre roles.
 * El color `primary` cambia según el rol activo para dar contexto visual claro.
 */
export interface AppColors {
  background: string;
  card: string;
  border: string;
  mutedText: string;
  subtitle: string;
  body: string;
  heading: string;
  /** Color de acción principal — varía según el rol activo. */
  primary: string;
  success: string;
  warning: string;
  error: string;
  premium: string;
}

export interface AppTheme {
  colors: AppColors;
}

// ---------------------------------------------------------------------------
// Colores base compartidos entre ambos roles.
// ---------------------------------------------------------------------------
const BASE_COLORS = {
  background: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  mutedText: "#64748B",
  subtitle: "#94A3B8",
  body: "#CBD5E1",
  heading: "#F8FAFC",
  success: "#34D399",
  warning: "#F59E0B",
  error: "#EF4444",
  premium: "#A855F7",
} as const;

// ---------------------------------------------------------------------------
// Paleta CLIENT — Primary azul institucional.
// ---------------------------------------------------------------------------
export const CLIENT_THEME: AppTheme = {
  colors: {
    ...BASE_COLORS,
    primary: "#3B82F6",
  },
};

// ---------------------------------------------------------------------------
// Paleta BUSINESS — Primary esmeralda para distinguir visualmente el contexto.
// Se eligió #10B981 (esmeralda) en lugar del violeta premium (#A855F7) para
// no colisionar con el badge de suscripción PREMIUM que usa ese color.
// ---------------------------------------------------------------------------
export const BUSINESS_THEME: AppTheme = {
  colors: {
    ...BASE_COLORS,
    primary: "#10B981",
  },
};

// ---------------------------------------------------------------------------
// Hook de consumo — devuelve la paleta activa según el rol del usuario.
// Uso: const { colors } = useAppTheme();
// ---------------------------------------------------------------------------
export function useAppTheme(): AppTheme {
  const activeRole = useAuthStore((s) => s.activeRole);
  return activeRole === "BUSINESS" ? BUSINESS_THEME : CLIENT_THEME;
}
