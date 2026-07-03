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
      className="mt-[33px] min-h-[140px] flex-row items-center overflow-hidden rounded-[18px] bg-[#F4FCEB] px-[24px] py-[20px] active:opacity-90"
    >
      <View className="flex-1">
        <Text className="font-poppins-semibold text-[16px] leading-[22px] text-[#69728F]">
          Next up
        </Text>
        <Text className="mt-[7px] font-poppins-bold text-[21px] leading-[28px] text-[#111832]">
          AI Video Call
        </Text>
        <Text className="mt-[6px] font-poppins-semibold text-[16px] leading-[22px] text-[#69728F]">
          Practice speaking
        </Text>
      </View>

      <View className="mr-[14px] h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-full bg-white">
        <Image
          source={images.aiTeacherAvatar}
          resizeMode="cover"
          className="h-[92px] w-[92px]"
        />
      </View>

      <View className="h-[57px] w-[57px] items-center justify-center rounded-full bg-[#55C91B]">
        <SymbolView
          name={{ ios: "video.fill", android: "videocam", web: "videocam" }}
          size={27}
          tintColor="#FFFFFF"
          type="monochrome"
        />
      </View>
    </Pressable>
  );
}
