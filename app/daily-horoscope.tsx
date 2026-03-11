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
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { fetch } from "expo/fetch";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { getApiUrl } from "@/lib/query-client";
import { SectionedReading, parseKahveSections } from "@/components/SectionedReading";

// ─── Zodiac Data ─────────────────────────────────────────────────────────────

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

const COMPATIBLE_SIGNS: Record<string, string[]> = {
  "Koç": ["Yay", "Aslan", "İkizler"],
  "Boğa": ["Başak", "Oğlak", "Yengeç"],
  "İkizler": ["Terazi", "Kova", "Koç"],
  "Yengeç": ["Akrep", "Balık", "Boğa"],
  "Aslan": ["Koç", "Yay", "İkizler"],
  "Başak": ["Oğlak", "Boğa", "Akrep"],
  "Terazi": ["İkizler", "Kova", "Yay"],
  "Akrep": ["Yengeç", "Balık", "Başak"],
  "Yay": ["Koç", "Aslan", "Terazi"],
  "Oğlak": ["Boğa", "Başak", "Akrep"],
  "Kova": ["İkizler", "Terazi", "Yay"],
  "Balık": ["Yengeç", "Akrep", "Oğlak"],
};

const TAROT_CARDS = [
  { name: "Aşık", symbol: "VI", summary: "Kalp bağlantıları bugün öne çıkıyor." },
  { name: "Sihirbaz", symbol: "I", summary: "Potansiyelini kullanma zamanı." },
  { name: "Yüksek Rahibe", symbol: "II", summary: "Sezgilerine güven, sessiz bilgelik konuşuyor." },
  { name: "İmparatoriçe", symbol: "III", summary: "Bolluk ve yaratıcılık enerjisi yoğun." },
  { name: "İmparator", symbol: "IV", summary: "Kararlılık ve yapı bugün güç veriyor." },
  { name: "Rahip", symbol: "V", summary: "Geleneksel yollar bugün güvenli liman." },
  { name: "Savaş Arabası", symbol: "VII", summary: "Azimle ilerlersen engel tanımazsın." },
  { name: "Adalet", symbol: "VIII", summary: "Her şey dengeye kavuşuyor, sabırlı ol." },
  { name: "Ermişlik", symbol: "IX", summary: "İçe dönüş ve derin bir farkındalık vakti." },
  { name: "Kader Çarkı", symbol: "X", summary: "Döngüler dönüyor, değişime hazır ol." },
  { name: "Güç", symbol: "XI", summary: "İç gücün bugün en yüksek noktasında." },
  { name: "Asılı Adam", symbol: "XII", summary: "Farklı bir bakış açısı yeni yollar açıyor." },
  { name: "Ölüm", symbol: "XIII", summary: "Dönüşüm kapıda, bırakmak özgürleştirir." },
  { name: "Denge", symbol: "XIV", summary: "Sabır ve ölçülülük bugünün anahtarı." },
  { name: "Şeytan", symbol: "XV", summary: "Zincirler sandığından çok daha zayıf." },
  { name: "Kule", symbol: "XVI", summary: "Ani değişim bir yıkım değil, arınmadır." },
  { name: "Yıldız", symbol: "XVII", summary: "Umut ve ilham ışığı seni aydınlatıyor." },
  { name: "Ay", symbol: "XVIII", summary: "Gizli duygular yüzeye çıkmak istiyor." },
  { name: "Güneş", symbol: "XIX", summary: "Sevinç ve netlik bugün sana eşlik ediyor." },
  { name: "Yargılama", symbol: "XX", summary: "Yeni bir sayfa açılıyor, hazır mısın?" },
  { name: "Dünya", symbol: "XXI", summary: "Tamamlanma ve bütünlük hissi geliyor." },
  { name: "Deli", symbol: "0", summary: "Yeni bir başlangıcın eşiğindesin." },
];

const LUCKY_COLORS = ["Mor", "Altın", "Turkuaz", "Kırmızı", "Gümüş", "Beyaz", "Lacivert", "Koyu Yeşil", "Pembe", "Amber", "İndigo", "Bakır"];
const LUCKY_HOURS = ["07:00–09:00", "10:00–12:00", "13:00–15:00", "15:00–17:00", "18:00–20:00", "20:00–22:00"];
const LUCKY_COLORS_HEX: Record<string, string> = {
  "Mor": "#9B59B6", "Altın": "#E7B008", "Turkuaz": "#1ABFB8", "Kırmızı": "#E05555",
  "Gümüş": "#95A5A6", "Beyaz": "#F0E8D0", "Lacivert": "#2C3E70", "Koyu Yeşil": "#27AE60",
  "Pembe": "#E91E8C", "Amber": "#E08C00", "İndigo": "#4878C8", "Bakır": "#C0932A",
};

