import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Pressable, Text, View } from "react-native";

type TodayPlanItemId = "lesson" | "conversation" | "new-words";

type TodayPlanItem = {
  id: TodayPlanItemId;
  icon: SymbolViewProps["name"];
  iconColor: string;
  title: string;
  subtitle: string;
  isComplete: boolean;
};

type TodayPlanSectionProps = {
  items: TodayPlanItem[];
  onItemPress: (item: TodayPlanItem) => void;
  onViewAllPress: () => void;
};

export function TodayPlanSection({
  items,
  onItemPress,
  onViewAllPress,
}: TodayPlanSectionProps) {
  return (
    <View className="mt-[20px]">
      <View className="flex-row items-center justify-between">
        <Text className="font-poppins-bold text-[18px] leading-[24px] text-[#111832]">
          Today&apos;s plan
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onViewAllPress}
          className="min-h-[28px] justify-center px-1 active:opacity-80"
        >
          <Text className="font-poppins-bold text-[16px] leading-[22px] text-[#6545F6]">
            View all
          </Text>
        </Pressable>
      </View>

      <View className="mt-[14px] gap-[12px]">
        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={item.isComplete ? { checked: true } : undefined}
            onPress={() => onItemPress(item)}
            className="min-h-[54px] flex-row items-center rounded-[14px] active:bg-[#F8F7FF]"
          >
            <View
              className="h-[44px] w-[44px] items-center justify-center rounded-[11px]"
              style={{ backgroundColor: item.iconColor }}
            >
              <SymbolView
                name={item.icon}
                size={24}
                tintColor="#FFFFFF"
                type="monochrome"
              />
            </View>

            <View className="ml-[16px] flex-1">
              <Text
                numberOfLines={1}
                className="font-poppins-bold text-[15px] leading-[20px] text-[#1A213E]"
              >
                {item.title}
              </Text>
              <Text
                numberOfLines={1}
                className="mt-[2px] font-poppins-medium text-[13px] leading-[18px] text-[#858DA8]"
              >
                {item.subtitle}
              </Text>
            </View>

            <View
              className={`h-[26px] w-[26px] items-center justify-center rounded-full border-[3px] ${
                item.isComplete
                  ? "border-[#6545F6] bg-[#6545F6]"
                  : "border-[#8A92AD] bg-white"
              }`}
            >
              {item.isComplete ? (
                <Text className="font-poppins-bold text-[14px] leading-[18px] text-white">
                  ✓
                </Text>
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export type { TodayPlanItem, TodayPlanItemId };
