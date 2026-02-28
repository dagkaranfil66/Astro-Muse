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
  Linking,
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
  withSpring,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";
import { useLang } from "@/context/LanguageContext";

type Mode = "login" | "register";

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
            style={[
              styles.orbDot,
              {
                transform: [
                  { rotate: `${deg}deg` },
                  { translateX: 44 },
                ],
              },
            ]}
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
  const { t, lang } = useLang();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) {
      setError(lang === "tr" ? "E-posta ve şifre gerekli" : "Email and password required");
      return;
    }
    if (mode === "register" && !name) {
      setError(lang === "tr" ? "İsim gerekli" : "Name required");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const userData = { email, name: name || email.split("@")[0], mode };
      await AsyncStorage.setItem("tengri_user", JSON.stringify(userData));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      setError(lang === "tr" ? "Bir hata oluştu" : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#08051A", "#070D1A", "#0D0820"]}
        style={StyleSheet.absoluteFill}
      />

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
          <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </Pressable>

          <MysticOrb />

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.titleBlock}>
            <Text style={styles.title}>
              {mode === "login"
                ? lang === "tr" ? "Hoş Geldiniz" : "Welcome Back"
                : lang === "tr" ? "Hesap Oluştur" : "Create Account"}
            </Text>
            <Text style={styles.subtitle}>
              {lang === "tr"
                ? "Tengri mistik yolculuğunuz başlıyor"
                : "Your mystic journey begins"}
            </Text>
          </Animated.View>

          {/* Mode Toggle */}
          <Animated.View entering={FadeInDown.delay(250)} style={styles.modeToggle}>
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
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.form}>
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

            {!!error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <Pressable
              onPress={handleSubmit}
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

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{lang === "tr" ? "veya" : "or"}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* App Store Links */}
            <View style={styles.storeRow}>
              <Pressable
                onPress={() => Linking.openURL("https://apps.apple.com/app/tengri")}
                style={styles.storeBtn}
              >
                <Ionicons name="logo-apple" size={20} color={Colors.text} />
                <Text style={styles.storeBtnText}>App Store</Text>
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL("https://play.google.com/store/apps/tengri")}
                style={styles.storeBtn}
              >
                <Ionicons name="logo-google-playstore" size={20} color={Colors.text} />
                <Text style={styles.storeBtnText}>Google Play</Text>
              </Pressable>
            </View>

            <Text style={styles.legalNote}>
              {lang === "tr"
                ? "tengristar.com • Gizlilik Politikası • Kullanım Koşulları"
                : "tengristar.com • Privacy Policy • Terms of Use"}
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 24 },
  closeBtn: { alignSelf: "flex-end", width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  orbContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 130,
    marginVertical: 16,
  },
  orbGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.gold,
    opacity: 0.12,
  },
  orbRing: {
    position: "absolute",
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  orbDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
    opacity: 0.6,
  },
  orbCenter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    alignItems: "center",
    justifyContent: "center",
  },

  titleBlock: { alignItems: "center", marginBottom: 24, gap: 6 },
  title: {
    fontSize: 26,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.textSecondary,
    textAlign: "center",
  },

  modeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modeBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 9 },
  modeBtnActive: { backgroundColor: Colors.gold + "20" },
  modeBtnText: {
    fontSize: 13,
    fontFamily: "Lora_700Bold",
    color: Colors.textDim,
    letterSpacing: 0.2,
  },
  modeBtnTextActive: { color: Colors.gold },

  form: { gap: 12 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    height: 48,
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

  submitBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  submitBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: "Lora_700Bold",
    color: Colors.background,
    letterSpacing: 0.2,
  },

  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.cardBorder },
  dividerText: { fontSize: 12, color: Colors.textDim, fontFamily: "Lora_400Regular" },

  storeRow: { flexDirection: "row", gap: 12 },
  storeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surface,
  },
  storeBtnText: { fontSize: 13, fontFamily: "Lora_400Regular", color: Colors.text },

  legalNote: {
    fontSize: 10,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
  },
});
