import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";
import {
  type AgentConnectionStatus,
  useStreamAudioCall,
} from "@/hooks/use-stream-audio-call";

import { lessons } from "../../../data/lessons";
import type { Lesson } from "../../../types/learning";

const LEARN_ROUTE = "/learn" as Href;

export function AudioLessonScreen() {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const autoStartedLessonIdRef = useRef<string | null>(null);

  const lessonId =
    typeof params.lessonId === "string" ? params.lessonId : undefined;
  const lesson = lessons.find((item) => item.id === lessonId);
  const streamAudioCall = useStreamAudioCall(lesson);
  const startStreamCall = streamAudioCall.startCall;
  const sceneHeight = Math.max(Math.min(height - 330, 470), 392);
  const mascotSize = Math.min(width - 76, sceneHeight - 104);
  const hasStatusError = Boolean(streamAudioCall.errorMessage);
  const statusColor = hasStatusError
    ? "#FF4247"
    : getStatusColor(streamAudioCall.status);
  const isConnecting =
    streamAudioCall.status === "loading" ||
    streamAudioCall.status === "connecting";

  function handleBackPress() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.push(LEARN_ROUTE);
  }

  async function handleEndCallPress() {
    await streamAudioCall.endCall();
    handleBackPress();
  }

  useEffect(() => {
    if (!lesson || autoStartedLessonIdRef.current === lesson.id) {
      return;
    }

    autoStartedLessonIdRef.current = lesson.id;
    void startStreamCall();
  }, [lesson, startStreamCall]);

  if (!lesson) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <StatusBar style="dark" />

        <View className="flex-1 px-[24px] pt-[18px]">
          <BackButton onPress={handleBackPress} />
          <View className="flex-1 items-center justify-center pb-[120px]">
            <Image
              source={images.mascotWelcome}
              resizeMode="contain"
              className="h-[168px] w-[168px]"
            />
            <Text className="mt-[16px] text-center font-poppins-bold text-[22px] leading-[29px] text-[#0B1233]">
              Lesson not found
            </Text>
            <Text className="mt-[8px] text-center font-poppins-semibold text-[14px] leading-[22px] text-[#737B98]">
              Pick another audio lesson from the learning path.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const firstPhrase = lesson.phrases[0];
  const teacherReply = getTeacherReply(lesson);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
      >
        <View className="px-[14px] pt-[4px]">
          <View className="relative h-[64px] flex-row items-center justify-between">
            <View className="w-[92px] items-start">
              <BackButton onPress={handleBackPress} />
            </View>

            <Text className="absolute left-[92px] right-[92px] text-center font-poppins-bold text-[20px] leading-[26px] text-[#050A28]">
              AI Teacher
            </Text>

            <HeaderEndCallButton
              disabled={!streamAudioCall.canEndCall}
              onPress={handleEndCallPress}
            />
          </View>

          <View className="mt-[2px] flex-row items-center justify-between pl-[16px] pr-[10px]">
            <View className="flex-row items-center">
              <View
                className={`h-[8px] w-[8px] rounded-full ${
                  hasStatusError
                    ? "bg-[#FF4247]"
                    : getStatusDotClass(streamAudioCall.status)
                }`}
              />
              <Text
                numberOfLines={1}
                className="ml-[6px] max-w-[190px] font-poppins-semibold text-[13px] leading-[18px]"
                style={{ color: statusColor }}
              >
                {streamAudioCall.statusLabel}
              </Text>
            </View>
            <View className="flex-row items-center gap-[6px]">
              <AgentStatusBadge status={streamAudioCall.agentStatus} />
              <Text
                numberOfLines={1}
                className="ml-[2px] max-w-[120px] text-right font-poppins-semibold text-[12px] leading-[17px] text-[#737B98]"
              >
                {streamAudioCall.displayName}
              </Text>
            </View>
          </View>

          <View
            className="mt-[12px] overflow-hidden rounded-[23px] bg-[#F7F4FF]"
            style={{ height: sceneHeight }}
          >
            <Image
              source={images.mascotWelcome}
              resizeMode="contain"
              className="self-center"
              style={{
                height: mascotSize,
                marginTop: 18,
                opacity: isConnecting ? 0.38 : 1,
                width: mascotSize,
              }}
            />

            <View
              className="absolute bottom-[17px] left-[16px] right-[16px] min-h-[66px] rounded-[17px] bg-white px-[15px] py-[11px]"
              style={{
                boxShadow: "0 8px 18px rgba(13, 19, 43, 0.08)",
              }}
            >
              <View className="flex-row items-center">
                {isConnecting ? (
                  <ActivityIndicator color="#A693F5" size="small" />
                ) : null}
                <Text
                  numberOfLines={1}
                  className={`font-poppins-bold text-[17px] leading-[22px] text-[#050A28] ${
                    isConnecting ? "ml-[11px]" : ""
                  }`}
                >
                  {getTeacherCardTitle(
                    lesson,
                    streamAudioCall.status,
                    teacherReply,
                  )}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                className="mt-[3px] pr-[42px] font-poppins-semibold text-[13px] leading-[18px] text-[#8B91A7]"
              >
                {getTeacherCardSubtitle(
                  lesson,
                  streamAudioCall.status,
                  firstPhrase?.text,
                )}
              </Text>

              <View className="absolute right-[16px] top-[19px] h-[42px] w-[42px] items-center justify-center rounded-full bg-[#F0E9FF]">
                <SymbolView
                  name={{
                    ios: "speaker.wave.2.fill",
                    android: "volume_up",
                    web: "volume_up",
                  }}
                  size={27}
                  tintColor="#5B3BF6"
                  type="monochrome"
                />
              </View>
            </View>
          </View>

          <View className="mt-[22px] items-center px-[8px]">
            <PushToTalkButton
              disabled={!streamAudioCall.canToggleMic}
              icon={{
                ios: streamAudioCall.isMicOn ? "mic.fill" : "mic.slash.fill",
                android: streamAudioCall.isMicOn ? "mic" : "mic_off",
                web: streamAudioCall.isMicOn ? "mic" : "mic_off",
              }}
              isListening={streamAudioCall.isMicOn}
              onPressIn={streamAudioCall.startTalking}
              onPressOut={streamAudioCall.stopTalking}
            />
          </View>

          <View className="mt-[24px] flex-row rounded-[18px] border border-[#EEF0F6] bg-white px-[5px] py-[13px]">
            <FeedbackColumn
              label="Speaking"
              value="Excellent"
              valueColor="#13C91B"
            />
            <Divider />
            <FeedbackColumn
              label="Pronunciation"
              value="Great"
              valueColor="#168BFF"
            />
            <Divider />
            <FeedbackColumn label="Grammar" value="Good" valueColor="#5B3BF6" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type BackButtonProps = {
  onPress: () => void;
};

