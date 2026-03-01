import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
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
import { useSubscription, PACKAGE_GOLD_MAP } from "@/lib/revenuecat";
import type { PurchasesPackage } from "react-native-purchases";

const SERVICE_NAMES_TR: Record<string, string> = {
  samanizm: "Şamanizm", burclar: "Burçlar", ruh: "Ruh Okuma",
  astroloji: "Astroloji", kahve: "Kahve Falı", el: "El Falı",
  numeroloji: "Numeroloji", ruya: "Rüya Yorumu", ask: "Aşkını Bul",
  tarot: "Tarot", dogum: "Doğum Haritası",
};

// Local display data keyed by package identifier
const PKG_DISPLAY: Record<string, { gradient: [string, string]; popular: boolean; gold: number; id: string }> = {
  tengri_starter:  { gradient: ["#1A1A30", "#0D1526"], popular: false, gold: 15,  id: "starter"  },
  tengri_standard: { gradient: ["#1A1030", "#0D1526"], popular: true,  gold: 40,  id: "standard" },
  tengri_premium:  { gradient: ["#1A0A20", "#0D1526"], popular: false, gold: 80,  id: "premium"  },
  tengri_vip:      { gradient: ["#1A0805", "#0D1526"], popular: false, gold: 150, id: "vip"      },
};

