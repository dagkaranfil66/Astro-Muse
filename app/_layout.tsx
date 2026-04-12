import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef } from "react";
import {
  Platform, View, StyleSheet,
  AppState, AppStateStatus, StatusBar,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppProvider, useApp } from "@/context/AppContext";
import { LanguageProvider, useLang } from "@/context/LanguageContext";
import { useFonts, CinzelDecorative_400Regular, CinzelDecorative_700Bold } from "@expo-google-fonts/cinzel-decorative";
import { Lora_400Regular, Lora_400Regular_Italic, Lora_700Bold } from "@expo-google-fonts/lora";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { SubscriptionProvider } from "@/lib/revenuecat";
import type * as NotificationsType from "expo-notifications";
import {
  requestNotificationPermission,
  setupAllDailyNotifications,
  scheduleReengagementNotifications,
  cancelReengagementNotifications,
  flushPendingReadingNotification,
  getExpoPushToken,
} from "@/lib/notifications";
import { getApiUrl } from "@/lib/query-client";

SplashScreen.preventAutoHideAsync().catch(() => {});

WebBrowser.maybeCompleteAuthSession();

console.log('APP_START');

let Notifications: typeof NotificationsType | null = null;

// ── App navigation ─────────────────────────────────────────────────────────

function RootLayoutNav() {
  const { isLoaded, hasSeenOnboarding, userProfile } = useApp();
  const { lang } = useLang();

  React.useEffect(() => {
    console.log('NAVIGATION_READY');
  }, []);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    (async () => {
      const granted = await requestNotificationPermission();
      if (granted) {
        await setupAllDailyNotifications(lang);
        // Get Expo push token and register with server
        const token = await getExpoPushToken();
        if (token && userProfile?.email) {
          try {
            await fetch(new URL("/api/notifications/register-token", getApiUrl()).toString(), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: userProfile.email, pushToken: token }),
            });
          } catch {}
        }
      }
    })();
  }, [lang, userProfile?.email]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;
      if (prev === "active" && next === "background") {
        await flushPendingReadingNotification();
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

  useEffect(() => {
    if (!Notifications || Platform.OS === "web") return;
    let sub: ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null = null;
    try {
      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const type = response.notification.request.content.data?.type as string | undefined;
        if (type === "coffee") {
          router.push("/reading/kahve" as any);
        } else if (type === "spin_ready") {
          router.push("/spin");
        } else if (type === "love") {
          router.push("/reading/ask" as any);
        } else if (type === "reading_ready") {
          router.back();
        }
      });
    } catch {}
    return () => { sub?.remove(); };
  }, []);

  return (
    <Stack screenOptions={{ headerBackTitle: "Geri", headerShown: false }}>
      <Stack.Screen name="(tabs)"            options={{ headerShown: false }} />
      <Stack.Screen name="onboarding"        options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="reading/[service]" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="purchase"          options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="auth"              options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="spin"              options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="legal"             options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="guide"             options={{ headerShown: false, presentation: "modal" }} />
    </Stack>
  );
}

// Dark background applied immediately at module level to prevent white flash
// on iOS before the first React Native frame is painted
const BG = "#070D1A";

export default function RootLayout() {
  console.log('ROOT_LAYOUT_RENDER');

  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    CinzelDecorative_400Regular,
    CinzelDecorative_700Bold,
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_700Bold,
  });

  // Initialize native SDKs AFTER the component mounts (safe for iOS)
  useEffect(() => {
    console.log('NOTIFICATIONS_INIT_START');
    if (Platform.OS !== "web") {
      try {
        const N = require("expo-notifications") as typeof NotificationsType;
        Notifications = N;
        N.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        console.log('NOTIFICATIONS_INIT_OK');
      } catch (e) {
        console.warn("NOTIFICATIONS_INIT_FAILED:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      console.log('FONTS_LOADED fontsLoaded=' + fontsLoaded + ' fontError=' + !!fontError);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Show dark screen while fonts load — same color as splash to avoid flash
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />
      </View>
    );
  }

  console.log('PROVIDERS_RENDER_START');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SubscriptionProvider>
            <AppProvider>
              <LanguageProvider>
                <GestureHandlerRootView style={styles.gesture}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </LanguageProvider>
            </AppProvider>
          </SubscriptionProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },
  gesture: { flex: 1, backgroundColor: BG },
  loading: { flex: 1, backgroundColor: BG },
});
