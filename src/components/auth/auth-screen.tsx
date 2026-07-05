import { useAuth, useClerk, useSignIn, useSignUp, useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import { Image as ExpoImage } from "expo-image";
import { type Href, Link, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
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
import { clerkAuthOptions } from "@/lib/clerk-auth";
import { identifyPostHogUser } from "@/lib/posthog";
import { useLanguageStore } from "@/store/language-store";

import { VerificationModal } from "./verification-modal";

type AuthMode = "sign-up" | "sign-in";

type AuthScreenProps = {
  mode: AuthMode;
};

type AuthField = "email" | "password";
type SocialOption = (typeof socialOptions)[number];

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
    strategy: "oauth_google",
  },
  {
    id: "facebook",
    label: "Continue with Facebook",
    logo: images.socialFacebook,
    strategy: "oauth_facebook",
  },
  {
    id: "apple",
    label: "Continue with Apple",
    logo: images.socialApple,
    strategy: "oauth_apple",
  },
] as const;

const HOME_ROUTE = "/" as Href;
const SSO_CALLBACK_URL = AuthSession.makeRedirectUri({
  path: "sso-callback",
});
const unsupportedSocialStrategyMessage =
  "does not match one of the allowed values for parameter strategy";
const alreadySignedInMessage = "already signed in";

function getErrorMessage(error: unknown, fallback: string) {
  if (!error) {
    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object") {
    const errorRecord = error as Record<string, unknown>;
    const message = errorRecord.longMessage ?? errorRecord.message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(errorRecord.errors)) {
      const [firstError] = errorRecord.errors;

      if (typeof firstError === "object" && firstError !== null) {
        const firstErrorRecord = firstError as Record<string, unknown>;
        const firstMessage =
          firstErrorRecord.longMessage ?? firstErrorRecord.message;

        if (typeof firstMessage === "string") {
          return firstMessage;
        }
      }
    }
  }

  return fallback;
}

function showAuthError(title: string, error: unknown, fallback: string) {
  Alert.alert(title, getErrorMessage(error, fallback));
}

function isUnsupportedSocialStrategyError(error: unknown) {
  return getErrorMessage(error, "").includes(unsupportedSocialStrategyMessage);
}

function isAlreadySignedInError(error: unknown) {
  return getErrorMessage(error, "")
    .toLowerCase()
    .includes(alreadySignedInMessage);
}

