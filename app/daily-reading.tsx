import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { fetch } from "expo/fetch";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { SERVICE_GOLD_COST } from "@/constants/serviceConfig";
import { getApiUrl } from "@/lib/query-client";

const DAILY_ROTATION = ["samanizm", "tarot", "ruya", "numeroloji", "ask", "burclar", "ruh"];

const SERVICE_META: Record<string, {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradient: [string, string];
  labelTR: string;
  labelEN: string;
}> = {
  samanizm:  { icon: "leaf-outline",      color: "#4CAF7A", gradient: ["#051A0D", "#070D1A"], labelTR: "Şamanizm",      labelEN: "Shamanism" },
  tarot:     { icon: "layers-outline",    color: "#E7B008", gradient: ["#1A1205", "#070D1A"], labelTR: "Tarot",          labelEN: "Tarot" },
  ruya:      { icon: "cloud-outline",     color: "#5B9BD5", gradient: ["#051020", "#070D1A"], labelTR: "Rüya Yorumu",    labelEN: "Dream Reading" },
  numeroloji:{ icon: "star-outline",      color: "#E74C8B", gradient: ["#1A0510", "#070D1A"], labelTR: "Numeroloji",     labelEN: "Numerology" },
  ask:       { icon: "heart-outline",     color: "#FF4757", gradient: ["#1A0508", "#070D1A"], labelTR: "Aşkını Bul",     labelEN: "Love Reading" },
  burclar:   { icon: "telescope-outline", color: "#FF6B9D", gradient: ["#1A0515", "#070D1A"], labelTR: "Burçlar",        labelEN: "Horoscope" },
  ruh:       { icon: "eye-outline",       color: "#9B59B6", gradient: ["#150E25", "#070D1A"], labelTR: "Ruh Okuma",      labelEN: "Soul Reading" },
};

function getTodayService() {
  const day = new Date().getDay();
  return DAILY_ROTATION[day] ?? "tarot";
}

function PulseOrb({ color }: { color: string }) {
  const scale = useSharedValue(1);
  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 1800 }), withTiming(1, { duration: 1800 })),
      -1, false
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[sOrb.orb, { backgroundColor: color + "20", borderColor: color + "40" }, style]} />
  );
}
const sOrb = StyleSheet.create({
  orb: { width: 120, height: 120, borderRadius: 60, borderWidth: 1, position: "absolute" },
});

