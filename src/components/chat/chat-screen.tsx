import { Alert, Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/expo";

import { chatPromptsByLanguageId, type ChatPrompt } from "../../../data/chat-prompts";
import { images } from "@/constants/images";
import {
  interpretChatMessage,
  type ChatInterpretation,
} from "@/lib/chat-interpreter";
import { clerkAuthOptions } from "@/lib/clerk-auth";
import { useSelectedLanguage } from "@/store/language-store";

type ChatMode = "tutor" | "roleplay" | "quiz";
type MessageAuthor = "tutor" | "user";

type ChatMessage = {
  id: string;
  author: MessageAuthor;
  text?: string;
  translation?: string;
  interpretation?: ChatInterpretation & {
    sourceText: string;
  };
  correction?: string;
  timestamp: string;
};

type ModeOption = {
  id: ChatMode;
  label: string;
  icon: SymbolViewProps["name"];
};

const modeOptions: ModeOption[] = [
  {
    id: "tutor",
    label: "Tutor",
    icon: { ios: "sparkles", android: "auto_awesome", web: "auto_awesome" },
  },
  {
    id: "roleplay",
    label: "Role-play",
    icon: { ios: "theatermasks.fill", android: "theater_comedy", web: "theater_comedy" },
  },
  {
    id: "quiz",
    label: "Quiz",
    icon: { ios: "checkmark.seal.fill", android: "verified", web: "verified" },
  },
];

const speechLocales: Record<string, string> = {
  french: "fr-FR",
  german: "de-DE",
  japanese: "ja-JP",
  spanish: "es-ES",
};

const promptIconById: Record<ChatPrompt["icon"], SymbolViewProps["name"]> = {
  cafe: { ios: "cup.and.saucer.fill", android: "local_cafe", web: "local_cafe" },
  directions: { ios: "map.fill", android: "map", web: "map" },
  intro: { ios: "person.wave.2.fill", android: "waving_hand", web: "waving_hand" },
};

function getTimestamp() {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

function getStarterMessage(languageName: string): ChatMessage {
  return {
    id: "starter",
    author: "tutor",
    text: `Type a message in English and I will interpret it into ${languageName}.`,
    translation: "Use the quick prompts or write your own everyday sentence.",
    timestamp: getTimestamp(),
  };
}

function speakPronunciation(text: string, language: string) {
  if (process.env.EXPO_OS === "web" && "speechSynthesis" in globalThis) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.pitch = 1;
    utterance.rate = 0.86;
    globalThis.speechSynthesis.cancel();
    globalThis.speechSynthesis.speak(utterance);
    return;
  }

  Alert.alert(
    "Pronunciation unavailable",
    "Audio pronunciation needs a rebuilt development client with expo-speech included.",
  );
}

function buildTutorReply(
  id: string,
  mode: ChatMode,
  languageName: string,
): ChatMessage {
  if (mode === "quiz") {
    return {
      id,
      author: "tutor",
      text: `Nice. Now that you have the ${languageName} version, quick check: which word feels most important in the new phrase?`,
      translation: "Reply in English with the key idea, then try another message.",
      timestamp: getTimestamp(),
    };
  }

  if (mode === "roleplay") {
    return {
      id,
      author: "tutor",
      text: `Great. I will play the local next: Would you like anything else?`,
      translation: "Answer in English and I will interpret the next line too.",
      timestamp: getTimestamp(),
    };
  }

  return {
    id,
    author: "tutor",
    text: `Great. Use that ${languageName} phrase aloud, then try another English sentence with one detail.`,
    translation: "Try adding time, place, or quantity.",
    timestamp: getTimestamp(),
  };
}

export function ChatScreen() {
  const { getToken } = useAuth(clerkAuthOptions);
  const insets = useSafeAreaInsets();
  const selectedLanguage = useSelectedLanguage();
  const { height, width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const nextMessageId = useRef(1);
  const languageName = selectedLanguage?.name ?? "Spanish";
  const languageId = selectedLanguage?.id ?? "spanish";
  const nativeName = selectedLanguage?.nativeName ?? "Español";
  const suggestions =
    chatPromptsByLanguageId[languageId] ?? chatPromptsByLanguageId.spanish;
  const horizontalPadding = width < 380 ? 18 : 24;
  const topPadding = height < 720 ? 8 : 16;
  const contentWidth = width - horizontalPadding * 2;
  const shouldUseWideLayout = contentWidth >= 620;
  const [mode, setMode] = useState<ChatMode>("tutor");
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showTranslations, setShowTranslations] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    getStarterMessage(languageName),
  ]);
  const replyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const practiceScore = useMemo(() => {
    const userMessages = messages.filter((message) => message.author === "user");
    return Math.min(100, 24 + userMessages.length * 19);
  }, [messages]);
  const hasStartedChat = practiceScore > 24;
  const composerBottomPadding = insets.bottom + 96;

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => {
      clearTimeout(timeout);
    };
  }, [messages, isTyping]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (replyTimeoutRef.current) {
        clearTimeout(replyTimeoutRef.current);
      }
    };
  }, []);

  async function handleSendMessage(messageText = draft) {
    const trimmedText = messageText.trim();

    if (!trimmedText || isTyping) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${nextMessageId.current}`,
      author: "user",
      text: trimmedText,
      timestamp: getTimestamp(),
    };
    const interpretationMessageId = `interpretation-${nextMessageId.current + 1}`;
    const tutorMessageId = `tutor-${nextMessageId.current + 2}`;
    nextMessageId.current += 3;

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setDraft("");
    setIsTyping(true);

    try {
      const clerkSessionToken = await getToken({ skipCache: true });

      if (!clerkSessionToken) {
        throw new Error("Your session expired. Please sign in again.");
      }

      const interpretation = await interpretChatMessage({
        clerkSessionToken,
        languageId,
        text: trimmedText,
      });

      if (!isMountedRef.current) {
        return;
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: interpretationMessageId,
          author: "tutor",
          interpretation: {
            ...interpretation,
            sourceText: trimmedText,
          },
          timestamp: getTimestamp(),
        },
      ]);

      replyTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) {
          return;
        }

        setMessages((currentMessages) => [
          ...currentMessages,
          buildTutorReply(tutorMessageId, mode, languageName),
        ]);
        setIsTyping(false);
        replyTimeoutRef.current = null;
      }, 650);
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: interpretationMessageId,
          author: "tutor",
          text:
            error instanceof Error
              ? error.message
              : "Could not interpret this message. Please try again.",
          timestamp: getTimestamp(),
        },
      ]);
      setIsTyping(false);
    }
  }

  function handleSuggestionPress(suggestion: ChatPrompt) {
    handleSendMessage(suggestion.prompt);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View className="flex-1">
          <ScrollView
            ref={scrollRef}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{
              paddingBottom: 18,
              paddingHorizontal: horizontalPadding,
              paddingTop: topPadding,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              className={shouldUseWideLayout ? "mx-auto w-full max-w-[720px]" : ""}
            >
              <View className="flex-row items-center justify-between">
                <View className="min-w-0 flex-1 pr-[14px]">
                  <Text className="font-poppins-bold text-[32px] leading-[38px] text-[#0D132B]">
                    AI Chat
                  </Text>
                  <Text
                    numberOfLines={2}
                    className="mt-[4px] font-poppins text-[14px] leading-[22px] text-[#6B7280]"
                  >
                    Type in English and get a clear {languageName} interpretation.
                  </Text>
                </View>

                <View className="h-[54px] w-[54px] items-center justify-center overflow-hidden rounded-[18px] bg-[#F4F1FF]">
                  {selectedLanguage ? (
                    <Image
                      source={{ uri: selectedLanguage.flag }}
                      resizeMode="cover"
                      className="h-[54px] w-[54px]"
                    />
                  ) : (
                    <Image
                      source={images.mascotWelcome}
                      resizeMode="contain"
                      className="h-[44px] w-[44px]"
                    />
                  )}
                </View>
              </View>

              {hasStartedChat ? (
                <View
                  className="mt-[16px] flex-row items-center rounded-[20px] border border-[#E5E7EB] bg-[#F6F7FB] px-[14px] py-[12px]"
                  style={styles.heroCard}
                >
                  <View className="h-[42px] w-[42px] items-center justify-center rounded-[15px] bg-[#ECFAF2]">
                    <View className="h-[10px] w-[10px] rounded-full bg-[#21C16B]" />
                  </View>

                  <View className="ml-[12px] min-w-0 flex-1">
                    <Text className="font-poppins-bold text-[14px] leading-[20px] text-[#0D132B]">
                      Interpreting in {nativeName}
                    </Text>
                    <View className="mt-[7px] h-[7px] overflow-hidden rounded-full bg-[#E5E7EB]">
                      <View
                        className="h-full rounded-full bg-[#6C4EF5]"
                        style={{ width: `${practiceScore}%` }}
                      />
                    </View>
                  </View>

                  <Pressable
                    accessibilityLabel={
                      showTranslations ? "Hide interpretations" : "Show interpretations"
                    }
                    accessibilityRole="button"
                    onPress={() => setShowTranslations((currentValue) => !currentValue)}
                    className="ml-[12px] h-[44px] w-[44px] items-center justify-center rounded-full bg-[#6C4EF5]"
                    style={({ pressed }) => [
                      styles.roundButton,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <SymbolView
                      name={{
                        ios: showTranslations ? "text.bubble.fill" : "text.bubble",
                        android: "translate",
                        web: "translate",
                      }}
                      size={21}
                      tintColor="#FFFFFF"
                      type="monochrome"
                    />
                  </Pressable>
                </View>
              ) : (
                <View
                  className="mt-[18px] overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-[#F6F7FB]"
                  style={styles.heroCard}
                >
                  <View className="absolute bottom-0 left-0 right-0 h-[78px] bg-[#EBF2FF]" />
                  <View className="absolute bottom-0 left-0 h-[34px] w-full bg-[#4D8BFF]" />
                  <View className="absolute right-[-24px] top-[22px] h-[126px] w-[126px] rounded-full bg-[#E9E5FF]" />
                  <View className="absolute right-[74px] top-[52px] h-[38px] w-[94px] rounded-full bg-white/80" />
                  <View className="absolute left-[18px] top-[88px] h-[50px] w-[50px] rounded-full bg-white/60" />

                  <View className="relative px-[18px] py-[18px]">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center rounded-full bg-white px-[12px] py-[7px]">
                        <View className="h-[8px] w-[8px] rounded-full bg-[#21C16B]" />
                        <Text className="ml-[7px] font-poppins-bold text-[12px] leading-[16px] text-[#21C16B]">
                          Tutor online
                        </Text>
                      </View>

                      <Text className="font-poppins-bold text-[13px] leading-[18px] text-[#6C4EF5]">
                        {nativeName}
                      </Text>
                    </View>

                    <Text className="mt-[15px] max-w-[310px] font-poppins-bold text-[27px] leading-[34px] text-[#0D132B]">
                      Build a conversation streak
                    </Text>
                    <Text
                      numberOfLines={3}
                      className="mt-[8px] max-w-[270px] font-poppins text-[14px] leading-[22px] text-[#6B7280]"
                    >
                      Use hints, send an English sentence, and get a natural interpretation.
                    </Text>

                    <View className="mt-[18px] flex-row items-end justify-between">
                      <View className="min-w-0 flex-1 rounded-[18px] bg-white px-[14px] py-[12px]">
                        <View className="flex-row items-center justify-between">
                          <Text className="font-poppins-bold text-[12px] leading-[16px] text-[#6C4EF5]">
                            Fluency warmup
                          </Text>
                          <Text className="font-poppins-bold text-[12px] leading-[16px] text-[#4D8BFF]">
                            {practiceScore}%
                          </Text>
                        </View>
                        <View className="mt-[9px] h-[8px] overflow-hidden rounded-full bg-[#EEF0F6]">
                          <View
                            className="h-full rounded-full bg-[#6C4EF5]"
                            style={{ width: `${practiceScore}%` }}
                          />
                        </View>
                      </View>

                      <Pressable
                        accessibilityLabel={
                          showTranslations ? "Hide interpretations" : "Show interpretations"
                        }
                        accessibilityRole="button"
                        onPress={() => setShowTranslations((currentValue) => !currentValue)}
                        className="ml-[12px] h-[58px] w-[58px] items-center justify-center rounded-full bg-[#6C4EF5]"
                        style={({ pressed }) => [
                          styles.roundButton,
                          pressed ? styles.pressed : null,
                        ]}
                      >
                        <SymbolView
                          name={{
                            ios: showTranslations ? "text.bubble.fill" : "text.bubble",
                            android: "translate",
                            web: "translate",
                          }}
                          size={25}
                          tintColor="#FFFFFF"
                          type="monochrome"
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}

              <View className="mt-[16px] flex-row rounded-[18px] bg-[#F6F7FB] p-[4px]">
                {modeOptions.map((option) => {
                  const isActive = option.id === mode;

                  return (
                    <Pressable
                      key={option.id}
                      accessibilityLabel={`Switch to ${option.label} mode`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      onPress={() => setMode(option.id)}
                      className={`min-h-[46px] min-w-0 flex-1 flex-row items-center justify-center rounded-[15px] px-[8px] ${
                        isActive ? "bg-white" : ""
                      }`}
                      style={({ pressed }) => [
                        isActive ? styles.modeActive : null,
                        pressed ? styles.pressed : null,
                      ]}
                    >
                      <SymbolView
                        name={option.icon}
                        size={16}
                        tintColor={isActive ? "#6C4EF5" : "#8189A7"}
                        type="monochrome"
                      />
                      <Text
                        numberOfLines={1}
                        className={`ml-[6px] font-poppins-bold text-[12px] leading-[16px] ${
                          isActive ? "text-[#6C4EF5]" : "text-[#6B7280]"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <ScrollView
                horizontal
                contentContainerStyle={styles.suggestionRow}
                showsHorizontalScrollIndicator={false}
              >
                {suggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion.id}
                    accessibilityLabel={`Send ${suggestion.label} prompt`}
                    accessibilityRole="button"
                    onPress={() => handleSuggestionPress(suggestion)}
                    className="min-h-[46px] flex-row items-center rounded-full border border-[#E5E7EB] bg-white px-[14px]"
                    style={({ pressed }) => [
                      styles.suggestionChip,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <SymbolView
                      name={promptIconById[suggestion.icon]}
                      size={17}
                      tintColor="#4D8BFF"
                      type="monochrome"
                    />
                    <Text className="ml-[7px] font-poppins-bold text-[12px] leading-[16px] text-[#0D132B]">
                      {suggestion.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View className="mt-[16px]">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    languageId={languageId}
                    message={message}
                    showTranslations={showTranslations}
                  />
                ))}

                {isTyping ? <TypingBubble /> : null}
              </View>
            </View>
          </ScrollView>

          <View
            className="border-t border-[#E5E7EB] bg-white px-[18px] pt-[12px]"
            style={[styles.inputWrap, { paddingBottom: composerBottomPadding }]}
          >
            <View className={shouldUseWideLayout ? "mx-auto w-full max-w-[720px]" : ""}>
              <View className="flex-row items-end rounded-[24px] border border-[#E5E7EB] bg-[#F6F7FB] px-[14px] py-[10px]">
                <TextInput
                  accessibilityLabel="Message the AI tutor"
                  multiline
                  onChangeText={setDraft}
                  placeholder="Type message in English"
                  placeholderTextColor="#8B92A8"
                  returnKeyType="send"
                  style={styles.input}
                  textAlignVertical="top"
                  value={draft}
                />

                <Pressable
                  accessibilityLabel="Send message"
                  accessibilityRole="button"
                  disabled={!draft.trim() || isTyping}
                  onPress={() => handleSendMessage()}
                  className={`ml-[10px] h-[44px] w-[44px] items-center justify-center rounded-full ${
                    draft.trim() && !isTyping ? "bg-[#6C4EF5]" : "bg-[#D9DDE8]"
                  }`}
                  style={({ pressed }) => [
                    draft.trim() && !isTyping && pressed ? styles.pressed : null,
                  ]}
                >
                  <SymbolView
                    name={{ ios: "paperplane.fill", android: "send", web: "send" }}
                    size={20}
                    tintColor="#FFFFFF"
                    type="monochrome"
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({
  languageId,
  message,
  showTranslations,
}: {
  languageId: string;
  message: ChatMessage;
  showTranslations: boolean;
}) {
  const isUser = message.author === "user";
  const visibleInterpretation = showTranslations
    ? message.interpretation
    : undefined;
  const speechLocale = speechLocales[languageId] ?? "es-ES";

  function handleSpeak() {
    if (!visibleInterpretation) {
      return;
    }

    void speakPronunciation(visibleInterpretation.text, speechLocale);
  }

  return (
    <View className={`mb-[12px] flex-row ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <View className="mr-[9px] h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-full bg-[#F4F1FF]">
          <Image
            source={images.mascotWelcome}
            resizeMode="contain"
            className="h-[32px] w-[32px]"
          />
        </View>
      ) : null}

      <View
        className={`max-w-[82%] rounded-[22px] px-[15px] py-[12px] ${
          isUser ? "rounded-br-[8px] bg-[#6C4EF5]" : "rounded-bl-[8px] bg-[#F6F7FB]"
        }`}
      >
        {visibleInterpretation ? (
          <View className="mb-[9px] rounded-[14px] bg-white px-[10px] py-[8px]">
            <View className="flex-row items-center justify-between">
              <View className="min-w-0 flex-1 flex-row items-center">
                <SymbolView
                  name={{ ios: "character.book.closed.fill", android: "translate", web: "translate" }}
                  size={14}
                  tintColor="#6C4EF5"
                  type="monochrome"
                />
                <Text className="ml-[5px] font-poppins-bold text-[11px] leading-[15px] text-[#6C4EF5]">
                  Language coach
                </Text>
              </View>

              <Pressable
                accessibilityLabel="Hear correct pronunciation"
                accessibilityRole="button"
                onPress={handleSpeak}
                className="ml-[10px] h-[34px] w-[34px] items-center justify-center rounded-full bg-[#F4F1FF]"
                style={({ pressed }) => (pressed ? styles.pressed : null)}
              >
                <SymbolView
                  name={{ ios: "speaker.wave.2.fill", android: "volume_up", web: "volume_up" }}
                  size={17}
                  tintColor="#6C4EF5"
                  type="monochrome"
                />
              </Pressable>
            </View>
            <View className="mt-[8px] rounded-[12px] bg-[#F6F7FB] px-[9px] py-[7px]">
              <Text className="font-poppins-bold text-[11px] leading-[15px] text-[#6C4EF5]">
                You typed
              </Text>
              <Text className="mt-[2px] font-poppins text-[12px] leading-[18px] text-[#0D132B]">
                {visibleInterpretation.sourceText}
              </Text>
            </View>

            <View className="mt-[8px] rounded-[12px] bg-[#F4F1FF] px-[9px] py-[7px]">
              <Text className="font-poppins-bold text-[11px] leading-[15px] text-[#6C4EF5]">
                Say this
              </Text>
              <Text className="mt-[2px] font-poppins-semibold text-[14px] leading-[22px] text-[#0D132B]">
                {visibleInterpretation.text}
              </Text>
            </View>

            <View className="mt-[8px] rounded-[12px] bg-[#F6F7FB] px-[9px] py-[7px]">
              <Text className="font-poppins-bold text-[11px] leading-[15px] text-[#4D8BFF]">
                Meaning
              </Text>
              <Text className="mt-[2px] font-poppins text-[12px] leading-[18px] text-[#0D132B]">
                {visibleInterpretation.meaning}
              </Text>
            </View>
            <Text className="mt-[3px] font-poppins text-[11px] leading-[15px] text-[#6B7280]">
              {visibleInterpretation.note}
            </Text>
          </View>
        ) : null}

        {message.text ? (
          <Text
            className={`font-poppins text-[14px] leading-[22px] ${
              isUser ? "text-white" : "text-[#0D132B]"
            }`}
          >
            {message.text}
          </Text>
        ) : null}

        {showTranslations && message.translation ? (
          <Text className="mt-[7px] font-poppins text-[12px] leading-[18px] text-[#6B7280]">
            {message.translation}
          </Text>
        ) : null}

        {message.correction ? (
          <View className="mt-[9px] rounded-[14px] bg-white px-[10px] py-[8px]">
            <Text className="font-poppins-bold text-[11px] leading-[15px] text-[#21C16B]">
              Correction
            </Text>
            <Text className="mt-[2px] font-poppins text-[12px] leading-[18px] text-[#6B7280]">
              {message.correction}
            </Text>
          </View>
        ) : null}

        <Text
          className={`mt-[7px] font-poppins text-[11px] leading-[15px] ${
            isUser ? "text-white/70" : "text-[#8B92A8]"
          }`}
        >
          {message.timestamp}
        </Text>
      </View>
    </View>
  );
}

function TypingBubble() {
  return (
    <View className="mb-[12px] flex-row justify-start">
      <View className="mr-[9px] h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-full bg-[#F4F1FF]">
        <Image
          source={images.mascotWelcome}
          resizeMode="contain"
          className="h-[32px] w-[32px]"
        />
      </View>

      <View className="flex-row items-center rounded-[22px] rounded-bl-[8px] bg-[#F6F7FB] px-[15px] py-[14px]">
        <View className="h-[7px] w-[7px] rounded-full bg-[#8B92A8]" />
        <View className="mx-[5px] h-[7px] w-[7px] rounded-full bg-[#8B92A8]" />
        <View className="h-[7px] w-[7px] rounded-full bg-[#8B92A8]" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    boxShadow: "0 10px 30px rgba(13, 19, 43, 0.06)",
  },
  input: {
    color: "#0D132B",
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    lineHeight: 22,
    maxHeight: 110,
    minHeight: 44,
    padding: 0,
  },
  inputWrap: {
    boxShadow: "0 -8px 24px rgba(13, 19, 43, 0.05)",
  },
  keyboard: {
    flex: 1,
  },
  modeActive: {
    boxShadow: "0 4px 12px rgba(13, 19, 43, 0.08)",
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
  roundButton: {
    boxShadow: "0 8px 18px rgba(108, 78, 245, 0.22)",
  },
  suggestionChip: {
    boxShadow: "0 2px 8px rgba(13, 19, 43, 0.04)",
  },
  suggestionRow: {
    gap: 10,
    paddingTop: 14,
  },
});
