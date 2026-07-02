import { useAuth } from "@clerk/expo";
import { Link, Redirect, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const router = useRouter();
  const { isLoaded, isSignedIn, signOut } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
      router.replace("/onboarding");
    } catch {
      Alert.alert("Sign out failed", "Please try again.");
    }
  }

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/onboarding" />;
  }

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

          <Pressable
            className="min-h-[52px] w-full max-w-[320px] items-center justify-center rounded-[15px] border border-[#EEF0F6] bg-white px-8"
            onPress={() => void handleSignOut()}
          >
            <Text className="font-poppins-bold text-[17px] leading-[23px] text-[#5B35F6]">
              Sign Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
