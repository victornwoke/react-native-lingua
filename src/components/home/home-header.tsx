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
        <View className="h-[44px] w-[44px] items-center justify-center overflow-hidden rounded-full border border-[#F0F1F6] bg-white">
          <Image
            source={{ uri: language.flag }}
            resizeMode="cover"
            className="h-[44px] w-[44px] rounded-full"
          />
        </View>

        <Text
          numberOfLines={1}
          className="ml-[14px] flex-1 font-poppins-bold text-[20px] leading-[26px] text-[#111832]"
        >
          {greeting}, {userName}! 👋
        </Text>
      </View>

      <View className="ml-3 flex-row items-center">
        <Image
          source={images.streakFire}
          resizeMode="contain"
          className="h-[34px] w-[34px]"
        />
        <Text className="ml-[5px] font-poppins-semibold text-[18px] leading-[25px] text-[#56617E]">
          {streakCount}
        </Text>

        <View className="ml-[20px] h-[34px] w-[34px] items-center justify-center">
          <SymbolView
            name={{
              ios: "bell",
              android: "notifications",
              web: "notifications",
            }}
            size={27}
            tintColor="#111832"
            type="monochrome"
          />
        </View>
      </View>
    </View>
  );
}
