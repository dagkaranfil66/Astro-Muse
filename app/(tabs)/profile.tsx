import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
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
  ZoomIn,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { SERVICE_GOLD_COST } from "@/constants/serviceConfig";

const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  astroloji: "moon-outline", kahve: "cafe-outline", el: "hand-left-outline",
  tarot: "layers-outline", samanizm: "leaf-outline", numeroloji: "star-outline",
  ruh: "eye-outline", dogum: "planet-outline", ruya: "cloud-outline",
  burclar: "telescope-outline", ask: "heart-outline",
};
const SERVICE_COLORS: Record<string, string> = {
  astroloji: "#6B4FBB", kahve: "#C0932A", el: "#1ABFB8", tarot: "#E7B008",
  samanizm: "#4CAF7A", numeroloji: "#E74C8B", ruh: "#9B59B6",
  dogum: "#FF8C42", ruya: "#5B9BD5", burclar: "#FF6B9D", ask: "#FF4757",
};

function GoldCoin({ size = 32 }: { size?: number }) {
  const rotate = useSharedValue(0);
  React.useEffect(() => {
    rotate.value = withRepeat(
      withSequence(withTiming(15, { duration: 600 }), withTiming(-15, { duration: 600 })),
      -1, true
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  return (
    <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.gold, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: Colors.goldLight }, style]}>
      <Text style={{ fontSize: size * 0.45, color: Colors.background }}>✦</Text>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { goldBalance, readings, userProfile, clearUserProfile, totalSpent } = useApp();
  const { t, lang } = useLang();

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const recentReadings = readings.slice(0, 5);
  const serviceBreakdown = readings.reduce<Record<string, number>>((acc, r) => {
    acc[r.service] = (acc[r.service] ?? 0) + 1;
    return acc;
  }, {});
  const topService = Object.entries(serviceBreakdown).sort((a, b) => b[1] - a[1])[0];

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await clearUserProfile();
    router.replace("/auth");
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#08051A", "#070D1A", "#0D0820"]} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <Text style={styles.headerSub}>✦ {lang === "tr" ? "TENGRI" : "TENGRI"} ✦</Text>
          <Text style={styles.headerTitle}>{lang === "tr" ? "Profilim" : "My Profile"}</Text>
        </Animated.View>

        {/* Avatar + User Info */}
        <Animated.View entering={ZoomIn.delay(100).springify()} style={styles.avatarSection}>
          <LinearGradient colors={["#1A1030", "#0D1526"]} style={styles.avatarCard}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={40} color={Colors.gold} />
            </View>
            <View style={styles.userInfoBlock}>
              {userProfile ? (
                <>
                  <Text style={styles.userName}>{userProfile.name}</Text>
                  <Text style={styles.userEmail}>{userProfile.email}</Text>
                  <Text style={styles.userJoin}>
                    {lang === "tr" ? "Katılım: " : "Joined: "}
                    {new Date(userProfile.joinDate).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { year: "numeric", month: "long" })}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.userName}>{lang === "tr" ? "Misafir Kullanıcı" : "Guest User"}</Text>
                  <Pressable onPress={() => router.push("/auth")} style={styles.loginBtn}>
                    <Ionicons name="sparkles" size={13} color={Colors.background} />
                    <Text style={styles.loginBtnText}>{lang === "tr" ? "Giriş Yap / Kayıt Ol" : "Login / Register"}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Gold Balance */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.goldCard}>
          <LinearGradient colors={["#1A1205", "#0D1526"]} style={styles.goldCardInner}>
            <View style={styles.goldLeft}>
              <GoldCoin size={44} />
              <View style={{ gap: 3 }}>
                <Text style={styles.goldLabel}>{lang === "tr" ? "Altın Bakiyeniz" : "Gold Balance"}</Text>
                <Text style={styles.goldAmount}>{goldBalance} <Text style={styles.goldUnit}>{lang === "tr" ? "altın" : "gold"}</Text></Text>
              </View>
            </View>
            <Pressable onPress={() => router.push("/purchase")} style={styles.buyGoldBtn}>
              <Ionicons name="add" size={14} color={Colors.background} />
              <Text style={styles.buyGoldBtnText}>{lang === "tr" ? "Satın Al" : "Buy"}</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: "#6B4FBB40" }]}>
            <LinearGradient colors={["#1A0F35", "#0D1526"]} style={styles.statCardInner}>
              <Ionicons name="book-outline" size={20} color="#6B4FBB" />
              <Text style={styles.statValue}>{readings.length}</Text>
              <Text style={styles.statLabel}>{lang === "tr" ? "Toplam Okuma" : "Total Readings"}</Text>
            </LinearGradient>
          </View>
          <View style={[styles.statCard, { borderColor: Colors.gold + "40" }]}>
            <LinearGradient colors={["#1A1205", "#0D1526"]} style={styles.statCardInner}>
              <Ionicons name="star" size={20} color={Colors.gold} />
              <Text style={styles.statValue}>{totalSpent}</Text>
              <Text style={styles.statLabel}>{lang === "tr" ? "Harcanan Altın" : "Gold Spent"}</Text>
            </LinearGradient>
          </View>
          <View style={[styles.statCard, { borderColor: "#FF6B9D40" }]}>
            <LinearGradient colors={["#1A0515", "#0D1526"]} style={styles.statCardInner}>
              <Ionicons name={topService ? (SERVICE_ICONS[topService[0]] ?? "sparkles") : "sparkles"} size={20} color="#FF6B9D" />
              <Text style={styles.statValue} numberOfLines={1}>{topService ? topService[1] : 0}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                {lang === "tr" ? "En Çok Kullanılan" : "Most Used"}
              </Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Service Costs Reference */}
        <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {lang === "tr" ? "✦ Hizmet Ücretleri" : "✦ Service Costs"}
          </Text>
          <View style={styles.costGrid}>
            {Object.entries(SERVICE_GOLD_COST).sort((a, b) => a[1] - b[1]).map(([svc, cost]) => (
              <View key={svc} style={[styles.costItem, { borderColor: (SERVICE_COLORS[svc] ?? Colors.gold) + "30" }]}>
                <Ionicons name={SERVICE_ICONS[svc] ?? "star-outline"} size={16} color={SERVICE_COLORS[svc] ?? Colors.gold} />
                <Text style={styles.costItemName} numberOfLines={1}>
                  {(t.services_list as any)[svc]?.label ?? svc}
                </Text>
                <View style={styles.costBadge}>
                  <Text style={styles.costBadgeText}>{cost}✦</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Recent Readings */}
        {recentReadings.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{lang === "tr" ? "✦ Son Okumalar" : "✦ Recent Readings"}</Text>
              <Pressable onPress={() => router.push("/(tabs)/history")}>
                <Text style={styles.seeAll}>{lang === "tr" ? "Tümü →" : "All →"}</Text>
              </Pressable>
            </View>
            {recentReadings.map((r) => (
              <View key={r.id} style={[styles.recentCard, { borderColor: (SERVICE_COLORS[r.service] ?? Colors.gold) + "25" }]}>
                <View style={[styles.recentIcon, { borderColor: (SERVICE_COLORS[r.service] ?? Colors.gold) + "40" }]}>
                  <Ionicons name={SERVICE_ICONS[r.service] ?? "star-outline"} size={16} color={SERVICE_COLORS[r.service] ?? Colors.gold} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.recentService}>{r.serviceLabel}</Text>
                  <Text style={styles.recentText} numberOfLines={2}>{r.content.slice(0, 80)}…</Text>
                </View>
                {r.goldSpent && (
                  <Text style={styles.recentGold}>{r.goldSpent}✦</Text>
                )}
              </View>
            ))}
          </Animated.View>
        )}

        {/* Account Actions */}
        <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>{lang === "tr" ? "✦ Hesap" : "✦ Account"}</Text>
          <Pressable onPress={() => router.push("/purchase")} style={styles.actionBtn}>
            <LinearGradient colors={["#1A1205", "#0D1526"]} style={styles.actionBtnInner}>
              <Ionicons name="diamond-outline" size={18} color={Colors.gold} />
              <Text style={styles.actionBtnText}>{lang === "tr" ? "Altın Satın Al" : "Buy Gold"}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
            </LinearGradient>
          </Pressable>
          {userProfile && (
            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={16} color={Colors.error} />
              <Text style={styles.logoutText}>{lang === "tr" ? "Çıkış Yap" : "Logout"}</Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 18, gap: 14 },

  header: { alignItems: "center", marginBottom: 4, gap: 4 },
  headerSub: { fontSize: 10, fontFamily: "Lora_400Regular", color: Colors.gold, letterSpacing: 6, textAlign: "center" },
  headerTitle: { fontSize: 26, fontFamily: "Lora_700Bold", color: Colors.text, textAlign: "center" },

  avatarSection: {},
  avatarCard: { borderRadius: 18, borderWidth: 1, borderColor: Colors.cardBorder, padding: 18, flexDirection: "row", alignItems: "center", gap: 16 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.gold + "40", alignItems: "center", justifyContent: "center" },
  userInfoBlock: { flex: 1, gap: 4 },
  userName: { fontSize: 18, fontFamily: "Lora_700Bold", color: Colors.text },
  userEmail: { fontSize: 12, fontFamily: "Lora_400Regular", color: Colors.textSecondary },
  userJoin: { fontSize: 11, fontFamily: "Lora_400Regular_Italic", color: Colors.textDim },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.gold, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignSelf: "flex-start", marginTop: 4 },
  loginBtnText: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.background },

  goldCard: { borderRadius: 16, borderWidth: 1, borderColor: Colors.gold + "30", overflow: "hidden" },
  goldCardInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  goldLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  goldLabel: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary },
  goldAmount: { fontSize: 22, fontFamily: "Lora_700Bold", color: Colors.gold },
  goldUnit: { fontSize: 13, fontFamily: "Lora_400Regular", color: Colors.gold + "90" },
  buyGoldBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.gold, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  buyGoldBtnText: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.background },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  statCardInner: { padding: 14, alignItems: "center", gap: 6 },
  statValue: { fontSize: 20, fontFamily: "Lora_700Bold", color: Colors.text },
  statLabel: { fontSize: 10, fontFamily: "Lora_400Regular", color: Colors.textSecondary, textAlign: "center" },

  section: { gap: 10 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.gold, letterSpacing: 1 },
  seeAll: { fontSize: 12, fontFamily: "Lora_400Regular", color: Colors.textSecondary },

  costGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  costItem: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: Colors.surface, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  costItemName: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary, flex: 1, maxWidth: 80 },
  costBadge: { backgroundColor: Colors.gold + "20", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  costBadgeText: { fontSize: 10, fontFamily: "Lora_700Bold", color: Colors.gold },

  recentCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, padding: 12 },
  recentIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceElevated, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  recentService: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.text },
  recentText: { fontSize: 11, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, lineHeight: 16 },
  recentGold: { fontSize: 11, fontFamily: "Lora_700Bold", color: Colors.gold },

  actionBtn: { borderRadius: 14, borderWidth: 1, borderColor: Colors.gold + "30", overflow: "hidden" },
  actionBtnInner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  actionBtnText: { flex: 1, fontSize: 14, fontFamily: "Lora_700Bold", color: Colors.text },

  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.error + "30", backgroundColor: Colors.surface },
  logoutText: { fontSize: 14, fontFamily: "Lora_700Bold", color: Colors.error },
});
