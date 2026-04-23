import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as AuthSession from "expo-auth-session";
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";
import { useLang } from "@/context/LanguageContext";
import { useApp } from "@/context/AppContext";
import { getApiUrl } from "@/lib/query-client";
import { firebaseAppleSignIn, firebaseGoogleSignIn, firebaseGoogleSignInRedirect, firebaseGoogleSignInPopup, firebaseGoogleSignInImplicit, consumeGoogleImplicitResult, getGoogleRedirectResult } from "@/lib/firebase";

WebBrowser.maybeCompleteAuthSession();

const APPLE_USER_KEY = "tengri_apple_uid";

// ── Animated orb ──────────────────────────────────────────────────────────
function TengriWelcomeOrb() {
  const glowPhase  = useSharedValue(0);
  const ring1Rot   = useSharedValue(0);
  const ring2Rot   = useSharedValue(0);
  const ring3Rot   = useSharedValue(0);
  const logoBreath = useSharedValue(1);

  React.useEffect(() => {
    glowPhase.value  = withRepeat(withSequence(withTiming(1, { duration: 3000 }), withTiming(0, { duration: 3000 })), -1, false);
    ring1Rot.value   = withRepeat(withTiming(360,  { duration: 24000, easing: Easing.linear }), -1, false);
    ring2Rot.value   = withRepeat(withTiming(-360, { duration: 16000, easing: Easing.linear }), -1, false);
    ring3Rot.value   = withRepeat(withTiming(360,  { duration: 10000, easing: Easing.linear }), -1, false);
    logoBreath.value = withRepeat(
      withSequence(
        withTiming(1.07, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1,    { duration: 3500, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    );
  }, []);

  const glowStyle  = useAnimatedStyle(() => ({
    opacity: 0.10 + glowPhase.value * 0.22,
    backgroundColor: interpolateColor(glowPhase.value, [0, 1], ["#2A0A5E", "#5B2D9E"]),
    transform: [{ scale: 1 + glowPhase.value * 0.18 }],
  }));
  const r1Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${ring1Rot.value}deg` }] }));
  const r2Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${ring2Rot.value}deg` }] }));
  const r3Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${ring3Rot.value}deg` }] }));
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: logoBreath.value }] }));

  const makeRing = (radius: number, count: number, color: string, big: boolean) => {
    const size = radius * 2 + 12;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI;
      return (
        <Text key={i} style={{
          position: "absolute",
          fontSize: big && i % 3 === 0 ? 10 : 7,
          color,
          opacity: big && i % 3 === 0 ? 1 : 0.5,
          left: size / 2 + Math.cos(angle) * radius - (big && i % 3 === 0 ? 5 : 3.5),
          top:  size / 2 + Math.sin(angle) * radius - (big && i % 3 === 0 ? 5 : 3.5),
        }}>✦</Text>
      );
    });
  };

  const R1 = 88, R2 = 68, R3 = 50;

  return (
    <View style={styles.orbContainer}>
      <Animated.View style={[styles.orbGlow, glowStyle]} />
      <Animated.View style={[{ position: "absolute", width: R1*2+12, height: R1*2+12, alignItems: "center", justifyContent: "center" }, r1Style]}>
        {makeRing(R1, 16, Colors.gold, true)}
      </Animated.View>
      <Animated.View style={[{ position: "absolute", width: R2*2+12, height: R2*2+12, alignItems: "center", justifyContent: "center" }, r2Style]}>
        {makeRing(R2, 12, "#1ABFB8", false)}
      </Animated.View>
      <Animated.View style={[{ position: "absolute", width: R3*2+12, height: R3*2+12, alignItems: "center", justifyContent: "center" }, r3Style]}>
        {makeRing(R3, 8, "#9B59B6", false)}
      </Animated.View>
      <Animated.View style={[styles.orbCenter, logoStyle]}>
        <Image
          source={require("@/assets/images/tengri-logo.png")}
          style={{ width: 88, height: 88, borderRadius: 44 }}
          resizeMode="cover"
        />
      </Animated.View>
    </View>
  );
}

// ── Legal note with tappable links ───────────────────────────────────────
function LegalNote({ lang }: { lang: string }) {
  if (lang === "tr") {
    return (
      <Text style={styles.legalNote}>
        {"Devam ederek "}
        <Text style={styles.legalLink} onPress={() => router.push("/legal?doc=privacy" as any)}>
          Gizlilik Politikası
        </Text>
        {" ve "}
        <Text style={styles.legalLink} onPress={() => router.push("/legal?doc=terms" as any)}>
          Kullanım Koşulları
        </Text>
        {"'nı kabul etmiş olursunuz."}
      </Text>
    );
  }
  return (
    <Text style={styles.legalNote}>
      {"By continuing you accept our "}
      <Text style={styles.legalLink} onPress={() => router.push("/legal?doc=privacy" as any)}>
        Privacy Policy
      </Text>
      {" and "}
      <Text style={styles.legalLink} onPress={() => router.push("/legal?doc=terms" as any)}>
        Terms of Use
      </Text>
      {"."}
    </Text>
  );
}

// ── Official Google "G" SVG Logo ──────────────────────────────────────────
function GoogleGLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

// ── Android Google button — OAuth flow via expo-auth-session/providers/google
// Hook is called at the top level of this dedicated component (not conditionally)
// which is what prevented the "Invalid hook call" crash before.
type AndroidGoogleButtonProps = {
  lang:      string;
  onSuccess: (displayName: string, email: string) => void;
  onError:   (msg: string) => void;
};

// SDK 54: redirectUri'yi GEÇMİYORUZ — expo-auth-session/providers/google
// kendi otomatik türetir (Android için com.googleusercontent.apps.X:/oauth2redirect,
// iOS için bundleId:/oauth2redirect). useProxy SDK 51+ ile kaldırıldı.
function AndroidGoogleButton({ lang, onSuccess, onError }: AndroidGoogleButtonProps) {
  const [loading, setLoading] = useState(false);

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  const [request, response, promptAsync] = useIdTokenAuthRequest({
    webClientId,
    androidClientId,
    iosClientId,
  });

  useEffect(() => {
    console.log("=== [Google OAuth] CONFIG ===");
    console.log("[Google OAuth] ANDROID_CLIENT_ID:", androidClientId ? androidClientId.slice(0, 30) + "..." : "⚠️ YOK");
    console.log("[Google OAuth] WEB_CLIENT_ID:", webClientId ?? "⚠️ YOK — EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID eksik");
    console.log("[Google OAuth] request ready:", !!request);
    if (request) {
      const url = (request as any)?.url ?? "";
      const clientParam   = url.match(/client_id=([^&]+)/)?.[1];
      const redirectParam = url.match(/redirect_uri=([^&]+)/)?.[1];
      console.log("[Google OAuth] OAuth client_id   :", clientParam   ? decodeURIComponent(clientParam)   : "bulunamadı");
      console.log("[Google OAuth] OAuth redirect_uri :", redirectParam ? decodeURIComponent(redirectParam) : "bulunamadı");
    }
  }, [request]);

  useEffect(() => {
    if (!response) return;

    console.log("[Google OAuth] ── RESPONSE ──");
    console.log("[Google OAuth] type:", response.type);
    console.log("[Google OAuth] full response:", JSON.stringify(response, null, 2));

    if (response.type === "success") {
      const params      = (response as any).params ?? {};
      const idToken     = response.authentication?.idToken     ?? params.id_token     ?? null;
      const accessToken = response.authentication?.accessToken ?? params.access_token ?? null;

      console.log("[Google OAuth] idToken present:", !!idToken);
      console.log("[Google OAuth] accessToken present:", !!accessToken);
      console.log("[Google OAuth] params keys:", Object.keys(params));

      (async () => {
        try {
          if (!idToken) {
            console.error("[Google OAuth] ❌ idToken yok! Dönen params:", JSON.stringify(params));
            throw new Error("No id_token in OAuth response");
          }

          console.log("[Google OAuth] Firebase signInWithCredential başlatılıyor...");
          const user = await firebaseGoogleSignIn(idToken, accessToken);

          if (!user) {
            console.error("[Google OAuth] ❌ Firebase null user döndürdü");
            throw new Error("Firebase sign-in returned null user");
          }

          const displayName = user.displayName ?? (lang === "tr" ? "Tengri Kullanıcısı" : "Tengri User");
          const email       = user.email       ?? `google_${Date.now()}@tengri.social`;
          console.log("[Google OAuth] ✅ Giriş başarılı:", email);
          onSuccess(displayName, email);
        } catch (err: any) {
          console.error("[Google OAuth] ❌ HATA kodu:", err?.code);
          console.error("[Google OAuth] ❌ HATA mesajı:", err?.message);
          const msg =
            err?.code === "auth/network-request-failed"
              ? (lang === "tr" ? "Ağ hatası. İnternet bağlantınızı kontrol edin." : "Network error. Check your connection.")
            : err?.code === "auth/invalid-credential"
              ? (lang === "tr" ? "Geçersiz kimlik bilgisi. Lütfen tekrar deneyin." : "Invalid credential. Please try again.")
            : err?.code === "auth/api-key-not-valid"
              ? (lang === "tr" ? "Firebase yapılandırma hatası. Geliştiriciyle iletişime geçin." : "Firebase config error. Contact developer.")
            : (lang === "tr"
                ? "Google ile giriş başarısız: " + (err?.code ?? err?.message ?? "Bilinmeyen hata")
                : "Google sign-in failed: " + (err?.code ?? err?.message ?? "Unknown error"));
          onError(msg);
        } finally {
          setLoading(false);
        }
      })();

    } else if (response.type === "error") {
      console.error("[Google OAuth] ❌ OAuth hata:", JSON.stringify(response.error));
      console.error("[Google OAuth] ❌ Olası neden: Google Console'da bu redirectUri izinli değil.");
      console.error("[Google OAuth] ❌ Olası neden 2: app.json'a Android Client URL scheme intent filter eklenmemiş.");
      setLoading(false);
      const errCode = (response.error as any)?.code ?? "";
      const errMsg  = (response.error as any)?.message ?? errCode;
      onError(lang === "tr"
        ? "Google girişi başarısız: " + errMsg
        : "Google sign-in failed: " + errMsg);

    } else {
      console.log("[Google OAuth] İptal edildi / kapatıldı:", response.type);
      setLoading(false);
    }
  }, [response]);

  const handlePress = () => {
    console.log("[Google OAuth] ── BUTTON PRESS ──");
    console.log("[Google OAuth] request hazır mı:", !!request);
    console.log("[Google OAuth] redirectUri (auto from android client):", (request as any)?.redirectUri ?? "(none)");

    if (!request) {
      console.warn("[Google OAuth] ⚠️ request null — EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID eksik olabilir");
      console.warn("[Google OAuth] webClientId:", webClientId ? (webClientId.slice(0, 30) + "...") : "YOK");
      onError(lang === "tr"
        ? "Google girişi yapılandırılmamış. Geliştiriciyle iletişime geçin."
        : "Google sign-in not configured.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    // Redirect URI zaten makeRedirectUri({ useProxy: true }) ile oluşturuldu
    promptAsync().then((result) => {
      console.log("[Google OAuth] promptAsync sonucu:", result?.type);
    }).catch((err) => {
      console.error("[Google OAuth] promptAsync hatası:", err?.message ?? err);
      setLoading(false);
      onError(lang === "tr" ? "Google girişi açılamadı." : "Could not open Google sign-in.");
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.88 }]}
    >
      <View style={styles.googleLogoWrap}>
        <GoogleGLogo size={20} />
      </View>
      <Text style={styles.googleBtnText}>
        {loading
          ? (lang === "tr" ? "Bekleniyor..." : "Please wait...")
          : (lang === "tr" ? "Google ile Giriş Yap" : "Continue with Google")}
      </Text>
    </Pressable>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────
export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { lang, toggleLang } = useLang();
  const { setUserProfile } = useApp();

  const [view, setView]               = useState<"choice" | "email">("choice");
  const [mode, setMode]               = useState<"login" | "register">("login");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [name, setName]               = useState("");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [showPass, setShowPass]       = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [googleWebLoading, setGoogleWebLoading] = useState(false);

  // If we land on /auth with #id_token=... in the URL we are completing a
  // Google OAuth redirect — hide the auth UI immediately to avoid a flash
  // of the login screen before navigating to home.
  const [oauthReturning, setOauthReturning] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return /[#&]id_token=/i.test(window.location.hash || "");
  });

  // ── Web: Pick up Google sign-in result on mount ───────────────────────
  // Handles both: (1) implicit OAuth flow returning #id_token=... in the URL
  // hash, and (2) the legacy Firebase signInWithRedirect result.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    (async () => {
      try {
        // 1) Implicit OAuth (works in WebViews like Median Android APK)
        const implicit = await consumeGoogleImplicitResult();
        if (implicit) {
          await finishLogin(implicit.name || (lang === "tr" ? "Tengri Kullanıcısı" : "Tengri User"), implicit.email, "google");
          return;
        }
        // 2) Firebase legacy redirect handler (regular browsers)
        const result = await getGoogleRedirectResult();
        if (result) {
          await finishLogin(result.name || (lang === "tr" ? "Tengri Kullanıcısı" : "Tengri User"), result.email, "google");
          return;
        }
        // No pending OAuth result → reveal the auth UI again.
        setOauthReturning(false);
      } catch (e: any) {
        const code = e?.code ?? "";
        const msg  = e?.message ?? String(e);
        console.error("[Web Google] sign-in error:", code, msg);
        setError(
          (lang === "tr" ? "Google girişi başarısız: " : "Google sign-in failed: ") +
          (code || msg || "unknown"),
        );
        setOauthReturning(false);
      }
    })();
  }, []);

  // ── Web: Start Google sign-in ─────────────────────────────────────────
  // We ALWAYS use OAuth implicit flow against accounts.google.com directly,
  // because Firebase's signInWithPopup / signInWithRedirect rely on the
  // tengri-astroloji.firebaseapp.com auth handler which is blocked inside
  // embedded WebViews (Median Android APK, Replit "Simulate on Android"
  // iframe, in-app browsers, etc.) and produces a 404 on accounts.google.com.
  // Implicit flow returns straight back to /auth#id_token=... which works in
  // every browser environment.
  const handleWebGoogleSignIn = async () => {
    if (Platform.OS !== "web") return;
    setGoogleWebLoading(true);
    setError("");
    firebaseGoogleSignInImplicit();
    // page will navigate away to accounts.google.com and come back to /auth#id_token=...
  };

  // ── Finish login ──────────────────────────────────────────────────────
  const finishLogin = async (
    displayName: string,
    providerEmail: string,
    provider: "email" | "apple" | "google" = "email",
    appleUserId?: string,
  ) => {
    try {
      await setUserProfile({
        name: displayName,
        email: providerEmail,
        joinDate: new Date().toISOString(),
        loginProvider: provider,
        appleUserId,
      });
    } catch (e) {
      console.warn("[finishLogin] setUserProfile error:", e);
    }
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    // On web, always do a full page reload so all providers re-initialize
    // with the freshly-stored profile from AsyncStorage. router.replace can
    // fail silently after an OAuth redirect (state lost across navigations).
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.replace("/");
      return;
    }
    setTimeout(() => {
      try {
        router.replace("/(tabs)");
      } catch (e) {
        console.warn("[finishLogin] router.replace error:", e);
      }
    }, 0);
  };

  // ── Apple Sign-In — iOS only ───────────────────────────────────────────
  const handleAppleSignIn = async () => {
    if (Platform.OS !== "ios") return;
    try {
      setAppleLoading(true);
      setError("");

      const rawNonce    = Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18);
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

      const credential  = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      const appleUserId = credential.user;
      let appleEmail    = credential.email ?? null;
      let appleName     = credential.fullName?.givenName
        ? `${credential.fullName.givenName}${credential.fullName.familyName ? " " + credential.fullName.familyName : ""}`.trim()
        : null;

      const cacheKey = `${APPLE_USER_KEY}_${appleUserId}`;
      const cached   = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const p = JSON.parse(cached);
        if (!appleEmail) appleEmail = p.email;
        if (!appleName)  appleName  = p.name;
      }

      const finalEmail = appleEmail ?? `apple.${appleUserId.slice(-10)}@privaterelay.appleid.com`;
      const finalName  = appleName  ?? (lang === "tr" ? "Tengri Kullanıcısı" : "Tengri User");

      await AsyncStorage.setItem(cacheKey, JSON.stringify({ email: finalEmail, name: finalName }));

      if (credential.identityToken) {
        await firebaseAppleSignIn(credential.identityToken, rawNonce);
      }

      await finishLogin(finalName, finalEmail, "apple", appleUserId);
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code === "ERR_REQUEST_CANCELED") return;
      setError(lang === "tr"
        ? "Apple ile giriş başarısız."
        : "Apple sign-in failed. Please try again.");
    } finally {
      setAppleLoading(false);
    }
  };

  // ── Email Sign-In ─────────────────────────────────────────────────────
  const handleEmailSubmit = async () => {
    setError("");
    if (!email || !password) {
      setError(lang === "tr" ? "E-posta ve şifre gerekli" : "Email and password required");
      return;
    }
    if (mode === "register" && !name) {
      setError(lang === "tr" ? "İsim gerekli" : "Name required");
      return;
    }
    if (mode === "register" && password !== confirmPass) {
      setError(lang === "tr" ? "Şifreler eşleşmiyor" : "Passwords do not match");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const base     = new URL("", getApiUrl()).toString().replace(/\/$/, "");
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body     = mode === "register"
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };
      const fullUrl = `${base}${endpoint}`;
      console.log("[Email Auth] POST →", fullUrl);
      const res  = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(body),
      });
      const rawText = await res.text();
      console.log("[Email Auth] status:", res.status, "body:", rawText.slice(0, 200));
      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        const preview = rawText.slice(0, 80).replace(/\s+/g, " ");
        setError(lang === "tr"
          ? `Sunucu yanıtı geçersiz (HTTP ${res.status}): ${preview || "boş yanıt"}`
          : `Invalid server response (HTTP ${res.status}): ${preview || "empty"}`);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || (lang === "tr" ? `İşlem başarısız (HTTP ${res.status})` : `Action failed (HTTP ${res.status})`));
        setLoading(false);
        return;
      }
      await finishLogin(data.user.name || (lang === "tr" ? "Tengri Kullanıcısı" : "Tengri User"), data.user.email, "email");
      setLoading(false);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      console.error("[Email Auth] fetch failed:", msg);
      setError(lang === "tr"
        ? `Ağ hatası: ${msg}`
        : `Network error: ${msg}`);
      setLoading(false);
    }
  };

  const goBack = () => {
    if (view === "email") { setView("choice"); setError(""); }
    else if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  // ── Render ────────────────────────────────────────────────────────────
  if (oauthReturning) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <LinearGradient colors={["#08051A", "#070D1A", "#0D0820"]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={Colors.gold} />
        <Text style={{ color: Colors.textSecondary, marginTop: 16, fontSize: 14 }}>
          {lang === "tr" ? "Giriş tamamlanıyor..." : "Completing sign-in..."}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.root}>
      <LinearGradient colors={["#08051A", "#070D1A", "#0D0820"]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPad + 12, paddingBottom: botPad + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top row: back/close + language toggle */}
          <View style={styles.topRow}>
            <Pressable onPress={goBack} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name={view === "email" ? "chevron-back" : "close"} size={22} color={Colors.textSecondary} />
            </Pressable>

            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleLang(); }}
              style={styles.langPill}
              hitSlop={12}
            >
              <Text style={[styles.langPillText, lang === "tr" && styles.langPillTextActive]}>TR</Text>
              <View style={styles.langPillDivider} />
              <Text style={[styles.langPillText, lang === "en" && styles.langPillTextActive]}>EN</Text>
            </Pressable>
          </View>

          <TengriWelcomeOrb />

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.titleBlock}>
            <Text style={styles.title}>{lang === "tr" ? "Tengri'ye Hoş Geldiniz" : "Welcome to Tengri"}</Text>
            <Text style={styles.subtitle}>{lang === "tr" ? "Gökyüzü sizi bekliyor" : "The sky awaits you"}</Text>
          </Animated.View>

          {/* ── CHOICE VIEW ────────────────────────────────────────────── */}
          {view === "choice" && (
            <Animated.View entering={FadeInDown.delay(260).springify()} style={styles.btnStack}>

              {/* 1. Apple — iOS only (custom button for Turkish locale support) */}
              {Platform.OS === "ios" && (
                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.btnRow}>
                  <Pressable
                    onPress={handleAppleSignIn}
                    disabled={appleLoading}
                    style={({ pressed }) => [styles.appleBtnCustom, pressed && { opacity: 0.85 }]}
                  >
                    <Ionicons name="logo-apple" size={20} color="#FFFFFF" style={{ marginRight: 8, marginTop: -2 }} />
                    <Text style={styles.appleBtnText}>
                      {lang === "tr" ? "Apple ile Giriş Yap" : "Sign in with Apple"}
                    </Text>
                  </Pressable>
                </Animated.View>
              )}

              {/* 2. Google — Android (expo-auth-session) */}
              {Platform.OS === "android" && (
                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.btnRow}>
                  <AndroidGoogleButton
                    lang={lang}
                    onSuccess={async (displayName, email) => {
                      setError("");
                      await finishLogin(displayName, email, "google");
                    }}
                    onError={(msg) => setError(msg)}
                  />
                </Animated.View>
              )}

              {/* 2b. Google — Web (uses popup in browsers, OAuth implicit
                  flow inside Median Android/iOS WebViews; both supported). */}
              {Platform.OS === "web" && (
                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.btnRow}>
                  <Pressable
                    onPress={handleWebGoogleSignIn}
                    disabled={googleWebLoading}
                    style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.88 }]}
                  >
                    <View style={styles.googleLogoWrap}>
                      <GoogleGLogo size={20} />
                    </View>
                    <Text style={styles.googleBtnText}>
                      {googleWebLoading
                        ? (lang === "tr" ? "Yönlendiriliyor..." : "Redirecting...")
                        : (lang === "tr" ? "Google ile Giriş Yap" : "Continue with Google")}
                    </Text>
                  </Pressable>
                </Animated.View>
              )}

              {/* 3. Email — all platforms */}
              <Animated.View entering={FadeInDown.delay(370).springify()} style={styles.btnRow}>
                <Pressable
                  onPress={() => { setView("email"); }}
                  style={({ pressed }) => [styles.emailBtn, pressed && { opacity: 0.88 }]}
                >
                  <Ionicons name="mail-outline" size={20} color={Colors.text} style={{ opacity: 0.7 }} />
                  <Text style={styles.emailBtnText}>
                    {lang === "tr" ? "E-posta ile Giriş Yap" : "Continue with Email"}
                  </Text>
                </Pressable>
              </Animated.View>

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <LegalNote lang={lang} />
            </Animated.View>
          )}

          {/* ── EMAIL VIEW ─────────────────────────────────────────────── */}
          {view === "email" && (
            <Animated.View entering={FadeIn.duration(280)} style={styles.form}>
              <View style={styles.modeToggle}>
                <Pressable onPress={() => setMode("login")} style={[styles.modeBtn, mode === "login" && styles.modeBtnActive]}>
                  <Text style={[styles.modeBtnText, mode === "login" && styles.modeBtnTextActive]}>
                    {lang === "tr" ? "Giriş Yap" : "Login"}
                  </Text>
                </Pressable>
                <Pressable onPress={() => setMode("register")} style={[styles.modeBtn, mode === "register" && styles.modeBtnActive]}>
                  <Text style={[styles.modeBtnText, mode === "register" && styles.modeBtnTextActive]}>
                    {lang === "tr" ? "Kayıt Ol" : "Register"}
                  </Text>
                </Pressable>
              </View>

              {mode === "register" && (
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color="#6B7FA8" style={styles.inputIcon} />
                  <TextInput style={styles.input} value={name} onChangeText={setName}
                    placeholder={lang === "tr" ? "Adınız" : "Your Name"}
                    placeholderTextColor="#6B7FA8" autoCapitalize="words" />
                </View>
              )}

              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="#6B7FA8" style={styles.inputIcon} />
                <TextInput style={styles.input} value={email} onChangeText={setEmail}
                  placeholder={lang === "tr" ? "E-posta adresiniz" : "Email address"}
                  placeholderTextColor="#6B7FA8" keyboardType="email-address"
                  autoCapitalize="none" autoCorrect={false} />
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#6B7FA8" style={styles.inputIcon} />
                <TextInput style={styles.input} value={password} onChangeText={setPassword}
                  placeholder={lang === "tr" ? "Şifreniz" : "Password"}
                  placeholderTextColor="#6B7FA8" secureTextEntry={!showPass}
                  returnKeyType={mode === "login" ? "done" : "next"}
                  onSubmitEditing={mode === "login" ? handleEmailSubmit : undefined} />
                <Pressable onPress={() => setShowPass(v => !v)} hitSlop={8} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color="#8898B8" />
                </Pressable>
              </View>

              {mode === "register" && (
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color="#6B7FA8" style={styles.inputIcon} />
                  <TextInput style={styles.input} value={confirmPass} onChangeText={setConfirmPass}
                    placeholder={lang === "tr" ? "Şifreyi tekrar girin" : "Confirm Password"}
                    placeholderTextColor="#6B7FA8" secureTextEntry={!showConfPass}
                    returnKeyType="done" onSubmitEditing={handleEmailSubmit} />
                  <Pressable onPress={() => setShowConfPass(v => !v)} hitSlop={8} style={styles.eyeBtn}>
                    <Ionicons name={showConfPass ? "eye-off-outline" : "eye-outline"} size={20} color="#8898B8" />
                  </Pressable>
                </View>
              )}

              {mode === "login" && (
                <Pressable onPress={() => router.push("/forgot-password")} style={styles.forgotBtn} hitSlop={8}>
                  <Text style={styles.forgotBtnText}>
                    {lang === "tr" ? "Şifremi unuttum" : "Forgot password?"}
                  </Text>
                </Pressable>
              )}

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable
                onPress={handleEmailSubmit}
                disabled={loading}
                style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient
                  colors={[Colors.goldLight, Colors.gold]}
                  style={styles.submitBtnInner}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="sparkles" size={18} color={Colors.background} />
                  <Text style={styles.submitBtnText}>
                    {loading
                      ? (lang === "tr" ? "Yükleniyor..." : "Loading...")
                      : mode === "login"
                        ? (lang === "tr" ? "Giriş Yap" : "Login")
                        : (lang === "tr" ? "Kayıt Ol" : "Register")}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 24, alignItems: "center" },

  topRow: {
    flexDirection: "row",
    alignSelf: "stretch",
    justifyContent: "space-between",
    alignItems: "center",
  },

  closeBtn: {
    width: 36, height: 36,
    alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  langPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 12,
    height: 36,
    gap: 6,
  },
  langPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  langPillTextActive: {
    color: Colors.gold,
  },
  langPillDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.cardBorder,
  },

  orbContainer: {
    width: 200, height: 200,
    alignItems: "center", justifyContent: "center",
    marginTop: 16, marginBottom: 4,
  },
  orbGlow: {
    position: "absolute",
    width: 160, height: 160,
    borderRadius: 80,
    backgroundColor: "#3D1A6E",
    opacity: 0.15,
  },
  orbCenter: {
    width: 88, height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.gold + "55",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },

  titleBlock: { alignItems: "center", marginBottom: 32, marginTop: 8 },
  title: {
    fontSize: 24,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Lora_400Regular_Italic",
    color: "#C8B47A",
    textAlign: "center",
    letterSpacing: 0.3,
  },

  btnStack: { width: "100%", gap: 14, alignItems: "center" },
  btnRow:   { width: "100%" },

  appleBtn: { width: "100%", height: 58, borderRadius: 14 },
  appleBtnCustom: {
    width: "100%",
    height: 58,
    borderRadius: 18,
    backgroundColor: "#000000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  appleBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  googleBtn: {
    width: "100%",
    height: 54,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  googleLogoWrap: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  googleBtnText: {
    fontSize: 16,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
    letterSpacing: 0.1,
  },

  emailBtn: {
    width: "100%",
    height: 54,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emailBtnText: {
    fontSize: 16,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
    letterSpacing: 0.1,
  },

  legalNote: {
    fontSize: 10,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
    textAlign: "center",
    lineHeight: 15,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  legalLink: {
    color: Colors.gold,
    textDecorationLine: "underline",
    fontFamily: "Lora_700Bold",
    fontSize: 10,
  },

  form: { width: "100%", gap: 12 },

  modeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
  },
  modeBtnActive:     { backgroundColor: Colors.gold + "20" },
  modeBtnText:       { fontSize: 13, fontFamily: "Lora_700Bold", color: Colors.textDim },
  modeBtnTextActive: { color: Colors.gold },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  inputIcon: { opacity: 0.7 },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Lora_400Regular",
  },
  eyeBtn: { padding: 4 },

  forgotBtn: { alignSelf: "flex-end" },
  forgotBtnText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.gold,
  },

  submitBtn:      { width: "100%", borderRadius: 16, overflow: "hidden" },
  submitBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: "Lora_700Bold",
    color: Colors.background,
  },

  errorText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    color: "#FF6B6B",
    textAlign: "center",
  },
});
