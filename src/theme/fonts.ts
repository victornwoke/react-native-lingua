import { useFonts } from "expo-font";

import { fontFamily } from "./typography";

export function useAppFonts() {
  return useFonts({
    [fontFamily.regular]: require("../../assets/fonts/Poppins-Regular.ttf"),
    [fontFamily.medium]: require("../../assets/fonts/Poppins-Medium.ttf"),
    [fontFamily.semibold]: require("../../assets/fonts/Poppins-SemiBold.ttf"),
    [fontFamily.bold]: require("../../assets/fonts/Poppins-Bold.ttf"),
  });
}
