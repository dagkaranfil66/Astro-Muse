import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
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
import { firebaseAppleSignIn } from "@/lib/firebase";

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

// ── Android Google button — rendered only on Android ──────────────────────
type AndroidGoogleButtonProps = {
  lang: string;
  onPress: () => void;
};

function AndroidGoogleButton({ lang, onPress }: AndroidGoogleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.88 }]}
    >
      <Ionicons name="logo-google" size={20} color="#EA4335" />
      <Text style={styles.googleBtnText}>
        {lang === "tr" ? "Google ile Giriş Yap" : "Continue with Google"}
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

  // ── Finish login ──────────────────────────────────────────────────────
  const finishLogin = async (
    displayName: string,
    providerEmail: string,
    provider: "email" | "apple" | "google" = "email",
    appleUserId?: string,
  ) => {
    await setUserProfile({
      name: displayName,
      email: providerEmail,
      joinDate: new Date().toISOString(),
      loginProvider: provider,
      appleUserId,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
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
      const res  = await fetch(`${base}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (lang === "tr" ? "İşlem başarısız" : "Action failed"));
        setLoading(false);
        return;
      }
      await finishLogin(data.user.name || (lang === "tr" ? "Tengri Kullanıcısı" : "Tengri User"), data.user.email, "email");
      setLoading(false);
    } catch (e: any) {
      setError(lang === "tr" ? "Sunucuya bağlanılamadı" : "Could not reach server");
      setLoading(false);
    }
  };

  const goBack = () => {
    if (view === "email") { setView("choice"); setError(""); }
    else if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  // ── Render ────────────────────────────────────────────────────────────
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

              {/* 1. Apple — iOS only */}
              {Platform.OS === "ios" && (
                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.btnRow}>
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={18}
                    style={styles.appleBtn}
                    onPress={handleAppleSignIn}
                  />
                </Animated.View>
              )}

              {/* 2. Google — Android only */}
              {Platform.OS === "android" && (
                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.btnRow}>
                  <AndroidGoogleButton
                    lang={lang}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setView("email");
                    }}
                  />
                </Animated.View>
              )}

              {/* 3. Email — all platforms */}
              <Animated.View entering={FadeInDown.delay(370).springify()} style={styles.btnRow}>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setView("email"); }}
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
