import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useLang } from "@/context/LanguageContext";

const OPTIONS = [
  {
    id: "dogum",
    icon: "planet-outline" as const,
    color: "#FF8C42",
    gradient: ["#1A0E05", "#0D1526"] as [string, string],
    image: require("@/assets/images/services/dogum.png"),
    labelTR: "AI Doğum Haritası Analizi",
    labelEN: "AI Birth Chart Analysis",
    descTR: "Doğum tarihi, saati ve konumuna göre yapay zeka destekli kişisel analiz oluşturur.",
    descEN: "Generates AI-powered personal analysis based on birth date, time and location.",
  },
  {
    id: "el",
    icon: "hand-left-outline" as const,
    color: "#1ABFB8",
    gradient: ["#051A1A", "#0D1526"] as [string, string],
    image: require("@/assets/images/services/el.png"),
    labelTR: "El Çizgisi Analizi",
    labelEN: "Palm Line Analysis",
    descTR: "Avuç içi çizgilerini görsel veya kullanıcı girdisine göre yapay zeka ile analiz eder.",
    descEN: "AI analyzes palm lines based on image or user input.",
  },
];

export default function AstrolojiSelectScreen() {
  const insets = useSafeAreaInsets();
  const { lang } = useLang();

  const handleSelect = (serviceId: string) => {
    router.push(`/reading/${serviceId}` as any);
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#04080F", "#070D1A", "#080D1E"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.gold} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {lang === "tr" ? "AI Doğum Haritası Analizi" : "AI Birth Chart Analysis"}
          </Text>
          <Text style={styles.headerSub}>
            {lang === "tr"
              ? "Doğum bilgilerinize göre kişisel analiz alın"
              : "Get a personal analysis based on your birth data"}
          </Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.descBox}>
          <Ionicons name="sparkles-outline" size={16} color="#FF8C42" />
          <Text style={styles.descBoxText}>
            {lang === "tr"
              ? "Bu alan, kullanıcının doğum bilgilerine göre yapay zeka destekli kişisel analiz oluşturur. Hazır sabit yorumlar kullanılmaz."
              : "This section generates AI-powered personal analysis based on your birth data. No pre-written generic readings are used."}
          </Text>
        </Animated.View>

        {OPTIONS.map((opt, i) => (
          <Animated.View
            key={opt.id}
            entering={FadeInDown.delay(120 + i * 80).springify()}
            style={styles.cardOuter}
          >
            <Pressable
              onPress={() => handleSelect(opt.id)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={opt.gradient}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.iconBox, { borderColor: opt.color + "50" }]}>
                  <Image
                    source={opt.image}
                    style={styles.serviceImg}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>
                    {lang === "tr" ? opt.labelTR : opt.labelEN}
                  </Text>
                  <Text style={styles.cardDesc}>
                    {lang === "tr" ? opt.descTR : opt.descEN}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={opt.color} />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  backBtn: {
    width: 42, height: 42,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  headerCenter: { alignItems: "center", flex: 1, paddingHorizontal: 8 },
  headerTitle: {
    fontSize: 15,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  headerSub: {
    fontSize: 11,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  scroll: { padding: 18, gap: 12 },
  descBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,140,66,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,140,66,0.22)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  descBoxText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  cardOuter: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder },
  card: { borderRadius: 16, overflow: "hidden" },
  cardGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  iconBox: {
    width: 58, height: 58,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceImg: { width: 58, height: 58, borderRadius: 14 },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
