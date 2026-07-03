import type { Lesson } from "../types/learning";

export const lessons: Lesson[] = [
  {
    id: "spanish-hello",
    languageId: "spanish",
    unitId: "spanish-unit-1",
    title: "Say Hello",
    description: "Learn your first Spanish greetings and introductions.",
    level: "beginner",
    order: 1,
    xpReward: 10,
    estimatedMinutes: 5,
    goals: [
      {
        id: "spanish-hello-goal-1",
        description: "Recognize common Spanish greetings.",
      },
      {
        id: "spanish-hello-goal-2",
        description: "Introduce yourself with a short sentence.",
      },
    ],
    vocabulary: [
      {
        id: "spanish-vocab-hola",
        term: "hola",
        translation: "hello",
        pronunciation: "OH-lah",
        partOfSpeech: "expression",
        example: "Hola, Ana.",
      },
      {
        id: "spanish-vocab-gracias",
        term: "gracias",
        translation: "thank you",
        pronunciation: "GRAH-see-ahs",
        partOfSpeech: "expression",
        example: "Gracias, Luis.",
      },
      {
        id: "spanish-vocab-soy",
        term: "soy",
        translation: "I am",
        pronunciation: "soy",
        partOfSpeech: "verb",
        example: "Soy Mia.",
      },
    ],
    phrases: [
      {
        id: "spanish-phrase-hola",
        text: "Hola",
        translation: "Hello",
        pronunciation: "OH-lah",
        context: "Use this when greeting someone casually.",
      },
      {
        id: "spanish-phrase-me-llamo",
        text: "Me llamo Mia",
        translation: "My name is Mia",
        pronunciation: "meh YAH-moh MEE-ah",
        context: "Use this to introduce yourself.",
      },
    ],
    activities: [
      {
        id: "spanish-hello-activity-1",
        type: "vocabulary-card",
        prompt: "Learn this greeting.",
        vocabularyId: "spanish-vocab-hola",
      },
      {
        id: "spanish-hello-activity-2",
        type: "multiple-choice",
        prompt: "What does hola mean?",
        options: ["hello", "goodbye", "please"],
        correctOption: "hello",
      },
      {
        id: "spanish-hello-activity-3",
        type: "listen-and-repeat",
        prompt: "Listen, then repeat the phrase.",
        phraseId: "spanish-phrase-me-llamo",
      },
      {
        id: "spanish-hello-activity-4",
        type: "phrase-builder",
        prompt: "Build the phrase: My name is Mia.",
        words: ["Mia", "llamo", "Me"],
        answer: "Me llamo Mia",
      },
    ],
    aiTeacherPrompt: {
      persona:
        "You are Luna, a warm Spanish teacher who keeps beginners relaxed and confident.",
      teachingObjective:
        "Help the learner say hello and introduce themselves in Spanish.",
      conversationStarter: "Hola! Soy Luna. Como te llamas?",
      correctionStyle:
        "Correct gently, repeat the right phrase slowly, and praise small wins.",
      audioInstructions:
        "Speak clearly with short pauses. Ask the learner to repeat each greeting out loud.",
    },
  },
  {
    id: "spanish-cafe-order",
    languageId: "spanish",
    unitId: "spanish-unit-2",
    title: "Order a Drink",
    description: "Practice polite words for ordering at a cafe.",
    level: "beginner",
    order: 1,
    xpReward: 15,
    estimatedMinutes: 6,
    goals: [
      {
        id: "spanish-cafe-goal-1",
        description: "Ask for water or coffee politely.",
      },
      {
        id: "spanish-cafe-goal-2",
        description: "Use please and thank you in a short order.",
      },
    ],
    vocabulary: [
      {
        id: "spanish-vocab-agua",
        term: "agua",
        translation: "water",
        pronunciation: "AH-gwah",
        partOfSpeech: "noun",
        example: "Agua, por favor.",
      },
      {
        id: "spanish-vocab-cafe",
        term: "cafe",
        translation: "coffee",
        pronunciation: "kah-FEH",
        partOfSpeech: "noun",
        example: "Un cafe, por favor.",
      },
      {
        id: "spanish-vocab-por-favor",
        term: "por favor",
        translation: "please",
        pronunciation: "por fah-VOR",
        partOfSpeech: "expression",
        example: "Cafe, por favor.",
      },
    ],
    phrases: [
      {
        id: "spanish-phrase-un-cafe",
        text: "Un cafe, por favor",
        translation: "A coffee, please",
        pronunciation: "oon kah-FEH por fah-VOR",
        context: "Use this to order coffee politely.",
      },
      {
        id: "spanish-phrase-agua",
        text: "Agua, por favor",
        translation: "Water, please",
        pronunciation: "AH-gwah por fah-VOR",
        context: "Use this to ask for water.",
      },
    ],
    activities: [
      {
        id: "spanish-cafe-activity-1",
        type: "vocabulary-card",
        prompt: "Learn this cafe word.",
        vocabularyId: "spanish-vocab-cafe",
      },
      {
        id: "spanish-cafe-activity-2",
        type: "translation",
        prompt: "Translate: A coffee, please.",
        answer: "Un cafe, por favor",
        hint: "Start with un cafe.",
      },
      {
        id: "spanish-cafe-activity-3",
        type: "speaking-practice",
        prompt: "Ask for water politely.",
        expectedResponse: "Agua, por favor",
      },
    ],
    aiTeacherPrompt: {
      persona:
        "You are Mateo, a patient Spanish cafe coach who practices real-life ordering.",
      teachingObjective:
        "Help the learner order a drink using simple polite Spanish.",
      conversationStarter: "Bienvenido! Que quieres beber?",
      correctionStyle:
        "If the learner misses a polite word, model the full sentence and invite one more try.",
      audioInstructions:
        "Keep the roleplay short. Use a friendly cafe tone and wait for spoken responses.",
    },
  },
  {
    id: "french-bonjour",
    languageId: "french",
    unitId: "french-unit-1",
    title: "Bonjour",
    description: "Start a friendly French conversation.",
    level: "beginner",
    order: 1,
    xpReward: 10,
    estimatedMinutes: 5,
    goals: [
      {
        id: "french-bonjour-goal-1",
        description: "Say hello and thank you in French.",
      },
      {
        id: "french-bonjour-goal-2",
        description: "Ask someone how they are.",
      },
    ],
    vocabulary: [
      {
        id: "french-vocab-bonjour",
        term: "bonjour",
        translation: "hello",
        pronunciation: "bohn-ZHOOR",
        partOfSpeech: "expression",
        example: "Bonjour, Emma.",
      },
      {
        id: "french-vocab-merci",
        term: "merci",
        translation: "thank you",
        pronunciation: "mehr-SEE",
        partOfSpeech: "expression",
        example: "Merci beaucoup.",
      },
      {
        id: "french-vocab-ca-va",
        term: "ca va",
        translation: "how are you / I am fine",
        pronunciation: "sah vah",
        partOfSpeech: "expression",
        example: "Ca va?",
      },
    ],
    phrases: [
      {
        id: "french-phrase-bonjour",
        text: "Bonjour",
        translation: "Hello",
        pronunciation: "bohn-ZHOOR",
        context: "Use this during the day to greet someone.",
      },
      {
        id: "french-phrase-ca-va",
        text: "Ca va?",
        translation: "How are you?",
        pronunciation: "sah vah",
        context: "Use this after greeting a friend or teacher.",
      },
    ],
    activities: [
      {
        id: "french-bonjour-activity-1",
        type: "multiple-choice",
        prompt: "What does bonjour mean?",
        options: ["hello", "water", "good night"],
        correctOption: "hello",
      },
      {
        id: "french-bonjour-activity-2",
        type: "listen-and-repeat",
        prompt: "Listen, then repeat the question.",
        phraseId: "french-phrase-ca-va",
      },
      {
        id: "french-bonjour-activity-3",
        type: "translation",
        prompt: "Translate: Thank you.",
        answer: "Merci",
      },
    ],
    aiTeacherPrompt: {
      persona:
        "You are Camille, an encouraging French teacher who makes first conversations feel easy.",
      teachingObjective:
        "Help the learner greet someone and ask how they are in French.",
      conversationStarter: "Bonjour! Ca va aujourd'hui?",
      correctionStyle:
        "Use brief corrections and compare sounds only when it helps pronunciation.",
      audioInstructions:
        "Speak slowly and warmly. Let the learner hear bonjour and ca va twice before asking them to repeat.",
    },
  },
  {
    id: "japanese-konnichiwa",
    languageId: "japanese",
    unitId: "japanese-unit-1",
    title: "Konnichiwa",
    description: "Practice polite Japanese greetings.",
    level: "beginner",
    order: 1,
    xpReward: 10,
    estimatedMinutes: 6,
    goals: [
      {
        id: "japanese-konnichiwa-goal-1",
        description: "Recognize beginner Japanese greetings.",
      },
      {
        id: "japanese-konnichiwa-goal-2",
        description: "Introduce yourself politely.",
      },
    ],
    vocabulary: [
      {
        id: "japanese-vocab-konnichiwa",
        term: "konnichiwa",
        translation: "hello",
        pronunciation: "koh-nee-chee-wah",
        partOfSpeech: "expression",
        example: "Konnichiwa, Yuki-san.",
      },
      {
        id: "japanese-vocab-arigatou",
        term: "arigatou",
        translation: "thank you",
        pronunciation: "ah-ree-gah-toh",
        partOfSpeech: "expression",
        example: "Arigatou.",
      },
      {
        id: "japanese-vocab-watashi",
        term: "watashi",
        translation: "I",
        pronunciation: "wah-tah-shee",
        partOfSpeech: "noun",
        example: "Watashi wa Mia desu.",
      },
    ],
    phrases: [
      {
        id: "japanese-phrase-konnichiwa",
        text: "Konnichiwa",
        translation: "Hello",
        pronunciation: "koh-nee-chee-wah",
        context: "Use this as a polite daytime greeting.",
      },
      {
        id: "japanese-phrase-watashi-wa-mia-desu",
        text: "Watashi wa Mia desu",
        translation: "I am Mia",
        pronunciation: "wah-tah-shee wah MEE-ah dess",
        context: "Use this to introduce yourself politely.",
      },
    ],
    activities: [
      {
        id: "japanese-konnichiwa-activity-1",
        type: "vocabulary-card",
        prompt: "Learn this greeting.",
        vocabularyId: "japanese-vocab-konnichiwa",
      },
      {
        id: "japanese-konnichiwa-activity-2",
        type: "multiple-choice",
        prompt: "What does arigatou mean?",
        options: ["thank you", "hello", "coffee"],
        correctOption: "thank you",
      },
      {
        id: "japanese-konnichiwa-activity-3",
        type: "phrase-builder",
        prompt: "Build the phrase: I am Mia.",
        words: ["desu", "Mia", "Watashi", "wa"],
        answer: "Watashi wa Mia desu",
      },
      {
        id: "japanese-konnichiwa-activity-4",
        type: "speaking-practice",
        prompt: "Introduce yourself politely.",
        expectedResponse: "Watashi wa Mia desu",
      },
    ],
    aiTeacherPrompt: {
      persona:
        "You are Haru, a calm Japanese teacher who explains polite phrases in a beginner-friendly way.",
      teachingObjective:
        "Help the learner greet someone and introduce themselves politely in Japanese.",
      conversationStarter: "Konnichiwa! Watashi wa Haru desu.",
      correctionStyle:
        "Focus on rhythm and politeness. Correct one pronunciation detail at a time.",
      audioInstructions:
        "Use clear romaji pronunciation for now. Pause after each phrase so the learner can repeat.",
    },
  },
  {
    id: "german-hallo",
    languageId: "german",
    unitId: "german-unit-1",
    title: "Hallo",
    description: "Learn friendly German greetings and introductions.",
    level: "beginner",
    order: 1,
    xpReward: 10,
    estimatedMinutes: 5,
    goals: [
      {
        id: "german-hallo-goal-1",
        description: "Recognize common German greetings.",
      },
      {
        id: "german-hallo-goal-2",
        description: "Introduce yourself with a simple German sentence.",
      },
    ],
    vocabulary: [
      {
        id: "german-vocab-hallo",
        term: "hallo",
        translation: "hello",
        pronunciation: "HAH-loh",
        partOfSpeech: "expression",
        example: "Hallo, Emma.",
      },
      {
        id: "german-vocab-danke",
        term: "danke",
        translation: "thank you",
        pronunciation: "DAHN-kuh",
        partOfSpeech: "expression",
        example: "Danke, Lukas.",
      },
      {
        id: "german-vocab-ich",
        term: "ich",
        translation: "I",
        pronunciation: "ikh",
        partOfSpeech: "noun",
        example: "Ich bin Mia.",
      },
    ],
    phrases: [
      {
        id: "german-phrase-hallo",
        text: "Hallo",
        translation: "Hello",
        pronunciation: "HAH-loh",
        context: "Use this as a friendly everyday greeting.",
      },
      {
        id: "german-phrase-ich-bin-mia",
        text: "Ich bin Mia",
        translation: "I am Mia",
        pronunciation: "ikh bin MEE-ah",
        context: "Use this to introduce yourself.",
      },
    ],
    activities: [
      {
        id: "german-hallo-activity-1",
        type: "vocabulary-card",
        prompt: "Learn this German greeting.",
        vocabularyId: "german-vocab-hallo",
      },
      {
        id: "german-hallo-activity-2",
        type: "multiple-choice",
        prompt: "What does danke mean?",
        options: ["thank you", "hello", "coffee"],
        correctOption: "thank you",
      },
      {
        id: "german-hallo-activity-3",
        type: "listen-and-repeat",
        prompt: "Listen, then repeat the introduction.",
        phraseId: "german-phrase-ich-bin-mia",
      },
      {
        id: "german-hallo-activity-4",
        type: "phrase-builder",
        prompt: "Build the phrase: I am Mia.",
        words: ["Mia", "bin", "Ich"],
        answer: "Ich bin Mia",
      },
    ],
    aiTeacherPrompt: {
      persona:
        "You are Felix, a friendly German teacher who keeps first lessons simple and encouraging.",
      teachingObjective:
        "Help the learner say hello, thank someone, and introduce themselves in German.",
      conversationStarter: "Hallo! Ich bin Felix. Wie heisst du?",
      correctionStyle:
        "Correct gently, model the phrase at normal speed, then repeat it slowly.",
      audioInstructions:
        "Speak clearly with short pauses. Invite the learner to repeat hallo, danke, and ich bin out loud.",
    },
  },
];
