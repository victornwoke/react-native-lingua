import { useClerk, useUser } from "@clerk/expo";
import { StatusBar } from "expo-status-bar";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { usePostHog } from "posthog-react-native";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";
import { useNavigationHandlers } from "@/hooks/use-navigation-handlers";
import { useProfileDashboard } from "@/hooks/use-profile-dashboard";

type ProfileMetric = {
  icon: SymbolViewProps["name"];
  iconColor: string;
  label: string;
  value: string;
};


function getDisplayName(user: ReturnType<typeof useUser>["user"]) {
  if (!user) {
    return "Learner";
  }

  return (
    user.fullName ??
    user.firstName ??
    user.username ??
    user.primaryEmailAddress?.emailAddress.split("@")[0] ??
    "Learner"
  );
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "L";
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function formatDateLabel(dateKey: string | null, todayDateKey: string) {
  if (!dateKey) {
    return "No lessons yet";
  }

  if (dateKey === todayDateKey) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${dateKey}T12:00:00`));
}

export function ProfileScreen() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const posthog = usePostHog();
  const {
    activeDays,
    completedLessonCount,
    courseProgress,
    currentLesson,
    dailyGoalProgress,
    dailyGoalXp,
    earnedXp,
    isDailyGoalComplete,
    lastCompletedDate,
    lessonCount,
    progressLabel,
    selectedLanguage,
    streakCount,
    todayDateKey,
    totalXp,
    unitLabel,
    wordsLearned,
  } = useProfileDashboard();
  const navigationHandlers = useNavigationHandlers({
    currentLesson,
    selectedLanguage,
  });
  const displayName = getDisplayName(user);
  const email = user?.primaryEmailAddress?.emailAddress ?? "Signed in";
  const initials = getInitials(displayName);
  const lastActiveLabel = formatDateLabel(lastCompletedDate, todayDateKey);
  const metrics: ProfileMetric[] = [
    {
      icon: { ios: "flame.fill", android: "local_fire_department", web: "local_fire_department" },
      iconColor: "#FF8A00",
      label: "Day streak",
      value: `${streakCount}`,
    },
    {
      icon: { ios: "bolt.fill", android: "bolt", web: "bolt" },
      iconColor: "#6545F6",
      label: "Total XP",
      value: `${totalXp}`,
    },
    {
      icon: { ios: "checkmark.seal.fill", android: "verified", web: "verified" },
      iconColor: "#21C16B",
      label: "Lessons",
      value: `${completedLessonCount}`,
    },
    {
      icon: { ios: "textformat.abc", android: "translate", web: "translate" },
      iconColor: "#4D8BFF",
      label: "Words",
      value: `${wordsLearned}`,
    },
  ];

  function handleChangeLanguage() {
    navigationHandlers.handleChangeLanguage("profile_change_language_tapped");
  }

  function handleContinueLearning() {
    navigationHandlers.handleContinueLearning("profile_continue_learning_tapped");
  }

  function handleSignOut() {
    Alert.alert("Sign out?", "You can sign back in anytime.", [
      { style: "cancel", text: "Cancel" },
      {
        onPress: async () => {
          posthog.capture("profile_sign_out_confirmed");
          await signOut();
        },
        style: "destructive",
        text: "Sign out",
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingBottom: 118,
          paddingHorizontal: 22,
          paddingTop: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-poppins-bold text-[28px] leading-[35px] text-[#0B1233]">
              Profile
            </Text>
            <Text
              numberOfLines={1}
              className="mt-[3px] max-w-[250px] font-poppins-medium text-[14px] leading-[20px] text-[#727A96]"
            >
              Keep your learning streak alive
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Change language"
            accessibilityRole="button"
            onPress={handleChangeLanguage}
            className="h-[44px] w-[44px] items-center justify-center overflow-hidden rounded-full border border-[#EEF0F6] bg-white active:opacity-80"
          >
            <Image
              source={{ uri: selectedLanguage.flag }}
              resizeMode="cover"
              className="h-[44px] w-[44px]"
            />
          </Pressable>
        </View>

        <View
          className="mt-[20px] overflow-hidden rounded-[28px] bg-[#6545F6] px-[20px] pb-[20px] pt-[22px]"
          style={{ boxShadow: "0 16px 34px rgba(101, 69, 246, 0.20)" }}
        >
          <View className="absolute right-[-42px] top-[-34px] h-[150px] w-[150px] rounded-full bg-[#7F65FF]" />
          <View className="absolute bottom-[-54px] left-[-48px] h-[138px] w-[138px] rounded-full bg-[#5437DE]" />

          <View className="relative flex-row items-center">
            <View className="h-[82px] w-[82px] items-center justify-center overflow-hidden rounded-[26px] border-[3px] border-white bg-[#F4F1FF]">
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  resizeMode="cover"
                  className="h-full w-full"
                />
              ) : (
                <Text className="font-poppins-bold text-[28px] leading-[34px] text-[#6545F6]">
                  {initials}
                </Text>
              )}
            </View>

            <View className="ml-[15px] min-w-0 flex-1">
              <Text
                numberOfLines={1}
                className="font-poppins-bold text-[23px] leading-[30px] text-white"
              >
                {displayName}
              </Text>
              <Text
                numberOfLines={1}
                className="mt-[2px] font-poppins-medium text-[13px] leading-[19px] text-[#DDD6FF]"
              >
                {email}
              </Text>

              <View
                className="mt-[10px] self-start rounded-full px-[10px] py-[5px]"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.20)" }}
              >
                <Text className="font-poppins-bold text-[12px] leading-[16px] text-white">
                  {selectedLanguage.name} learner
                </Text>
              </View>
            </View>
          </View>

          <View
            className="relative mt-[20px] flex-row rounded-[20px] px-[14px] py-[12px]"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.14)" }}
          >
            <View className="min-w-0 flex-1">
              <Text className="font-poppins-medium text-[12px] leading-[17px] text-[#DDD6FF]">
                Current focus
              </Text>
              <Text
                numberOfLines={1}
                className="mt-[3px] font-poppins-bold text-[17px] leading-[23px] text-white"
              >
                {currentLesson?.title ?? "Choose a lesson"}
              </Text>
            </View>
            <View className="ml-[12px] items-end">
              <Text className="font-poppins-medium text-[12px] leading-[17px] text-[#DDD6FF]">
                Last active
              </Text>
              <Text className="mt-[3px] font-poppins-bold text-[17px] leading-[23px] text-white">
                {lastActiveLabel}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-[16px] flex-row flex-wrap gap-[10px]">
          {metrics.map((metric) => (
            <View
              key={metric.label}
              className="min-h-[104px] flex-1 basis-[47%] rounded-[20px] border border-[#EEF0F6] bg-white px-[15px] py-[14px]"
              style={{ boxShadow: "0 8px 22px rgba(13, 19, 43, 0.05)" }}
            >
              <View
                className="h-[34px] w-[34px] items-center justify-center rounded-full"
                style={{ backgroundColor: `${metric.iconColor}18` }}
              >
                <SymbolView
                  name={metric.icon}
                  size={19}
                  tintColor={metric.iconColor}
                  type="monochrome"
                />
              </View>
              <Text className="mt-[10px] font-poppins-bold text-[24px] leading-[29px] text-[#0B1233]">
                {metric.value}
              </Text>
              <Text className="mt-[2px] font-poppins-semibold text-[12px] leading-[17px] text-[#727A96]">
                {metric.label}
              </Text>
            </View>
          ))}
        </View>

        <View
          className="mt-[16px] rounded-[24px] border border-[#EEF0F6] bg-white px-[18px] py-[17px]"
          style={{ boxShadow: "0 8px 22px rgba(13, 19, 43, 0.05)" }}
        >
          <View className="flex-row items-center justify-between">
            <View className="min-w-0 flex-1">
              <Text className="font-poppins-bold text-[18px] leading-[24px] text-[#0B1233]">
                Today&apos;s goal
              </Text>
              <Text className="mt-[3px] font-poppins-medium text-[13px] leading-[19px] text-[#727A96]">
                {earnedXp} of {dailyGoalXp} XP complete
              </Text>
            </View>

            <Image
              source={images.treasure}
              resizeMode="contain"
              className="ml-[12px] h-[58px] w-[58px]"
            />
          </View>

          <View className="mt-[14px] h-[10px] overflow-hidden rounded-full bg-[#EEEAFD]">
            <View
              className="h-full rounded-full bg-[#6545F6]"
              style={{ width: `${dailyGoalProgress * 100}%` }}
            />
          </View>

          <View className="mt-[13px] flex-row items-center">
            <View
              className={`h-[8px] w-[8px] rounded-full ${
                isDailyGoalComplete ? "bg-[#21C16B]" : "bg-[#FF8A00]"
              }`}
            />
            <Text className="ml-[8px] font-poppins-semibold text-[12px] leading-[17px] text-[#56617E]">
              {isDailyGoalComplete
                ? "Daily goal complete"
                : "A quick lesson will move this forward"}
            </Text>
          </View>
        </View>

        <View
          className="mt-[16px] overflow-hidden rounded-[24px] border border-[#EEF0F6] bg-[#F8FBFF]"
          style={{ boxShadow: "0 8px 22px rgba(13, 19, 43, 0.05)" }}
        >
          <View className="px-[18px] py-[17px]">
            <View className="flex-row items-center">
              <Image
                source={images.mascotWelcome}
                resizeMode="contain"
                className="h-[70px] w-[70px]"
              />

              <View className="ml-[14px] min-w-0 flex-1">
                <Text
                  numberOfLines={1}
                  className="font-poppins-bold text-[18px] leading-[24px] text-[#0B1233]"
                >
                  {unitLabel}
                </Text>
                <Text
                  numberOfLines={2}
                  className="mt-[4px] font-poppins-medium text-[13px] leading-[19px] text-[#727A96]"
                >
                  {progressLabel}
                </Text>
              </View>
            </View>

            <View className="mt-[14px] h-[10px] overflow-hidden rounded-full bg-[#E1E9F7]">
              <View
                className="h-full rounded-full bg-[#21C16B]"
                style={{ width: `${courseProgress * 100}%` }}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleContinueLearning}
              className="mt-[16px] min-h-[52px] flex-row items-center justify-center rounded-[17px] bg-[#6545F6] active:opacity-90"
            >
              <Text className="font-poppins-bold text-[15px] leading-[21px] text-white">
                Continue learning
              </Text>
              <SymbolView
                name={{ ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" }}
                size={18}
                tintColor="#FFFFFF"
                type="monochrome"
              />
            </Pressable>
          </View>
        </View>

        <View className="mt-[16px] gap-[10px]">
          <ProfileActionRow
            icon={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }}
            label="Active learning days"
            value={`${activeDays}`}
          />
          <ProfileActionRow
            icon={{ ios: "globe", android: "language", web: "language" }}
            label="Learning language"
            value={selectedLanguage.nativeName}
          />
          <ProfileActionRow
            icon={{ ios: "book.closed", android: "menu_book", web: "menu_book" }}
            label="Course lessons"
            value={`${lessonCount}`}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleSignOut}
          className="mt-[18px] min-h-[54px] flex-row items-center justify-center rounded-[18px] border border-[#FFE0E0] bg-[#FFF7F7] active:opacity-80"
        >
          <SymbolView
            name={{ ios: "rectangle.portrait.and.arrow.right", android: "logout", web: "logout" }}
            size={19}
            tintColor="#FF4D4F"
            type="monochrome"
          />
          <Text className="ml-[8px] font-poppins-bold text-[15px] leading-[21px] text-[#FF4D4F]">
            Sign out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type ProfileActionRowProps = {
  icon: SymbolViewProps["name"];
  label: string;
  value: string;
};

function ProfileActionRow({ icon, label, value }: ProfileActionRowProps) {
  return (
    <View
      className="min-h-[62px] flex-row items-center rounded-[18px] border border-[#EEF0F6] bg-white px-[15px]"
      style={{ boxShadow: "0 6px 18px rgba(13, 19, 43, 0.04)" }}
    >
      <View className="h-[36px] w-[36px] items-center justify-center rounded-full bg-[#F4F1FF]">
        <SymbolView
          name={icon}
          size={18}
          tintColor="#6545F6"
          type="monochrome"
        />
      </View>
      <Text className="ml-[12px] min-w-0 flex-1 font-poppins-semibold text-[14px] leading-[20px] text-[#26314E]">
        {label}
      </Text>
      <Text
        numberOfLines={1}
        className="ml-[12px] max-w-[112px] text-right font-poppins-bold text-[14px] leading-[20px] text-[#0B1233]"
      >
        {value}
      </Text>
    </View>
  );
}
