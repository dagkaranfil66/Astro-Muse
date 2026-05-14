import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  useAnimatedScrollHandler,
  interpolate,
  interpolateColor,
  Extrapolation,
  FadeInDown,
  FadeIn,
  ZoomIn,
  Easing,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import WelcomeBonusModal from "@/components/WelcomeBonusModal";

const { width, height } = Dimensions.get("window");

// ────────── Cosmic Symbols ──────────
const COSMIC_SYMBOLS = [
  { symbol: "☀", x: width * 0.12, y: height * 0.08, size: 18, duration: 22000, delay: 0, color: "#FFD700" },
  { symbol: "☽", x: width * 0.82, y: height * 0.12, size: 22, duration: 28000, delay: 4000, color: "#C8A0DC" },
  { symbol: "✦", x: width * 0.05, y: height * 0.32, size: 14, duration: 18000, delay: 2000, color: "#5B9BD5" },
  { symbol: "✧", x: width * 0.9, y: height * 0.45, size: 12, duration: 24000, delay: 7000, color: "#FF6B9D" },
  { symbol: "⊕", x: width * 0.2, y: height * 0.55, size: 13, duration: 30000, delay: 5000, color: "#9B59B6" },
  { symbol: "☿", x: width * 0.75, y: height * 0.28, size: 15, duration: 20000, delay: 3000, color: "#5B9BD5" },
  { symbol: "⋆", x: width * 0.55, y: height * 0.06, size: 16, duration: 26000, delay: 9000, color: "#C0932A" },
  { symbol: "⊙", x: width * 0.88, y: height * 0.7, size: 14, duration: 32000, delay: 6000, color: "#FF8C42" },
  { symbol: "☾", x: width * 0.1, y: height * 0.72, size: 20, duration: 25000, delay: 1000, color: "#C8A0DC" },
];

function CosmicSymbol({ cfg }: { cfg: typeof COSMIC_SYMBOLS[0] }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withDelay(
      cfg.delay,
      withRepeat(
        withSequence(
          withTiming(0.18, { duration: cfg.duration * 0.4 }),
          withTiming(0.08, { duration: cfg.duration * 0.3 }),
          withTiming(0.22, { duration: cfg.duration * 0.3 }),
        ),
        -1, true
      )
    );
    translateY.value = withDelay(
      cfg.delay,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: cfg.duration * 0.5 }),
          withTiming(8, { duration: cfg.duration * 0.5 }),
        ),
        -1, true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ position: "absolute", left: cfg.x, top: cfg.y }, style]}>
      <Text style={{ fontSize: cfg.size, color: cfg.color }}>{cfg.symbol}</Text>
    </Animated.View>
  );
}

// ────────── Shooting Stars ──────────
const SHOOTING_STARS = Array.from({ length: 12 }, (_, i) => {
  const isGold = i % 3 === 0;
  return {
    startX: -120 + Math.random() * (width + 80),
    startY: -30  + Math.random() * (height * 0.72),
    angle:  18   + Math.random() * 22,
    duration: 1400 + Math.random() * 1800,
    delay: i * 1600 + Math.random() * 3200,
    length: 110 + Math.random() * 120,
    travel: 420 + Math.random() * 220,
    headSize: 2.5 + Math.random() * 2,
    isGold,
  };
});

