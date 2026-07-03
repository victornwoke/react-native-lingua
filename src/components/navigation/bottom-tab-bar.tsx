import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { usePathname } from "expo-router";
import { type ComponentProps, useEffect, useMemo, useState } from "react";
import {
  AccessibilityRole,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Tabs } from "expo-router/js-tabs";

import { colors } from "@/theme";

type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

type TabConfig = {
  label: string;
  icon: SymbolViewProps["name"];
  activeIcon: SymbolViewProps["name"];
};

const ACTIVE_CIRCLE_SIZE = 54;
const TAB_BAR_HEIGHT = 84;
const TAB_BAR_HORIZONTAL_PADDING = 6;
const TAB_BAR_BOTTOM_GAP = 2;

const tabConfig: Record<string, TabConfig> = {
  home: {
    label: "Home",
    icon: { ios: "house", android: "home", web: "home" },
    activeIcon: { ios: "house.fill", android: "home", web: "home" },
  },
  learn: {
    label: "Learn",
    icon: { ios: "book", android: "menu_book", web: "menu_book" },
    activeIcon: { ios: "book.fill", android: "menu_book", web: "menu_book" },
  },
  "ai-teacher": {
    label: "AI Teacher",
    icon: { ios: "graduationcap", android: "school", web: "school" },
    activeIcon: {
      ios: "graduationcap.fill",
      android: "school",
      web: "school",
    },
  },
  chat: {
    label: "Chat",
    icon: { ios: "bubble.left", android: "chat_bubble", web: "chat_bubble" },
    activeIcon: {
      ios: "bubble.left.fill",
      android: "chat_bubble",
      web: "chat_bubble",
    },
  },
  profile: {
    label: "Profile",
    icon: { ios: "person", android: "person", web: "person" },
    activeIcon: { ios: "person.fill", android: "person", web: "person" },
  },
};

export function BottomTabBar({
  descriptors,
  navigation,
  state,
}: TabBarProps) {
  const pathname = usePathname();
  const [barWidth, setBarWidth] = useState(0);
  const translateX = useSharedValue(0);
  const isLessonRoute = pathname.startsWith("/lesson/");

  const visibleRoutes = useMemo(
    () => state.routes.filter((route) => tabConfig[route.name]),
    [state.routes],
  );
  const tabContentWidth = Math.max(
    barWidth - TAB_BAR_HORIZONTAL_PADDING * 2,
    0,
  );
  const itemWidth =
    visibleRoutes.length > 0 ? tabContentWidth / visibleRoutes.length : 0;
  const focusedRouteName = isLessonRoute ? "learn" : state.routes[state.index]?.name;
  const activeVisibleIndex = visibleRoutes.findIndex(
    (route) => route.name === focusedRouteName,
  );

  useEffect(() => {
    if (itemWidth <= 0 || activeVisibleIndex < 0) {
      return;
    }

    translateX.value = withTiming(
      TAB_BAR_HORIZONTAL_PADDING +
        activeVisibleIndex * itemWidth +
        itemWidth / 2 -
        ACTIVE_CIRCLE_SIZE / 2,
      {
        duration: 220,
        easing: Easing.linear,
      },
    );
  }, [activeVisibleIndex, itemWidth, translateX]);

  const activeCircleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  function handleLayout(event: LayoutChangeEvent) {
    setBarWidth(event.nativeEvent.layout.width);
  }

  if (isLessonRoute) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 px-[14px]"
      style={{ bottom: TAB_BAR_BOTTOM_GAP }}
    >
      <View style={styles.bar} onLayout={handleLayout}>
        {itemWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.activeCircle, activeCircleStyle]}
          />
        ) : null}

        {visibleRoutes.map((route) => {
          const isFocused = route.name === focusedRouteName;
          const config = tabConfig[route.name];
          const options = descriptors[route.key]?.options;
          const label =
            typeof options?.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options?.title === "string"
                ? options.title
                : config.label;
          const accessibilityRole: AccessibilityRole = "button";

          function handlePress() {
            const event = navigation.emit({
              canPreventDefault: true,
              target: route.key,
              type: "tabPress",
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }

          function handleLongPress() {
            navigation.emit({
              target: route.key,
              type: "tabLongPress",
            });
          }

          return (
            <Pressable
              key={route.key}
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
              accessibilityRole={accessibilityRole}
              accessibilityState={isFocused ? { selected: true } : undefined}
              onLongPress={handleLongPress}
              onPress={handlePress}
              className="min-w-0 flex-1 items-center justify-center gap-[3px]"
            >
              <View className="h-[34px] items-center justify-center">
                <SymbolView
                  name={isFocused ? config.activeIcon : config.icon}
                  size={isFocused ? 26 : 25}
                  tintColor={isFocused ? "#FFFFFF" : "#8189A7"}
                  type="monochrome"
                  fallback={
                    <Text
                      className={`font-poppins-semibold text-[20px] leading-[26px] ${
                        isFocused ? "text-white" : "text-[#8189A7]"
                      }`}
                    >
                      {config.label.charAt(0)}
                    </Text>
                  }
                />
              </View>

              {!isFocused ? (
                <Text
                  numberOfLines={1}
                  className="max-w-[74px] text-center font-poppins-semibold text-[12px] leading-[17px] text-[#69708B]"
                >
                  {label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeCircle: {
    alignItems: "center",
    backgroundColor: colors.brand.purple,
    borderRadius: ACTIVE_CIRCLE_SIZE / 2,
    height: ACTIVE_CIRCLE_SIZE,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    top: (TAB_BAR_HEIGHT - ACTIVE_CIRCLE_SIZE) / 2,
    width: ACTIVE_CIRCLE_SIZE,
  },
  bar: {
    backgroundColor: "#FFFFFF",
    borderCurve: "continuous",
    borderRadius: 30,
    boxShadow: "0 8px 28px rgba(13, 19, 43, 0.08)",
    flexDirection: "row",
    height: TAB_BAR_HEIGHT,
    paddingHorizontal: TAB_BAR_HORIZONTAL_PADDING,
    position: "relative",
  },
});
