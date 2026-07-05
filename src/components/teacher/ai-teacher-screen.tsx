import { type Href, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";
import { useHomeDashboard, useStartVoiceCall } from "@/hooks/use-home-dashboard";
import { useLessonCatalog } from "@/hooks/use-lesson-catalog";

type TeacherPlanItem = {
  accentColor: string;
  action: "feedback" | "lesson" | "voice-call";
  actionLabel: string;
  backgroundColor: string;
  icon: SymbolViewProps["name"];
  subtitle: string;
  title: string;
};

const LEARN_ROUTE = "/learn" as Href;
const CHAT_ROUTE = "/chat" as Href;

export function AiTeacherScreen() {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const {
    currentLesson,
    dailyGoalXp,
    earnedXp,
    progressLabel,
    selectedLanguage,
    streakCount,
    unitLabel,
  } = useHomeDashboard();
  const { activeLessonIndex, items, totalLessons } = useLessonCatalog();
  const startVoiceCall = useStartVoiceCall({
    currentLesson,
    selectedLanguage,
  });

  const horizontalPadding = width < 380 ? 18 : 24;
  const topPadding = height < 720 ? 8 : 16;
  const shouldStackActions = width < 390;
  const contentWidth = width - horizontalPadding * 2;
  const shouldUsePlanGrid = contentWidth >= 520;
  const planCardWidth = shouldUsePlanGrid ? (contentWidth - 12) / 2 : undefined;
  const currentCatalogItem =
    items.find((item) => item.lesson.id === currentLesson?.id) ??
    items[activeLessonIndex];
  const currentLessonNumber =
    currentCatalogItem?.lessonNumber ?? activeLessonIndex + 1;
  const dailyProgressPercent =
    dailyGoalXp > 0 ? Math.min((earnedXp / dailyGoalXp) * 100, 100) : 0;
  const firstPhrase = currentLesson?.phrases[0];
  const vocabularyPreview = currentLesson?.vocabulary.slice(0, 3) ?? [];
  const teacherObjective =
    currentLesson?.aiTeacherPrompt.teachingObjective ??
    "Practice a short conversation with a friendly AI teacher.";
  const planItems: TeacherPlanItem[] = [
    {
      accentColor: "#6C4EF5",
      action: "voice-call",
      actionLabel: "Start",
      backgroundColor: "#F4F1FF",
      icon: { ios: "phone.fill", android: "call", web: "call" },
      subtitle: currentLesson
        ? `${currentLesson.estimatedMinutes} min voice call with instant feedback`
        : "Choose a lesson to unlock your voice room",
      title: "Voice call room",
    },
    {
      accentColor: "#21C16B",
      action: "lesson",
      actionLabel: "Practice",
      backgroundColor: "#ECFAF2",
      icon: { ios: "waveform", android: "graphic_eq", web: "graphic_eq" },
      subtitle: firstPhrase
        ? `Say "${firstPhrase.text}" with confidence`
        : "Warm up with beginner-friendly speaking drills",
      title: "Speaking warmup",
    },
    {
      accentColor: "#FF4D4F",
      action: "feedback",
      actionLabel: "Review",
      backgroundColor: "#FFF0F2",
      icon: {
        ios: "checkmark.seal.fill",
        android: "verified",
        web: "verified",
      },
      subtitle: "Get corrections for pronunciation and grammar",
      title: "Smart feedback",
    },
  ];

  function handleOpenLesson() {
    if (!currentLesson) {
      router.push(LEARN_ROUTE);
      return;
    }

    router.push(`/lesson/${currentLesson.id}` as Href);
  }

  function handleOpenLearn() {
    router.push(LEARN_ROUTE);
  }

  function handleOpenChat() {
    router.push(CHAT_ROUTE);
  }

  function handlePlanItemPress(action: TeacherPlanItem["action"]) {
    if (action === "voice-call") {
      startVoiceCall();
      return;
    }

    handleOpenLesson();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingBottom: 116,
          paddingHorizontal: horizontalPadding,
          paddingTop: topPadding,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <View className="min-w-0 flex-1 pr-[14px]">
            <Text className="font-poppins-bold text-[32px] leading-[38px] text-[#0D132B]">
              AI Teacher
            </Text>
            <Text
              numberOfLines={2}
              className="mt-[4px] font-poppins text-[14px] leading-[22px] text-[#6B7280]"
            >
              Practice {selectedLanguage.name} in a guided AI voice call.
            </Text>
          </View>

          <View className="h-[54px] w-[54px] items-center justify-center rounded-[18px] bg-[#ECFAF2]">
            <SymbolView
              name={{ ios: "mic.fill", android: "mic", web: "mic" }}
              size={28}
              tintColor="#21C16B"
              type="monochrome"
            />
          </View>
        </View>

        <View
          className="mt-[18px] overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-[#F6F7FB]"
          style={{ boxShadow: "0 10px 30px rgba(13, 19, 43, 0.06)" }}
        >
          <View className="absolute bottom-0 left-0 right-0 h-[92px] bg-[#E7F8EE]" />
          <View className="absolute bottom-0 left-0 h-[34px] w-full bg-[#21C16B]" />
          <View className="absolute bottom-[34px] right-[-12px] h-[78px] w-[154px] rounded-t-[34px] bg-[#D7F5E4]" />
          <View className="absolute left-[22px] top-[96px] h-[56px] w-[56px] rounded-full bg-white/70" />
          <View className="absolute right-[112px] top-[30px] h-[24px] w-[76px] rounded-full bg-white/80" />

          <View className="relative px-[20px] pb-[18px] pt-[18px]">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center rounded-full bg-white px-[12px] py-[7px]">
                <View className="h-[8px] w-[8px] rounded-full bg-[#21C16B]" />
                <Text className="ml-[7px] font-poppins-bold text-[12px] leading-[16px] text-[#21C16B]">
                  Voice room ready
                </Text>
              </View>

              <Text className="font-poppins-bold text-[13px] leading-[18px] text-[#21C16B]">
                {selectedLanguage.nativeName}
              </Text>
            </View>

            <Text
              numberOfLines={2}
              className="mt-[16px] max-w-[232px] font-poppins-bold text-[32px] leading-[38px] text-[#0D132B]"
            >
              Start today&apos;s voice call
            </Text>
            <Text
              numberOfLines={3}
              className="mt-[9px] max-w-[250px] font-poppins text-[14px] leading-[22px] text-[#6B7280]"
            >
              {teacherObjective}
            </Text>

            <View className="mt-[16px] w-[168px] flex-row items-center rounded-[18px] bg-white px-[12px] py-[10px]">
              <VoiceMeter />
              <View className="ml-[10px] min-w-0 flex-1">
                <Text className="font-poppins-bold text-[12px] leading-[16px] text-[#0D132B]">
                  Listening mode
                </Text>
                <Text
                  numberOfLines={1}
                  className="mt-[1px] font-poppins text-[11px] leading-[15px] text-[#6B7280]"
                >
                  Speak when ready
                </Text>
              </View>
            </View>

            <View className="mt-[18px] flex-row items-end justify-between">
              <View className="min-w-0 flex-1 rounded-[16px] bg-white px-[14px] py-[12px]">
                <Text className="font-poppins-bold text-[12px] leading-[17px] text-[#6C4EF5]">
                  Lesson {currentLesson ? currentLessonNumber : 1} of{" "}
                  {totalLessons}
                </Text>
                <Text
                  numberOfLines={1}
                  className="mt-[5px] font-poppins-semibold text-[20px] leading-[26px] text-[#0D132B]"
                >
                  {currentLesson?.title ?? "Choose your first lesson"}
                </Text>
                <Text
                  numberOfLines={1}
                  className="mt-[2px] font-poppins text-[13px] leading-[20px] text-[#6B7280]"
                >
                  {unitLabel} · {currentLesson?.xpReward ?? 0} XP
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Start AI voice call"
                onPress={startVoiceCall}
                className="ml-[12px] h-[58px] w-[58px] items-center justify-center rounded-full bg-[#21C16B]"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.86 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
              >
                <SymbolView
                  name={{ ios: "phone.fill", android: "call", web: "call" }}
                  size={27}
                  tintColor="#FFFFFF"
                  type="monochrome"
                />
              </Pressable>
            </View>
          </View>

          <Image
            source={images.aiTeacherAvatar}
            resizeMode="cover"
            className="absolute bottom-[66px] right-[18px] h-[86px] w-[86px] rounded-full border-[4px] border-white"
          />
          <View className="absolute bottom-[58px] right-[18px] h-[32px] w-[32px] items-center justify-center rounded-full bg-[#21C16B]">
            <SymbolView
              name={{ ios: "mic.fill", android: "mic", web: "mic" }}
              size={16}
              tintColor="#FFFFFF"
              type="monochrome"
            />
          </View>
        </View>

        <View
          className={`mt-[18px] gap-[10px] ${
            shouldStackActions ? "flex-col" : "flex-row"
          }`}
        >
          <PrimaryActionButton
            icon={{ ios: "phone.fill", android: "call", web: "call" }}
            isStacked={shouldStackActions}
            label="Start voice call"
            onPress={startVoiceCall}
          />
          <SecondaryActionButton
            isStacked={shouldStackActions}
            label="View lessons"
            onPress={handleOpenLearn}
          />
        </View>

        <View
          className="mt-[18px] rounded-[20px] border border-[#E5E7EB] bg-white px-[18px] py-[16px]"
          style={{ boxShadow: "0 2px 8px rgba(13, 19, 43, 0.04)" }}
        >
          <View className="flex-row items-center justify-between">
            <View className="min-w-0 flex-1 pr-[10px]">
              <Text className="font-poppins-semibold text-[20px] leading-[26px] text-[#0D132B]">
                Daily speaking goal
              </Text>
              <Text
                numberOfLines={1}
                className="mt-[2px] font-poppins text-[13px] leading-[20px] text-[#6B7280]"
              >
                {earnedXp} / {dailyGoalXp} XP earned today
              </Text>
            </View>
            <View className="h-[42px] min-w-[64px] items-center justify-center rounded-[14px] bg-[#FFF5E8] px-[12px]">
              <Text className="font-poppins-bold text-[15px] leading-[21px] text-[#FF8A00]">
                {streakCount} day
              </Text>
            </View>
          </View>

          <View className="mt-[14px] h-[12px] overflow-hidden rounded-full bg-[#EFF2F8]">
            <View
              className="h-full rounded-full bg-[#21C16B]"
              style={{ width: `${dailyProgressPercent}%` }}
            />
          </View>
          <Text
            numberOfLines={1}
            className="mt-[10px] font-poppins text-[13px] leading-[20px] text-[#6B7280]"
          >
            {progressLabel}
          </Text>
        </View>

        <View className="mt-[22px]">
          <Text className="font-poppins-semibold text-[24px] leading-[31px] text-[#0D132B]">
            Today&apos;s voice plan
          </Text>

          <View
            className={`mt-[12px] gap-[12px] ${
              shouldUsePlanGrid ? "flex-row flex-wrap" : ""
            }`}
          >
            {planItems.map((item, index) => (
              <TeacherPlanCard
                key={item.title}
                cardWidth={
                  shouldUsePlanGrid && index < 2 ? planCardWidth : undefined
                }
                item={item}
                onPress={() => handlePlanItemPress(item.action)}
              />
            ))}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleOpenLesson}
          className="mt-[22px] rounded-[20px] bg-[#F6F7FB] px-[18px] py-[16px]"
          style={({ pressed }) => ({
            opacity: pressed ? 0.88 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          })}
        >
          <View className="flex-row items-start justify-between">
            <View className="min-w-0 flex-1 pr-[12px]">
              <Text className="font-poppins-semibold text-[20px] leading-[26px] text-[#0D132B]">
                Lesson focus
              </Text>
              <Text
                className="mt-[3px] font-poppins text-[13px] leading-[20px] text-[#6B7280]"
              >
                {currentLesson?.description ??
                  "Pick a lesson and your AI teacher will prepare the voice room."}
              </Text>
            </View>

            <View className="h-[44px] w-[44px] items-center justify-center rounded-full bg-white">
              <SymbolView
                name={{
                  ios: "arrow.right",
                  android: "arrow_forward",
                  web: "arrow_forward",
                }}
                size={22}
                tintColor="#6C4EF5"
                type="monochrome"
              />
            </View>
          </View>

          {vocabularyPreview.length > 0 ? (
            <View className="mt-[14px] flex-row flex-wrap gap-[8px]">
              {vocabularyPreview.map((word) => (
                <View
                  key={word.id}
                  className="rounded-full bg-white px-[12px] py-[8px]"
                >
                  <Text className="font-poppins-bold text-[12px] leading-[16px] text-[#6C4EF5]">
                    {word.term}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={handleOpenChat}
          className="mt-[14px] min-h-[72px] flex-row items-center rounded-[18px] border border-[#E5E7EB] bg-white px-[16px] py-[12px]"
          style={({ pressed }) => ({
            boxShadow: "0 2px 8px rgba(13, 19, 43, 0.04)",
            opacity: pressed ? 0.86 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          })}
        >
          <View className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-[#EEF6FF]">
            <SymbolView
              name={{
                ios: "bubble.left.and.bubble.right.fill",
                android: "forum",
                web: "forum",
              }}
              size={24}
              tintColor="#4D8BFF"
              type="monochrome"
            />
          </View>
          <View className="ml-[14px] min-w-0 flex-1">
            <Text className="font-poppins-semibold text-[16px] leading-[22px] text-[#0D132B]">
              Warm up in chat
            </Text>
            <Text
              numberOfLines={1}
              className="mt-[2px] font-poppins text-[13px] leading-[20px] text-[#6B7280]"
            >
              Try the phrase before joining the voice call.
            </Text>
          </View>
          <SymbolView
            name={{
              ios: "chevron.right",
              android: "chevron_right",
              web: "chevron_right",
            }}
            size={22}
            tintColor="#9AA2B8"
            type="monochrome"
          />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type PrimaryActionButtonProps = {
  icon: SymbolViewProps["name"];
  isStacked: boolean;
  label: string;
  onPress: () => void;
};

function VoiceMeter() {
  const bars = [16, 24, 34, 22, 28] as const;

  return (
    <View className="h-[38px] w-[48px] flex-row items-center justify-center gap-[4px] rounded-[14px] bg-[#ECFAF2]">
      {bars.map((barHeight, index) => (
        <View
          key={`${barHeight}-${index}`}
          className="w-[4px] rounded-full bg-[#21C16B]"
          style={{ height: barHeight }}
        />
      ))}
    </View>
  );
}

function PrimaryActionButton({
  icon,
  isStacked,
  label,
  onPress,
}: PrimaryActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`min-h-[56px] flex-row items-center justify-center rounded-[16px] bg-[#6C4EF5] px-[16px] ${
        isStacked ? "w-full" : "min-w-0 flex-1"
      }`}
      style={({ pressed }) => ({
        boxShadow: "0 8px 18px rgba(108, 78, 245, 0.22)",
        opacity: pressed ? 0.86 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <SymbolView name={icon} size={22} tintColor="#FFFFFF" type="monochrome" />
      <Text
        numberOfLines={1}
        className="ml-[8px] shrink font-poppins-bold text-[16px] leading-[22px] text-white"
      >
        {label}
      </Text>
    </Pressable>
  );
}

type SecondaryActionButtonProps = {
  isStacked: boolean;
  label: string;
  onPress: () => void;
};

function SecondaryActionButton({
  isStacked,
  label,
  onPress,
}: SecondaryActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`min-h-[56px] items-center justify-center rounded-[16px] border border-[#E5E7EB] bg-white px-[16px] ${
        isStacked ? "w-full" : "min-w-0 flex-1"
      }`}
      style={({ pressed }) => ({
        opacity: pressed ? 0.78 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <Text
        numberOfLines={1}
        className="font-poppins-bold text-[16px] leading-[22px] text-[#0D132B]"
      >
        {label}
      </Text>
    </Pressable>
  );
}

type TeacherPlanCardProps = {
  cardWidth?: number;
  item: TeacherPlanItem;
  onPress: () => void;
};

function TeacherPlanCard({ cardWidth, item, onPress }: TeacherPlanCardProps) {
  const cardStyle: ViewStyle = {
    boxShadow: "0 2px 8px rgba(13, 19, 43, 0.04)",
    width: cardWidth ?? "100%",
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-h-[96px] rounded-[16px] border border-[#E5E7EB] bg-white px-[15px] py-[13px]"
      style={({ pressed }) => ({
        ...cardStyle,
        opacity: pressed ? 0.86 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View className="flex-row items-start">
        <View
          className="h-[48px] w-[48px] items-center justify-center rounded-[12px]"
          style={{ backgroundColor: item.backgroundColor }}
        >
          <SymbolView
            name={item.icon}
            size={24}
            tintColor={item.accentColor}
            type="monochrome"
          />
        </View>

        <View className="ml-[14px] min-w-0 flex-1">
          <Text
            numberOfLines={2}
            className="font-poppins-semibold text-[16px] leading-[22px] text-[#0D132B]"
          >
            {item.title}
          </Text>
          <Text
            numberOfLines={3}
            className="mt-[2px] font-poppins text-[13px] leading-[20px] text-[#6B7280]"
          >
            {item.subtitle}
          </Text>
        </View>
      </View>

      <View className="mt-[12px] flex-row items-center justify-between">
        <Text className="font-poppins-bold text-[12px] leading-[17px] text-[#6C4EF5]">
          {item.actionLabel}
        </Text>
        <View className="h-[28px] w-[28px] items-center justify-center rounded-full bg-[#F6F7FB]">
          <SymbolView
            name={{
              ios: "chevron.right",
              android: "chevron_right",
              web: "chevron_right",
            }}
            size={17}
            tintColor="#6B7280"
            type="monochrome"
          />
        </View>
      </View>
    </Pressable>
  );
}
