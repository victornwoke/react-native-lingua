import type { ImageSourcePropType } from "react-native";

const earth = require("../../assets/images/earth.png") as ImageSourcePropType;
const mascotAuth = require("../../assets/images/mascot-auth.png") as ImageSourcePropType;
const mascotLogo = require("../../assets/images/moscot-logo.png") as ImageSourcePropType;
const mascotWelcome = require("../../assets/images/mascot-welcome.png") as ImageSourcePropType;
const palace = require("../../assets/images/palace.png") as ImageSourcePropType;
const streakFire = require("../../assets/images/streak-fire.png") as ImageSourcePropType;
const treasure = require("../../assets/images/treasure.png") as ImageSourcePropType;

export const images = {
  earth,
  mascotAuth,
  mascotLogo,
  mascotWelcome,
  palace,
  streakFire,
  treasure,
} as const;
