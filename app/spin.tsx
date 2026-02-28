import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";

const { width } = Dimensions.get("window");
const WHEEL_SIZE = Math.min(width - 48, 320);

const PRIZES = [
  { label: "2 Altın", gold: 2, color: "#6B4FBB" },
  { label: "5 Altın", gold: 5, color: "#C0932A" },
  { label: "1 Altın", gold: 1, color: "#1ABFB8" },
  { label: "10 Altın", gold: 10, color: "#E74C8B" },
  { label: "3 Altın", gold: 3, color: "#4CAF7A" },
  { label: "7 Altın", gold: 7, color: "#FF8C42" },
  { label: "1 Altın", gold: 1, color: "#9B59B6" },
  { label: "15 Altın", gold: 15, color: "#E7B008" },
];

const SLICE_ANGLE = 360 / PRIZES.length;

function WheelSegment({ index, total, prize }: { index: number; total: number; prize: typeof PRIZES[0] }) {
  const angle = (index / total) * 360;
  const midAngle = angle + SLICE_ANGLE / 2;
  const rad = (midAngle * Math.PI) / 180;
  const r = WHEEL_SIZE / 2;
  const labelR = r * 0.62;
  const lx = r + labelR * Math.cos(rad);
  const ly = r + labelR * Math.sin(rad);

  return (
    <View
      style={[
        styles.segment,
        {
          transform: [{ rotate: `${angle}deg` }],
          backgroundColor: prize.color + "22",
          borderTopColor: prize.color + "50",
        },
      ]}
    >
      <View
        style={[styles.segmentLabel, { left: lx - 24, top: ly - 12 }]}
      >
        <Text style={styles.segmentText}>{prize.label}</Text>
      </View>
    </View>
  );
}

