import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import {
  Platform, View, Text, Image, StyleSheet,
  AppState, AppStateStatus, Dimensions,
} from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle, SharedValue,
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

// ─── Star data — mix of twinklers and statics ──────────────────────────────
const STARS: { x: number; y: number; sz: number; d: number; twinkle?: boolean }[] = [
  { x: 0.12, y: 0.08, sz: 2.8, d: 60,  twinkle: true  },
  { x: 0.82, y: 0.06, sz: 2.0, d: 120                  },
  { x: 0.45, y: 0.04, sz: 1.4, d: 180, twinkle: true  },
  { x: 0.93, y: 0.22, sz: 2.4, d: 80                   },
  { x: 0.05, y: 0.28, sz: 1.8, d: 240, twinkle: true  },
  { x: 0.68, y: 0.18, sz: 1.2, d: 160                  },
  { x: 0.28, y: 0.14, sz: 2.6, d: 300, twinkle: true  },
  { x: 0.55, y: 0.32, sz: 1.0, d: 200                  },
  { x: 0.88, y: 0.45, sz: 2.0, d: 100, twinkle: true  },
  { x: 0.03, y: 0.55, sz: 2.2, d: 360                  },
  { x: 0.75, y: 0.60, sz: 1.6, d: 180, twinkle: true  },
  { x: 0.20, y: 0.72, sz: 2.8, d: 60                   },
  { x: 0.92, y: 0.70, sz: 1.8, d: 280, twinkle: true  },
  { x: 0.38, y: 0.80, sz: 1.2, d: 140                  },
  { x: 0.60, y: 0.86, sz: 2.4, d: 220, twinkle: true  },
  { x: 0.10, y: 0.90, sz: 2.0, d: 40                   },
  { x: 0.50, y: 0.93, sz: 1.0, d: 260                  },
  { x: 0.80, y: 0.88, sz: 2.6, d: 180, twinkle: true  },
  { x: 0.35, y: 0.50, sz: 1.4, d: 400                  },
  { x: 0.72, y: 0.38, sz: 1.0, d: 320, twinkle: true  },
  { x: 0.15, y: 0.42, sz: 3.0, d: 80,  twinkle: true  },
  { x: 0.62, y: 0.10, sz: 1.6, d: 140                  },
  { x: 0.90, y: 0.12, sz: 2.2, d: 200, twinkle: true  },
  { x: 0.42, y: 0.95, sz: 1.8, d: 320                  },
];

function SplashStar({ x, y, sz, d, twinkle }: { x: number; y: number; sz: number; d: number; twinkle?: boolean }) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    if (twinkle) {
      opacity.value = withDelay(d,
        withRepeat(
          withSequence(
            withTiming(1,   { duration: 350 }),
            withTiming(0.2, { duration: 350 }),
          ), -1, true,
        ),
      );
    } else {
      opacity.value = withDelay(d, withTiming(1, { duration: 400 }));
    }
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{
        position: "absolute",
        left: x * SW,
        top:  y * SH,
        width: sz,
        height: sz,
        borderRadius: sz / 2,
        backgroundColor: twinkle ? "#FFE9A0" : "#E8D5A0",
      }, style]}
    />
  );
}

// ─── Shooting star ─────────────────────────────────────────────────────────
function ShootingStar({ delay, yRatio }: { delay: number; yRatio: number }) {
  const x       = useSharedValue(-80);
  const opacity = useSharedValue(0);
  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withSequence(
        withTiming(1, { duration: 80  }),
        withTiming(0, { duration: 380 }),
      );
      x.value = withTiming(SW + 80, { duration: 460, easing: Easing.linear });
    }, delay);
    return () => clearTimeout(t);
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateX: x.value }],
  }));
  return (
    <Animated.View
      style={[{
        position: "absolute",
        top:  SH * yRatio,
        left: SW * 0.05,
        width: 80,
        height: 1.5,
        borderRadius: 1,
        backgroundColor: "rgba(255,233,160,0.95)",
      }, style]}
    />
  );
}

