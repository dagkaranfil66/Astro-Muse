import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { GOLD_PACKAGES } from "@/constants/serviceConfig";
import { useLang } from "@/context/LanguageContext";
import PremiumGoldButton from "@/components/PremiumGoldButton";

interface Props {
  visible: boolean;
  onClose: () => void;
  serviceLabel: string;
  goldCost: number;
  goldBalance: number;
  serviceIcon?: string;
  serviceColor?: string;
}

export default function InsufficientGoldModal({
  visible,
  onClose,
  serviceLabel,
  goldCost,
  goldBalance,
  serviceColor = Colors.gold,
}: Props) {
  const { lang } = useLang();

  const handlePackagePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setTimeout(() => router.push("/purchase"), 300);
  };

  const displayPkgs = GOLD_PACKAGES.slice(0, 3);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <Animated.View entering={FadeIn.duration(200)} style={StyleSheet.absoluteFill}>
          <View style={s.overlayBg} />
        </Animated.View>
        <Animated.View entering={SlideInDown.springify().damping(18)} style={s.sheet}>
          <Pressable onPress={() => {}} style={{ width: "100%" }}>
            <LinearGradient
              colors={["#0D1020", "#08051A"]}
              style={s.sheetInner}
            >
              {/* Handle */}
              <View style={s.handle} />

              {/* Close */}
              <Pressable onPress={onClose} style={s.closeBtn} hitSlop={12}>
                <Ionicons name="close" size={18} color={Colors.textDim} />
              </Pressable>

              {/* Icon */}
              <View style={[s.iconCircle, { borderColor: serviceColor + "40" }]}>
                <Text style={s.iconEmoji}>🔮</Text>
              </View>

              {/* Title */}
              <Text style={s.title}>
                {lang === "tr" ? "Yorumun Hazır…" : "Your Reading Is Ready…"}
              </Text>
              <Text style={s.subtitle}>
                {lang === "tr"
                  ? "Tamamını görmek için altın gerekiyor."
                  : "You need gold to unlock the full reading."}
              </Text>

              {/* Balance Row */}
              <View style={s.balanceRow}>
                <View style={s.balanceItem}>
                  <Text style={s.balanceLabel}>{lang === "tr" ? "Gerekli" : "Required"}</Text>
                  <Text style={[s.balanceValue, { color: "#FF6B6B" }]}>{goldCost} ✦</Text>
                </View>
                <View style={s.balanceDivider} />
                <View style={s.balanceItem}>
                  <Text style={s.balanceLabel}>{lang === "tr" ? "Bakiyeniz" : "Your Balance"}</Text>
                  <Text style={s.balanceValue}>{goldBalance} ✦</Text>
                </View>
              </View>

              {/* Package Mini Cards */}
              <Text style={s.pkgHeader}>
                {lang === "tr" ? "✦ Altın Paketleri" : "✦ Gold Packages"}
              </Text>

              {displayPkgs.map((pkg) => {
                const total = pkg.gold + ((pkg as any).bonus ?? 0);
                return (
                  <Pressable key={pkg.id} onPress={handlePackagePress} style={s.miniCard}>
                    <LinearGradient colors={pkg.gradient} style={s.miniCardInner}>
                      <View style={s.miniLeft}>
                        {pkg.popular && (
                          <View style={s.miniPopular}>
                            <Text style={s.miniPopularText}>⭐ EN POPÜLER</Text>
                          </View>
                        )}
                        <Text style={s.miniLabel}>{pkg.label}</Text>
                        <Text style={s.miniGold} numberOfLines={1}>
                          {pkg.gold} Altın
                        </Text>
                      </View>
                      <View style={s.miniRight}>
                        <Text style={s.miniPrice}>{pkg.price}</Text>
                        <View style={s.miniBtn}>
                          <Text style={s.miniBtnText}>{lang === "tr" ? "Satın Al" : "Buy"}</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </Pressable>
                );
              })}

              {/* All Packages Button */}
              <PremiumGoldButton
                onPress={handlePackagePress}
                label={lang === "tr" ? "Altın tükendi — Satın Al" : "Out of Gold — Buy Now"}
              />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  sheetInner: {
    padding: 20,
    paddingBottom: 36,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#FFFFFF22",
    borderRadius: 2,
    marginBottom: 16,
  },
  closeBtn: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    backgroundColor: "#FFFFFF08",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconEmoji: { fontSize: 30 },
  title: {
    fontSize: 22,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF08",
    borderRadius: 12,
    padding: 12,
    width: "100%",
    marginBottom: 20,
    alignItems: "center",
    gap: 12,
  },
  balanceItem: { flex: 1, alignItems: "center" },
  balanceDivider: { width: 1, height: 30, backgroundColor: "#FFFFFF15" },
  balanceLabel: {
    fontSize: 10,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 18,
    fontFamily: "Lora_700Bold",
    color: Colors.gold,
  },
  pkgHeader: {
    fontSize: 11,
    fontFamily: "Lora_700Bold",
    color: Colors.textDim,
    letterSpacing: 1,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  miniCard: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  miniCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  miniLeft: { flex: 1 },
  miniPopular: {
    backgroundColor: "#C8A02020",
    borderWidth: 1,
    borderColor: "#C8A02050",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  miniPopularText: {
    fontSize: 8,
    fontFamily: "Lora_700Bold",
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  miniLabel: {
    fontSize: 10,
    fontFamily: "Lora_700Bold",
    color: Colors.textDim,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  miniGold: {
    fontSize: 14,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
  },
  miniBonus: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    color: Colors.gold,
  },
  miniRight: { alignItems: "flex-end", gap: 6 },
  miniPrice: {
    fontSize: 15,
    fontFamily: "Lora_700Bold",
    color: Colors.gold,
  },
  miniBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  miniBtnText: {
    fontSize: 11,
    fontFamily: "Lora_700Bold",
    color: "#000",
  },
});
