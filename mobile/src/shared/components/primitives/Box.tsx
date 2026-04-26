import { useTheme } from "@/shared/hooks/useTheme";
import type { RadiusToken, SpacingToken } from "@motora/design-tokens";
import type { ReactNode } from "react";
import { View, type ViewProps, type ViewStyle } from "react-native";

type BgToken =
  | "background.primary"
  | "background.secondary"
  | "background.elevated"
  | "background.overlay"
  | "brand.soft"
  | "brand.primary"
  | "transparent";

type BorderToken = "default" | "soft" | "hairline";

export type BoxProps = ViewProps & {
  bg?: BgToken;
  p?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
  pt?: SpacingToken;
  pb?: SpacingToken;
  m?: SpacingToken;
  mx?: SpacingToken;
  my?: SpacingToken;
  mt?: SpacingToken;
  mb?: SpacingToken;
  radius?: RadiusToken;
  border?: BorderToken;
  flex?: number | true;
  children?: ReactNode;
};

function resolveBg(
  token: BgToken | undefined,
  colors: ReturnType<typeof useTheme>["colors"],
): string | undefined {
  if (!token) return undefined;
  if (token === "transparent") return "transparent";
  if (token === "brand.primary") return colors.brand.primary;
  if (token === "brand.soft") return colors.brand.soft;
  const [group, key] = token.split(".") as ["background", keyof typeof colors.background];
  return colors[group][key];
}

export function Box({
  bg,
  p,
  px,
  py,
  pt,
  pb,
  m,
  mx,
  my,
  mt,
  mb,
  radius,
  border,
  flex,
  style,
  children,
  ...rest
}: BoxProps) {
  const { colors, spacing, radii } = useTheme();

  const computed: ViewStyle = {
    backgroundColor: resolveBg(bg, colors),
    padding: p !== undefined ? spacing[p] : undefined,
    paddingHorizontal: px !== undefined ? spacing[px] : undefined,
    paddingVertical: py !== undefined ? spacing[py] : undefined,
    paddingTop: pt !== undefined ? spacing[pt] : undefined,
    paddingBottom: pb !== undefined ? spacing[pb] : undefined,
    margin: m !== undefined ? spacing[m] : undefined,
    marginHorizontal: mx !== undefined ? spacing[mx] : undefined,
    marginVertical: my !== undefined ? spacing[my] : undefined,
    marginTop: mt !== undefined ? spacing[mt] : undefined,
    marginBottom: mb !== undefined ? spacing[mb] : undefined,
    borderRadius: radius !== undefined ? radii[radius] : undefined,
    borderWidth: border ? 1 : undefined,
    borderColor: border
      ? border === "default"
        ? colors.border.default
        : border === "soft"
          ? colors.border.soft
          : colors.border.hairline
      : undefined,
    flex: flex === true ? 1 : flex,
  };

  return (
    <View style={[computed, style]} {...rest}>
      {children}
    </View>
  );
}
