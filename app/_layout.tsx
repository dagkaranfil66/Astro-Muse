import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import {
  Platform, View, Text, Image, StyleSheet,
  AppState, AppStateStatus, Dimensions,
} from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withRepeat, withSequence, withDelay,
  runOnJS, Easing,
} from "react-native-reanimated";
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

let Notifications: typeof NotificationsType | null = null;
if (Platform.OS !== "web") {
  try {
    Notifications = require("expo-notifications");
  } catch {
    // Expo Go on Android
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
  } catch {}
}

// ── Animated Splash ────────────────────────────────────────────────────────

const { width: SW, height: SH } = Dimensions.get("window");

const STARS = [
  { x: 0.12, y: 0.08, sz: 2.5, d: 80  },
  { x: 0.82, y: 0.06, sz: 1.8, d: 200 },
  { x: 0.45, y: 0.04, sz: 1.4, d: 340 },
  { x: 0.93, y: 0.22, sz: 2.0, d: 120 },
  { x: 0.05, y: 0.28, sz: 1.6, d: 460 },
  { x: 0.68, y: 0.18, sz: 1.2, d: 280 },
  { x: 0.28, y: 0.14, sz: 2.2, d: 560 },
  { x: 0.55, y: 0.32, sz: 1.0, d: 400 },
  { x: 0.88, y: 0.45, sz: 1.8, d: 180 },
  { x: 0.03, y: 0.55, sz: 2.0, d: 640 },
  { x: 0.75, y: 0.60, sz: 1.4, d: 320 },
  { x: 0.20, y: 0.72, sz: 2.4, d: 100 },
  { x: 0.92, y: 0.70, sz: 1.6, d: 500 },
  { x: 0.38, y: 0.80, sz: 1.2, d: 240 },
  { x: 0.60, y: 0.86, sz: 2.0, d: 380 },
  { x: 0.10, y: 0.90, sz: 1.8, d: 60  },
  { x: 0.50, y: 0.93, sz: 1.0, d: 430 },
  { x: 0.80, y: 0.88, sz: 2.2, d: 300 },
  { x: 0.35, y: 0.50, sz: 1.4, d: 700 },
  { x: 0.72, y: 0.38, sz: 1.0, d: 520 },
];

function SplashStar({ x, y, sz, d }: { x: number; y: number; sz: number; d: number }) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withDelay(d, withTiming(1, { duration: 600 }));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{
        position: "absolute",
        left: x * SW,
        top: y * SH,
        width: sz,
        height: sz,
        borderRadius: sz / 2,
        backgroundColor: "#E8D5A0",
      }, style]}
    />
  );
}

// Shooting star — one quick streak
function ShootingStar({ delay }: { delay: number }) {
  const x = useSharedValue(-60);
  const opacity = useSharedValue(0);
  useEffect(() => {
    setTimeout(() => {
      opacity.value = withSequence(
        withTiming(1,  { duration: 100 }),
        withTiming(0,  { duration: 400 }),
      );
      x.value = withTiming(SW + 60, { duration: 500, easing: Easing.linear });
    }, delay);
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: x.value }],
  }));
  return (
    <Animated.View
      style={[{
        position: "absolute",
        top: SH * 0.22,
        left: SW * 0.1,
        width: 60,
        height: 1,
        backgroundColor: "rgba(232,213,160,0.9)",
        borderRadius: 1,
      }, style]}
    />
  );
}

