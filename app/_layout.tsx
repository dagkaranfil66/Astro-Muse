import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Platform, View, Image, StyleSheet, Text, Dimensions } from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, Easing, runOnJS,
  type SharedValue,
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

// Logo merkezi — yıldızlar buraya akar
const LOGO_CX = SW / 2;
const LOGO_CY = SH / 2 - 58;

// Parçacık boyut katmanları: küçük(3), orta(5), büyük(8) — derinlik hissi
const DOTS_RAW: { x: number; y: number; size: number; color: string }[] = [];
const DOT_CONFIGS = [
  { count: 18, sizeMin: 3, sizeMax: 5, colors: ["#FFFFFF", "#FFF5D0", "#E7B008"] },
  { count: 14, sizeMin: 5, sizeMax: 8, colors: ["#C8B47A", "#1ABFB8", "#9B59B6"] },
  { count: 10, sizeMin: 2, sizeMax: 4, colors: ["#FFFFFF", "#5B9BD5", "#E7B008"] },
];
for (const cfg of DOT_CONFIGS) {
  for (let i = 0; i < cfg.count; i++) {
    DOTS_RAW.push({
      x: SW * 0.03 + Math.random() * (SW * 0.94),
      y: SH * 0.03 + Math.random() * (SH * 0.92),
      size: cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin),
      color: cfg.colors[i % cfg.colors.length],
    });
  }
}

// Tek bir parçacık — logo merkezine doğru uçar
function SplashDot({ x, y, size, color, appear, converge }: {
  x: number; y: number; size: number; color: string;
  appear: SharedValue<number>; converge: SharedValue<number>;
}) {
  const dx = LOGO_CX - x;
  const dy = LOGO_CY - y;
  const style = useAnimatedStyle(() => {
    const c = converge.value;
    const a = appear.value;
    // Hızlanarak merkeze akar, yaklaştıkça küçülür ve solar
    return {
      opacity: a * Math.max(0, 1 - c * 1.7),
      transform: [
        { translateX: dx * c },
        { translateY: dy * c },
        { scale: Math.max(0.2, 1 - c * 0.8) },
      ],
    };
  });
  return (
    <Animated.View style={[{
      position: "absolute",
      left: x - size / 2,
      top:  y - size / 2,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
    }, style]} />
  );
}

