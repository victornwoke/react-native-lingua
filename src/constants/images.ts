import type { ImageSourcePropType } from "react-native";

const earth = require("../../assets/images/earth.png") as ImageSourcePropType;
const earthLanguageSelection = require("../../assets/images/earth-language-selection.png") as ImageSourcePropType;
const mascotAuth = require("../../assets/images/mascot-auth.png") as ImageSourcePropType;
const mascotLogo = require("../../assets/images/moscot-logo.png") as ImageSourcePropType;
const mascotWelcome = require("../../assets/images/mascot-welcome.png") as ImageSourcePropType;
const palace = require("../../assets/images/palace.png") as ImageSourcePropType;
const socialApple = require("../../assets/images/social-apple.png") as ImageSourcePropType;
const socialFacebook = require("../../assets/images/social-facebook.png") as ImageSourcePropType;
const socialGoogle = require("../../assets/images/social-google.png") as ImageSourcePropType;
const streakFire = require("../../assets/images/streak-fire.png") as ImageSourcePropType;
const treasure = require("../../assets/images/treasure.png") as ImageSourcePropType;

const aiTeacherAvatar = {
  uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80",
} as ImageSourcePropType;

export const images = {
  aiTeacherAvatar,
  earth,
  earthLanguageSelection,
  mascotAuth,
  mascotLogo,
  mascotWelcome,
  palace,
  socialApple,
  socialFacebook,
  socialGoogle,
  streakFire,
  treasure,
} as const;
