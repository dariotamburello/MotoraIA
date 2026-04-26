import { useTheme } from "@/shared/hooks/useTheme";
import type { TypeVariant } from "@motora/design-tokens";
import type { ReactNode } from "react";
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";

type Tone = "heading" | "body" | "muted" | "dim" | "brand" | "ok" | "warn" | "err" | "premium";

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  tone?: Tone;
  mono?: boolean;
  tnum?: boolean;
  align?: TextStyle["textAlign"];
  uppercase?: boolean;
  children?: ReactNode;
};

const FONT_BY_WEIGHT_INTER: Record<"400" | "500" | "600" | "700", string> = {
  "400": "Inter_400Regular",
  "500": "Inter_500Medium",
  "600": "Inter_600SemiBold",
  "700": "Inter_700Bold",
};

const FONT_BY_WEIGHT_MONO: Record<"400" | "500" | "600" | "700", string> = {
  "400": "JetBrainsMono_400Regular",
  "500": "JetBrainsMono_500Medium",
  "600": "JetBrainsMono_600SemiBold",
  "700": "JetBrainsMono_700Bold",
};

export function Text({
  variant = "body",
  tone = "body",
  mono = false,
  tnum = false,
  align,
  uppercase,
  style,
  children,
  ...rest
}: TextProps) {
  const { colors, typography } = useTheme();
  const scale = typography.scale[variant];

  let color: string;
  switch (tone) {
    case "heading":
      color = colors.text.heading;
      break;
    case "muted":
      color = colors.text.muted;
      break;
    case "dim":
      color = colors.text.dim;
      break;
    case "brand":
      color = colors.brand.primary;
      break;
    case "ok":
      color = colors.status.ok;
      break;
    case "warn":
      color = colors.status.warn;
      break;
    case "err":
      color = colors.status.err;
      break;
    case "premium":
      color = colors.premium.base;
      break;
    default:
      color = colors.text.body;
  }

  const fontFamily = mono
    ? FONT_BY_WEIGHT_MONO[scale.fontWeight]
    : FONT_BY_WEIGHT_INTER[scale.fontWeight];

  const computed: TextStyle = {
    color,
    fontSize: scale.fontSize,
    lineHeight: scale.lineHeight,
    letterSpacing: scale.letterSpacing,
    fontFamily,
    fontWeight: scale.fontWeight,
    textAlign: align,
    textTransform: uppercase ? "uppercase" : undefined,
    fontVariant: tnum ? ["tabular-nums"] : undefined,
  };

  return (
    <RNText style={[computed, style]} {...rest}>
      {children}
    </RNText>
  );
}
