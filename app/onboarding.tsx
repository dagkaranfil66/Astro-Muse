import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Platform,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: "✦",
    title: "Tengri'ye\nHoş Geldin",
    subtitle:
      "Kadim Türk-Moğol mistik geleneğinden ilham alan, yapay zeka destekli ruhsal rehberlik uygulaması.",
    detail: "Yıldızlar, ruhlar ve semboller seni bekliyor.",
    bg: ["#08051A", "#0D0820", "#12082A"] as const,
    accent: Colors.gold,
  },
  {
    id: "2",
    icon: "🔮",
    title: "11 Mistik\nHizmet",
    subtitle:
      "Kahve falından tarot'a, doğum haritasından şamanizme kadar her sorunun yanıtı burada.",
    detail:
      "Kahve Falı · El Falı · Tarot · Astroloji · Numeroloji · Ruh Okuma · Rüya · Burçlar · Doğum Haritası · Aşk Uyumu · Şamanizm",
    bg: ["#08051A", "#0A0A1E", "#0D0B25"] as const,
    accent: "#9B6FBB",
  },
  {
    id: "3",
    icon: "✦",
    title: "Ücretsiz\nBaşla",
    subtitle:
      "Her gün dönen şans çarkıyla altın kazan. Günlük ücretsiz okuma hakkın seni bekliyor.",
    detail: "Yeni üyeler 10 altın ile başlar. Her gün çark döndür, altın kazan.",
    bg: ["#08051A", "#0D0D10", "#120F08"] as const,
    accent: Colors.gold,
  },
  {
    id: "4",
    icon: "☽",
    title: "Kaderine\nAçıl",
    subtitle:
      "Hesap oluştur, okumalarını kaydet, sosyal medyada paylaş. Mistik yolculuğun başlıyor.",
    detail: "",
    bg: ["#08051A", "#070D1A", "#080D18"] as const,
    accent: Colors.gold,
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { markOnboardingDone } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLast = activeIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  const handleFinish = async () => {
    await markOnboardingDone();
    router.replace("/(tabs)");
  };

  const handleSkip = async () => {
    await markOnboardingDone();
    router.replace("/(tabs)");
  };

  const handleAuth = async () => {
    await markOnboardingDone();
    router.replace("/auth");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(idx);
        }}
        renderItem={({ item }) => (
          <LinearGradient colors={item.bg} style={[styles.slide, { paddingTop: topPad + 24 }]}>
            <View style={styles.slideContent}>
              <View style={[styles.iconCircle, { borderColor: item.accent + "60" }]}>
                <Text style={[styles.iconText, { color: item.accent }]}>{item.icon}</Text>
              </View>

              <Text style={[styles.title, { fontFamily: "Lora_700Bold" }]}>{item.title}</Text>

              <View style={[styles.divider, { backgroundColor: item.accent + "50" }]} />

              <Text style={[styles.subtitle, { fontFamily: "Lora_400Regular" }]}>
                {item.subtitle}
              </Text>

              {item.detail ? (
                <Text style={[styles.detail, { fontFamily: "Lora_400Regular_Italic" }]}>
                  {item.detail}
                </Text>
              ) : null}
            </View>
          </LinearGradient>
        )}
      />

      <LinearGradient
        colors={["transparent", "#08051A"]}
        style={[styles.bottomGradient, { paddingBottom: botPad + 20 }]}
        pointerEvents="box-none"
      >
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: "clamp",
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: "clamp",
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity }]}
              />
            );
          })}
        </View>

        {isLast ? (
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleAuth} activeOpacity={0.85}>
              <LinearGradient
                colors={["#C8A020", "#9B6820"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtnInner}
              >
                <Text style={[styles.primaryBtnText, { fontFamily: "Lora_700Bold" }]}>
                  Hesap Oluştur
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleAuth} activeOpacity={0.8}>
              <Text style={[styles.secondaryBtnText, { fontFamily: "Lora_400Regular" }]}>
                Zaten hesabım var
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipLink}>
              <Text style={[styles.skipText, { fontFamily: "Lora_400Regular" }]}>
                Şimdilik atla
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.85}>
              <LinearGradient
                colors={["#C8A020", "#9B6820"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtnInner}
              >
                <Text style={[styles.primaryBtnText, { fontFamily: "Lora_700Bold" }]}>
                  Devam Et
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipLink}>
              <Text style={[styles.skipText, { fontFamily: "Lora_400Regular" }]}>Atla</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#08051A",
  },
  slide: {
    width,
    height,
    alignItems: "center",
    justifyContent: "center",
  },
  slideContent: {
    alignItems: "center",
    paddingHorizontal: 36,
    marginTop: -60,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  iconText: {
    fontSize: 44,
    textAlign: "center",
  },
  title: {
    fontSize: 36,
    color: Colors.text,
    textAlign: "center",
    lineHeight: 44,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  divider: {
    width: 40,
    height: 1.5,
    borderRadius: 2,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 25,
    marginBottom: 20,
  },
  detail: {
    fontSize: 13,
    color: Colors.textDim,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 28,
    alignItems: "center",
  },
  dot: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
  },
  buttonGroup: {
    width: "100%",
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 12,
  },
  primaryBtn: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  primaryBtnInner: {
    paddingVertical: 17,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 17,
    color: "#08051A",
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gold + "50",
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 16,
    color: Colors.gold,
  },
  skipLink: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: Colors.textDim,
  },
});
