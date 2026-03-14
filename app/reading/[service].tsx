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
  Share,
  Linking,
  Image,
  Dimensions,
  Alert,
  Modal,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  ZoomIn,
  Easing,
} from "react-native-reanimated";
import { fetch } from "expo/fetch";
import * as Clipboard from "expo-clipboard";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { scheduleReadingReadyNotification } from "@/lib/notifications";
import { getApiUrl } from "@/lib/query-client";
import { SHARE_CONFIG } from "@/constants/shareConfig";
import InsufficientGoldModal from "@/components/InsufficientGoldModal";
import PremiumGoldButton from "@/components/PremiumGoldButton";
import CameraKahveModal from "@/components/CameraKahveModal";
import { SectionedReading, parseKahveSections } from "@/components/SectionedReading";

const { width } = Dimensions.get("window");

const SERVICE_META_BASE: Record<string, {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradient: [string, string];
  hasPhoto?: boolean;
  isTarot?: boolean;
}> = {
  astroloji: { icon: "moon-outline", color: "#6B4FBB", gradient: ["#1A0F35", "#070D1A"] },
  kahve: { icon: "cafe-outline", color: "#C0932A", gradient: ["#2A1A05", "#070D1A"], hasPhoto: true },
  el: { icon: "hand-left-outline", color: "#1ABFB8", gradient: ["#051A1A", "#070D1A"], hasPhoto: true },
  tarot: { icon: "layers-outline", color: "#E7B008", gradient: ["#1A1205", "#070D1A"], isTarot: true },
  samanizm: { icon: "leaf-outline", color: "#4CAF7A", gradient: ["#051A0D", "#070D1A"] },
  numeroloji: { icon: "star-outline", color: "#E74C8B", gradient: ["#1A0510", "#070D1A"] },
  ruh: { icon: "eye-outline", color: "#9B59B6", gradient: ["#150E25", "#070D1A"] },
  dogum: { icon: "planet-outline", color: "#FF8C42", gradient: ["#1A0E05", "#070D1A"] },
  ruya: { icon: "cloud-outline", color: "#5B9BD5", gradient: ["#051020", "#070D1A"] },
  burclar: { icon: "telescope-outline", color: "#FF6B9D", gradient: ["#1A0515", "#070D1A"] },
  ask: { icon: "heart-outline", color: "#FF4757", gradient: ["#1A0508", "#070D1A"] },
};

const TAROT_CARD_NAMES = ["GEÇMIŞ", "ŞİMDİ", "GELECEK"];

// ────────── Service Images ──────────
const SERVICE_IMAGES: Record<string, any> = {
  astroloji:  require("@/assets/images/services/astroloji.png"),
  kahve:      require("@/assets/images/services/kahve.png"),
  el:         require("@/assets/images/services/el.png"),
  tarot:      require("@/assets/images/services/tarot.png"),
  samanizm:   require("@/assets/images/services/samanizm.png"),
  numeroloji: require("@/assets/images/services/numeroloji.png"),
  ruh:        require("@/assets/images/services/ruh.png"),
  dogum:      require("@/assets/images/services/dogum.png"),
  ruya:       require("@/assets/images/services/ruya.png"),
  burclar:    require("@/assets/images/services/burclar.png"),
  ask:        require("@/assets/images/services/ask.png"),
};

// Hero banner — shows the service image with Ken Burns animation + gradient overlay
function ServiceHeroBanner({ serviceId, color }: { serviceId: string; color: string }) {
  const scale = useSharedValue(1.06);
  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1, { duration: 4000 }), withTiming(1.06, { duration: 4000 })), -1, true
    );
  }, []);
  const imgStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const img = SERVICE_IMAGES[serviceId];

  return (
    <View style={sHero.wrap}>
      {img && (
        <Animated.Image source={img} style={[sHero.img, imgStyle]} resizeMode="cover" />
      )}
      <LinearGradient
        colors={["transparent", color + "55", Colors.background]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.6, 1]}
      />
    </View>
  );
}
const sHero = StyleSheet.create({
  wrap: { width: "100%", height: 180, borderRadius: 18, overflow: "hidden", marginBottom: 16 },
  img: { width: "100%", height: "100%", position: "absolute" },
});

// ────────── Star field background ──────────
const STAR_POS = Array.from({ length: 16 }, () => ({
  top: Math.random() * 50,
  left: Math.random() * 100,
  dur: 1500 + Math.random() * 2500,
  init: Math.random() * 0.5 + 0.1,
}));

function Star({ top, left, dur, init }: { top: number; left: number; dur: number; init: number }) {
  const opacity = useSharedValue(init);
  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(Math.random() * 0.9 + 0.1, { duration: dur }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.star, style, { top: `${top}%` as any, left: `${left}%` as any }]} />;
}

// ────────── Service-specific Intro Animations ──────────
const KAHVE_TIPS_TR = [
  { icon: "sunny-outline" as const,      label: "İyi ışıkta çek" },
  { icon: "cafe-outline" as const,       label: "İçini yukarıdan" },
  { icon: "water-outline" as const,      label: "Telve görünsün" },
  { icon: "eye-outline" as const,        label: "Net fotoğraf" },
];
const KAHVE_TIPS_EN = [
  { icon: "sunny-outline" as const,      label: "Good lighting" },
  { icon: "cafe-outline" as const,       label: "Top-down view" },
  { icon: "water-outline" as const,      label: "Grounds visible" },
  { icon: "eye-outline" as const,        label: "Sharp photo" },
];

