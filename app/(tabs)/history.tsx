import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useApp, Reading } from "@/context/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReadingCard({ reading, index }: { reading: Reading; index: number }) {
  const color = SERVICE_COLORS[reading.service] || Colors.gold;
  const icon = SERVICE_ICONS[reading.service] || "star-outline";

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <View style={styles.card}>
        <LinearGradient
          colors={["#0F1A2E", Colors.background]}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { borderColor: color + "40" }]}>
              <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={styles.cardMeta}>
              <Text style={styles.cardService}>{reading.serviceLabel}</Text>
              <Text style={styles.cardDate}>{formatDate(reading.date)}</Text>
            </View>
          </View>
          <Text style={styles.cardText} numberOfLines={4}>
            {reading.content}
          </Text>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { readings } = useApp();

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 100 : insets.bottom + 80;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A1020", Colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 20, paddingBottom: botPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerSub}>✦ GEÇMİŞ ✦</Text>
        <Text style={styles.headerTitle}>Okumalarım</Text>

        {readings.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="scroll-outline" size={56} color={Colors.textDim} />
            <Text style={styles.emptyTitle}>Henüz okuma yok</Text>
            <Text style={styles.emptyDesc}>
              İlk mistik okumanızı yapmak için Ana Sayfa'ya gidin
            </Text>
          </View>
        ) : (
          readings.map((r, i) => (
            <ReadingCard key={r.id} reading={r} index={i} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
  },
  headerSub: {
    color: Colors.gold,
    fontSize: 11,
    letterSpacing: 6,
    fontFamily: "Lora_400Regular",
    textAlign: "center",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "CinzelDecorative_700Bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 28,
    letterSpacing: 1,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "CinzelDecorative_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 14,
  },
  cardGradient: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cardMeta: {
    flex: 1,
  },
  cardService: {
    fontSize: 14,
    fontFamily: "CinzelDecorative_400Regular",
    color: Colors.text,
    letterSpacing: 0.5,
  },
  cardDate: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
    marginTop: 2,
  },
  cardText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
