import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { Platform, View, Image, StyleSheet, AppState, AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppProvider, useApp } from "@/context/AppContext";
import { LanguageProvider, useLang } from "@/context/LanguageContext";
import { useFonts, CinzelDecorative_400Regular, CinzelDecorative_700Bold } from "@expo-google-fonts/cinzel-decorative";
import { Lora_400Regular, Lora_400Regular_Italic, Lora_700Bold } from "@expo-google-fonts/lora";
import { Colors } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { initializeRevenueCat, SubscriptionProvider } from "@/lib/revenuecat";
import type * as NotificationsType from "expo-notifications";
import {
  requestNotificationPermission,
  setupAllDailyNotifications,
  scheduleReengagementNotifications,
  cancelReengagementNotifications,
} from "@/lib/notifications";

SplashScreen.preventAutoHideAsync();
initializeRevenueCat();

// expo-notifications was removed from Expo Go on Android in SDK 53.
// Use dynamic require() so Android Expo Go doesn't crash.
let Notifications: typeof NotificationsType | null = null;
if (Platform.OS !== "web") {
  try {
    Notifications = require("expo-notifications");
  } catch {
    // Expo Go on Android — notifications not available
  }
}

if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // ignore if unavailable
  }
}

function RootLayoutNav() {
  const { isLoaded, hasSeenOnboarding, zodiacSign } = useApp();
  const { lang } = useLang();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Setup all daily notifications once on mount
  useEffect(() => {
    (async () => {
      const granted = await requestNotificationPermission();
      if (granted) {
        await setupAllDailyNotifications(lang, zodiacSign);
      }
    })();
  }, [lang, zodiacSign]);

  // Re-engagement: schedule when backgrounded, cancel when foregrounded
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;
      if (prev === "active" && next === "background") {
        await scheduleReengagementNotifications(lang);
      } else if (prev !== "active" && next === "active") {
        await cancelReengagementNotifications();
      }
    });
    return () => sub.remove();
  }, [lang]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!hasSeenOnboarding) {
      router.replace("/onboarding");
    }
  }, [isLoaded, hasSeenOnboarding]);

  // Deep-link routing on notification tap
  useEffect(() => {
    if (!Notifications || Platform.OS === "web") return;
    let sub: ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null = null;
    try {
      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const type = response.notification.request.content.data?.type as string | undefined;
        if (type === "horoscope" || type === "daily-horoscope") {
          router.push("/daily-horoscope");
        } else if (type === "coffee") {
          router.push("/reading/kahve" as any);
        } else if (type === "spin_ready") {
          router.push("/spin");
        } else if (type === "love") {
          router.push("/reading/ask" as any);
        } else if (type === "reading_ready") {
          router.back();
        }
      });
    } catch {
      // ignore
    }
    return () => { sub?.remove(); };
  }, []);

  return (
    <Stack screenOptions={{ headerBackTitle: "Geri", headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="reading/[service]" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="purchase" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="auth" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="daily-horoscope" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="spin" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="legal" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="guide" options={{ headerShown: false, presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CinzelDecorative_400Regular,
    CinzelDecorative_700Bold,
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={splashStyles.container}>
        <LinearGradient colors={["#08051A", "#070D1A", "#0D0820"]} style={StyleSheet.absoluteFill} />
        <Image
          source={require("@/assets/images/tengri-logo.png")}
          style={splashStyles.logo}
          resizeMode="contain"
          fadeDuration={0}
        />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SubscriptionProvider>
          <AppProvider>
            <LanguageProvider>
              <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </LanguageProvider>
          </AppProvider>
        </SubscriptionProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const splashStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08051A", alignItems: "center", justifyContent: "center" },
  logo: { width: 160, height: 160 },
});
