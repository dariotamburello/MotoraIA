export const radii = {
  sm: 10,
  default: 14,
  lg: 18,
  xl: 22,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radii;
