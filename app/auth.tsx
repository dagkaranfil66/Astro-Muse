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
  Alert,
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
  ZoomIn,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";
import { useLang } from "@/context/LanguageContext";
import { useApp } from "@/context/AppContext";
import { getApiUrl } from "@/lib/query-client";
import { firebaseAppleSignIn } from "@/lib/firebase";

WebBrowser.maybeCompleteAuthSession();

type AuthView = "choice" | "email" | "social";

const APPLE_USER_KEY = "tengri_apple_uid";

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
    logoBreath.value = withRepeat(withSequence(withTiming(1.07, { duration: 3500, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.sin) })), -1, false);
  }, []);

  const glowStyle  = useAnimatedStyle(() => ({
    opacity: 0.10 + glowPhase.value * 0.22,
    backgroundColor: interpolateColor(glowPhase.value, [0, 1], ["#2A0A5E", "#5B2D9E"]),
    transform: [{ scale: 1 + glowPhase.value * 0.18 }],
  }));
  const ring1Style  = useAnimatedStyle(() => ({ transform: [{ rotate: `${ring1Rot.value}deg`  }] }));
  const ring2Style  = useAnimatedStyle(() => ({ transform: [{ rotate: `${ring2Rot.value}deg`  }] }));
  const ring3Style  = useAnimatedStyle(() => ({ transform: [{ rotate: `${ring3Rot.value}deg`  }] }));
  const logoStyle   = useAnimatedStyle(() => ({ transform: [{ scale: logoBreath.value }] }));

  const makeRing = (radius: number, count: number, color: string, big: boolean) =>
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI;
      const size  = radius * 2 + 12;
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

  const R1 = 88, R2 = 68, R3 = 50;

  return (
    <View style={styles.orbContainer}>
      <Animated.View style={[styles.orbGlow, glowStyle]} />
      <Animated.View style={[{ position: "absolute", width: R1 * 2 + 12, height: R1 * 2 + 12, alignItems: "center", justifyContent: "center" }, ring1Style]}>
        {makeRing(R1, 16, Colors.gold, true)}
      </Animated.View>
      <Animated.View style={[{ position: "absolute", width: R2 * 2 + 12, height: R2 * 2 + 12, alignItems: "center", justifyContent: "center" }, ring2Style]}>
        {makeRing(R2, 12, "#1ABFB8", false)}
      </Animated.View>
      <Animated.View style={[{ position: "absolute", width: R3 * 2 + 12, height: R3 * 2 + 12, alignItems: "center", justifyContent: "center" }, ring3Style]}>
        {makeRing(R3, 8, "#9B59B6", false)}
      </Animated.View>
      <Animated.View style={[styles.orbCenter, logoStyle]}>
        <Image
          source={require("@/assets/images/tengri-logo.png")}
          style={{ width: 72, height: 72 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { lang } = useLang();
  const { setUserProfile } = useApp();
  const [view, setView] = useState<AuthView>("choice");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  // ── Core login finish ─────────────────────────────────────────────────────
  const finishLogin = async (
    displayName: string,
    providerEmail: string,
    provider: "email" | "apple" = "email",
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

  // ── Apple Sign In ─────────────────────────────────────────────────────────
  const handleAppleSignIn = async () => {
    try {
      setAppleLoading(true);
      setError("");

      // Generate cryptographic nonce for Firebase
      const rawNonce = Math.random().toString(36).substring(2, 18) +
                       Math.random().toString(36).substring(2, 18);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      // Request Apple sign-in
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      const appleUserId = credential.user;

      // Retrieve name — Apple only provides it on FIRST sign-in
      let appleEmail  = credential.email ?? null;
      let appleName   = credential.fullName?.givenName
        ? `${credential.fullName.givenName}${credential.fullName.familyName ? " " + credential.fullName.familyName : ""}`.trim()
        : null;

      // On subsequent sign-ins Apple doesn't resend email/name → restore from cache
      const cacheKey  = `${APPLE_USER_KEY}_${appleUserId}`;
      const cached    = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (!appleEmail) appleEmail = parsed.email;
        if (!appleName)  appleName  = parsed.name;
      }

      // Build final email (support private relay)
      const finalEmail = appleEmail ?? `apple.${appleUserId.slice(-10)}@privaterelay.appleid.com`;
      const finalName  = appleName  ?? (lang === "tr" ? "Tengri Kullanıcısı" : "Tengri User");

      // Persist for next sign-in
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ email: finalEmail, name: finalName }));

      // Sign in with Firebase Auth (links Apple identity to Firebase)
      if (credential.identityToken) {
        await firebaseAppleSignIn(credential.identityToken, rawNonce);
      }

      await finishLogin(finalName, finalEmail, "apple", appleUserId);

    } catch (e: any) {
      if (e?.code === "ERR_REQUEST_CANCELED") {
        // User cancelled — not an error
        return;
      }
      console.warn("[Apple Sign In] Error:", e);
      setError(lang === "tr"
        ? "Apple ile giriş başarısız. Lütfen tekrar deneyin."
        : "Apple sign-in failed. Please try again.");
    } finally {
      setAppleLoading(false);
    }
  };

  // ── Email Sign In ─────────────────────────────────────────────────────────
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
    if (mode === "register" && password !== confirmPassword) {
      setError(lang === "tr" ? "Şifreler eşleşmiyor" : "Passwords do not match");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const apiBase = new URL("", getApiUrl()).toString().replace(/\/$/, "");
      if (mode === "register") {
        const res = await fetch(`${apiBase}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || (lang === "tr" ? "Kayıt başarısız" : "Registration failed"));
          setLoading(false);
          return;
        }
        await finishLogin(data.user.name, data.user.email, "email");
      } else {
        const res = await fetch(`${apiBase}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || (lang === "tr" ? "Giriş başarısız" : "Login failed"));
          setLoading(false);
          return;
        }
        await finishLogin(data.user.name, data.user.email, "email");
      }
    } catch {
      setError(lang === "tr" ? "Sunucuya bağlanılamadı" : "Could not reach server");
      setLoading(false);
    }
  };

  const goBack = () => {
    if (view === "email" || view === "social") {
      setView("choice");
      setError("");
    } else {
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)");
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#08051A", "#070D1A", "#0D0820"]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: botPad + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={goBack} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name={(view === "email" || view === "social") ? "chevron-back" : "close"} size={22} color={Colors.textSecondary} />
          </Pressable>

          <TengriWelcomeOrb />

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.titleBlock}>
            <Text style={styles.title}>
              {lang === "tr" ? "Tengri'ye Hoş Geldiniz" : "Welcome to Tengri"}
            </Text>
            <Text style={styles.subtitle}>
              {lang === "tr" ? "Gökyüzü sizi bekliyor" : "The sky awaits you"}
            </Text>
          </Animated.View>

          {/* ── CHOICE VIEW ─────────────────────────────────────────────── */}
          {view === "choice" && (
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.socialBlock}>

              {/* Apple Sign In — iOS only, must follow Apple HIG */}
              {Platform.OS === "ios" && (
                <Animated.View entering={FadeInDown.delay(320).springify()}>
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                    cornerRadius={16}
                    style={styles.appleBtn}
                    onPress={handleAppleSignIn}
                  />
                  {appleLoading && (
                    <Text style={styles.appleLoadingText}>
                      {lang === "tr" ? "Apple ile giriş yapılıyor..." : "Signing in with Apple..."}
                    </Text>
                  )}
                </Animated.View>
              )}

              {/* Divider */}
              {Platform.OS === "ios" && (
                <Animated.View entering={FadeInDown.delay(370).springify()} style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{lang === "tr" ? "veya" : "or"}</Text>
                  <View style={styles.dividerLine} />
                </Animated.View>
              )}

              {/* Email Login */}
              <Animated.View entering={FadeInDown.delay(400).springify()}>
                <Pressable
                  onPress={() => setView("email")}
                  disabled={loading}
                  style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.8 }]}
                >
                  <View style={[styles.socialIconCircle, { backgroundColor: Colors.gold + "20", borderColor: Colors.gold + "40" }]}>
                    <Ionicons name="mail-outline" size={22} color={Colors.gold} />
                  </View>
                  <Text style={styles.socialBtnLabel}>
                    {lang === "tr" ? "E-posta ile Devam Et" : "Continue with Email"}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
                </Pressable>
              </Animated.View>

              {!!error && (
                <Text style={styles.errorText}>{error}</Text>
              )}

              <Text style={styles.legalNote}>
                {lang === "tr"
                  ? "Devam ederek Gizlilik Politikası ve Kullanım Koşullarını kabul etmiş olursunuz."
                  : "By continuing you accept our Privacy Policy and Terms of Use."}
              </Text>
            </Animated.View>
          )}

          {/* ── EMAIL VIEW ──────────────────────────────────────────────── */}
          {view === "email" && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.form}>
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
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder={lang === "tr" ? "Adınız" : "Your Name"}
                    placeholderTextColor="#6B7FA8"
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="#6B7FA8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={lang === "tr" ? "E-posta adresiniz" : "Email address"}
                  placeholderTextColor="#6B7FA8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#6B7FA8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={lang === "tr" ? "Şifreniz" : "Password"}
                  placeholderTextColor="#6B7FA8"
                  secureTextEntry={!showPassword}
                  returnKeyType={mode === "login" ? "done" : "next"}
                  onSubmitEditing={mode === "login" ? handleEmailSubmit : undefined}
                />
                <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={8} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#8898B8" />
                </Pressable>
              </View>

              {mode === "register" && (
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color="#6B7FA8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={lang === "tr" ? "Şifrenizi tekrar girin" : "Confirm Password"}
                    placeholderTextColor="#6B7FA8"
                    secureTextEntry={!showConfirmPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleEmailSubmit}
                  />
                  <Pressable onPress={() => setShowConfirmPassword(v => !v)} hitSlop={8} style={styles.eyeBtn}>
                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#8898B8" />
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
                <LinearGradient colors={[Colors.goldLight, Colors.gold]} style={styles.submitBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
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
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 24, alignItems: "center" },

  closeBtn: {
    alignSelf: "flex-start",
    width: 36, height: 36,
    alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
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

  socialBlock: { width: "100%", gap: 12 },

  // Apple HIG-compliant button — must be exact dimensions
  appleBtn: {
    width: "100%",
    height: 52,
  },
  appleLoadingText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
    textAlign: "center",
    marginTop: 6,
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.cardBorder,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
  },

  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  socialBtnLabel: {
    fontSize: 15,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
    flex: 1,
  },
  socialIconCircle: {
    width: 40, height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },

  legalNote: {
    fontSize: 10,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
    textAlign: "center",
    lineHeight: 15,
    marginTop: 4,
    paddingHorizontal: 16,
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
  modeBtnActive: {
    backgroundColor: Colors.gold + "20",
  },
  modeBtnText: {
    fontSize: 13,
    fontFamily: "Lora_700Bold",
    color: Colors.textDim,
  },
  modeBtnTextActive: {
    color: Colors.gold,
  },

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

  submitBtn: { width: "100%", borderRadius: 16, overflow: "hidden" },
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
