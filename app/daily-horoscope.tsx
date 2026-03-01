import React, { useState, useEffect, useRef } from "react";
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
  withSpring,
} from "react-native-reanimated";
import { fetch } from "expo/fetch";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { getApiUrl } from "@/lib/query-client";

const ZODIAC_SIGNS = [
  { name: "Koç", emoji: "♈" },
  { name: "Boğa", emoji: "♉" },
  { name: "İkizler", emoji: "♊" },
  { name: "Yengeç", emoji: "♋" },
  { name: "Aslan", emoji: "♌" },
  { name: "Başak", emoji: "♍" },
  { name: "Terazi", emoji: "♎" },
  { name: "Akrep", emoji: "♏" },
  { name: "Yay", emoji: "♐" },
  { name: "Oğlak", emoji: "♑" },
  { name: "Kova", emoji: "♒" },
  { name: "Balık", emoji: "♓" },
];

const ZODIAC_COLORS: Record<string, string> = {
  Koç: "#E05555", Boğa: "#6B9E3A", İkizler: "#E0C040", Yengeç: "#7EB8E8",
  Aslan: "#E08C00", Başak: "#7EB880", Terazi: "#C878D8", Akrep: "#8B2020",
  Yay: "#D8782A", Oğlak: "#6B8B9E", Kova: "#4878C8", Balık: "#7878D8",
};

async function streamText(
  url: string,
  body: object,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (e: string) => void
) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const json = JSON.parse(line.slice(6));
          if (json.done) { onDone(); return; }
          if (json.error) { onError(json.error); return; }
          if (json.content) onChunk(json.content);
        } catch {}
      }
    }
    onDone();
  } catch (e: any) {
    onError(e?.message ?? "Bağlantı hatası");
  }
}

