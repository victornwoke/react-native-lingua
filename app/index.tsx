import { useAuth } from "@clerk/expo";
import { type Href, Link, Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLanguageStore } from "@/store/language-store";

import { languages } from "../data/languages";

const ONBOARDING_ROUTE = "/onboarding" as Href;
const LANGUAGE_SELECTION_ROUTE = "/language-selection" as Href;

export default function Index() {
  const router = useRouter();
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const {
    selectedLanguageId,
    hasHydrated,
    clearLanguageSelectionForTesting,
  } = useLanguageStore();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isClearingStorage, setIsClearingStorage] = useState(false);
  const selectedLanguage = languages.find(
    (language) => language.id === selectedLanguageId,
  );

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

  async function handleClearAsyncStorage() {
    setIsClearingStorage(true);

    try {
      await clearLanguageSelectionForTesting();
      router.replace(LANGUAGE_SELECTION_ROUTE);
    } catch {
      Alert.alert("Clear storage failed", "Please try again.");
    } finally {
      setIsClearingStorage(false);
    }
  }

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href={ONBOARDING_ROUTE} />;
  }

  if (!hasHydrated) {
    return null;
  }

  if (!selectedLanguage) {
    return <Redirect href={LANGUAGE_SELECTION_ROUTE} />;
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

            <View className="mt-1 flex-row items-center rounded-full border border-[#EEF0F6] bg-[#F6F7FB] py-2 pl-2 pr-4">
              <Image
                source={{ uri: selectedLanguage.flag }}
                resizeMode="cover"
                className="h-8 w-8 rounded-full"
              />
              <View className="ml-3">
                <Text className="font-poppins-semibold text-[13px] leading-[18px] text-[#6B7280]">
                  Learning
                </Text>
                <Text className="font-poppins-bold text-[16px] leading-[22px] text-[#020A2F]">
                  {selectedLanguage.name} - {selectedLanguage.nativeName}
                </Text>
              </View>
            </View>
          </View>

          <Link href={LANGUAGE_SELECTION_ROUTE} asChild>
            <Pressable className="btn-primary w-full max-w-[320px]">
              <Text className="btn-primary-text">
                Choose Language
              </Text>
            </Pressable>
          </Link>

          <Pressable
            disabled={isClearingStorage}
            onPress={handleClearAsyncStorage}
            className="min-h-[54px] w-full max-w-[320px] items-center justify-center rounded-[16px] border border-[#EEF0F6] bg-white px-8 active:opacity-85 disabled:opacity-60"
          >
            <Text className="font-poppins-semibold text-[16px] leading-[22px] text-[#020A2F]">
              {isClearingStorage ? "Clearing..." : "Clear Async Storage"}
            </Text>
          </Pressable>

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
