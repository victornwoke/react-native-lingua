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
    <View className="mt-[28px] min-h-[215px] overflow-hidden rounded-[18px] bg-[#6545F6]">
      <View className="absolute bottom-0 left-0 right-0 h-[118px] bg-[#5236D9]" />
      <View className="absolute bottom-0 left-[110px] h-[96px] w-[112px] rounded-t-[48px] bg-[#4931C9]" />
      <View className="absolute bottom-[40px] right-[30px] h-[106px] w-[110px] rounded-full bg-[#7558FA]" />
      <View className="absolute bottom-0 left-0 right-0 h-[52px] bg-[#6DE124]" />

      <View className="relative flex-1 px-[24px] py-[23px]">
        <Text className="font-poppins-semibold text-[19px] leading-[25px] text-white">
          Continue learning
        </Text>
        <Text className="mt-[15px] font-poppins-semibold text-[29px] leading-[35px] text-white">
          {languageName}
        </Text>
        <Text className="mt-[2px] font-poppins-medium text-[20px] leading-[27px] text-white">
          {unitLabel}
        </Text>

        <Pressable
          onPress={onPress}
          className="mt-[20px] h-[51px] w-[127px] items-center justify-center rounded-[15px] bg-white active:opacity-90"
        >
          <Text className="font-poppins-bold text-[18px] leading-[24px] text-[#6545F6]">
            Continue
          </Text>
        </Pressable>
      </View>

      <Image
        source={images.palace}
        resizeMode="contain"
        className="absolute bottom-[-4px] right-[-4px] h-[166px] w-[166px]"
      />
    </View>
  );
}
