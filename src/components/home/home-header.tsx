import { SymbolView } from "expo-symbols";
import { Image, Text, View } from "react-native";

import { images } from "@/constants/images";

import type { Language } from "../../../types/learning";

type HomeHeaderProps = {
  greeting: string;
  language: Language;
  userName: string;
  streakCount: number;
};

export function HomeHeader({
  greeting,
  language,
  streakCount,
  userName,
}: HomeHeaderProps) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="min-w-0 flex-1 flex-row items-center">
        <View className="h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-full border border-[#F0F1F6] bg-white">
          <Image
            source={{ uri: language.flag }}
            resizeMode="cover"
            className="h-[38px] w-[38px] rounded-full"
          />
        </View>

        <Text
          numberOfLines={1}
          className="ml-[10px] min-w-0 flex-1 font-poppins-bold text-[16px] leading-[22px] text-[#111832]"
        >
          {greeting}, {userName}! 👋
        </Text>
      </View>

      <View className="ml-[14px] flex-row items-center">
        <Image
          source={images.streakFire}
          resizeMode="contain"
          className="h-[28px] w-[28px]"
        />
        <Text className="ml-[4px] font-poppins-semibold text-[16px] leading-[22px] text-[#56617E]">
          {streakCount}
        </Text>

        <View className="ml-[16px] h-[30px] w-[30px] items-center justify-center">
          <SymbolView
            name={{
              ios: "bell",
              android: "notifications",
              web: "notifications",
            }}
            size={24}
            tintColor="#111832"
            type="monochrome"
          />
        </View>
      </View>
    </View>
  );
}
