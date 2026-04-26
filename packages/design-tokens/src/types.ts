type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;

export type ThemeColors = DeepReadonly<{
  background: { primary: string; secondary: string; elevated: string; overlay: string };
  border: { default: string; soft: string; hairline: string };
  text: { heading: string; body: string; muted: string; dim: string };
  brand: { primary: string; soft: string; line: string; metallic: string };
  status: {
    ok: string;
    okSoft: string;
    okLine: string;
    warn: string;
    warnSoft: string;
    warnLine: string;
    err: string;
    errSoft: string;
    errLine: string;
  };
  premium: { base: string; soft: string; line: string; gradientStart: string; gradientEnd: string };
}>;

export type ThemeMode = "dark" | "light";
