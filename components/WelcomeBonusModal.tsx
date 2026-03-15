import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Modal, Dimensions } from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withRepeat,
  withSequence, withTiming, withDelay, FadeIn, ZoomIn, Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

const { width, height } = Dimensions.get("window");
const GOLD = "#FFD700";
const GOLD_LIGHT = "#FFE97A";

function Sparkle({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  const op = useSharedValue(0);
  const sc = useSharedValue(0);
  useEffect(() => {
    op.value = withDelay(delay, withRepeat(
      withSequence(withTiming(1, { duration: 400 }), withTiming(0, { duration: 600 })),
      -1, false
    ));
    sc.value = withDelay(delay, withRepeat(
      withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 600 })),
      -1, false
    ));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ scale: sc.value }],
  }));
  return (
    <Animated.View style={[s.sparkle, { left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: GOLD_LIGHT }, style]} />
  );
}

function CoinStack() {
  const float = useSharedValue(0);
  const glow = useSharedValue(0.6);
  useEffect(() => {
    float.value = withRepeat(
      withSequence(withTiming(-10, { duration: 1200, easing: Easing.ease }), withTiming(0, { duration: 1200, easing: Easing.ease })),
      -1, false
    );
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1000 }), withTiming(0.5, { duration: 1000 })),
      -1, false
    );
  }, []);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  return (
    <View style={s.coinWrap}>
      <Animated.View style={[s.glowOrb, glowStyle]} />
      <Animated.View style={floatStyle}>
        <View style={s.coinOuter}>
          <LinearGradient colors={[GOLD_LIGHT, GOLD, "#B8860B"]} style={s.coin} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}>
            <Text style={s.coinSymbol}>✦</Text>
          </LinearGradient>
        </View>
        <View style={[s.coinOuter, s.coinOuter2]}>
          <LinearGradient colors={[GOLD_LIGHT, GOLD, "#B8860B"]} style={s.coin} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}>
            <Text style={s.coinSymbol}>✦</Text>
          </LinearGradient>
        </View>
        <View style={[s.coinOuter, s.coinOuter3]}>
          <LinearGradient colors={[GOLD_LIGHT, GOLD, "#B8860B"]} style={s.coin} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}>
            <Text style={s.coinSymbol}>✦</Text>
          </LinearGradient>
        </View>
      </Animated.View>
    </View>
  );
}

