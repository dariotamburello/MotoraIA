import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { useTheme } from "@/shared/hooks/useTheme";
import { type ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, type ViewProps } from "react-native";

export type PageTransitionProps = ViewProps & {
  children?: ReactNode;
};

export function PageTransition({ style, children, ...rest }: PageTransitionProps) {
  const { animations } = useTheme();
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(reduced ? 0 : 12)).current;

  useEffect(() => {
    const opacityAnim = Animated.timing(opacity, {
      toValue: 1,
      duration: 280,
      easing: Easing.bezier(...animations.easingBezier.premium),
      useNativeDriver: true,
    });

    if (reduced) {
      opacityAnim.start();
      return;
    }

    Animated.parallel([
      opacityAnim,
      Animated.timing(translateX, {
        toValue: 0,
        duration: 280,
        easing: Easing.bezier(...animations.easingBezier.premium),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateX, reduced, animations.easingBezier.premium]);

  return (
    <Animated.View style={[{ flex: 1, opacity, transform: [{ translateX }] }, style]} {...rest}>
      {children}
    </Animated.View>
  );
}
