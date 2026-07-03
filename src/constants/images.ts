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

const lessonPlaceholderImages: Record<string, ImageSourcePropType> = {
  "spanish-cafe-order": {
    uri: "https://picsum.photos/seed/spanish-cafe-order/240/240",
  },
  "spanish-daily-life": {
    uri: "https://picsum.photos/seed/spanish-daily-life/240/240",
  },
  "spanish-family-friends": {
    uri: "https://picsum.photos/seed/spanish-family-friends/240/240",
  },
  "spanish-hello": mascotWelcome,
  "spanish-shopping": treasure,
  "spanish-travel-directions": palace,
  "french-bonjour": mascotWelcome,
  "french-cafe": {
    uri: "https://picsum.photos/seed/french-cafe/240/240",
  },
  "french-daily-life": {
    uri: "https://picsum.photos/seed/french-daily-life/240/240",
  },
  "french-family-friends": {
    uri: "https://picsum.photos/seed/french-family-friends/240/240",
  },
  "french-shopping": treasure,
  "french-travel-directions": palace,
  "german-cafe": {
    uri: "https://picsum.photos/seed/german-cafe/240/240",
  },
  "german-daily-life": {
    uri: "https://picsum.photos/seed/german-daily-life/240/240",
  },
  "german-family-friends": {
    uri: "https://picsum.photos/seed/german-family-friends/240/240",
  },
  "german-hallo": mascotWelcome,
  "german-shopping": treasure,
  "german-travel-directions": palace,
  "japanese-cafe": {
    uri: "https://picsum.photos/seed/japanese-cafe/240/240",
  },
  "japanese-daily-life": {
    uri: "https://picsum.photos/seed/japanese-daily-life/240/240",
  },
  "japanese-family-friends": {
    uri: "https://picsum.photos/seed/japanese-family-friends/240/240",
  },
  "japanese-konnichiwa": mascotWelcome,
  "japanese-shopping": treasure,
  "japanese-travel-directions": palace,
};

export const images = {
  aiTeacherAvatar,
  earth,
  earthLanguageSelection,
  lessonPlaceholderImages,
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
