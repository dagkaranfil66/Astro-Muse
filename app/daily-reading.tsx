import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
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
import InsufficientGoldModal from "@/components/InsufficientGoldModal";
import { SectionedReading, parseKahveSections } from "@/components/SectionedReading";

// ─── Daily cosmic messages shown when free reading is already used ─────────────
const DAILY_COSMIC_MESSAGES_TR = [
  { title: "✦ Bugünün Enerjisi: Yeniden Doğuş", body: "Ay ışığı bugün sana özel bir mesaj taşıyor. Geçmişin gölgeleri çekilirken, yeni bir kapı aralanıyor. Kalbindeki en derin arzu bu hafta şekil almaya başlayacak. Sabırlı ol — evren senin için en güzeli hazırlıyor.", sign: "🌙 Ay enerjisi güçlü · ✦ Şans yüksek" },
  { title: "✦ Bugünün Enerjisi: Dönüşüm", body: "Yıldızlar bugün senin adına dans ediyor. İçindeki güç beklenmedik bir anda ortaya çıkacak. Zorlandığın şeylerde gizli bir nimet var; bugün o nimetin izini süreceksin. Bırak evren seni yönlendirsin.", sign: "⭐ Venüs etkisi aktif · 🔮 Sezgiler keskin" },
  { title: "✦ Bugünün Enerjisi: Işık Zamanı", body: "Kaderin sana özel bir şifre gönderiyor. Rastlantı gibi görünen her şey aslında birbiriyle bağlantılı. Bugün fark ettiğin küçük bir işaret, önümüzdeki günlerin anahtarı olabilir. Gözlerini aç, kulak ver.", sign: "☀ Güneş enerjisi parlak · ✨ Sihirli an yakın" },
  { title: "✦ Bugünün Enerjisi: Kalp Sesi", body: "Sevgi ve bağlantı enerjisi bugün seninle. Bir yakının sana düşünüyor, belki de söyleyemediği şeyler var. Bugün köprüler kurulacak, kırık bir şey onarılacak. Kalbini açık tut.", sign: "❤️ Kalp çakrası açık · 🌸 İyileşme zamanı" },
  { title: "✦ Bugünün Enerjisi: Bolluk Kapısı", body: "Maddi ve manevi bolluk için güçlü bir gün. Attığın her adım ileride büyük kazanımlara dönüşecek. Bugün verdiğin emek katlanarak geri gelecek. Şükret ve ilerle.", sign: "💫 Jüpiter destekli · 🌟 Bolluk enerjisi" },
  { title: "✦ Bugünün Enerjisi: Sırrın Zamanı", body: "Gizem dolu bir gün seni bekliyor. Cevabını aradığın soru yakında netleşecek. Sezgilerine güven — bugün içten gelen ses hiç bu kadar açık konuşmuyor. Sessiz ol ve dinle.", sign: "🔮 Sezgi güçlü · 🌌 Kozmik uyum tam" },
  { title: "✦ Bugünün Enerjisi: Cesaret Vakti", body: "Bugün cesaretine ihtiyacın olacak — ve o cesaret içinde hazır. Erteleyip durduğun bir şey için mükemmel zaman. Evren adım atmana izin veriyor, hatta teşvik ediyor. Kork ama yine de ilerle.", sign: "🔥 Mars enerjisi ateşli · ⚡ Karar zamanı" },
];