export default function SpinScreen() {
  const insets = useSafeAreaInsets();
  const { lang } = useLang();
  const { canSpin, performSpin, goldBalance } = useApp();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<typeof PRIZES[0] | null>(null);
  const [done, setDone] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const rotation = useSharedValue(0);
  const pointerBounce = useSharedValue(1);
  const resultScale = useSharedValue(0);

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  const pointerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pointerBounce.value }],
  }));
  const resultStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
  }));

  const spin = () => {
    if (spinning || done || !canSpin) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSpinning(true);
    setResult(null);

    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const prize = PRIZES[prizeIndex];

    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = extraSpins * 360 + (360 - prizeIndex * SLICE_ANGLE - SLICE_ANGLE / 2);

    pointerBounce.value = withRepeat(
      withSequence(withTiming(1.3, { duration: 150 }), withTiming(1, { duration: 150 })),
      8, false
    );

    rotation.value = withTiming(
      rotation.value + targetAngle,
      { duration: 4500, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(handleSpinDone)(prize);
        }
      }
    );
  };

  const handleSpinDone = async (prize: typeof PRIZES[0]) => {
    await performSpin(prize.gold);
    setResult(prize);
    setDone(true);
    setSpinning(false);
    resultScale.value = withSpring(1, { damping: 10, stiffness: 120 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#08051A", "#0D0530", "#0D1A08"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {lang === "tr" ? "Günlük Çark" : "Daily Wheel"}
        </Text>
        <View style={styles.goldBadge}>
          <Text style={{ fontSize: 13, color: Colors.gold }}>✦</Text>
          <Text style={styles.goldBadgeText}>{goldBalance}</Text>
        </View>
      </View>

      <View style={[styles.content, { paddingBottom: botPad + 24 }]}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            {lang === "tr" ? "Günlük Altın Ödülü" : "Daily Gold Reward"}
          </Text>
          <Text style={styles.infoDesc}>
            {canSpin
              ? (lang === "tr" ? "Çarkı çevir ve altın kazan!" : "Spin the wheel and win gold!")
              : (lang === "tr" ? "Bir sonraki çevirme hakkın 24 saatte gelecek" : "Next spin available in 24 hours")}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200)} style={styles.wheelContainer}>
          {/* ── Pointer arrow at TOP pointing into wheel ── */}
          <Animated.View style={[styles.pointerWrap, pointerStyle]}>
            <View style={styles.pointerShadow} />
            <View style={styles.pointerTriangle} />
            <View style={styles.pointerBase} />
          </Animated.View>

          <View style={[styles.wheelOuter, { width: WHEEL_SIZE, height: WHEEL_SIZE, borderRadius: WHEEL_SIZE / 2 }]}>
            <Animated.View
              style={[styles.wheelInner, { width: WHEEL_SIZE, height: WHEEL_SIZE, borderRadius: WHEEL_SIZE / 2 }, wheelStyle]}
            >
              {PRIZES.map((prize, i) => {
                const startAngle = (i / PRIZES.length) * 360;
                const midAngleDeg = startAngle + SLICE_ANGLE / 2;
                const midAngleRad = (midAngleDeg - 90) * (Math.PI / 180);
                const labelR = WHEEL_SIZE * 0.29;
                const cx = WHEEL_SIZE / 2;
                const cy = WHEEL_SIZE / 2;
                const lx = cx + Math.cos(midAngleRad) * labelR;
                const ly = cy + Math.sin(midAngleRad) * labelR;
                return (
                  <View
                    key={i}
                    style={[
                      styles.sliceWrap,
                      {
                        width: WHEEL_SIZE,
                        height: WHEEL_SIZE,
                        transform: [{ rotate: `${startAngle}deg` }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[prize.color + "FF", prize.color + "CC"]}
                      style={[styles.slice, { borderTopWidth: 2, borderTopColor: "rgba(255,255,255,0.35)" }]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                    />
                  </View>
                );
              })}
              {/* Labels rendered outside the rotated slices so they stay aligned */}
              {PRIZES.map((prize, i) => {
                const midAngleDeg = (i / PRIZES.length) * 360 + SLICE_ANGLE / 2;
                const midAngleRad = (midAngleDeg - 90) * (Math.PI / 180);
                const labelR = WHEEL_SIZE * 0.3;
                const cx = WHEEL_SIZE / 2;
                const cy = WHEEL_SIZE / 2;
                const lx = cx + Math.cos(midAngleRad) * labelR;
                const ly = cy + Math.sin(midAngleRad) * labelR;
                const [amount, unit] = prize.label.split(" ");
                return (
                  <View
                    key={`label-${i}`}
                    style={[
                      styles.sliceLabelBox,
                      {
                        left: lx - 22,
                        top: ly - 18,
                        transform: [{ rotate: `${midAngleDeg}deg` }],
                        borderColor: prize.color,
                        backgroundColor: "rgba(4,6,20,0.75)",
                      },
                    ]}
                  >
                    <Text style={[styles.sliceLabelAmount, { color: Colors.gold }]}>{amount}</Text>
                    <Text style={[styles.sliceLabelUnit, { color: prize.color }]}>{unit}</Text>
                  </View>
                );
              })}
              <View style={styles.wheelCenter}>
                <Text style={styles.wheelCenterIcon}>✦</Text>
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        {!done && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Pressable
              onPress={spin}
              disabled={spinning || !canSpin}
              style={[styles.spinBtn, (!canSpin || spinning) && { opacity: 0.5 }]}
            >
              <LinearGradient
                colors={canSpin ? ["#8B5CF6", "#6B4FBB"] : ["#333", "#222"]}
                style={styles.spinBtnInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name={spinning ? "sync-outline" : "refresh-outline"} size={20} color="#fff" />
                <Text style={styles.spinBtnText}>
                  {spinning
                    ? (lang === "tr" ? "Dönüyor..." : "Spinning...")
                    : canSpin
                    ? (lang === "tr" ? "Çevir!" : "Spin!")
                    : (lang === "tr" ? "24 Saatte Tekrar" : "Come Back in 24h")}
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {done && result && (
          <Animated.View style={[styles.resultBox, resultStyle]}>
            <LinearGradient colors={["#1A0F35", "#0D1526"]} style={styles.resultInner}>
              <Text style={styles.resultEmoji}>🎉</Text>
              <Text style={styles.resultTitle}>
                {lang === "tr" ? "Tebrikler!" : "Congratulations!"}
              </Text>
              <Text style={styles.resultGold}>
                +{result.gold} <Text style={{ color: Colors.gold }}>✦ Altın</Text>
              </Text>
              <Text style={styles.resultDesc}>
                {lang === "tr" ? "Yarın tekrar çevirebilirsin!" : "Come back tomorrow to spin again!"}
              </Text>
              <Pressable onPress={() => router.back()} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>{lang === "tr" ? "Harika!" : "Awesome!"}</Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: "Lora_700Bold", color: Colors.text, textAlign: "center" },
  goldBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.gold + "18", borderRadius: 10,
    borderWidth: 1, borderColor: Colors.gold + "40",
    paddingHorizontal: 10, paddingVertical: 5, minWidth: 52, justifyContent: "center",
  },
  goldBadgeText: { fontSize: 13, fontFamily: "Lora_700Bold", color: Colors.gold },

  content: { flex: 1, alignItems: "center", paddingHorizontal: 24 },

  infoBox: {
    backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder,
    paddingHorizontal: 20, paddingVertical: 14,
    alignItems: "center", width: "100%", marginBottom: 24,
  },
  infoTitle: { fontSize: 15, fontFamily: "Lora_700Bold", color: Colors.text, marginBottom: 4 },
  infoDesc: { fontSize: 12, fontFamily: "Lora_400Regular", color: Colors.textSecondary, textAlign: "center" },

  wheelContainer: { alignItems: "center", marginBottom: 28 },
  wheelOuter: {
    borderWidth: 3, borderColor: Colors.gold + "60",
    overflow: "hidden",
    shadowColor: Colors.gold, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  wheelInner: { overflow: "hidden", alignItems: "center", justifyContent: "center" },

  sliceWrap: {
    position: "absolute",
    overflow: "hidden",
    alignItems: "center",
    top: 0, left: 0,
  },
  slice: {
    position: "absolute",
    width: "100%", height: "50%",
    transformOrigin: "50% 100%",
  },
  sliceLabel: {
    position: "absolute",
    fontSize: 11, fontFamily: "Lora_700Bold",
    top: "12%", left: "50%",
    width: 60, textAlign: "center",
  },
  sliceLabelBox: {
    position: "absolute",
    width: 44, height: 36,
    borderRadius: 6, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    gap: 1,
  },
  sliceLabelAmount: {
    fontSize: 13, fontFamily: "Lora_700Bold", lineHeight: 15,
  },
  sliceLabelUnit: {
    fontSize: 8, fontFamily: "Lora_700Bold", lineHeight: 10, letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },

  wheelCenter: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.background,
    borderWidth: 2.5, borderColor: Colors.gold,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.gold, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  wheelCenterIcon: { fontSize: 24, color: Colors.gold },

  pointerWrap: {
    alignItems: "center", zIndex: 10, marginBottom: -16,
  },
  pointerShadow: {
    position: "absolute", bottom: -4,
    width: 20, height: 8, borderRadius: 4,
    backgroundColor: Colors.gold, opacity: 0.25,
  },
  pointerTriangle: {
    width: 0, height: 0,
    borderLeftWidth: 12, borderRightWidth: 12, borderTopWidth: 24,
    borderLeftColor: "transparent", borderRightColor: "transparent",
    borderTopColor: Colors.gold,
  },
  pointerBase: {
    width: 10, height: 8, borderRadius: 2,
    backgroundColor: Colors.gold, marginTop: -4,
  },

  spinBtn: { width: "100%" },
  spinBtnInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, borderRadius: 16, paddingVertical: 18,
  },
  spinBtnText: { fontSize: 16, fontFamily: "Lora_700Bold", color: "#fff" },

  resultBox: { width: "100%", marginTop: 8 },
  resultInner: {
    borderRadius: 18, padding: 28, alignItems: "center",
    borderWidth: 1, borderColor: Colors.gold + "40",
  },
  resultEmoji: { fontSize: 48, marginBottom: 8 },
  resultTitle: { fontSize: 22, fontFamily: "Lora_700Bold", color: Colors.text, marginBottom: 8 },
  resultGold: { fontSize: 32, fontFamily: "Lora_700Bold", color: Colors.text, marginBottom: 8 },
  resultDesc: { fontSize: 13, fontFamily: "Lora_400Regular", color: Colors.textSecondary, textAlign: "center", marginBottom: 20 },
  closeBtn: {
    backgroundColor: Colors.gold, borderRadius: 12,
    paddingHorizontal: 32, paddingVertical: 14,
  },
  closeBtnText: { fontSize: 15, fontFamily: "Lora_700Bold", color: Colors.background },

  segment: {},
  segmentLabel: { position: "absolute" },
  segmentText: { fontSize: 10, fontFamily: "Lora_700Bold", color: Colors.text },
});
