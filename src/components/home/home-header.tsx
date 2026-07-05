import { SymbolView } from "expo-symbols";
import { Image, Pressable, Text, View } from "react-native";

import { images } from "@/constants/images";

import type { Language } from "../../../types/learning";

type HomeHeaderProps = {
  greeting: string;
  language: Language;
  userName: string;
  streakCount: number;
  onLanguagePress: () => void;
  onNotificationPress: () => void;
};

export function HomeHeader({
  greeting,
  language,
  onLanguagePress,
  onNotificationPress,
  streakCount,
  userName,
}: HomeHeaderProps) {
  return (
    <View className="flex-row items-center justify-between">
      <Pressable
        accessibilityLabel={`Change language from ${language.name}`}
        accessibilityRole="button"
        onPress={onLanguagePress}
        className="min-h-[44px] min-w-0 flex-1 flex-row items-center rounded-full active:opacity-80"
      >
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
      </Pressable>

      <View className="ml-[14px] flex-row items-center">
        <Image
          source={images.streakFire}
          resizeMode="contain"
          className="h-[28px] w-[28px]"
        />
        <Text className="ml-[4px] font-poppins-semibold text-[16px] leading-[22px] text-[#56617E]">
          {streakCount}
        </Text>

        <Pressable
          accessibilityLabel="Open profile"
          accessibilityRole="button"
          onPress={onNotificationPress}
          className="ml-[16px] h-[36px] w-[36px] items-center justify-center rounded-full active:bg-[#F5F4FF]"
        >
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
        </Pressable>
      </View>
    </View>
  );
}