const DAILY_COSMIC_MESSAGES_EN = [
  { title: "✦ Today's Energy: Rebirth", body: "The moonlight carries a special message just for you today. As the shadows of the past recede, a new door is opening. Your deepest desire will begin to take shape this week. Be patient — the universe is preparing the best for you.", sign: "🌙 Moon energy strong · ✦ Luck elevated" },
  { title: "✦ Today's Energy: Transformation", body: "The stars are dancing for you today. A hidden strength inside you will emerge at an unexpected moment. There is a hidden blessing in your struggles; today you will trace it. Let the universe guide you.", sign: "⭐ Venus active · 🔮 Intuition sharp" },
  { title: "✦ Today's Energy: Light Time", body: "Destiny is sending you a special code. Everything that seems like coincidence is actually connected. A small sign you notice today could be the key to the days ahead. Open your eyes and listen.", sign: "☀ Solar energy bright · ✨ Magic moment near" },
  { title: "✦ Today's Energy: Heart's Call", body: "Love and connection energy is with you today. Someone close is thinking of you, perhaps with things left unsaid. Bridges will be built, something broken will be mended. Keep your heart open.", sign: "❤️ Heart chakra open · 🌸 Healing time" },
  { title: "✦ Today's Energy: Gate of Abundance", body: "A powerful day for material and spiritual abundance. Every step you take will turn into great gains ahead. The effort you put in today will multiply and return to you. Be grateful and move forward.", sign: "💫 Jupiter-aligned · 🌟 Abundance flowing" },
  { title: "✦ Today's Energy: Time of Secrets", body: "A mysterious day awaits you. The question you've been searching for will soon become clear. Trust your intuition — today the inner voice speaks more clearly than ever. Be still and listen.", sign: "🔮 Intuition strong · 🌌 Cosmic alignment full" },
  { title: "✦ Today's Energy: Courage Moment", body: "Today you will need courage — and that courage is already within you. The perfect time for something you've been putting off. The universe is permitting, even encouraging you to take a step. Be afraid and move forward anyway.", sign: "🔥 Mars energy fired · ⚡ Decision time" },
];

function getDailyCosmicMessage(lang: string) {
  const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_COSMIC_MESSAGES_TR.length;
  return lang === "tr" ? DAILY_COSMIC_MESSAGES_TR[dayIndex] : DAILY_COSMIC_MESSAGES_EN[dayIndex];
}

const DAILY_SERVICE = "kahve";

const SERVICE_META: Record<string, {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradient: [string, string];
  labelTR: string;
  labelEN: string;
  needsPhoto?: boolean;
  maxPhotos?: number;
}> = {
  samanizm:   { icon: "leaf-outline",      color: "#4CAF7A", gradient: ["#051A0D", "#070D1A"], labelTR: "Şamanizm",     labelEN: "Shamanism" },
  tarot:      { icon: "layers-outline",    color: "#E7B008", gradient: ["#1A1205", "#070D1A"], labelTR: "Tarot",        labelEN: "Tarot" },
  ruya:       { icon: "cloud-outline",     color: "#5B9BD5", gradient: ["#051020", "#070D1A"], labelTR: "Rüya Yorumu",  labelEN: "Dream Reading" },
  numeroloji: { icon: "star-outline",      color: "#E74C8B", gradient: ["#1A0510", "#070D1A"], labelTR: "Numeroloji",   labelEN: "Numerology" },
  ask:        { icon: "heart-outline",     color: "#FF4757", gradient: ["#1A0508", "#070D1A"], labelTR: "Aşkını Bul",   labelEN: "Love Reading" },
  kahve:      { icon: "cafe-outline",      color: "#C8843A", gradient: ["#1A0A05", "#070D1A"], labelTR: "Kahve Falı",      labelEN: "Coffee Reading", needsPhoto: true, maxPhotos: 3 },
  el:         { icon: "hand-left-outline", color: "#A07EE0", gradient: ["#100A20", "#070D1A"], labelTR: "El Falı",              labelEN: "Palm Reading",        needsPhoto: true, maxPhotos: 1 },
};

const TEASER_CHARS = 260;

type PhotoItem = { uri: string; base64: string; type: string };

function getTodayService() {
  return DAILY_SERVICE;
}

// ─── Ken Burns hero banner (same as Kahve Falı category screen) ──────────────
const SERVICE_HERO_IMAGES: Record<string, any> = {
  kahve:      require("@/assets/images/services/kahve.png"),
  el:         require("@/assets/images/services/el.png"),
  tarot:      require("@/assets/images/services/tarot.png"),
  ruya:       require("@/assets/images/services/ruya.png"),
  burclar:    require("@/assets/images/services/burclar.png"),
  numeroloji: require("@/assets/images/services/numeroloji.png"),
  astroloji:  require("@/assets/images/services/astroloji.png"),
  samanizm:   require("@/assets/images/services/samanizm.png"),
};

