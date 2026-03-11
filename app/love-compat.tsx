import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, Platform, ActivityIndicator, Share, Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn, FadeInDown, FadeInUp, ZoomIn,
  useSharedValue, useAnimatedStyle, withTiming, withRepeat,
  withSequence, withSpring, Easing,
} from "react-native-reanimated";
import { router } from "expo-router";
import { fetch } from "expo/fetch";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { getApiUrl } from "@/lib/query-client";
import InsufficientGoldModal from "@/components/InsufficientGoldModal";

const { width } = Dimensions.get("window");
const GOLD_COST = 6;

// ─── Zodiac data ─────────────────────────────────────────────────────────────
const ELEMENTS: Record<string, "ateş" | "toprak" | "hava" | "su"> = {
  "Koç": "ateş", "Aslan": "ateş", "Yay": "ateş",
  "Boğa": "toprak", "Başak": "toprak", "Oğlak": "toprak",
  "İkizler": "hava", "Terazi": "hava", "Kova": "hava",
  "Yengeç": "su", "Akrep": "su", "Balık": "su",
};
const ZODIAC_LIST = Object.keys(ELEMENTS);

// Element uyum matrisi (base 0-100)
const ELEM_COMPAT: Record<string, Record<string, number>> = {
  ateş:   { ateş: 78, toprak: 52, hava: 84, su: 56 },
  toprak: { ateş: 52, toprak: 74, hava: 55, su: 80 },
  hava:   { ateş: 84, toprak: 55, hava: 76, su: 60 },
  su:     { ateş: 56, toprak: 80, hava: 60, su: 82 },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface LoveFormData {
  name1: string; name2: string;
  year1: string; year2: string;
  zodiac1: string; zodiac2: string;
  relStatus: string; expectation: string; curiosity: string;
  howMet: string; theyHide: string; distancing: string;
}
interface LoveScores {
  love: number; passion: number; trust: number;
  future: number; communication: number;
}

// ─── Score engine (deterministic) ─────────────────────────────────────────────
function scoreHash(a: string, b: string): number {
  let h = 0;
  for (const c of (a + b)) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return h % 13; // 0-12
}

function calcScores(d: LoveFormData): LoveScores {
  const e1 = ELEMENTS[d.zodiac1] || "ateş";
  const e2 = ELEMENTS[d.zodiac2] || "su";
  const base = ELEM_COMPAT[e1][e2];
  const nameVariance = scoreHash(d.name1, d.name2); // 0-12

  const relAdj: Record<string, number> = {
    "Yeni tanıştık": 2, "Flört ediyoruz": 5, "İlişkimiz var": 8,
    "Evliyiz": 12,
    "Ayrıyız ama konuşuyoruz": -15, "Platonik": -5, "Eski sevgili": -10,
  };
  const expAdj: Record<string, number> = {
    "Ciddi ilişki": 4, "Evlilik": 5, "Flört": 2, "Barışma": -2, "Sadece merak ediyorum": 0,
  };
  const r = relAdj[d.relStatus] ?? 0;
  const e = expAdj[d.expectation] ?? 0;

  const love = Math.min(97, Math.max(38, base + r + nameVariance));
  const passion = Math.min(95, Math.max(35,
    base + (e1 === "ateş" || e2 === "ateş" ? 8 : 0) +
    (d.relStatus === "Yeni tanıştık" ? 10 : 0) + nameVariance - 4
  ));
  const trust = Math.min(95, Math.max(30,
    base + r - (d.relStatus === "Ayrıyız ama konuşuyoruz" ? 8 : 0) +
    (d.relStatus === "Evliyiz" ? 6 : 4) + nameVariance - 2
  ));
  const future = Math.min(97, Math.max(30,
    base + e + r / 2 + nameVariance - 5
  ));
  const communication = Math.min(95, Math.max(35,
    (base * 0.7 + scoreHash(d.zodiac1, d.zodiac2) * 2 + nameVariance)
  ));
  return {
    love: Math.round(love),
    passion: Math.round(passion),
    trust: Math.round(trust),
    future: Math.round(future),
    communication: Math.round(communication),
  };
}

// ─── Teaser micro-text generator ──────────────────────────────────────────────
function genTeaserLines(d: LoveFormData, s: LoveScores): string[] {
  const lines: string[] = [];

  // Line 1 — genel uyum yorumu
  if (s.love >= 80)
    lines.push(`${d.name1} ile ${d.name2} arasında nadir görülen güçlü bir enerji tespit edildi...`);
  else if (s.love >= 65)
    lines.push(`${d.name1} ve ${d.name2} arasında güçlü ama henüz keşfedilmemiş bir bağ var...`);
  else
    lines.push("İki enerji arasında dikkat çeken bir gerilim ve çekim aynı anda hissediliyor...");

  // Line 2 — trust / passion yorumu
  if (s.trust < 55)
    lines.push("Güven katmanında gizli bir kırılganlık öne çıkıyor olabilir...");
  else if (s.passion > 78)
    lines.push("Tutkusal çekim beklenenden çok daha derin bir noktaya işaret ediyor...");
  else
    lines.push("İki ruhun birbirini çektiği ama henüz tam anlaşamadığı net biçimde hissediliyor...");

  // Line 3 — ilişki durumu / gelecek
  if (d.relStatus === "Ayrıyız ama konuşuyoruz" || d.relStatus === "Eski sevgili")
    lines.push("Bu ilişkinin kaderinde net bir kırılma ya da yeniden birleşme noktası görünüyor...");
  else if (d.relStatus === "Evliyiz")
    lines.push("Evlilik bağında görünmez ama belirleyici bir dönüşüm noktası yaklaşıyor...");
  else if (s.future > 75)
    lines.push("İleride bu bağın çok farklı ve güçlü bir boyut kazanabileceği hissediliyor...");
  else
    lines.push("Bu ilişkinin kaderinde kritik bir dönüşüm noktası yaklaşıyor...");

  lines.push("Devamında en kritik detay sana özel olarak açığa çıkacak...");
  return lines;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
const STEPS = 6;

function StepProgress({ current }: { current: number }) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: STEPS }).map((_, i) => (
        <View key={i} style={[styles.progressDot, i < current && styles.progressDotActive,
          i === current - 1 && styles.progressDotCurrent]} />
      ))}
      <Text style={styles.progressLabel}>{current}/{STEPS}</Text>
    </View>
  );
}

