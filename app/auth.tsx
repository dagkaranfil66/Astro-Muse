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
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";
import { useLang } from "@/context/LanguageContext";
import { useApp } from "@/context/AppContext";

type AuthView = "choice" | "email" | "social";

function MysticOrb() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);
  const rotate = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 2500 }), withTiming(1, { duration: 2500 })),
      -1, false
    );
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 2000 }), withTiming(0.4, { duration: 2000 })),
      -1, false
    );
    rotate.value = withRepeat(withTiming(360, { duration: 8000 }), -1, false);
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <View style={styles.orbContainer}>
      <Animated.View style={[styles.orbGlow, orbStyle]} />
      <Animated.View style={[styles.orbRing, ringStyle]}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
          <View
            key={i}
            style={[styles.orbDot, { transform: [{ rotate: `${deg}deg` }, { translateX: 44 }] }]}
          />
        ))}
      </Animated.View>
      <View style={styles.orbCenter}>
        <Ionicons name="moon-outline" size={32} color={Colors.gold} />
      </View>
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
  const [socialName, setSocialName] = useState("");
  const [socialEmail, setSocialEmail] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<{ label: string; icon: string; color: string; id: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSocialSelect = (provider: { label: string; icon: string; color: string; id: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProvider(provider);
    setSocialName("");
    setSocialEmail("");
    setError("");
    setView("social");
  };

  const handleSocialConfirm = async () => {
    if (!socialName.trim()) {
      setError(lang === "tr" ? "Lütfen adınızı girin" : "Please enter your name");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const finalEmail = socialEmail.trim() || `${selectedProvider!.id}_${Date.now()}@tengri.social`;
      const userData = { email: finalEmail, name: socialName.trim() };
      await AsyncStorage.setItem("tengri_user", JSON.stringify(userData));
      await setUserProfile({ name: socialName.trim(), email: finalEmail, joinDate: new Date().toISOString() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      setError(lang === "tr" ? "Bir hata oluştu" : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

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
      const userName = name || email.split("@")[0];
      await AsyncStorage.setItem("tengri_user", JSON.stringify({ email, name: userName }));
      await setUserProfile({ name: userName, email, joinDate: new Date().toISOString() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      setError(lang === "tr" ? "Bir hata oluştu" : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const SOCIAL_PROVIDERS = [
    {
      label: lang === "tr" ? "Google ile giriş yap" : "Continue with Google",
      icon: "logo-google" as const,
      color: "#DB4437",
      id: "google",
    },
    {
      label: lang === "tr" ? "Facebook ile giriş yap" : "Continue with Facebook",
      icon: "logo-facebook" as const,
      color: "#1877F2",
      id: "facebook",
    },
    {
      label: lang === "tr" ? "Apple ile giriş yap" : "Continue with Apple",
      icon: "logo-apple" as const,
      color: Colors.text,
      id: "apple",
    },
    {
      label: lang === "tr" ? "E-posta ile giriş yap" : "Continue with Email",
      icon: "mail-outline" as const,
      color: Colors.gold,
      id: "email",
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#08051A", "#070D1A", "#0D0820"]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: botPad + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => {
              if (view === "email" || view === "social") {
                setView("choice");
                setError("");
              } else {
                router.back();
              }
            }}
            style={styles.closeBtn} hitSlop={12}
          >
            <Ionicons name={(view === "email" || view === "social") ? "chevron-back" : "close"} size={22} color={Colors.textSecondary} />
          </Pressable>

          <MysticOrb />

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.titleBlock}>
            <Text style={styles.title}>
              {lang === "tr" ? "Tengri'ye Hoş Geldiniz" : "Welcome to Tengri"}
            </Text>
            <Text style={styles.subtitle}>
              {lang === "tr" ? "Mistik yolculuğunuz başlıyor" : "Your mystic journey begins"}
            </Text>
          </Animated.View>

          {view === "social" && selectedProvider && (
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.form}>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={[styles.socialIconCircle, { backgroundColor: selectedProvider.color + "25", borderColor: selectedProvider.color + "60", width: 56, height: 56, borderRadius: 28, marginBottom: 12 }]}>
                  <Ionicons name={selectedProvider.icon as any} size={28} color={selectedProvider.color} />
                </View>
                <Text style={[styles.submitBtnText, { color: Colors.text, fontSize: 16, fontFamily: "Lora_400Regular" }]}>
                  {lang === "tr" ? `${selectedProvider.id.charAt(0).toUpperCase() + selectedProvider.id.slice(1)} ile devam ediyorsunuz` : `Continuing with ${selectedProvider.id.charAt(0).toUpperCase() + selectedProvider.id.slice(1)}`}
                </Text>
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={socialName}
                  onChangeText={setSocialName}
                  placeholder={lang === "tr" ? "Adınız Soyadınız" : "Your Full Name"}
                  placeholderTextColor={Colors.textDim}
                  autoCapitalize="words"
                  autoFocus
                />
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={socialEmail}
                  onChangeText={setSocialEmail}
                  placeholder={lang === "tr" ? "E-posta (isteğe bağlı)" : "Email (optional)"}
                  placeholderTextColor={Colors.textDim}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable
                onPress={handleSocialConfirm}
                disabled={loading}
                style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient
                  colors={[Colors.goldLight, Colors.gold]}
                  style={styles.submitBtnInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="sparkles" size={18} color={Colors.background} />
                  <Text style={styles.submitBtnText}>
                    {loading ? (lang === "tr" ? "Yükleniyor..." : "Loading...") : (lang === "tr" ? "Devam Et" : "Continue")}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {view === "choice" && (
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.socialBlock}>
              {SOCIAL_PROVIDERS.map((p, i) => (
                <Animated.View key={p.id} entering={FadeInDown.delay(320 + i * 60).springify()}>
                  <Pressable
                    onPress={() => {
                      if (p.id === "email") {
                        setView("email");
                      } else {
                        handleSocialSelect(p);
                      }
                    }}
                    disabled={loading}
                    style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={styles.socialBtnLabel}>{p.label}</Text>
                    <View style={[styles.socialIconCircle, { backgroundColor: p.color + "20", borderColor: p.color + "40" }]}>
                      <Ionicons name={p.icon} size={22} color={p.color} />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}

              <Text style={styles.legalNote}>
                {lang === "tr"
                  ? "Devam ederek Gizlilik Politikası ve Kullanım Koşullarını kabul etmiş olursunuz."
                  : "By continuing you accept our Privacy Policy and Terms of Use."}
              </Text>
            </Animated.View>
          )}

          {view === "email" && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.form}>
              <View style={styles.modeToggle}>
                <Pressable
                  onPress={() => setMode("login")}
                  style={[styles.modeBtn, mode === "login" && styles.modeBtnActive]}
                >
                  <Text style={[styles.modeBtnText, mode === "login" && styles.modeBtnTextActive]}>
                    {lang === "tr" ? "Giriş Yap" : "Login"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setMode("register")}
                  style={[styles.modeBtn, mode === "register" && styles.modeBtnActive]}
                >
                  <Text style={[styles.modeBtnText, mode === "register" && styles.modeBtnTextActive]}>
                    {lang === "tr" ? "Kayıt Ol" : "Register"}
                  </Text>
                </Pressable>
              </View>

              {mode === "register" && (
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder={lang === "tr" ? "Adınız" : "Your Name"}
                    placeholderTextColor={Colors.textDim}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={lang === "tr" ? "E-posta adresiniz" : "Email address"}
                  placeholderTextColor={Colors.textDim}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={lang === "tr" ? "Şifreniz" : "Password"}
                  placeholderTextColor={Colors.textDim}
                  secureTextEntry
                />
              </View>

              {mode === "register" && (
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={lang === "tr" ? "Şifrenizi tekrar girin" : "Confirm Password"}
                    placeholderTextColor={Colors.textDim}
                    secureTextEntry
                  />
                </View>
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
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
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
    width: 120, height: 120,
    alignItems: "center", justifyContent: "center",
    marginTop: 24, marginBottom: 8,
  },
  orbGlow: {
    position: "absolute",
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: Colors.gold,
    opacity: 0.15,
  },
  orbRing: {
    position: "absolute",
    width: 100, height: 100,
    alignItems: "center", justifyContent: "center",
  },
  orbDot: {
    position: "absolute",
    width: 5, height: 5,
    borderRadius: 3,
    backgroundColor: Colors.gold,
    opacity: 0.6,
  },
  orbCenter: {
    width: 60, height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    alignItems: "center", justifyContent: "center",
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
    fontFamily: "Lora_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
  },

  socialBlock: { width: "100%", gap: 12 },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  socialBtnLabel: {
    fontSize: 16,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
    flex: 1,
  },
  socialIconCircle: {
    width: 42, height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },

  legalNote: {
    fontSize: 10,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
    textAlign: "center",
    lineHeight: 15,
    marginTop: 12,
    paddingHorizontal: 16,
  },

  form: { width: "100%", gap: 12 },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 4,
  },
  modeBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 9 },
  modeBtnActive: { backgroundColor: Colors.gold },
  modeBtnText: { fontSize: 13, fontFamily: "Lora_700Bold", color: Colors.textDim },
  modeBtnTextActive: { color: Colors.background },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Lora_400Regular",
  },

  errorText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    color: "#FF6B6B",
    textAlign: "center",
  },

  submitBtn: { marginTop: 4 },
  submitBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
  },
  submitBtnText: { fontSize: 15, fontFamily: "Lora_700Bold", color: Colors.background },
});
