import React, { useState, useEffect } from "react";
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
import Svg, { Path, G, Text as SvgText, Circle, Line } from "react-native-svg";
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
import { scheduleSpinReadyNotification } from "@/lib/notifications";

const { width } = Dimensions.get("window");
const WHEEL_SIZE = Math.min(width - 40, 320);
const R = WHEEL_SIZE / 2;

const PRIZES = [
  { label: "2 Altın", gold: 2,  color: "#E91E8C" },
  { label: "5 Altın", gold: 5,  color: "#7B1FA2" },
  { label: "1 Altın", gold: 1,  color: "#1565C0" },
  { label: "10 Altın", gold: 10, color: "#00897B" },
  { label: "3 Altın", gold: 3,  color: "#8BC34A" },
  { label: "7 Altın", gold: 7,  color: "#FF6F00" },
  { label: "1 Altın", gold: 1,  color: "#D32F2F" },
  { label: "4 Altın",  gold: 4,  color: "#F9A825" },
];

const SLICE_ANGLE = 360 / PRIZES.length;

function polarToXY(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: R + radius * Math.cos(rad),
    y: R + radius * Math.sin(rad),
  };
}

function segmentPath(startDeg: number, endDeg: number) {
  const start = polarToXY(startDeg, R - 1);
  const end = polarToXY(endDeg, R - 1);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${R} ${R} L ${start.x} ${start.y} A ${R - 1} ${R - 1} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function WheelSvg() {
  return (
    <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}>
      {PRIZES.map((prize, i) => {
        const startDeg = i * SLICE_ANGLE;
        const endDeg = (i + 1) * SLICE_ANGLE;
        const midDeg = startDeg + SLICE_ANGLE / 2;

        const textR = R * 0.62;
        const textPos = polarToXY(midDeg, textR);

        return (
          <G key={i}>
            <Path
              d={segmentPath(startDeg, endDeg)}
              fill={prize.color}
            />
            <G transform={`rotate(${midDeg}, ${textPos.x}, ${textPos.y})`}>
              <SvgText
                x={textPos.x}
                y={textPos.y}
                fill="#FFFFFF"
                fontSize={13}
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {prize.label}
              </SvgText>
            </G>
          </G>
        );
      })}

      {/* White dividing lines */}
      {PRIZES.map((_, i) => {
        const angleDeg = i * SLICE_ANGLE;
        const outer = polarToXY(angleDeg, R - 1);
        return (
          <Line
            key={`line-${i}`}
            x1={R}
            y1={R}
            x2={outer.x}
            y2={outer.y}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth={2}
          />
        );
      })}

      {/* Center circle */}
      <Circle cx={R} cy={R} r={28} fill="#0A0520" />
      <Circle cx={R} cy={R} r={28} fill="none" stroke={Colors.gold} strokeWidth={2.5} />
      <SvgText
        x={R}
        y={R + 1}
        fill={Colors.gold}
        fontSize={22}
        fontWeight="bold"
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        ✦
      </SvgText>
    </Svg>
  );
}

