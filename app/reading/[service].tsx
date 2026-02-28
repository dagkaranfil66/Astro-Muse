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
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
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
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { getApiUrl } from "@/lib/query-client";

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
  const steam1 = useSharedValue(0);
  const steam2 = useSharedValue(0);
  const cupScale = useSharedValue(0.8);

  React.useEffect(() => {
    cupScale.value = withSpring(1, { damping: 10 });
    steam1.value = withRepeat(
      withSequence(withTiming(-20, { duration: 1500 }), withTiming(0, { duration: 0 })), -1, false
    );
    steam2.value = withDelay(500, withRepeat(
      withSequence(withTiming(-18, { duration: 1800 }), withTiming(0, { duration: 0 })), -1, false
    ));
  }, []);

  const cupStyle = useAnimatedStyle(() => ({ transform: [{ scale: cupScale.value }] }));
  const s1Style = useAnimatedStyle(() => ({ transform: [{ translateY: steam1.value }], opacity: Math.max(0, 1 - Math.abs(steam1.value) / 20) }));
  const s2Style = useAnimatedStyle(() => ({ transform: [{ translateY: steam2.value }], opacity: Math.max(0, 1 - Math.abs(steam2.value) / 18) }));

  return (
    <View style={styles.serviceIntro}>
      <View style={{ alignItems: "center", height: 110 }}>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 4 }}>
          <Animated.View style={[styles.steam, { backgroundColor: color }, s1Style]} />
          <Animated.View style={[styles.steam, { backgroundColor: color, height: 16 }, s2Style]} />
          <Animated.View style={[styles.steam, { backgroundColor: color }, s1Style]} />
        </View>
        <Animated.View style={[styles.cupOuter, { borderColor: color + "50" }, cupStyle]}>
          <Ionicons name="cafe" size={44} color={color} />
        </Animated.View>
        <View style={[styles.saucer, { borderColor: color + "40" }]} />
      </View>
      <Text style={styles.introServiceTitle}>Kahve Falı</Text>
      <Text style={styles.introDesc}>Fincanınızın fotoğrafını yükleyin ya da içindeki şekilleri anlatın. Tengri'nin bilgesi telvelerdeki kaderi okuyacak.</Text>
    </View>
  );
}

function ElIntro({ color }: { color: string }) {
  const glow = useSharedValue(0.3);
  const scale = useSharedValue(0.8);

  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 10 });
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1200 }), withTiming(0.2, { duration: 1200 })), -1, false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.serviceIntro}>
      <View style={{ alignItems: "center", height: 110 }}>
        <Animated.View style={[styles.handGlow, { backgroundColor: color }, glowStyle]} />
        <Animated.View style={[styles.handContainer, { borderColor: color + "50" }, scaleStyle]}>
          <Ionicons name="hand-left" size={50} color={color} />
        </Animated.View>
        {[...Array(3)].map((_, i) => (
          <View key={i} style={[styles.palmLine, { top: 48 + i * 14, backgroundColor: color + "60", width: 40 + i * 8 }]} />
        ))}
      </View>
      <Text style={styles.introServiceTitle}>El Falı</Text>
      <Text style={styles.introDesc}>Avucunuzun fotoğrafını yükleyin ya da çizgilerinizi anlatın. Kader haritanız okunacak.</Text>
    </View>
  );
}

function TarotCard({ color, label, isDone, flipDelay, floatDelay }: {
  color: string; label: string; isDone: boolean; flipDelay: number; floatDelay: number;
}) {
  const flipProg = useSharedValue(0);
  const floatY = useSharedValue(0);

  React.useEffect(() => {
    floatY.value = withDelay(floatDelay, withRepeat(
      withSequence(withTiming(-7, { duration: 2200 }), withTiming(0, { duration: 2200 })), -1, false
    ));
  }, []);

  React.useEffect(() => {
    if (isDone) {
      flipProg.value = withDelay(flipDelay, withSpring(1, { damping: 12 }));
    } else {
      flipProg.value = 0;
    }
  }, [isDone]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
    opacity: 1 - flipProg.value * 0.1,
  }));

  return (
    <View style={styles.tarotCardWrap}>
      <Animated.View style={[styles.tarotCard, { borderColor: color + "50" }, style]}>
        <LinearGradient colors={["#1A1205", "#0D1020"]} style={styles.tarotCardInner}>
          {isDone ? (
            <Ionicons name="sparkles" size={22} color={color} />
          ) : (
            <Ionicons name="star-outline" size={20} color={color + "80"} />
          )}
        </LinearGradient>
      </Animated.View>
      <Text style={[styles.tarotCardLabel, { color: color + "90" }]}>{label}</Text>
    </View>
  );
}

