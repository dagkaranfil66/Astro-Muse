import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Image } from "react-native";
import { Colors } from "@/constants/colors";
import { useLang } from "@/context/LanguageContext";

const OPTIONS = [
  {
    id: "astroloji",
    icon: "moon-outline" as const,
    color: "#6B4FBB",
    gradient: ["#1A0F35", "#0D1526"] as [string, string],
    image: require("@/assets/images/services/astroloji.png"),
    labelTR: "Astroloji Analizi",
    labelEN: "Astrology Analysis",
    descTR: "Gezegen konumlarına göre kişisel yorumlar oluşturur.",
    descEN: "Creates personal insights based on planetary positions.",
  },
  {
    id: "dogum",
    icon: "planet-outline" as const,
    color: "#FF8C42",
    gradient: ["#1A0E05", "#0D1526"] as [string, string],
    image: require("@/assets/images/services/dogum.png"),
    labelTR: "Doğum Haritası Analizi",
    labelEN: "Birth Chart Analysis",
    descTR: "Doğum tarihi, saati ve yerine göre kapsamlı harita çıkarır.",
    descEN: "Full chart analysis based on birth date, time and place.",
  },
  {
    id: "el",
    icon: "hand-left-outline" as const,
    color: "#1ABFB8",
    gradient: ["#051A1A", "#0D1526"] as [string, string],
    image: require("@/assets/images/services/el.png"),
    labelTR: "El Çizgisi Analizi",
    labelEN: "Palm Line Analysis",
    descTR: "Avuç içindeki çizgileri yapay zeka ile analiz eder.",
    descEN: "AI analyzes the lines in your palm.",
  },
];

export default function AstrolojiSelectScreen() {
  const insets = useSafeAreaInsets();
  const { lang } = useLang();

  const handleSelect = (serviceId: string) => {
    router.push(`/reading/${serviceId}` as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#04080F", "#070D1A", "#080D1E"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.gold} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {lang === "tr" ? "Astroloji Analizi" : "Astrology Analysis"}
          </Text>
          <Text style={styles.headerSub}>
            {lang === "tr" ? "Bir seçenek belirle" : "Choose an option"}
          </Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.descBox}>
          <Ionicons name="moon-outline" size={16} color="#9B59B6" />
          <Text style={styles.descBoxText}>
            {lang === "tr"
              ? "Astroloji kategorisi üç farklı analiz içerir. Devam etmek istediğiniz analizi seçin."
              : "The astrology category includes three different analyses. Choose the one you'd like to continue with."}
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
  headerCenter: { alignItems: "center" },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scroll: { padding: 18, gap: 12 },
  descBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(155,89,182,0.08)",
    borderWidth: 1,
    borderColor: "rgba(155,89,182,0.25)",
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
