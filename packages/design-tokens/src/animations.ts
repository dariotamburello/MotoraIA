export const duration = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 600,
} as const;

export const easing = {
  premium: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  standard: "ease",
} as const;

export const easingBezier = {
  premium: [0.2, 0.7, 0.2, 1] as const,
  smooth: [0.4, 0, 0.2, 1] as const,
};

export const staggerStep = 40;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
