import { type Href, useRouter } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";

const SIGN_UP_ROUTE = "/sign-up" as Href;

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View className="flex-1 bg-white px-[28px] pt-[18px] pb-[128px]">
        <View className="items-center">
          <View className="flex-row items-center gap-3">
            <Image
              source={images.mascotLogo}
              resizeMode="contain"
              className="h-[54px] w-[54px]"
            />
            <Text className="font-poppins-bold text-[38px] leading-[46px] text-[#030B2F]">
              lingua
            </Text>
          </View>
        </View>

        <View className="pt-[34px]">
          <Text className="font-poppins-bold text-[36px] leading-[45px] text-[#030B2F]">
            Your AI language
          </Text>
          <Text className="font-poppins-bold text-[36px] leading-[45px] text-[#5937FF]">
            teacher.
          </Text>
          <Text className="mt-[14px] max-w-[360px] font-poppins-medium text-[18px] leading-[27px] text-[#68708C]">
            Real conversations, personalized lessons, anytime, anywhere.
          </Text>
        </View>

        <View className="relative mt-[8px] h-[292px] items-center justify-end">
          <View className="absolute left-0 top-[18px] z-20 rounded-[18px] bg-[#EEF7FF] px-[22px] py-3">
            <Text className="font-poppins-medium text-[23px] leading-[28px] text-[#07102E]">
              Hello!
            </Text>
            <View className="absolute bottom-[-8px] right-[28px] h-5 w-5 rotate-45 bg-[#EEF7FF]" />
          </View>

          <View className="absolute right-4 top-0 z-20 rounded-[18px] bg-[#F5F2FF] px-[22px] py-3">
            <Text className="font-poppins-medium text-[23px] italic leading-[28px] text-[#4E35FF]">
              ¡Hola!
            </Text>
            <View className="absolute bottom-[-8px] left-[28px] h-5 w-5 rotate-45 bg-[#F5F2FF]" />
          </View>

          <View className="absolute right-0 top-[106px] z-20 rounded-[18px] bg-[#FFF4EF] px-[22px] py-3">
            <Text className="font-poppins-medium text-[23px] leading-[28px] text-[#FF4B32]">
              你好!
            </Text>
            <View className="absolute bottom-[-8px] left-[32px] h-5 w-5 rotate-45 bg-[#FFF4EF]" />
          </View>

          <Image
            source={images.mascotWelcome}
            resizeMode="contain"
            className="z-10 h-[289px] w-[289px]"
          />
        </View>

        <View className="absolute bottom-4 left-[28px] right-[28px]">
          <Pressable
            onPress={() => router.push(SIGN_UP_ROUTE)}
            className="min-h-[72px] flex-row items-center justify-center rounded-[22px] border-b-[5px] border-[#4427C8] bg-[#5F39F7] px-8 active:opacity-90"
          >
            <Text className="font-poppins-bold text-[22px] leading-[30px] text-white">
              Get Started
            </Text>
            <Text className="absolute right-8 font-poppins-medium text-[48px] leading-[52px] text-white">
              ›
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
