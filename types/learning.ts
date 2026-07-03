export type LanguageCode = "es" | "fr" | "ja" | "ko" | "de" | "zh";

export type LessonLevel = "beginner" | "intermediate" | "advanced";

export type ActivityType =
  | "listen-and-repeat"
  | "multiple-choice"
  | "phrase-builder"
  | "speaking-practice"
  | "translation"
  | "vocabulary-card";

export type Language = {
  id: string;
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  color: string;
  description: string;
  dailyGoalMinutes: number;
};

export type Unit = {
  id: string;
  languageId: Language["id"];
  title: string;
  description: string;
  level: LessonLevel;
  order: number;
  color: string;
};

export type VocabularyItem = {
  id: string;
  term: string;
  translation: string;
  pronunciation?: string;
  partOfSpeech: "adjective" | "expression" | "noun" | "verb";
  example: string;
};

export type Phrase = {
  id: string;
  text: string;
  translation: string;
  pronunciation?: string;
  context: string;
};

export type LessonGoal = {
  id: string;
  description: string;
};

export type AiTeacherPrompt = {
  persona: string;
  teachingObjective: string;
  conversationStarter: string;
  correctionStyle: string;
  audioInstructions: string;
};

export type LessonActivityBase = {
  id: string;
  type: ActivityType;
  prompt: string;
};

export type VocabularyCardActivity = LessonActivityBase & {
  type: "vocabulary-card";
  vocabularyId: VocabularyItem["id"];
};

export type MultipleChoiceActivity = LessonActivityBase & {
  type: "multiple-choice";
  options: string[];
  correctOption: string;
};

export type TranslationActivity = LessonActivityBase & {
  type: "translation";
  answer: string;
  hint?: string;
};

export type PhraseBuilderActivity = LessonActivityBase & {
  type: "phrase-builder";
  words: string[];
  answer: string;
};

export type ListenAndRepeatActivity = LessonActivityBase & {
  type: "listen-and-repeat";
  phraseId: Phrase["id"];
};

export type SpeakingPracticeActivity = LessonActivityBase & {
  type: "speaking-practice";
  expectedResponse: string;
};

export type LessonActivity =
  | ListenAndRepeatActivity
  | MultipleChoiceActivity
  | PhraseBuilderActivity
  | SpeakingPracticeActivity
  | TranslationActivity
  | VocabularyCardActivity;

export type Lesson = {
  id: string;
  languageId: Language["id"];
  unitId: Unit["id"];
  title: string;
  description: string;
  level: LessonLevel;
  order: number;
  xpReward: number;
  estimatedMinutes: number;
  goals: LessonGoal[];
  vocabulary: VocabularyItem[];
  phrases: Phrase[];
  activities: LessonActivity[];
  aiTeacherPrompt: AiTeacherPrompt;
};
