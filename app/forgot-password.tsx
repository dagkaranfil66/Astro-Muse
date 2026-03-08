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
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useLang } from "@/context/LanguageContext";
import { getApiUrl } from "@/lib/query-client";

type Step = "email" | "code" | "success";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { lang } = useLang();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const apiBase = new URL("", getApiUrl()).toString().replace(/\/$/, "");

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError(lang === "tr" ? "E-posta gerekli" : "Email required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await fetch(`${apiBase}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("code");
    } catch {
      setError(lang === "tr" ? "Sunucuya bağlanılamadı" : "Could not reach server");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim() || !newPassword || !confirmPassword) {
      setError(lang === "tr" ? "Tüm alanları doldurun" : "Fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(lang === "tr" ? "Şifreler eşleşmiyor" : "Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError(lang === "tr" ? "Şifre en az 6 karakter olmalı" : "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (lang === "tr" ? "Sıfırlama başarısız" : "Reset failed"));
        setLoading(false);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("success");
    } catch {
      setError(lang === "tr" ? "Sunucuya bağlanılamadı" : "Could not reach server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#08051A", "#070D1A", "#0D0820"]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: botPad + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
          </Pressable>

          <View style={styles.orbContainer}>
            <View style={styles.orbGlow} />
            <View style={styles.orbCenter}>
              <Ionicons name="key-outline" size={32} color={Colors.gold} />
            </View>
          </View>

          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.titleBlock}>
            <Text style={styles.title}>
              {lang === "tr" ? "Şifremi Unuttum" : "Forgot Password"}
            </Text>
            <Text style={styles.subtitle}>
              {step === "email"
                ? (lang === "tr" ? "E-postanıza sıfırlama kodu gönderilecek" : "A reset code will be sent to your email")
                : step === "code"
                ? (lang === "tr" ? `${email} adresinize kod gönderildi` : `Code sent to ${email}`)
                : (lang === "tr" ? "Şifreniz başarıyla güncellendi" : "Your password has been updated")}
            </Text>
          </Animated.View>

          {step === "success" ? (
            <Animated.View entering={ZoomIn.springify()} style={styles.successBox}>
              <LinearGradient colors={["#0D2A1A", "#0A2010"]} style={styles.successInner}>
                <Text style={styles.successIcon}>✦</Text>
                <Text style={styles.successTitle}>
                  {lang === "tr" ? "Şifre Güncellendi!" : "Password Updated!"}
                </Text>
                <Text style={styles.successSub}>
                  {lang === "tr" ? "Yeni şifrenizle giriş yapabilirsiniz." : "You can now log in with your new password."}
                </Text>
                <Pressable
                  onPress={() => router.replace("/auth")}
                  style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
                >
                  <LinearGradient colors={[Colors.goldLight, Colors.gold]} style={styles.submitBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="log-in-outline" size={18} color={Colors.background} />
                    <Text style={styles.submitBtnText}>
                      {lang === "tr" ? "Giriş Yap" : "Login"}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          ) : step === "email" ? (
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.form}>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="#6B7FA8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(""); }}
                  placeholder={lang === "tr" ? "E-posta adresiniz" : "Your email address"}
                  placeholderTextColor="#6B7FA8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSendCode}
                />
              </View>

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable
                onPress={handleSendCode}
                disabled={loading}
                style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient colors={[Colors.goldLight, Colors.gold]} style={styles.submitBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="paper-plane-outline" size={18} color={Colors.background} />
                  <Text style={styles.submitBtnText}>
                    {loading ? (lang === "tr" ? "Gönderiliyor..." : "Sending...") : (lang === "tr" ? "Kod Gönder" : "Send Code")}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.form}>
              <Text style={styles.codeHint}>
                {lang === "tr" ? "E-postanızdaki 6 haneli kodu girin" : "Enter the 6-digit code from your email"}
              </Text>

              <View style={styles.inputWrap}>
                <Ionicons name="shield-checkmark-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  value={code}
                  onChangeText={(v) => { setCode(v); setError(""); }}
                  placeholder="000000"
                  placeholderTextColor={Colors.textDim}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#6B7FA8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={(v) => { setNewPassword(v); setError(""); }}
                  placeholder={lang === "tr" ? "Yeni şifre" : "New password"}
                  placeholderTextColor="#6B7FA8"
                  secureTextEntry={!showNewPassword}
                />
                <Pressable onPress={() => setShowNewPassword(v => !v)} hitSlop={8} style={styles.eyeBtn}>
                  <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#8898B8" />
                </Pressable>
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#6B7FA8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setError(""); }}
                  placeholder={lang === "tr" ? "Yeni şifreyi tekrar girin" : "Confirm new password"}
                  placeholderTextColor="#6B7FA8"
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
                <Pressable onPress={() => setShowConfirmPassword(v => !v)} hitSlop={8} style={styles.eyeBtn}>
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#8898B8" />
                </Pressable>
              </View>

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable
                onPress={handleResetPassword}
                disabled={loading}
                style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient colors={[Colors.goldLight, Colors.gold]} style={styles.submitBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="sparkles" size={18} color={Colors.background} />
                  <Text style={styles.submitBtnText}>
                    {loading ? (lang === "tr" ? "Güncelleniyor..." : "Updating...") : (lang === "tr" ? "Şifreyi Güncelle" : "Update Password")}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => { setStep("email"); setCode(""); setError(""); }} style={styles.resendBtn}>
                <Text style={styles.resendBtnText}>
                  {lang === "tr" ? "Kodu tekrar gönder" : "Resend code"}
                </Text>
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

  backBtn: {
    alignSelf: "flex-start",
    width: 36, height: 36,
    alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  orbContainer: {
    width: 100, height: 100,
    alignItems: "center", justifyContent: "center",
    marginTop: 28, marginBottom: 8,
  },
  orbGlow: {
    position: "absolute",
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gold,
    opacity: 0.1,
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
    fontSize: 22,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  form: { width: "100%", gap: 12 },

  codeHint: {
    fontSize: 13,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 4,
  },

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
    color: "#F0E8D0",
    fontSize: 15,
    fontFamily: "Lora_500Medium",
  },
  eyeBtn: { paddingLeft: 6, paddingBottom: 3 },
  codeInput: {
    fontSize: 24,
    letterSpacing: 8,
    fontFamily: "Lora_700Bold",
    textAlign: "center",
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

  resendBtn: { alignItems: "center", paddingVertical: 8 },
  resendBtnText: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
    color: Colors.gold,
    textDecorationLine: "underline",
  },

  successBox: { width: "100%", borderRadius: 16, borderWidth: 1, borderColor: Colors.success + "40", overflow: "hidden" },
  successInner: { alignItems: "center", padding: 32, gap: 12 },
  successIcon: { fontSize: 48, color: Colors.success },
  successTitle: { fontSize: 20, fontFamily: "Lora_700Bold", color: Colors.success, textAlign: "center" },
  successSub: { fontSize: 13, fontFamily: "Lora_400Regular_Italic", color: Colors.success + "90", textAlign: "center", marginBottom: 8 },
});
