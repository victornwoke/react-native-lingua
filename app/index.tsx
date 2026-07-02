import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
      >
        <View className="items-center gap-6">
          <View className="items-center gap-3">
            <Text className="font-poppins-bold text-[34px] leading-[42px] text-text-primary">
              Viclingo
            </Text>
            <Text className="max-w-[280px] text-center font-poppins text-[16px] leading-[25px] text-text-secondary">
              Open the onboarding screen for the AI language teacher flow.
            </Text>
          </View>

          <Link href="./onboarding" asChild>
            <Pressable className="btn-primary w-full max-w-[320px]">
              <Text className="btn-primary-text">View Onboarding</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
