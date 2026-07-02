export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export type Spacing = typeof spacing;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
} as const;

export type Radius = typeof radius;

export const shadows = {
  card: "0px 10px 30px rgba(13, 19, 43, 0.06)",
  button: "0px 8px 18px rgba(108, 78, 245, 0.22)",
  sm: "0px 2px 8px rgba(13, 19, 43, 0.04)",
  md: "0px 4px 12px rgba(13, 19, 43, 0.08)",
  lg: "0px 8px 24px rgba(13, 19, 43, 0.12)",
} as const;

export type Shadows = typeof shadows;