function BackButton({ onPress }: BackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={onPress}
      className="h-[36px] w-[36px] items-center justify-center rounded-full active:opacity-80"
    >
      <SymbolView
        name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
        size={27}
        tintColor="#050A28"
        type="monochrome"
      />
    </Pressable>
  );
}

type HeaderEndCallButtonProps = {
  disabled?: boolean;
  onPress: () => void;
};

function HeaderEndCallButton({
  disabled = false,
  onPress,
}: HeaderEndCallButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="End call"
      disabled={disabled}
      onPress={onPress}
      className="h-[58px] w-[58px] items-center justify-center rounded-full bg-[#E5364B]"
      style={({ pressed }) => ({
        opacity: disabled ? 0.42 : pressed ? 0.82 : 1,
      })}
    >
      <SymbolView
        name={{ ios: "phone.down.fill", android: "call_end", web: "call_end" }}
        size={31}
        tintColor="#FFFFFF"
        type="monochrome"
      />
    </Pressable>
  );
}

type PushToTalkButtonProps = {
  disabled?: boolean;
  icon: SymbolViewProps["name"];
  isListening: boolean;
  onPressIn: () => Promise<void>;
  onPressOut: () => Promise<void>;
};

function PushToTalkButton({
  disabled = false,
  icon,
  isListening,
  onPressIn,
  onPressOut,
}: PushToTalkButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Hold to talk"
      disabled={disabled}
      onPressIn={() => {
        void onPressIn();
      }}
      onPressOut={() => {
        void onPressOut();
      }}
      className="items-center"
      style={({ pressed }) => ({
        opacity: disabled ? 0.44 : pressed ? 0.9 : 1,
      })}
    >
      <View
        className={`h-[92px] w-[92px] items-center justify-center rounded-full ${
          isListening ? "bg-[#21C16B]" : "bg-[#5B3BF6]"
        }`}
        style={{
          boxShadow: disabled ? "none" : "0 12px 28px rgba(91, 59, 246, 0.22)",
        }}
      >
        <SymbolView name={icon} size={39} tintColor="#FFFFFF" type="monochrome" />
      </View>
      <Text className="mt-[10px] text-center font-poppins-bold text-[13px] leading-[18px] text-[#737B98]">
        {isListening ? "Listening" : "Hold to talk"}
      </Text>
    </Pressable>
  );
}

