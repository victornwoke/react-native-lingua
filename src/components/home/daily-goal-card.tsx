import { Image, Text, View } from "react-native";

import { images } from "@/constants/images";

type DailyGoalCardProps = {
  currentXp: number;
  goalXp: number;
  statusText: string;
};

export function DailyGoalCard({
  currentXp,
  goalXp,
  statusText,
}: DailyGoalCardProps) {
  const progressPercent = Math.min(Math.max(currentXp / goalXp, 0), 1) * 100;

  return (
    <View className="mt-[18px] min-h-[112px] overflow-hidden rounded-[16px] bg-[#FFF8EF] px-[18px] py-[15px]">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="font-poppins-semibold text-[15px] leading-[20px] text-[#26314E]">
            Daily goal
          </Text>

          <View className="mt-[10px] flex-row items-end">
            <Text className="font-poppins-bold text-[28px] leading-[33px] text-[#0B1438]">
              {currentXp}
            </Text>
            <Text className="mb-[4px] ml-[8px] font-poppins-semibold text-[15px] leading-[21px] text-[#8C95B0]">
              / {goalXp} XP
            </Text>
          </View>

          <Text
            numberOfLines={1}
            className="mt-[4px] max-w-[190px] font-poppins-semibold text-[12px] leading-[17px] text-[#9A6B37]"
          >
            {statusText}
          </Text>
        </View>

        <Image
          source={images.treasure}
          resizeMode="contain"
          className="-mr-[2px] h-[74px] w-[74px]"
        />
      </View>

      <View className="mt-[12px] h-[8px] overflow-hidden rounded-full bg-[#FFE2C3]">
        <View
          className="h-full rounded-full bg-[#FF7800]"
          style={{ width: `${progressPercent}%` }}
        />
      </View>
    </View>
  );
}