function ServiceHeroBanner({ serviceId, color }: { serviceId: string; color: string }) {
  const scale = useSharedValue(1.06);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1, { duration: 4000 }), withTiming(1.06, { duration: 4000 })),
      -1, true
    );
  }, []);
  const imgStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const img = SERVICE_HERO_IMAGES[serviceId];
  return (
    <View style={sHero.wrap}>
      {img && <Animated.Image source={img} style={[sHero.img, imgStyle]} resizeMode="cover" />}
      <LinearGradient
        colors={["transparent", color + "55", Colors.background]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.6, 1]}
      />
    </View>
  );
}
const sHero = StyleSheet.create({
  wrap: { width: "100%", height: 200, borderRadius: 18, overflow: "hidden", marginBottom: 12 },
  img: { width: "100%", height: "100%", position: "absolute" },
});

// ─── Shown when daily free reading is already used ───────────────────────────
function UsedDailyMessage({ lang }: { lang: string }) {
  const msg = getDailyCosmicMessage(lang);
  const twinkle = useSharedValue(0.4);
  React.useEffect(() => {
    twinkle.value = withRepeat(
      withSequence(withTiming(1, { duration: 1800 }), withTiming(0.4, { duration: 1800 })),
      -1, false
    );
  }, []);
  const twStyle = useAnimatedStyle(() => ({ opacity: twinkle.value }));
  return (
    <Animated.View entering={FadeIn.duration(600)}>
      <Animated.View style={[{ alignItems: "center", marginBottom: 12 }, twStyle]}>
        <Text style={{ fontSize: 32, color: Colors.gold }}>✦</Text>
      </Animated.View>
      <Text style={sMsgStyle.title}>{msg.title}</Text>
      <View style={sMsgStyle.divider} />
      <Text style={sMsgStyle.body}>{msg.body}</Text>
      <View style={sMsgStyle.signRow}>
        <Text style={sMsgStyle.sign}>{msg.sign}</Text>
      </View>
      <View style={sMsgStyle.tomorrowBadge}>
        <Ionicons name="time-outline" size={12} color={Colors.textDim} />
        <Text style={sMsgStyle.tomorrowText}>
          {lang === "tr"
            ? "Yarın yeni bir ücretsiz okuma seni bekliyor"
            : "A new free reading awaits you tomorrow"}
        </Text>
      </View>
    </Animated.View>
  );
}
const sMsgStyle = StyleSheet.create({
  title: {
    fontSize: 16, fontFamily: "Lora_700Bold",
    color: Colors.gold, textAlign: "center", marginBottom: 12, letterSpacing: 0.5,
  },
  divider: { height: 1, backgroundColor: Colors.gold + "30", marginBottom: 14 },
  body: {
    fontSize: 15, fontFamily: "Lora_400Regular_Italic",
    color: "#D4C8A8", textAlign: "center", lineHeight: 24, marginBottom: 14,
  },
  signRow: {
    alignItems: "center", backgroundColor: "rgba(200,160,32,0.08)",
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.gold + "25",
  },
  sign: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.gold, letterSpacing: 0.5 },
  tomorrowBadge: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, opacity: 0.55,
  },
  tomorrowText: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textDim },
});

