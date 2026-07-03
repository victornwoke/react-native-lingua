import { Image, Pressable, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";

import { images } from "@/constants/images";

type NextUpCardProps = {
  onPress: () => void;
};

export function NextUpCard({ onPress }: NextUpCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mt-[18px] min-h-[102px] flex-row items-center overflow-hidden rounded-[16px] bg-[#F4FCEB] px-[18px] py-[14px] active:opacity-90"
    >
      <View className="flex-1">
        <Text className="font-poppins-semibold text-[13px] leading-[18px] text-[#69728F]">
          Next up
        </Text>
        <Text className="mt-[4px] font-poppins-bold text-[18px] leading-[24px] text-[#111832]">
          AI Video Call
        </Text>
        <Text className="mt-[3px] font-poppins-semibold text-[13px] leading-[18px] text-[#69728F]">
          Practice speaking
        </Text>
      </View>

      <View className="mr-[10px] h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full bg-white">
        <Image
          source={images.aiTeacherAvatar}
          resizeMode="cover"
          className="h-[68px] w-[68px]"
        />
      </View>

      <View className="h-[46px] w-[46px] items-center justify-center rounded-full bg-[#55C91B]">
        <SymbolView
          name={{ ios: "video.fill", android: "videocam", web: "videocam" }}
          size={23}
          tintColor="#FFFFFF"
          type="monochrome"
        />
      </View>
    </Pressable>
  );
}
