import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useLang } from "@/context/LanguageContext";
import Constants from "expo-constants";

// Expo Go cannot load the ExpoGlassEffect or react-native-screens BottomTabs
// native modules — always use ClassicTabLayout there.
const IS_EXPO_GO = Constants.executionEnvironment === "storeClient";

// Safely check liquid glass availability without crashing in Expo Go
function checkLiquidGlass(): boolean {
  if (IS_EXPO_GO || Platform.OS !== "ios") return false;
  try {
    const { isLiquidGlassAvailable } = require("expo-glass-effect");
    return !!isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

const USE_NATIVE_TABS = checkLiquidGlass();

// Lazy-load NativeTabLayout only when needed (avoids loading native modules in Expo Go)
function NativeTabLayout() {
  const { lang } = useLang();
  try {
    const { NativeTabs, Icon, Label } = require("expo-router/unstable-native-tabs");
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf={{ default: "moon.stars", selected: "moon.stars.fill" }} />
          <Label>{lang === "tr" ? "Keşfet" : "Explore"}</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
          <Label>{lang === "tr" ? "Profil" : "Profile"}</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="history">
          <Icon sf={{ default: "scroll", selected: "scroll.fill" }} />
          <Label>{lang === "tr" ? "Geçmiş" : "History"}</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  } catch {
    return <ClassicTabLayout />;
  }
}

function ClassicTabLayout() {
  const { lang } = useLang();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textDim,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : Colors.surface,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: Colors.cardBorder,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: lang === "tr" ? "Keşfet" : "Explore",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="moon" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: lang === "tr" ? "Profil" : "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: lang === "tr" ? "Geçmiş" : "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (USE_NATIVE_TABS) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