function KahveIntro({ color }: { color: string }) {
  const { t, lang } = useLang();
  const tips = lang === "tr" ? KAHVE_TIPS_TR : KAHVE_TIPS_EN;
  return (
    <View style={styles.serviceIntro}>
      <ServiceHeroBanner serviceId="kahve" color={color} />
      <Text style={styles.introServiceTitle}>{(t.services_list as any).kahve?.label ?? 'Kahve Falı'}</Text>
      <Text style={styles.introDesc}>
        {lang === "tr"
          ? "Fincanınızın fotoğrafını yükleyin\nveya gördüğünüz sembolleri yazın."
          : "Upload a photo of your cup\nor describe the symbols you see."}
      </Text>
      <View style={styles.palmTipsRow}>
        {tips.map((tip) => (
          <View key={tip.label} style={[styles.palmTip, { borderColor: color + "30" }]}>
            <Ionicons name={tip.icon} size={16} color={color} />
            <Text style={[styles.palmTipText, { color: color + "CC" }]}>{tip.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const PALM_TIPS_TR = [
  { icon: "sunny-outline" as const,       label: "İyi ışıkta çek" },
  { icon: "hand-left-outline" as const,   label: "Avuç içini aç" },
  { icon: "scan-outline" as const,        label: "Eli büyük tut" },
  { icon: "eye-outline" as const,         label: "Net fotoğraf" },
];
const PALM_TIPS_EN = [
  { icon: "sunny-outline" as const,       label: "Good lighting" },
  { icon: "hand-left-outline" as const,   label: "Open palm" },
  { icon: "scan-outline" as const,        label: "Fill the frame" },
  { icon: "eye-outline" as const,         label: "Sharp photo" },
];

function ElIntro({ color }: { color: string }) {
  const { t, lang } = useLang();
  const tips = lang === "tr" ? PALM_TIPS_TR : PALM_TIPS_EN;
  return (
    <View style={styles.serviceIntro}>
      <ServiceHeroBanner serviceId="el" color={color} />
      <Text style={styles.introServiceTitle}>{(t.services_list as any).el?.label ?? 'El Falı'}</Text>
      <Text style={styles.introDesc}>
        {lang === "tr"
          ? "Avucunuzun fotoğrafını yükleyin ya da çizgilerinizi anlatın. Kader haritanız okunacak."
          : "Upload a photo of your palm or describe your lines. Your destiny map will be revealed."}
      </Text>
      <View style={styles.palmTipsRow}>
        {tips.map((tip) => (
          <View key={tip.label} style={[styles.palmTip, { borderColor: color + "30" }]}>
            <Ionicons name={tip.icon} size={16} color={color} />
            <Text style={[styles.palmTipText, { color: color + "CC" }]}>{tip.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const TAROT_SYMBOLS = ["Ψ", "♾", "☠"];
const TAROT_ROMAN = ["IV", "VIII", "XIII"];
const TAROT_LABELS_TR = ["GEÇMIŞ", "GÜÇLÜ", "ÖLÜM"];
const TAROT_FRONT_COLORS = ["#4A2A7A", "#2A5C3A", "#6B2A00"];

function TarotCard({ color, label, isDone, isLoading, flipDelay, floatDelay, cardIndex }: {
  color: string; label: string; isDone: boolean; isLoading?: boolean;
  flipDelay: number; floatDelay: number; cardIndex: number;
}) {
  const flipProg = useSharedValue(0);
  const floatY = useSharedValue(0);
  const pulseOp = useSharedValue(0);

  React.useEffect(() => {
    floatY.value = withDelay(floatDelay, withRepeat(
      withSequence(withTiming(-6, { duration: 2200 }), withTiming(0, { duration: 2200 })), -1, false
    ));
  }, []);

  React.useEffect(() => {
    if (isDone) {
      pulseOp.value = 0;
      flipProg.value = withDelay(flipDelay, withTiming(1, { duration: 550 }));
    } else {
      flipProg.value = 0;
    }
  }, [isDone]);

  React.useEffect(() => {
    if (isLoading) {
      pulseOp.value = withDelay(floatDelay, withRepeat(
        withSequence(withTiming(0.55, { duration: 700 }), withTiming(0.1, { duration: 700 })), -1, false
      ));
    } else if (!isDone) {
      pulseOp.value = withTiming(0, { duration: 300 });
    }
  }, [isLoading]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const backStyle = useAnimatedStyle(() => {
    const scaleX = flipProg.value < 0.5 ? 1 - flipProg.value * 2 : 0;
    return { transform: [{ scaleX }], opacity: scaleX > 0.01 ? 1 : 0 };
  });

  const frontStyle = useAnimatedStyle(() => {
    const scaleX = flipProg.value > 0.5 ? (flipProg.value - 0.5) * 2 : 0;
    return { transform: [{ scaleX }], opacity: scaleX > 0.01 ? 1 : 0 };
  });

  const glowStyle = useAnimatedStyle(() => ({ opacity: pulseOp.value }));

  const symbol = TAROT_SYMBOLS[cardIndex] ?? "✦";

  return (
    <View style={styles.tarotCardWrap}>
      <Animated.View style={[styles.tarotCard, { borderColor: color + "50" }, outerStyle]}>
        {/* Loading pulse glow */}
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color, borderRadius: 10 }, glowStyle]} pointerEvents="none" />

        {/* Card Back */}
        <Animated.View style={[StyleSheet.absoluteFill, backStyle]}>
          <LinearGradient colors={["#1C1308", "#0D0E1F"]} style={[styles.tarotCardInner, { borderRadius: 10 }]}>
            <View style={{ position: "absolute", top: 5, left: 5, right: 5, bottom: 5, borderWidth: 1, borderColor: color + "45", borderRadius: 7 }} />
            <View style={{ position: "absolute", top: 9, left: 9, right: 9, bottom: 9, borderWidth: 1, borderColor: color + "25", borderRadius: 5 }} />
            <Text style={{ fontSize: 26, color: color + "75" }}>✦</Text>
            <Text style={{ position: "absolute", top: 7, left: 8, fontSize: 8, color: color + "55" }}>✦</Text>
            <Text style={{ position: "absolute", bottom: 7, right: 8, fontSize: 8, color: color + "55" }}>✦</Text>
          </LinearGradient>
        </Animated.View>

        {/* Card Front — parchment tarot card */}
        <Animated.View style={[StyleSheet.absoluteFill, frontStyle]}>
          <View style={[styles.tarotCardInner, { borderRadius: 10, backgroundColor: "#F8F2E0" }]}>
            {/* Outer ornate frame */}
            <View style={{ position: "absolute", top: 4, left: 4, right: 4, bottom: 4, borderWidth: 1.5, borderColor: "#B8860B", borderRadius: 7 }} />
            <View style={{ position: "absolute", top: 7, left: 7, right: 7, bottom: 7, borderWidth: 0.5, borderColor: "#B8860B70", borderRadius: 5 }} />
            {/* Gold corner ornaments */}
            <Text style={{ position: "absolute", top: 3, left: 5, fontSize: 9, color: "#8B6914" }}>✦</Text>
            <Text style={{ position: "absolute", top: 3, right: 5, fontSize: 9, color: "#8B6914" }}>✦</Text>
            <Text style={{ position: "absolute", bottom: 3, left: 5, fontSize: 9, color: "#8B6914" }}>✦</Text>
            <Text style={{ position: "absolute", bottom: 3, right: 5, fontSize: 9, color: "#8B6914" }}>✦</Text>
            {/* Roman numeral at top */}
            <Text style={{ position: "absolute", top: 12, fontSize: 8, fontFamily: "Lora_700Bold", color: "#8B6914", letterSpacing: 1 }}>
              {TAROT_ROMAN[cardIndex]}
            </Text>
            {/* Main mystical symbol */}
            <Text style={{ fontSize: 38, color: TAROT_FRONT_COLORS[cardIndex], marginTop: 8 }}>{symbol}</Text>
            {/* Card thematic name at bottom */}
            <Text style={{ position: "absolute", bottom: 12, fontSize: 7, fontFamily: "Lora_700Bold", color: "#6B4C00", textAlign: "center", letterSpacing: 1 }}>
              {TAROT_LABELS_TR[cardIndex]}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
      <Text style={[styles.tarotCardLabel, { color: isDone ? color : color + "90" }]}>{label}</Text>
    </View>
  );
}

function TarotIntro({ color, isDone, isLoading }: { color: string; isDone: boolean; isLoading?: boolean; readingText?: string }) {
  const bannerScale = useSharedValue(1.06);
  React.useEffect(() => {
    bannerScale.value = withRepeat(
      withSequence(withTiming(1, { duration: 4500 }), withTiming(1.06, { duration: 4500 })), -1, true
    );
  }, []);
  const bannerImgStyle = useAnimatedStyle(() => ({ transform: [{ scale: bannerScale.value }] }));

  return (
    <View style={styles.tarotIntro}>
      {/* Subtle top banner with tarot image */}
      <View style={{ width: "100%", height: 120, borderRadius: 14, overflow: "hidden", marginBottom: 4 }}>
        <Animated.Image
          source={SERVICE_IMAGES.tarot}
          style={[{ width: "100%", height: "100%", position: "absolute" }, bannerImgStyle]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", color + "44", Colors.background]}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.55, 1]}
        />
      </View>
      <View style={styles.tarotCardsRow}>
        {TAROT_CARD_NAMES.map((label, i) => (
          <TarotCard key={i} color={color} label={label} isDone={isDone} isLoading={isLoading} cardIndex={i} flipDelay={i * 380} floatDelay={i * 250} />
        ))}
      </View>
      {!isDone && !isLoading && (
        <Text style={styles.introDesc}>Sorunuzu yazın ve kartlarınızın çekilmesini bekleyin. Tengri'nin tarot bilgesi üç kartı açacak.</Text>
      )}
      {isLoading && (
        <Text style={[styles.introDesc, { color: color + "CC", fontFamily: "Lora_400Regular_Italic" }]}>
          Kartlar okunuyor…
        </Text>
      )}
    </View>
  );
}

// ────────── Kahve Photo Section ──────────
function KahvePhotoSection({
  photos, onAdd, onRemove, color, lang,
}: {
  photos: { uri: string; base64: string; type: string }[];
  onAdd: (source: "camera" | "gallery") => void;
  onRemove: (idx: number) => void;
  color: string;
  lang: string;
}) {
  const SLOT_LABELS = lang === "tr"
    ? ["İçeriden", "Yandan", "Kahve Fincan Tabağı"]
    : ["Inside", "From Side", "Saucer"];
  const allDone = photos.length >= 3;

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.kahveSectionWrap}>
      <View style={styles.kahveSectionHeader}>
        <Ionicons name="cafe" size={14} color={color} />
        <Text style={[styles.kahveSectionTitle, { color }]}>
          {lang === "tr" ? "Fincan Fotoğrafları" : "Cup Photos"}
        </Text>
        <View style={[styles.kahveCountBadge, { borderColor: color + "50", backgroundColor: color + "15" }]}>
          <Text style={[styles.kahveCountText, { color }]}>{photos.length}/3</Text>
        </View>
      </View>

      {allDone ? (
        <Animated.View entering={ZoomIn.duration(300)} style={[styles.kahveReadyBadge, { borderColor: "#4CAF7A50", backgroundColor: "#4CAF7A15" }]}>
          <Ionicons name="checkmark-circle" size={18} color="#4CAF7A" />
          <Text style={[styles.kahveReadyText, { color: "#4CAF7A" }]}>
            {lang === "tr" ? "Fincanınız hazır! Yorumu almak için aşağıya yazın ↓" : "Cup ready! Write your question below ↓"}
          </Text>
        </Animated.View>
      ) : (
        <Text style={styles.kahveSlotHint}>
          {lang === "tr" ? "3 farklı açıdan fotoğraf çekin veya yükleyin" : "Take or upload from 3 different angles"}
        </Text>
      )}

      <View style={styles.kahveSlotsRow}>
        {[0, 1, 2].map((idx) => {
          const filled = photos[idx];
          return (
            <View key={idx} style={styles.kahveSlotCard}>
              {filled ? (
                <Animated.View entering={ZoomIn.duration(250)} style={styles.kahveSlotFilled}>
                  <Image source={{ uri: filled.uri }} style={styles.kahveSlotImg} />
                  <View style={styles.kahveSlotCheckWrap}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF7A" />
                  </View>
                  <Pressable onPress={() => onRemove(idx)} style={styles.kahveSlotRemove} hitSlop={6}>
                    <Ionicons name="close-circle" size={20} color="#FF6B6B" />
                  </Pressable>
                </Animated.View>
              ) : (
                <View style={[styles.kahveSlotEmpty, { borderColor: color + (idx < photos.length ? "70" : "30") }]}>
                  <Text style={[styles.kahveSlotNum, { color: color + "80" }]}>{idx + 1}</Text>
                  <Text style={[styles.kahveSlotAngle, { color: color + "60" }]}>{SLOT_LABELS[idx]}</Text>
                  {idx === photos.length && (
                    <View style={styles.kahveSlotBtns}>
                      <Pressable onPress={() => onAdd("camera")} style={[styles.kahveSlotBtn, { backgroundColor: color + "20", borderColor: color + "40" }]}>
                        <Ionicons name="camera" size={16} color={color} />
                      </Pressable>
                      <Pressable onPress={() => onAdd("gallery")} style={[styles.kahveSlotBtn, { backgroundColor: color + "20", borderColor: color + "40" }]}>
                        <Ionicons name="images-outline" size={16} color={color} />
                      </Pressable>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

function DogumIntro({ color }: { color: string }) {
  const { t, lang } = useLang();
  return (
    <View style={styles.serviceIntro}>
      <ServiceHeroBanner serviceId="dogum" color={color} />
      <Text style={styles.introServiceTitle}>{(t.services_list as any).dogum?.label ?? 'Doğum Haritası'}</Text>
      <Text style={styles.introDesc}>
        {lang === "tr"
          ? "Doğum tarihiniz, saatiniz ve şehrinizi girerek kişisel yıldız haritanızı çıkarın."
          : "Enter your birth date, time and city to reveal your personal star chart."}
      </Text>
    </View>
  );
}

function RuyaIntro({ color }: { color: string }) {
  const { t, lang } = useLang();
  return (
    <View style={styles.serviceIntro}>
      <ServiceHeroBanner serviceId="ruya" color={color} />
      <Text style={styles.introServiceTitle}>{(t.services_list as any).ruya?.label ?? 'Rüya Yorumu'}</Text>
      <Text style={styles.introDesc}>
        {lang === "tr"
          ? "Gördüğünüz rüyayı anlatın. Şamanist gelenek ile rüyanızın mistik mesajını çözelim."
          : "Describe your dream. Let us decode its mystic message through shamanic tradition."}
      </Text>
    </View>
  );
}

function BurclarIntro({ color }: { color: string }) {
  const { t, lang } = useLang();
  return (
    <View style={styles.serviceIntro}>
      <ServiceHeroBanner serviceId="burclar" color={color} />
      <Text style={styles.introServiceTitle}>{(t.services_list as any).burclar?.label ?? 'Burçlar'}</Text>
      <Text style={styles.introDesc}>
        {lang === "tr"
          ? "Burcunuzu yazın ve bu haftaya özel mistik yorumunuzu alın. Aşk, kariyer ve ruhsal rehberlik."
          : "Enter your zodiac sign and receive your personal weekly mystic insight. Love, career and spiritual guidance."}
      </Text>
    </View>
  );
}

function AskIntro({ color }: { color: string }) {
  const { lang } = useLang();
  useEffect(() => { router.replace("/love-compat" as any); }, []);
  return (
    <View style={styles.serviceIntro}>
      <ServiceHeroBanner serviceId="ask" color={color} />
      <Text style={styles.introServiceTitle}>{lang === "tr" ? "Aşk Uyumu" : "Love Compatibility"}</Text>
      <Text style={styles.introDesc}>{lang === "tr" ? "Yönlendiriliyor..." : "Redirecting..."}</Text>
    </View>
  );
}

function DefaultIntro({ serviceId, color, label, hint }: { serviceId: string; color: string; icon: keyof typeof Ionicons.glyphMap; label: string; hint: string }) {
  return (
    <View style={styles.serviceIntro}>
      <ServiceHeroBanner serviceId={serviceId} color={color} />
      <Text style={styles.introServiceTitle}>{label}</Text>
      <Text style={styles.introDesc}>{hint}</Text>
    </View>
  );
}

// ────────── Share Panel ──────────
// ── Service-specific share copy ───────────────────────────────────────────
const SERVICE_SHARE_COPY: Record<string, { headerTR: string; btnTR: string; headerEN: string; btnEN: string }> = {
  kahve:      { headerTR: "KAHVE FALINI PAYLAŞ",              btnTR: "Kahve Falımı Paylaş",          headerEN: "SHARE YOUR COFFEE READING",     btnEN: "Share My Coffee Reading" },
  el:         { headerTR: "EL FALINI PAYLAŞ",                 btnTR: "El Falımı Paylaş",             headerEN: "SHARE YOUR PALM READING",       btnEN: "Share My Palm Reading" },
  tarot:      { headerTR: "TAROTUNU PAYLAŞ",                  btnTR: "Tarotumu Paylaş",              headerEN: "SHARE YOUR TAROT",              btnEN: "Share My Tarot" },
  samanizm:   { headerTR: "ŞAMANİZM REHBERLİĞİNİ PAYLAŞ",   btnTR: "Şamanizm Rehberliğimi Paylaş", headerEN: "SHARE YOUR SHAMANISM GUIDANCE", btnEN: "Share My Shamanism Guidance" },
  numeroloji: { headerTR: "NUMEROLOJİNİ PAYLAŞ",             btnTR: "Numerolojimi Paylaş",          headerEN: "SHARE YOUR NUMEROLOGY",         btnEN: "Share My Numerology" },
  ruya:       { headerTR: "RÜYA YORUMUNU PAYLAŞ",             btnTR: "Rüya Yorumumu Paylaş",         headerEN: "SHARE YOUR DREAM READING",      btnEN: "Share My Dream Reading" },
  burclar:    { headerTR: "BURÇ YORUMUNU PAYLAŞ",             btnTR: "Burç Yorumumu Paylaş",         headerEN: "SHARE YOUR HOROSCOPE",          btnEN: "Share My Horoscope" },
  ask:        { headerTR: "AŞK YORUMUNU PAYLAŞ",              btnTR: "Aşk Yorumumu Paylaş",          headerEN: "SHARE YOUR LOVE READING",       btnEN: "Share My Love Reading" },
};
const DEFAULT_SHARE_COPY = { headerTR: "YORUMUNU PAYLAŞ", btnTR: "Yorumumu Paylaş", headerEN: "SHARE YOUR READING", btnEN: "Share My Reading" };

function SharePanel({ text, serviceLabel, readingId, service }: { text: string; serviceLabel: string; readingId: string | null; service: string }) {
  const { t, lang } = useLang();
  const { addGold, userProfile } = useApp();
  const copy = SERVICE_SHARE_COPY[service] ?? DEFAULT_SHARE_COPY;
  const [copied, setCopied] = useState(false);

  // ── Reward state ──────────────────────────────────────────────────────────
  const [rewardStatus, setRewardStatus] = useState<
    "idle" | "claiming" | "awarded" | "duplicate" | "daily_limit" | "cooldown" | "no_auth"
  >("idle");
  const [cooldownSecs, setCooldownSecs] = useState(0);
  const [sharesLeft, setSharesLeft] = useState<number | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const shareText = t.shareText(serviceLabel, text);
  const encodedFull = encodeURIComponent(shareText.slice(0, 1000));
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const startCooldown = (secs: number) => {
    setCooldownSecs(secs);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldownSecs(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          setRewardStatus("idle");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const claimReward = async () => {
    if (!readingId) return;
    if (rewardStatus === "claiming" || rewardStatus === "awarded" || rewardStatus === "daily_limit") return;
    if (!userProfile?.email) { setRewardStatus("no_auth"); return; }
    setRewardStatus("claiming");
    try {
      const url = new URL("/api/share/claim-reward", getApiUrl());
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingId, email: userProfile.email }),
      });
      const data = await res.json() as {
        success: boolean;
        reason?: string;
        goldAwarded?: number;
        sharesRemainingToday?: number;
        remainingSeconds?: number;
        message?: string;
      };

      if (res.status === 401) { setRewardStatus("no_auth"); return; }

      if (data.success) {
        addGold(data.goldAwarded ?? SHARE_CONFIG.REWARD_PER_SHARE);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSharesLeft(data.sharesRemainingToday ?? 0);
        setRewardStatus("awarded");
      } else {
        switch (data.reason) {
          case "duplicate":
            setRewardStatus("duplicate");
            break;
          case "daily_limit":
          case "gold_limit":
            setRewardStatus("daily_limit");
            break;
          case "cooldown":
            setRewardStatus("cooldown");
            startCooldown(data.remainingSeconds ?? SHARE_CONFIG.COOLDOWN_SECONDS);
            break;
          default:
            setRewardStatus("idle");
        }
      }
    } catch {
      setRewardStatus("idle");
    }
  };

  const copyToClipboard = async (fullText: string) => {
    try {
      await Clipboard.setStringAsync(fullText);
      return true;
    } catch {
      try {
        if (Platform.OS === "web" && navigator?.clipboard) {
          await navigator.clipboard.writeText(fullText);
          return true;
        }
      } catch {}
      return false;
    }
  };

  const copyText = async () => {
    const ok = await copyToClipboard(shareText);
    if (ok) {
      setCopied(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setCopied(false), 2500);
    } else {
      Share.share({ message: shareText });
    }
  };

  const handleNativeShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    btnScale.value = withSequence(withTiming(0.95, { duration: 80 }), withTiming(1, { duration: 160 }));
    try {
      await Share.share({ message: shareText });
      await claimReward();
    } catch {
      await copyToClipboard(shareText);
    }
  };

  const handleWhatsApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`https://wa.me/?text=${encodedFull}`).catch(() => Share.share({ message: shareText }));
    await claimReward();
  };

  // ── Reward badge ──────────────────────────────────────────────────────────
  const renderRewardBadge = () => {
    if (rewardStatus === "claiming") {
      return (
        <View style={styles.rewardBadge}>
          <ActivityIndicator size="small" color={Colors.gold} />
          <Text style={styles.rewardBadgeText}>{lang === "tr" ? "Ödül hesaplanıyor…" : "Claiming reward…"}</Text>
        </View>
      );
    }
    if (rewardStatus === "awarded") {
      return (
        <Animated.View entering={ZoomIn.springify()} style={[styles.rewardBadge, styles.rewardBadgeGold]}>
          <Text style={styles.rewardBadgeGoldText}>
            +{SHARE_CONFIG.REWARD_PER_SHARE} ✦ {lang === "tr" ? "Altın kazandın!" : "Gold earned!"}
            {sharesLeft !== null && sharesLeft > 0
              ? `  (${lang === "tr" ? `Bugün ${sharesLeft} paylaşım hakkın kaldı` : `${sharesLeft} shares left today`})`
              : ""}
          </Text>
        </Animated.View>
      );
    }
    if (rewardStatus === "duplicate") {
      return (
        <View style={styles.rewardBadge}>
          <Ionicons name="checkmark-circle-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.rewardBadgeText}>
            {lang === "tr" ? "Bu okuma için ödül alındı" : "Reward already claimed"}
          </Text>
        </View>
      );
    }
    if (rewardStatus === "daily_limit") {
      return (
        <View style={styles.rewardBadge}>
          <Ionicons name="moon-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.rewardBadgeText}>
            {lang === "tr" ? "Günlük paylaşım ödülü tamamlandı" : "Daily share reward limit reached"}
          </Text>
        </View>
      );
    }
    if (rewardStatus === "cooldown") {
      return (
        <View style={styles.rewardBadge}>
          <Ionicons name="time-outline" size={13} color={Colors.gold} />
          <Text style={styles.rewardBadgeText}>
            {lang === "tr"
              ? `Sonraki ödül için ${cooldownSecs}s bekle`
              : `Next reward in ${cooldownSecs}s`}
          </Text>
        </View>
      );
    }
    if (rewardStatus === "no_auth") return null;
    // idle — show incentive hint
    if (readingId) {
      return (
        <View style={styles.rewardBadgeGold}>
          <Ionicons name="gift-outline" size={14} color={Colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rewardBadgeGoldText}>
              {lang === "tr"
                ? `Paylaşınca +${SHARE_CONFIG.REWARD_PER_SHARE} ✦ altın kazanırsın!`
                : `Earn +${SHARE_CONFIG.REWARD_PER_SHARE} ✦ gold when you share!`}
            </Text>
            <Text style={styles.rewardBadgeSubText}>
              {lang === "tr"
                ? `Günde ${SHARE_CONFIG.MAX_DAILY_SHARES} paylaşım → ${SHARE_CONFIG.MAX_DAILY_GOLD} ✦ altın`
                : `${SHARE_CONFIG.MAX_DAILY_SHARES} shares/day → ${SHARE_CONFIG.MAX_DAILY_GOLD} ✦ gold max`}
            </Text>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sharePanel}>
      {/* Label */}
      <View style={styles.sharePanelHeader}>
        <Ionicons name="share-social-outline" size={13} color={Colors.gold} />
        <Text style={styles.sharePanelTitle}>
          {lang === "tr" ? copy.headerTR : copy.headerEN}
        </Text>
      </View>

      {/* Teaser preview */}
      <Text style={styles.sharePreviewText} numberOfLines={2}>
        {"🔮 " + (lang === "tr" ? `TENGRI'den ${serviceLabel.toLowerCase()} yorumum` : `My ${serviceLabel} from TENGRI`)}
      </Text>

      {/* Reward badge */}
      {renderRewardBadge()}

      {/* BIG primary share button */}
      <Animated.View style={[btnStyle, { width: "100%" }]}>
        <Pressable onPress={handleNativeShare} style={styles.sharePrimaryBtn}>
          <LinearGradient
            colors={[Colors.gold, "#8B6914"]}
            style={styles.sharePrimaryBtnInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="share-social" size={20} color="#000" />
            <Text style={styles.sharePrimaryBtnText}>
              {lang === "tr" ? copy.btnTR : copy.btnEN}
            </Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Secondary row */}
      <View style={styles.shareSecondaryRow}>
        <Pressable onPress={handleWhatsApp} style={styles.shareSecondaryBtn}>
          <Ionicons name="logo-whatsapp" size={17} color="#25D366" />
          <Text style={[styles.shareSecondaryLabel, { color: "#25D366" }]}>WhatsApp</Text>
        </Pressable>
        <Pressable onPress={copyText} style={styles.shareSecondaryBtn}>
          <Ionicons name={copied ? "checkmark-circle" : "copy-outline"} size={17} color={copied ? "#4CAF7A" : Colors.textSecondary} />
          <Text style={[styles.shareSecondaryLabel, { color: copied ? "#4CAF7A" : Colors.textSecondary }]}>
            {copied ? (lang === "tr" ? "Kopyalandı!" : "Copied!") : (lang === "tr" ? "Kopyala" : "Copy")}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ────────── Main Screen ──────────
export default function ReadingScreen() {
  const { service } = useLocalSearchParams<{ service: string }>();
  const insets = useSafeAreaInsets();
  const { goldBalance, canAfford, spendGold, addReading, getServiceCost, userProfile, mistikName, mistikBirthDate, mistikFocusArea, freeCoffeeFortuneUsed, markFreeCoffeeFortuneUsed } = useApp();
  const { t, lang } = useLang();

  const base = SERVICE_META_BASE[service] || SERVICE_META_BASE.astroloji;
  const readingMeta = (t.reading_meta as any)[service] || (t.reading_meta as any).astroloji;
  const serviceLabel = (t.services_list as any)[service]?.label || service;
  const goldCost = getServiceCost(service);

  const isKahve = service === "kahve";
  const isEl = service === "el";
  const isTarot = service === "tarot";

  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [readingText, setReadingText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{ uri: string; base64: string; type: string } | null>(null);
  const [kahvePhotos, setKahvePhotos] = useState<{ uri: string; base64: string; type: string }[]>([]);
  const [showGoldModal, setShowGoldModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [inputError, setInputError] = useState(false);
  const [tarotTopic, setTarotTopic] = useState("");
  const [tarotSpread, setTarotSpread] = useState("3 Kart");
  const [elHand, setElHand] = useState<"sağ" | "sol" | "">("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const numBirthMonthRef = useRef<TextInput>(null);
  const numBirthYearRef  = useRef<TextInput>(null);
  const isNumeroloji = service === "numeroloji";
  const isRuya = service === "ruya";
  const isDogum = service === "dogum";
  const isRuh = service === "ruh";
  const isAstroloji = service === "astroloji";
  const [ruyaTags, setRuyaTags] = useState<string[]>([]);

  // Doğum Haritası state
  const [dogumDay, setDogumDay] = useState("");
  const [dogumMonth, setDogumMonth] = useState("");
  const [dogumYear, setDogumYear] = useState("");
  const [dogumTime, setDogumTime] = useState("");
  const [dogumPlace, setDogumPlace] = useState("");
  const dogumMonthRef = useRef<TextInput>(null);
  const dogumYearRef  = useRef<TextInput>(null);
  const dogumTimeRef  = useRef<TextInput>(null);
  const dogumPlaceRef = useRef<TextInput>(null);

  // Ruh Okuma state
  const [ruhAd, setRuhAd] = useState("");
  const [ruhBirthYear, setRuhBirthYear] = useState("");
  const [ruhMood, setRuhMood] = useState("");

  const scrollRef = useRef<ScrollView>(null);

  const hasValidInput = isKahve
    ? (kahvePhotos.length > 0 || userInput.trim().length > 0)
    : isEl
    ? (photo !== null || userInput.trim().length > 0)
    : isTarot
    ? true
    : isDogum
    ? (dogumDay !== "" || dogumYear !== "" || dogumPlace !== "")
    : isRuh
    ? (ruhAd !== "" || ruhMood !== "" || userInput.trim().length > 0)
    : isAstroloji
    ? true
    : userInput.trim().length > 0;

  const [showFreeCoffeeConversion, setShowFreeCoffeeConversion] = useState(false);

  // Palm validation state (el falı only)
  const [palmValidationStatus, setPalmValidationStatus] = useState<"idle" | "checking" | "invalid" | "valid">("idle");
  const [palmValidationReason, setPalmValidationReason] = useState<string | null>(null);

  // Coffee validation state (kahve only)
  const [coffeeValidationStatus, setCoffeeValidationStatus] = useState<"idle" | "checking" | "invalid" | "valid">("idle");
  const [coffeeValidationReason, setCoffeeValidationReason] = useState<string | null>(null);

  const sendButtonScale = useSharedValue(1);
  const sendButtonStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendButtonScale.value }] }));

  const isFirstFreeCoffee = isKahve && !freeCoffeeFortuneUsed;
  const canRead = isFirstFreeCoffee || canAfford(service);

  React.useEffect(() => {
    if (!userProfile) {
      router.replace("/auth");
    }
  }, [userProfile]);

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === "web") return true;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === "granted";
  };

  const pickFromGallery = async (): Promise<{ uri: string; base64: string; type: string } | null> => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            lang === "tr" ? "İzin Gerekli" : "Permission Required",
            lang === "tr" ? "Galerinize erişmek için izin verin." : "Please allow access to your photo library."
          );
          return null;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return { uri: asset.uri, base64: asset.base64 || "", type: asset.mimeType || "image/jpeg" };
      }
    } catch {}
    return null;
  };

  const pickFromCamera = async (): Promise<{ uri: string; base64: string; type: string } | null> => {
    try {
      const ok = await requestCameraPermission();
      if (!ok) return null;
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return { uri: asset.uri, base64: asset.base64 || "", type: asset.mimeType || "image/jpeg" };
      }
    } catch {}
    return null;
  };

  const handleAddKahvePhoto = async (source: "gallery" | "camera") => {
    if (kahvePhotos.length >= 3) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const img = source === "camera" ? await pickFromCamera() : await pickFromGallery();
    if (img) {
      setKahvePhotos((prev) => [...prev, img]);
      setInputError(false);
      setCoffeeValidationStatus("idle");
      setCoffeeValidationReason(null);
    }
  };

  const handleElPhoto = async (source: "gallery" | "camera") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const img = source === "camera" ? await pickFromCamera() : await pickFromGallery();
    if (img) {
      setPhoto(img);
      setInputError(false);
      setPalmValidationStatus("idle");
      setPalmValidationReason(null);
    }
  };

  const handleCameraCapture = (capturedPhoto: { uri: string; base64: string; type: string }) => {
    setKahvePhotos([capturedPhoto]);
    handleRead([capturedPhoto]);
  };

  const handleRead = async (photosOverride?: { uri: string; base64: string; type: string }[]) => {
    if (!canRead) { setShowGoldModal(true); return; }

    // Coffee image validation gate (kahve only — runs when photos are present)
    const photosForValidation = photosOverride ?? kahvePhotos;
    if (isKahve && photosForValidation.length > 0) {
      setCoffeeValidationStatus("checking");
      setCoffeeValidationReason(null);
      try {
        const baseUrl = getApiUrl();
        const validationUrl = new URL("/api/validate-coffee", baseUrl).toString();
        const vRes = await fetch(validationUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: photosForValidation.map((p) => ({ base64: p.base64, type: p.type })),
            lang,
          }),
        });
        const vData = await vRes.json();
        if (!vData.valid) {
          setCoffeeValidationStatus("invalid");
          setCoffeeValidationReason(vData.reason ?? (lang === "tr"
            ? "Bu görselde kahve falına uygun fincan içi tespit edemedik."
            : "We couldn't detect a valid coffee cup interior in this image."));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        setCoffeeValidationStatus("valid");
      } catch {
        setCoffeeValidationStatus("invalid");
        setCoffeeValidationReason(lang === "tr"
          ? "Görsel doğrulanamadı. Lütfen tekrar dene."
          : "Image could not be validated. Please try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }

    // Palm image validation gate (el falı only)
    if (isEl && photo) {
      setPalmValidationStatus("checking");
      setPalmValidationReason(null);
      try {
        const baseUrl = getApiUrl();
        const validationUrl = new URL("/api/validate-palm", baseUrl).toString();
        const vRes = await fetch(validationUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: photo.base64, imageType: photo.type, lang }),
        });
        const vData = await vRes.json();
        if (!vData.valid) {
          setPalmValidationStatus("invalid");
          setPalmValidationReason(vData.reason ?? (lang === "tr"
            ? "Bu görselde net bir avuç içi tespit edemedik."
            : "We couldn't detect a clear palm in this image."));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        setPalmValidationStatus("valid");
      } catch {
        // Fail-safe: network/parse error → block reading
        setPalmValidationStatus("invalid");
        setPalmValidationReason(lang === "tr"
          ? "Görsel doğrulanamadı. Lütfen tekrar dene."
          : "Image could not be validated. Please try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }

    const hasPhotosOverride = photosOverride && photosOverride.length > 0;
    const isValid = hasPhotosOverride || hasValidInput;

    if (!isValid) {
      setInputError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => setInputError(false), 2500);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendButtonScale.value = withSpring(0.9, {}, () => { sendButtonScale.value = withSpring(1); });

    const wasFreeFirstCoffee = isFirstFreeCoffee;

    // Mark free coffee flag BEFORE api call so it persists even if reading is interrupted
    if (wasFreeFirstCoffee) {
      await markFreeCoffeeFortuneUsed();
    } else {
      // Double-guard: re-check affordability right before spending
      if (!canAfford(service)) {
        setShowGoldModal(true);
        return;
      }
      const spent = spendGold(service);
      if (!spent) {
        setShowGoldModal(true);
        return;
      }
    }

    setIsLoading(true);
    setReadingText("");
    setIsDone(false);

    try {
      const baseUrl = getApiUrl();
      const effectiveInput = isTarot
        ? [
            tarotTopic ? `Konu: ${tarotTopic}` : "",
            `Açılım: ${tarotSpread}`,
            userInput.trim() ? `Soru: ${userInput.trim()}` : "",
          ].filter(Boolean).join(" | ")
        : isEl && elHand
        ? [elHand === "sağ" ? "Sağ el" : "Sol el", userInput.trim()].filter(Boolean).join(" — ")
        : isNumeroloji && (birthDay || birthMonth || birthYear)
        ? [`Doğum tarihi: ${birthDay || "?"}/${birthMonth || "?"}/${birthYear || "?"}`, userInput.trim()].filter(Boolean).join(" | ")
        : isRuya && ruyaTags.length > 0
        ? [`Rüyada gördüklerim: ${ruyaTags.join(", ")}`, userInput.trim()].filter(Boolean).join(". ")
        : isDogum
        ? [
            (dogumDay || dogumMonth || dogumYear) ? `Doğum tarihi: ${dogumDay || "?"}/${dogumMonth || "?"}/${dogumYear || "?"}` : "",
            dogumTime ? `Doğum saati: ${dogumTime}` : "",
            dogumPlace ? `Doğum yeri: ${dogumPlace}` : "",
            userInput.trim(),
          ].filter(Boolean).join(" | ")
        : isRuh
        ? [
            ruhAd ? `Ad: ${ruhAd}` : "",
            ruhBirthYear ? `Doğum yılı: ${ruhBirthYear}` : "",
            ruhMood ? `Ruh hali: ${ruhMood}` : "",
            userInput.trim(),
          ].filter(Boolean).join(" | ")
        : userInput.trim() || "";
      const body: Record<string, any> = {
        service,
        lang,
        userInput: effectiveInput,
        ...(mistikName ? { userName: mistikName } : {}),
        ...(mistikBirthDate ? { birthDate: mistikBirthDate } : {}),
        ...(mistikFocusArea ? { focusArea: mistikFocusArea } : {}),
      };
      const photosToUse = photosOverride ?? kahvePhotos;
      if (isKahve && photosToUse.length > 0) {
        body.images = photosToUse.map((p) => ({ base64: p.base64, type: p.type }));
      } else if (isEl && photo?.base64) {
        body.imageBase64 = photo.base64;
        body.imageType = photo.type;
      } else if (photo?.base64 && base.hasPhoto) {
        body.imageBase64 = photo.base64;
        body.imageType = photo.type;
      }

      const res = await fetch(new URL("/api/reading", baseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) throw new Error("Server error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.content) { fullText += evt.content; setReadingText(fullText); scrollRef.current?.scrollToEnd({ animated: true }); }
            if (evt.done) {
              setIsDone(true);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              const newId = await addReading({ service, serviceLabel, content: fullText, userInput });
              setReadingId(newId);
              scheduleReadingReadyNotification(lang, service).catch(() => {});
              if (wasFreeFirstCoffee) {
                setTimeout(() => setShowFreeCoffeeConversion(true), 1800);
              }
            }
          } catch {}
        }
      }
    } catch {
      setReadingText(t.connectionError);
      setIsDone(true);
    } finally {
      setIsLoading(false);
    }
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const renderIntro = () => {
    if (service === "kahve") return <KahveIntro color={base.color} />;
    if (service === "el") return <ElIntro color={base.color} />;
    if (service === "tarot") return <TarotIntro color={base.color} isDone={isDone} isLoading={isLoading} />;
    if (service === "dogum") return <DogumIntro color={base.color} />;
    if (service === "ruya") return <RuyaIntro color={base.color} />;
    if (service === "burclar") return <BurclarIntro color={base.color} />;
    if (service === "ask") return <AskIntro color={base.color} />;
    return <DefaultIntro serviceId={service} color={base.color} icon={base.icon} label={serviceLabel} hint={readingMeta.hint} />;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[base.gradient[0], base.gradient[1]]} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
        {STAR_POS.map((p, i) => <Star key={i} {...p} />)}
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Ionicons name={base.icon} size={17} color={base.color} />
          <Text style={styles.headerTitle} numberOfLines={1}>{serviceLabel}</Text>
        </View>
        <Pressable onPress={() => router.push("/purchase")} style={styles.goldHeaderBadge}>
          <Text style={{ fontSize: 13, color: Colors.gold }}>✦</Text>
          <Text style={styles.goldHeaderText}>{goldBalance}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Service Intro (shows when no reading yet) */}
          {!readingText && !isLoading && (
            <Animated.View entering={FadeIn.duration(500)}>
              {renderIntro()}
            </Animated.View>
          )}

          {/* Kahve: Camera quick-read CTA */}
          {service === "kahve" && !readingText && !isLoading && (
            <Animated.View entering={FadeInDown.delay(150).springify()}>
              {isFirstFreeCoffee && (
                <View style={styles.freeCoffeeBanner}>
                  <Ionicons name="gift" size={14} color="#000" />
                  <Text style={styles.freeCoffeeBannerText}>
                    {lang === "tr" ? "İlk kahve falın ücretsiz! ✦" : "Your first coffee reading is free! ✦"}
                  </Text>
                </View>
              )}
              <Pressable
                onPress={() => {
                  if (!canRead) { setShowGoldModal(true); return; }
                  setShowCameraModal(true);
                }}
                style={[styles.cameraReadCTA, { borderColor: base.color + "60", backgroundColor: base.color + "12" }]}
              >
                <View style={[styles.cameraReadIcon, { backgroundColor: base.color + "20", borderColor: base.color + "40" }]}>
                  <Ionicons name="camera" size={28} color={base.color} />
                </View>
                <View style={styles.cameraReadText}>
                  <Text style={[styles.cameraReadTitle, { color: base.color }]}>
                    {lang === "tr" ? "Kameradan Fal Al" : "Camera Reading"}
                  </Text>
                  <Text style={styles.cameraReadSub}>
                    {lang === "tr"
                      ? "Fincanı kameraya tut, anında oku →"
                      : "Point camera at cup, instant read →"}
                  </Text>
                </View>
                <View style={[styles.cameraReadBadge, { backgroundColor: isFirstFreeCoffee ? Colors.gold : base.color }]}>
                  <Text style={styles.cameraReadBadgeText}>{isFirstFreeCoffee ? "ÜCRETSİZ" : "YENİ"}</Text>
                </View>
              </Pressable>

              <View style={styles.kahveDivider}>
                <View style={[styles.kahveDividerLine, { backgroundColor: base.color + "25" }]} />
                <Text style={[styles.kahveDividerText, { color: base.color + "80" }]}>
                  {lang === "tr" ? "veya fotoğraf yükle" : "or upload photos"}
                </Text>
                <View style={[styles.kahveDividerLine, { backgroundColor: base.color + "25" }]} />
              </View>
            </Animated.View>
          )}

          {/* Kahve: 3-photo slots shown prominently in main content */}
          {service === "kahve" && !readingText && !isLoading && (
            <KahvePhotoSection
              photos={kahvePhotos}
              onAdd={handleAddKahvePhoto}
              onRemove={(idx) => { setKahvePhotos((prev) => prev.filter((_, i) => i !== idx)); setCoffeeValidationStatus("idle"); setCoffeeValidationReason(null); }}
              color={base.color}
              lang={lang}
            />
          )}

          {/* Loading */}
          {isLoading && !readingText && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={base.color} />
              <Text style={[styles.loadingText, { color: base.color }]}>{readingMeta.hint}</Text>
            </View>
          )}

          {/* Tarot cards overlay above reading */}
          {base.isTarot && (readingText || isLoading) && (
            <TarotIntro color={base.color} isDone={isDone} isLoading={isLoading} readingText={readingText} />
          )}

          {/* Reading text */}
          {!!readingText && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.readingBox}>
              <View style={[styles.readingHeader, { borderBottomColor: base.color + "30" }]}>
                <Ionicons name="sparkles" size={13} color={base.color} />
                <Text style={[styles.readingHeaderText, { color: base.color }]}>{t.tengriMessage}</Text>
              </View>
              {(service === "el" || service === "numeroloji" || service === "ruya" || service === "dogum" || service === "ruh" || service === "astroloji") && parseKahveSections(readingText).length > 0 ? (
                <View style={{ padding: 12 }}>
                  <SectionedReading text={readingText} color={base.color} isLoading={isLoading} />
                  {isLoading && <ActivityIndicator size="small" color={base.color} style={{ padding: 8 }} />}
                </View>
              ) : (
                <>
                  <Text style={styles.readingText}>{readingText}</Text>
                  {isLoading && <ActivityIndicator size="small" color={base.color} style={{ padding: 12 }} />}
                </>
              )}
            </Animated.View>
          )}

          {/* AI Generated Reading disclosure card */}
          {isDone && readingText && (
            <Animated.View entering={FadeIn.delay(300)} style={styles.aiDisclosureCard}>
              <View style={styles.aiDisclosureHeader}>
                <Ionicons name="sparkles" size={14} color="#00C8FF" />
                <Text style={styles.aiDisclosureTitle}>
                  {lang === "tr" ? "Yapay Zekâ Yorumu" : "AI Generated Reading"}
                </Text>
              </View>
              <Text style={styles.aiDisclosureBody}>
                {lang === "tr"
                  ? "Bu yorum sana özel olarak yapay zekâ tarafından üretilmiştir.\nYalnızca eğlence amaçlıdır."
                  : "This interpretation is uniquely generated for you by AI.\nFor entertainment purposes only."}
              </Text>
            </Animated.View>
          )}
          {isDone && readingText && <SharePanel text={readingText} serviceLabel={serviceLabel} readingId={readingId} service={service} />}
          {isDone && (
            <Animated.View entering={FadeIn.delay(400)} style={styles.doneActions}>
              <Pressable onPress={() => { setReadingText(""); setIsDone(false); setUserInput(""); setPhoto(null); }} style={styles.newReadBtn}>
                <Ionicons name="refresh-outline" size={15} color={Colors.textSecondary} />
                <Text style={styles.newReadBtnText}>{t.newReading}</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>

        {/* Input Area - always stays above keyboard */}
        {!isDone && (
          <View style={[styles.inputArea, { paddingBottom: botPad + 16 }]}>
            {/* El Falı — sağ/sol seçimi */}
            {isEl && !isLoading && (
              <View style={styles.tarotSelectorWrap}>
                <Text style={[styles.tarotSelectorLabel, { color: base.color }]}>
                  {lang === "tr" ? "Hangi el?" : "Which hand?"}
                </Text>
                <View style={styles.tarotChipRow}>
                  {(lang === "tr" ? ["Sağ El", "Sol El"] : ["Right Hand", "Left Hand"]).map((label, i) => {
                    const val = i === 0 ? "sağ" : "sol";
                    const isActive = elHand === val;
                    return (
                      <Pressable
                        key={label}
                        onPress={() => { setElHand(isActive ? "" : val as "sağ" | "sol"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={[styles.tarotChip, isActive && { backgroundColor: base.color + "25", borderColor: base.color }]}
                      >
                        <Text style={[styles.tarotChipText, isActive && { color: base.color }]}>{label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* El Falı — camera + gallery */}
            {isEl && (
              <View style={styles.photoSection}>
                <Text style={[styles.photoSectionLabel, { color: base.color }]}>
                  {lang === "tr" ? "El fotoğrafı" : "Hand photo"}
                </Text>
                {photo ? (
                  <View style={styles.singlePhotoWrap}>
                    <Image source={{ uri: photo.uri }} style={styles.singlePhotoPreview} />
                    <Pressable onPress={() => setPhoto(null)} style={styles.photoRemoveBtn}>
                      <Ionicons name="close-circle" size={22} color="#FF6B6B" />
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.photoSourceRow}>
                    <Pressable onPress={() => handleElPhoto("camera")} style={[styles.photoSourceBtn, { borderColor: base.color + "50" }]}>
                      <Ionicons name="camera" size={22} color={base.color} />
                      <Text style={[styles.photoSourceLabel, { color: base.color }]}>
                        {lang === "tr" ? "Kamera" : "Camera"}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => handleElPhoto("gallery")} style={[styles.photoSourceBtn, { borderColor: base.color + "50" }]}>
                      <Ionicons name="images-outline" size={22} color={base.color} />
                      <Text style={[styles.photoSourceLabel, { color: base.color }]}>
                        {lang === "tr" ? "Galeri" : "Gallery"}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* El falı — palm validation feedback */}
            {isEl && palmValidationStatus === "checking" && (
              <Animated.View entering={FadeIn.duration(250)} style={styles.palmValidatingBanner}>
                <ActivityIndicator size="small" color={base.color} />
                <Text style={[styles.palmValidatingText, { color: base.color }]}>
                  {lang === "tr" ? "Görsel doğrulanıyor…" : "Validating image…"}
                </Text>
              </Animated.View>
            )}

            {isEl && palmValidationStatus === "invalid" && (
              <Animated.View entering={FadeInDown.springify()} style={styles.palmInvalidCard}>
                <Ionicons name="warning" size={18} color="#FF6B6B" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.palmInvalidTitle}>
                    {lang === "tr" ? "Geçersiz Görsel" : "Invalid Image"}
                  </Text>
                  <Text style={styles.palmInvalidReason}>{palmValidationReason}</Text>
                </View>
                <Pressable
                  onPress={() => {
                    setPhoto(null);
                    setPalmValidationStatus("idle");
                    setPalmValidationReason(null);
                  }}
                  style={styles.palmRetryBtn}
                >
                  <Text style={styles.palmRetryText}>
                    {lang === "tr" ? "Yenile" : "Retry"}
                  </Text>
                </Pressable>
              </Animated.View>
            )}

            {/* Kahve — coffee validation feedback */}
            {isKahve && coffeeValidationStatus === "checking" && (
              <Animated.View entering={FadeIn.duration(250)} style={styles.palmValidatingBanner}>
                <ActivityIndicator size="small" color={base.color} />
                <Text style={[styles.palmValidatingText, { color: base.color }]}>
                  {lang === "tr" ? "Fotoğraf doğrulanıyor…" : "Validating photo…"}
                </Text>
              </Animated.View>
            )}

            {isKahve && coffeeValidationStatus === "invalid" && (
              <Animated.View entering={FadeInDown.springify()} style={styles.palmInvalidCard}>
                <Ionicons name="warning" size={18} color="#FF6B6B" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.palmInvalidTitle}>
                    {lang === "tr" ? "Geçersiz Görsel" : "Invalid Image"}
                  </Text>
                  <Text style={styles.palmInvalidReason}>{coffeeValidationReason}</Text>
                </View>
                <Pressable
                  onPress={() => {
                    setKahvePhotos([]);
                    setCoffeeValidationStatus("idle");
                    setCoffeeValidationReason(null);
                  }}
                  style={styles.palmRetryBtn}
                >
                  <Text style={styles.palmRetryText}>
                    {lang === "tr" ? "Yenile" : "Retry"}
                  </Text>
                </Pressable>
              </Animated.View>
            )}

            {/* Kahve — camera + gallery buttons in input bar */}
            {isKahve && (
              <View style={styles.kahveInputStatus}>
                {kahvePhotos.length >= 3 ? (
                  <View style={[styles.kahveStatusBadge, { borderColor: "#4CAF7A50", backgroundColor: "#4CAF7A10" }]}>
                    <Ionicons name="checkmark-circle" size={14} color="#4CAF7A" />
                    <Text style={[styles.kahveStatusText, { color: "#4CAF7A" }]}>
                      {lang === "tr" ? "3 fotoğraf hazır ✓" : "3 photos ready ✓"}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.photoSection}>
                    <Text style={[styles.photoSectionLabel, { color: base.color }]}>
                      {lang === "tr" ? `Fincan fotoğrafı ${kahvePhotos.length}/3` : `Cup photo ${kahvePhotos.length}/3`}
                    </Text>
                    <View style={styles.photoSourceRow}>
                      {Platform.OS !== "web" && (
                        <Pressable onPress={() => handleAddKahvePhoto("camera")} style={[styles.photoSourceBtn, { borderColor: base.color + "50" }]}>
                          <Ionicons name="camera" size={22} color={base.color} />
                          <Text style={[styles.photoSourceLabel, { color: base.color }]}>
                            {lang === "tr" ? "Fotoğraf Çek" : "Camera"}
                          </Text>
                        </Pressable>
                      )}
                      <Pressable onPress={() => handleAddKahvePhoto("gallery")} style={[styles.photoSourceBtn, { borderColor: base.color + "50" }]}>
                        <Ionicons name="images-outline" size={22} color={base.color} />
                        <Text style={[styles.photoSourceLabel, { color: base.color }]}>
                          {lang === "tr" ? "Galeriden Yükle" : "Gallery"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Tarot: Konu + Açılım seçimi */}
            {isTarot && !isLoading && (
              <View style={styles.tarotSelectorWrap}>
                {/* Açılım tipi */}
                <Text style={[styles.tarotSelectorLabel, { color: base.color }]}>
                  {lang === "tr" ? "Açılım" : "Spread"}
                </Text>
                <View style={styles.tarotChipRow}>
                  {(lang === "tr"
                    ? ["Tek Kart", "3 Kart", "Aşk Açılımı"]
                    : ["Single Card", "3 Cards", "Love Spread"]
                  ).map((s, i) => {
                    const vals = ["Tek Kart", "3 Kart", "Aşk Açılımı"];
                    const isActive = tarotSpread === vals[i];
                    return (
                      <Pressable
                        key={s}
                        onPress={() => { setTarotSpread(vals[i]); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={[styles.tarotChip, isActive && { backgroundColor: base.color + "25", borderColor: base.color }]}
                      >
                        <Text style={[styles.tarotChipText, isActive && { color: base.color }]}>{s}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {/* Konu */}
                <Text style={[styles.tarotSelectorLabel, { color: base.color, marginTop: 8 }]}>
                  {lang === "tr" ? "Konu (isteğe bağlı)" : "Topic (optional)"}
                </Text>
                <View style={styles.tarotChipRow}>
                  {(lang === "tr"
                    ? ["Aşk", "Para", "Kariyer", "Gelecek", "Onun Duyguları", "Ruhsal Mesaj"]
                    : ["Love", "Money", "Career", "Future", "Their Feelings", "Spiritual"]
                  ).map((topic, i) => {
                    const vals = ["Aşk", "Para", "Kariyer", "Gelecek", "Onun Duyguları", "Ruhsal Mesaj"];
                    const isActive = tarotTopic === vals[i];
                    return (
                      <Pressable
                        key={topic}
                        onPress={() => {
                          setTarotTopic(isActive ? "" : vals[i]);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        style={[styles.tarotChip, isActive && { backgroundColor: base.color + "25", borderColor: base.color }]}
                      >
                        <Text style={[styles.tarotChipText, isActive && { color: base.color }]}>{topic}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Numeroloji: Doğum tarihi girişi */}
            {isNumeroloji && !isLoading && (
              <View style={styles.tarotSelectorWrap}>
                <Text style={[styles.tarotSelectorLabel, { color: base.color }]}>
                  {lang === "tr" ? "Doğum Tarihi" : "Birth Date"}
                </Text>
                <View style={styles.birthDateRow}>
                  <TextInput
                    style={[styles.birthDateField, { borderColor: birthDay ? base.color + "60" : Colors.cardBorder, color: Colors.text }]}
                    placeholder={lang === "tr" ? "GG" : "DD"}
                    placeholderTextColor={Colors.textDim}
                    value={birthDay}
                    onChangeText={(v) => {
                      const cleaned = v.replace(/\D/g, "").slice(0, 2);
                      setBirthDay(cleaned);
                      if (cleaned.length === 2) numBirthMonthRef.current?.focus();
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    returnKeyType="next"
                    onSubmitEditing={() => numBirthMonthRef.current?.focus()}
                  />
                  <Text style={{ color: Colors.textDim, fontSize: 18 }}>/</Text>
                  <TextInput
                    ref={numBirthMonthRef}
                    style={[styles.birthDateField, { borderColor: birthMonth ? base.color + "60" : Colors.cardBorder, color: Colors.text }]}
                    placeholder={lang === "tr" ? "AA" : "MM"}
                    placeholderTextColor={Colors.textDim}
                    value={birthMonth}
                    onChangeText={(v) => {
                      const cleaned = v.replace(/\D/g, "").slice(0, 2);
                      setBirthMonth(cleaned);
                      if (cleaned.length === 2) numBirthYearRef.current?.focus();
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    returnKeyType="next"
                    onSubmitEditing={() => numBirthYearRef.current?.focus()}
                  />
                  <Text style={{ color: Colors.textDim, fontSize: 18 }}>/</Text>
                  <TextInput
                    ref={numBirthYearRef}
                    style={[styles.birthDateField, styles.birthYearField, { borderColor: birthYear ? base.color + "60" : Colors.cardBorder, color: Colors.text }]}
                    placeholder="YYYY"
                    placeholderTextColor={Colors.textDim}
                    value={birthYear}
                    onChangeText={(v) => setBirthYear(v.replace(/\D/g, "").slice(0, 4))}
                    keyboardType="numeric"
                    maxLength={4}
                    returnKeyType="done"
                  />
                </View>
              </View>
            )}

            {/* Rüya: Hızlı etiket seçimi */}
            {isRuya && !isLoading && (
              <View style={styles.tarotSelectorWrap}>
                <Text style={[styles.tarotSelectorLabel, { color: base.color }]}>
                  {lang === "tr" ? "Hızlı Etiket" : "Quick Tags"}
                </Text>
                <View style={styles.tarotChipRow}>
                  {(lang === "tr"
                    ? ["Uçmak", "Su/Deniz", "Düşmek", "Kovalanmak", "Yılan", "Ölüm", "Ev", "Çocuk", "Yangın", "Karanlık"]
                    : ["Flying", "Water/Sea", "Falling", "Being Chased", "Snake", "Death", "House", "Child", "Fire", "Darkness"]
                  ).map((tag, i) => {
                    const trVals = ["Uçmak", "Su/Deniz", "Düşmek", "Kovalanmak", "Yılan", "Ölüm", "Ev", "Çocuk", "Yangın", "Karanlık"];
                    const val = trVals[i];
                    const isActive = ruyaTags.includes(val);
                    return (
                      <Pressable
                        key={tag}
                        onPress={() => {
                          setRuyaTags(prev => isActive ? prev.filter(t => t !== val) : [...prev, val]);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        style={[styles.tarotChip, isActive && { backgroundColor: base.color + "25", borderColor: base.color }]}
                      >
                        <Text style={[styles.tarotChipText, isActive && { color: base.color }]}>{tag}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Doğum Haritası: Tarih + Saat + Yer */}
            {isDogum && !isLoading && (
              <View style={styles.tarotSelectorWrap}>
                <Text style={[styles.tarotSelectorLabel, { color: base.color }]}>
                  {lang === "tr" ? "Doğum Tarihi" : "Birth Date"}
                </Text>
                <View style={styles.birthDateRow}>
                  <TextInput
                    style={[styles.birthDateField, { borderColor: dogumDay ? base.color + "60" : Colors.cardBorder, color: Colors.text }]}
                    placeholder={lang === "tr" ? "GG" : "DD"}
                    placeholderTextColor={Colors.textDim}
                    value={dogumDay}
                    onChangeText={(v) => {
                      const cleaned = v.replace(/\D/g, "").slice(0, 2);
                      setDogumDay(cleaned);
                      if (cleaned.length === 2) dogumMonthRef.current?.focus();
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    returnKeyType="next"
                    onSubmitEditing={() => dogumMonthRef.current?.focus()}
                  />
                  <Text style={{ color: Colors.textDim, fontSize: 18 }}>/</Text>
                  <TextInput
                    ref={dogumMonthRef}
                    style={[styles.birthDateField, { borderColor: dogumMonth ? base.color + "60" : Colors.cardBorder, color: Colors.text }]}
                    placeholder={lang === "tr" ? "AA" : "MM"}
                    placeholderTextColor={Colors.textDim}
                    value={dogumMonth}
                    onChangeText={(v) => {
                      const cleaned = v.replace(/\D/g, "").slice(0, 2);
                      setDogumMonth(cleaned);
                      if (cleaned.length === 2) dogumYearRef.current?.focus();
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    returnKeyType="next"
                    onSubmitEditing={() => dogumYearRef.current?.focus()}
                  />
                  <Text style={{ color: Colors.textDim, fontSize: 18 }}>/</Text>
                  <TextInput
                    ref={dogumYearRef}
                    style={[styles.birthDateField, styles.birthYearField, { borderColor: dogumYear ? base.color + "60" : Colors.cardBorder, color: Colors.text }]}
                    placeholder="YYYY"
                    placeholderTextColor={Colors.textDim}
                    value={dogumYear}
                    onChangeText={(v) => {
                      const cleaned = v.replace(/\D/g, "").slice(0, 4);
                      setDogumYear(cleaned);
                      if (cleaned.length === 4) dogumTimeRef.current?.focus();
                    }}
                    keyboardType="numeric"
                    maxLength={4}
                    returnKeyType="next"
                    onSubmitEditing={() => dogumTimeRef.current?.focus()}
                  />
                </View>
                <Text style={[styles.tarotSelectorLabel, { color: base.color, marginTop: 10 }]}>
                  {lang === "tr" ? "Doğum Saati (isteğe bağlı)" : "Birth Time (optional)"}
                </Text>
                <TextInput
                  ref={dogumTimeRef}
                  style={[styles.birthDateField, styles.birthYearField, { borderColor: dogumTime ? base.color + "60" : Colors.cardBorder, color: Colors.text, width: "40%" }]}
                  placeholder="SS:DD"
                  placeholderTextColor={Colors.textDim}
                  value={dogumTime}
                  onChangeText={(v) => {
                    const cleaned = v.replace(/[^\d:]/g, "").slice(0, 5);
                    setDogumTime(cleaned);
                    if (cleaned.length === 5) dogumPlaceRef.current?.focus();
                  }}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  returnKeyType="next"
                  onSubmitEditing={() => dogumPlaceRef.current?.focus()}
                />
                <Text style={[styles.tarotSelectorLabel, { color: base.color, marginTop: 10 }]}>
                  {lang === "tr" ? "Doğum Yeri (isteğe bağlı)" : "Birth Place (optional)"}
                </Text>
                <TextInput
                  ref={dogumPlaceRef}
                  style={[styles.input, { borderColor: dogumPlace ? base.color + "60" : Colors.cardBorder, color: Colors.text, minHeight: 40 }]}
                  placeholder={lang === "tr" ? "Şehir, Ülke" : "City, Country"}
                  placeholderTextColor={Colors.textDim}
                  value={dogumPlace}
                  onChangeText={setDogumPlace}
                  maxLength={80}
                  returnKeyType="done"
                />
              </View>
            )}

            {/* Ruh Okuma: Ad + Doğum Yılı + Ruh Hali */}
            {isRuh && !isLoading && (
              <View style={styles.tarotSelectorWrap}>
                <Text style={[styles.tarotSelectorLabel, { color: base.color }]}>
                  {lang === "tr" ? "Adınız (isteğe bağlı)" : "Your Name (optional)"}
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: ruhAd ? base.color + "60" : Colors.cardBorder, color: Colors.text, minHeight: 40 }]}
                  placeholder={lang === "tr" ? "Adınızı girin..." : "Enter your name..."}
                  placeholderTextColor={Colors.textDim}
                  value={ruhAd}
                  onChangeText={setRuhAd}
                  maxLength={60}
                />
                <Text style={[styles.tarotSelectorLabel, { color: base.color, marginTop: 10 }]}>
                  {lang === "tr" ? "Doğum Yılı (isteğe bağlı)" : "Birth Year (optional)"}
                </Text>
                <TextInput
                  style={[styles.birthDateField, styles.birthYearField, { borderColor: ruhBirthYear ? base.color + "60" : Colors.cardBorder, color: Colors.text, width: "35%" }]}
                  placeholder="YYYY"
                  placeholderTextColor={Colors.textDim}
                  value={ruhBirthYear}
                  onChangeText={(v) => setRuhBirthYear(v.replace(/\D/g, "").slice(0, 4))}
                  keyboardType="numeric"
                  maxLength={4}
                />
                <Text style={[styles.tarotSelectorLabel, { color: base.color, marginTop: 10 }]}>
                  {lang === "tr" ? "Şu Anki Ruh Halin" : "Current Mood"}
                </Text>
                <View style={styles.tarotChipRow}>
                  {(lang === "tr"
                    ? ["Yorgun", "Kararsız", "Mutlu", "Kırgın", "Meraklı", "Durgun"]
                    : ["Tired", "Undecided", "Happy", "Hurt", "Curious", "Calm"]
                  ).map((mood, i) => {
                    const trVals = ["Yorgun", "Kararsız", "Mutlu", "Kırgın", "Meraklı", "Durgun"];
                    const val = trVals[i];
                    const isActive = ruhMood === val;
                    return (
                      <Pressable
                        key={mood}
                        onPress={() => {
                          setRuhMood(isActive ? "" : val);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        style={[styles.tarotChip, isActive && { backgroundColor: base.color + "25", borderColor: base.color }]}
                      >
                        <Text style={[styles.tarotChipText, isActive && { color: base.color }]}>{mood}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <Text style={styles.inputLabelText}>{readingMeta.inputLabel}</Text>
            {inputError && (
              <Animated.View entering={FadeInDown.duration(200)} style={styles.inputErrorBanner}>
                <Ionicons name="alert-circle-outline" size={14} color="#FF6B6B" />
                <Text style={styles.inputErrorText}>
                  {isKahve
                    ? (lang === "tr" ? "Fotoğraf ekleyin veya fincanı tanımlayın" : "Add a photo or describe the cup")
                    : isEl
                    ? (lang === "tr" ? "El fotoğrafı ekleyin veya çizgileri tanımlayın" : "Add a hand photo or describe the lines")
                    : (lang === "tr" ? "Lütfen bir şeyler yazın" : "Please write something")}
                </Text>
              </Animated.View>
            )}
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, inputError && { borderColor: "#FF6B6B50" }]}
                value={userInput}
                onChangeText={(v) => { setUserInput(v); if (inputError) setInputError(false); }}
                placeholder={readingMeta.placeholder}
                placeholderTextColor={Colors.textDim}
                multiline
                maxLength={400}
                editable={!isLoading}
              />
              <Animated.View style={sendButtonStyle}>
                <Pressable
                  onPress={() => handleRead()}
                  disabled={isLoading || palmValidationStatus === "checking" || coffeeValidationStatus === "checking"}
                  style={[
                    styles.sendBtn,
                    { backgroundColor: !canRead ? Colors.textDim : hasValidInput ? base.color : base.color + "50" }
                  ]}
                >
                  {(isLoading || palmValidationStatus === "checking" || coffeeValidationStatus === "checking") ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Ionicons name={!canRead ? "lock-closed" : "sparkles"} size={20} color={Colors.background} />
                  )}
                </Pressable>
              </Animated.View>
            </View>
            {!canRead && (
              <View style={styles.purchaseNudge}>
                <Text style={styles.purchaseNudgeMsg}>
                  {lang === "tr"
                    ? "Yorumun hazır… Ama tamamını görmek için altın gerekiyor."
                    : "Your reading is ready… but you need gold to unlock it."}
                </Text>
                <PremiumGoldButton
                  onPress={() => setShowGoldModal(true)}
                  label={lang === "tr" ? "Altın tükendi — Satın Al" : "Out of Gold — Buy Now"}
                />
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      <InsufficientGoldModal
        visible={showGoldModal}
        onClose={() => setShowGoldModal(false)}
        serviceLabel={serviceLabel}
        goldCost={goldCost}
        goldBalance={goldBalance}
        serviceColor={base.color}
      />

      <CameraKahveModal
        visible={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
        color={base.color}
      />

      {/* First free coffee conversion modal */}
      <Modal
        visible={showFreeCoffeeConversion}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFreeCoffeeConversion(false)}
      >
        <View style={styles.freeCoffeeOverlay}>
          <Animated.View entering={FadeInUp.springify()} style={styles.freeCoffeeCard}>
            <LinearGradient colors={["#1a1220", "#0e0c1a"]} style={StyleSheet.absoluteFill} />
            <Text style={styles.freeCoffeeCardEmoji}>☕</Text>
            <Text style={styles.freeCoffeeCardTitle}>
              {lang === "tr" ? "Kahve falını sevdin mi?" : "Enjoyed your reading?"}
            </Text>
            <Text style={styles.freeCoffeeCardBody}>
              {lang === "tr"
                ? "Daha fazla fal için altın al ya da aboneliğe geç — tüm hizmetlerin kilidini aç!"
                : "Get more gold or go unlimited with a subscription — unlock all services!"}
            </Text>
            <Pressable
              onPress={() => { setShowFreeCoffeeConversion(false); router.push("/purchase"); }}
              style={styles.freeCoffeeCardBtn}
            >
              <LinearGradient colors={[Colors.gold, "#8B6914"]} style={styles.freeCoffeeCardBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="sparkles" size={16} color="#000" />
                <Text style={styles.freeCoffeeCardBtnText}>
                  {lang === "tr" ? "Altın Al" : "Get Gold"}
                </Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => setShowFreeCoffeeConversion(false)} style={{ marginTop: 12 }}>
              <Text style={{ color: Colors.textSecondary, fontSize: 13, fontFamily: "Lora_400Regular" }}>
                {lang === "tr" ? "Şimdi değil" : "Not now"}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  star: { position: "absolute", width: 2, height: 2, borderRadius: 1, backgroundColor: Colors.gold },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  headerTitle: { fontSize: 13, fontFamily: "Lora_700Bold", color: Colors.text, letterSpacing: 0.2 },
  goldHeaderBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.gold + "18", borderRadius: 10, borderWidth: 1, borderColor: Colors.gold + "40", paddingHorizontal: 10, paddingVertical: 5, width: 52, justifyContent: "center" },
  goldHeaderText: { fontSize: 13, fontFamily: "Lora_700Bold", color: Colors.gold },

  content: { paddingHorizontal: 18, paddingTop: 8, flexGrow: 1 },

  // Service intros
  serviceIntro: { alignItems: "center", paddingVertical: 20, gap: 12 },
  introServiceTitle: { fontSize: 20, fontFamily: "Lora_700Bold", color: Colors.text, textAlign: "center" },
  introDesc: { fontSize: 13, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },

  // Kahve
  steam: { width: 3, height: 20, borderRadius: 2, opacity: 0.7, marginBottom: 2 },
  cupOuter: { width: 80, height: 70, borderRadius: 12, borderWidth: 1, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  saucer: { width: 100, height: 8, borderRadius: 4, borderWidth: 1, backgroundColor: Colors.surface, marginTop: 4 },

  // El
  handGlow: { position: "absolute", width: 80, height: 80, borderRadius: 40, opacity: 0.15, top: 0 },
  handContainer: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  palmLine: { position: "absolute", height: 1.5, borderRadius: 1, opacity: 0.6, left: "30%" as any },

  // Tarot
  tarotSelectorWrap: { paddingHorizontal: 4, paddingBottom: 10, gap: 6 },
  tarotSelectorLabel: { fontSize: 11, fontFamily: "Lora_700Bold", letterSpacing: 1, textTransform: "uppercase" },
  tarotChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tarotChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.surfaceElevated,
  },
  tarotChipText: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.textSecondary },
  birthDateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  birthDateField: {
    width: 52, height: 44, borderRadius: 10, borderWidth: 1,
    backgroundColor: Colors.surfaceElevated, textAlign: "center",
    fontFamily: "Lora_700Bold", fontSize: 15,
  },
  birthYearField: { width: 72 },

  tarotIntro: { alignItems: "center", paddingVertical: 16, gap: 12 },
  tarotCardsRow: { flexDirection: "row", gap: 12, justifyContent: "center" },
  tarotCardWrap: { alignItems: "center", gap: 6 },
  tarotCard: { width: (width - 80) / 3, height: 150, borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  tarotCardInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  tarotCardLabel: { fontSize: 11, fontFamily: "Lora_700Bold", letterSpacing: 0.5, textAlign: "center", maxWidth: 90 },

  // Doğum
  zodiacWheel: { width: 130, height: 130, borderRadius: 65, borderWidth: 1, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  zodiacRing: { position: "absolute", width: 130, height: 130 },
  zodiacSign: { fontSize: 12, opacity: 0.8 },

  // Rüya
  dreamGlow: { position: "absolute", width: 90, height: 90, borderRadius: 45, opacity: 0.12, top: 0 },
  dreamCloud: { width: 90, height: 80, borderRadius: 16, borderWidth: 1, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },

  // Burçlar
  zodiacGlow: { position: "absolute", width: 80, height: 80, borderRadius: 40, opacity: 0.15, top: 0 },
  zodiacIcon: { width: 85, height: 85, borderRadius: 14, borderWidth: 1, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },

  // Aşk
  heartWrap: { width: 65, height: 65, borderRadius: 12, borderWidth: 1, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  heartJoin: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center", zIndex: 1 },

  // Default
  defaultGlow: { position: "absolute", width: 100, height: 100, borderRadius: 50, opacity: 0.12, top: 0 },
  defaultIconWrap: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },

  // Loading
  loadingContainer: { alignItems: "center", paddingTop: 50, gap: 20 },
  loadingText: { fontSize: 14, fontFamily: "Lora_400Regular_Italic" },

  // Reading
  readingBox: { backgroundColor: Colors.surfaceElevated, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder, marginTop: 8, marginBottom: 14 },
  readingHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1 },
  readingHeaderText: { fontSize: 10, fontFamily: "Lora_700Bold", letterSpacing: 1 },
  readingText: { padding: 16, fontSize: 15, fontFamily: "Lora_400Regular", color: Colors.text, lineHeight: 26 },

  // Share
  sharePanel: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.gold + "35", padding: 16, marginBottom: 12, gap: 12 },
  sharePanelHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  sharePanelTitle: { fontSize: 10, fontFamily: "Lora_700Bold", color: Colors.gold, letterSpacing: 2 },
  sharePreviewText: { fontSize: 12, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, lineHeight: 18 },
  sharePrimaryBtn: { borderRadius: 14, overflow: "hidden", width: "100%" },
  sharePrimaryBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15, paddingHorizontal: 20 },
  sharePrimaryBtnText: { fontSize: 16, fontFamily: "Lora_700Bold", color: "#000", letterSpacing: 0.3 },
  shareSecondaryRow: { flexDirection: "row", gap: 10 },
  shareSecondaryBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.surfaceElevated },
  shareSecondaryLabel: { fontSize: 12, fontFamily: "Lora_700Bold" },
  rewardBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.cardBorder },
  rewardBadgeText: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary, flex: 1 },
  rewardBadgeGold: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: Colors.gold + "15", borderWidth: 1, borderColor: Colors.gold + "50" },
  rewardBadgeGoldText: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.gold },
  rewardBadgeSubText: { fontSize: 10, fontFamily: "Lora_400Regular", color: Colors.gold + "BB", marginTop: 2 },

  // Done
  doneActions: { alignItems: "center", paddingVertical: 6 },
  newReadBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder },
  newReadBtnText: { fontSize: 12, fontFamily: "Lora_400Regular", color: Colors.textSecondary },

  // Input area
  inputArea: { paddingHorizontal: 18, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.cardBorder, backgroundColor: Colors.background, gap: 8 },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  photoBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1, backgroundColor: Colors.surface },
  photoBtnText: { fontSize: 12, fontFamily: "Lora_400Regular" },
  photoPreview: { width: 40, height: 40, borderRadius: 8 },
  photoRemove: { padding: 4 },

  // Photo sections
  photoSection: { gap: 8 },
  photoSectionLabel: { fontSize: 10, fontFamily: "Lora_700Bold", letterSpacing: 1, textTransform: "uppercase" },
  photoSourceRow: { flexDirection: "row", gap: 10 },
  photoSourceBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, backgroundColor: Colors.surface,
  },
  photoSourceLabel: { fontSize: 12, fontFamily: "Lora_700Bold" },
  singlePhotoWrap: { position: "relative", alignSelf: "flex-start" },
  singlePhotoPreview: { width: 90, height: 90, borderRadius: 12 },
  photoRemoveBtn: { position: "absolute", top: -8, right: -8, backgroundColor: Colors.background, borderRadius: 12 },

  // Kahve photo section (main content area)
  cameraReadCTA: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
  },
  cameraReadIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraReadText: { flex: 1, gap: 3 },
  cameraReadTitle: {
    fontFamily: "Lora_700Bold",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  cameraReadSub: {
    fontFamily: "Lora_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  cameraReadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  cameraReadBadgeText: {
    fontFamily: "Lora_700Bold",
    fontSize: 9,
    color: "#000",
    letterSpacing: 0.8,
  },
  kahveDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 14,
  },
  kahveDividerLine: { flex: 1, height: 1 },
  kahveDividerText: {
    fontFamily: "Lora_400Regular_Italic",
    fontSize: 12,
  },

  kahveSectionWrap: {
    marginHorizontal: 0, marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder,
    padding: 14, gap: 10, overflow: "hidden",
  },
  kahveSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  kahveSectionTitle: { flex: 1, fontSize: 11, fontFamily: "Lora_700Bold", letterSpacing: 1, textTransform: "uppercase" },
  kahveCountBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  kahveCountText: { fontSize: 11, fontFamily: "Lora_700Bold" },
  kahveReadyBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, borderWidth: 1, padding: 10,
  },
  kahveReadyText: { flex: 1, fontSize: 12, fontFamily: "Lora_400Regular", lineHeight: 17 },
  kahveSlotHint: { fontSize: 11, fontFamily: "Lora_400Regular_Italic", color: Colors.textDim },
  kahveSlotsRow: { flexDirection: "row", gap: 8 },
  kahveSlotCard: { flex: 1 },
  kahveSlotFilled: { position: "relative", borderRadius: 12, overflow: "hidden" },
  kahveSlotImg: { width: "100%", height: 100, borderRadius: 12 },
  kahveSlotCheckWrap: {
    position: "absolute", top: 4, left: 4,
    backgroundColor: Colors.background + "CC", borderRadius: 12,
  },
  kahveSlotRemove: {
    position: "absolute", top: 4, right: 4,
    backgroundColor: Colors.background + "CC", borderRadius: 12,
  },
  kahveSlotEmpty: {
    height: 100, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed" as any,
    alignItems: "center", justifyContent: "center", gap: 4,
    backgroundColor: Colors.surfaceElevated, padding: 6,
  },
  kahveSlotNum: { fontSize: 18, fontFamily: "Lora_700Bold" },
  kahveSlotAngle: { fontSize: 9, fontFamily: "Lora_400Regular", textAlign: "center" },
  kahveSlotBtns: { flexDirection: "column", gap: 4, width: "100%" },
  kahveSlotBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
    borderRadius: 6, borderWidth: 1, paddingVertical: 5, paddingHorizontal: 6,
  },
  kahveSlotBtnText: { fontSize: 10, fontFamily: "Lora_700Bold" },
  // Prominent action buttons above slots
  kahveMainBtns: { flexDirection: "row", gap: 10, marginBottom: 14, marginTop: 4 },
  kahveMainCameraBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5,
  },
  kahveMainCameraBtnText: { fontSize: 14, fontFamily: "Lora_700Bold" },
  kahveMainGalleryBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 13, borderRadius: 12, borderWidth: 1,
    backgroundColor: "#FFFFFF08",
  },
  kahveMainGalleryBtnText: { fontSize: 13, fontFamily: "Lora_700Bold" },
  // Kahve input status (bottom bar)
  kahveInputStatus: { marginBottom: 2 },
  kahveStatusBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6,
  },
  kahveStatusText: { fontSize: 11, fontFamily: "Lora_400Regular" },
  // Legacy kept for el falı
  kahvePhotoGrid: { flexDirection: "row", gap: 10 },
  kahvePhotoSlot: { position: "relative" },
  kahvePhotoImg: { width: 70, height: 70, borderRadius: 10 },
  kahveAddSlot: { flexDirection: "column", gap: 6 },
  kahveAddBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center",
  },
  kahveHint: { fontSize: 10, fontFamily: "Lora_400Regular", color: Colors.textDim, fontStyle: "italic" },
  inputLabelText: { fontSize: 10, fontFamily: "Lora_400Regular", color: Colors.textDim, letterSpacing: 1 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    minHeight: 48,
    maxHeight: 100,
  },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  inputErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FF6B6B15",
    borderWidth: 1,
    borderColor: "#FF6B6B40",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
  },
  inputErrorText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    color: "#FF6B6B",
    flex: 1,
  },
  purchaseNudge: { alignItems: "center", paddingTop: 14, paddingBottom: 6, gap: 12 },
  purchaseNudgeMsg: {
    fontSize: 13,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  aiDisclosureCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "rgba(0,200,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.22)",
    borderRadius: 14,
    padding: 14,
  },
  aiDisclosureHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 6,
  },
  aiDisclosureTitle: {
    fontSize: 12,
    fontFamily: "Lora_700Bold",
    color: "#00C8FF",
    letterSpacing: 0.5,
  },
  aiDisclosureBody: {
    fontSize: 12,
    fontFamily: "Lora_400Regular_Italic",
    color: "rgba(0,200,255,0.75)",
    lineHeight: 18,
  },

  // El falı: palm tips row in intro
  palmTipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12, justifyContent: "center" },
  palmTip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  palmTipText: { fontSize: 11, fontFamily: "Lora_400Regular" },

  // Palm validation feedback
  palmValidatingBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(26,191,184,0.10)", borderRadius: 10, borderWidth: 1,
    borderColor: "rgba(26,191,184,0.25)", paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 6,
  },
  palmValidatingText: { fontSize: 13, fontFamily: "Lora_400Regular" },
  palmInvalidCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "rgba(255,107,107,0.10)", borderRadius: 10, borderWidth: 1,
    borderColor: "rgba(255,107,107,0.30)", paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 6,
  },
  palmInvalidTitle: { fontSize: 12, fontFamily: "Lora_700Bold", color: "#FF6B6B", marginBottom: 2 },
  palmInvalidReason: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary, lineHeight: 17 },
  palmRetryBtn: {
    backgroundColor: "rgba(255,107,107,0.18)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    alignSelf: "flex-start", marginTop: 2,
  },
  palmRetryText: { fontSize: 11, fontFamily: "Lora_700Bold", color: "#FF6B6B" },

  // Free coffee banner
  freeCoffeeBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: Colors.gold, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14,
    marginBottom: 10,
  },
  freeCoffeeBannerText: { fontSize: 13, fontFamily: "Lora_700Bold", color: "#000" },

  // Free coffee conversion modal
  freeCoffeeOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.75)", alignItems: "center", justifyContent: "center", padding: 24,
  },
  freeCoffeeCard: {
    width: "100%", borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder,
    padding: 28, alignItems: "center", gap: 10,
  },
  freeCoffeeCardEmoji: { fontSize: 48, marginBottom: 4 },
  freeCoffeeCardTitle: { fontSize: 20, fontFamily: "Lora_700Bold", color: Colors.text, textAlign: "center" },
  freeCoffeeCardBody: { fontSize: 14, fontFamily: "Lora_400Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  freeCoffeeCardBtn: { width: "100%", borderRadius: 12, overflow: "hidden", marginTop: 6 },
  freeCoffeeCardBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  freeCoffeeCardBtnText: { fontSize: 16, fontFamily: "Lora_700Bold", color: "#000" },
});