function StepHint({ text }: { text: string }) {
  return <Text style={styles.stepHint}>{text}</Text>;
}

function ChipSelect({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <View style={styles.chipGrid}>
      {options.map(opt => (
        <Pressable key={opt} onPress={() => { Haptics.selectionAsync(); onChange(opt); }}
          style={[styles.chip, value === opt && styles.chipActive]}>
          <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}


function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const width_ = useSharedValue(0);
  useEffect(() => { width_.value = withTiming(value, { duration: 900, easing: Easing.out(Easing.exp) }); }, [value]);
  const barStyle = useAnimatedStyle(() => ({ width: `${width_.value}%` as any }));
  return (
    <View style={styles.scoreBarRow}>
      <View style={styles.scoreBarLabelRow}>
        <Text style={styles.scoreBarLabel}>{label}</Text>
        <Text style={[styles.scoreBarPct, { color }]}>%{value}</Text>
      </View>
      <View style={styles.scoreBarTrack}>
        <Animated.View style={[styles.scoreBarFill, { backgroundColor: color }, barStyle]} />
      </View>
    </View>
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────
const LOADING_LINES = [
  "Enerjiler analiz ediliyor...",
  "İsimler ve burçlar yorumlanıyor...",
  "Kalpler arasındaki titreşim hesaplanıyor...",
  "Duygusal frekanslar karşılaştırılıyor...",
  "Ruhsal bağ değerlendiriliyor...",
];
function LoveLoadingScreen() {
  const [lineIdx, setLineIdx] = useState(0);
  const heartScale = useSharedValue(1);
  useEffect(() => {
    heartScale.value = withRepeat(withSequence(
      withTiming(1.2, { duration: 700 }),
      withTiming(1, { duration: 700 }),
    ), -1);
    const t = setInterval(() => setLineIdx(i => (i + 1) % LOADING_LINES.length), 1200);
    return () => clearInterval(t);
  }, []);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));
  return (
    <View style={styles.loadingContainer}>
      <Animated.Text style={[styles.loadingHeart, heartStyle]}>❤️</Animated.Text>
      <Text style={styles.loadingTitle}>Tengri analiz ediyor...</Text>
      <Animated.Text key={lineIdx} entering={FadeIn.duration(400)} style={styles.loadingLine}>
        {LOADING_LINES[lineIdx]}
      </Animated.Text>
      <ActivityIndicator color={Colors.gold} style={{ marginTop: 24 }} />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function LoveCompatScreen() {
  const insets = useSafeAreaInsets();
  const { goldBalance, spendGold, addReading } = useApp();
  const { lang } = useLang();
  const scrollRef = useRef<ScrollView>(null);

  // ── Screen state
  type Phase = "form" | "loading" | "preview" | "streaming" | "result";
  const [phase, setPhase] = useState<Phase>("form");
  const [step, setStep] = useState(1);
  const [showGoldModal, setShowGoldModal] = useState(false);

  // ── Form data
  const [data, setData] = useState<LoveFormData>({
    name1: "", name2: "", year1: "", year2: "",
    zodiac1: "", zodiac2: "",
    relStatus: "", expectation: "", curiosity: "",
    howMet: "", theyHide: "", distancing: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoveFormData, string>>>({});

  // ── Result state
  const [scores, setScores] = useState<LoveScores | null>(null);
  const [teaserLines, setTeaserLines] = useState<string[]>([]);
  const [fullText, setFullText] = useState("");
  const [readingId, setReadingId] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const upd = (k: keyof LoveFormData, v: string) => {
    setData(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  // ── Validation per step
  const validate = (): boolean => {
    const e: Partial<Record<keyof LoveFormData, string>> = {};
    if (step === 1) {
      if (!data.name1.trim()) e.name1 = "Adın gerekli";
      if (!data.name2.trim()) e.name2 = "Partner adı gerekli";
    }
    if (step === 2) {
      const y1 = parseInt(data.year1); const y2 = parseInt(data.year2);
      if (!data.year1 || isNaN(y1) || y1 < 1920 || y1 > 2010) e.year1 = "Geçerli bir yıl gir (1920-2010)";
      if (!data.year2 || isNaN(y2) || y2 < 1920 || y2 > 2010) e.year2 = "Geçerli bir yıl gir (1920-2010)";
    }
    if (step === 3) {
      if (!data.zodiac1) e.zodiac1 = "Burcunu seç";
      if (!data.zodiac2) e.zodiac2 = "Partner burcunu seç";
    }
    if (step === 4 && !data.relStatus) e.relStatus = "İlişki durumunu seç";
    if (step === 5 && !data.expectation) e.expectation = "Beklentini seç";
    if (step === 6 && !data.curiosity) e.curiosity = "En çok merak ettiğini seç";
    setErrors(e);
    if (Object.keys(e).length > 0) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return false; }
    return true;
  };

  const nextStep = () => {
    if (!validate()) return;
    if (step < STEPS) { setStep(s => s + 1); scrollRef.current?.scrollTo({ y: 0, animated: true }); }
    else startAnalysis();
  };

  // ── Preview generation (local, no API)
  const startAnalysis = async () => {
    setPhase("loading");
    const s = calcScores(data);
    const t = genTeaserLines(data, s);
    await new Promise(r => setTimeout(r, 3500));
    setScores(s);
    setTeaserLines(t);
    setPhase("preview");
  };

  // ── Detailed result (AI, costs gold)
  const unlockDetail = async () => {
    if (!spendGold(GOLD_COST)) { setShowGoldModal(true); return; }
    setPhase("streaming");
    setFullText("");
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    try {
      const prompt = buildPrompt(data, scores!);
      const url = new URL("/api/reading", getApiUrl());
      const res = await fetch(url.toString(), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: "ask", userInput: prompt }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = ""; let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.content) { full += evt.content; setFullText(full); }
            if (evt.done) {
              setPhase("result");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              const rid = await addReading({ service: "ask", serviceLabel: "Aşk Uyumu", content: full, userInput: prompt });
              setReadingId(rid);
            }
          } catch {}
        }
      }
    } catch {
      setPhase("preview");
    }
  };

  // ── Build rich prompt
  function buildPrompt(d: LoveFormData, s: LoveScores): string {
    return `Aşk uyumu analizi:
Ad 1: ${d.name1} | Yıl: ${d.year1} | Burç: ${d.zodiac1}
Ad 2: ${d.name2} | Yıl: ${d.year2} | Burç: ${d.zodiac2}
İlişki durumu: ${d.relStatus}
Beklenti: ${d.expectation}
Merak: ${d.curiosity}
Puanlar — Uyum: %${s.love}, Tutku: %${s.passion}, Güven: %${s.trust}, Gelecek: %${s.future}, İletişim: %${s.communication}

Lütfen şu bölümleri sırasıyla yaz (her birini kalın başlıkla):
**Genel Uyum**
**Duygusal Bağ**
**Tutku ve Çekim**
**Güven Seviyesi**
**Gelecek Potansiyeli**
**Partnerinin Gizli Duyguları**
**Dikkat Edilmesi Gereken**

İsimleri metinde kullan. Burçları ve ilişki durumunu yansıt. "${d.curiosity}" sorusunu sonuca dahil et. Mistik, bilge, kişisel bir dil kullan. Türkçe. 350-400 kelime.`;
  }

  const canUnlock = goldBalance >= GOLD_COST;

  // ── Mini share card
  const shareCard = () => {
    if (!scores) return;
    const txt = `❤️ ${data.name1} & ${data.name2}\nAşk Uyumu: %${scores.love}\nTUTKU: %${scores.passion} | GÜVEN: %${scores.trust}\n\nTENGRI uygulamasından — tengristar.com`;
    Share.share({ message: txt });
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={["#1A0508", "#0D0C1A", "#070D1A"]} style={styles.root}>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: botPad + 40 }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
          </Pressable>
          <Text style={styles.headerTitle}>Aşk Uyumu</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* ── FORM ─────────────────────────────────────────────────── */}
        {phase === "form" && (
          <Animated.View entering={FadeIn} style={styles.section}>
            <StepProgress current={step} />

            {step === 1 && (
              <Animated.View entering={FadeInDown.springify()} style={styles.card}>
                <StepHint>Yorumun sana özel hazırlanması için birkaç detay gerekli...</StepHint>
                <Text style={styles.fieldLabel}>Senin adın</Text>
                <TextInput style={[styles.input, errors.name1 && styles.inputError]}
                  placeholder="Adını yaz..." placeholderTextColor={Colors.textDim}
                  value={data.name1} onChangeText={v => upd("name1", v)} />
                {errors.name1 && <Text style={styles.errText}>{errors.name1}</Text>}

                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Partnerinin adı</Text>
                <TextInput style={[styles.input, errors.name2 && styles.inputError]}
                  placeholder="Partnerinin adını yaz..." placeholderTextColor={Colors.textDim}
                  value={data.name2} onChangeText={v => upd("name2", v)} />
                {errors.name2 && <Text style={styles.errText}>{errors.name2}</Text>}
              </Animated.View>
            )}

            {step === 2 && (
              <Animated.View entering={FadeInDown.springify()} style={styles.card}>
                <StepHint>İsimler ve doğum enerjileri aşk bağını doğrudan etkiler...</StepHint>
                <Text style={styles.fieldLabel}>Senin doğum yılın</Text>
                <TextInput style={[styles.input, errors.year1 && styles.inputError]}
                  placeholder="Örn: 1995" placeholderTextColor={Colors.textDim}
                  value={data.year1} onChangeText={v => upd("year1", v.replace(/[^0-9]/g, ""))}
                  keyboardType="numeric" maxLength={4} />
                {errors.year1 && <Text style={styles.errText}>{errors.year1}</Text>}

                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Partnerinin doğum yılı</Text>
                <TextInput style={[styles.input, errors.year2 && styles.inputError]}
                  placeholder="Örn: 1993" placeholderTextColor={Colors.textDim}
                  value={data.year2} onChangeText={v => upd("year2", v.replace(/[^0-9]/g, ""))}
                  keyboardType="numeric" maxLength={4} />
                {errors.year2 && <Text style={styles.errText}>{errors.year2}</Text>}
              </Animated.View>
            )}

            {step === 3 && (
              <Animated.View entering={FadeInDown.springify()} style={styles.card}>
                <StepHint>Burç enerjileri ruhsal çekimin sırrını taşır...</StepHint>
                <Text style={styles.fieldLabel}>Senin burcun</Text>
                {errors.zodiac1 && <Text style={styles.errText}>{errors.zodiac1}</Text>}
                <ChipSelect options={ZODIAC_LIST} value={data.zodiac1} onChange={v => upd("zodiac1", v)} />

                <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Partnerinin burcu</Text>
                {errors.zodiac2 && <Text style={styles.errText}>{errors.zodiac2}</Text>}
                <ChipSelect options={ZODIAC_LIST} value={data.zodiac2} onChange={v => upd("zodiac2", v)} />
              </Animated.View>
            )}

            {step === 4 && (
              <Animated.View entering={FadeInDown.springify()} style={styles.card}>
                <StepHint>İlişki durumu yorumun tonunu ve derinliğini belirler...</StepHint>
                <Text style={styles.fieldLabel}>Şu anki ilişki durumunuz</Text>
                {errors.relStatus && <Text style={styles.errText}>{errors.relStatus}</Text>}
                <ChipSelect
                  options={["Yeni tanıştık", "Flört ediyoruz", "İlişkimiz var", "Evliyiz", "Ayrıyız ama konuşuyoruz", "Platonik", "Eski sevgili"]}
                  value={data.relStatus} onChange={v => upd("relStatus", v)} />
              </Animated.View>
            )}

            {step === 5 && (
              <Animated.View entering={FadeInDown.springify()} style={styles.card}>
                <StepHint>Niyetin, analizin derinliğini ve yönünü belirler...</StepHint>
                <Text style={styles.fieldLabel}>Bu ilişkiden beklentin ne?</Text>
                {errors.expectation && <Text style={styles.errText}>{errors.expectation}</Text>}
                <ChipSelect
                  options={["Ciddi ilişki", "Evlilik", "Flört", "Barışma", "Sadece merak ediyorum"]}
                  value={data.expectation} onChange={v => upd("expectation", v)} />
              </Animated.View>
            )}

            {step === 6 && (
              <Animated.View entering={FadeInDown.springify()} style={styles.card}>
                <StepHint>Son bir adım — sana özel yorumun hazırlanıyor...</StepHint>
                <Text style={styles.fieldLabel}>En çok neyi merak ediyorsun?</Text>
                {errors.curiosity && <Text style={styles.errText}>{errors.curiosity}</Text>}
                <ChipSelect
                  options={["Beni gerçekten seviyor mu?", "Beni düşünüyor mu?", "Geri dönecek mi?", "İlişkimizin geleceği var mı?", "Aramızda güçlü çekim var mı?", "Benden uzaklaşıyor mu?"]}
                  value={data.curiosity} onChange={v => upd("curiosity", v)} />
              </Animated.View>
            )}

            {/* Navigation buttons */}
            <View style={styles.navRow}>
              {step > 1 && (
                <Pressable onPress={() => setStep(s => s - 1)} style={styles.backStepBtn}>
                  <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} />
                  <Text style={styles.backStepText}>Geri</Text>
                </Pressable>
              )}
              <Pressable onPress={nextStep} style={[styles.nextBtn, step === 1 && { flex: 1 }]}>
                <LinearGradient colors={[Colors.gold, "#8B6914"]} style={styles.nextBtnInner}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.nextBtnText}>{step < STEPS ? "Devam Et" : "Analizi Başlat"}</Text>
                  <Ionicons name={step < STEPS ? "chevron-forward" : "heart"} size={16} color="#000" />
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* ── LOADING ──────────────────────────────────────────────── */}
        {phase === "loading" && <LoveLoadingScreen />}

        {/* ── PREVIEW ──────────────────────────────────────────────── */}
        {(phase === "preview" || phase === "streaming" || phase === "result") && scores && (
          <Animated.View entering={FadeInUp.springify()} style={styles.section}>

            {/* Score bars */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="analytics-outline" size={15} color={Colors.gold} />
                <Text style={styles.cardHeaderText}>UYUM ANALİZİ</Text>
              </View>
              <Text style={styles.namesDisplay}>{data.name1} ❤️ {data.name2}</Text>
              <ScoreBar label="Aşk Uyumu" value={scores.love} color="#FF4757" />
              <ScoreBar label="Tutku" value={scores.passion} color="#FF6B9D" />
              <ScoreBar label="Güven" value={scores.trust} color="#4CAF7A" />
              <ScoreBar label="Gelecek Potansiyeli" value={scores.future} color={Colors.gold} />
              <ScoreBar label="İletişim Gücü" value={scores.communication} color="#5B9BD5" />
            </View>

            {/* Teaser micro-texts */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="eye-outline" size={15} color={Colors.gold} />
                <Text style={styles.cardHeaderText}>ÖN ANALİZ</Text>
              </View>
              {teaserLines.map((line, i) => (
                <Animated.View key={i} entering={FadeInDown.delay(i * 120).springify()} style={styles.teaserLine}>
                  <Ionicons name="radio-button-on" size={7} color={Colors.gold + "90"} style={{ marginTop: 6 }} />
                  <Text style={styles.teaserText}>{line}</Text>
                </Animated.View>
              ))}
            </View>

            {/* Streaming result */}
            {(phase === "streaming" || phase === "result") && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="heart-outline" size={15} color="#FF4757" />
                  <Text style={styles.cardHeaderText}>DETAYLI YORUM</Text>
                </View>
                <Text style={styles.resultText}>{fullText}</Text>
                {phase === "streaming" && <ActivityIndicator color={Colors.gold} style={{ marginTop: 12 }} />}
              </View>
            )}

            {/* Share mini card (after result) */}
            {phase === "result" && (
              <Animated.View entering={ZoomIn.springify()} style={styles.shareCard}>
                <LinearGradient colors={["#1A0508", "#1A0820"]} style={styles.shareCardInner}>
                  <Text style={styles.shareCardNames}>{data.name1} ❤️ {data.name2}</Text>
                  <Text style={styles.shareCardScore}>Aşk Uyumu: %{scores.love}</Text>
                  <View style={styles.shareCardMini}>
                    <Text style={styles.shareCardMiniItem}>TUTKU %{scores.passion}</Text>
                    <Text style={styles.shareCardMiniDot}>·</Text>
                    <Text style={styles.shareCardMiniItem}>GÜVEN %{scores.trust}</Text>
                    <Text style={styles.shareCardMiniDot}>·</Text>
                    <Text style={styles.shareCardMiniItem}>GELECEK %{scores.future}</Text>
                  </View>
                  <Text style={styles.shareCardBrand}>✦ TENGRI · tengristar.com ✦</Text>
                </LinearGradient>
                <Pressable onPress={shareCard} style={styles.shareCardBtn}>
                  <Ionicons name="share-social-outline" size={15} color={Colors.gold} />
                  <Text style={styles.shareCardBtnText}>Bu kartı paylaş</Text>
                </Pressable>
              </Animated.View>
            )}

            {/* LOCKED section */}
            {phase === "preview" && (
              <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.lockedCard}>
                <LinearGradient colors={["#1A0508", "#0D0C1A"]} style={styles.lockedCardInner}>
                  <View style={styles.lockIconWrap}>
                    <Ionicons name="lock-closed" size={28} color={Colors.gold} />
                  </View>

                  {/* Micro-texts that tease the locked content */}
                  <Text style={styles.lockedTease}>
                    Partnerinin sakladığı bir duygu öne çıkıyor olabilir...
                  </Text>
                  <Text style={styles.lockedTease2}>
                    Detaylı analiz; duygusal bağ, tutku, güven, gelecek potansiyeli ve gizli duyguları içeriyor.
                  </Text>

                  <View style={styles.lockedDivider} />

                  {/* Campaign hint */}
                  <Text style={styles.campaignHint}>✦ İlk aşk uyumu yorumuna özel ✦</Text>

                  <Pressable onPress={unlockDetail} style={styles.unlockBtn}>
                    <LinearGradient colors={["#FF4757", "#C0932A"]} style={styles.unlockBtnInner}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Ionicons name="lock-open-outline" size={18} color="#fff" />
                      <Text style={styles.unlockBtnText}>Detaylı Yorumu Aç  ·  {GOLD_COST} ✦</Text>
                    </LinearGradient>
                  </Pressable>
                  <Text style={styles.lockedGoldHint}>Mevcut altın: {goldBalance} ✦</Text>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Start over */}
            <Pressable onPress={() => { setPhase("form"); setStep(1); setFullText(""); setScores(null); }}
              style={styles.startOver}>
              <Ionicons name="refresh-outline" size={13} color={Colors.textDim} />
              <Text style={styles.startOverText}>Yeniden analiz et</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      <InsufficientGoldModal
        visible={showGoldModal}
        onClose={() => setShowGoldModal(false)}
        serviceLabel="Aşk Uyumu"
        goldCost={GOLD_COST}
        goldBalance={goldBalance}
      />
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  section: { paddingHorizontal: 16, gap: 14 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: Colors.surface },
  headerTitle: { fontSize: 17, fontFamily: "Lora_700Bold", color: Colors.text, letterSpacing: 0.5 },

  progressRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16, paddingHorizontal: 4 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.cardBorder },
  progressDotActive: { backgroundColor: Colors.gold + "60", width: 10, height: 10, borderRadius: 5 },
  progressDotCurrent: { backgroundColor: Colors.gold, width: 12, height: 12, borderRadius: 6 },
  progressLabel: { marginLeft: "auto" as any, fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary },

  stepHint: { fontSize: 12, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, marginBottom: 18, lineHeight: 18 },

  card: { backgroundColor: Colors.surface, borderRadius: 18, borderWidth: 1, borderColor: Colors.cardBorder, padding: 18, gap: 4 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 },
  cardHeaderText: { fontSize: 10, fontFamily: "Lora_700Bold", color: Colors.gold, letterSpacing: 2 },

  fieldLabel: { fontSize: 13, fontFamily: "Lora_700Bold", color: Colors.text, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.cardBorder, color: Colors.text, fontFamily: "Lora_400Regular",
    fontSize: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  inputError: { borderColor: Colors.error },
  errText: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.error, marginTop: 4 },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.surfaceElevated },
  chipActive: { borderColor: Colors.gold, backgroundColor: Colors.gold + "20" },
  chipText: { fontSize: 12, fontFamily: "Lora_400Regular", color: Colors.textSecondary },
  chipTextActive: { color: Colors.gold, fontFamily: "Lora_700Bold" },

  navRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  backStepBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder },
  backStepText: { fontSize: 13, fontFamily: "Lora_400Regular", color: Colors.textSecondary },
  nextBtn: { flex: 2, borderRadius: 14, overflow: "hidden" },
  nextBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  nextBtnText: { fontSize: 15, fontFamily: "Lora_700Bold", color: "#000" },

  // Loading
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 16, paddingHorizontal: 32 },
  loadingHeart: { fontSize: 52 },
  loadingTitle: { fontSize: 18, fontFamily: "Lora_700Bold", color: Colors.text },
  loadingLine: { fontSize: 13, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, textAlign: "center" },

  // Score bars
  namesDisplay: { fontSize: 16, fontFamily: "Lora_700Bold", color: Colors.text, textAlign: "center", marginBottom: 16 },
  scoreBarRow: { gap: 5, marginBottom: 10 },
  scoreBarLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  scoreBarLabel: { fontSize: 12, fontFamily: "Lora_400Regular", color: Colors.textSecondary },
  scoreBarPct: { fontSize: 12, fontFamily: "Lora_700Bold" },
  scoreBarTrack: { height: 6, backgroundColor: Colors.cardBorder, borderRadius: 3, overflow: "hidden" },
  scoreBarFill: { height: "100%", borderRadius: 3 },

  // Teaser
  teaserLine: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 10 },
  teaserText: { flex: 1, fontSize: 13, fontFamily: "Lora_400Regular_Italic", color: Colors.text, lineHeight: 20 },

  // Detailed result
  resultText: { fontSize: 14, fontFamily: "Lora_400Regular", color: Colors.text, lineHeight: 24 },

  // Locked section
  lockedCard: { borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: Colors.gold + "40" },
  lockedCardInner: { padding: 24, alignItems: "center", gap: 10 },
  lockIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.gold + "15", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.gold + "40", marginBottom: 4 },
  lockedTease: { fontSize: 13, fontFamily: "Lora_400Regular_Italic", color: Colors.text, textAlign: "center", lineHeight: 20 },
  lockedTease2: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 17 },
  lockedDivider: { width: 40, height: 1, backgroundColor: Colors.gold + "30", marginVertical: 4 },
  campaignHint: { fontSize: 10, fontFamily: "Lora_700Bold", color: Colors.gold + "AA", letterSpacing: 1 },
  unlockBtn: { width: "100%", borderRadius: 14, overflow: "hidden", marginTop: 6 },
  unlockBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15 },
  unlockBtnText: { fontSize: 15, fontFamily: "Lora_700Bold", color: "#fff" },
  lockedGoldHint: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textDim },

  // Share card
  shareCard: { borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#FF4757" + "50" },
  shareCardInner: { padding: 20, alignItems: "center", gap: 6 },
  shareCardNames: { fontSize: 18, fontFamily: "Lora_700Bold", color: Colors.text },
  shareCardScore: { fontSize: 28, fontFamily: "Lora_700Bold", color: "#FF4757" },
  shareCardMini: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 4 },
  shareCardMiniItem: { fontSize: 10, fontFamily: "Lora_700Bold", color: Colors.textSecondary },
  shareCardMiniDot: { fontSize: 10, color: Colors.textDim },
  shareCardBrand: { fontSize: 9, fontFamily: "Lora_400Regular", color: Colors.gold + "80", letterSpacing: 1, marginTop: 6 },
  shareCardBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, backgroundColor: Colors.surface },
  shareCardBtnText: { fontSize: 13, fontFamily: "Lora_700Bold", color: Colors.gold },

  startOver: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  startOverText: { fontSize: 12, fontFamily: "Lora_400Regular", color: Colors.textDim },
});
