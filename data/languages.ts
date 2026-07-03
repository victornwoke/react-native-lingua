import type { Language } from "../types/learning";

export const languages: Language[] = [
  {
    id: "spanish",
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "https://flagcdn.com/w320/es.png",
    description: "Start simple conversations with friendly everyday phrases.",
    dailyGoalMinutes: 10,
    color: "#FF9500", // Optional color property for Spanish
  },
  {
    id: "french",
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "https://flagcdn.com/w320/fr.png",
    description: "Learn warm greetings, polite phrases, and useful basics.",
    dailyGoalMinutes: 10,
    color: "#4d88ff", // Optional color property for French
  },
  {
    id: "japanese",
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "https://flagcdn.com/w320/jp.png",
    description: "Practice beginner phrases for greetings and introductions.",
    dailyGoalMinutes: 10,
    color: "#FF3B30", // Optional color property for Japanese
  },
  // {
  //   id: "korean",
  //   code: "ko",
  //   name: "Korean",
  //   nativeName: "한국어",
  //   flag: "https://flagcdn.com/w320/kr.png",
  //   description: "Learn useful Korean greetings and friendly everyday phrases.",
  //   dailyGoalMinutes: 10,
  //   color: "#0F4C81",
  // },
  {
    id: "german",
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "https://flagcdn.com/w320/de.png",
    description: "Master basic German phrases for everyday conversations.",
    dailyGoalMinutes: 10,
    color: "#FFCC00", // Optional color property for German
  },
  // {
  //   id: "chinese",
  //   code: "zh",
  //   name: "Chinese",
  //   nativeName: "中文",
  //   flag: "https://flagcdn.com/w320/cn.png",
  //   description: "Practice beginner Chinese phrases for daily conversations.",
  //   dailyGoalMinutes: 10,
  //   color: "#DE2910",
  // },
];
