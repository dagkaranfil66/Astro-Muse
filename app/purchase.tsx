import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
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
  withRepeat,
  withTiming,
  withSpring,
  ZoomIn,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { GOLD_PACKAGES, SERVICE_GOLD_COST } from "@/constants/serviceConfig";

const SERVICE_NAMES_TR: Record<string, string> = {
  samanizm: "Şamanizm", burclar: "Burçlar", ruh: "Ruh Okuma",
  astroloji: "Astroloji", kahve: "Kahve Falı", el: "El Falı",
  numeroloji: "Numeroloji", ruya: "Rüya Yorumu", ask: "Aşkını Bul",
  tarot: "Tarot", dogum: "Doğum Haritası",
};

function GoldPackageCard({ pkg, onBuy, buying, boughtId }: {
  pkg: typeof GOLD_PACKAGES[0];
  onBuy: (pkg: typeof GOLD_PACKAGES[0]) => void;
  buying: boolean;
  boughtId: string | null;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isThisBought = boughtId === pkg.id;

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={() => onBuy(pkg)}
      disabled={buying || !!boughtId}
    >
      <Animated.View style={[styles.pkgCard, pkg.popular && styles.pkgCardPopular, style]}>
        {pkg.popular && !isThisBought && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>EN POPÜLER</Text>
          </View>
        )}
        <LinearGradient colors={isThisBought ? ["#0D2A1A", "#0A2010"] : pkg.gradient} style={styles.pkgCardInner}>
          <View style={styles.pkgLeft}>
            <View style={[styles.goldIconWrap, isThisBought && styles.goldIconWrapSuccess]}>
              <Text style={styles.goldIconText}>{isThisBought ? "✓" : "✦"}</Text>
            </View>
            <View>
              <Text style={[styles.pkgGold, isThisBought && { color: Colors.success }]}>{pkg.gold} Altın</Text>
              <Text style={styles.pkgPerGold}>{isThisBought ? "Eklendi!" : pkg.perGold + "/altın"}</Text>
            </View>
          </View>
          <View style={styles.pkgRight}>
            {isThisBought ? (
              <View style={[styles.pkgBuyBtn, styles.pkgBuyBtnSuccess]}>
                <Text style={[styles.pkgBuyBtnText, { color: "#fff" }]}>Tamamlandı</Text>
              </View>
            ) : buying ? (
              <View style={[styles.pkgBuyBtn, styles.pkgBuyBtnBuying]}>
                <Text style={styles.pkgBuyBtnText}>İşleniyor...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.pkgPrice}>{pkg.price}</Text>
                <View style={styles.pkgBuyBtn}>
                  <Text style={styles.pkgBuyBtnText}>Satın Al</Text>
                </View>
              </>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

export default function PurchaseScreen() {
  const insets = useSafeAreaInsets();
  const { addGold, goldBalance } = useApp();
  const { lang } = useLang();
  const [buying, setBuying] = useState(false);
  const [boughtId, setBoughtId] = useState<string | null>(null);
  const [boughtGold, setBoughtGold] = useState(0);

  const glowOp = useSharedValue(0.2);
  React.useEffect(() => {
    glowOp.value = withRepeat(withTiming(0.5, { duration: 2000 }), -1, true);
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOp.value }));

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleBuy = (pkg: typeof GOLD_PACKAGES[0]) => {
    if (buying || boughtId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBuying(true);
    setTimeout(() => {
      addGold(pkg.gold);
      setBuying(false);
      setBoughtId(pkg.id);
      setBoughtGold(pkg.gold);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        router.back();
      }, 1800);
    }, 1000);
  };

  const costEntries = Object.entries(SERVICE_GOLD_COST).sort((a, b) => a[1] - b[1]);
  const byCost: Record<number, string[]> = {};
  costEntries.forEach(([svc, cost]) => {
    if (!byCost[cost]) byCost[cost] = [];
    byCost[cost].push(svc);
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#08051A", "#070D1A", "#0D0820"]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.glow, glowStyle]} />

      <ScrollView contentContainerStyle={[styles.inner, { paddingTop: topPad + 12, paddingBottom: botPad + 24 }]} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </Pressable>

        {boughtId ? (
          <Animated.View entering={ZoomIn.springify()} style={styles.successBanner}>
            <LinearGradient colors={["#0D2A1A", "#0A2010"]} style={styles.successBannerInner}>
              <Text style={styles.successIcon}>✦</Text>
              <Text style={styles.successTitle}>
                {lang === "tr" ? `${boughtGold} Altın Eklendi!` : `${boughtGold} Gold Added!`}
              </Text>
              <Text style={styles.successSub}>
                {lang === "tr" ? "Mistik yolculuğunuz devam ediyor..." : "Your mystical journey continues..."}
              </Text>
            </LinearGradient>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
            <Text style={styles.headerSub}>✦ TENGRI ✦</Text>
            <Text style={styles.headerTitle}>
              {lang === "tr" ? "Altın Satın Al" : "Buy Gold"}
            </Text>
            <Text style={styles.headerDesc}>
              {lang === "tr"
                ? "Mistik okumalar için altın kullanın. Her hizmetin kendine özel fiyatı var."
                : "Use gold for mystic readings. Each service has its own price."}
            </Text>
          </Animated.View>
        )}

        <Animated.View entering={ZoomIn.delay(100).springify()} style={styles.balanceCard}>
          <LinearGradient colors={["#141420", "#0D1526"]} style={styles.balanceCardInner}>
            <Text style={styles.balanceIcon}>✦</Text>
            <View>
              <Text style={styles.balanceLabel}>{lang === "tr" ? "Mevcut Bakiyeniz" : "Current Balance"}</Text>
              <Text style={styles.balanceValue}>{boughtId ? goldBalance : goldBalance} <Text style={styles.balanceUnit}>{lang === "tr" ? "altın" : "gold"}</Text></Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {lang === "tr" ? "✦ Altın Paketleri" : "✦ Gold Packages"}
          </Text>
          {GOLD_PACKAGES.map((pkg, i) => (
            <Animated.View key={pkg.id} entering={FadeInDown.delay(200 + i * 60).springify()}>
              <GoldPackageCard pkg={pkg} onBuy={handleBuy} buying={buying} boughtId={boughtId} />
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {lang === "tr" ? "✦ Hizmet Fiyatları" : "✦ Service Prices"}
          </Text>
          {Object.entries(byCost).sort((a, b) => Number(a[0]) - Number(b[0])).map(([cost, services]) => (
            <View key={cost} style={styles.costTier}>
              <View style={styles.costTierBadge}>
                <Text style={styles.costTierValue}>{cost} ✦</Text>
              </View>
              <View style={styles.costTierServices}>
                {services.map((svc) => (
                  <View key={svc} style={styles.costPill}>
                    <Text style={styles.costPillText}>{SERVICE_NAMES_TR[svc] ?? svc}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
          <View style={styles.freeTierNote}>
            <Ionicons name="gift-outline" size={14} color={Colors.success} />
            <Text style={styles.freeTierNoteText}>
              {lang === "tr" ? "Başlangıçta ücretsiz altın hediye!" : "Start with free gold!"}
            </Text>
          </View>
        </Animated.View>

        <Text style={styles.legal}>
          {lang === "tr"
            ? "Taahhüt yok • İstediğiniz zaman kullanın\ntengristar.com • Gizlilik Politikası"
            : "No commitment • Use anytime\ntengristar.com • Privacy Policy"}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glow: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.gold, opacity: 0.02, top: "10%", left: "50%", marginLeft: -150 },
  inner: { paddingHorizontal: 18, gap: 16 },

  closeBtn: { alignSelf: "flex-end", width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  successBanner: { borderRadius: 16, borderWidth: 1, borderColor: Colors.success + "40", overflow: "hidden" },
  successBannerInner: { alignItems: "center", padding: 24, gap: 8 },
  successIcon: { fontSize: 40, color: Colors.success },
  successTitle: { fontSize: 22, fontFamily: "Lora_700Bold", color: Colors.success, textAlign: "center" },
  successSub: { fontSize: 13, fontFamily: "Lora_400Regular_Italic", color: Colors.success + "90", textAlign: "center" },

  header: { alignItems: "center", gap: 8, paddingVertical: 8 },
  headerSub: { fontSize: 10, fontFamily: "Lora_400Regular", color: Colors.gold, letterSpacing: 6 },
  headerTitle: { fontSize: 28, fontFamily: "Lora_700Bold", color: Colors.text, textAlign: "center" },
  headerDesc: { fontSize: 13, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },

  balanceCard: { borderRadius: 16, borderWidth: 1, borderColor: Colors.gold + "40", overflow: "hidden" },
  balanceCardInner: { flexDirection: "row", alignItems: "center", padding: 18, gap: 16 },
  balanceIcon: { fontSize: 36, color: Colors.gold },
  balanceLabel: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary },
  balanceValue: { fontSize: 26, fontFamily: "Lora_700Bold", color: Colors.gold },
  balanceUnit: { fontSize: 14, fontFamily: "Lora_400Regular", color: Colors.gold + "90" },

  section: { gap: 12 },
  sectionTitle: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.textSecondary, letterSpacing: 1 },

  pkgCard: { borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, overflow: "hidden", marginBottom: 2 },
  pkgCardPopular: { borderColor: Colors.gold + "60", borderWidth: 2 },
  pkgCardInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  popularBadge: { position: "absolute", top: -1, right: 16, backgroundColor: Colors.gold, paddingHorizontal: 10, paddingVertical: 3, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, zIndex: 1 },
  popularBadgeText: { fontSize: 9, fontFamily: "Lora_700Bold", color: Colors.background, letterSpacing: 1 },
  pkgLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  goldIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gold + "20", borderWidth: 1, borderColor: Colors.gold + "40", alignItems: "center", justifyContent: "center" },
  goldIconWrapSuccess: { backgroundColor: Colors.success + "20", borderColor: Colors.success + "40" },
  goldIconText: { fontSize: 20, color: Colors.gold },
  pkgGold: { fontSize: 17, fontFamily: "Lora_700Bold", color: Colors.text },
  pkgPerGold: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary },
  pkgRight: { alignItems: "flex-end", gap: 8 },
  pkgPrice: { fontSize: 18, fontFamily: "Lora_700Bold", color: Colors.gold },
  pkgBuyBtn: { backgroundColor: Colors.gold, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  pkgBuyBtnBuying: { backgroundColor: Colors.textDim },
  pkgBuyBtnSuccess: { backgroundColor: Colors.success },
  pkgBuyBtnText: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.background },

  costTier: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  costTierBadge: { backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 10, paddingVertical: 6, minWidth: 52, alignItems: "center" },
  costTierValue: { fontSize: 13, fontFamily: "Lora_700Bold", color: Colors.text },
  costTierServices: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  costPill: { backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 10, paddingVertical: 5 },
  costPillText: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary },
  freeTierNote: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 4 },
  freeTierNoteText: { fontSize: 12, fontFamily: "Lora_400Regular_Italic", color: Colors.success },

  legal: { fontSize: 10, fontFamily: "Lora_400Regular", color: Colors.textDim, textAlign: "center", lineHeight: 16 },
});