function ZodiacSelector({ onSelect }: { onSelect: (sign: string) => void }) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.selectorWrap}>
      <Text style={styles.selectorTitle}>Burcunuzu seçin</Text>
      <Text style={styles.selectorSub}>Günlük mistik rehberliğiniz için</Text>
      <View style={styles.zodiacGrid}>
        {ZODIAC_SIGNS.map((z, i) => (
          <Animated.View key={z.name} entering={FadeInDown.delay(i * 35).springify()}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(z.name);
              }}
              style={styles.zodiacItem}
            >
              <LinearGradient
                colors={[ZODIAC_COLORS[z.name] + "25", ZODIAC_COLORS[z.name] + "10"]}
                style={styles.zodiacItemInner}
              >
                <Text style={styles.zodiacEmoji}>{z.emoji}</Text>
                <Text style={[styles.zodiacName, { color: ZODIAC_COLORS[z.name] }]}>{z.name}</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

function StarGlow() {
  const op = useSharedValue(0.3);
  useEffect(() => {
    op.value = withRepeat(withTiming(0.7, { duration: 2200 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    <Animated.View style={[styles.starGlow, style]} />
  );
}

export default function DailyHoroscopeScreen() {
  const insets = useSafeAreaInsets();
  const { zodiacSign, setZodiacSign, goldBalance, spendGold, canAfford } = useApp();
  const [teaser, setTeaser] = useState("");
  const [teaserDone, setTeaserDone] = useState(false);
  const [teaserLoading, setTeaserLoading] = useState(false);
  const [fullReading, setFullReading] = useState("");
  const [fullDone, setFullDone] = useState(false);
  const [fullLoading, setFullLoading] = useState(false);
  const [error, setError] = useState("");
  const [changingSign, setChangingSign] = useState(false);
  const fetchedRef = useRef(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const signColor = zodiacSign ? (ZODIAC_COLORS[zodiacSign] ?? Colors.gold) : Colors.gold;
  const signEmoji = ZODIAC_SIGNS.find((z) => z.name === zodiacSign)?.emoji ?? "✦";

  const loadTeaser = (sign: string) => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setTeaserLoading(true);
    setTeaser("");
    setTeaserDone(false);
    streamText(
      new URL("/api/daily-horoscope-teaser", getApiUrl()).toString(),
      { zodiacSign: sign },
      (chunk) => setTeaser((p) => p + chunk),
      () => { setTeaserLoading(false); setTeaserDone(true); },
      (e) => { setError(e); setTeaserLoading(false); }
    );
  };

  useEffect(() => {
    if (zodiacSign && !changingSign) {
      loadTeaser(zodiacSign);
    }
  }, [zodiacSign, changingSign]);

  const handleSelectSign = async (sign: string) => {
    fetchedRef.current = false;
    setTeaser("");
    setTeaserDone(false);
    setFullReading("");
    setFullDone(false);
    setChangingSign(false);
    setError("");
    await setZodiacSign(sign);
  };

  const handleReadFull = () => {
    if (!zodiacSign) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!canAfford("burclar")) {
      router.push("/purchase");
      return;
    }
    const ok = spendGold("burclar");
    if (!ok) { router.push("/purchase"); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFullLoading(true);
    setFullReading("");
    setFullDone(false);
    streamText(
      new URL("/api/reading", getApiUrl()).toString(),
      {
        service: "burclar",
        userInput: `${zodiacSign} burcu için bugünün tam mistik yorumunu ver. Aşk, kariyer, sağlık ve ruhsal rehberlik hakkında detaylı bilgi sun.`,
      },
      (chunk) => setFullReading((p) => p + chunk),
      () => { setFullLoading(false); setFullDone(true); },
      (e) => { setError(e); setFullLoading(false); }
    );
  };

  if (changingSign || !zodiacSign) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#08051A", "#070D1A", "#0D0820"]} style={StyleSheet.absoluteFill} />
        <StarGlow />
        <ScrollView
          contentContainerStyle={[styles.inner, { paddingTop: topPad + 12, paddingBottom: botPad + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => { if (zodiacSign) { setChangingSign(false); router.back(); } else { router.back(); } }} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </Pressable>
          <ZodiacSelector onSelect={handleSelectSign} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#08051A", "#070D1A", "#0D0820"]} style={StyleSheet.absoluteFill} />
      <StarGlow />

      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: topPad + 12, paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => setChangingSign(true)} style={styles.changeSignBtn}>
            <Text style={styles.changeSignText}>Burcu Değiştir</Text>
          </Pressable>
        </View>

        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <Text style={styles.headerMeta}>✦ GÜNLÜK BURÇ ✦</Text>
          <Text style={[styles.signEmoji, { color: signColor }]}>{signEmoji}</Text>
          <Text style={[styles.signName, { color: signColor }]}>{zodiacSign}</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          </Text>
        </Animated.View>

        {error ? (
          <Animated.View entering={FadeIn} style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => { fetchedRef.current = false; setError(""); loadTeaser(zodiacSign); }} style={styles.retryBtn}>
              <Text style={styles.retryText}>Tekrar Dene</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.teaserCard}>
              <LinearGradient colors={[signColor + "18", signColor + "08"]} style={styles.teaserCardInner}>
                <Text style={styles.teaserLabel}>Mistik Mesajınız</Text>
                {teaserLoading && !teaser ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={signColor} />
                    <Text style={styles.loadingText}>Yıldızlar okunuyor...</Text>
                  </View>
                ) : (
                  <Text style={styles.teaserText}>{teaser}</Text>
                )}
              </LinearGradient>
            </Animated.View>

            {teaserDone && !fullReading && !fullLoading && (
              <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.ctaWrap}>
                <Pressable onPress={handleReadFull} style={styles.ctaBtn}>
                  <LinearGradient colors={[signColor, signColor + "CC"]} style={styles.ctaBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.ctaBtnText}>Devamını Oku</Text>
                    <View style={styles.ctaCostBadge}>
                      <Text style={styles.ctaCostText}>3 ✦</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
                {goldBalance < 3 && (
                  <Text style={styles.noGoldHint}>
                    Yetersiz altın — Satın almaya yönlendirileceksiniz
                  </Text>
                )}
              </Animated.View>
            )}

            {(fullLoading || fullReading) && (
              <Animated.View entering={FadeInDown.springify()} style={styles.fullReadingCard}>
                <LinearGradient colors={["#14102A", "#0D1020"]} style={styles.fullReadingCardInner}>
                  <Text style={styles.fullReadingLabel}>✦ Tam Yorum</Text>
                  {fullLoading && !fullReading && (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color={signColor} />
                      <Text style={styles.loadingText}>Kaderin mesajı açılıyor...</Text>
                    </View>
                  )}
                  <Text style={styles.fullReadingText}>{fullReading}</Text>
                  {fullDone && (
                    <View style={styles.doneTag}>
                      <Text style={styles.doneTagText}>✦ Tengri'nin Bilgeliği</Text>
                    </View>
                  )}
                </LinearGradient>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  starGlow: {
    position: "absolute", width: 280, height: 280, borderRadius: 140,
    backgroundColor: Colors.gold, opacity: 0.04, top: 60, alignSelf: "center",
  },
  inner: { paddingHorizontal: 18, gap: 18 },

  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  changeSignBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  changeSignText: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary },

  header: { alignItems: "center", gap: 6, paddingVertical: 8 },
  headerMeta: { fontSize: 10, fontFamily: "Lora_400Regular", color: Colors.gold, letterSpacing: 5 },
  signEmoji: { fontSize: 52, marginVertical: 4 },
  signName: { fontSize: 28, fontFamily: "Lora_700Bold" },
  dateText: { fontSize: 12, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary },

  teaserCard: { borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder },
  teaserCardInner: { padding: 20, gap: 10 },
  teaserLabel: { fontSize: 10, fontFamily: "Lora_700Bold", color: Colors.textSecondary, letterSpacing: 2, textTransform: "uppercase" },
  teaserText: { fontSize: 16, fontFamily: "Lora_400Regular_Italic", color: Colors.text, lineHeight: 26 },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  loadingText: { fontSize: 13, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary },

  ctaWrap: { alignItems: "center", gap: 10 },
  ctaBtn: { borderRadius: 14, overflow: "hidden", width: "100%" },
  ctaBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 12 },
  ctaBtnText: { fontSize: 16, fontFamily: "Lora_700Bold", color: "#fff" },
  ctaCostBadge: { backgroundColor: "rgba(0,0,0,0.3)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  ctaCostText: { fontSize: 12, fontFamily: "Lora_700Bold", color: "#fff" },
  noGoldHint: { fontSize: 11, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, textAlign: "center" },

  fullReadingCard: { borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: Colors.gold + "30" },
  fullReadingCardInner: { padding: 20, gap: 12 },
  fullReadingLabel: { fontSize: 11, fontFamily: "Lora_700Bold", color: Colors.gold, letterSpacing: 2 },
  fullReadingText: { fontSize: 15, fontFamily: "Lora_400Regular", color: Colors.text, lineHeight: 26 },
  doneTag: { alignSelf: "center", paddingTop: 8 },
  doneTagText: { fontSize: 11, fontFamily: "Lora_400Regular_Italic", color: Colors.gold + "80", letterSpacing: 2 },

  errorBox: { borderRadius: 14, borderWidth: 1, borderColor: "#E05555" + "40", backgroundColor: "#E0555510", padding: 16, gap: 10 },
  errorText: { fontSize: 13, fontFamily: "Lora_400Regular", color: "#E05555", textAlign: "center" },
  retryBtn: { alignSelf: "center", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.surface },
  retryText: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.text },

  selectorWrap: { gap: 16 },
  selectorTitle: { fontSize: 22, fontFamily: "Lora_700Bold", color: Colors.text, textAlign: "center" },
  selectorSub: { fontSize: 13, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, textAlign: "center" },
  zodiacGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  zodiacItem: { borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder },
  zodiacItemInner: { width: 80, height: 80, alignItems: "center", justifyContent: "center", gap: 4 },
  zodiacEmoji: { fontSize: 26 },
  zodiacName: { fontSize: 11, fontFamily: "Lora_700Bold" },
});
