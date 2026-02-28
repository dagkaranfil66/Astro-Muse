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
interface ShootingStarConfig {
  startX: number;
  startY: number;
  angle: number;
  duration: number;
  delay: number;
  length: number;
}

const SHOOTING_STARS: ShootingStarConfig[] = Array.from({ length: 8 }, (_, i) => ({
  startX: Math.random() * width,
  startY: Math.random() * (height * 0.5),
  angle: 25 + Math.random() * 20,
  duration: 2000 + Math.random() * 3000,
  delay: i * 1800 + Math.random() * 2000,
  length: 60 + Math.random() * 80,
}));

function ShootingStar({ config }: { config: ShootingStarConfig }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    const total = config.duration + config.delay + 1000;
    const loop = () => {
      progress.value = 0;
      opacity.value = 0;
      opacity.value = withDelay(config.delay, withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(config.duration - 300, withTiming(0, { duration: 300 }))
      ));
      progress.value = withDelay(config.delay, withTiming(1, { duration: config.duration }));
    };
    loop();
    const id = setInterval(loop, total);
    return () => clearInterval(id);
  }, []);

  const rad = (config.angle * Math.PI) / 180;
  const dx = Math.cos(rad) * 220;
  const dy = Math.sin(rad) * 220;

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: progress.value * dx },
      { translateY: progress.value * dy },
    ],
  }));

  return (
    <Animated.View
      style={[styles.shootingStarContainer, { top: config.startY, left: config.startX }, style]}
    >
      <LinearGradient
        colors={["rgba(231,176,8,0)", "rgba(231,176,8,0.9)", "rgba(255,255,255,1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.shootingStar, { width: config.length, transform: [{ rotate: `${config.angle}deg` }] }]}
      />
    </Animated.View>
  );
}

function ShootingStars() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none", overflow: "hidden" }]}>
      {SHOOTING_STARS.map((cfg, i) => (
        <ShootingStar key={i} config={cfg} />
      ))}
    </View>
  );
}

// ────────── Tengri Logo ──────────
function AnimatedLogo() {
  const floatY = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.6);
  const logoScale = useSharedValue(0.85);

  React.useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2500 }),
        withTiming(0, { duration: 2500 })
      ),
      -1,
      false
    );
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      false
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.4, { duration: 2000 })
      ),
      -1,
      false
    );
    logoScale.value = withSpring(1, { damping: 12, stiffness: 80 });
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
      <Animated.View style={[styles.logoGlow, glowStyle]} />
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

// ────────── Unique per-card animation configs ──────────
const CARD_ANIMATIONS = [
  { rotateIcon: true, enterDelay: 0 },    // Astroloji - icon rotates
  { pulseIcon: true, enterDelay: 60 },    // Kahve - icon pulses
  { bounceIcon: true, enterDelay: 120 },  // El - icon bounces
  { flipCard: true, enterDelay: 180 },    // Tarot - card flips
  { slideIcon: true, enterDelay: 240 },   // Şamanizm - icon slides
  { spinIcon: true, enterDelay: 300 },    // Numeroloji - icon spins
  { glowCard: true, enterDelay: 360 },    // Ruh - card glows
];

const SERVICES_IDS = ["astroloji", "kahve", "el", "tarot", "samanizm", "numeroloji", "ruh"];
const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  astroloji: "moon-outline",
  kahve: "cafe-outline",
  el: "hand-left-outline",
  tarot: "layers-outline",
  samanizm: "leaf-outline",
  numeroloji: "star-outline",
  ruh: "eye-outline",
};
const SERVICE_COLORS: Record<string, string> = {
  astroloji: "#6B4FBB",
  kahve: "#C0932A",
  el: "#1ABFB8",
  tarot: "#E7B008",
  samanizm: "#4CAF7A",
  numeroloji: "#E74C8B",
  ruh: "#9B59B6",
};
const SERVICE_GRADIENTS: Record<string, [string, string]> = {
  astroloji: ["#1A0F35", "#0D1526"],
  kahve: ["#2A1A05", "#0D1526"],
  el: ["#051A1A", "#0D1526"],
  tarot: ["#1A1205", "#0D1526"],
  samanizm: ["#051A0D", "#0D1526"],
  numeroloji: ["#1A0510", "#0D1526"],
  ruh: ["#150E25", "#0D1526"],
};

