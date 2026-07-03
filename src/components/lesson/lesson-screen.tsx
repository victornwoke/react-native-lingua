import { type Href, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";
import { useLessonCatalog } from "@/hooks/use-lesson-catalog";
import { useLessonProgressStore } from "@/store/lesson-progress-store";

import { LessonCard } from "./lesson-card";

type LessonTab = "lessons" | "practice";

const HOME_ROUTE = "/home" as Href;

export function LessonScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<LessonTab>("lessons");
  const setActiveLessonId = useLessonProgressStore(
    (state) => state.setActiveLessonId,
  );
  const {
    activeLesson,
    items,
    selectedLanguage,
    totalLessons,
    unitProgressLabel,
  } = useLessonCatalog();

  function handleBackPress() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.push(HOME_ROUTE);
  }

  function handleLessonPress(item: (typeof items)[number]) {
    setActiveLessonId(selectedLanguage.id, item.lesson.id);
    router.push(`/lesson/${item.lesson.id}` as Href);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 112 }}
      >
        <View className="relative h-[318px] overflow-hidden bg-white">
          <View className="relative z-10 flex-row items-start justify-between px-[22px] pt-[4px]">
            <Pressable
              accessibilityRole="button"
              onPress={handleBackPress}
              className="mt-[18px] h-[38px] w-[38px] items-center justify-center rounded-full active:opacity-80"
            >
              <SymbolView
                name={{
                  ios: "chevron.left",
                  android: "arrow_back",
                  web: "arrow_back",
                }}
                size={27}
                tintColor="#0B1233"
                type="monochrome"
              />
            </Pressable>

            <View className="mx-[10px] mt-[19px] min-w-0 flex-1 items-center">
              <Text
                numberOfLines={1}
                className="text-center font-poppins-bold text-[18px] leading-[24px] text-[#0B1233]"
              >
                {activeLesson?.title ?? selectedLanguage.name}
              </Text>
              <Text className="mt-[3px] text-center font-poppins-semibold text-[12px] leading-[17px] text-[#737B98]">
                {unitProgressLabel}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              className="mt-[19px] h-[38px] w-[38px] items-center justify-center rounded-full active:opacity-80"
            >
              <SymbolView
                name={{ ios: "bookmark", android: "bookmark", web: "bookmark" }}
                size={31}
                tintColor="#6C4EF5"
                type="monochrome"
              />
            </Pressable>
          </View>

          <View className="absolute left-0 right-0 top-[86px] h-[178px] overflow-hidden bg-[#EEF9FF]">
            <View className="absolute left-[-28px] top-[22px] h-[70px] w-[118px] rounded-full bg-[#DDF2FF]" />
            <View className="absolute right-[50px] top-[12px] h-[50px] w-[94px] rounded-full bg-white" />
            <View className="absolute left-[120px] top-[48px] h-[72px] w-[150px] rounded-full bg-[#D8ECF8]" />
            <View className="absolute bottom-[40px] left-[-34px] h-[78px] w-[138px] rounded-full bg-[#A9D76D]" />
            <View className="absolute bottom-[31px] left-[70px] h-[56px] w-[126px] rounded-full bg-[#CFE6A3]" />
            <View className="absolute bottom-0 left-0 right-0 h-[52px] bg-[#EBD7B8]" />
            <View className="absolute bottom-[46px] left-[12px] h-[46px] w-[46px] rounded-full bg-[#6FBA31]" />
            <View className="absolute bottom-[39px] left-[38px] h-[34px] w-[34px] rounded-full bg-[#8ACB39]" />

            <View className="absolute bottom-[42px] right-[-10px] h-[82px] w-[112px] overflow-hidden rounded-t-[8px] border border-[#A55C35] bg-[#B87045]">
              <View className="h-[22px] bg-[#B53731]" />
              <View className="absolute left-0 right-0 top-[18px] h-[10px] bg-[#F57878]" />
              <View className="absolute left-[21px] top-[10px] rounded-[5px] bg-[#E1A849] px-[7px] py-[1px]">
                <Text className="font-poppins-bold text-[8px] leading-[11px] text-[#7B351C]">
                  CAFE
                </Text>
              </View>
              <View className="absolute bottom-[8px] left-[13px] h-[34px] w-[22px] rounded-[4px] bg-[#5B392A]" />
              <View className="absolute bottom-[12px] right-[19px] h-[28px] w-[32px] rounded-[4px] bg-[#79513B]" />
            </View>

            <Image
              source={images.palace}
              resizeMode="contain"
              className="absolute bottom-[20px] right-[-38px] h-[88px] w-[88px] opacity-90"
            />
            <Image
              source={images.mascotWelcome}
              resizeMode="contain"
              className="absolute bottom-[-16px] left-[104px] h-[128px] w-[128px]"
            />
            <View className="absolute bottom-[15px] left-[152px] h-[24px] w-[54px] rounded-full bg-[#8B542E]" />
            <View className="absolute bottom-[29px] left-[169px] h-[10px] w-[20px] rounded-full bg-[#F1D196]" />
          </View>

          <View className="absolute bottom-0 left-[18px] right-[18px] h-[54px] flex-row overflow-hidden rounded-[16px] bg-white">
            <SegmentButton
              isActive={selectedTab === "lessons"}
              label="Lessons"
              onPress={() => setSelectedTab("lessons")}
            />
            <SegmentButton
              isActive={selectedTab === "practice"}
              label="Practice"
              onPress={() => setSelectedTab("practice")}
            />
          </View>
        </View>

        <View className="gap-[9px] px-[24px] pt-[18px]">
          {selectedTab === "lessons"
            ? items.map((item) => (
                <LessonCard
                  key={item.lesson.id}
                  item={item}
                  totalLessons={totalLessons}
                  onPress={() => handleLessonPress(item)}
                />
              ))
            : activeLesson?.activities.map((activity, index) => (
                <View
                  key={activity.id}
                  className="min-h-[76px] rounded-[16px] border border-[#EEF0F6] bg-white px-[18px] py-[13px]"
                  style={{
                    boxShadow: "0 4px 14px rgba(13, 19, 43, 0.04)",
                  }}
                >
                  <Text className="font-poppins-bold text-[12px] leading-[17px] text-[#6545F6]">
                    Practice {index + 1}
                  </Text>
                  <Text
                    numberOfLines={2}
                    className="mt-[5px] font-poppins-semibold text-[15px] leading-[21px] text-[#111832]"
                  >
                    {activity.prompt}
                  </Text>
                </View>
              ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type SegmentButtonProps = {
  isActive: boolean;
  label: string;
  onPress: () => void;
};

function SegmentButton({ isActive, label, onPress }: SegmentButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isActive ? { selected: true } : undefined}
      onPress={onPress}
      className={`flex-1 items-center justify-center ${
        isActive ? "bg-white" : "bg-[#FAFAFE]"
      }`}
      style={{
        boxShadow: isActive ? "0 8px 24px rgba(13, 19, 43, 0.08)" : "none",
      }}
    >
      <Text
        className={`font-poppins-bold text-[15px] leading-[21px] ${
          isActive ? "text-[#6545F6]" : "text-[#56607D]"
        }`}
      >
        {label}
      </Text>
      {isActive ? (
        <View className="absolute bottom-0 h-[4px] w-full rounded-full bg-[#6545F6]" />
      ) : null}
    </Pressable>
  );
}