const DAILY_UNIVERSE_MESSAGES = [
  "Bugün sezgilerin düşündüğünden çok daha güçlü olabilir.",
  "İç sesin seni doğru yöne çağırıyor olabilir.",
  "Akşam saatlerinde enerji değişimi hissedebilirsin.",
  "Bazı kapılar kapanırken başkaları sessizce açılıyor.",
  "Bugün küçük detaylar büyük mesajlar taşıyabilir.",
  "Sabır, bugün en güçlü silahın olabilir.",
  "Beklenmedik bir bağlantı yeni bir ufuk açabilir.",
  "Evren seni dinliyor; niyetini net tut.",
  "Bugün verdiğin enerji, yarın geri dönüyor.",
  "Kendi bilgeliğine güven — cevap içinde.",
];

function getDayOfYear(date: Date): number {
  return Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
}

function getLuckyData(sign: string) {
  const now = new Date();
  const doy = getDayOfYear(now);
  const signIdx = ZODIAC_SIGNS.findIndex((z) => z.name === sign);
  const seed = (signIdx + 1) * 7 + doy;
  const luckyNumber = (seed % 9) + 1;
  const luckyColor = LUCKY_COLORS[(seed * 3) % LUCKY_COLORS.length];
  const luckyHour = LUCKY_HOURS[(seed * 2) % LUCKY_HOURS.length];
  return { luckyNumber, luckyColor, luckyHour };
}

function getTarotCard(sign: string) {
  const now = new Date();
  const doy = getDayOfYear(now);
  const signIdx = ZODIAC_SIGNS.findIndex((z) => z.name === sign);
  const idx = (doy + signIdx * 3) % TAROT_CARDS.length;
  return TAROT_CARDS[idx];
}

function getUniverseMessage(sign: string) {
  const now = new Date();
  const doy = getDayOfYear(now);
  const signIdx = ZODIAC_SIGNS.findIndex((z) => z.name === sign);
  const idx = (doy + signIdx) % DAILY_UNIVERSE_MESSAGES.length;
  return DAILY_UNIVERSE_MESSAGES[idx];
}

// ─── Streaming helper ──────────────────────────────────────────────────────────

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

// ─── Floating Stars ───────────────────────────────────────────────────────────

const STAR_CONFIGS = [
  { symbol: "✦", x: "10%", y: 80, size: 16, duration: 2800, delay: 0, color: "#C8A0DC" },
  { symbol: "⋆", x: "82%", y: 120, size: 12, duration: 3400, delay: 600, color: "#7EB8E8" },
  { symbol: "✧", x: "5%", y: 220, size: 10, duration: 2200, delay: 1200, color: "#E0C040" },
  { symbol: "★", x: "88%", y: 300, size: 14, duration: 3800, delay: 400, color: "#C878D8" },
  { symbol: "✦", x: "50%", y: 50, size: 11, duration: 2600, delay: 900, color: "#9B59B6" },
  { symbol: "⋆", x: "70%", y: 200, size: 9, duration: 3200, delay: 200, color: "#7EB8E8" },
  { symbol: "✧", x: "25%", y: 350, size: 13, duration: 2900, delay: 700, color: "#C8A0DC" },
  { symbol: "★", x: "92%", y: 160, size: 10, duration: 3600, delay: 1500, color: "#E08C00" },
];

