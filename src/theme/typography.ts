export const fontFamily = {
  regular: "Poppins-Regular",
  medium: "Poppins-Medium",
  semibold: "Poppins-SemiBold",
  bold: "Poppins-Bold",
} as const;

export type FontFamily = (typeof fontFamily)[keyof typeof fontFamily];

export const typography = {
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 38.4,
    fontWeight: 700,
  },
  h2: {
    fontFamily: fontFamily.semibold,
    fontSize: 24,
    lineHeight: 31.2,
    fontWeight: 600,
  },
  h3: {
    fontFamily: fontFamily.semibold,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 600,
  },
  h4: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 22.4,
    fontWeight: 500,
  },
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 25.6,
    fontWeight: 400,
  },
  bodyMedium: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 22.4,
    fontWeight: 400,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 20.8,
    fontWeight: 400,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 15.4,
    fontWeight: 400,
  },
} as const;

export type Typography = typeof typography;