export function AuthScreen({ mode }: AuthScreenProps) {
  const router = useRouter();
  const { setActive } = useClerk();
  const { isLoaded, isSignedIn } = useAuth(clerkAuthOptions);
  const { signIn, fetchStatus: signInFetchStatus } = useSignIn();
  const { signUp, fetchStatus: signUpFetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  const posthog = usePostHog();
  const selectedLanguageId = useLanguageStore(
    (state) => state.selectedLanguageId,
  );
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
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<AuthField | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isSubmitting =
    signInFetchStatus === "fetching" ||
    signUpFetchStatus === "fetching" ||
    isSocialSubmitting;
  const isKeyboardVisible = keyboardHeight > 0;
  const isCompact = height < 780;
  const mascotFrameHeight = isKeyboardVisible ? 0 : isCompact ? 96 : 112;
  const mascotSize = isCompact ? 140 : 164;
  const contentMinHeight = isKeyboardVisible
    ? height - insets.top - insets.bottom
    : Math.max(height - insets.top - insets.bottom, 620);

  function handleBackPress() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/onboarding");
  }

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

  async function handlePrimaryAuth() {
    if (!canOpenVerification()) {
      Alert.alert(
        "Check your details",
        hasPasswordField
          ? "Enter a valid email address and password to continue."
          : "Enter a valid email address to continue.",
      );
      return;
    }

    const trimmedEmail = email.trim();

    try {
      if (mode === "sign-up") {
        posthog.capture("sign_up_submitted", { method: "email" });

        const signUpResult = await signUp.password({
          emailAddress: trimmedEmail,
          password,
        });

        if (signUpResult.error) {
          showAuthError(
            "Sign up failed",
            signUpResult.error,
            "We could not create your account.",
          );
          return;
        }

        const verificationResult = await signUp.verifications.sendEmailCode();

        if (verificationResult.error) {
          showAuthError(
            "Verification failed",
            verificationResult.error,
            "We could not send your verification code.",
          );
          return;
        }
      } else {
        posthog.capture("sign_in_submitted", { method: "email" });

        const signInResult = await signIn.emailCode.sendCode({
          emailAddress: trimmedEmail,
        });

        if (signInResult.error) {
          showAuthError(
            "Sign in failed",
            signInResult.error,
            "We could not send your sign-in code.",
          );
          return;
        }
      }

      setIsVerificationVisible(true);
    } catch (error) {
      posthog.captureException(
        error instanceof Error ? error : new Error(String(error)),
        {
          auth_mode: mode,
          step: "submit",
        },
      );
      showAuthError(
        mode === "sign-up" ? "Sign up failed" : "Sign in failed",
        error,
        "Something went wrong. Please try again.",
      );
    }
  }

  async function handleVerifyCode(code: string) {
    try {
      if (mode === "sign-up") {
        const verificationResult = await signUp.verifications.verifyEmailCode({
          code,
        });

        if (verificationResult.error) {
          showAuthError(
            "Verification failed",
            verificationResult.error,
            "That code did not work. Please try again.",
          );
          return false;
        }

        const finalizeResult = await signUp.finalize();

        if (finalizeResult.error) {
          showAuthError(
            "Sign up failed",
            finalizeResult.error,
            "We could not finish creating your account.",
          );
          return false;
        }

        const createdSessionId = signUp.createdSessionId;

        if (!createdSessionId) {
          throw new Error("Clerk did not create a session for this sign up.");
        }

        await setActive({ session: createdSessionId });

        const newUserId = signUp.createdUserId;
        if (newUserId) {
          identifyPostHogUser(newUserId, {
            isSignUp: true,
            selectedLanguageId,
          });
        }
        posthog.capture("sign_up_completed", { method: "email" });
      } else {
        const verificationResult = await signIn.emailCode.verifyCode({ code });

        if (verificationResult.error) {
          showAuthError(
            "Verification failed",
            verificationResult.error,
            "That code did not work. Please try again.",
          );
          return false;
        }

        const finalizeResult = await signIn.finalize();

        if (finalizeResult.error) {
          showAuthError(
            "Sign in failed",
            finalizeResult.error,
            "We could not finish signing you in.",
          );
          return false;
        }

        const createdSessionId = signIn.createdSessionId;

        if (!createdSessionId) {
          throw new Error("Clerk did not create a session for this sign in.");
        }

        await setActive({ session: createdSessionId });
        posthog.capture("sign_in_completed", { method: "email" });
      }

      setIsVerificationVisible(false);
      router.replace(HOME_ROUTE);
      return true;
    } catch (error) {
      posthog.captureException(
        error instanceof Error ? error : new Error(String(error)),
        {
          auth_mode: mode,
          step: "verify",
        },
      );
      showAuthError(
        "Verification failed",
        error,
        "Something went wrong while checking your code.",
      );
      return false;
    }
  }

  async function handleResendCode() {
    try {
      const result =
        mode === "sign-up"
          ? await signUp.verifications.sendEmailCode()
          : await signIn.emailCode.sendCode();

      if (result.error) {
        showAuthError(
          "Resend failed",
          result.error,
          "We could not send a new code.",
        );
        return;
      }

      Alert.alert("Code sent", "Check your email for a new code.");
    } catch (error) {
      showAuthError(
        "Resend failed",
        error,
        "Something went wrong while sending a new code.",
      );
    }
  }

  async function handleSocialSignIn(option: SocialOption) {
    if (isSignedIn) {
      router.replace(HOME_ROUTE);
      return;
    }

    setIsSocialSubmitting(true);
    posthog.capture("social_auth_tapped", {
      provider: option.id,
      auth_mode: mode,
    });

    try {
      const {
        createdSessionId,
        setActive,
        signUp: socialSignUp,
      } = await startSSOFlow({
        strategy: option.strategy,
        redirectUrl: SSO_CALLBACK_URL,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });

        if (mode === "sign-up" && socialSignUp?.createdUserId) {
          identifyPostHogUser(socialSignUp.createdUserId, {
            isSignUp: true,
            selectedLanguageId,
          });
        }

        posthog.capture(
          mode === "sign-up" ? "sign_up_completed" : "sign_in_completed",
          {
            method: option.id,
          },
        );
        router.replace(HOME_ROUTE);
      }
    } catch (error) {
      if (isAlreadySignedInError(error)) {
        posthog.capture("social_auth_already_signed_in", {
          provider: option.id,
          auth_mode: mode,
        });
        router.replace(HOME_ROUTE);
        return;
      }

      if (isUnsupportedSocialStrategyError(error)) {
        Alert.alert(
          `${option.label} is not enabled`,
          `Enable ${option.id === "apple" ? "Apple" : "Facebook"} as a social connection in your Clerk Dashboard, then try again.`,
        );
        return;
      }

      posthog.captureException(
        error instanceof Error ? error : new Error(String(error)),
        {
          provider: option.id,
          auth_mode: mode,
        },
      );
      showAuthError(
        "Social sign in failed",
        error,
        `${option.label} is not available right now.`,
      );
    } finally {
      setIsSocialSubmitting(false);
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace(HOME_ROUTE);
    }
  }, [isLoaded, isSignedIn, router]);

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

  if (!isLoaded || isSignedIn) {
    return null;
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
              onPress={handleBackPress}
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

                    void handlePrimaryAuth();
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
                      onSubmitEditing={() => void handlePrimaryAuth()}
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
                void handlePrimaryAuth();
              }}
              disabled={isSubmitting}
              className="mt-[14px] min-h-[52px] items-center justify-center rounded-[15px] border-b-[4px] border-[#4C2BCD] bg-[#6842F5] px-8"
              style={({ pressed }) => [pressed && styles.primaryButtonPressed]}
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
                  className="min-h-[48px] flex-row items-center rounded-[15px] border border-[#EEF0F6] bg-white px-[28px]"
                  key={option.id}
                  disabled={isSubmitting}
                  onPress={() => void handleSocialSignIn(option)}
                  style={({ pressed }) => [
                    pressed && styles.socialButtonPressed,
                  ]}
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
        <VerificationModal
          onClose={() => setIsVerificationVisible(false)}
          onResendCode={handleResendCode}
          onVerifyCode={handleVerifyCode}
        />
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
  primaryButtonPressed: {
    opacity: 0.9,
  },
  socialButtonPressed: {
    opacity: 0.85,
  },
});
