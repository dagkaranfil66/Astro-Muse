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

// Yıldız birleşim hedefi: logo merkezi (yaklaşık)
const LOGO_CX = SW / 2;
const LOGO_CY = SH / 2 - 52;

const P_COLORS = [Colors.gold, "#9B59B6", "#1ABFB8", "#C8B47A", "#5B9BD5", "#FF6B9D"];
const SPLASH_PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  x: SW * 0.04 + Math.random() * (SW * 0.92),
  y: SH * 0.03 + Math.random() * (SH * 0.90),
  size: 8 + Math.random() * 13,
  color: P_COLORS[i % P_COLORS.length],
}));

// Her yıldız kendi animasyon stilini hesaplar — paylaşılan converge değerini kullanır
function SplashStar({ x, y, size, color, appear, converge }: {
  x: number; y: number; size: number; color: string;
  appear: ReturnType<typeof useSharedValue<number>>;
  converge: ReturnType<typeof useSharedValue<number>>;
}) {
  const dx = LOGO_CX - x;
  const dy = LOGO_CY - y;
  const style = useAnimatedStyle(() => ({
    opacity: appear.value * Math.max(0, 1 - converge.value * 1.5),
    transform: [
      { translateX: dx * converge.value },
      { translateY: dy * converge.value },
      { scale: 1 - converge.value * 0.6 },
    ],
  }));
  return (
    <Animated.Text style={[{ position: "absolute", left: x - size / 2, top: y - size / 2, fontSize: size, color }, style]}>
      ✦
    </Animated.Text>
  );
}

function AnimatedSplashScreen({ fontsReady, onDone }: { fontsReady: boolean; onDone: () => void }) {
  const appear      = useSharedValue(0);   // yıldızlar belirir
  const converge    = useSharedValue(0);   // yıldızlar merkeze akar
  const logoOp      = useSharedValue(0);
  const logoScale   = useSharedValue(0.45);
  const titleOp     = useSharedValue(0);
  const titleSp     = useSharedValue(14);
  const sl1Op       = useSharedValue(0);  const sl1Y = useSharedValue(14);
  const sl2Op       = useSharedValue(0);  const sl2Y = useSharedValue(14);
  const containerOp = useSharedValue(1);

  const timerDone = useRef(false);
  const fontsDone = useRef(fontsReady);

  const doFinish = useCallback(() => {
    containerOp.value = withTiming(0, { duration: 280 }, () => { runOnJS(onDone)(); });
  }, []);
  const maybeFinish = useCallback(() => {
    if (timerDone.current && fontsDone.current) doFinish();
  }, []);

  useEffect(() => {
    if (fontsReady) { fontsDone.current = true; maybeFinish(); }
  }, [fontsReady]);

  useEffect(() => {
    // 1. Yıldızlar beliriyor (0–300ms)
    appear.value = withTiming(1, { duration: 300 });

    // 2. Yıldızlar merkeze akıyor (280–750ms)
    converge.value = withDelay(280, withTiming(1, { duration: 470, easing: Easing.in(Easing.quad) }));

    // 3. Logo oluşuyor (380–820ms) — yıldızlar birleşirken
    logoOp.value    = withDelay(380, withTiming(1, { duration: 400 }));
    logoScale.value = withDelay(380, withTiming(1, { duration: 480, easing: Easing.out(Easing.back(1.25)) }));

    // 4. "✦ T E N G R I ✦" açılıyor (740–1000ms)
    titleOp.value = withDelay(740, withTiming(1, { duration: 280 }));
    titleSp.value  = withDelay(740, withTiming(4, { duration: 380 }));

    // 5. Slogan satır 1 (960–1180ms)
    sl1Op.value = withDelay(960, withTiming(1, { duration: 220 }));
    sl1Y.value  = withDelay(960, withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) }));

    // 6. Slogan satır 2 (1110–1330ms) → tetikleyici
    sl2Op.value = withDelay(1110, withTiming(1, { duration: 220 }));
    sl2Y.value  = withDelay(1110, withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) }, () => {
      timerDone.current = true;
      runOnJS(maybeFinish)();
    }));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOp.value }));
  const logoStyle      = useAnimatedStyle(() => ({ opacity: logoOp.value, transform: [{ scale: logoScale.value }] }));
  const titleStyle     = useAnimatedStyle(() => ({ opacity: titleOp.value, letterSpacing: titleSp.value }));
  const sl1Style = useAnimatedStyle(() => ({ opacity: sl1Op.value, transform: [{ translateY: sl1Y.value }] }));
  const sl2Style = useAnimatedStyle(() => ({ opacity: sl2Op.value, transform: [{ translateY: sl2Y.value }] }));

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: "#06030F" }, containerStyle]}>
      <LinearGradient colors={["#06030F", "#070D1A", "#0D0820"]} style={StyleSheet.absoluteFill} />

      {/* Yıldız parçacıkları — merkeze akar */}
      {SPLASH_PARTICLES.map((p, i) => (
        <SplashStar key={i} x={p.x} y={p.y} size={p.size} color={p.color} appear={appear} converge={converge} />
      ))}

      {/* Merkezi içerik */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={logoStyle}>
          <Image source={require("@/assets/images/tengri-logo.png")} style={ss.logo} resizeMode="contain" />
        </Animated.View>

        <Animated.Text style={[ss.tengriTitle, titleStyle]}>✦  T E N G R I  ✦</Animated.Text>

        <View style={ss.sloganBlock}>
          <Animated.Text style={[ss.sloganLine, sl1Style]}>
            Telveler, yıldızlar ve kadim semboller…
          </Animated.Text>
          <Animated.Text style={[ss.sloganLine, sl2Style]}>
            Kaderinizin işaretlerini keşfedin.
          </Animated.Text>
        </View>
      </View>
    </Animated.View>
  );
}

const ss = StyleSheet.create({
  logo:        { width: 130, height: 130 },
  tengriTitle: { fontFamily: "CinzelDecorative_400Regular", fontSize: 12, color: Colors.gold, marginTop: 22, marginBottom: 20, letterSpacing: 14 },
  sloganBlock: { alignItems: "center", gap: 6, paddingHorizontal: 32 },
  sloganLine:  { fontFamily: "Lora_400Regular_Italic", fontSize: 13, color: "#C8B47A", textAlign: "center", lineHeight: 21 },
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
