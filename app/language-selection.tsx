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
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LanguageCard } from "@/components/language/language-card";
import { images } from "@/constants/images";

import { languages } from "../data/languages";

const HOME_ROUTE = "/" as Href;
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
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguageId, setSelectedLanguageId] = useState(
    languages[0]?.id ?? "",
  );

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

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href={ONBOARDING_ROUTE} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />

      <View style={styles.screenContent}>
        <View className="relative h-[34px] flex-row items-center justify-center">
            <Pressable
              onPress={() => router.back()}
              className="absolute left-0 h-[34px] w-[34px] items-start justify-center active:opacity-70"
            >
              <Text className="font-poppins-medium text-[31px] leading-[33px] text-[#030B2F]">
                ‹
              </Text>
            </Pressable>

            <Text className="font-poppins-bold text-[17px] leading-[22px] text-[#030B2F]">
              Choose a language
            </Text>
        </View>

        <View className="mt-[14px] min-h-[44px] flex-row items-center rounded-full border border-[#E6E8F0] bg-[#FAFBFF] px-[18px]">
          <View className="mr-[12px] h-[20px] w-[20px]">
            <View className="h-[15px] w-[15px] rounded-full border-[2px] border-[#64708D]" />
            <View className="absolute bottom-[3px] right-[2px] h-[9px] w-[3px] rotate-[-45deg] rounded-full bg-[#64708D]" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search languages"
            placeholderTextColor="#68708C"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            style={styles.searchInput}
          />
        </View>

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
          onPress={() => router.replace(HOME_ROUTE)}
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
  searchInput: {
    color: "#030B2F",
    flex: 1,
    fontFamily: "Poppins-Medium",
    fontSize: 13,
    lineHeight: 18,
    paddingVertical: 0,
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