function ShootingStar({ cfg }: { cfg: typeof SHOOTING_STARS[0] }) {
  const progress = useSharedValue(0);
  const opacity  = useSharedValue(0);

  React.useEffect(() => {
    const cycle = cfg.duration + cfg.delay + 1200;
    const loop = () => {
      progress.value = 0;
      opacity.value  = 0;
      opacity.value = withDelay(cfg.delay, withSequence(
        withTiming(1, { duration: 180 }),
        withDelay(cfg.duration - 360, withTiming(0, { duration: 360 }))
      ));
      progress.value = withDelay(cfg.delay, withTiming(1, { duration: cfg.duration, easing: Easing.out(Easing.quad) }));
    };
    loop();
    const id = setInterval(loop, cycle);
    return () => clearInterval(id);
  }, []);

  const rad = (cfg.angle * Math.PI) / 180;
  const dx  = Math.cos(rad) * cfg.travel;
  const dy  = Math.sin(rad) * cfg.travel;

  const trailStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: progress.value * dx },
      { translateY: progress.value * dy },
    ],
  }));
  const headStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: progress.value * dx + Math.cos(rad) * cfg.length * 0.82 },
      { translateY: progress.value * dy + Math.sin(rad) * cfg.length * 0.82 },
    ],
  }));

  const headColor = cfg.isGold ? "rgba(255,220,80,1)" : "rgba(255,255,255,1)";
  const tailColor = cfg.isGold
    ? ["rgba(200,160,32,0)", "rgba(220,180,60,0.55)", "rgba(255,220,80,0.95)"]
    : ["rgba(30,60,120,0)", "rgba(160,120,240,0.6)", "rgba(255,255,255,0.95)"];

  return (
    <View style={{ position: "absolute", top: cfg.startY, left: cfg.startX }}>
      {/* Kuyruk */}
      <Animated.View style={trailStyle}>
        <LinearGradient
          colors={tailColor as [string, string, string]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            width: cfg.length,
            height: 1.8,
            borderRadius: 2,
            transform: [{ rotate: `${cfg.angle}deg` }],
          }}
        />
      </Animated.View>
      {/* Parlak baş */}
      <Animated.View style={[{
        position: "absolute",
        width: cfg.headSize * 2,
        height: cfg.headSize * 2,
        borderRadius: cfg.headSize,
        backgroundColor: headColor,
        shadowColor: headColor,
        shadowOpacity: 0.9,
        shadowRadius: cfg.headSize * 2.5,
        shadowOffset: { width: 0, height: 0 },
        top: -(cfg.headSize),
        left: -(cfg.headSize),
      }, headStyle]} />
    </View>
  );
}

// ────────── Mandala Ring ──────────
function MandalaRing({ radius, dotCount, color, duration, reverse }: {
  radius: number; dotCount: number; color: string; duration: number; reverse?: boolean;
}) {
  const rotate = useSharedValue(0);
  React.useEffect(() => {
    rotate.value = withRepeat(withTiming(reverse ? -360 : 360, { duration }), -1, false);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  const size = radius * 2 + 6;

  return (
    <Animated.View style={[{ width: size, height: size, position: "absolute", alignItems: "center", justifyContent: "center" }, style]}>
      {Array.from({ length: dotCount }, (_, i) => {
        const angle = (i / dotCount) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              width: i % 3 === 0 ? 5 : 3,
              height: i % 3 === 0 ? 5 : 3,
              borderRadius: 3,
              backgroundColor: color,
              opacity: i % 3 === 0 ? 0.9 : 0.4,
              left: size / 2 + x - 2.5,
              top: size / 2 + y - 2.5,
            }}
          />
        );
      })}
    </Animated.View>
  );
}

// ────────── Star Ring ──────────
function StarRing({ radius, count, color, duration, reverse }: {
  radius: number; count: number; color: string; duration: number; reverse?: boolean;
}) {
  const rotate = useSharedValue(0);
  React.useEffect(() => {
    rotate.value = withRepeat(
      withTiming(reverse ? -360 : 360, { duration, easing: Easing.linear }),
      -1, false
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  const size = radius * 2 + 24;
  return (
    <Animated.View style={[{ width: size, height: size, position: "absolute", alignItems: "center", justifyContent: "center" }, style]}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const big = i % 3 === 0;
        return (
          <Text key={i} style={{
            position: "absolute",
            fontSize: big ? 11 : 7,
            color,
            opacity: big ? 0.95 : 0.45,
            left: size / 2 + x - (big ? 5.5 : 3.5),
            top:  size / 2 + y - (big ? 5.5 : 3.5),
          }}>✦</Text>
        );
      })}
    </Animated.View>
  );
}

// ────────── Twinkle Stars ──────────
function TwinkleStar({ left, top, sz, delay, dur }: { left: number; top: number; sz: number; delay: number; dur: number }) {
  const op = useSharedValue(0.05);
  React.useEffect(() => {
    op.value = withDelay(delay, withRepeat(
      withSequence(withTiming(1, { duration: dur, easing: Easing.out(Easing.sin) }), withTiming(0.05, { duration: dur, easing: Easing.in(Easing.sin) })),
      -1, false
    ));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    <Animated.Text style={[{ position: "absolute", fontSize: sz, color: Colors.gold, left, top }, style]}>✦</Animated.Text>
  );
}

function TwinkleStars({ centerX, centerY }: { centerX: number; centerY: number }) {
  const stars = React.useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * 2 * Math.PI + i * 0.52;
      const r = 77 + (i % 4) * 5;
      const sz = i % 4 === 0 ? 8 : i % 3 === 0 ? 7 : 5;
      return {
        left: centerX + Math.cos(angle) * r - sz / 2,
        top:  centerY + Math.sin(angle) * r - sz / 2,
        sz,
        delay: i * 380,
        dur: 900 + (i % 5) * 280,
      };
    }), []
  );
  return <>{stars.map((s, i) => <TwinkleStar key={i} {...s} />)}</>;
}

