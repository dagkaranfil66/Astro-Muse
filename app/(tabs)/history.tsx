import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useApp, Reading } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";

const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  astroloji: "moon-outline",
  kahve: "cafe-outline",
  el: "hand-left-outline",
  tarot: "layers-outline",
  samanizm: "leaf-outline",
  numeroloji: "star-outline",
  ruh: "eye-outline",
  ruya: "cloudy-night-outline",
  dogum: "telescope-outline",
  ask: "heart-outline",
};

const SERVICE_COLORS: Record<string, string> = {
  astroloji: "#6B4FBB",
  kahve: "#C0932A",
  el: "#1ABFB8",
  tarot: "#E7B008",
  samanizm: "#4CAF7A",
  numeroloji: "#E74C8B",
  ruh: "#9B59B6",
  ruya: "#5E4FAA",
  dogum: "#2196F3",
  ask: "#E91E7A",
};

function formatDate(iso: string, lang: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,3}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .trim();
}

function ReadingDetailModal({
  reading,
  visible,
  onClose,
}: {
  reading: Reading | null;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { lang } = useLang();
  if (!reading) return null;

  const color = SERVICE_COLORS[reading.service] || Colors.gold;
  const icon = SERVICE_ICONS[reading.service] || "star-outline";
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        <LinearGradient colors={["#08051A", "#07091A", "#0D0820"]} style={StyleSheet.absoluteFill} />

        <View style={[modal.header, { paddingTop: topPad + 8 }]}>
          <View style={[modal.iconWrap, { borderColor: color + "50" }]}>
            <Ionicons name={icon} size={22} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={modal.serviceLabel}>{reading.serviceLabel}</Text>
            <Text style={modal.dateLabel}>{formatDate(reading.date, lang)}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={16} style={modal.closeBtn}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {reading.goldSpent !== undefined && (
          <View style={modal.goldRow}>
            <Text style={modal.goldText}>✦ {reading.goldSpent} {lang === "tr" ? "altın harcandı" : "gold spent"}</Text>
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[modal.scrollContent, { paddingBottom: botPad + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {reading.userInput ? (
            <View style={modal.userInputBox}>
              <Text style={modal.userInputLabel}>{lang === "tr" ? "Sorunuz" : "Your Question"}</Text>
              <Text style={modal.userInputText}>{reading.userInput}</Text>
            </View>
          ) : null}

          <View style={[modal.divider, { borderColor: color + "30" }]} />

          <Text style={modal.contentText}>{reading.content}</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

function ReadingCard({
  reading,
  index,
  onPress,
}: {
  reading: Reading;
  index: number;
  onPress: () => void;
}) {
  const { lang } = useLang();
  const color = SERVICE_COLORS[reading.service] || Colors.gold;
  const icon = SERVICE_ICONS[reading.service] || "star-outline";
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()} style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      >
        <LinearGradient colors={["#0F1A2E", Colors.background]} style={styles.cardGradient}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { borderColor: color + "40" }]}>
              <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={styles.cardMeta}>
              <Text style={styles.cardService}>{reading.serviceLabel}</Text>
              <Text style={styles.cardDate}>{formatDate(reading.date, lang)}</Text>
            </View>
            <View style={styles.cardArrow}>
              <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
            </View>
          </View>
          <Text style={styles.cardText} numberOfLines={4}>
            {stripMarkdown(reading.content)}
          </Text>
          {reading.goldSpent !== undefined && (
            <View style={styles.goldPill}>
              <Text style={styles.goldPillText}>✦ {reading.goldSpent}</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { readings } = useApp();
  const { t, lang } = useLang();

  const [selectedReading, setSelectedReading] = useState<Reading | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 100 : insets.bottom + 80;

  const openReading = (r: Reading) => {
    setSelectedReading(r);
    setModalVisible(true);
  };

  const closeReading = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedReading(null), 300);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0A1020", Colors.background]} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 20, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerSub}>✦ {t.history.toUpperCase()} ✦</Text>
        <Text style={styles.headerTitle}>{t.myReadings}</Text>

        {readings.length === 0 ? (
          <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.empty}>
            <Ionicons name="document-text-outline" size={56} color={Colors.textDim} />
            <Text style={styles.emptyTitle}>{t.noReadings}</Text>
            <Text style={styles.emptyDesc}>{t.noReadingsDesc}</Text>
          </Animated.View>
        ) : (
          readings.map((r, i) => (
            <ReadingCard key={r.id} reading={r} index={i} onPress={() => openReading(r)} />
          ))
        )}
      </ScrollView>

      <ReadingDetailModal
        reading={selectedReading}
        visible={modalVisible}
        onClose={closeReading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20 },
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
    fontFamily: "Lora_700Bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 28,
    letterSpacing: 0.3,
  },
  empty: { alignItems: "center", paddingTop: 60, gap: 16 },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Lora_700Bold",
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
  cardGradient: { padding: 22 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cardMeta: { flex: 1 },
  cardService: {
    fontSize: 14,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
    letterSpacing: 0.1,
  },
  cardDate: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
    marginTop: 2,
  },
  cardArrow: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    fontSize: 13,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.textSecondary,
    lineHeight: 23,
  },
  goldPill: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: Colors.gold + "15",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  goldPillText: {
    fontSize: 11,
    fontFamily: "Lora_700Bold",
    color: Colors.gold,
  },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08051A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  serviceLabel: {
    fontSize: 16,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
  },
  dateLabel: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: Colors.surface,
  },
  goldRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  goldText: {
    fontSize: 12,
    fontFamily: "Lora_700Bold",
    color: Colors.gold,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    gap: 16,
  },
  userInputBox: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    gap: 6,
  },
  userInputLabel: {
    fontSize: 11,
    fontFamily: "Lora_700Bold",
    color: Colors.textDim,
    letterSpacing: 1,
  },
  userInputText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  divider: {
    borderTopWidth: 1,
    borderColor: Colors.gold + "30",
    marginVertical: 4,
  },
  contentText: {
    fontSize: 15,
    fontFamily: "Lora_400Regular",
    color: Colors.text,
    lineHeight: 26,
  },
});