function TarotIntro({ color, isDone }: { color: string; isDone: boolean }) {
  return (
    <View style={styles.tarotIntro}>
      <View style={styles.tarotCardsRow}>
        {TAROT_CARD_NAMES.map((label, i) => (
          <TarotCard key={i} color={color} label={label} isDone={isDone} flipDelay={i * 400} floatDelay={i * 250} />
        ))}
      </View>
      {!isDone && (
        <Text style={styles.introDesc}>Sorunuzu yazın ve kartlarınızın çekilmesini bekleyin. Tengri'nin tarot bilgesi üç kartı açacak.</Text>
      )}
    </View>
  );
}

function DogumIntro({ color }: { color: string }) {
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0.7);

  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 10 });
    rotate.value = withRepeat(withTiming(360, { duration: 20000 }), -1, false);
  }, []);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const zodiac = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

  return (
    <View style={styles.serviceIntro}>
      <View style={{ alignItems: "center", height: 130 }}>
        <Animated.View style={scaleStyle}>
          <View style={[styles.zodiacWheel, { borderColor: color + "30" }]}>
            <Animated.View style={[styles.zodiacRing, ringStyle]}>
              {zodiac.map((sign, i) => {
                const angle = (i / 12) * 2 * Math.PI;
                const r = 52;
                return (
                  <Text
                    key={i}
                    style={[styles.zodiacSign, {
                      color: color,
                      position: "absolute",
                      left: 62 + Math.cos(angle) * r - 8,
                      top: 62 + Math.sin(angle) * r - 8,
                    }]}
                  >
                    {sign}
                  </Text>
                );
              })}
            </Animated.View>
            <Ionicons name="planet" size={36} color={color} />
          </View>
        </Animated.View>
      </View>
      <Text style={styles.introServiceTitle}>Doğum Haritası</Text>
      <Text style={styles.introDesc}>Doğum tarihiniz, saatiniz ve şehrinizi girerek kişisel yıldız haritanızı çıkarın.</Text>
    </View>
  );
}

function RuyaIntro({ color }: { color: string }) {
  const float = useSharedValue(0);
  const moonGlow = useSharedValue(0.5);
  const scale = useSharedValue(0.8);

  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 10 });
    float.value = withRepeat(
      withSequence(withTiming(-12, { duration: 2500 }), withTiming(0, { duration: 2500 })), -1, false
    );
    moonGlow.value = withRepeat(
      withSequence(withTiming(1, { duration: 2000 }), withTiming(0.3, { duration: 2000 })), -1, false
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }, { scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: moonGlow.value }));

  return (
    <View style={styles.serviceIntro}>
      <View style={{ alignItems: "center", height: 120 }}>
        <Animated.View style={[styles.dreamGlow, { backgroundColor: color }, glowStyle]} />
        <Animated.View style={floatStyle}>
          <View style={[styles.dreamCloud, { borderColor: color + "40" }]}>
            <Ionicons name="moon" size={42} color={color} />
          </View>
        </Animated.View>
      </View>
      <Text style={styles.introServiceTitle}>Rüya Yorumu</Text>
      <Text style={styles.introDesc}>Gördüğünüz rüyayı anlatın. Şamanist gelenek ile rüyanızın mistik mesajını çözelim.</Text>
    </View>
  );
}

function BurclarIntro({ color }: { color: string }) {
  const rotate = useSharedValue(0);
  const glow = useSharedValue(0.4);

  React.useEffect(() => {
    rotate.value = withRepeat(
      withSequence(withTiming(10, { duration: 3000 }), withTiming(-10, { duration: 3000 })), -1, true
    );
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1800 }), withTiming(0.2, { duration: 1800 })), -1, false
    );
  }, []);

  const rStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  const gStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={styles.serviceIntro}>
      <View style={{ alignItems: "center", height: 110 }}>
        <Animated.View style={[styles.zodiacGlow, { backgroundColor: color }, gStyle]} />
        <Animated.View style={rStyle}>
          <View style={[styles.zodiacIcon, { borderColor: color + "50" }]}>
            <Ionicons name="telescope" size={44} color={color} />
          </View>
        </Animated.View>
      </View>
      <Text style={styles.introServiceTitle}>Burçlar</Text>
      <Text style={styles.introDesc}>Burcunuzu yazın ve bu haftaya özel mistik yorumunuzu alın. Aşk, kariyer ve ruhsal rehberlik.</Text>
    </View>
  );
}