export default function DailyReadingScreen() {
  const insets = useSafeAreaInsets();
  const { canDailyFree, markDailyFreeUsed, goldBalance, userProfile, mistikName, mistikBirthDate, mistikFocusArea } = useApp();
  const { lang } = useLang();

  // ── Auth guard: redirect to login if not signed in ──────────────────────
  React.useEffect(() => {
    if (!userProfile) {
      router.replace("/auth");
    }
  }, [userProfile]);

  const todayService = getTodayService();
  const meta = SERVICE_META[todayService] ?? SERVICE_META.tarot;
  const goldCost = SERVICE_GOLD_COST[todayService] ?? 3;
  const needsPhoto = !!meta.needsPhoto;
  const maxPhotos = meta.maxPhotos ?? 1;

  const [isLoading, setIsLoading] = useState(false);
  const [readingText, setReadingText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [userNote, setUserNote] = useState("");
  const [showGoldModal, setShowGoldModal] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const canStartReading = !needsPhoto || photos.length > 0 || userNote.trim().length > 0;

  const pickPhoto = async (useCamera: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (photos.length >= maxPhotos) return;
    let result: ImagePicker.ImagePickerResult;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Kamera erişimi için izin verin.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.7,
      });
    } else {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("İzin Gerekli", "Galerinize erişmek için izin verin.");
          return;
        }
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.7,
        allowsMultipleSelection: maxPhotos > 1,
        selectionLimit: maxPhotos - photos.length,
      });
    }
    if (result.canceled) return;
    const newPhotos: PhotoItem[] = result.assets.map((a) => ({
      uri: a.uri,
      base64: a.base64 ?? "",
      type: a.mimeType ?? "image/jpeg",
    }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, maxPhotos));
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFreeReading = async () => {
    if (isLoading || !canDailyFree || !canStartReading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setReadingText("");
    setIsDone(false);

    try {
      const apiBase = getApiUrl();
      const url = new URL("/api/reading/daily-free", apiBase);

      const body: Record<string, unknown> = { service: todayService, lang };
      if (photos.length > 0) {
        body.photos = photos.map((p) => ({ base64: p.base64, type: p.type }));
      }
      if (userNote.trim()) {
        body.userInput = userNote.trim();
      }
      if (mistikName) body.userName = mistikName;
      if (mistikBirthDate) body.birthDate = mistikBirthDate;
      if (mistikFocusArea) body.focusArea = mistikFocusArea;

      const resp = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      // Mark as used only AFTER a successful reading — prevents "used" on API failure
      await markDailyFreeUsed();
    } catch {
      setIsDone(true);
      // Don't mark as used if the reading failed
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
    if (goldBalance < goldCost) {
      setShowGoldModal(true);
      return;
    }
    if (todayService === "ask") { router.push("/love-compat" as any); return; }
    router.push(`/reading/${todayService}` as any);
  };

  const visibleText = readingText.slice(0, TEASER_CHARS);
  const hasHiddenText = isDone && readingText.length > TEASER_CHARS;

  return (
    <View style={s.container}>
      <LinearGradient colors={["#04080F", "#070D1A", meta.gradient[0]]} style={StyleSheet.absoluteFill} />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[s.scroll, { paddingTop: topPad + 16, paddingBottom: botPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
        </Pressable>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={s.hero}>
          {/* Ken Burns hero banner — same animation as category screen */}
          <ServiceHeroBanner serviceId={todayService} color={meta.color} />

          <Text style={s.heroLabel}>
            {lang === "tr" ? "✦ GÜNLÜK FAL ✦" : "✦ DAILY READING ✦"}
          </Text>
          <Text style={[s.heroService, { color: meta.color }]}>
            {lang === "tr" ? meta.labelTR : meta.labelEN}
          </Text>

          {/* Badges row */}
          <View style={s.badgeRow}>
            <View style={s.freeBadge}>
              <Text style={s.freeBadgeText}>{lang === "tr" ? "ÜCRETSİZ ÖN OKUMA" : "FREE PREVIEW"}</Text>
            </View>
            <View style={s.aiBadge}>
              <Ionicons name="sparkles" size={9} color="#A78BFA" />
              <Text style={s.aiBadgeText}>{lang === "tr" ? "AI DESTEKLİ" : "AI POWERED"}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Photo Picker (kahve/el) ── */}
        {needsPhoto && !readingText && (
          <Animated.View entering={FadeInDown.delay(180).springify()} style={s.photoSection}>
            <Text style={[s.photoHint, { color: meta.color }]}>
              {todayService === "kahve"
                ? (lang === "tr" ? "☕ Fincanın fotoğrafını yükle" : "☕ Upload your cup photo")
                : (lang === "tr" ? "🤲 Avucunun fotoğrafını yükle" : "🤲 Upload your palm photo")}
            </Text>
            <Text style={s.photoSub}>
              {todayService === "kahve"
                ? (lang === "tr" ? `En fazla ${maxPhotos} fotoğraf ekleyebilirsin` : `Up to ${maxPhotos} photos`)
                : (lang === "tr" ? "Net bir avuç içi fotoğrafı çek" : "Take a clear palm photo")}
            </Text>

            {/* Photo thumbnails */}
            {photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.thumbRow}>
                {photos.map((p, i) => (
                  <View key={i} style={s.thumbWrap}>
                    <Image source={{ uri: p.uri }} style={s.thumb} />
                    <Pressable onPress={() => removePhoto(i)} style={s.thumbRemove} hitSlop={6}>
                      <Ionicons name="close-circle" size={20} color="#FF4757" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Add photo buttons */}
            {photos.length < maxPhotos && (
              <View style={s.photoButtons}>
                <Pressable onPress={() => pickPhoto(true)} style={[s.photoBtnPrimary, { borderColor: meta.color, backgroundColor: meta.color + "22" }]}>
                  <Ionicons name="camera" size={20} color={meta.color} />
                  <Text style={[s.photoBtnPrimaryText, { color: meta.color }]}>
                    {lang === "tr" ? "Fotoğraf Çek" : "Take Photo"}
                  </Text>
                </Pressable>
                <Pressable onPress={() => pickPhoto(false)} style={[s.photoBtn, { borderColor: meta.color + "50" }]}>
                  <Ionicons name="image-outline" size={20} color={meta.color} />
                  <Text style={[s.photoBtnText, { color: meta.color }]}>
                    {lang === "tr" ? "Galeri" : "Gallery"}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* User note — what they see in the cup/palm */}
            <View style={[s.noteBox, { borderColor: meta.color + "40" }]}>
              <Text style={[s.noteLabel, { color: meta.color }]}>
                {todayService === "kahve"
                  ? (lang === "tr" ? "☕ Fincanda ne gördün?" : "☕ What do you see in the cup?")
                  : (lang === "tr" ? "🤲 Avucunda ne görüyorsun?" : "🤲 What do you see in your palm?")}
              </Text>
              <TextInput
                style={[s.noteInput, { color: "#E8DFC8", borderColor: meta.color + "30" }]}
                placeholder={lang === "tr" ? "Fincanda gördüklerini buraya yaz… (isteğe bağlı)" : "Describe what you see in the cup… (optional)"}
                placeholderTextColor="#6B5F4A"
                value={userNote}
                onChangeText={setUserNote}
                multiline
                numberOfLines={3}
                maxLength={400}
                textAlignVertical="top"
              />
            </View>
          </Animated.View>
        )}

        {/* ── Main CTA / Reading Result ── */}
        {!readingText && !isDone ? (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={s.ctaCard}>
            <LinearGradient colors={["#0D1020", "#0A0820"]} style={s.ctaCardInner}>
              {canDailyFree ? (
                <>
                  <Text style={s.ctaTitle}>
                    {lang === "tr" ? "Bugünün Enerjisini Keşfet" : "Discover Today's Energy"}
                  </Text>
                  <Text style={s.ctaDesc}>
                    {lang === "tr"
                      ? needsPhoto
                        ? "Fotoğrafını yükle, mistik enerjiyi hisset."
                        : "Her gün ücretsiz bir mistik ön okuma seni bekliyor."
                      : needsPhoto
                        ? "Upload your photo and feel the mystical energy."
                        : "A free mystical preview awaits you every day."}
                  </Text>
                  <Pressable
                    onPress={handleFreeReading}
                    disabled={isLoading || !canStartReading}
                    style={[s.freeBtn, {
                      backgroundColor: canStartReading ? meta.color : "#333",
                      opacity: canStartReading ? 1 : 0.5,
                    }]}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={16} color={canStartReading ? "#000" : Colors.textDim} />
                        <Text style={[s.freeBtnText, { color: canStartReading ? "#000" : Colors.textDim }]}>
                          {needsPhoto && photos.length === 0
                            ? (lang === "tr" ? "Önce Fotoğraf Ekle" : "Add Photo First")
                            : (lang === "tr" ? "Ücretsiz Keşfet" : "Explore Free")}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </>
              ) : (
                <UsedDailyMessage lang={lang} />
              )}
            </LinearGradient>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(400)} style={s.resultCard}>
            <LinearGradient colors={["#0D1020", "#0A0820"]} style={s.resultCardInner}>
              <Text style={[s.resultTitle, { color: meta.color }]}>
                {lang === "tr" ? "✦ Mistik Mesajınız" : "✦ Your Mystical Message"}
              </Text>

              {/* Kahve: bölümlü sonuç */}
              {todayService === "kahve" && parseKahveSections(readingText).length > 0 ? (
                <>
                  <SectionedReading
                    text={readingText}
                    color={meta.color}
                    isLoading={isLoading}
                    visibleCount={isDone ? 2 : undefined}
                  />
                  {isLoading && !isDone && (
                    <ActivityIndicator size="small" color={meta.color} style={{ marginTop: 8 }} />
                  )}
                </>
              ) : (
                <>
                  {/* Diğer servisler: düz metin teaser */}
                  <Text style={s.resultText}>{visibleText}</Text>

                  {isLoading && !isDone && (
                    <ActivityIndicator size="small" color={meta.color} style={{ marginTop: 8 }} />
                  )}

                  {hasHiddenText && (
                    <View style={s.blurWrap} pointerEvents="none">
                      <Text style={[s.resultText, s.blurText]} aria-hidden>
                        {readingText.slice(TEASER_CHARS)}
                      </Text>
                      <LinearGradient
                        colors={["#0D102000", "#0D1020EE", "#0D1020"]}
                        style={s.blurGradient}
                        pointerEvents="none"
                      />
                    </View>
                  )}
                </>
              )}
            </LinearGradient>
          </Animated.View>
        )}

        {/* ── Personalization badges ── */}
        {isDone && (
          <View style={s.personBadgeRow}>
            <View style={s.personBadge}>
              <Text style={s.personBadgeIcon}>✦</Text>
              <Text style={s.personBadgeText}>
                {lang === "tr" ? "Kişiselleştirilmiş AI Yorumu" : "Personalized AI Reading"}
              </Text>
            </View>
            <View style={[s.personBadge, s.personBadge2]}>
              <Text style={s.personBadgeText}>
                {lang === "tr" ? "Sana özel oluşturuldu" : "Created just for you"}
              </Text>
            </View>
          </View>
        )}

        {/* ── Full Reading CTA ── */}
        {(isDone || !canDailyFree) && (
          <Animated.View entering={ZoomIn.delay(400).springify()} style={s.detailCard}>
            <LinearGradient colors={["#1A0820", "#0D0515"]} style={s.detailCardInner}>
              <View style={s.detailTop}>
                <Ionicons name="sparkles" size={18} color={meta.color} />
                <Text style={s.detailTitle}>
                  {lang === "tr" ? "Devamını Gör" : "See Full Reading"}
                </Text>
              </View>
              <Text style={s.detailDesc}>
                {lang === "tr"
                  ? "Çok daha derin, kişisel ve kapsamlı bir mistik okuma için:"
                  : "For a deeper, personal and comprehensive mystical reading:"}
              </Text>
              <Pressable onPress={handleDetailedReading} style={s.detailBtn}>
                <LinearGradient
                  colors={[meta.color, meta.color + "AA"]}
                  style={s.detailBtnInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="eye-outline" size={16} color="#000" />
                  <Text style={s.detailBtnText}>
                    {lang === "tr"
                      ? `Tamamını Gör — ${goldCost} Altın`
                      : `Reveal All — ${goldCost} Gold`}
                  </Text>
                  <Text style={s.detailBtnGold}>✦</Text>
                </LinearGradient>
              </Pressable>
              {goldBalance < goldCost && (
                <Pressable onPress={() => setShowGoldModal(true)} style={s.buyGoldLink}>
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

      <InsufficientGoldModal
        visible={showGoldModal}
        onClose={() => setShowGoldModal(false)}
        serviceLabel={lang === "tr" ? meta.labelTR : meta.labelEN}
        goldCost={goldCost}
        goldBalance={goldBalance}
        serviceColor={meta.color}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20, minHeight: "100%" },
  backBtn: { marginBottom: 12 },

  hero: { alignItems: "center", paddingVertical: 20 },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  heroLabel: { fontSize: 10, fontFamily: "Lora_700Bold", color: Colors.textDim, letterSpacing: 2, marginBottom: 6, marginTop: 8 },
  heroService: { fontSize: 28, fontFamily: "Lora_700Bold", marginBottom: 10 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  freeBadge: {
    backgroundColor: "#C8A02020", borderWidth: 1, borderColor: "#C8A02055",
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  freeBadgeText: { fontSize: 10, fontFamily: "Lora_700Bold", color: Colors.gold, letterSpacing: 1 },
  aiBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#A78BFA15", borderWidth: 1, borderColor: "#A78BFA40",
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  aiBadgeText: { fontSize: 9, fontFamily: "Lora_700Bold", color: "#A78BFA", letterSpacing: 1 },

  photoSection: { marginBottom: 14 },
  photoHint: { fontSize: 15, fontFamily: "Lora_700Bold", marginBottom: 4, textAlign: "center" },
  photoSub: { fontSize: 12, fontFamily: "Lora_400Regular", color: Colors.textSecondary, textAlign: "center", marginBottom: 14 },
  thumbRow: { marginBottom: 12 },
  thumbWrap: { marginRight: 10, position: "relative" },
  thumb: { width: 80, height: 80, borderRadius: 10 },
  thumbRemove: { position: "absolute", top: -6, right: -6 },
  photoButtons: { flexDirection: "row", gap: 10 },
  photoBtnPrimary: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5,
  },
  photoBtnPrimaryText: { fontSize: 14, fontFamily: "Lora_700Bold" },
  photoBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
    backgroundColor: "#FFFFFF08",
  },
  photoBtnText: { fontSize: 14, fontFamily: "Lora_700Bold" },

  noteBox: { marginTop: 16, borderRadius: 12, borderWidth: 1, backgroundColor: "#FFFFFF06", padding: 12 },
  noteLabel: { fontSize: 13, fontFamily: "Lora_700Bold", marginBottom: 8 },
  noteInput: {
    fontFamily: "Lora_400Regular",
    fontSize: 14,
    lineHeight: 21,
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#FFFFFF06",
    padding: 10,
  },

  ctaCard: { borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  ctaCardInner: { padding: 24, alignItems: "center" },
  ctaTitle: { fontSize: 17, fontFamily: "Lora_700Bold", color: Colors.text, textAlign: "center", marginBottom: 8 },
  ctaDesc: { fontSize: 13, fontFamily: "Lora_400Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  freeBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
  freeBtnText: { fontSize: 15, fontFamily: "Lora_700Bold" },

  resultCard: { borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  resultCardInner: { padding: 20 },
  resultTitle: { fontSize: 12, fontFamily: "Lora_700Bold", letterSpacing: 1, marginBottom: 12 },
  resultText: { fontSize: 15, fontFamily: "Lora_400Regular_Italic", color: Colors.text, lineHeight: 26 },
  blurWrap: { position: "relative", marginTop: 4, overflow: "hidden" },
  blurText: { opacity: 0.15 },
  blurGradient: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },

  detailCard: { borderRadius: 16, overflow: "hidden" },
  detailCardInner: { padding: 20 },
  detailTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  detailTitle: { fontSize: 17, fontFamily: "Lora_700Bold", color: Colors.text },
  detailDesc: { fontSize: 13, fontFamily: "Lora_400Regular", color: Colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  detailBtn: { borderRadius: 12, overflow: "hidden", marginBottom: 10 },
  detailBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 13, paddingHorizontal: 20, gap: 8 },
  detailBtnText: { fontSize: 14, fontFamily: "Lora_700Bold", color: "#000" },
  detailBtnGold: { fontSize: 14, color: "#000" },
  buyGoldLink: { flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "center", paddingVertical: 8 },
  buyGoldLinkText: { fontSize: 12, fontFamily: "Lora_400Regular", color: Colors.gold },
  personBadgeRow: { flexDirection: "row", gap: 8, marginHorizontal: 16, marginBottom: 12, flexWrap: "wrap" },
  personBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(155,111,187,0.12)",
    borderWidth: 1, borderColor: "rgba(155,111,187,0.3)",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  personBadge2: { backgroundColor: "rgba(200,160,32,0.10)", borderColor: "rgba(200,160,32,0.3)" },
  personBadgeIcon: { fontSize: 10, color: "#9B6FBB" },
  personBadgeText: { fontSize: 11, fontFamily: "Lora_400Regular", color: "rgba(255,255,255,0.6)" },
});
