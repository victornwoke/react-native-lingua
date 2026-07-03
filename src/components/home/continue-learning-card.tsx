import { Image, Pressable, Text, View } from "react-native";

import { images } from "@/constants/images";

type ContinueLearningCardProps = {
  languageName: string;
  unitLabel: string;
  onPress: () => void;
};

export function ContinueLearningCard({
  languageName,
  onPress,
  unitLabel,
}: ContinueLearningCardProps) {
  return (
    <View className="mt-[16px] min-h-[152px] overflow-hidden rounded-[16px] bg-[#6545F6]">
      <View className="absolute bottom-0 left-0 right-0 h-[84px] bg-[#5236D9]" />
      <View className="absolute bottom-0 left-[92px] h-[72px] w-[92px] rounded-t-[38px] bg-[#4931C9]" />
      <View className="absolute bottom-[28px] right-[22px] h-[82px] w-[86px] rounded-full bg-[#7558FA]" />
      <View className="absolute bottom-0 left-0 right-0 h-[35px] bg-[#6DE124]" />

      <View className="relative flex-1 px-[20px] py-[17px]">
        <Text className="font-poppins-semibold text-[15px] leading-[20px] text-white">
          Continue learning
        </Text>
        <Text className="mt-[8px] font-poppins-semibold text-[24px] leading-[30px] text-white">
          {languageName}
        </Text>
        <Text className="font-poppins-medium text-[16px] leading-[22px] text-white">
          {unitLabel}
        </Text>

        <Pressable
          onPress={onPress}
          className="mt-[11px] h-[40px] w-[106px] items-center justify-center rounded-[13px] bg-white active:opacity-90"
        >
          <Text className="font-poppins-bold text-[15px] leading-[21px] text-[#6545F6]">
            Continue
          </Text>
        </Pressable>
      </View>

      <Image
        source={images.palace}
        resizeMode="contain"
        className="absolute bottom-[-3px] right-[-6px] h-[128px] w-[128px]"
      />
    </View>
  );
}
