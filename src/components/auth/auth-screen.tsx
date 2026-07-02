import { Image as ExpoImage } from "expo-image";
import { type Href, Link, useRouter } from "expo-router";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { images } from "@/constants/images";

import { VerificationModal } from "./verification-modal";

type AuthMode = "sign-up" | "sign-in";

type AuthScreenProps = {
  mode: AuthMode;
};

type AuthField = "email" | "password";

const authCopy = {
  "sign-up": {
    title: "Create your account",
    subtitle: "Start your language journey today ✨",
    button: "Sign Up",
    switchPrefix: "Already have an account?",
    switchAction: "Log in",
    switchHref: "/sign-in" as Href,
  },
  "sign-in": {
    title: "Welcome back",
    subtitle: "Continue your language journey today ✨",
    button: "Sign In",
    switchPrefix: "New to lingua?",
    switchAction: "Create account",
    switchHref: "/sign-up" as Href,
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
  const scrollViewRef = useRef<ScrollView>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const inputPositionsRef = useRef<Record<AuthField, number>>({
    email: 0,
    password: 0,
  });
  const copy = authCopy[mode];
  const hasPasswordField = mode === "sign-up";
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<AuthField | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isKeyboardVisible = keyboardHeight > 0;
  const isCompact = height < 780;
  const mascotFrameHeight = isKeyboardVisible ? 0 : isCompact ? 96 : 112;
  const mascotSize = isCompact ? 140 : 164;
  const contentMinHeight = isKeyboardVisible
    ? height - insets.top - insets.bottom
    : Math.max(height - insets.top - insets.bottom, 620);

  function isEmailValid(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function canOpenVerification() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !isEmailValid(trimmedEmail)) {
      return false;
    }

    if (hasPasswordField && password.trim().length === 0) {
      return false;
    }

    return true;
  }

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      "keyboardWillShow",
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
      },
    );
    const didShowSubscription = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
      },
    );
    const hideSubscription = Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardHeight(0);
    });
    const didHideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      didShowSubscription.remove();
      hideSubscription.remove();
      didHideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!focusedField || !isKeyboardVisible) {
      return;
    }

    const scrollTimer = setTimeout(() => {
      scrollToField(focusedField);
    }, 120);

    return () => clearTimeout(scrollTimer);
  }, [focusedField, isKeyboardVisible]);

  function handleInputLayout(field: AuthField, event: LayoutChangeEvent) {
    inputPositionsRef.current[field] = event.nativeEvent.layout.y;
  }

  function scrollToField(field: AuthField) {
    const scrollY = Math.max(inputPositionsRef.current[field] - 20, 0);

    scrollViewRef.current?.scrollTo({ animated: true, y: scrollY });
  }

  function focusInput(inputRef: RefObject<TextInput | null>, field: AuthField) {
    setFocusedField(field);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    setTimeout(() => {
      scrollToField(field);
    }, 120);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          bounces
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: isKeyboardVisible ? keyboardHeight + 28 : 0 },
          ]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ref={scrollViewRef}
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

            {isKeyboardVisible ? null : (
              <View
                className={
                  isCompact
                    ? "relative mt-[6px] items-center"
                    : "relative mt-[10px] items-center"
                }
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
            )}

            <View className="gap-[10px]">
              <View
                onLayout={(event) => handleInputLayout("email", event)}
                onTouchStart={() => focusInput(emailInputRef, "email")}
                style={styles.inputShell}
              >
                <Text className="font-poppins-semibold text-[13px] leading-[18px] text-[#858BA8]">
                  Email
                </Text>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  blurOnSubmit={false}
                  inputMode="email"
                  keyboardType="email-address"
                  onFocus={() => {
                    setFocusedField("email");
                    scrollToField("email");
                  }}
                  onPressIn={() => focusInput(emailInputRef, "email")}
                  onSubmitEditing={() => {
                    if (hasPasswordField) {
                      focusInput(passwordInputRef, "password");
                      return;
                    }

                    setIsVerificationVisible(true);
                  }}
                  placeholder="alex@gmail.com"
                  placeholderTextColor="#020A2F"
                  ref={emailInputRef}
                  returnKeyType={hasPasswordField ? "next" : "done"}
                  showSoftInputOnFocus
                  style={styles.textInput}
                  textContentType="emailAddress"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {hasPasswordField ? (
                <View
                  onLayout={(event) => handleInputLayout("password", event)}
                  onTouchStart={() => focusInput(passwordInputRef, "password")}
                  style={styles.inputShell}
                >
                  <Text className="font-poppins-semibold text-[13px] leading-[18px] text-[#858BA8]">
                    Password
                  </Text>
                  <View className="flex-row items-center gap-3">
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      onChangeText={setPassword}
                      onFocus={() => {
                        setFocusedField("password");
                        scrollToField("password");
                      }}
                      onPressIn={() => focusInput(passwordInputRef, "password")}
                      onSubmitEditing={() => setIsVerificationVisible(true)}
                      placeholder="•••••••••"
                      placeholderTextColor="#020A2F"
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
                      onPress={() => {
                        setIsPasswordVisible((current) => !current);
                        focusInput(passwordInputRef, "password");
                      }}
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
              onPress={() => {
                if (!canOpenVerification()) {
                  return;
                }

                setIsVerificationVisible(true);
              }}
              className="mt-[14px] min-h-[52px] items-center justify-center rounded-[15px] border-b-[4px] border-[#4C2BCD] bg-[#6842F5] px-8 active:opacity-90"
            >
              <Text className="font-poppins-bold text-[17px] leading-[23px] text-white">
                {copy.button}
              </Text>
            </Pressable>

            <View
              className={
                isCompact
                  ? "my-[12px] flex-row items-center gap-4"
                  : "my-[16px] flex-row items-center gap-4"
              }
            >
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
                  onPress={() => {
                    if (!canOpenVerification()) {
                      return;
                    }

                    setIsVerificationVisible(true);
                  }}
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
