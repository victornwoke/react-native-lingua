import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";

import { lessons } from "../../../data/lessons";
import type { Lesson } from "../../../types/learning";

const LEARN_ROUTE = "/learn" as Href;

export function AudioLessonScreen() {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const [isMicOn, setIsMicOn] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [, setEndedLessonId] = useState<string | undefined>();

  const lessonId =
    typeof params.lessonId === "string" ? params.lessonId : undefined;
  const lesson = lessons.find((item) => item.id === lessonId);
  const sceneHeight = Math.max(Math.min(height - 330, 470), 392);
  const mascotSize = Math.min(width - 76, sceneHeight - 104);

  function handleBackPress() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.push(LEARN_ROUTE);
  }

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
        <View className="px-[14px] pt-[6px]">
          <View className="relative h-[42px] flex-row items-center justify-between">
            <View className="w-[92px] items-start">
              <BackButton onPress={handleBackPress} />
            </View>

            <Text className="absolute left-[92px] right-[92px] text-center font-poppins-bold text-[19px] leading-[24px] text-[#050A28]">
              AI Teacher
            </Text>

            <View className="flex-row items-center gap-[7px]">
              <View className="h-[32px] flex-row items-center justify-center rounded-full bg-[#FAFAFE] px-[7px]">
                <SymbolView
                  name={{ ios: "video.fill", android: "videocam", web: "videocam" }}
                  size={13}
                  tintColor="#050A28"
                  type="monochrome"
                />
                <Text className="ml-[3px] font-poppins-bold text-[13px] leading-[17px] text-[#050A28]">
                  {lesson.estimatedMinutes}
                </Text>
              </View>
              <HeaderAction
                accessibilityLabel="Lesson reminders"
                icon={{
                  ios: "bell",
                  android: "notifications",
                  web: "notifications",
                }}
              />
            </View>
          </View>

          <View className="mt-[2px] flex-row items-center pl-[16px]">
            <View className="h-[8px] w-[8px] rounded-full bg-[#20D31C]" />
            <Text className="ml-[6px] font-poppins-semibold text-[13px] leading-[18px] text-[#21C16B]">
              Online
            </Text>
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
                width: mascotSize,
              }}
            />

            <View
              className="absolute bottom-[17px] left-[16px] right-[16px] min-h-[66px] rounded-[17px] bg-white px-[15px] py-[11px]"
              style={{
                boxShadow: "0 8px 18px rgba(13, 19, 43, 0.08)",
              }}
            >
              <Text className="font-poppins-bold text-[17px] leading-[22px] text-[#050A28]">
                {teacherReply}
              </Text>
              <Text
                numberOfLines={1}
                className="mt-[3px] pr-[42px] font-poppins-semibold text-[13px] leading-[18px] text-[#8B91A7]"
              >
                {showSubtitles
                  ? `Try: ${firstPhrase?.text ?? lesson.aiTeacherPrompt.conversationStarter}`
                  : "Subtitles are hidden"}
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

          <View className="mt-[20px] flex-row justify-between px-[8px]">
            <LessonControlButton
              icon={{ ios: "video.fill", android: "videocam", web: "videocam" }}
              label="Camera"
              onPress={() => undefined}
            />
            <LessonControlButton
              icon={{
                ios: isMicOn ? "mic.fill" : "mic.slash.fill",
                android: isMicOn ? "mic" : "mic_off",
                web: isMicOn ? "mic" : "mic_off",
              }}
              isMuted={!isMicOn}
              label="Mic"
              onPress={() => setIsMicOn((value) => !value)}
            />
            <LessonControlButton
              icon={{
                ios: "textformat",
                android: "text_fields",
                web: "text_fields",
              }}
              isMuted={!showSubtitles}
              label="Subtitles"
              onPress={() => setShowSubtitles((value) => !value)}
            />
            <LessonControlButton
              icon={{
                ios: "phone.down.fill",
                android: "call_end",
                web: "call_end",
              }}
              isDanger
              label="End Call"
              onPress={() => setEndedLessonId(lesson.id)}
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

type HeaderActionProps = {
  accessibilityLabel: string;
  icon: SymbolViewProps["name"];
};

function HeaderAction({ accessibilityLabel, icon }: HeaderActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="h-[38px] w-[38px] items-center justify-center rounded-full border border-[#ECEEF7] bg-white active:opacity-80"
    >
      <SymbolView
        name={icon}
        size={22}
        tintColor="#050A28"
        type="monochrome"
      />
    </Pressable>
  );
}

type LessonControlButtonProps = {
  icon: SymbolViewProps["name"];
  isDanger?: boolean;
  isMuted?: boolean;
  label: string;
  onPress: () => void;
};

function LessonControlButton({
  icon,
  isDanger = false,
  isMuted = false,
  label,
  onPress,
}: LessonControlButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="items-center"
      style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
    >
      <View
        className={`h-[56px] w-[56px] items-center justify-center rounded-full ${
          isDanger ? "bg-[#FF4247]" : isMuted ? "bg-[#EEF0F6]" : "bg-white"
        }`}
        style={{
          boxShadow: isDanger
            ? "none"
            : "0 8px 18px rgba(13, 19, 43, 0.06)",
        }}
      >
        <SymbolView
          name={icon}
          size={isDanger ? 29 : 26}
          tintColor={isDanger ? "#FFFFFF" : "#07113C"}
          type="monochrome"
        />
      </View>
      <Text className="mt-[6px] text-center font-poppins-bold text-[11px] leading-[15px] text-[#8B91A7]">
        {label}
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
