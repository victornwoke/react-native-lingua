import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

if (Platform.OS === "web") {
  WebBrowser.maybeCompleteAuthSession();
}

export default function SSOCallbackScreen() {
  return null;
}