// Merkezi altın parıltı — yıldızlar birleşince ışır, sonra logoyla değişir
function CenterGlow({ converge, logoOp }: { converge: SharedValue<number>; logoOp: SharedValue<number> }) {
  const outerStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, converge.value * 2.5) * Math.max(0, 1 - logoOp.value * 1.2),
    transform: [{ scale: 0.3 + converge.value * 1.1 }],
  }));
  return (
    <Animated.View style={[outerStyle, {
      position: "absolute",
      left: LOGO_CX - 90,
      top:  LOGO_CY - 90,
      width: 180,
      height: 180,
      alignItems: "center",
      justifyContent: "center",
    }]}>
      <View style={{ position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(231,176,8,0.05)" }} />
      <View style={{ position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(231,176,8,0.10)" }} />
      <View style={{ position: "absolute", width: 50,  height: 50,  borderRadius: 25, backgroundColor: "rgba(255,210,80,0.20)" }} />
      <View style={{ position: "absolute", width: 16,  height: 16,  borderRadius: 8,  backgroundColor: "rgba(255,255,200,0.85)" }} />
    </Animated.View>
  );
}

function AnimatedSplashScreen({ fontsReady, onDone }: { fontsReady: boolean; onDone: () => void }) {
  const appear      = useSharedValue(0);
  const converge    = useSharedValue(0);
  const logoOp      = useSharedValue(0);
  const logoScale   = useSharedValue(0.4);
  const titleOp     = useSharedValue(0);
  const titleSp     = useSharedValue(16);
  const sl1Op       = useSharedValue(0); const sl1Y = useSharedValue(12);
  const sl2Op       = useSharedValue(0); const sl2Y = useSharedValue(12);
  const containerOp = useSharedValue(1);

  const timerDone = useRef(false);
  const fontsDone = useRef(fontsReady);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // setTimeout tabanlı güvenli bitiş — worklet callback'inden bağımsız
  const tryFinish = useRef(() => {
    if (timerDone.current && fontsDone.current) {
      containerOp.value = withTiming(0, { duration: 300 });
      setTimeout(() => onDoneRef.current(), 320);
    }
  });

  useEffect(() => {
    if (fontsReady) {
      fontsDone.current = true;
      tryFinish.current();
    }
  }, [fontsReady]);

  useEffect(() => {
    // ① Parçacıklar beliriyor — 0–280ms
    appear.value = withTiming(1, { duration: 280 });

    // ② Merkeze hücum — 240–700ms (ivmelenerek: cubic)
    converge.value = withDelay(240, withTiming(1, { duration: 460, easing: Easing.in(Easing.cubic) }));

    // ③ Logo oluşuyor — 500–900ms
    logoOp.value    = withDelay(500, withTiming(1, { duration: 380 }));
    logoScale.value = withDelay(500, withTiming(1, { duration: 460, easing: Easing.out(Easing.back(1.2)) }));

    // ④ Başlık — 760–1020ms
    titleOp.value = withDelay(760, withTiming(1, { duration: 280 }));
    titleSp.value  = withDelay(760, withTiming(4,  { duration: 360 }));

    // ⑤ Slogan 1. satır — 960–1170ms
    sl1Op.value = withDelay(960, withTiming(1, { duration: 210 }));
    sl1Y.value  = withDelay(960, withTiming(0, { duration: 210, easing: Easing.out(Easing.quad) }));

    // ⑥ Slogan 2. satır — 1110–1320ms
    sl2Op.value = withDelay(1110, withTiming(1, { duration: 210 }));
    sl2Y.value  = withDelay(1110, withTiming(0, { duration: 210, easing: Easing.out(Easing.quad) }));

    // Animasyon bitti → geçişi tetikle (setTimeout — worklet'e gerek yok)
    const t = setTimeout(() => {
      timerDone.current = true;
      tryFinish.current();
    }, 1380);

    return () => clearTimeout(t);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOp.value }));
  const logoStyle      = useAnimatedStyle(() => ({ opacity: logoOp.value, transform: [{ scale: logoScale.value }] }));
  const titleStyle     = useAnimatedStyle(() => ({ opacity: titleOp.value, letterSpacing: titleSp.value }));
  const sl1Style = useAnimatedStyle(() => ({ opacity: sl1Op.value, transform: [{ translateY: sl1Y.value }] }));
  const sl2Style = useAnimatedStyle(() => ({ opacity: sl2Op.value, transform: [{ translateY: sl2Y.value }] }));

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: "#04020C" }, containerStyle]}>
      <LinearGradient
        colors={["#04020C", "#07061A", "#0D0A22"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Parçacıklar — logo merkezine fırlar */}
      {DOTS_RAW.map((p, i) => (
        <SplashDot key={i} x={p.x} y={p.y} size={p.size} color={p.color} appear={appear} converge={converge} />
      ))}

      {/* Birleşim noktasında altın parıltı */}
      <CenterGlow converge={converge} logoOp={logoOp} />

      {/* Ana içerik — ortada */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={logoStyle}>
          <Image
            source={require("@/assets/images/tengri-logo.png")}
            style={ss.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text style={[ss.tengriTitle, titleStyle]}>
          ✦  T E N G R I  ✦
        </Animated.Text>

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
  logo:        { width: 132, height: 132 },
  tengriTitle: { fontFamily: "CinzelDecorative_400Regular", fontSize: 12, color: Colors.gold, marginTop: 24, marginBottom: 20 },
  sloganBlock: { alignItems: "center", gap: 6, paddingHorizontal: 30 },
  sloganLine:  { fontFamily: "Lora_400Regular_Italic", fontSize: 13, color: "#C8B47A", textAlign: "center", lineHeight: 22 },
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