export default function SpinScreen() {
  const insets = useSafeAreaInsets();
  const { lang } = useLang();
  const { canSpin, performSpin, goldBalance, lastSpinDate } = useApp();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<typeof PRIZES[0] | null>(null);
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState("");

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (canSpin) { setCountdown(""); return; }
    const update = () => {
      const target = lastSpinDate ? new Date(lastSpinDate).getTime() + 24 * 60 * 60 * 1000 : Date.now();
      const remaining = Math.max(0, target - Date.now());
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [canSpin, lastSpinDate]);

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
      withSequence(withTiming(1.35, { duration: 140 }), withTiming(1, { duration: 140 })),
      10, false
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
    scheduleSpinReadyNotification(lang).catch(() => {});
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
          {lang === "tr" ? "Şans Çarkı" : "Lucky Wheel"}
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
          {canSpin ? (
            <Text style={styles.infoDesc}>
              {lang === "tr" ? "Şans Çarkı seni bekliyor — döndür ve altın kazan!" : "The Lucky Wheel awaits — spin and win gold!"}
            </Text>
          ) : (
            <View style={styles.countdownWrap}>
              <Text style={styles.infoDesc}>
                {lang === "tr" ? "Tekrar çevirmek için:" : "Next spin in:"}
              </Text>
              <Text style={styles.countdownText}>{countdown || "00:00:00"}</Text>
              <Text style={styles.countdownSub}>
                {lang === "tr" ? "saat : dakika : saniye" : "hours : minutes : seconds"}
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200)} style={styles.wheelContainer}>
          {/* Gold pointer at top */}
          <Animated.View style={[styles.pointerWrap, pointerStyle]}>
            <View style={styles.pointerTriangle} />
            <View style={styles.pointerBase} />
          </Animated.View>

          {/* Wheel ring + SVG */}
          <View style={[styles.wheelRing, { width: WHEEL_SIZE + 10, height: WHEEL_SIZE + 10, borderRadius: (WHEEL_SIZE + 10) / 2 }]}>
            <Animated.View style={[{ width: WHEEL_SIZE, height: WHEEL_SIZE, borderRadius: R }, wheelStyle]}>
              <WheelSvg />
            </Animated.View>
          </View>
        </Animated.View>

        {!done && (
          <Animated.View entering={FadeInDown.delay(300).springify()} style={{ width: "100%" }}>
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

      </View>

      {/* Result overlay — floats above everything */}
      {done && result && (
        <Animated.View style={styles.resultOverlay} entering={FadeIn.duration(300)}>
          <Animated.View style={[styles.resultBox, resultStyle]}>
            <LinearGradient
              colors={["#1A0F35", "#100828", "#0D1526"]}
              style={styles.resultInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Gold ring glow */}
              <View style={styles.resultGlowRing} />
              <Text style={styles.resultEmoji}>🎉</Text>
              <Text style={styles.resultTitle}>
                {lang === "tr" ? "Tebrikler!" : "Congratulations!"}
              </Text>
              <Text style={styles.resultGold}>
                +{result.gold}{" "}
                <Text style={{ color: Colors.gold }}>✦ Altın</Text>
              </Text>
              <Text style={styles.resultDesc}>
                {lang === "tr"
                  ? "Altın bakiyene eklendi 🌟"
                  : "Added to your gold balance 🌟"}
              </Text>
              <Text style={styles.resultSubDesc}>
                {lang === "tr"
                  ? "Yarın tekrar çevirebilirsin!"
                  : "Come back tomorrow to spin again!"}
              </Text>
              <Pressable onPress={() => router.back()} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>
                  {lang === "tr" ? "🚀  Harika!" : "🚀  Awesome!"}
                </Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      )}
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

  content: { flex: 1, alignItems: "center", paddingHorizontal: 20 },

  infoBox: {
    backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder,
    paddingHorizontal: 20, paddingVertical: 16,
    alignItems: "center", width: "100%", marginBottom: 28,
  },
  infoTitle: { fontSize: 15, fontFamily: "Lora_700Bold", color: Colors.text, marginBottom: 6 },
  infoDesc: { fontSize: 12, fontFamily: "Lora_400Regular", color: Colors.textSecondary, textAlign: "center" },
  countdownWrap: { alignItems: "center", marginTop: 4 },
  countdownText: {
    fontSize: 38,
    fontFamily: "Lora_700Bold",
    color: Colors.gold,
    letterSpacing: 4,
    marginVertical: 6,
  },
  countdownSub: {
    fontSize: 10,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
    letterSpacing: 3,
    textTransform: "uppercase",
  },

  wheelContainer: { alignItems: "center", marginBottom: 32 },

  pointerWrap: { alignItems: "center", zIndex: 10, marginBottom: -6 },
  pointerTriangle: {
    width: 0, height: 0,
    borderLeftWidth: 11, borderRightWidth: 11, borderTopWidth: 22,
    borderLeftColor: "transparent", borderRightColor: "transparent",
    borderTopColor: Colors.gold,
  },
  pointerBase: {
    width: 8, height: 6, borderRadius: 2,
    backgroundColor: Colors.gold, marginTop: -3,
  },

  wheelRing: {
    borderWidth: 4,
    borderColor: Colors.gold + "80",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: Colors.gold,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },

  spinBtn: { width: "100%" },
  spinBtnInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, borderRadius: 16, paddingVertical: 18,
  },
  spinBtnText: { fontSize: 16, fontFamily: "Lora_700Bold", color: "#fff" },

  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.82)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 200,
  },
  resultBox: { width: "100%" },
  resultInner: {
    borderRadius: 22, padding: 32, alignItems: "center",
    borderWidth: 1.5, borderColor: Colors.gold + "60",
    overflow: "hidden",
    shadowColor: Colors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  resultGlowRing: {
    position: "absolute",
    top: -60, left: -60, right: -60,
    height: 160,
    backgroundColor: Colors.gold,
    opacity: 0.06,
    borderRadius: 80,
  },
  resultEmoji: { fontSize: 56, marginBottom: 12 },
  resultTitle: { fontSize: 26, fontFamily: "Lora_700Bold", color: Colors.text, marginBottom: 10, letterSpacing: 0.5 },
  resultGold: { fontSize: 38, fontFamily: "Lora_700Bold", color: Colors.text, marginBottom: 6 },
  resultDesc: { fontSize: 14, fontFamily: "Lora_700Bold", color: Colors.gold, textAlign: "center", marginBottom: 4 },
  resultSubDesc: { fontSize: 12, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, textAlign: "center", marginBottom: 28 },
  closeBtn: {
    backgroundColor: Colors.gold, borderRadius: 14,
    paddingHorizontal: 40, paddingVertical: 16,
    shadowColor: Colors.gold, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
  },
  closeBtnText: { fontSize: 16, fontFamily: "Lora_700Bold", color: Colors.background, letterSpacing: 0.3 },
});
