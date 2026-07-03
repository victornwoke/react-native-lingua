import { useAuth } from "@clerk/expo";
import { type Href, Link, Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ONBOARDING_ROUTE = "/onboarding" as Href;
const LANGUAGE_SELECTION_ROUTE = "/language-selection" as Href;

export default function Index() {
  const router = useRouter();
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOut();
      router.replace(ONBOARDING_ROUTE);
    } catch {
      Alert.alert("Sign out failed", "Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href={ONBOARDING_ROUTE} />;
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
              Choose your language to start learning with your AI teacher.
            </Text>
          </View>

          <Link href={LANGUAGE_SELECTION_ROUTE} asChild>
            <Pressable className="btn-primary w-full max-w-[320px]">
              <Text className="btn-primary-text">
                Choose Language
              </Text>
            </Pressable>
          </Link>

          <Pressable
            disabled={isSigningOut}
            onPress={handleSignOut}
            className="min-h-[54px] w-full max-w-[320px] items-center justify-center rounded-[16px] border border-[#EEF0F6] bg-white px-8 active:opacity-85 disabled:opacity-60"
          >
            <Text className="font-poppins-semibold text-[16px] leading-[22px] text-[#020A2F]">
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
