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
  onProfilePress: () => void;
};

export function HomeHeader({
  greeting,
  language,
  onLanguagePress,
  onProfilePress,
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

        <View className="ml-[10px] min-w-0 flex-1">
          <Text
            numberOfLines={1}
            className="font-poppins-bold text-[16px] leading-[22px] text-[#111832]"
          >
            {greeting}, {userName}! 👋
          </Text>

          <View className="mt-[2px] max-w-[132px] flex-row items-center rounded-full bg-[#F4F1FF] px-[8px] py-[2px]">
            <Text
              numberOfLines={1}
              className="min-w-0 flex-1 font-poppins-bold text-[11px] leading-[15px] text-[#6545F6]"
            >
              {language.name}
            </Text>
            <SymbolView
              name={{
                ios: "chevron.down",
                android: "keyboard_arrow_down",
                web: "keyboard_arrow_down",
              }}
              size={12}
              tintColor="#6545F6"
              type="monochrome"
            />
          </View>
        </View>
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
          onPress={onProfilePress}
          className="ml-[16px] h-[36px] w-[36px] items-center justify-center rounded-full active:bg-[#F5F4FF]"
        >
          <SymbolView
            name={{
              ios: "person.crop.circle",
              android: "account_circle",
              web: "account_circle",
            }}
            size={27}
            tintColor="#111832"
            type="monochrome"
          />
        </Pressable>
      </View>
    </View>
  );
}
