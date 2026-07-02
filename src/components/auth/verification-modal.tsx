import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type VerificationModalProps = {
  onClose: () => void;
};

const CODE_LENGTH = 6;

export function VerificationModal({ onClose }: VerificationModalProps) {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 250);

    return () => clearTimeout(focusTimer);
  }, []);

  function handleCodeChange(value: string) {
    const nextCode = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(nextCode);

    if (nextCode.length === CODE_LENGTH) {
      onClose();
      router.replace("/");
    }
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible
    >
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <Pressable onPress={onClose} style={styles.backdrop}>
          <Pressable
            onPress={() => inputRef.current?.focus()}
            style={styles.modalCard}
          >
            <Text className="text-center font-poppins-bold text-[26px] leading-[33px] text-[#020A2F]">
              Check your email
            </Text>
            <Text className="mt-3 text-center font-poppins-medium text-[15px] leading-[24px] text-[#747B9B]">
              We sent you a verification code. Enter it below to continue.
            </Text>

            <View className="mt-7 flex-row justify-between gap-2">
              {Array.from({ length: CODE_LENGTH }).map((_, index) => {
                const digit = code[index];

                return (
                  <View
                    className={`h-[54px] flex-1 items-center justify-center rounded-[16px] border bg-white ${
                      digit ? "border-[#6A45F6]" : "border-[#E9ECF3]"
                    }`}
                    key={`code-digit-${index}`}
                  >
                    <Text className="font-poppins-bold text-[22px] leading-[29px] text-[#020A2F]">
                      {digit ?? ""}
                    </Text>
                  </View>
                );
              })}
            </View>

            <TextInput
              autoComplete="one-time-code"
              inputMode="numeric"
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              onChangeText={handleCodeChange}
              ref={inputRef}
              returnKeyType="done"
              style={styles.hiddenInput}
              textContentType="oneTimeCode"
              value={code}
            />
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(2, 10, 47, 0.42)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  hiddenInput: {
    height: 1,
    opacity: 0,
    position: "absolute",
    width: 1,
  },
  keyboardView: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    maxWidth: 420,
    paddingHorizontal: 22,
    paddingVertical: 28,
    width: "100%",
  },
});
