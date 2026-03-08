import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform, View, Image, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppProvider } from "@/context/AppContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { useFonts, CinzelDecorative_400Regular, CinzelDecorative_700Bold } from "@expo-google-fonts/cinzel-decorative";
import { Lora_400Regular, Lora_400Regular_Italic, Lora_700Bold } from "@expo-google-fonts/lora";
import { Colors } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { initializeRevenueCat, SubscriptionProvider } from "@/lib/revenuecat";
import type * as NotificationsType from "expo-notifications";

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

async function setupDailyNotification() {
  if (!Notifications || Platform.OS === "web") return;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("daily-horoscope", {
        name: "Günlük Burç",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#E7B008",
      });
    }

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const alreadySet = scheduled.some(
      (n) => n.content.data?.type === "daily-horoscope"
    );
    if (!alreadySet) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "✦ Tengri'nin Günlük Mesajı",
          body: "Bugünkü mistik rehberliğiniz hazır! Yıldızlar sizi bekliyor...",
          data: { type: "daily-horoscope" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 0,
        },
      });
    }
  } catch (e) {
    console.warn("Notification setup error:", e);
  }
}

function RootLayoutNav() {
  useEffect(() => {
    setupDailyNotification();
  }, []);

  useEffect(() => {
    if (!Notifications || Platform.OS === "web") return;
    let sub: ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null = null;
    try {
      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const type = response.notification.request.content.data?.type;
        if (type === "daily-horoscope") {
          router.push("/daily-horoscope");
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
      <Stack.Screen name="reading/[service]" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="purchase" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="auth" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="daily-horoscope" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="spin" options={{ headerShown: false, presentation: "modal" }} />
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
