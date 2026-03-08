import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Platform, View, Image, StyleSheet, Text, Dimensions } from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, Easing, runOnJS,
} from "react-native-reanimated";
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

const { width: SW, height: SH } = Dimensions.get("window");
const PARTICLE_COLORS = [Colors.gold, "#9B59B6", "#1ABFB8", "#C8B47A", "#5B9BD5"];
const SPLASH_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: SW * 0.05 + Math.random() * (SW * 0.90),
  y: SH * 0.04 + Math.random() * (SH * 0.88),
  size: 7 + Math.random() * 12,
  color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
}));

function AnimatedSplashScreen({ fontsReady, onDone }: { fontsReady: boolean; onDone: () => void }) {
  const containerOp  = useSharedValue(1);
  const particlesOp  = useSharedValue(0);
  const logoScale    = useSharedValue(0.5);
  const logoOp       = useSharedValue(0);
  const titleOp      = useSharedValue(0);
  const titleSpacing = useSharedValue(14);
  const w1Op = useSharedValue(0); const w1Y = useSharedValue(16);
  const w2Op = useSharedValue(0); const w2Y = useSharedValue(16);
  const w3Op = useSharedValue(0); const w3Y = useSharedValue(16);

  const timerDone = useRef(false);
  const fontsDone = useRef(fontsReady);

  const doFinish = useCallback(() => {
    containerOp.value = withTiming(0, { duration: 320 }, () => { runOnJS(onDone)(); });
  }, []);

  const maybeFinish = useCallback(() => {
    if (timerDone.current && fontsDone.current) doFinish();
  }, []);

  useEffect(() => {
    if (fontsReady) { fontsDone.current = true; maybeFinish(); }
  }, [fontsReady]);

  useEffect(() => {
    particlesOp.value = withTiming(0.75, { duration: 550 });

    logoScale.value = withDelay(280, withTiming(1,  { duration: 520, easing: Easing.out(Easing.back(1.3)) }));
    logoOp.value    = withDelay(280, withTiming(1,  { duration: 380 }));

    titleOp.value      = withDelay(720, withTiming(1,  { duration: 300 }));
    titleSpacing.value = withDelay(720, withTiming(5,  { duration: 420 }));

    w1Op.value = withDelay(1060, withTiming(1, { duration: 220 }));
    w1Y.value  = withDelay(1060, withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) }));

    w2Op.value = withDelay(1210, withTiming(1, { duration: 220 }));
    w2Y.value  = withDelay(1210, withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) }));

    w3Op.value = withDelay(1360, withTiming(1, { duration: 220 }));
    w3Y.value  = withDelay(1360, withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) }, () => {
      timerDone.current = true;
      runOnJS(maybeFinish)();
    }));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOp.value }));
  const particlesStyle = useAnimatedStyle(() => ({ opacity: particlesOp.value }));
  const logoStyle      = useAnimatedStyle(() => ({ opacity: logoOp.value, transform: [{ scale: logoScale.value }] }));
  const titleStyle     = useAnimatedStyle(() => ({ opacity: titleOp.value, letterSpacing: titleSpacing.value }));
  const w1Style = useAnimatedStyle(() => ({ opacity: w1Op.value, transform: [{ translateY: w1Y.value }] }));
  const w2Style = useAnimatedStyle(() => ({ opacity: w2Op.value, transform: [{ translateY: w2Y.value }] }));
  const w3Style = useAnimatedStyle(() => ({ opacity: w3Op.value, transform: [{ translateY: w3Y.value }] }));

  return (
    <Animated.View style={[{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#08051A" }, containerStyle]}>
      <LinearGradient colors={["#06030F", "#070D1A", "#0D0820"]} style={StyleSheet.absoluteFill} />

      {SPLASH_PARTICLES.map((p, i) => (
        <Animated.Text key={i} style={[{ position: "absolute", left: p.x, top: p.y, fontSize: p.size, color: p.color }, particlesStyle]}>✦</Animated.Text>
      ))}

      <Animated.View style={logoStyle}>
        <Image source={require("@/assets/images/tengri-logo.png")} style={ss.logo} resizeMode="contain" />
      </Animated.View>

      <Animated.Text style={[ss.tengriTitle, titleStyle]}>✦  T E N G R I  ✦</Animated.Text>

      <View style={ss.wordsRow}>
        <Animated.Text style={[ss.word, w1Style]}>Keşfet</Animated.Text>
        <Text style={ss.dot}>  ·  </Text>
        <Animated.Text style={[ss.word, w2Style]}>Oku</Animated.Text>
        <Text style={ss.dot}>  ·  </Text>
        <Animated.Text style={[ss.word, w3Style]}>Yorumla</Animated.Text>
      </View>
    </Animated.View>
  );
}

const ss = StyleSheet.create({
  logo:        { width: 130, height: 130 },
  tengriTitle: { fontFamily: "CinzelDecorative_400Regular", fontSize: 13, color: Colors.gold, marginTop: 20, marginBottom: 18 },
  wordsRow:    { flexDirection: "row", alignItems: "center" },
  word:        { fontFamily: "Lora_400Regular_Italic", fontSize: 15, color: "#C8B47A", letterSpacing: 0.5 },
  dot:         { fontSize: 15, color: "#4A5A7A" },
});

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
  const [splashDone, setSplashDone] = useState(false);
  const fontsReady = fontsLoaded || !!fontError;

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync();
  }, [fontsReady]);

  if (!splashDone) {
    return <AnimatedSplashScreen fontsReady={fontsReady} onDone={() => setSplashDone(true)} />;
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
