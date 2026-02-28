import React from "react";
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
  Extrapolation,
  FadeInDown,
  ZoomIn,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";

const { width, height } = Dimensions.get("window");

// ────────── Shooting Stars ──────────
const SHOOTING_STARS = Array.from({ length: 10 }, (_, i) => ({
  startX: Math.random() * width * 1.2 - width * 0.1,
  startY: Math.random() * height * 0.6,
  angle: 20 + Math.random() * 25,
  duration: 2200 + Math.random() * 3000,
  delay: i * 1400 + Math.random() * 2500,
  length: 70 + Math.random() * 90,
}));

function ShootingStar({ cfg }: { cfg: typeof SHOOTING_STARS[0] }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    const total = cfg.duration + cfg.delay + 800;
    const loop = () => {
      progress.value = 0;
      opacity.value = 0;
      opacity.value = withDelay(cfg.delay, withSequence(
        withTiming(1, { duration: 250 }),
        withDelay(cfg.duration - 400, withTiming(0, { duration: 400 }))
      ));
      progress.value = withDelay(cfg.delay, withTiming(1, { duration: cfg.duration }));
    };
    loop();
    const id = setInterval(loop, total);
    return () => clearInterval(id);
  }, []);

  const rad = (cfg.angle * Math.PI) / 180;
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: progress.value * Math.cos(rad) * 250 },
      { translateY: progress.value * Math.sin(rad) * 250 },
    ],
  }));

  return (
    <Animated.View style={[{ position: "absolute", top: cfg.startY, left: cfg.startX }, style]}>
      <LinearGradient
        colors={["rgba(155,89,182,0)", "rgba(231,176,8,0.7)", "rgba(255,255,255,1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.shootingStar, { width: cfg.length, transform: [{ rotate: `${cfg.angle}deg` }] }]}
      />
    </Animated.View>
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

// ────────── Tengri Logo ──────────
function AnimatedLogo() {
  const floatY = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);
  const logoScale = useSharedValue(0.8);

  React.useEffect(() => {
    floatY.value = withRepeat(
      withSequence(withTiming(-12, { duration: 3000 }), withTiming(0, { duration: 3000 })),
      -1, false
    );
    glowScale.value = withRepeat(
      withSequence(withTiming(1.4, { duration: 2500 }), withTiming(1, { duration: 2500 })),
      -1, false
    );
    glowOpacity.value = withRepeat(
      withSequence(withTiming(0.9, { duration: 2000 }), withTiming(0.3, { duration: 2000 })),
      -1, false
    );
    logoScale.value = withSpring(1, { damping: 10, stiffness: 70 });
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { scale: logoScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.logoContainer}>
      <Animated.View style={[styles.logoGlowOuter, glowStyle]} />
      <View style={styles.logoGlowMid} />
      <MandalaRing radius={90} dotCount={24} color={Colors.gold} duration={12000} />
      <MandalaRing radius={72} dotCount={16} color="#9B59B6" duration={9000} reverse />
      <MandalaRing radius={108} dotCount={8} color="#E7B008" duration={18000} />
      <Animated.View style={floatStyle}>
        <Image
          source={require("@/assets/images/tengri-logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
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
  burclar: "telescope-outline",
  ask: "heart-outline",
};
const SERVICE_COLORS: Record<string, string> = {
  astroloji: "#6B4FBB", kahve: "#C0932A", el: "#1ABFB8", tarot: "#E7B008",
  samanizm: "#4CAF7A", numeroloji: "#E74C8B", ruh: "#9B59B6",
  dogum: "#FF8C42", ruya: "#5B9BD5", burclar: "#FF6B9D", ask: "#FF4757",
};
const SERVICE_GRADIENTS: Record<string, [string, string]> = {
  astroloji: ["#1A0F35", "#0D1526"], kahve: ["#2A1A05", "#0D1526"], el: ["#051A1A", "#0D1526"],
  tarot: ["#1A1205", "#0D1526"], samanizm: ["#051A0D", "#0D1526"], numeroloji: ["#1A0510", "#0D1526"],
  ruh: ["#150E25", "#0D1526"], dogum: ["#1A0E05", "#0D1526"], ruya: ["#051020", "#0D1526"],
  burclar: ["#1A0515", "#0D1526"], ask: ["#1A0508", "#0D1526"],
};

const ALL_SERVICES = [
  "astroloji", "kahve", "el", "tarot", "samanizm", "numeroloji", "ruh",
  "dogum", "ruya", "burclar", "ask",
];

const ANIM_TYPES = ["rotate", "pulse", "bounce", "flip", "slide", "spin", "glow", "rotate", "pulse", "bounce", "flip"];

function ServiceCard({ serviceId, index, label, desc }: {
  serviceId: string; index: number; label: string; desc: string;
}) {
  const animType = ANIM_TYPES[index % ANIM_TYPES.length];
  const color = SERVICE_COLORS[serviceId];
  const icon = SERVICE_ICONS[serviceId] || "star-outline";
  const gradient = SERVICE_GRADIENTS[serviceId] || ["#0D1526", "#0D1526"];

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
        onPress={() => router.push(`/reading/${serviceId}`)}
      >
        <Animated.View style={[styles.cardBorder, borderStyle]}>
          <LinearGradient colors={gradient} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Animated.View style={[styles.iconCircle, { borderColor: color + "50" }, iconStyle]}>
              <Ionicons name={icon} size={26} color={color} />
            </Animated.View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{label}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ────────── Main Screen ──────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { remainingReadings, isPurchased } = useApp();
  const { lang, t, toggleLang } = useLang();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((e) => { scrollY.value = e.contentOffset.y; });
  const headerFade = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 120], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, 120], [0, -20], Extrapolation.CLAMP) }],
  }));

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#04080F", "#070D1A", "#080D1E"]} style={StyleSheet.absoluteFill} />

      {/* Shooting Stars */}
      <View style={[StyleSheet.absoluteFill, { pointerEvents: "none", overflow: "hidden" }]}>
        {SHOOTING_STARS.map((cfg, i) => <ShootingStar key={i} cfg={cfg} />)}
      </View>

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 10 }]}>
        <Pressable onPress={() => router.push("/auth")} style={styles.authBtn}>
          <Ionicons name="person-circle-outline" size={18} color={Colors.gold} />
          <Text style={styles.authBtnText}>{lang === "tr" ? "Giriş" : "Login"}</Text>
        </Pressable>
        <Pressable onPress={() => {}} style={styles.aiBadge}>
          <Ionicons name="sparkles" size={11} color="#00C8FF" />
          <Text style={styles.aiBadgeText}>OpenAI</Text>
        </Pressable>
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
          <AnimatedLogo />
          <Animated.Text entering={ZoomIn.delay(500).springify()} style={styles.heroTitle}>
            {t.appTagline}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(700)} style={styles.heroDesc}>
            {t.appDesc}
          </Animated.Text>
        </Animated.View>

        {/* Trials Bar */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Pressable
            onPress={() => !isPurchased && remainingReadings === 0 && router.push("/purchase")}
            style={styles.trialsBar}
          >
            <LinearGradient colors={["#1A1A05", "#0D1526"]} style={styles.trialsBarInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="sparkles" size={14} color={Colors.gold} />
              <Text style={styles.trialsText}>
                {isPurchased ? t.readingsLeft(remainingReadings)
                  : remainingReadings > 0 ? t.trialsLeft(remainingReadings)
                  : t.trialsExpired}
              </Text>
              {!isPurchased && remainingReadings === 0 && (
                <Ionicons name="chevron-forward" size={13} color={Colors.gold} />
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Purchase CTA when trials out */}
        {!isPurchased && remainingReadings === 0 && (
          <Animated.View entering={FadeInDown.delay(250)}>
            <Pressable onPress={() => router.push("/purchase")} style={styles.purchaseCta}>
              <LinearGradient colors={[Colors.goldLight, Colors.gold]} style={styles.purchaseCtaInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="diamond-outline" size={16} color={Colors.background} />
                <Text style={styles.purchaseCtaText}>{lang === "tr" ? "30 Okuma Paketi — 149,99 TL" : "30 Readings Package — ₺149.99"}</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        <Animated.Text entering={FadeInDown.delay(260)} style={styles.sectionTitle}>
          {t.services}
        </Animated.Text>

        {ALL_SERVICES.map((id, index) => (
          <ServiceCard
            key={id}
            serviceId={id}
            index={index}
            label={(t.services_list as any)[id]?.label ?? id}
            desc={(t.services_list as any)[id]?.desc ?? ""}
          />
        ))}
      </Animated.ScrollView>
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
  authBtnText: { fontSize: 11, color: Colors.gold, fontFamily: "CinzelDecorative_400Regular", letterSpacing: 0.5 },
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
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  logoGlowOuter: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.gold,
    opacity: 0.08,
  },
  logoGlowMid: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#9B59B6",
    opacity: 0.06,
  },
  logoImage: { width: 150, height: 150 },

  hero: { alignItems: "center", paddingTop: 8, marginBottom: 18 },
  heroTitle: {
    fontSize: 26,
    fontFamily: "CinzelDecorative_700Bold",
    color: Colors.text,
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  heroDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    fontFamily: "Lora_400Regular_Italic",
    lineHeight: 20,
    paddingHorizontal: 30,
  },

  scroll: { paddingHorizontal: 18 },
  trialsBar: { marginBottom: 12, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: Colors.gold + "30" },
  trialsBarInner: { flexDirection: "row", alignItems: "center", paddingVertical: 11, paddingHorizontal: 14, gap: 8 },
  trialsText: { flex: 1, color: Colors.gold, fontSize: 12, fontFamily: "Lora_400Regular" },

  purchaseCta: { marginBottom: 14, borderRadius: 12, overflow: "hidden" },
  purchaseCtaInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 10 },
  purchaseCtaText: { fontSize: 13, fontFamily: "CinzelDecorative_700Bold", color: Colors.background, letterSpacing: 0.5 },

  sectionTitle: {
    fontSize: 11,
    fontFamily: "CinzelDecorative_400Regular",
    color: Colors.textSecondary,
    letterSpacing: 4,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  cardOuter: { marginBottom: 10 },
  cardBorder: { borderRadius: 15, borderWidth: 1, overflow: "hidden" },
  card: { flexDirection: "row", alignItems: "center", padding: 15, gap: 13 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontFamily: "CinzelDecorative_400Regular", color: Colors.text, marginBottom: 3, letterSpacing: 0.3 },
  cardDesc: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary, lineHeight: 16 },
});
