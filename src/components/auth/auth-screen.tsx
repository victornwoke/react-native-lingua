import { Link, useRouter } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import type { RefObject } from "react";
import { useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { images } from "@/constants/images";

import { VerificationModal } from "./verification-modal";

type AuthMode = "sign-up" | "sign-in";

type AuthScreenProps = {
  mode: AuthMode;
};

const authCopy = {
  "sign-up": {
    title: "Create your account",
    subtitle: "Start your language journey today ✨",
    button: "Sign Up",
    switchPrefix: "Already have an account?",
    switchAction: "Log in",
    switchHref: "/sign-in",
  },
  "sign-in": {
    title: "Welcome back",
    subtitle: "Continue your language journey today ✨",
    button: "Sign In",
    switchPrefix: "New to lingua?",
    switchAction: "Create account",
    switchHref: "/sign-up",
  },
} as const;

const socialOptions = [
  {
    id: "google",
    label: "Continue with Google",
    logo: images.socialGoogle,
  },
  {
    id: "facebook",
    label: "Continue with Facebook",
    logo: images.socialFacebook,
  },
  {
    id: "apple",
    label: "Continue with Apple",
    logo: images.socialApple,
  },
] as const;

export function AuthScreen({ mode }: AuthScreenProps) {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const copy = authCopy[mode];
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [password, setPassword] = useState("");
  const hasPasswordField = mode === "sign-up";
  const isCompact = height < 780;
  const mascotFrameHeight = isCompact ? 96 : 112;
  const mascotSize = isCompact ? 140 : 164;
  const contentMinHeight = Math.max(height - insets.top - insets.bottom, 620);

  function focusInput(inputRef: RefObject<TextInput | null>) {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          bounces
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.content,
              {
                minHeight: contentMinHeight,
                paddingTop: isCompact ? 8 : 14,
              },
            ]}
          >
            <Pressable
              accessibilityLabel="Go back"
              hitSlop={12}
              onPress={() => router.back()}
              className="h-[34px] w-[34px] items-start justify-center"
            >
              <Text className="font-poppins-medium text-[32px] leading-[32px] text-[#020A2F]">
                ‹
              </Text>
            </Pressable>

            <View className={isCompact ? "mt-[10px]" : "mt-[18px]"}>
              <Text className="font-poppins-bold text-[24px] leading-[31px] text-[#020A2F]">
                {copy.title}
              </Text>
              <Text className="mt-[6px] font-poppins-medium text-[14px] leading-[20px] text-[#7D84A3]">
                {copy.subtitle}
              </Text>
            </View>

            <View
              className={isCompact ? "relative mt-[6px] items-center" : "relative mt-[10px] items-center"}
              style={{ height: mascotFrameHeight }}
            >
              <Text className="absolute left-[92px] top-[22px] z-10 font-poppins-bold text-[18px] leading-[23px] text-[#FF9500]">
                ✦
              </Text>
              <Text className="absolute right-[88px] top-[34px] z-10 font-poppins-bold text-[17px] leading-[22px] text-[#73A8FF]">
                ✦
              </Text>
              <Text className="absolute right-[104px] top-[66px] z-10 font-poppins-bold text-[16px] leading-[21px] text-[#FFD34D]">
                ✦
              </Text>
              <Image
                source={images.mascotAuth}
                resizeMode="contain"
                style={{
                  height: mascotSize,
                  marginTop: isCompact ? -22 : -28,
                  width: mascotSize,
                }}
              />
            </View>

            <View className="gap-[10px]">
              <View
                onTouchStart={() => focusInput(emailInputRef)}
                style={styles.inputShell}
              >
                <Text className="font-poppins-semibold text-[13px] leading-[18px] text-[#858BA8]">
                  Email
                </Text>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  inputMode="email"
                  keyboardType="email-address"
                  placeholder="alex@gmail.com"
                  placeholderTextColor="#020A2F"
                  ref={emailInputRef}
                  returnKeyType={hasPasswordField ? "next" : "done"}
                  onPressIn={() => focusInput(emailInputRef)}
                  onSubmitEditing={() => focusInput(passwordInputRef)}
                  showSoftInputOnFocus
                  style={styles.textInput}
                  textContentType="emailAddress"
                />
              </View>

              {hasPasswordField ? (
                <View
                  onTouchStart={() => focusInput(passwordInputRef)}
                  style={styles.inputShell}
                >
                  <Text className="font-poppins-semibold text-[13px] leading-[18px] text-[#858BA8]">
                    Password
                  </Text>
                  <View className="flex-row items-center gap-3">
                    <TextInput
                      placeholder="•••••••••"
                      placeholderTextColor="#020A2F"
                      onChangeText={setPassword}
                      onPressIn={() => focusInput(passwordInputRef)}
                      ref={passwordInputRef}
                      returnKeyType="done"
                      secureTextEntry={!isPasswordVisible}
                      showSoftInputOnFocus
                      style={[styles.textInput, styles.passwordInput]}
                      textContentType="newPassword"
                      value={password}
                    />
                    <Pressable
                      accessibilityLabel={
                        isPasswordVisible ? "Hide password" : "Show password"
                      }
                      hitSlop={10}
                      onPress={() => setIsPasswordVisible((current) => !current)}
                      style={styles.eyeButton}
                    >
                      <ExpoImage
                        contentFit="contain"
                        source={isPasswordVisible ? "sf:eye.slash" : "sf:eye"}
                        style={styles.eyeIcon}
                        tintColor="#858BA8"
                      />
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>

            <Pressable
              onPress={() => setIsVerificationVisible(true)}
              className={`mt-[14px] min-h-[52px] items-center justify-center rounded-[15px] border-b-[4px] border-[#4C2BCD] bg-[#6842F5] px-8 active:opacity-90 ${
                hasPasswordField ? "" : "mt-[14px]"
              }`}
            >
              <Text className="font-poppins-bold text-[17px] leading-[23px] text-white">
                {copy.button}
              </Text>
            </Pressable>

            <View className={isCompact ? "my-[12px] flex-row items-center gap-4" : "my-[16px] flex-row items-center gap-4"}>
              <View className="h-[2px] flex-1 bg-[#EEF0F6]" />
              <Text className="font-poppins-medium text-[14px] leading-[20px] text-[#7D84A3]">
                or continue with
              </Text>
              <View className="h-[2px] flex-1 bg-[#EEF0F6]" />
            </View>

            <View className="gap-[8px]">
              {socialOptions.map((option) => (
                <Pressable
                  className="min-h-[48px] flex-row items-center rounded-[15px] border border-[#EEF0F6] bg-white px-[28px] active:opacity-85"
                  key={option.id}
                  onPress={() => setIsVerificationVisible(true)}
                >
                  <View className="w-[54px] items-start">
                    <Image
                      source={option.logo}
                      resizeMode="contain"
                      className="h-[28px] w-[28px]"
                    />
                  </View>
                  <Text className="font-poppins-medium text-[15px] leading-[21px] text-[#020A2F]">
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="mt-auto flex-row items-center justify-center pb-1 pt-[22px]">
              <Text className="font-poppins-medium text-[14px] leading-[20px] text-[#7D84A3]">
                {copy.switchPrefix}{" "}
              </Text>
              <Link href={copy.switchHref} asChild>
                <Pressable hitSlop={8}>
                  <Text className="font-poppins-bold text-[14px] leading-[20px] text-[#5B35F6]">
                    {copy.switchAction}
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {isVerificationVisible ? (
        <VerificationModal onClose={() => setIsVerificationVisible(false)} />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: 18,
    paddingHorizontal: 32,
  },
  eyeButton: {
    alignItems: "center",
    height: 34,
    justifyContent: "center",
    width: 36,
  },
  eyeIcon: {
    height: 22,
    width: 28,
  },
  inputShell: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EEF0F6",
    borderRadius: 16,
    borderWidth: 1.5,
    minHeight: 62,
    paddingHorizontal: 24,
    paddingVertical: 9,
  },
  keyboardView: {
    flex: 1,
  },
  passwordInput: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  textInput: {
    color: "#020A2F",
    fontFamily: "Poppins-Medium",
    fontSize: 15,
    lineHeight: 20,
    marginTop: 5,
    minHeight: 20,
    padding: 0,
  },
});
