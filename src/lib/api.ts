import Constants from "expo-constants";
import { Platform } from "react-native";

export function getApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const configuredUrl =
    process.env.EXPO_PUBLIC_API_URL ??
    (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined);

  if (configuredUrl) {
    return `${configuredUrl.replace(/\/$/g, "")}${normalizedPath}`;
  }

  if (Platform.OS === "web") {
    return normalizedPath;
  }

  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    return `http://${hostUri.split("/")[0]}${normalizedPath}`;
  }

  return `http://localhost:8081${normalizedPath}`;
}