function FloatingStar({ cfg }: { cfg: typeof STAR_CONFIGS[0] }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  useEffect(() => {
    opacity.value = withDelay(
      cfg.delay,
      withRepeat(withSequence(
        withTiming(0.7, { duration: cfg.duration * 0.4 }),
        withTiming(0.15, { duration: cfg.duration * 0.3 }),
        withTiming(0.9, { duration: cfg.duration * 0.3 }),
      ), -1, true)
    );
    translateY.value = withDelay(
      cfg.delay,
      withRepeat(withSequence(
        withTiming(-10, { duration: cfg.duration * 0.5 }),
        withTiming(10, { duration: cfg.duration * 0.5 }),
      ), -1, true)
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  return (
    <Animated.Text style={[style, { position: "absolute", left: cfg.x, top: cfg.y, fontSize: cfg.size, color: cfg.color, pointerEvents: "none" } as any]}>
      {cfg.symbol}
    </Animated.Text>
  );
}

function FloatingStars() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {STAR_CONFIGS.map((cfg, i) => <FloatingStar key={i} cfg={cfg} />)}
    </View>
  );
}

// ─── Zodiac Selector ──────────────────────────────────────────────────────────

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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DailyHoroscopeScreen() {
  const insets = useSafeAreaInsets();
  const { zodiacSign, setZodiacSign, goldBalance, spendGold, canAfford } = useApp();

  // Teaser
  const [teaser, setTeaser] = useState("");
  const [teaserDone, setTeaserDone] = useState(false);
  const [teaserLoading, setTeaserLoading] = useState(false);

  // Weekly
  const [weeklyText, setWeeklyText] = useState("");
  const [weeklyDone, setWeeklyDone] = useState(false);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const weeklyFetched = useRef(false);

  // Full paid reading
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

  // ─── Static derived data ────────────────────────────────────────────────────
  const luckyData = zodiacSign ? getLuckyData(zodiacSign) : null;
  const compatibleSigns = zodiacSign ? (COMPATIBLE_SIGNS[zodiacSign] ?? []) : [];
  const tarotCard = zodiacSign ? getTarotCard(zodiacSign) : null;
  const universeMsg = zodiacSign ? getUniverseMessage(zodiacSign) : "";

  // ─── Next day countdown ─────────────────────────────────────────────────────
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const hoursLeft = Math.floor((tomorrow.getTime() - now.getTime()) / 3600000);
  const minutesLeft = Math.floor(((tomorrow.getTime() - now.getTime()) % 3600000) / 60000);

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

  const loadWeekly = (sign: string) => {
    if (weeklyFetched.current) return;
    weeklyFetched.current = true;
    setWeeklyLoading(true);
    setWeeklyText("");
    setWeeklyDone(false);
    streamText(
      new URL("/api/weekly-horoscope", getApiUrl()).toString(),
      { zodiacSign: sign },
      (chunk) => setWeeklyText((p) => p + chunk),
      () => { setWeeklyLoading(false); setWeeklyDone(true); },
      () => { setWeeklyLoading(false); }
    );
  };

  useEffect(() => {
    if (zodiacSign && !changingSign) {
      loadTeaser(zodiacSign);
    }
  }, [zodiacSign, changingSign]);

  // Load weekly after teaser done
  useEffect(() => {
    if (teaserDone && zodiacSign && !weeklyFetched.current) {
      loadWeekly(zodiacSign);
    }
  }, [teaserDone, zodiacSign]);

  const handleSelectSign = async (sign: string) => {
    fetchedRef.current = false;
    weeklyFetched.current = false;
    setTeaser(""); setTeaserDone(false);
    setWeeklyText(""); setWeeklyDone(false);
    setFullReading(""); setFullDone(false);
    setChangingSign(false); setError("");
    await setZodiacSign(sign);
  };

  const handleReadFull = () => {
    if (!zodiacSign) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!canAfford("burclar")) { router.push("/purchase"); return; }
    const ok = spendGold("burclar");
    if (!ok) { router.push("/purchase"); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFullLoading(true); setFullReading(""); setFullDone(false);
    streamText(
      new URL("/api/reading", getApiUrl()).toString(),
      { service: "burclar", userInput: `${zodiacSign} burcu için bugünün tam mistik yorumu.` },
      (chunk) => setFullReading((p) => p + chunk),
      () => { setFullLoading(false); setFullDone(true); },
      (e) => { setError(e); setFullLoading(false); }
    );
  };

  if (changingSign || !zodiacSign) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#08051A", "#070D1A", "#0D0820"]} style={StyleSheet.absoluteFill} />
        <FloatingStars />
        <ScrollView
          contentContainerStyle={[styles.inner, { paddingTop: topPad + 12, paddingBottom: botPad + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => { if (zodiacSign) setChangingSign(false); else router.back(); }}
            style={styles.closeBtn} hitSlop={12}
          >
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </Pressable>
          <ZodiacSelector onSelect={handleSelectSign} />
        </ScrollView>
      </View>
    );
  }

  const hasSections = parseKahveSections(fullReading).length > 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#08051A", "#070D1A", "#0D0820"]} style={StyleSheet.absoluteFill} />
      <FloatingStars />

      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: topPad + 12, paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
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
            {/* ── Günlük Mistik Teaser ── */}
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.teaserCard}>
              <LinearGradient colors={[signColor + "18", signColor + "08"]} style={styles.teaserCardInner}>
                <Text style={styles.teaserLabel}>Günlük Mistik Mesajınız</Text>
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

            {/* ── Günün Şansı ── */}
            {teaserDone && luckyData && (
              <Animated.View entering={FadeInDown.delay(150).springify()}>
                <Text style={styles.sectionHeading}>✦ Günün Şansı</Text>
                <View style={styles.luckyRow}>
                  <LinearGradient colors={[signColor + "20", signColor + "08"]} style={styles.luckyCard}>
                    <Text style={[styles.luckyValue, { color: signColor }]}>{luckyData.luckyNumber}</Text>
                    <Text style={styles.luckyLabel}>Şanslı Sayı</Text>
                  </LinearGradient>
                  <LinearGradient colors={[(LUCKY_COLORS_HEX[luckyData.luckyColor] ?? signColor) + "20", signColor + "06"]} style={styles.luckyCard}>
                    <View style={[styles.luckyColorDot, { backgroundColor: LUCKY_COLORS_HEX[luckyData.luckyColor] ?? signColor }]} />
                    <Text style={[styles.luckyValue, { color: LUCKY_COLORS_HEX[luckyData.luckyColor] ?? signColor, fontSize: 13 }]}>{luckyData.luckyColor}</Text>
                    <Text style={styles.luckyLabel}>Şanslı Renk</Text>
                  </LinearGradient>
                  <LinearGradient colors={[signColor + "20", signColor + "08"]} style={styles.luckyCard}>
                    <Text style={[styles.luckyValue, { color: signColor, fontSize: 12 }]}>{luckyData.luckyHour}</Text>
                    <Text style={styles.luckyLabel}>Şanslı Saat</Text>
                  </LinearGradient>
                </View>
              </Animated.View>
            )}

            {/* ── Uyumlu Burçlar ── */}
            {teaserDone && compatibleSigns.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.compatCard}>
                <LinearGradient colors={["#14102A", "#0D1020"]} style={styles.compatCardInner}>
                  <View style={styles.compatHeader}>
                    <Ionicons name="heart-outline" size={14} color={signColor} />
                    <Text style={[styles.compatTitle, { color: signColor }]}>Bugün En Uyumlu Enerjiler</Text>
                  </View>
                  <View style={styles.compatSignRow}>
                    {compatibleSigns.map((s) => {
                      const emoji = ZODIAC_SIGNS.find((z) => z.name === s)?.emoji ?? "";
                      const color = ZODIAC_COLORS[s] ?? Colors.gold;
                      return (
                        <Pressable
                          key={s}
                          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/love-compat" as any); }}
                          style={[styles.compatSignChip, { borderColor: color + "40", backgroundColor: color + "12" }]}
                        >
                          <Text style={styles.compatSignEmoji}>{emoji}</Text>
                          <Text style={[styles.compatSignName, { color }]}>{s}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Pressable onPress={() => router.push("/love-compat" as any)} style={styles.compatLinkRow}>
                    <Text style={styles.compatLinkText}>Aşk uyumunu daha derin gör</Text>
                    <Ionicons name="chevron-forward" size={12} color={Colors.textDim} />
                  </Pressable>
                </LinearGradient>
              </Animated.View>
            )}

            {/* ── Günün Tarot Kartı Widget ── */}
            {teaserDone && tarotCard && (
              <Animated.View entering={FadeInDown.delay(250).springify()}>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/reading/tarot" as any); }}
                  style={styles.tarotWidget}
                >
                  <LinearGradient colors={["#1A0D35", "#0D0820"]} style={styles.tarotWidgetInner}>
                    <View style={styles.tarotWidgetLeft}>
                      <Text style={styles.tarotWidgetSymbol}>{tarotCard.symbol}</Text>
                    </View>
                    <View style={styles.tarotWidgetContent}>
                      <Text style={styles.tarotWidgetMeta}>✦ BUGÜNÜN TAROT KARTI</Text>
                      <Text style={styles.tarotWidgetName}>{tarotCard.name}</Text>
                      <Text style={styles.tarotWidgetSummary}>{tarotCard.summary}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={Colors.textDim} />
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}

            {/* ── Evrenden Mesaj ── */}
            {teaserDone && (
              <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.universeCard}>
                <LinearGradient colors={["#0D1526", "#070D1A"]} style={styles.universeCardInner}>
                  <Text style={styles.universeMeta}>☽ Evrenden Mesaj</Text>
                  <Text style={styles.universeText}>"{universeMsg}"</Text>
                </LinearGradient>
              </Animated.View>
            )}

            {/* ── CTA Tam Yorum ── */}
            {teaserDone && !fullReading && !fullLoading && (
              <Animated.View entering={ZoomIn.delay(350).springify()} style={styles.ctaWrap}>
                <Pressable onPress={handleReadFull} style={styles.ctaBtn}>
                  <LinearGradient colors={["#6B2FC0", "#4A1A8A"]} style={styles.ctaBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                    <Text style={styles.ctaBtnText}>Tam Yorumu Oku</Text>
                    <View style={styles.ctaCostBadge}>
                      <Text style={styles.ctaCostText}>3 ✦</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
                {goldBalance < 3 && (
                  <Text style={styles.noGoldHint}>Yetersiz altın — Satın almaya yönlendirileceksiniz</Text>
                )}
              </Animated.View>
            )}

            {/* ── Full Reading (Sectioned) ── */}
            {(fullLoading || fullReading) && (
              <Animated.View entering={FadeInDown.springify()} style={styles.fullReadingCard}>
                <LinearGradient colors={["#14102A", "#0D1020"]} style={styles.fullReadingCardInner}>
                  <View style={styles.fullReadingHeaderRow}>
                    <Ionicons name="sparkles" size={13} color={signColor} />
                    <Text style={[styles.fullReadingLabel, { color: signColor }]}>Tam Burç Yorumu</Text>
                  </View>
                  {fullLoading && !fullReading && (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color={signColor} />
                      <Text style={styles.loadingText}>Kaderin mesajı açılıyor...</Text>
                    </View>
                  )}
                  {hasSections ? (
                    <View style={{ paddingTop: 4 }}>
                      <SectionedReading text={fullReading} color={signColor} isLoading={fullLoading} />
                      {fullLoading && fullReading && <ActivityIndicator size="small" color={signColor} style={{ padding: 8 }} />}
                    </View>
                  ) : (
                    <Text style={styles.fullReadingText}>{fullReading}</Text>
                  )}
                  {fullDone && (
                    <View style={styles.doneTag}>
                      <Text style={styles.doneTagText}>✦ Tengri'nin Bilgeliği</Text>
                    </View>
                  )}
                </LinearGradient>
              </Animated.View>
            )}

            {/* ── Haftalık Özet ── */}
            {teaserDone && (
              <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.weeklyCard}>
                <LinearGradient colors={["#0A1628", "#070D1A"]} style={styles.weeklyCardInner}>
                  <View style={styles.weeklyHeader}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.gold} />
                    <Text style={styles.weeklyTitle}>Bu Haftanın Enerjisi</Text>
                  </View>
                  {weeklyLoading && !weeklyText ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color={Colors.gold} />
                      <Text style={styles.loadingText}>Haftalık enerji hesaplanıyor...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.weeklyText}>{weeklyText}</Text>
                      {weeklyLoading && <ActivityIndicator size="small" color={Colors.gold} style={{ marginTop: 6 }} />}
                    </>
                  )}
                </LinearGradient>
              </Animated.View>
            )}

            {/* ── Yarın Motivasyonu ── */}
            {teaserDone && (
              <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.tomorrowCard}>
                <LinearGradient colors={[signColor + "12", signColor + "05"]} style={styles.tomorrowCardInner}>
                  <View style={styles.tomorrowRow}>
                    <Ionicons name="moon-outline" size={16} color={signColor} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tomorrowTitle, { color: signColor }]}>Yarın Yeni Yorum Seni Bekliyor</Text>
                      <Text style={styles.tomorrowSub}>
                        {hoursLeft > 0 ? `${hoursLeft} saat ${minutesLeft} dakika sonra yenileniyor` : "Çok yakında yenileniyor"}
                      </Text>
                    </View>
                    <View style={[styles.tomorrowBadge, { backgroundColor: signColor + "20" }]}>
                      <Text style={[styles.tomorrowBadgeText, { color: signColor }]}>{hoursLeft}s</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* ── Diğer Kategorilere Yönlendirme ── */}
            {teaserDone && (
              <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.crossPromoWrap}>
                <Text style={styles.sectionHeading}>✦ Daha Fazlasını Keşfet</Text>
                <View style={styles.crossPromoGrid}>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/reading/tarot" as any); }}
                    style={styles.crossPromoCard}
                  >
                    <LinearGradient colors={["#1A0D35", "#0D0820"]} style={styles.crossPromoInner}>
                      <Text style={styles.crossPromoEmoji}>🃏</Text>
                      <Text style={styles.crossPromoText}>Bugün Sana Özel Tarot</Text>
                    </LinearGradient>
                  </Pressable>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/love-compat" as any); }}
                    style={styles.crossPromoCard}
                  >
                    <LinearGradient colors={["#1A0515", "#0D0820"]} style={styles.crossPromoInner}>
                      <Text style={styles.crossPromoEmoji}>💞</Text>
                      <Text style={styles.crossPromoText}>Aşk Enerjini Keşfet</Text>
                    </LinearGradient>
                  </Pressable>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/reading/kahve" as any); }}
                    style={styles.crossPromoCard}
                  >
                    <LinearGradient colors={["#1A0E05", "#0D0820"]} style={styles.crossPromoInner}>
                      <Text style={styles.crossPromoEmoji}>☕</Text>
                      <Text style={styles.crossPromoText}>Günün Kahve Falı</Text>
                    </LinearGradient>
                  </Pressable>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/reading/ruya" as any); }}
                    style={styles.crossPromoCard}
                  >
                    <LinearGradient colors={["#051A18", "#0D0820"]} style={styles.crossPromoInner}>
                      <Text style={styles.crossPromoEmoji}>🌙</Text>
                      <Text style={styles.crossPromoText}>Rüya Yorumu</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { paddingHorizontal: 18, gap: 14 },

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

  // Teaser
  teaserCard: { borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder },
  teaserCardInner: { padding: 20, gap: 10 },
  teaserLabel: { fontSize: 10, fontFamily: "Lora_700Bold", color: Colors.textSecondary, letterSpacing: 2, textTransform: "uppercase" },
  teaserText: { fontSize: 16, fontFamily: "Lora_400Regular_Italic", color: Colors.text, lineHeight: 26 },

  // Section heading
  sectionHeading: { fontSize: 11, fontFamily: "Lora_700Bold", color: Colors.textSecondary, letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 },

  // Lucky
  luckyRow: { flexDirection: "row", gap: 10 },
  luckyCard: {
    flex: 1, borderRadius: 14, padding: 14, alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  luckyColorDot: { width: 18, height: 18, borderRadius: 9 },
  luckyValue: { fontSize: 22, fontFamily: "Lora_700Bold", color: Colors.text },
  luckyLabel: { fontSize: 10, fontFamily: "Lora_400Regular", color: Colors.textSecondary, letterSpacing: 0.5, textAlign: "center" },

  // Compatible signs
  compatCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder },
  compatCardInner: { padding: 16, gap: 12 },
  compatHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  compatTitle: { fontSize: 12, fontFamily: "Lora_700Bold", letterSpacing: 0.5 },
  compatSignRow: { flexDirection: "row", gap: 10 },
  compatSignChip: {
    flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center", gap: 4,
    borderWidth: 1,
  },
  compatSignEmoji: { fontSize: 20 },
  compatSignName: { fontSize: 11, fontFamily: "Lora_700Bold" },
  compatLinkRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 2 },
  compatLinkText: { fontSize: 11, fontFamily: "Lora_400Regular_Italic", color: Colors.textDim },

  // Tarot widget
  tarotWidget: { borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: Colors.purple + "40" },
  tarotWidgetInner: { flexDirection: "row", alignItems: "center", padding: 14, gap: 14 },
  tarotWidgetLeft: {
    width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: Colors.purple + "50",
    backgroundColor: Colors.purple + "15", alignItems: "center", justifyContent: "center",
  },
  tarotWidgetSymbol: { fontSize: 13, fontFamily: "Lora_700Bold", color: Colors.purple },
  tarotWidgetContent: { flex: 1, gap: 3 },
  tarotWidgetMeta: { fontSize: 9, fontFamily: "Lora_400Regular", color: Colors.purple, letterSpacing: 2 },
  tarotWidgetName: { fontSize: 16, fontFamily: "Lora_700Bold", color: Colors.text },
  tarotWidgetSummary: { fontSize: 12, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, lineHeight: 18 },

  // Universe message
  universeCard: { borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: Colors.gold + "20" },
  universeCardInner: { padding: 16, gap: 8 },
  universeMeta: { fontSize: 10, fontFamily: "Lora_700Bold", color: Colors.gold, letterSpacing: 2 },
  universeText: { fontSize: 14, fontFamily: "Lora_400Regular_Italic", color: Colors.text, lineHeight: 22 },

  // CTA
  ctaWrap: { alignItems: "center", gap: 10 },
  ctaBtn: { borderRadius: 14, overflow: "hidden", width: "100%" },
  ctaBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 10 },
  ctaBtnText: { fontSize: 16, fontFamily: "Lora_700Bold", color: "#fff" },
  ctaCostBadge: { backgroundColor: "rgba(0,0,0,0.3)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  ctaCostText: { fontSize: 12, fontFamily: "Lora_700Bold", color: "#fff" },
  noGoldHint: { fontSize: 11, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, textAlign: "center" },

  // Full reading
  fullReadingCard: { borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: Colors.gold + "30" },
  fullReadingCardInner: { padding: 16, gap: 12 },
  fullReadingHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  fullReadingLabel: { fontSize: 11, fontFamily: "Lora_700Bold", letterSpacing: 2 },
  fullReadingText: { fontSize: 15, fontFamily: "Lora_400Regular", color: Colors.text, lineHeight: 26 },
  doneTag: { alignSelf: "center", paddingTop: 8 },
  doneTagText: { fontSize: 11, fontFamily: "Lora_400Regular_Italic", color: Colors.gold + "80", letterSpacing: 2 },

  // Weekly
  weeklyCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.gold + "25" },
  weeklyCardInner: { padding: 16, gap: 10 },
  weeklyHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  weeklyTitle: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.gold, letterSpacing: 0.5 },
  weeklyText: { fontSize: 14, fontFamily: "Lora_400Regular_Italic", color: Colors.text, lineHeight: 22 },

  // Tomorrow
  tomorrowCard: { borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder },
  tomorrowCardInner: { padding: 14 },
  tomorrowRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  tomorrowTitle: { fontSize: 13, fontFamily: "Lora_700Bold", marginBottom: 2 },
  tomorrowSub: { fontSize: 11, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary },
  tomorrowBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  tomorrowBadgeText: { fontSize: 13, fontFamily: "Lora_700Bold" },

  // Cross promo
  crossPromoWrap: { gap: 10 },
  crossPromoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  crossPromoCard: { width: "47.5%", borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder },
  crossPromoInner: { padding: 16, alignItems: "center", gap: 8 },
  crossPromoEmoji: { fontSize: 26 },
  crossPromoText: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.textSecondary, textAlign: "center", lineHeight: 17 },

  // Loading & Error
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  loadingText: { fontSize: 13, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary },
  errorBox: { borderRadius: 14, borderWidth: 1, borderColor: "#E05555" + "40", backgroundColor: "#E0555510", padding: 16, gap: 10 },
  errorText: { fontSize: 13, fontFamily: "Lora_400Regular", color: "#E05555", textAlign: "center" },
  retryBtn: { alignSelf: "center", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.surface },
  retryText: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.text },

  // Selector
  selectorWrap: { gap: 16 },
  selectorTitle: { fontSize: 22, fontFamily: "Lora_700Bold", color: Colors.text, textAlign: "center" },
  selectorSub: { fontSize: 13, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, textAlign: "center" },
  zodiacGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  zodiacItem: { borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder },
  zodiacItemInner: { width: 80, height: 80, alignItems: "center", justifyContent: "center", gap: 4 },
  zodiacEmoji: { fontSize: 26 },
  zodiacName: { fontSize: 11, fontFamily: "Lora_700Bold" },
});