// ─── Orbit ring (3 rings at different radii / speeds / directions) ─────────
function OrbitRing({ r, speed, reverse, dashed }: { r: number; speed: number; reverse?: boolean; dashed?: boolean }) {
  const rotate = useSharedValue(0);
  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(reverse ? -360 : 360, { duration: speed, easing: Easing.linear }),
      -1, false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));
  return (
    <Animated.View style={[{
      position: "absolute",
      width:  r * 2,
      height: r * 2,
      borderRadius: r,
      borderWidth: dashed ? 1 : 1.2,
      borderColor: dashed ? "rgba(212,175,55,0.30)" : "rgba(212,175,55,0.50)",
      borderStyle: dashed ? "dashed" : "solid",
    }, style]} />
  );
}

// ─── Radial light rays ─────────────────────────────────────────────────────
function LightRays({ glowOp }: { glowOp: Animated.SharedValue<number> }) {
  const rotate = useSharedValue(0);
  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 9000, easing: Easing.linear }),
      -1, false,
    );
  }, []);
  const wrapStyle = useAnimatedStyle(() => ({
    opacity:   glowOp.value * 0.28,
    transform: [{ rotate: `${rotate.value}deg` }],
  }));
  const rayAngles = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5];
  return (
    <Animated.View style={[{ position: "absolute", width: 240, height: 240, alignItems: "center", justifyContent: "center" }, wrapStyle]}>
      {rayAngles.map((a) => (
        <View key={a} style={{
          position:        "absolute",
          width:           1,
          height:          220,
          backgroundColor: "#D4AF37",
          transform:       [{ rotate: `${a}deg` }],
        }} />
      ))}
    </Animated.View>
  );
}

// ─── Burst particles (8 directions) ───────────────────────────────────────
const BURST: { angle: number; dist: number; color: string }[] = [
  { angle:   0, dist: 90, color: "#FFD700" },
  { angle:  45, dist: 80, color: "#FFF8DC" },
  { angle:  90, dist: 95, color: "#D4AF37" },
  { angle: 135, dist: 78, color: "#FFD700" },
  { angle: 180, dist: 88, color: "#FFF8DC" },
  { angle: 225, dist: 82, color: "#D4AF37" },
  { angle: 270, dist: 92, color: "#FFD700" },
  { angle: 315, dist: 76, color: "#FFF8DC" },
];

function BurstParticle({ angle, dist, color, fireAt }: { angle: number; dist: number; color: string; fireAt: number }) {
  const rad = (angle * Math.PI) / 180;
  const tx  = useSharedValue(0);
  const ty  = useSharedValue(0);
  const op  = useSharedValue(0);
  const sc  = useSharedValue(0.5);
  useEffect(() => {
    const t = setTimeout(() => {
      op.value = withSequence(withTiming(1, { duration: 80 }), withTiming(0, { duration: 480 }));
      tx.value = withTiming(Math.cos(rad) * dist, { duration: 560, easing: Easing.out(Easing.cubic) });
      ty.value = withTiming(Math.sin(rad) * dist, { duration: 560, easing: Easing.out(Easing.cubic) });
      sc.value = withSequence(withTiming(1.4, { duration: 80 }), withTiming(0.2, { duration: 480 }));
    }, fireAt);
    return () => clearTimeout(t);
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity:   op.value,
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: sc.value }],
  }));
  return (
    <Animated.View style={[{ position: "absolute", width: 6, height: 6, borderRadius: 3, backgroundColor: color }, style]} />
  );
}

