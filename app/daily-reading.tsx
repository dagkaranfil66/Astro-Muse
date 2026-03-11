import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  withDelay,
  Easing,
} from "react-native-reanimated";
import { fetch } from "expo/fetch";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { SERVICE_GOLD_COST } from "@/constants/serviceConfig";
import { getApiUrl } from "@/lib/query-client";
import InsufficientGoldModal from "@/components/InsufficientGoldModal";

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
  kahve:      { icon: "cafe-outline",      color: "#C8843A", gradient: ["#1A0A05", "#070D1A"], labelTR: "Kahve Falı",   labelEN: "Coffee Reading", needsPhoto: true, maxPhotos: 3 },
  el:         { icon: "hand-left-outline", color: "#A07EE0", gradient: ["#100A20", "#070D1A"], labelTR: "El Falı",      labelEN: "Palm Reading",   needsPhoto: true, maxPhotos: 1 },
};

const TEASER_CHARS = 260;

type PhotoItem = { uri: string; base64: string; type: string };

function getTodayService() {
  return DAILY_SERVICE;
}

// ─── Generic pulse orb (non-coffee services) ───────────────────────────────
function PulseOrb({ color }: { color: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 1800 }), withTiming(1, { duration: 1800 })),
      -1, false
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={[sOrb.orb, { backgroundColor: color + "20", borderColor: color + "40" }, style]} />;
}
const sOrb = StyleSheet.create({
  orb: { width: 130, height: 130, borderRadius: 65, borderWidth: 1, position: "absolute" },
});

// ─── Steam wisp ──────────────────────────────────────────────────────────────
function SteamWisp({ delay, offsetX, color }: { delay: number; offsetX: number; color: string }) {
  const ty = useSharedValue(0);
  const op = useSharedValue(0);
  const tx = useSharedValue(0);
  useEffect(() => {
    ty.value = withDelay(delay, withRepeat(
      withSequence(withTiming(0, { duration: 0 }), withTiming(-52, { duration: 2000, easing: Easing.ease })),
      -1, false
    ));
    op.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(0.75, { duration: 300 }),
        withTiming(0.75, { duration: 1100 }),
        withTiming(0, { duration: 600 }),
      ), -1, false
    ));
    // slight lateral drift
    tx.value = withDelay(delay, withRepeat(
      withSequence(withTiming(offsetX, { duration: 0 }), withTiming(offsetX + 6, { duration: 2000, easing: Easing.ease })),
      -1, false
    ));
  }, []);
  const wispStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
    opacity: op.value,
  }));
  return (
    <Animated.View style={[sCoffee.wisp, { backgroundColor: color + "60" }, wispStyle]} />
  );
}

// ─── Coffee Hero Animation ────────────────────────────────────────────────────
function CoffeeHeroAnimation({ color }: { color: string }) {
  const glow = useSharedValue(1);
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(withTiming(1.18, { duration: 2200 }), withTiming(1, { duration: 2200 })),
      -1, false
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ transform: [{ scale: glow.value }] }));

  return (
    <View style={sCoffee.container}>
      {/* Background glow orb */}
      <Animated.View style={[sCoffee.glowOrb, { backgroundColor: color + "18", borderColor: color + "35" }, glowStyle]} />

      {/* Steam wisps — positioned above cup */}
      <View style={sCoffee.steamContainer}>
        <SteamWisp delay={0}    offsetX={-10} color={color} />
        <SteamWisp delay={650}  offsetX={0}   color={color} />
        <SteamWisp delay={1300} offsetX={10}  color={color} />
      </View>

      {/* Coffee cup icon circle */}
      <View style={[sCoffee.cupCircle, { borderColor: color + "55", backgroundColor: color + "18" }]}>
        <Ionicons name="cafe" size={42} color={color} />
      </View>
    </View>
  );
}
const sCoffee = StyleSheet.create({
  container: { width: 120, height: 140, alignItems: "center", justifyContent: "flex-end", marginBottom: 4 },
  glowOrb: { position: "absolute", bottom: 0, width: 120, height: 120, borderRadius: 60, borderWidth: 1 },
  steamContainer: { position: "absolute", top: 0, flexDirection: "row", gap: 14, alignItems: "flex-end", height: 54 },
  wisp: { width: 5, height: 22, borderRadius: 3, bottom: 0 },
  cupCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 1, alignItems: "center", justifyContent: "center", zIndex: 2 },
});

export default function DailyReadingScreen() {
  const insets = useSafeAreaInsets();
  const { canDailyFree, markDailyFreeUsed, goldBalance, userProfile } = useApp();
  const { lang } = useLang();

  const todayService = getTodayService();
  const meta = SERVICE_META[todayService] ?? SERVICE_META.tarot;
  const goldCost = SERVICE_GOLD_COST[todayService] ?? 3;
  const needsPhoto = !!meta.needsPhoto;
  const maxPhotos = meta.maxPhotos ?? 1;

  const [isLoading, setIsLoading] = useState(false);
  const [readingText, setReadingText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [showGoldModal, setShowGoldModal] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const canStartReading = !needsPhoto || photos.length > 0;

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
      await markDailyFreeUsed();
      const apiBase = getApiUrl();
      const url = new URL("/api/reading/daily-free", apiBase);

      const body: Record<string, unknown> = { service: todayService, lang };
      if (photos.length > 0) {
        body.photos = photos.map((p) => ({ base64: p.base64, type: p.type }));
      }

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

      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", pointerEvents: "none" }]}>
        <PulseOrb color={meta.color} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[s.scroll, { paddingTop: topPad + 16, paddingBottom: botPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
        </Pressable>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={s.hero}>
          {/* Animated hero — coffee for kahve, generic icon for others */}
          {todayService === "kahve" ? (
            <CoffeeHeroAnimation color={meta.color} />
          ) : (
            <View style={[s.iconCircle, { borderColor: meta.color + "50", backgroundColor: meta.color + "15" }]}>
              <Ionicons name={meta.icon} size={36} color={meta.color} />
            </View>
          )}

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
                {/* Camera — primary on native, hidden on web */}
                {Platform.OS !== "web" && (
                  <Pressable onPress={() => pickPhoto(true)} style={[s.photoBtnPrimary, { borderColor: meta.color, backgroundColor: meta.color + "22" }]}>
                    <Ionicons name="camera" size={20} color={meta.color} />
                    <Text style={[s.photoBtnPrimaryText, { color: meta.color }]}>
                      {lang === "tr" ? "Fotoğraf Çek" : "Take Photo"}
                    </Text>
                  </Pressable>
                )}
                <Pressable onPress={() => pickPhoto(false)} style={[s.photoBtn, { borderColor: meta.color + "50" }]}>
                  <Ionicons name="image-outline" size={20} color={meta.color} />
                  <Text style={[s.photoBtnText, { color: meta.color }]}>
                    {lang === "tr" ? "Galeri" : "Gallery"}
                  </Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        )}

        {/* ── Main CTA / Reading Result ── */}
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

              {/* Visible teaser text */}
              <Text style={s.resultText}>{visibleText}</Text>

              {/* Loading indicator while streaming */}
              {isLoading && !isDone && (
                <ActivityIndicator size="small" color={meta.color} style={{ marginTop: 8 }} />
              )}

              {/* Gradient fade + hidden text blur overlay */}
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
            </LinearGradient>
          </Animated.View>
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
});