type FeedbackColumnProps = {
  label: string;
  value: string;
  valueColor: string;
};

function FeedbackColumn({ label, value, valueColor }: FeedbackColumnProps) {
  return (
    <View className="min-w-0 flex-1 items-center">
      <Text
        numberOfLines={1}
        className="font-poppins-bold text-[12px] leading-[17px] text-[#050A28]"
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        className="mt-[7px] font-poppins-bold text-[12px] leading-[17px]"
        style={{ color: valueColor }}
      >
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View className="mx-[4px] h-[43px] w-[1px] bg-[#E7EAF3]" />;
}

type AgentStatusBadgeProps = {
  status: AgentConnectionStatus;
};

function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  if (status === "idle") {
    return null;
  }

  const label = getAgentStatusLabel(status);
  const dotColorClass = getAgentDotColorClass(status);
  const textColor = getAgentTextColor(status);

  return (
    <View className="flex-row items-center rounded-full bg-[#F4F5FA] px-[7px] py-[3px]">
      <View className={`h-[6px] w-[6px] rounded-full ${dotColorClass}`} />
      <Text
        numberOfLines={1}
        className="ml-[4px] font-poppins-semibold text-[11px] leading-[15px]"
        style={{ color: textColor }}
      >
        {label}
      </Text>
    </View>
  );
}

function getAgentStatusLabel(status: AgentConnectionStatus) {
  if (status === "connecting") {
    return "AI joining…";
  }

  if (status === "connected") {
    return "AI ready";
  }

  if (status === "failed") {
    return "AI offline";
  }

  return "";
}

function getAgentDotColorClass(status: AgentConnectionStatus) {
  if (status === "connected") {
    return "bg-[#21C16B]";
  }

  if (status === "failed") {
    return "bg-[#FF4247]";
  }

  return "bg-[#F2C900]";
}

function getAgentTextColor(status: AgentConnectionStatus) {
  if (status === "connected") {
    return "#21C16B";
  }

  if (status === "failed") {
    return "#FF4247";
  }

  return "#C4960A";
}

function getStatusColor(
  status: ReturnType<typeof useStreamAudioCall>["status"],
) {
  if (status === "error") {
    return "#FF4247";
  }

  if (status === "ended") {
    return "#8B91A7";
  }

  if (status === "loading" || status === "connecting") {
    return "#F2C900";
  }

  return "#21C16B";
}

function getStatusDotClass(
  status: ReturnType<typeof useStreamAudioCall>["status"],
) {
  if (status === "error") {
    return "bg-[#FF4247]";
  }

  if (status === "ended") {
    return "bg-[#A3A9BA]";
  }

  if (status === "loading" || status === "connecting") {
    return "bg-[#F2C900]";
  }

  return "bg-[#2ECC71]";
}

function getTeacherCardTitle(
  lesson: Lesson,
  status: ReturnType<typeof useStreamAudioCall>["status"],
  teacherReply: string,
) {
  if (status === "loading" || status === "connecting") {
    return "Connecting...";
  }

  if (status === "joined") {
    return lesson.aiTeacherPrompt.conversationStarter;
  }

  return teacherReply;
}

function getTeacherCardSubtitle(
  lesson: Lesson,
  status: ReturnType<typeof useStreamAudioCall>["status"],
  firstPhraseText: string | undefined,
) {
  if (status === "loading" || status === "connecting") {
    return "Setting up your lesson";
  }

  if (status === "joined") {
    return "Audio lesson in progress";
  }

  return `Try: ${firstPhraseText ?? lesson.aiTeacherPrompt.conversationStarter}`;
}

function getTeacherReply(lesson: Lesson) {
  if (!lesson.aiTeacherPrompt.conversationStarter) {
    return "Great work!";
  }

  if (lesson.languageId === "spanish") {
    return "Muy bien!";
  }

  if (lesson.languageId === "french") {
    return "Tres bien!";
  }

  if (lesson.languageId === "german") {
    return "Sehr gut!";
  }

  return "Great work!";
}