const SPARKLES = [
  { x: 30,  y: 10,  delay: 0,    size: 6 },
  { x: 220, y: 20,  delay: 300,  size: 5 },
  { x: 60,  y: 80,  delay: 600,  size: 4 },
  { x: 210, y: 70,  delay: 900,  size: 7 },
  { x: 110, y: 5,   delay: 450,  size: 5 },
  { x: 160, y: 90,  delay: 150,  size: 4 },
  { x: 10,  y: 50,  delay: 750,  size: 6 },
  { x: 240, y: 130, delay: 200,  size: 4 },
];

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function WelcomeBonusModal({ visible, onDismiss }: Props) {
  const cardScale = useSharedValue(0.8);
  useEffect(() => {
    if (visible) {
      cardScale.value = withSpring(1, { damping: 14, stiffness: 120 });
    }
  }, [visible]);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={s.overlay}>
        <Animated.View style={[s.card, cardStyle]} entering={ZoomIn.springify()}>
          <LinearGradient colors={["#1C0E30", "#120820", "#0D0A1A"]} style={s.gradient}>

            {/* Sparkles */}
            <View style={s.sparkleField}>
              {SPARKLES.map((sp, i) => <Sparkle key={i} {...sp} />)}
            </View>

            {/* Top badge */}
            <Animated.View entering={FadeIn.delay(200)} style={s.badge}>
              <Ionicons name="star" size={12} color={GOLD} />
              <Text style={s.badgeText}>Tengri'ye Hoş Geldin</Text>
              <Ionicons name="star" size={12} color={GOLD} />
            </Animated.View>

            {/* Coin animation */}
            <CoinStack />

            {/* Amount */}
            <Animated.View entering={ZoomIn.delay(300).springify()} style={s.amountRow}>
              <Text style={s.amountNumber}>15</Text>
              <Text style={s.amountSymbol}>✦</Text>
              <Text style={s.amountLabel}>Altın</Text>
            </Animated.View>

            {/* Text */}
            <Animated.View entering={FadeIn.delay(400)} style={s.textBlock}>
              <Text style={s.title}>Başlangıç Hediyeni Aldın!</Text>
              <Text style={s.desc}>
                Tengri sana 15 altın hediye etti.{"\n"}
                Hemen bir analiz yap, gizemi keşfet.
              </Text>
            </Animated.View>

            {/* Divider */}
            <View style={s.divider} />

            {/* Stats row */}
            <Animated.View entering={FadeIn.delay(500)} style={s.statsRow}>
              <View style={s.statItem}>
                <Ionicons name="cafe-outline" size={18} color={GOLD} />
                <Text style={s.statText}>Kahve Analizi</Text>
                <Text style={s.statCost}>6✦</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Ionicons name="heart-outline" size={18} color={GOLD} />
                <Text style={s.statText}>Aşk Uyumu</Text>
                <Text style={s.statCost}>6✦</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Ionicons name="moon-outline" size={18} color={GOLD} />
                <Text style={s.statText}>Rüya Analizi</Text>
                <Text style={s.statCost}>4✦</Text>
              </View>
            </Animated.View>

            {/* Button */}
            <Animated.View entering={FadeIn.delay(600)} style={s.btnWrap}>
              <Pressable onPress={onDismiss}>
                <LinearGradient colors={[GOLD_LIGHT, GOLD, "#C8A000"]} style={s.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="sparkles" size={18} color="#000" />
                  <Text style={s.btnText}>Keşfetmeye Başla</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>

          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "#000000CC",
    alignItems: "center", justifyContent: "center",
  },
  card: {
    width: Math.min(width - 40, 340),
    borderRadius: 24, overflow: "hidden",
    borderWidth: 1, borderColor: GOLD + "40",
  },
  gradient: { padding: 28 },
  sparkleField: { position: "absolute", top: 0, left: 0, right: 0, height: 160, pointerEvents: "none" },
  sparkle: { position: "absolute" },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "center", backgroundColor: GOLD + "18",
    borderWidth: 1, borderColor: GOLD + "40",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    marginBottom: 20,
  },
  badgeText: { color: GOLD, fontSize: 12, fontFamily: "Lora_600SemiBold" },
  coinWrap: { alignItems: "center", height: 130, justifyContent: "center", marginBottom: 8 },
  glowOrb: {
    position: "absolute", width: 110, height: 110, borderRadius: 55,
    backgroundColor: GOLD + "20",
  },
  coinOuter: { width: 80, height: 80, borderRadius: 40, shadowColor: GOLD, shadowOpacity: 0.8, shadowRadius: 12, elevation: 8 },
  coinOuter2: { position: "absolute", top: 10, left: -18, width: 58, height: 58, borderRadius: 29 },
  coinOuter3: { position: "absolute", top: 14, left: 40, width: 52, height: 52, borderRadius: 26 },
  coin: { flex: 1, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  coinSymbol: { fontSize: 26, color: "#3A2000", fontFamily: "CinzelDecorative_700Bold" },
  amountRow: {
    flexDirection: "row", alignItems: "baseline", justifyContent: "center",
    gap: 6, marginVertical: 16,
  },
  amountNumber: { fontSize: 56, color: GOLD, fontFamily: "CinzelDecorative_700Bold", lineHeight: 64 },
  amountSymbol: { fontSize: 28, color: GOLD_LIGHT, fontFamily: "CinzelDecorative_700Bold" },
  amountLabel: { fontSize: 22, color: GOLD, fontFamily: "Lora_700Bold" },
  textBlock: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 18, color: "#FFFFFF", fontFamily: "Lora_700Bold", marginBottom: 8, textAlign: "center" },
  desc: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Lora_400Regular", textAlign: "center", lineHeight: 20 },
  divider: { height: 1, backgroundColor: GOLD + "25", marginBottom: 16 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 24 },
  statDivider: { width: 1, backgroundColor: GOLD + "25" },
  statItem: { alignItems: "center", gap: 4, flex: 1 },
  statText: { fontSize: 10, color: Colors.textSecondary, fontFamily: "Lora_400Regular" },
  statCost: { fontSize: 12, color: GOLD, fontFamily: "Lora_700Bold" },
  btnWrap: { borderRadius: 14, overflow: "hidden" },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  btnText: { fontSize: 15, color: "#000000", fontFamily: "Lora_700Bold" },
});