export default function DailyReadingScreen() {
  const insets = useSafeAreaInsets();
  const { canDailyFree, markDailyFreeUsed, goldBalance, userProfile } = useApp();
  const { lang } = useLang();

  const todayService = getTodayService();
  const meta = SERVICE_META[todayService] ?? SERVICE_META.tarot;
  const goldCost = SERVICE_GOLD_COST[todayService] ?? 3;

  const [isLoading, setIsLoading] = useState(false);
  const [readingText, setReadingText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleFreeReading = async () => {
    if (isLoading || !canDailyFree) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setReadingText("");
    setIsDone(false);

    try {
      await markDailyFreeUsed();
      const apiBase = getApiUrl();
      const url = new URL("/api/reading/daily-free", apiBase);
      const resp = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: todayService, lang }),
      });
      if (!resp.body) throw new Error("No body");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.content) {
              setReadingText((prev) => prev + parsed.content);
              scrollRef.current?.scrollToEnd({ animated: true });
            }
            if (parsed.done) setIsDone(true);
          } catch {}
        }
      }
      setIsDone(true);
    } catch {
      setIsDone(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailedReading = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!userProfile) {
      router.push("/auth");
      return;
    }
    router.push(`/reading/${todayService}` as any);
  };

  return (
    <View style={s.container}>
      <LinearGradient colors={["#04080F", "#070D1A", meta.gradient[0]]} style={StyleSheet.absoluteFill} />

      {/* Orb background */}
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", pointerEvents: "none" }]}>
        <PulseOrb color={meta.color} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[s.scroll, { paddingTop: topPad + 16, paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
        </Pressable>

        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={s.hero}>
          <View style={[s.iconCircle, { borderColor: meta.color + "50", backgroundColor: meta.color + "15" }]}>
            <Ionicons name={meta.icon} size={36} color={meta.color} />
          </View>
          <Text style={s.heroLabel}>
            {lang === "tr" ? "✦ GÜNLÜK FAL ✦" : "✦ DAILY READING ✦"}
          </Text>
          <Text style={[s.heroService, { color: meta.color }]}>
            {lang === "tr" ? meta.labelTR : meta.labelEN}
          </Text>
          <View style={s.freeBadge}>
            <Text style={s.freeBadgeText}>{lang === "tr" ? "ÜCRETSİZ ÖN OKUMA" : "FREE PREVIEW"}</Text>
          </View>
        </Animated.View>

        {/* Reading result or CTA */}
        {!readingText && !isDone ? (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={s.ctaCard}>
            <LinearGradient colors={["#0D1020", "#0A0820"]} style={s.ctaCardInner}>
              {canDailyFree ? (
                <>
                  <Text style={s.ctaTitle}>
                    {lang === "tr" ? "🔮 Bugünün Enerjisini Keşfet" : "🔮 Discover Today's Energy"}
                  </Text>
                  <Text style={s.ctaDesc}>
                    {lang === "tr"
                      ? "Her gün ücretsiz bir mistik ön okuma seni bekliyor."
                      : "A free mystical preview awaits you every day."}
                  </Text>
                  <Pressable
                    onPress={handleFreeReading}
                    disabled={isLoading}
                    style={[s.freeBtn, { backgroundColor: meta.color }]}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={16} color="#000" />
                        <Text style={s.freeBtnText}>
                          {lang === "tr" ? "Ücretsiz Keşfet" : "Explore Free"}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={s.ctaTitle}>
                    {lang === "tr" ? "✦ Bugünkü Falınızı Kullandınız" : "✦ Today's Reading Used"}
                  </Text>
                  <Text style={s.ctaDesc}>
                    {lang === "tr"
                      ? "Ücretsiz ön okumanız için yarın tekrar gelin. Detaylı okuma için altın kullanabilirsiniz."
                      : "Come back tomorrow for your free preview. Use gold for detailed readings anytime."}
                  </Text>
                </>
              )}
            </LinearGradient>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(400)} style={s.resultCard}>
            <LinearGradient colors={["#0D1020", "#0A0820"]} style={s.resultCardInner}>
              <Text style={[s.resultTitle, { color: meta.color }]}>
                {lang === "tr" ? "✦ Mistik Mesajınız" : "✦ Your Mystical Message"}
              </Text>
              <Text style={s.resultText}>{readingText}</Text>
              {isLoading && !isDone && (
                <ActivityIndicator size="small" color={meta.color} style={{ marginTop: 8 }} />
              )}
            </LinearGradient>
          </Animated.View>
        )}

        {/* Detailed reading CTA */}
        {(isDone || !canDailyFree) && (
          <Animated.View entering={ZoomIn.delay(400).springify()} style={s.detailCard}>
            <LinearGradient colors={["#1A0820", "#0D0515"]} style={s.detailCardInner}>
              <View style={s.detailTop}>
                <Ionicons name="sparkles" size={18} color={meta.color} />
                <Text style={s.detailTitle}>
                  {lang === "tr" ? "Detaylı Yorum" : "Full Reading"}
                </Text>
              </View>
              <Text style={s.detailDesc}>
                {lang === "tr"
                  ? "Çok daha derin, kişisel ve kapsamlı bir mistik okuma için:"
                  : "For a much deeper, personal and comprehensive mystical reading:"}
              </Text>
              <Pressable onPress={handleDetailedReading} style={s.detailBtn}>
                <LinearGradient
                  colors={[meta.color, meta.color + "AA"]}
                  style={s.detailBtnInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={s.detailBtnText}>
                    {lang === "tr"
                      ? `Detaylı ${meta.labelTR} → ${goldCost} Altın`
                      : `Full ${meta.labelEN} → ${goldCost} Gold`}
                  </Text>
                  <Ionicons name="chevron-forward" size={15} color="#000" />
                </LinearGradient>
              </Pressable>
              {goldBalance < goldCost && (
                <Pressable onPress={() => router.push("/purchase")} style={s.buyGoldLink}>
                  <Ionicons name="diamond-outline" size={12} color={Colors.gold} />
                  <Text style={s.buyGoldLinkText}>
                    {lang === "tr" ? "Altın Satın Al" : "Buy Gold"}
                  </Text>
                </Pressable>
              )}
            </LinearGradient>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20, minHeight: "100%" },
  backBtn: { marginBottom: 12 },
  hero: { alignItems: "center", paddingVertical: 24 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 10,
    fontFamily: "Lora_700Bold",
    color: Colors.textDim,
    letterSpacing: 2,
    marginBottom: 6,
  },
  heroService: {
    fontSize: 28,
    fontFamily: "Lora_700Bold",
    marginBottom: 10,
  },
  freeBadge: {
    backgroundColor: "#C8A02020",
    borderWidth: 1,
    borderColor: "#C8A02055",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  freeBadgeText: {
    fontSize: 10,
    fontFamily: "Lora_700Bold",
    color: Colors.gold,
    letterSpacing: 1,
  },
  ctaCard: { borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  ctaCardInner: { padding: 24, alignItems: "center" },
  ctaTitle: {
    fontSize: 17,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  ctaDesc: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  freeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
  },
  freeBtnText: {
    fontSize: 15,
    fontFamily: "Lora_700Bold",
    color: "#000",
  },
  resultCard: { borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  resultCardInner: { padding: 20 },
  resultTitle: {
    fontSize: 12,
    fontFamily: "Lora_700Bold",
    letterSpacing: 1,
    marginBottom: 12,
  },
  resultText: {
    fontSize: 15,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.text,
    lineHeight: 26,
  },
  detailCard: { borderRadius: 16, overflow: "hidden" },
  detailCardInner: { padding: 20 },
  detailTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 17,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
  },
  detailDesc: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  detailBtn: { borderRadius: 12, overflow: "hidden", marginBottom: 10 },
  detailBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 20,
    gap: 8,
  },
  detailBtnText: {
    fontSize: 14,
    fontFamily: "Lora_700Bold",
    color: "#000",
  },
  buyGoldLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    justifyContent: "center",
    paddingVertical: 8,
  },
  buyGoldLinkText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    color: Colors.gold,
  },
});
