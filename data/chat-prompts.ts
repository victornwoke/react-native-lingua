export type ChatPrompt = {
  id: string;
  label: string;
  prompt: string;
  icon: "cafe" | "directions" | "intro";
};

export const chatPromptsByLanguageId: Record<string, ChatPrompt[]> = {
  french: [
    {
      id: "cafe",
      label: "Cafe order",
      prompt: "I would like a coffee and a croissant.",
      icon: "cafe",
    },
    {
      id: "directions",
      label: "Directions",
      prompt: "Excuse me, where is the train station?",
      icon: "directions",
    },
    {
      id: "intro",
      label: "Introduce me",
      prompt: "Hi, my name is Alex. Nice to meet you.",
      icon: "intro",
    },
  ],
  german: [
    {
      id: "cafe",
      label: "Cafe order",
      prompt: "I would like a coffee, please.",
      icon: "cafe",
    },
    {
      id: "directions",
      label: "Directions",
      prompt: "Excuse me, where is the train station?",
      icon: "directions",
    },
    {
      id: "intro",
      label: "Introduce me",
      prompt: "Hi, my name is Alex. Nice to meet you.",
      icon: "intro",
    },
  ],
  japanese: [
    {
      id: "cafe",
      label: "Cafe order",
      prompt: "Hello. Coffee, please.",
      icon: "cafe",
    },
    {
      id: "directions",
      label: "Directions",
      prompt: "Excuse me, where is the train station?",
      icon: "directions",
    },
    {
      id: "intro",
      label: "Introduce me",
      prompt: "Nice to meet you. I am Alex.",
      icon: "intro",
    },
  ],
  spanish: [
    {
      id: "cafe",
      label: "Cafe order",
      prompt: "Hi, I want a coffee with milk, please.",
      icon: "cafe",
    },
    {
      id: "directions",
      label: "Directions",
      prompt: "Excuse me, where is the station?",
      icon: "directions",
    },
    {
      id: "intro",
      label: "Introduce me",
      prompt: "Hello, my name is Alex. Nice to meet you.",
      icon: "intro",
    },
  ],
};
