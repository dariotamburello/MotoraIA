import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { useTheme } from "@/shared/hooks/useTheme";
import { useEffect, useRef } from "react";
import { Animated, type ViewStyle } from "react-native";

export type SkeletonProps = {
  width?: number | string;
  height?: number;
  radius?: number;
};

export function Skeleton({ width = "100%", height = 16, radius = 8 }: SkeletonProps) {
  const { colors, animations } = useTheme();
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(reduced ? 0.7 : 0.5)).current;

  useEffect(() => {
    if (reduced) {
      opacity.setValue(0.7);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: animations.duration.slow,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: animations.duration.slow,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduced, animations.duration.slow]);

  const style: Animated.WithAnimatedObject<ViewStyle> = {
    width: width as ViewStyle["width"],
    height,
    borderRadius: radius,
    backgroundColor: colors.border.soft,
    opacity,
  };

  return <Animated.View style={style} />;
}
