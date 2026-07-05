import type { LanguageCode, LessonLevel } from "./learning";

export type CallCustomData = {
  activities: string;
  audioInstructions: string;
  clerkUserId: string;
  conversationStarter: string;
  correctionStyle: string;
  estimatedMinutes: string;
  goals: string;
  languageCode: LanguageCode;
  languageId: string;
  languageName: string;
  languageNativeName: string;
  lessonDescription: string;
  lessonId: string;
  lessonLevel: LessonLevel;
  lessonTitle: string;
  phrases: string;
  streamUserId: string;
  teacherPersona: string;
  teachingObjective: string;
  vocabulary: string;
};

export type StreamAudioCallData = {
  created_by_id: string;
  custom: CallCustomData;
  members: {
    role: "admin";
    user_id: string;
  }[];
  settings_override: {
    audio: {
      default_device: "speaker";
      mic_default_on: boolean;
      speaker_default_on: boolean;
    };
    transcription: {
      closed_caption_mode: "auto-on";
      language: "auto";
      mode: "auto-on";
      speech_segment_config: {
        max_speech_caption_ms: number;
        silence_duration_ms: number;
      };
    };
    video: {
      camera_default_on: boolean;
      enabled: boolean;
      target_resolution: {
        height: number;
        width: number;
      };
    };
  };
};
