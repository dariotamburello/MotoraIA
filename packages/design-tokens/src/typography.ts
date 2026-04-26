export const fontFamilies = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace',
} as const;

export const fontWeights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export type TypeVariant =
  | "hero"
  | "display"
  | "title-1"
  | "title-2"
  | "body-lg"
  | "body"
  | "body-sm"
  | "caption"
  | "meta"
  | "micro"
  | "nano";

export type TypeStyle = {
  fontSize: number;
  fontWeight: "400" | "500" | "600" | "700";
  lineHeight: number;
  letterSpacing: number;
};

export const typeScale: Record<TypeVariant, TypeStyle> = {
  hero: { fontSize: 48, fontWeight: "700", lineHeight: 48, letterSpacing: -1.92 },
  display: { fontSize: 32, fontWeight: "600", lineHeight: 38, letterSpacing: -0.8 },
  "title-1": { fontSize: 22, fontWeight: "700", lineHeight: 26, letterSpacing: -0.44 },
  "title-2": { fontSize: 18, fontWeight: "700", lineHeight: 23, letterSpacing: -0.18 },
  "body-lg": { fontSize: 17, fontWeight: "600", lineHeight: 23, letterSpacing: 0 },
  body: { fontSize: 15, fontWeight: "500", lineHeight: 22, letterSpacing: 0 },
  "body-sm": { fontSize: 14, fontWeight: "500", lineHeight: 20, letterSpacing: 0 },
  caption: { fontSize: 13, fontWeight: "500", lineHeight: 18, letterSpacing: 0 },
  meta: { fontSize: 12, fontWeight: "600", lineHeight: 16, letterSpacing: 0 },
  micro: { fontSize: 11, fontWeight: "700", lineHeight: 14, letterSpacing: 0.88 },
  nano: { fontSize: 10, fontWeight: "700", lineHeight: 12, letterSpacing: 0.8 },
};