// ─── Main animated splash ──────────────────────────────────────────────────
function AnimatedSplashScreen({ onDone }: { onDone: () => void }) {
  const exitOpacity  = useSharedValue(1);
  const logoOpacity  = useSharedValue(0);
  const logoScale    = useSharedValue(0.4);
  const glowOpacity  = useSharedValue(0);
  const titleY       = useSharedValue(32);
  const titleOpacity = useSharedValue(0);
  const subOpacity   = useSharedValue(0);
  const dividerWidth = useSharedValue(0);
  const titleScale   = useSharedValue(0.88);

  useEffect(() => {
    // Logo dramatic entrance
    logoOpacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    logoScale.value   = withSpring(1, { damping: 10, stiffness: 90, overshootClamping: false });

    // Glow breathes
    glowOpacity.value = withDelay(200,
      withRepeat(
        withSequence(
          withTiming(1,    { duration: 550 }),
          withTiming(0.35, { duration: 550 }),
        ), -1, true,
      ),
    );

    // Title rises + scales
    titleY.value       = withDelay(330, withSpring(0,    { damping: 16, stiffness: 120 }));
    titleOpacity.value = withDelay(330, withTiming(1,    { duration: 260 }));
    titleScale.value   = withDelay(330, withSpring(1,    { damping: 16, stiffness: 120 }));

    // Divider expands
    dividerWidth.value = withDelay(450, withTiming(80,   { duration: 350, easing: Easing.out(Easing.cubic) }));

    // Subtitle
    subOpacity.value   = withDelay(530, withTiming(1,    { duration: 260 }));

    // Exit — total ~1.5s
    exitOpacity.value  = withDelay(1100, withTiming(0, { duration: 380 }, (done) => {
      if (done) runOnJS(onDone)();
    }));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: exitOpacity.value }));
  const logoStyle      = useAnimatedStyle(() => ({
    opacity:   logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const glowStyle      = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const titleStyle     = useAnimatedStyle(() => ({
    opacity:   titleOpacity.value,
    transform: [{ translateY: titleY.value }, { scale: titleScale.value }],
  }));
  const divStyle       = useAnimatedStyle(() => ({ width: dividerWidth.value }));
  const subStyle       = useAnimatedStyle(() => ({ opacity: subOpacity.value }));

  return (
    <Animated.View style={[sp.container, containerStyle]}>
      <LinearGradient
        colors={["#040110", "#07031A", "#050F20"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Nebula blobs */}
      <View style={sp.nebula1} />
      <View style={sp.nebula2} />

      {/* Stars */}
      {STARS.map((s, i) => <SplashStar key={i} {...s} />)}

      {/* Shooting stars */}
      <ShootingStar delay={350} yRatio={0.18} />
      <ShootingStar delay={720} yRatio={0.32} />
      <ShootingStar delay={980} yRatio={0.12} />

      {/* Logo area */}
      <View style={sp.logoArea}>

        {/* Light rays behind everything */}
        <LightRays glowOp={glowOpacity} />

        {/* 3 orbit rings */}
        <OrbitRing r={140} speed={12000} reverse />
        <OrbitRing r={110} speed={5000}  dashed />
        <OrbitRing r={82}  speed={3000} />

        {/* Glow layers */}
        <Animated.View style={[sp.glowOuter, glowStyle]} />
        <Animated.View style={[sp.glowMid,   glowStyle]} />
        <Animated.View style={[sp.glowInner, glowStyle]} />

        {/* Burst particles (fire at 160ms when logo is mostly visible) */}
        {BURST.map((b, i) => (
          <BurstParticle key={i} {...b} fireAt={160} />
        ))}

        {/* Logo — circular clip */}
        <Animated.View style={[sp.logoClip, logoStyle]}>
          <Image
            source={require("@/assets/images/tengri-logo.png")}
            style={sp.logo}
            resizeMode="cover"
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
    backgroundColor: "#040110",
  },
  nebula1: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "rgba(80,30,160,0.07)",
    top: -60,
    left: -80,
  },
  nebula2: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(212,175,55,0.05)",
    bottom: 40,
    right: -60,
  },
  logoArea: {
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  glowOuter: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  glowMid: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(212,175,55,0.20)",
  },
  glowInner: {
    position: "absolute",
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "rgba(212,175,55,0.16)",
  },
  logoClip: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
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
