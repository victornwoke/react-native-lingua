import { Image, Pressable, Text, View } from "react-native";

import { images } from "@/constants/images";

type ContinueLearningCardProps = {
  actionLabel: string;
  languageName: string;
  lessonTitle: string;
  progressLabel: string;
  unitLabel: string;
  onPress: () => void;
};

export function ContinueLearningCard({
  actionLabel,
  languageName,
  lessonTitle,
  onPress,
  progressLabel,
  unitLabel,
}: ContinueLearningCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="mt-[16px] min-h-[166px] overflow-hidden rounded-[16px] bg-[#6545F6] active:opacity-95"
    >
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
        <Text
          numberOfLines={1}
          className="font-poppins-medium text-[16px] leading-[22px] text-white"
        >
          {unitLabel}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-[2px] max-w-[178px] font-poppins-semibold text-[12px] leading-[17px] text-[#D9CEFF]"
        >
          {progressLabel}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-[2px] max-w-[178px] font-poppins-semibold text-[12px] leading-[17px] text-white"
        >
          {lessonTitle}
        </Text>

        <View className="mt-[9px] h-[40px] w-[118px] items-center justify-center rounded-[13px] bg-white">
          <Text className="font-poppins-bold text-[15px] leading-[21px] text-[#6545F6]">
            {actionLabel}
          </Text>
        </View>
      </View>

      <Image
        source={images.palace}
        resizeMode="contain"
        className="absolute bottom-[-3px] right-[-6px] h-[128px] w-[128px]"
      />
    </Pressable>
  );
}