// ────────── Tengri Logo ──────────
function AnimatedLogo() {
  const floatY  = useSharedValue(0);
  const phase   = useSharedValue(0);
  const breathe = useSharedValue(1);

  React.useEffect(() => {
    floatY.value = withRepeat(
      withSequence(withTiming(-10, { duration: 4000 }), withTiming(0, { duration: 4000 })),
      -1, false
    );
    phase.value = withRepeat(
      withSequence(withTiming(1, { duration: 10000 }), withTiming(0, { duration: 10000 })),
      -1, false
    );
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.055, { duration: 3800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.000, { duration: 3800, easing: Easing.inOut(Easing.sin) })
      ), -1, false
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));
  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1.0 + phase.value * 0.22 }],
    opacity: 0.05 + phase.value * 0.17,
    backgroundColor: interpolateColor(phase.value, [0, 1], ["#FF6B9D", "#5B9BD5"]),
  }));
  const glowMidStyle = useAnimatedStyle(() => ({
    opacity: 0.04 + (1 - phase.value) * 0.10,
    backgroundColor: interpolateColor(phase.value, [0, 1], ["#FF69B4", "#9B59B6"]),
  }));

  const CX = 72, CY = 72;

  return (
    <View style={styles.logoContainer}>
      <Animated.View style={[styles.logoGlowOuter, glowStyle]} />
      <Animated.View style={[styles.logoGlowMid, glowMidStyle]} />

      {/* Renkli mandala halkaları */}
      <MandalaRing radius={58} dotCount={20} color="#5B9BD5" duration={12000} />
      <MandalaRing radius={47} dotCount={14} color="#FF6B9D" duration={9000} reverse />
      <MandalaRing radius={70} dotCount={8}  color="#9B59B6" duration={18000} />

      {/* ✦ Altın yıldız halkası — yavaş, ters yönde döner */}
      <StarRing radius={73} count={14} color={Colors.gold} duration={28000} reverse />

      {/* Etrafta titreşen yıldızlar */}
      <TwinkleStars centerX={CX} centerY={CY} />

      {/* Logo — float + nefes alma */}
      <Animated.View style={floatStyle}>
        <Animated.View style={breatheStyle}>
          <Image
            source={require("@/assets/images/tengri-logo.png")}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ────────── Service Card ──────────
const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  astroloji: "moon-outline",
  kahve: "cafe-outline",
  el: "hand-left-outline",
  tarot: "layers-outline",
  samanizm: "leaf-outline",
  numeroloji: "star-outline",
  ruh: "eye-outline",
  dogum: "planet-outline",
  ruya: "cloud-outline",
  ask: "heart-outline",
  burclar: "telescope-outline",
};
const SERVICE_COLORS: Record<string, string> = {
  astroloji: "#6B4FBB", kahve: "#C0932A", el: "#1ABFB8", tarot: "#E7B008",
  samanizm: "#4CAF7A", numeroloji: "#E74C8B", ruh: "#9B59B6",
  dogum: "#FF8C42", ruya: "#5B9BD5", ask: "#FF4757", burclar: "#FF6B9D",
};
const SERVICE_GRADIENTS: Record<string, [string, string]> = {
  astroloji: ["#1A0F35", "#0D1526"], kahve: ["#2A1A05", "#0D1526"], el: ["#051A1A", "#0D1526"],
  tarot: ["#1A1205", "#0D1526"], samanizm: ["#051A0D", "#0D1526"], numeroloji: ["#1A0510", "#0D1526"],
  ruh: ["#150E25", "#0D1526"], dogum: ["#1A0E05", "#0D1526"], ruya: ["#051020", "#0D1526"],
  ask: ["#1A0508", "#0D1526"], burclar: ["#1A0515", "#0D1526"],
};

