import { type Href, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type VerificationModalProps = {
  onClose: () => void;
};

const CODE_LENGTH = 6;
const HOME_ROUTE = "/" as Href;

export function VerificationModal({ onClose }: VerificationModalProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: CODE_LENGTH }, () => ""),
  );
  const [focusedIndex, setFocusedIndex] = useState(0);
  const activeIndex = Math.min(focusedIndex, CODE_LENGTH - 1);
  const digitBoxSize = width < 370 ? 42 : 46;

  const focusCodeInput = useCallback((index: number) => {
    const nextIndex = Math.max(0, Math.min(index, CODE_LENGTH - 1));
    setFocusedIndex(nextIndex);

    requestAnimationFrame(() => {
      inputRefs.current[nextIndex]?.focus();
    });
  }, []);

  useEffect(() => {
    const firstFocusTimer = setTimeout(() => {
      focusCodeInput(0);
    }, 350);
    const secondFocusTimer = setTimeout(() => {
      focusCodeInput(0);
    }, 700);

    return () => {
      clearTimeout(firstFocusTimer);
      clearTimeout(secondFocusTimer);
    };
  }, [focusCodeInput]);

  function finishIfComplete(nextDigits: string[]) {
    const nextCode = nextDigits.join("");

    if (nextCode.length === CODE_LENGTH) {
      onClose();
      router.replace(HOME_ROUTE);
    }
  }

  function handleDigitChange(value: string, index: number) {
    const numericValue = value.replace(/\D/g, "");

    if (numericValue.length > 1) {
      const nextDigits = [...digits];
      numericValue
        .slice(0, CODE_LENGTH - index)
        .split("")
        .forEach((digit, digitIndex) => {
          nextDigits[index + digitIndex] = digit;
        });

      setDigits(nextDigits);
      focusCodeInput(Math.min(index + numericValue.length, CODE_LENGTH - 1));
      finishIfComplete(nextDigits);
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = numericValue;
    setDigits(nextDigits);

    if (numericValue && index < CODE_LENGTH - 1) {
      focusCodeInput(index + 1);
    } else {
      setFocusedIndex(index);
    }

    finishIfComplete(nextDigits);
  }

  function handleDigitBackspace(index: number) {
    if (digits[index] || index === 0) {
      return;
    }

    focusCodeInput(index - 1);
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible
    >
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.backdrop}>
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + 22 }]}>
            <Pressable
              accessibilityLabel="Close verification modal"
              hitSlop={12}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text className="font-poppins-medium text-[28px] leading-[28px] text-[#9BA0B5]">
                ×
              </Text>
            </Pressable>

            <Text className="text-center font-poppins-bold text-[21px] leading-[28px] text-[#020A2F]">
              Check your email
            </Text>
            <Text className="mt-[5px] text-center font-poppins-medium text-[13px] leading-[20px] text-[#858BA8]">
              You have received an email.{"\n"}Enter the verification code.
            </Text>

            <View className="relative mt-[28px] flex-row justify-between">
              {Array.from({ length: CODE_LENGTH }).map((_, index) => {
                const digit = digits[index];
                const isActive = index === activeIndex;

                return (
                  <TextInput
                    accessibilityLabel={`Verification code digit ${index + 1}`}
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    caretHidden
                    inputMode="numeric"
                    key={`code-digit-${index}`}
                    keyboardType="number-pad"
                    onChangeText={(value) => handleDigitChange(value, index)}
                    onFocus={() => setFocusedIndex(index)}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === "Backspace") {
                        handleDigitBackspace(index);
                      }
                    }}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    returnKeyType="done"
                    selectionColor="transparent"
                    selectTextOnFocus
                    showSoftInputOnFocus
                    style={[
                      styles.codeInput,
                      isActive ? styles.codeInputActive : null,
                      { height: digitBoxSize, width: digitBoxSize },
                    ]}
                    textContentType={index === 0 ? "oneTimeCode" : "none"}
                    value={digit}
                  />
                );
              })}
            </View>

            <View className="mt-[27px] flex-row items-center justify-center">
              <Text className="font-poppins-medium text-[13px] leading-[19px] text-[#A1A7BC]">
                {"Didn't receive it? "}
              </Text>
              <Pressable
                hitSlop={8}
                onPress={() => focusCodeInput(activeIndex)}
              >
                <Text className="font-poppins-bold text-[13px] leading-[19px] text-[#6A45F6]">
                  Resend
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(2, 10, 47, 0.42)",
    flex: 1,
    justifyContent: "flex-end",
  },
  closeButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: 13,
    top: 12,
    width: 36,
  },
  codeInput: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EEF0F6",
    borderRadius: 11,
    borderWidth: 1.5,
    color: "#020A2F",
    fontFamily: "Poppins-Bold",
    fontSize: 22,
    lineHeight: 29,
    padding: 0,
    textAlign: "center",
  },
  codeInputActive: {
    borderColor: "#A98BFF",
  },
  keyboardView: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 26,
    paddingTop: 26,
    width: "100%",
  },
});
