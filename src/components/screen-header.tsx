import { Pressable, Text, View } from "react-native";

type ScreenHeaderProps = {
  title: string;
  onBackPress?: () => void;
};

export function ScreenHeader({ title, onBackPress }: ScreenHeaderProps) {
  return (
    <View className="relative h-[34px] flex-row items-center justify-center">
      {onBackPress ? (
        <Pressable
          onPress={onBackPress}
          className="absolute left-0 h-[34px] w-[34px] items-start justify-center active:opacity-70"
        >
          <Text className="font-poppins-medium text-[31px] leading-[33px] text-[#030B2F]">
            ‹
          </Text>
        </Pressable>
      ) : null}

      <Text className="font-poppins-bold text-[17px] leading-[22px] text-[#030B2F]">
        {title}
      </Text>
    </View>
  );
}