const SERVICE_IMAGES: Record<string, any> = {
  astroloji: require("@/assets/images/services/astroloji.png"),
  kahve:     require("@/assets/images/services/kahve.png"),
  el:        require("@/assets/images/services/el.png"),
  tarot:     require("@/assets/images/services/tarot.png"),
  samanizm:  require("@/assets/images/services/samanizm.png"),
  numeroloji:require("@/assets/images/services/numeroloji.png"),
  ruh:       require("@/assets/images/services/ruh.png"),
  dogum:     require("@/assets/images/services/dogum.png"),
  ruya:      require("@/assets/images/services/ruya.png"),
  ask:       require("@/assets/images/services/ask.png"),
  burclar:   require("@/assets/images/services/burclar.png"),
};

// Ordered 9 services shown on home
const HOME_SERVICES_ORDERED = [
  "kahve", "tarot", "astroloji", "burclar", "el", "numeroloji", "ruya", "ask", "samanizm",
];
const POPULAR_SERVICE = "kahve";

const ANIM_TYPES = ["rotate", "pulse", "bounce", "flip", "slide", "spin", "glow", "rotate", "pulse", "bounce", "flip"];

function ServiceCard({ serviceId, index, label, desc, onPress }: {
  serviceId: string; index: number; label: string; desc: string; onPress: () => void;
}) {
  const animType = ANIM_TYPES[index % ANIM_TYPES.length];
  const color = SERVICE_COLORS[serviceId];
  const icon = SERVICE_ICONS[serviceId] || "star-outline";
  const gradient = SERVICE_GRADIENTS[serviceId] || ["#0D1526", "#0D1526"];
  const serviceImage = SERVICE_IMAGES[serviceId];

  const cardScale = useSharedValue(1);
  const iconRotate = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const iconTranslateX = useSharedValue(0);
  const borderGlow = useSharedValue(0.25);

  React.useEffect(() => {
    if (animType === "rotate") {
      iconRotate.value = withRepeat(withTiming(360, { duration: 7000 }), -1, false);
    } else if (animType === "pulse") {
      iconScale.value = withRepeat(
        withSequence(withTiming(1.25, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, false
      );
    } else if (animType === "bounce") {
      iconScale.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 500 }), withTiming(0.9, { duration: 200 }), withTiming(1, { duration: 300 })),
        -1, false
      );
    } else if (animType === "slide") {
      iconTranslateX.value = withRepeat(
        withSequence(withTiming(5, { duration: 700 }), withTiming(-5, { duration: 700 })), -1, true
      );
    } else if (animType === "spin") {
      iconRotate.value = withRepeat(
        withSequence(withTiming(15, { duration: 450 }), withTiming(-15, { duration: 450 })), -1, true
      );
    } else if (animType === "glow") {
      borderGlow.value = withRepeat(
        withSequence(withTiming(0.85, { duration: 1600 }), withTiming(0.15, { duration: 1600 })), -1, false
      );
    } else if (animType === "flip") {
      iconScale.value = withRepeat(
        withSequence(withTiming(1, { duration: 1800 }), withTiming(-1, { duration: 300 }), withTiming(1, { duration: 300 })),
        -1, false
      );
    }
  }, []);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotate.value}deg` }, { scale: Math.abs(iconScale.value) }, { translateX: iconTranslateX.value }],
  }));
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: color + Math.round(borderGlow.value * 255).toString(16).padStart(2, "0"),
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 55).springify().damping(15)}
      style={[styles.cardOuter, cardStyle]}
    >
      <Pressable
        onPressIn={() => { cardScale.value = withSpring(0.96); }}
        onPressOut={() => { cardScale.value = withSpring(1); }}
        onPress={onPress}
      >
        <Animated.View style={[styles.cardBorder, borderStyle]}>
          <LinearGradient colors={gradient} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {serviceId === POPULAR_SERVICE && (
              <View style={styles.popularBadge}>
                <Ionicons name="star" size={9} color="#000" />
                <Text style={styles.popularBadgeText}>En Popüler</Text>
              </View>
            )}
            <Animated.View style={[styles.iconCircle, { borderColor: color + "50" }, iconStyle]}>
              {serviceImage ? (
                <Image source={serviceImage} style={styles.serviceImg} resizeMode="cover" />
              ) : (
                <Ionicons name={icon} size={30} color={color} />
              )}
            </Animated.View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{label}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={color + "80"} />
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ────────── Daily Free Card (big hero banner) ──────────
function DailyFreeCard() {
  const { canDailyFree, userProfile } = useApp();
  const { lang } = useLang();
  const pulse     = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const iconGlow  = useSharedValue(0);
  const shimmerX  = useSharedValue(-100);

  React.useEffect(() => {
    if (!canDailyFree) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.025, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0,   { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ), -1, false
    );
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0,  { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ), -1, false
    );
    iconGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.4, { duration: 1000 }),
      ), -1, true
    );
    shimmerX.value = withRepeat(
      withSequence(
        withTiming(width + 100, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withDelay(1800, withTiming(-100, { duration: 0 })),
      ), -1, false
    );
  }, [canDailyFree]);

  const pulseStyle    = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const iconStyle     = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));
  const iconGlowStyle = useAnimatedStyle(() => ({ opacity: iconGlow.value }));
  const shimmerStyle  = useAnimatedStyle(() => ({ transform: [{ translateX: shimmerX.value }] }));

  if (!canDailyFree) {
    return (
      <Animated.View entering={FadeInDown.delay(220).springify()} style={styles.freeCardUsed}>
        <Text style={styles.freeCardUsedEmoji}>☕</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.freeCardUsedTitle}>
            {lang === "tr" ? "Günlük analizin tamamlandı" : "Daily analysis complete"}
          </Text>
          <Text style={styles.freeCardUsedSub}>
            {lang === "tr" ? "Yarın tekrar ücretsiz okuma hakkın gelecek" : "Your free reading resets tomorrow"}
          </Text>
        </View>
        <View style={styles.freeCardUsedBadge}>
          <Text style={styles.freeCardUsedBadgeText}>{lang === "tr" ? "KULLANILDI" : "USED"}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(180).springify()} style={pulseStyle}>
      <Pressable onPress={() => { if (!userProfile) { router.push("/auth"); return; } router.push("/daily-reading" as any); }}>
        <LinearGradient
          colors={["#2A1200", "#3D1A00", "#1A0A00"]}
          style={styles.freeBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.freeBannerGlowBorder} />

          <View style={styles.freeBannerTop}>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>{lang === "tr" ? "ÜCRETSİZ" : "FREE"}</Text>
            </View>
            {/* Animated coffee cup with glow */}
            <View style={styles.freeBannerEmojiWrap}>
              <Animated.View style={[styles.freeBannerEmojiGlow, iconGlowStyle]} />
              <Animated.Text style={[styles.freeBannerEmoji, iconStyle]}>☕</Animated.Text>
            </View>
          </View>

          <Text style={styles.freeBannerTitle}>
            {lang === "tr" ? "AI ile İlk Kahve Falın Ücretsiz" : "Your First AI Coffee Reading Free"}
          </Text>
          <Text style={styles.freeBannerSub}>
            {lang === "tr"
              ? "Fincan fotoğrafını yükle, mistik yorumunu ücretsiz al"
              : "Upload your cup photo — get your mystical reading at no cost"}
          </Text>

          {/* Mystical energy text */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Ionicons name="sparkles" size={12} color={Colors.gold} />
            <Text style={styles.freeMysticalText}>
              {lang === "tr" ? "Enerjin fincana yansıdı…" : "Your energy reflects in the cup…"}
            </Text>
          </View>

          {/* Shimmer CTA button */}
          <View style={styles.freeBannerBtn}>
            <Text style={styles.freeBannerBtnText}>
              {lang === "tr" ? "Hemen Ücretsiz Dene  →" : "Try For Free Now  →"}
            </Text>
            <Animated.View pointerEvents="none" style={[styles.freeBannerShimmer, shimmerStyle]}>
              <LinearGradient
                colors={["transparent", "rgba(255,255,255,0.45)", "transparent"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}


// ────────── Spin Countdown Button ──────────
function SpinCountdownBtn() {
  const { canSpin, lastSpinDate, userProfile } = useApp();
  const { lang } = useLang();
  const goSpin = () => { if (!userProfile) { router.push("/auth"); return; } router.push("/spin"); };
  const [countdown, setCountdown] = useState("");
  const glowPulse = useSharedValue(1);

  React.useEffect(() => {
    if (canSpin) {
      setCountdown("");
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0,  { duration: 900, easing: Easing.inOut(Easing.sin) }),
        ), -1, false
      );
      return;
    }
    const update = () => {
      const target = lastSpinDate ? new Date(lastSpinDate).getTime() + 24 * 60 * 60 * 1000 : Date.now();
      const remaining = Math.max(0, target - Date.now());
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [canSpin, lastSpinDate]);

  const glowStyle = useAnimatedStyle(() => ({ transform: [{ scale: glowPulse.value }] }));

  if (canSpin) {
    return (
      <Pressable onPress={goSpin} style={styles.spinPillReady}>
        <Animated.View style={[styles.spinPillReadyInner, glowStyle]}>
          <Text style={styles.spinPillReadyStar}>🎡</Text>
          <Text style={styles.spinPillReadyText}>{lang === "tr" ? "Şans Çarkı" : "Lucky Wheel"}</Text>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={goSpin} style={styles.spinPillCountdown}>
      <Text style={styles.spinPillCountdownIcon}>⏱</Text>
      <Text style={styles.spinPillCountdownText}>{countdown || "00:00:00"}</Text>
    </Pressable>
  );
}

// ────────── AI Identity Banner ──────────
function AIIdentityBanner({ lang }: { lang: string }) {
  const pulse = useSharedValue(0.7);
  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.7, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ), -1, false
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View entering={FadeInDown.delay(170).springify()} style={styles.aiBanner}>
      <Animated.View style={[styles.aiBannerGlow, glowStyle]} />
      <View style={styles.aiBannerRow}>
        <Ionicons name="sparkles" size={16} color="#00C8FF" />
        <Text style={styles.aiBannerTitle}>
          {lang === "tr" ? "AI Destekli Mistik Analiz" : "AI-Powered Mystic Analysis"}
        </Text>
      </View>
      <Text style={styles.aiBannerDesc}>
        {lang === "tr"
          ? "Yapay zeka sana özel mistik yorumlar üretir."
          : "AI generates personalized mystic insights just for you."}
      </Text>
    </Animated.View>
  );
}

// ────────── Main Screen ──────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, canSpin, showWelcomeBonus, dismissWelcomeBonus } = useApp();
  const { lang, t, toggleLang } = useLang();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((e) => { scrollY.value = e.contentOffset.y; });
  const headerFade = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 130], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [0, 130], [0, -50], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [0, 130], [1, 0.72], Extrapolation.CLAMP) },
    ],
    marginBottom: interpolate(scrollY.value, [0, 130], [10, -148], Extrapolation.CLAMP),
  }));

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const handleServicePress = (serviceId: string) => {
    if (!userProfile) {
      router.push("/auth");
      return;
    }
    if (serviceId === "ask") {
      router.push("/love-compat" as any);
      return;
    }
    if (serviceId === "astroloji") {
      router.push("/reading/dogum" as any);
      return;
    }
    router.push(`/reading/${serviceId}`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#04080F", "#070D1A", "#080D1E"]} style={StyleSheet.absoluteFill} />

      {/* Cosmic Background Layer */}
      <View style={[StyleSheet.absoluteFill, { pointerEvents: "none", overflow: "hidden" }]}>
        {COSMIC_SYMBOLS.map((cfg, i) => <CosmicSymbol key={`cs-${i}`} cfg={cfg} />)}
        {SHOOTING_STARS.map((cfg, i) => <ShootingStar key={`ss-${i}`} cfg={cfg} />)}
      </View>

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 10 }]}>
        <Pressable onPress={() => userProfile ? router.push("/(tabs)/profile") : router.push("/auth")} style={styles.authBtn}>
          <Ionicons name="person-circle-outline" size={18} color={Colors.gold} />
          <Text style={styles.authBtnText} numberOfLines={1}>
            {userProfile ? userProfile.name.split(" ")[0] : (lang === "tr" ? "Giriş" : "Login")}
          </Text>
        </Pressable>
        <SpinCountdownBtn />
        <Pressable onPress={toggleLang} style={styles.langToggle}>
          <Text style={[styles.langOpt, lang === "tr" && styles.langActive]}>TR</Text>
          <Text style={styles.langSep}>|</Text>
          <Text style={[styles.langOpt, lang === "en" && styles.langActive]}>EN</Text>
        </Pressable>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scroll, { paddingTop: 8, paddingBottom: Platform.OS === "web" ? 100 : 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Hero */}
        <Animated.View style={[styles.hero, headerFade]}>
          <Animated.View entering={FadeIn.duration(400)}>
            <AnimatedLogo />
          </Animated.View>
          <Animated.Text entering={ZoomIn.delay(500).springify()} style={styles.heroTitle}>
            {t.appTagline}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(700)} style={styles.heroDesc}>
            {t.appDesc}
          </Animated.Text>
        </Animated.View>

        {/* AI Identity Banner */}
        <AIIdentityBanner lang={lang} />

        {/* AI Disclaimer Strip */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.aiStrip}>
          <Ionicons name="information-circle-outline" size={12} color="#00C8FF" />
          <Text style={styles.aiStripText}>
            {lang === "tr"
              ? "Tüm analizler yapay zeka tarafından, seçilen analiz türü ve sağlanan bilgilere göre kişisel olarak oluşturulur."
              : "All analyses are personally generated by AI based on the selected type and provided information."}
          </Text>
        </Animated.View>

        <DailyFreeCard />

        <Animated.Text entering={FadeInDown.delay(360)} style={styles.sectionTitle}>
          {lang === "tr" ? "ANALİZ KATEGORİLERİ" : "ANALYSIS CATEGORIES"}
        </Animated.Text>

        {HOME_SERVICES_ORDERED.map((id, index) => (
          <ServiceCard
            key={id}
            serviceId={id}
            index={index}
            label={(t.services_list as any)[id]?.label ?? id}
            desc={(t.services_list as any)[id]?.desc ?? ""}
            onPress={() => handleServicePress(id)}
          />
        ))}
      </Animated.ScrollView>

      <WelcomeBonusModal visible={showWelcomeBonus} onDismiss={dismissWelcomeBonus} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 4,
    gap: 8,
  },
  authBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  authBtnText: { fontSize: 11, color: Colors.gold, fontFamily: "Lora_700Bold", letterSpacing: 0.3, maxWidth: 70 },
  spinPillReady: {
    borderRadius: 20,
    backgroundColor: Colors.gold + "22",
    borderWidth: 1.5,
    borderColor: Colors.gold + "90",
    shadowColor: Colors.gold,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    overflow: "hidden",
  },
  spinPillReadyInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 5,
  },
  spinPillReadyStar: { fontSize: 13, color: Colors.gold },
  spinPillReadyText: { fontSize: 11, fontFamily: "Lora_700Bold", color: Colors.gold, letterSpacing: 1 },
  spinPillCountdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  spinPillCountdownIcon: { fontSize: 12 },
  spinPillCountdownText: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.textSecondary, letterSpacing: 0.5 },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#071828",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#00C8FF30",
  },
  aiBadgeText: { fontSize: 10, color: "#00C8FF", fontFamily: "Lora_400Regular", letterSpacing: 1 },
  langToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  langOpt: { fontSize: 11, fontFamily: "CinzelDecorative_400Regular", color: Colors.textDim, letterSpacing: 1 },
  langActive: { color: Colors.gold },
  langSep: { color: Colors.textDim, fontSize: 10 },

  shootingStar: { height: 2, borderRadius: 1 },

  logoContainer: {
    width: 144,
    height: 144,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  logoGlowOuter: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#5B9BD5",
    opacity: 0.12,
  },
  logoGlowMid: {
    position: "absolute",
    width: 85,
    height: 85,
    borderRadius: 42,
    backgroundColor: "#FF6B9D",
    opacity: 0.08,
  },
  logoImage: { width: 116, height: 116, borderRadius: 58, overflow: "hidden" },

  hero: { alignItems: "center", paddingTop: 4, marginBottom: 10 },
  heroTitle: {
    fontSize: 21,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 4,
    marginTop: 6,
  },
  heroDesc: {
    fontSize: 12,
    color: "#C8B47A",
    textAlign: "center",
    fontFamily: "Lora_400Regular_Italic",
    lineHeight: 20,
    paddingHorizontal: 24,
    marginTop: 0,
  },
  aiBanner: {
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(0,200,255,0.30)",
    backgroundColor: "rgba(0,200,255,0.07)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  aiBannerGlow: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16,
    backgroundColor: "rgba(0,200,255,0.04)",
  },
  aiBannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
  },
  aiBannerTitle: {
    fontSize: 14,
    fontFamily: "Lora_700Bold",
    color: "#00C8FF",
    letterSpacing: 0.4,
  },
  aiBannerDesc: {
    fontSize: 12,
    fontFamily: "Lora_400Regular_Italic",
    color: "rgba(0,200,255,0.75)",
    lineHeight: 18,
  },
  aiStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "rgba(0,200,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.12)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  aiStripText: {
    fontSize: 10,
    color: "rgba(0,200,255,0.65)",
    fontFamily: "Lora_400Regular_Italic",
    flex: 1,
    lineHeight: 15,
  },

  scroll: { paddingHorizontal: 18 },
  trialsBar: {
    marginBottom: 12, borderRadius: 14, overflow: "hidden",
    borderWidth: 1.5, borderColor: Colors.gold + "70",
    shadowColor: Colors.gold,
    shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  trialsBarInner: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, gap: 10 },
  trialsText: { flex: 1, color: Colors.gold, fontSize: 13, fontFamily: "Lora_700Bold", letterSpacing: 0.2 },
  goldCoinIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.gold,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.gold, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
  },
  trialsGoldCount: {
    fontSize: 20, fontFamily: "Lora_700Bold", color: Colors.gold,
    marginRight: 2,
  },

  purchaseCta: { marginBottom: 14, borderRadius: 12, overflow: "hidden" },
  purchaseCtaInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 10 },
  purchaseCtaText: { fontSize: 13, fontFamily: "Lora_700Bold", color: Colors.background, letterSpacing: 0.3 },

  sectionTitle: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    color: Colors.textSecondary,
    letterSpacing: 3,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  cardOuter: { marginBottom: 10 },
  cardBorder: { borderRadius: 15, borderWidth: 1, overflow: "hidden" },
  card: { flexDirection: "row", alignItems: "center", padding: 15, gap: 13 },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  serviceImg: { width: 58, height: 58, borderRadius: 14 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontFamily: "Lora_700Bold", color: Colors.text, marginBottom: 3, letterSpacing: 0.1 },
  cardDesc: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary, lineHeight: 16 },
  cardRight: { alignItems: "flex-end", gap: 6 },
  goldBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  goldBadgeText: { fontSize: 11, fontFamily: "Lora_700Bold" },
  popularBadge: {
    position: "absolute", top: 8, right: 44,
    backgroundColor: "#C0932A", borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
    zIndex: 10,
    flexDirection: "row", alignItems: "center", gap: 3,
  },
  popularBadgeText: { fontSize: 9, fontFamily: "Lora_700Bold", color: "#000", letterSpacing: 0.3 },

  // ── Big free coffee banner ──
  freeBanner: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.gold + "70",
    overflow: "hidden",
    shadowColor: Colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  freeBannerGlowBorder: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  freeBannerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  freeBadge: {
    backgroundColor: Colors.gold,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  freeBadgeText: {
    fontSize: 11,
    fontFamily: "Lora_700Bold",
    color: "#000",
    letterSpacing: 1.5,
  },
  freeBannerEmojiWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 68, height: 68,
  },
  freeBannerEmojiGlow: {
    position: "absolute",
    width: 68, height: 68,
    borderRadius: 34,
    backgroundColor: Colors.gold,
    opacity: 0.35,
    shadowColor: Colors.gold,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  freeBannerEmoji: { fontSize: 52 },
  freeBannerTitle: {
    fontSize: 22,
    fontFamily: "Lora_700Bold",
    color: Colors.gold,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  freeBannerSub: {
    fontSize: 13,
    fontFamily: "Lora_400Regular_Italic",
    color: "#D4A84B",
    lineHeight: 20,
    marginBottom: 16,
  },
  freeMysticalText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular_Italic",
    color: "#E8C87A",
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: "center",
  },
  freeBannerBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    overflow: "hidden",
  },
  freeBannerBtnText: {
    fontSize: 15,
    fontFamily: "Lora_700Bold",
    color: "#1A0A00",
    letterSpacing: 0.3,
  },
  freeBannerShimmer: {
    position: "absolute",
    top: 0, bottom: 0,
    width: 90,
    left: 0,
  },
  // ── Used state (small strip) ──
  freeCardUsed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surface,
    paddingVertical: 13,
    paddingHorizontal: 14,
    opacity: 0.65,
  },
  freeCardUsedEmoji: { fontSize: 24, color: Colors.textDim },
  freeCardUsedTitle: { fontSize: 13, fontFamily: "Lora_700Bold", color: Colors.textSecondary },
  freeCardUsedSub: { fontSize: 11, fontFamily: "Lora_400Regular_Italic", color: Colors.textDim, marginTop: 1 },
  freeCardUsedBadge: {
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.background,
  },
  freeCardUsedBadgeText: { fontSize: 10, fontFamily: "Lora_700Bold", color: Colors.textDim, letterSpacing: 0.5 },


  catSlider: { marginBottom: 14 },
  catSliderContent: { paddingHorizontal: 0, gap: 8, paddingVertical: 4 },
  catChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  catChipActive: { backgroundColor: Colors.gold + "20", borderColor: Colors.gold + "70" },
  catChipEmoji: { fontSize: 14 },
  catChipLabel: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.textSecondary },
  catChipLabelActive: { color: Colors.gold },
});
