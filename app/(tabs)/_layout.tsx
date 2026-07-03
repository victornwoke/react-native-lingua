import { useAuth } from "@clerk/expo";
import { type Href, Redirect } from "expo-router";
import { Tabs } from "expo-router/js-tabs";

import { BottomTabBar } from "@/components/navigation/bottom-tab-bar";
import { useLanguageStore, useSelectedLanguage } from "@/store/language-store";

const ONBOARDING_ROUTE = "/onboarding" as Href;
const LANGUAGE_SELECTION_ROUTE = "/language-selection" as Href;

export default function TabLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const hasHydrated = useLanguageStore((state) => state.hasHydrated);
  const selectedLanguage = useSelectedLanguage();

  if (!isLoaded || !hasHydrated) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href={ONBOARDING_ROUTE} />;
  }

  if (!selectedLanguage) {
    return <Redirect href={LANGUAGE_SELECTION_ROUTE} />;
  }

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "#FFFFFF" },
        tabBarHideOnKeyboard: true,
      }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="learn" options={{ title: "Learn" }} />
      <Tabs.Screen name="ai-teacher" options={{ title: "AI Teacher" }} />
      <Tabs.Screen name="chat" options={{ title: "Chat" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
