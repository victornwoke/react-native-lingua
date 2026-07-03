import { Image, Text, View } from "react-native";

import { images } from "@/constants/images";

type DailyGoalCardProps = {
  currentXp: number;
  goalXp: number;
};

export function DailyGoalCard({ currentXp, goalXp }: DailyGoalCardProps) {
  const progressPercent = Math.min(Math.max(currentXp / goalXp, 0), 1) * 100;

  return (
    <View className="mt-[34px] min-h-[155px] overflow-hidden rounded-[18px] bg-[#FFF8EF] px-[24px] py-[21px]">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="font-poppins-semibold text-[17px] leading-[23px] text-[#26314E]">
            Daily goal
          </Text>

          <View className="mt-[17px] flex-row items-end">
            <Text className="font-poppins-bold text-[34px] leading-[39px] text-[#0B1438]">
              {currentXp}
            </Text>
            <Text className="mb-[5px] ml-[10px] font-poppins-semibold text-[18px] leading-[24px] text-[#8C95B0]">
              / {goalXp} XP
            </Text>
          </View>
        </View>

        <Image
          source={images.treasure}
          resizeMode="contain"
          className="-mr-[2px] mt-[5px] h-[92px] w-[92px]"
        />
      </View>

      <View className="mt-[22px] h-[10px] overflow-hidden rounded-full bg-[#FFE2C3]">
        <View
          className="h-full rounded-full bg-[#FF7800]"
          style={{ width: `${progressPercent}%` }}
        />
      </View>
    </View>
  );
}
