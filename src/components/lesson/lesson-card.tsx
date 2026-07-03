import { SymbolView } from "expo-symbols";
import { Image, Pressable, Text, View } from "react-native";

import type { LessonCatalogItem } from "@/hooks/use-lesson-catalog";

type LessonCardProps = {
  item: LessonCatalogItem;
  totalLessons: number;
  onPress: () => void;
};

export function LessonCard({ item, onPress, totalLessons }: LessonCardProps) {
  const isCompleted = item.status === "completed";
  const isCurrent = item.status === "current";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`min-h-[94px] flex-row items-center rounded-[16px] border bg-white px-[18px] py-[13px] ${
        isCurrent ? "border-[#7B61FF] bg-[#FBFAFF]" : "border-[#EEF0F6]"
      }`}
      style={({ pressed }) => ({
        boxShadow: isCurrent
          ? "0 8px 20px rgba(108, 78, 245, 0.10)"
          : "0 4px 14px rgba(13, 19, 43, 0.04)",
        opacity: pressed ? 0.86 : 1,
      })}
    >
      <View className="min-w-0 flex-1">
        <Text
          className={`font-poppins-bold text-[12px] leading-[17px] ${
            isCurrent ? "text-[#6545F6]" : "text-[#8A92AD]"
          }`}
        >
          Lesson {item.lessonNumber}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-[6px] font-poppins-semibold text-[17px] leading-[23px] text-[#111832]"
        >
          {item.lesson.title}
        </Text>

        {isCurrent ? (
          <Text className="mt-[3px] font-poppins-bold text-[13px] leading-[18px] text-[#6545F6]">
            In progress
          </Text>
        ) : null}

        {!isCompleted && !isCurrent ? (
          <Text className="mt-[3px] font-poppins-semibold text-[13px] leading-[18px] text-[#8A92AD]">
            0 / {totalLessons} lessons
          </Text>
        ) : null}
      </View>

      <View className="ml-[14px] h-[48px] w-[48px] items-center justify-center">
        {isCompleted ? (
          <View className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#21C821]">
            <SymbolView
              name={{ ios: "checkmark", android: "check", web: "check" }}
              size={19}
              tintColor="#FFFFFF"
              type="monochrome"
            />
          </View>
        ) : null}

        {isCurrent ? (
          <Image
            source={item.imageSource}
            resizeMode="contain"
            className="h-[48px] w-[48px]"
          />
        ) : null}

        {!isCompleted && !isCurrent ? (
          <View className="h-[30px] w-[30px] items-center justify-center">
            <SymbolView
              name={{ ios: "lock", android: "lock", web: "lock" }}
              size={24}
              tintColor="#737B98"
              type="monochrome"
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
