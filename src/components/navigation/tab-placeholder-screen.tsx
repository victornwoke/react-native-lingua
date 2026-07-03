import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabPlaceholderScreenProps = {
  title: string;
  description: string;
};

export function TabPlaceholderScreen({
  description,
  title,
}: TabPlaceholderScreenProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View className="flex-1 items-center justify-center px-6 pb-[110px]">
        <Text className="text-center font-poppins-bold text-[30px] leading-[38px] text-[#030B2F]">
          {title}
        </Text>
        <Text className="mt-3 max-w-[280px] text-center font-poppins-medium text-[15px] leading-[24px] text-[#727A96]">
          {description}
        </Text>
      </View>
    </SafeAreaView>
  );
}