function ServiceCard({
  serviceId,
  index,
  label,
  desc,
}: {
  serviceId: string;
  index: number;
  label: string;
  desc: string;
}) {
  const anim = CARD_ANIMATIONS[index] || CARD_ANIMATIONS[0];
  const color = SERVICE_COLORS[serviceId];
  const icon = SERVICE_ICONS[serviceId];
  const gradient = SERVICE_GRADIENTS[serviceId];

  const cardScale = useSharedValue(1);
  const iconRotate = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const iconTranslateX = useSharedValue(0);
  const cardBorderOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    if (anim.pulseIcon) {
      iconScale.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 900 }), withTiming(1, { duration: 900 })),
        -1, false
      );
    }
    if (anim.rotateIcon) {
      iconRotate.value = withRepeat(withTiming(360, { duration: 6000 }), -1, false);
    }
    if (anim.slideIcon) {
      iconTranslateX.value = withRepeat(
        withSequence(withTiming(4, { duration: 700 }), withTiming(-4, { duration: 700 })),
        -1, true
      );
    }
    if (anim.spinIcon) {
      iconRotate.value = withRepeat(
        withSequence(withTiming(20, { duration: 400 }), withTiming(-20, { duration: 400 })),
        -1, true
      );
    }
    if (anim.glowCard) {
      cardBorderOpacity.value = withRepeat(
        withSequence(withTiming(0.8, { duration: 1500 }), withTiming(0.2, { duration: 1500 })),
        -1, false
      );
    }
    if (anim.bounceIcon) {
      iconScale.value = withRepeat(
        withSequence(withTiming(1.15, { duration: 500 }), withTiming(0.95, { duration: 200 }), withTiming(1, { duration: 300 })),
        -1, false
      );
    }
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${iconRotate.value}deg` },
      { scale: iconScale.value },
      { translateX: iconTranslateX.value },
    ],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: color + Math.round(cardBorderOpacity.value * 255).toString(16).padStart(2, '0'),
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(anim.enterDelay).springify().damping(14)}
      style={[styles.cardOuter, cardStyle]}
    >
      <Pressable
        onPressIn={() => {
          cardScale.value = withSpring(0.96);
          if (anim.flipCard) iconScale.value = withSequence(withTiming(0, { duration: 120 }), withTiming(1, { duration: 120 }));
        }}
        onPressOut={() => { cardScale.value = withSpring(1); }}
        onPress={() => router.push(`/reading/${serviceId}`)}
      >
        <Animated.View style={[styles.cardBorder, borderStyle]}>
          <LinearGradient
            colors={gradient}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
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

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const headerFade = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 100], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [0, 100], [0, -20], Extrapolation.CLAMP) },
    ],
  }));

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 100 : 120;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#050B15", "#070D1A", "#09101F"]}
        style={StyleSheet.absoluteFill}
      />

      <ShootingStars />

      {/* Language Toggle + top bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={11} color="#00C8FF" />
          <Text style={styles.aiBadgeText}>OpenAI</Text>
        </View>
        <Pressable onPress={toggleLang} style={styles.langToggle}>
          <Text style={[styles.langOption, lang === "tr" && styles.langActive]}>TR</Text>
          <Text style={styles.langSep}>|</Text>
          <Text style={[styles.langOption, lang === "en" && styles.langActive]}>EN</Text>
        </Pressable>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 12, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo + Header */}
        <Animated.View style={[styles.hero, headerFade]}>
          <AnimatedLogo />
          <Animated.View entering={ZoomIn.delay(400).springify()}>
            <Text style={styles.heroTitle}>{t.appTagline}</Text>
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(600)} style={styles.heroDesc}>
            {t.appDesc}
          </Animated.Text>
        </Animated.View>

        {/* Trials / Reading counter */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Pressable
            onPress={() => !isPurchased && remainingReadings === 0 && router.push("/purchase")}
            style={styles.trialsBar}
          >
            <LinearGradient
              colors={["#1A1A05", "#0D1526"]}
              style={styles.trialsBarInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="sparkles" size={15} color={Colors.gold} />
              <Text style={styles.trialsText}>
                {isPurchased
                  ? t.readingsLeft(remainingReadings)
                  : remainingReadings > 0
                  ? t.trialsLeft(remainingReadings)
                  : t.trialsExpired}
              </Text>
              {!isPurchased && remainingReadings === 0 && (
                <Ionicons name="chevron-forward" size={13} color={Colors.gold} />
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(250)} style={styles.sectionTitle}>
          {t.services}
        </Animated.Text>

        {SERVICES_IDS.map((id, index) => (
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
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0A1E30",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#00C8FF30",
  },
  aiBadgeText: {
    fontSize: 10,
    color: "#00C8FF",
    fontFamily: "Lora_400Regular",
    letterSpacing: 1,
  },
  langToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  langOption: {
    fontSize: 12,
    fontFamily: "CinzelDecorative_400Regular",
    color: Colors.textDim,
    letterSpacing: 1,
  },
  langActive: {
    color: Colors.gold,
  },
  langSep: {
    color: Colors.textDim,
    fontSize: 11,
  },

  shootingStarContainer: {
    position: "absolute",
  },
  shootingStar: {
    height: 2,
    borderRadius: 1,
  },

  // Logo
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.gold,
    opacity: 0.1,
  },
  logoImage: {
    width: 160,
    height: 160,
  },

  // Hero
  hero: {
    alignItems: "center",
    paddingTop: 8,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: "CinzelDecorative_700Bold",
    color: Colors.text,
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    fontFamily: "Lora_400Regular_Italic",
    lineHeight: 20,
    paddingHorizontal: 24,
    marginBottom: 4,
  },

  scrollContent: {
    paddingHorizontal: 20,
  },

  // Trials bar
  trialsBar: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  trialsBarInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 8,
  },
  trialsText: {
    flex: 1,
    color: Colors.gold,
    fontSize: 12,
    fontFamily: "Lora_400Regular",
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "CinzelDecorative_400Regular",
    color: Colors.textSecondary,
    letterSpacing: 3,
    marginBottom: 14,
    textTransform: "uppercase",
  },

  // Cards
  cardOuter: {
    marginBottom: 11,
  },
  cardBorder: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontFamily: "CinzelDecorative_400Regular",
    color: Colors.text,
    marginBottom: 3,
    letterSpacing: 0.4,
  },
  cardDesc: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
