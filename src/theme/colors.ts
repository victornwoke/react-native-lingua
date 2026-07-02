export const colors = {
  brand: {
    purple: "#6C4EF5",
    deepPurple: "#5B3BF6",
    blue: "#4D8BFF",
    green: "#21C16B",
  },
  semantic: {
    success: "#21C16B",
    warning: "#FFC800",
    streak: "#FF8A00",
    error: "#FF4D4F",
    info: "#4D8BFF",
  },
  neutral: {
    textPrimary: "#0D132B",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    surface: "#F6F7FB",
    background: "#FFFFFF",
  },
} as const;

export type AppColors = typeof colors;

export type ColorName =
  | keyof typeof colors.brand
  | keyof typeof colors.semantic
  | keyof typeof colors.neutral;

export function getColor(
  category: "brand" | "semantic" | "neutral",
  colorName: string,
): string {
  const colorGroup = colors[category] as Record<string, string>;
  return colorGroup[colorName] || "#FFFFFF";
}
