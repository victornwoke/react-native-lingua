import { SymbolView } from "expo-symbols";
import { Image, Pressable, Text, View } from "react-native";

import { images } from "@/constants/images";

type NextUpCardProps = {
  subtitle: string;
  onPress: () => void;
};

export function NextUpCard({ onPress, subtitle }: NextUpCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mt-[18px] min-h-[102px] flex-row items-center overflow-hidden rounded-[16px] bg-[#ECFAF2] px-[18px] py-[14px]"
      style={({ pressed }) => ({
        boxShadow: "0 2px 8px rgba(13, 19, 43, 0.04)",
        opacity: pressed ? 0.86 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View className="flex-1">
        <Text className="font-poppins text-[13px] leading-[20px] text-[#6B7280]">
          Next up
        </Text>
        <Text className="mt-[4px] font-poppins-semibold text-[20px] leading-[26px] text-[#0D132B]">
          AI Voice Call
        </Text>
        <Text
          numberOfLines={1}
          className="mt-[3px] font-poppins text-[13px] leading-[20px] text-[#6B7280]"
        >
          {subtitle}
        </Text>
      </View>

      <View className="mr-[10px] h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full bg-white">
        <Image
          source={images.aiTeacherAvatar}
          resizeMode="cover"
          className="h-[68px] w-[68px]"
        />
      </View>

      <View className="h-[46px] w-[46px] items-center justify-center rounded-full bg-[#21C16B]">
        <SymbolView
          name={{ ios: "phone.fill", android: "call", web: "call" }}
          size={23}
          tintColor="#FFFFFF"
          type="monochrome"
        />
      </View>
    </Pressable>
  );
}
