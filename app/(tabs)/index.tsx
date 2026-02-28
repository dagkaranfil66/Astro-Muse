import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  ImageBackground,
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
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");

const SERVICES = [
  {
    id: "astroloji",
    label: "Türk Astrolojisi",
    description: "12 Hayvanlı Gök Tanrı takvimi ile kaderinizi keşfedin",
    icon: "moon-outline" as const,
    color: "#6B4FBB",
    gradient: ["#1A0F35", "#0D1526"] as const,
  },
  {
    id: "kahve",
    label: "Kahve Falı",
    description: "Türk kahvesi telveleri kaderin sırlarını fısıldar",
    icon: "cafe-outline" as const,
    color: "#C0932A",
    gradient: ["#2A1A05", "#0D1526"] as const,
  },
  {
    id: "el",
    label: "El Falı",
    description: "Avuç çizgilerinizde yazılı yaşam haritanızı okuyun",
    icon: "hand-left-outline" as const,
    color: "#1ABFB8",
    gradient: ["#051A1A", "#0D1526"] as const,
  },
  {
    id: "tarot",
    label: "Tarot",
    description: "Tengri yolundan ilham alan kartların gizemli mesajları",
    icon: "layers-outline" as const,
    color: "#E7B008",
    gradient: ["#1A1205", "#0D1526"] as const,
  },
  {
    id: "samanizm",
    label: "Şamanizm Rehberliği",
    description: "Ataların ruhlarıyla bağlantı kurarak yol bulun",
    icon: "leaf-outline" as const,
    color: "#4CAF7A",
    gradient: ["#051A0D", "#0D1526"] as const,
  },
  {
    id: "numeroloji",
    label: "Numeroloji",
    description: "Sayıların gizli dili kaderin kapısını aralar",
    icon: "star-outline" as const,
    color: "#E74C8B",
    gradient: ["#1A0510", "#0D1526"] as const,
  },
  {
    id: "ruh",
    label: "Ruh Okuma",
    description: "Auranızı ve ruhsal enerjinizi derin biçimde okuyun",
    icon: "eye-outline" as const,
    color: "#9B59B6",
    gradient: ["#150E25", "#0D1526"] as const,
  },
];

function ServiceCard({ service, index }: { service: (typeof SERVICES)[0]; index: number }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animStyle, styles.cardOuter]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => router.push(`/reading/${service.id}`)}
        style={styles.cardPress}
      >
        <LinearGradient
          colors={[service.gradient[0], service.gradient[1]]}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.iconCircle, { borderColor: service.color + "50" }]}>
            <Ionicons name={service.icon} size={28} color={service.color} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{service.label}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{service.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { remainingReadings, isPurchased } = useApp();
  const scrollY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.5);

  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [0, 80], [0, -20], Extrapolation.CLAMP) },
    ],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A1020", Colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.glowContainer, glowAnimStyle, { pointerEvents: "none" }]}>
        <View style={styles.glow} />
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 20, paddingBottom: Platform.OS === "web" ? 100 : 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, headerAnimStyle]}>
          <Text style={styles.headerSubtitle}>✦ TENGRİ ✦</Text>
          <Text style={styles.headerTitle}>Mistik Rehberlik</Text>
          <Text style={styles.headerDesc}>
            Kadim bilgelik ile modern ruhsal yolculuğunuza başlayın
          </Text>
        </Animated.View>

        <Pressable
          onPress={() => !isPurchased && remainingReadings === 0 && router.push("/purchase")}
          style={styles.trialsBar}
        >
          <LinearGradient
            colors={["#1A1205", "#0D1526"]}
            style={styles.trialsBarInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="sparkles" size={16} color={Colors.gold} />
            <Text style={styles.trialsText}>
              {isPurchased
                ? `${remainingReadings} okuma hakkı kaldı`
                : remainingReadings > 0
                ? `${remainingReadings} ücretsiz deneme hakkınız var`
                : "Ücretsiz denemeler bitti — Paket satın alın"}
            </Text>
            {!isPurchased && remainingReadings === 0 && (
              <Ionicons name="chevron-forward" size={14} color={Colors.gold} />
            )}
          </LinearGradient>
        </Pressable>

        <Text style={styles.sectionTitle}>Hizmetlerimiz</Text>

        {SERVICES.map((service, index) => (
          <ServiceCard key={service.id} service={service} index={index} />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  glowContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "none",
  },
  glow: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.gold,
    opacity: 0.04,
    transform: [{ scaleX: 2 }],
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerSubtitle: {
    color: Colors.gold,
    fontSize: 12,
    letterSpacing: 6,
    fontFamily: "Lora_400Regular",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: "CinzelDecorative_700Bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 1,
  },
  headerDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    fontFamily: "Lora_400Regular_Italic",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  trialsBar: {
    marginBottom: 28,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  trialsBarInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  trialsText: {
    flex: 1,
    color: Colors.gold,
    fontSize: 13,
    fontFamily: "Lora_400Regular",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "CinzelDecorative_400Regular",
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 16,
  },
  cardOuter: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardPress: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "CinzelDecorative_400Regular",
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
