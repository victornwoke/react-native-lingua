import { Image, Pressable, Text, View } from "react-native";

import type { Language } from "../../../types/learning";

type LanguageCardProps = {
  language: Language;
  learnerCount: string;
  isSelected: boolean;
  onPress: () => void;
};

export function LanguageCard({
  language,
  learnerCount,
  isSelected,
  onPress,
}: LanguageCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`min-h-[52px] flex-row items-center rounded-[18px] border bg-white px-[14px] active:opacity-90 ${
        isSelected
          ? "border-[2px] border-[#8B68FF] bg-[#FBFAFF]"
          : "border-[#F3F4F8]"
      }`}
    >
      <View className="h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-full border border-[#EEF0F6] bg-white">
        <Image
          source={{ uri: language.flag }}
          resizeMode="cover"
          className="h-[34px] w-[34px] rounded-full"
        />
      </View>

      <View className="ml-[12px] flex-1">
        <Text className="font-poppins-semibold text-[15px] leading-[19px] text-[#030B2F]">
          {language.name}
        </Text>
        <Text className="font-poppins-medium text-[12px] leading-[16px] text-[#6D7693]">
          {learnerCount}
        </Text>
      </View>

      {isSelected ? (
        <View className="h-[26px] w-[26px] items-center justify-center rounded-full border-[3px] border-[#E8E2FF] bg-[#6547F7]">
          <Text className="font-poppins-bold text-[15px] leading-[19px] text-white">
            ✓
          </Text>
        </View>
      ) : (
        <Text className="font-poppins-medium text-[27px] leading-[29px] text-[#626B87]">
          ›
        </Text>
      )}
    </Pressable>
  );
}
