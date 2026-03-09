import React, { useState, useRef } from "react";
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
} from "react-native-reanimated";
import { fetch } from "expo/fetch";
import * as Clipboard from "expo-clipboard";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { getApiUrl } from "@/lib/query-client";
import InsufficientGoldModal from "@/components/InsufficientGoldModal";
import CameraKahveModal from "@/components/CameraKahveModal";

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
function KahveIntro({ color }: { color: string }) {
  return (
    <View style={styles.serviceIntro}>
      <ServiceHeroBanner serviceId="kahve" color={color} />
      <Text style={styles.introServiceTitle}>Kahve Falı</Text>
      <Text style={styles.introDesc}>Fincanınızın fotoğrafını yükleyin{"\n"}veya gördüğünüz sembolleri yazın.</Text>
    </View>
  );
}

function ElIntro({ color }: { color: string }) {
  return (
    <View style={styles.serviceIntro}>
      <ServiceHeroBanner serviceId="el" color={color} />
      <Text style={styles.introServiceTitle}>El Falı</Text>
      <Text style={styles.introDesc}>Avucunuzun fotoğrafını yükleyin ya da çizgilerinizi anlatın. Kader haritanız okunacak.</Text>
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
    ? ["İçeriden", "Yandan", "Altından"]
    : ["Inside", "From Side", "Bottom"];
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
                        <Text style={[styles.kahveSlotBtnText, { color }]}>{lang === "tr" ? "Çek" : "Take"}</Text>
                      </Pressable>
                      <Pressable onPress={() => onAdd("gallery")} style={[styles.kahveSlotBtn, { backgroundColor: color + "20", borderColor: color + "40" }]}>
                        <Ionicons name="images-outline" size={16} color={color} />
                        <Text style={[styles.kahveSlotBtnText, { color }]}>{lang === "tr" ? "Yükle" : "Upload"}</Text>
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
  return (
    <View style={styles.serviceIntro}>
      <ServiceHeroBanner serviceId="dogum" color={color} />
      <Text style={styles.introServiceTitle}>Doğum Haritası</Text>
      <Text style={styles.introDesc}>Doğum tarihiniz, saatiniz ve şehrinizi girerek kişisel yıldız haritanızı çıkarın.</Text>
    </View>
  );
}

function RuyaIntro({ color }: { color: string }) {
  return (
    <View style={styles.serviceIntro}>
      <ServiceHeroBanner serviceId="ruya" color={color} />
      <Text style={styles.introServiceTitle}>Rüya Yorumu</Text>
      <Text style={styles.introDesc}>Gördüğünüz rüyayı anlatın. Şamanist gelenek ile rüyanızın mistik mesajını çözelim.</Text>
    </View>
  );
}

function BurclarIntro({ color }: { color: string }) {
  return (
    <View style={styles.serviceIntro}>
      <ServiceHeroBanner serviceId="burclar" color={color} />
      <Text style={styles.introServiceTitle}>Burçlar</Text>
      <Text style={styles.introDesc}>Burcunuzu yazın ve bu haftaya özel mistik yorumunuzu alın. Aşk, kariyer ve ruhsal rehberlik.</Text>
    </View>
  );
}

function AskIntro({ color }: { color: string }) {
  return (
    <View style={styles.serviceIntro}>
      <ServiceHeroBanner serviceId="ask" color={color} />
      <Text style={styles.introServiceTitle}>Aşkını Bul</Text>
      <Text style={styles.introDesc}>İki burcun uyumunu Tengri'nin bilgeliği ile keşfedin. Aşk, tutku ve ruhsal bağınız okunacak.</Text>
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
function SharePanel({ text, serviceLabel }: { text: string; serviceLabel: string }) {
  const { t, lang } = useLang();
  const [copied, setCopied] = useState(false);
  const shareText = t.shareText(serviceLabel, text);
  const encodedFull = encodeURIComponent(shareText.slice(0, 1000));
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

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
    } catch {
      await copyToClipboard(shareText);
    }
  };

  const handleWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`https://wa.me/?text=${encodedFull}`).catch(() => Share.share({ message: shareText }));
  };

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sharePanel}>
      {/* Label */}
      <View style={styles.sharePanelHeader}>
        <Ionicons name="share-social-outline" size={13} color={Colors.gold} />
        <Text style={styles.sharePanelTitle}>
          {lang === "tr" ? "FALINI PAYLAŞ" : "SHARE YOUR READING"}
        </Text>
      </View>

      {/* Teaser preview */}
      <Text style={styles.sharePreviewText} numberOfLines={2}>
        {"🔮 " + (lang === "tr" ? "TENGRI uygulamasından fal yorumum" : "My fortune reading from TENGRI app")}
      </Text>

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
              {lang === "tr" ? "Falımı Paylaş" : "Share My Reading"}
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
  const { goldBalance, canAfford, spendGold, addReading, getServiceCost, userProfile } = useApp();
  const { t, lang } = useLang();

  const base = SERVICE_META_BASE[service] || SERVICE_META_BASE.astroloji;
  const readingMeta = (t.reading_meta as any)[service] || (t.reading_meta as any).astroloji;
  const serviceLabel = (t.services_list as any)[service]?.label || service;
  const goldCost = getServiceCost(service);

  const isKahve = service === "kahve";
  const isEl = service === "el";

  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [readingText, setReadingText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [photo, setPhoto] = useState<{ uri: string; base64: string; type: string } | null>(null);
  const [kahvePhotos, setKahvePhotos] = useState<{ uri: string; base64: string; type: string }[]>([]);
  const [showGoldModal, setShowGoldModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [inputError, setInputError] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const hasValidInput = isKahve
    ? (kahvePhotos.length > 0 || userInput.trim().length > 0)
    : isEl
    ? (photo !== null || userInput.trim().length > 0)
    : userInput.trim().length > 0;

  const sendButtonScale = useSharedValue(1);
  const sendButtonStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendButtonScale.value }] }));

  const canRead = canAfford(service);

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
    if (img) { setKahvePhotos((prev) => [...prev, img]); setInputError(false); }
  };

  const handleElPhoto = async (source: "gallery" | "camera") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const img = source === "camera" ? await pickFromCamera() : await pickFromGallery();
    if (img) { setPhoto(img); setInputError(false); }
  };

  const handleCameraCapture = (capturedPhoto: { uri: string; base64: string; type: string }) => {
    setKahvePhotos([capturedPhoto]);
    handleRead([capturedPhoto]);
  };

  const handleRead = async (photosOverride?: { uri: string; base64: string; type: string }[]) => {
    if (!canRead) { setShowGoldModal(true); return; }

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

    setIsLoading(true);
    setReadingText("");
    setIsDone(false);
    spendGold(service);

    try {
      const baseUrl = getApiUrl();
      const body: Record<string, any> = { service, userInput: userInput.trim() || "" };
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
              await addReading({ service, serviceLabel, content: fullText, userInput });
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
                <View style={[styles.cameraReadBadge, { backgroundColor: base.color }]}>
                  <Text style={styles.cameraReadBadgeText}>YENİ</Text>
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
              onRemove={(idx) => setKahvePhotos((prev) => prev.filter((_, i) => i !== idx))}
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
              <Text style={styles.readingText}>{readingText}</Text>
              {isLoading && <ActivityIndicator size="small" color={base.color} style={{ padding: 12 }} />}
            </Animated.View>
          )}

          {/* Share + New reading */}
          {isDone && readingText && <SharePanel text={readingText} serviceLabel={serviceLabel} />}
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
                      <Pressable onPress={() => handleAddKahvePhoto("camera")} style={[styles.photoSourceBtn, { borderColor: base.color + "50" }]}>
                        <Ionicons name="camera" size={22} color={base.color} />
                        <Text style={[styles.photoSourceLabel, { color: base.color }]}>
                          {lang === "tr" ? "Kamera" : "Camera"}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => handleAddKahvePhoto("gallery")} style={[styles.photoSourceBtn, { borderColor: base.color + "50" }]}>
                        <Ionicons name="images-outline" size={22} color={base.color} />
                        <Text style={[styles.photoSourceLabel, { color: base.color }]}>
                          {lang === "tr" ? "Galeri" : "Gallery"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
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
                  disabled={isLoading}
                  style={[
                    styles.sendBtn,
                    { backgroundColor: !canRead ? Colors.textDim : hasValidInput ? base.color : base.color + "50" }
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Ionicons name={!canRead ? "lock-closed" : "sparkles"} size={20} color={Colors.background} />
                  )}
                </Pressable>
              </Animated.View>
            </View>
            {!canRead && (
              <Pressable onPress={() => setShowGoldModal(true)} style={styles.purchaseNudge}>
                <Text style={styles.purchaseNudgeText}>
                  {lang === "tr"
                    ? `${goldCost}✦ gerekiyor • `
                    : `${goldCost}✦ required • `}
                  <Text style={{ color: Colors.gold }}>{lang === "tr" ? "Altın Satın Al" : "Buy Gold"}</Text>
                </Text>
              </Pressable>
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
    padding: 14, gap: 10,
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
  purchaseNudge: { alignItems: "center", paddingBottom: 2 },
  purchaseNudgeText: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textDim },
});
