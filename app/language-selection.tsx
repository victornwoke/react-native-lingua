import { useAuth } from "@clerk/expo";
import { type Href, Redirect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePostHog } from "posthog-react-native";

import { LanguageCard } from "@/components/language/language-card";
import { ScreenHeader } from "@/components/screen-header";
import { SearchBar } from "@/components/search-bar";
import { images } from "@/constants/images";
import { clerkAuthOptions } from "@/lib/clerk-auth";
import { identifyPostHogUser } from "@/lib/posthog";
import { useLanguageStore } from "@/store/language-store";

import { languages } from "../data/languages";

const HOME_ROUTE = "/home" as Href;
const ONBOARDING_ROUTE = "/onboarding" as Href;

const learnerCounts: Record<string, string> = {
  spanish: "28.4M learners",
  french: "19.4M learners",
  japanese: "12.7M learners",
  korean: "9.3M learners",
  german: "8.1M learners",
  chinese: "7.4M learners",
};

export default function LanguageSelectionScreen() {
  const { isLoaded, isSignedIn, userId } = useAuth(clerkAuthOptions);
  const storedLanguageId = useLanguageStore(
    (state) => state.selectedLanguageId,
  );
  const setStoredLanguageId = useLanguageStore(
    (state) => state.setSelectedLanguageId,
  );
  const hasHydrated = useLanguageStore((state) => state.hasHydrated);

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href={ONBOARDING_ROUTE} />;
  }

  if (!hasHydrated) {
    return null;
  }

  return (
    <LanguageSelectionContent
      storedLanguageId={storedLanguageId}
      setStoredLanguageId={setStoredLanguageId}
      userId={userId}
    />
  );
}

type LanguageSelectionContentProps = {
  storedLanguageId: string | null;
  setStoredLanguageId: (languageId: string) => void;
  userId: string | null | undefined;
};

function LanguageSelectionContent({
  storedLanguageId,
  setStoredLanguageId,
  userId,
}: LanguageSelectionContentProps) {
  const router = useRouter();
  const posthog = usePostHog();
  const initialLanguageId =
    storedLanguageId &&
    languages.some((language) => language.id === storedLanguageId)
      ? storedLanguageId
      : (languages[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguageId, setSelectedLanguageId] =
    useState(initialLanguageId);

  function handleBackPress() {
    if (router.canGoBack()) {
      router.back();
    }
  }

  const filteredLanguages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return languages;
    }

    return languages.filter((language) => {
      const searchableText =
        `${language.name} ${language.nativeName} ${language.code}`.toLowerCase();

      return searchableText.includes(query);
    });
  }, [searchQuery]);

  function handleContinue() {
    if (!selectedLanguageId) {
      return;
    }

    const selectedLanguage = languages.find((l) => l.id === selectedLanguageId);
    posthog.capture("language_selected", {
      language_code: selectedLanguage?.code ?? selectedLanguageId,
      language_name: selectedLanguage?.name ?? selectedLanguageId,
    });
    setStoredLanguageId(selectedLanguageId);

    if (userId) {
      identifyPostHogUser(userId, { selectedLanguageId });
    }

    router.replace(HOME_ROUTE);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />

      <View style={styles.screenContent}>
        <ScreenHeader title="Choose a language" onBackPress={handleBackPress} />

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search languages"
          containerClassName="mt-[14px]"
        />

        <Text className="mt-[18px] font-poppins-bold text-[17px] leading-[22px] text-[#030B2F]">
          Popular
        </Text>

        <ScrollView
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.languageList}
          contentContainerStyle={styles.languageListContent}
        >
          {filteredLanguages.map((language) => (
            <LanguageCard
              key={language.id}
              language={language}
              learnerCount={
                learnerCounts[language.id] ??
                `${language.dailyGoalMinutes} min daily goal`
              }
              isSelected={selectedLanguageId === language.id}
              onPress={() => setSelectedLanguageId(language.id)}
            />
          ))}
        </ScrollView>

        <Pressable
          onPress={handleContinue}
          disabled={!selectedLanguageId}
          className="mt-[12px] min-h-[48px] flex-row items-center justify-center rounded-[18px] border-b-[5px] border-[#4427C8] bg-[#5F39F7] px-8 active:opacity-90 disabled:opacity-50"
        >
          <Text className="font-poppins-bold text-[15px] leading-[21px] text-white">
            Continue
          </Text>
        </Pressable>

        <View style={styles.earthContainer}>
          <Image
            source={images.earthLanguageSelection}
            resizeMode="contain"
            style={styles.earthImage}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingBottom: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  languageList: {
    flex: 1,
    marginTop: 10,
  },
  languageListContent: {
    gap: 8,
    paddingBottom: 2,
  },
  earthContainer: {
    alignItems: "center",
    height: 184,
    justifyContent: "flex-end",
    marginTop: 6,
    overflow: "hidden",
  },
  earthImage: {
    height: 208,
    marginBottom: -18,
    width: 320,
  },
});