function GoldPackageCard({
  rcPkg,
  onBuy,
  buying,
  boughtId,
}: {
  rcPkg: PurchasesPackage;
  onBuy: (pkg: PurchasesPackage) => void;
  buying: boolean;
  boughtId: string | null;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const display = PKG_DISPLAY[rcPkg.identifier] ?? {
    gradient: ["#1A1A30", "#0D1526"] as [string, string],
    popular: false,
    gold: PACKAGE_GOLD_MAP[rcPkg.identifier] ?? 0,
    id: rcPkg.identifier,
  };
  const gold = display.gold;
  const isThisBought = boughtId === rcPkg.identifier;
  const isBuying = buying && boughtId === null;

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={() => onBuy(rcPkg)}
      disabled={buying || !!boughtId}
    >
      <Animated.View style={[styles.pkgCard, display.popular && styles.pkgCardPopular, animStyle]}>
        {display.popular && !isThisBought && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>EN POPÜLER</Text>
          </View>
        )}
        <LinearGradient colors={isThisBought ? ["#0D2A1A", "#0A2010"] : display.gradient} style={styles.pkgCardInner}>
          <View style={styles.pkgLeft}>
            <View style={[styles.goldIconWrap, isThisBought && styles.goldIconWrapSuccess]}>
              <Text style={styles.goldIconText}>{isThisBought ? "✓" : "✦"}</Text>
            </View>
            <View>
              <Text style={[styles.pkgGold, isThisBought && { color: Colors.success }]}>{gold} Altın</Text>
              <Text style={styles.pkgPerGold}>
                {isThisBought ? "Eklendi!" : rcPkg.product.priceString + "/paket"}
              </Text>
            </View>
          </View>
          <View style={styles.pkgRight}>
            {isThisBought ? (
              <View style={[styles.pkgBuyBtn, styles.pkgBuyBtnSuccess]}>
                <Text style={[styles.pkgBuyBtnText, { color: "#fff" }]}>Tamamlandı</Text>
              </View>
            ) : isBuying ? (
              <View style={[styles.pkgBuyBtn, styles.pkgBuyBtnBuying]}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <>
                <Text style={styles.pkgPrice}>{rcPkg.product.priceString}</Text>
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

function FallbackPackageCard({
  pkg,
  onBuy,
  buying,
  boughtId,
}: {
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
                <ActivityIndicator size="small" color="#fff" />
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
  const { packages, isLoading: rcLoading, purchase, isPurchasing } = useSubscription();

  const [buying, setBuying] = useState(false);
  const [boughtId, setBoughtId] = useState<string | null>(null);
  const [boughtGold, setBoughtGold] = useState(0);
  const [purchaseError, setPurchaseError] = useState("");

  const glowOp = useSharedValue(0.2);
  React.useEffect(() => {
    glowOp.value = withRepeat(withTiming(0.5, { duration: 2000 }), -1, true);
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOp.value }));

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleRcBuy = async (rcPkg: PurchasesPackage) => {
    if (buying || boughtId) return;
    setPurchaseError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBuying(true);
    try {
      await purchase(rcPkg);
      const gold = PACKAGE_GOLD_MAP[rcPkg.identifier] ?? 0;
      addGold(gold);
      setBoughtId(rcPkg.identifier);
      setBoughtGold(gold);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => router.back(), 1800);
    } catch (e: any) {
      if (!e?.userCancelled) {
        setPurchaseError(lang === "tr" ? "Satın alma başarısız oldu" : "Purchase failed");
      }
    } finally {
      setBuying(false);
    }
  };

  const handleFallbackBuy = (pkg: typeof GOLD_PACKAGES[0]) => {
    if (buying || boughtId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBuying(true);
    setTimeout(() => {
      addGold(pkg.gold);
      setBuying(false);
      setBoughtId(pkg.id);
      setBoughtGold(pkg.gold);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => router.back(), 1800);
    }, 1000);
  };

  const costEntries = Object.entries(SERVICE_GOLD_COST).sort((a, b) => a[1] - b[1]);
  const byCost: Record<number, string[]> = {};
  costEntries.forEach(([svc, cost]) => {
    if (!byCost[cost]) byCost[cost] = [];
    byCost[cost].push(svc);
  });

  // Sort RC packages in our preferred order
  const ORDER = ["tengri_starter", "tengri_standard", "tengri_premium", "tengri_vip"];
  const sortedRcPkgs = [...packages].sort(
    (a, b) => ORDER.indexOf(a.identifier) - ORDER.indexOf(b.identifier)
  );

  const useRc = !rcLoading && sortedRcPkgs.length > 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#08051A", "#070D1A", "#0D0820"]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.glow, glowStyle]} />

      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: topPad + 12, paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
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
              <Text style={styles.balanceValue}>
                {goldBalance} <Text style={styles.balanceUnit}>{lang === "tr" ? "altın" : "gold"}</Text>
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {lang === "tr" ? "✦ Altın Paketleri" : "✦ Gold Packages"}
          </Text>

          {rcLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Colors.gold} />
              <Text style={styles.loadingText}>{lang === "tr" ? "Paketler yükleniyor..." : "Loading packages..."}</Text>
            </View>
          ) : useRc ? (
            sortedRcPkgs.map((pkg, i) => (
              <Animated.View key={pkg.identifier} entering={FadeInDown.delay(200 + i * 60).springify()}>
                <GoldPackageCard
                  rcPkg={pkg}
                  onBuy={handleRcBuy}
                  buying={buying}
                  boughtId={boughtId}
                />
              </Animated.View>
            ))
          ) : (
            GOLD_PACKAGES.map((pkg, i) => (
              <Animated.View key={pkg.id} entering={FadeInDown.delay(200 + i * 60).springify()}>
                <FallbackPackageCard pkg={pkg} onBuy={handleFallbackBuy} buying={buying} boughtId={boughtId} />
              </Animated.View>
            ))
          )}

          {!!purchaseError && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
              <Text style={styles.errorText}>{purchaseError}</Text>
            </Animated.View>
          )}
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

  loadingWrap: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 24, justifyContent: "center" },
  loadingText: { fontSize: 13, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary },

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
  pkgBuyBtn: { backgroundColor: Colors.gold, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, minWidth: 90, alignItems: "center" },
  pkgBuyBtnBuying: { backgroundColor: Colors.textDim },
  pkgBuyBtnSuccess: { backgroundColor: Colors.success },
  pkgBuyBtnText: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.background },

  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#FF6B6B15", borderRadius: 10, borderWidth: 1, borderColor: "#FF6B6B30" },
  errorText: { fontSize: 13, fontFamily: "Lora_400Regular", color: "#FF6B6B", flex: 1 },

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
