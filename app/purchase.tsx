import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
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

function GoldPackageCard({ pkg, onBuy, buying }: {
  pkg: typeof GOLD_PACKAGES[0];
  onBuy: (pkg: typeof GOLD_PACKAGES[0]) => void;
  buying: boolean;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={() => onBuy(pkg)}
      disabled={buying}
    >
      <Animated.View style={[styles.pkgCard, pkg.popular && styles.pkgCardPopular, style]}>
        {pkg.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>EN POPÜLER</Text>
          </View>
        )}
        <LinearGradient colors={pkg.gradient} style={styles.pkgCardInner}>
          <View style={styles.pkgLeft}>
            <View style={styles.goldIconWrap}>
              <Text style={styles.goldIconText}>✦</Text>
            </View>
            <View>
              <Text style={styles.pkgGold}>{pkg.gold} Altın</Text>
              <Text style={styles.pkgPerGold}>{pkg.perGold}/altın</Text>
            </View>
          </View>
          <View style={styles.pkgRight}>
            <Text style={styles.pkgPrice}>{pkg.price}</Text>
            <View style={styles.pkgBuyBtn}>
              <Text style={styles.pkgBuyBtnText}>Satın Al</Text>
            </View>
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

  const glowOp = useSharedValue(0.2);
  React.useEffect(() => {
    glowOp.value = withRepeat(withTiming(0.5, { duration: 2000 }), -1, true);
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOp.value }));

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleBuy = (pkg: typeof GOLD_PACKAGES[0]) => {
    if (buying) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      lang === "tr" ? "Altın Satın Al" : "Buy Gold",
      lang === "tr"
        ? `${pkg.gold} altın için ${pkg.price} ödeyeceksiniz.\n\nDevam etmek istiyor musunuz?`
        : `You'll pay ${pkg.price} for ${pkg.gold} gold.\n\nContinue?`,
      [
        { text: lang === "tr" ? "İptal" : "Cancel", style: "cancel" },
        {
          text: lang === "tr" ? "Satın Al" : "Purchase",
          onPress: () => {
            setBuying(true);
            setTimeout(() => {
              addGold(pkg.gold);
              setBuying(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                lang === "tr" ? "Tebrikler! 🎉" : "Congratulations! 🎉",
                lang === "tr"
                  ? `${pkg.gold} altın hesabınıza eklendi! Toplam bakiyeniz: ${goldBalance + pkg.gold} altın.`
                  : `${pkg.gold} gold added! New balance: ${goldBalance + pkg.gold} gold.`
              );
              router.back();
            }, 800);
          },
        },
      ]
    );
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

        {/* Current balance */}
        <Animated.View entering={ZoomIn.delay(100).springify()} style={styles.balanceCard}>
          <LinearGradient colors={["#141420", "#0D1526"]} style={styles.balanceCardInner}>
            <Text style={styles.balanceIcon}>✦</Text>
            <View>
              <Text style={styles.balanceLabel}>{lang === "tr" ? "Mevcut Bakiyeniz" : "Current Balance"}</Text>
              <Text style={styles.balanceValue}>{goldBalance} <Text style={styles.balanceUnit}>{lang === "tr" ? "altın" : "gold"}</Text></Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Packages */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {lang === "tr" ? "✦ Altın Paketleri" : "✦ Gold Packages"}
          </Text>
          {GOLD_PACKAGES.map((pkg, i) => (
            <Animated.View key={pkg.id} entering={FadeInDown.delay(200 + i * 60).springify()}>
              <GoldPackageCard pkg={pkg} onBuy={handleBuy} buying={buying} />
            </Animated.View>
          ))}
        </Animated.View>

        {/* Service Price Guide */}
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
              {lang === "tr" ? "Başlangıçta 5 ücretsiz altın hediye!" : "Start with 5 free gold!"}
            </Text>
          </View>
        </Animated.View>

        {/* Legal */}
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
  goldIconText: { fontSize: 20, color: Colors.gold },
  pkgGold: { fontSize: 17, fontFamily: "Lora_700Bold", color: Colors.text },
  pkgPerGold: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary },
  pkgRight: { alignItems: "flex-end", gap: 8 },
  pkgPrice: { fontSize: 18, fontFamily: "Lora_700Bold", color: Colors.gold },
  pkgBuyBtn: { backgroundColor: Colors.gold, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
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