function AnimatedSplashScreen({ onDone }: { onDone: () => void }) {
  const exitOpacity   = useSharedValue(1);
  const logoOpacity   = useSharedValue(0);
  const logoScale     = useSharedValue(0.6);
  const glowOpacity   = useSharedValue(0);
  const ringRotate    = useSharedValue(0);
  const titleY        = useSharedValue(28);
  const titleOpacity  = useSharedValue(0);
  const subOpacity    = useSharedValue(0);
  const dividerWidth  = useSharedValue(0);

  useEffect(() => {
    // Logo appears
    logoOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
    logoScale.value   = withSpring(1, { damping: 14, stiffness: 100 });

    // Rotating ring
    ringRotate.value  = withRepeat(withTiming(360, { duration: 4000, easing: Easing.linear }), -1, false);

    // Glow pulse
    glowOpacity.value = withDelay(280, withRepeat(
      withSequence(
        withTiming(0.85, { duration: 600 }),
        withTiming(0.35, { duration: 600 }),
      ), -1, true,
    ));

    // Title slides up
    titleY.value       = withDelay(380, withSpring(0, { damping: 18 }));
    titleOpacity.value = withDelay(380, withTiming(1, { duration: 280 }));

    // Divider expands
    dividerWidth.value = withDelay(500, withTiming(64, { duration: 300, easing: Easing.out(Easing.cubic) }));

    // Subtitle
    subOpacity.value   = withDelay(580, withTiming(1, { duration: 280 }));

    // Exit — total ~1.5s
    exitOpacity.value  = withDelay(1100, withTiming(0, { duration: 350 }, (done) => {
      if (done) runOnJS(onDone)();
    }));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: exitOpacity.value }));
  const logoStyle      = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const glowStyle      = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const ringStyle      = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotate.value}deg` }],
  }));
  const titleStyle     = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const divStyle       = useAnimatedStyle(() => ({ width: dividerWidth.value }));
  const subStyle       = useAnimatedStyle(() => ({ opacity: subOpacity.value }));

  return (
    <Animated.View style={[sp.container, containerStyle]}>
      <LinearGradient
        colors={["#060214", "#08051A", "#050F1E"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Stars */}
      {STARS.map((s, i) => <SplashStar key={i} {...s} />)}
      <ShootingStar delay={400} />
      <ShootingStar delay={800} />

      {/* Logo area */}
      <View style={sp.logoArea}>
        {/* Outer glow */}
        <Animated.View style={[sp.glowOuter, glowStyle]} />
        <Animated.View style={[sp.glowMid,   glowStyle]} />
        <Animated.View style={[sp.glowInner, glowStyle]} />

        {/* Rotating golden ring */}
        <Animated.View style={[sp.ring, ringStyle]} />

        {/* Logo */}
        <Animated.View style={logoStyle}>
          <Image
            source={require("@/assets/images/tengri-logo.png")}
            style={sp.logo}
            resizeMode="contain"
            fadeDuration={0}
          />
        </Animated.View>
      </View>

      {/* Text block */}
      <Animated.View style={[sp.textBlock, titleStyle]}>
        <Text style={sp.title}>TENGRI</Text>
        <Animated.View style={[sp.divider, divStyle]} />
        <Animated.Text style={[sp.subtitle, subStyle]}>
          ✦  Mistik Rehberlik  ✦
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const sp = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#060214",
  },
  logoArea: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  glowOuter: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(212,175,55,0.14)",
  },
  glowMid: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(212,175,55,0.22)",
  },
  glowInner: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(212,175,55,0.18)",
  },
  ring: {
    position: "absolute",
    width: 162,
    height: 162,
    borderRadius: 81,
    borderWidth: 1.5,
    borderColor: "rgba(212,175,55,0.55)",
    borderStyle: "dashed",
  },
  logo: {
    width: 120,
    height: 120,
  },
  textBlock: {
    alignItems: "center",
    gap: 0,
  },
  title: {
    fontSize: 34,
    fontFamily: "CinzelDecorative_700Bold",
    color: "#D4AF37",
    letterSpacing: 10,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(212,175,55,0.55)",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Lora_400Regular_Italic",
    color: "rgba(212,175,55,0.75)",
    letterSpacing: 2.5,
  },
});

// ── App navigation ─────────────────────────────────────────────────────────

function RootLayoutNav() {
  const { isLoaded, hasSeenOnboarding, zodiacSign } = useApp();
  const { lang } = useLang();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    (async () => {
      const granted = await requestNotificationPermission();
      if (granted) {
        await setupAllDailyNotifications(lang, zodiacSign);
      }
    })();
  }, [lang, zodiacSign]);

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
    } catch {}
    return () => { sub?.remove(); };
  }, []);

  return (
    <Stack screenOptions={{ headerBackTitle: "Geri", headerShown: false }}>
      <Stack.Screen name="(tabs)"          options={{ headerShown: false }} />
      <Stack.Screen name="onboarding"      options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="reading/[service]" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="purchase"        options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="auth"            options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="daily-horoscope" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="spin"            options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="legal"           options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="guide"           options={{ headerShown: false, presentation: "modal" }} />
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

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Phase 1: fonts still loading — static fallback
  if (!fontsLoaded && !fontError) {
    return (
      <View style={fallbackStyles.container}>
        <LinearGradient colors={["#060214", "#08051A", "#050F1E"]} style={StyleSheet.absoluteFill} />
        <Image
          source={require("@/assets/images/tengri-logo.png")}
          style={fallbackStyles.logo}
          resizeMode="contain"
          fadeDuration={0}
        />
      </View>
    );
  }

  // Phase 2: fonts loaded, animated splash running
  if (!splashDone) {
    return <AnimatedSplashScreen onDone={() => setSplashDone(true)} />;
  }

  // Phase 3: app
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

const fallbackStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060214", alignItems: "center", justifyContent: "center" },
  logo:      { width: 120, height: 120 },
});