function AskIntro({ color }: { color: string }) {
  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);

  React.useEffect(() => {
    pulse1.value = withRepeat(
      withSequence(withTiming(1.25, { duration: 700 }), withTiming(1, { duration: 700 })), -1, false
    );
    pulse2.value = withDelay(350, withRepeat(
      withSequence(withTiming(1.2, { duration: 700 }), withTiming(1, { duration: 700 })), -1, false
    ));
  }, []);

  const s1 = useAnimatedStyle(() => ({ transform: [{ scale: pulse1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ scale: pulse2.value }] }));

  return (
    <View style={styles.serviceIntro}>
      <View style={{ alignItems: "center", height: 110, justifyContent: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: -8 }}>
          <Animated.View style={[styles.heartWrap, { borderColor: color + "40" }, s1]}>
            <Ionicons name="heart" size={30} color={color} />
          </Animated.View>
          <View style={styles.heartJoin}>
            <Ionicons name="sparkles" size={16} color={Colors.gold} />
          </View>
          <Animated.View style={[styles.heartWrap, { borderColor: color + "40" }, s2]}>
            <Ionicons name="heart" size={30} color={color} />
          </Animated.View>
        </View>
      </View>
      <Text style={styles.introServiceTitle}>Aşkını Bul</Text>
      <Text style={styles.introDesc}>İki burcun uyumunu Tengri'nin bilgeliği ile keşfedin. Aşk, tutku ve ruhsal bağınız okunacak.</Text>
    </View>
  );
}

function DefaultIntro({ color, icon, label, hint }: { color: string; icon: keyof typeof Ionicons.glyphMap; label: string; hint: string }) {
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.4);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 1500 }), withTiming(1, { duration: 1500 })), -1, false
    );
    glow.value = withRepeat(
      withSequence(withTiming(0.9, { duration: 2000 }), withTiming(0.2, { duration: 2000 })), -1, false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={styles.serviceIntro}>
      <View style={{ alignItems: "center", height: 120 }}>
        <Animated.View style={[styles.defaultGlow, { backgroundColor: color }, glowStyle]} />
        <Animated.View style={[styles.defaultIconWrap, { borderColor: color + "40" }, pulseStyle]}>
          <Ionicons name={icon} size={50} color={color} />
        </Animated.View>
      </View>
      <Text style={styles.introServiceTitle}>{label}</Text>
      <Text style={styles.introDesc}>{hint}</Text>
    </View>
  );
}

