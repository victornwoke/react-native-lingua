import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Pressable, Text, View } from "react-native";

type TodayPlanItem = {
  id: string;
  icon: SymbolViewProps["name"];
  iconColor: string;
  title: string;
  subtitle: string;
  isComplete: boolean;
};

type TodayPlanSectionProps = {
  items: TodayPlanItem[];
};

export function TodayPlanSection({ items }: TodayPlanSectionProps) {
  return (
    <View className="mt-[31px]">
      <View className="flex-row items-center justify-between">
        <Text className="font-poppins-bold text-[20px] leading-[27px] text-[#111832]">
          Today&apos;s plan
        </Text>
        <Pressable className="min-h-[32px] justify-center px-1 active:opacity-80">
          <Text className="font-poppins-bold text-[19px] leading-[25px] text-[#6545F6]">
            View all
          </Text>
        </Pressable>
      </View>

      <View className="mt-[25px] gap-[22px]">
        {items.map((item) => (
          <View key={item.id} className="flex-row items-center">
            <View
              className="h-[53px] w-[53px] items-center justify-center rounded-[12px]"
              style={{ backgroundColor: item.iconColor }}
            >
              <SymbolView
                name={item.icon}
                size={30}
                tintColor="#FFFFFF"
                type="monochrome"
              />
            </View>

            <View className="ml-[22px] flex-1">
              <Text
                numberOfLines={1}
                className="font-poppins-bold text-[17px] leading-[23px] text-[#1A213E]"
              >
                {item.title}
              </Text>
              <Text
                numberOfLines={1}
                className="mt-[4px] font-poppins-medium text-[16px] leading-[22px] text-[#858DA8]"
              >
                {item.subtitle}
              </Text>
            </View>

            <View
              className={`h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] ${
                item.isComplete
                  ? "border-[#6545F6] bg-[#6545F6]"
                  : "border-[#8A92AD] bg-white"
              }`}
            >
              {item.isComplete ? (
                <Text className="font-poppins-bold text-[17px] leading-[22px] text-white">
                  ✓
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export type { TodayPlanItem };
