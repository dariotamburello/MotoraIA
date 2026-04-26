import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { useTheme } from "@/shared/hooks/useTheme";
import { type ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, type ViewProps } from "react-native";

export type FadeUpProps = ViewProps & {
  delay?: number;
  translate?: number;
  children?: ReactNode;
};

export function FadeUp({ delay = 0, translate = 8, style, children, ...rest }: FadeUpProps) {
  const { animations } = useTheme();
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(reduced ? 0 : translate)).current;

  useEffect(() => {
    const delayMs = delay * animations.staggerStep;

    const opacityAnim = Animated.timing(opacity, {
      toValue: 1,
      duration: animations.duration.normal,
      delay: delayMs,
      easing: Easing.bezier(...animations.easingBezier.premium),
      useNativeDriver: true,
    });

    if (reduced) {
      opacityAnim.start();
      return;
    }

    Animated.parallel([
      opacityAnim,
      Animated.timing(translateY, {
        toValue: 0,
        duration: animations.duration.normal,
        delay: delayMs,
        easing: Easing.bezier(...animations.easingBezier.premium),
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    delay,
    opacity,
    translateY,
    reduced,
    animations.duration.normal,
    animations.easingBezier.premium,
    animations.staggerStep,
  ]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]} {...rest}>
      {children}
    </Animated.View>
  );
}