// ────────── Share Panel ──────────
function SharePanel({ text, serviceLabel }: { text: string; serviceLabel: string }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const shareText = t.shareText(serviceLabel, text);

  const copyText = async () => {
    try {
      if (Platform.OS === "web" && navigator?.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setCopied(false), 2500);
      } else {
        await Share.share({ message: shareText });
      }
    } catch {}
  };

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sharePanel}>
      <View style={styles.sharePanelHeader}>
        <Ionicons name="share-social-outline" size={13} color={Colors.gold} />
        <Text style={styles.sharePanelTitle}>{t.share}</Text>
      </View>
      <View style={styles.shareButtons}>
        <Pressable onPress={() => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(shareText)}`)} style={[styles.shareBtn, styles.shareBtnWA]}>
          <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          <Text style={[styles.shareBtnLabel, { color: "#25D366" }]}>WhatsApp</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.slice(0, 280))}`)} style={[styles.shareBtn, styles.shareBtnTW]}>
          <Ionicons name="logo-twitter" size={18} color="#1DA1F2" />
          <Text style={[styles.shareBtnLabel, { color: "#1DA1F2" }]}>Twitter/X</Text>
        </Pressable>
        <Pressable onPress={copyText} style={[styles.shareBtn, styles.shareBtnCopy]}>
          <Ionicons name={copied ? "checkmark-circle" : "copy-outline"} size={18} color={copied ? "#4CAF7A" : Colors.textSecondary} />
          <Text style={[styles.shareBtnLabel, { color: copied ? "#4CAF7A" : Colors.textSecondary }]}>
            {copied ? t.copied : t.copyText}
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
  const { remainingReadings, isPurchased, consumeTrial, addReading } = useApp();
  const { t, lang } = useLang();

  const base = SERVICE_META_BASE[service] || SERVICE_META_BASE.astroloji;
  const readingMeta = (t.reading_meta as any)[service] || (t.reading_meta as any).astroloji;
  const serviceLabel = (t.services_list as any)[service]?.label || service;

  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [readingText, setReadingText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [photo, setPhoto] = useState<{ uri: string; base64: string; type: string } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const sendButtonScale = useSharedValue(1);
  const sendButtonStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendButtonScale.value }] }));

  const canRead = isPurchased ? true : remainingReadings > 0;

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPhoto({
          uri: asset.uri,
          base64: asset.base64 || "",
          type: asset.mimeType || "image/jpeg",
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {}
  };

  const handleRead = async () => {
    if (!canRead) { router.push("/purchase"); return; }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendButtonScale.value = withSpring(0.9, {}, () => { sendButtonScale.value = withSpring(1); });

    setIsLoading(true);
    setReadingText("");
    setIsDone(false);
    consumeTrial();

    try {
      const baseUrl = getApiUrl();
      const body: Record<string, string> = { service, userInput: userInput || "Benim için mistik bir okuma yap." };
      if (photo?.base64 && base.hasPhoto) {
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
    if (service === "tarot") return <TarotIntro color={base.color} isDone={isDone} />;
    if (service === "dogum") return <DogumIntro color={base.color} />;
    if (service === "ruya") return <RuyaIntro color={base.color} />;
    if (service === "burclar") return <BurclarIntro color={base.color} />;
    if (service === "ask") return <AskIntro color={base.color} />;
    return <DefaultIntro color={base.color} icon={base.icon} label={serviceLabel} hint={readingMeta.hint} />;
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
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={topPad + 60}
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

          {/* Loading */}
          {isLoading && !readingText && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={base.color} />
              <Text style={[styles.loadingText, { color: base.color }]}>{readingMeta.hint}</Text>
            </View>
          )}

          {/* Tarot cards overlay above reading */}
          {base.isTarot && (readingText || isLoading) && (
            <TarotIntro color={base.color} isDone={isDone} readingText={readingText} />
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
            {/* Photo upload for kahve and el */}
            {base.hasPhoto && (
              <View style={styles.photoRow}>
                <Pressable onPress={pickPhoto} style={[styles.photoBtn, { borderColor: base.color + "40" }]}>
                  {photo ? (
                    <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={20} color={base.color} />
                      <Text style={[styles.photoBtnText, { color: base.color }]}>
                        {lang === "tr" ? "Fotoğraf Yükle" : "Upload Photo"}
                      </Text>
                    </>
                  )}
                </Pressable>
                {photo && (
                  <Pressable onPress={() => setPhoto(null)} style={styles.photoRemove}>
                    <Ionicons name="close-circle" size={18} color={Colors.textDim} />
                  </Pressable>
                )}
              </View>
            )}

            <Text style={styles.inputLabelText}>{readingMeta.inputLabel}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={userInput}
                onChangeText={setUserInput}
                placeholder={readingMeta.placeholder}
                placeholderTextColor={Colors.textDim}
                multiline
                maxLength={400}
                editable={!isLoading}
              />
              <Animated.View style={sendButtonStyle}>
                <Pressable
                  onPress={handleRead}
                  disabled={isLoading}
                  style={[styles.sendBtn, { backgroundColor: canRead ? base.color : Colors.textDim }]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Ionicons name={canRead ? "sparkles" : "lock-closed"} size={20} color={Colors.background} />
                  )}
                </Pressable>
              </Animated.View>
            </View>
            {!canRead && (
              <Pressable onPress={() => router.push("/purchase")} style={styles.purchaseNudge}>
                <Text style={styles.purchaseNudgeText}>
                  {t.freeTrial} • <Text style={{ color: Colors.gold }}>{t.buyPackage}</Text>
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  star: { position: "absolute", width: 2, height: 2, borderRadius: 1, backgroundColor: Colors.gold },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  headerTitle: { fontSize: 13, fontFamily: "CinzelDecorative_400Regular", color: Colors.text, letterSpacing: 0.5 },

  content: { paddingHorizontal: 18, paddingTop: 8, flexGrow: 1 },

  // Service intros
  serviceIntro: { alignItems: "center", paddingVertical: 20, gap: 12 },
  introServiceTitle: { fontSize: 20, fontFamily: "CinzelDecorative_700Bold", color: Colors.text, textAlign: "center" },
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
  tarotCard: { width: (width - 80) / 3, height: 110, borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  tarotCardInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  tarotCardLabel: { fontSize: 9, fontFamily: "CinzelDecorative_400Regular", letterSpacing: 1 },

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
  readingHeaderText: { fontSize: 10, fontFamily: "CinzelDecorative_400Regular", letterSpacing: 2 },
  readingText: { padding: 16, fontSize: 15, fontFamily: "Lora_400Regular", color: Colors.text, lineHeight: 26 },

  // Share
  sharePanel: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.gold + "25", padding: 14, marginBottom: 12 },
  sharePanelHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sharePanelTitle: { fontSize: 10, fontFamily: "CinzelDecorative_400Regular", color: Colors.gold, letterSpacing: 2, textTransform: "uppercase" },
  shareButtons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9, borderWidth: 1 },
  shareBtnWA: { borderColor: "#25D36640", backgroundColor: "#25D36610" },
  shareBtnTW: { borderColor: "#1DA1F240", backgroundColor: "#1DA1F210" },
  shareBtnCopy: { borderColor: Colors.cardBorder, backgroundColor: Colors.surfaceElevated },
  shareBtnLabel: { fontSize: 11, fontFamily: "Lora_400Regular" },

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
  purchaseNudge: { alignItems: "center", paddingBottom: 2 },
  purchaseNudgeText: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textDim },
});
