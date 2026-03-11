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
import { SERVICE_GOLD_COST, FREE_START_GOLD } from "@/constants/serviceConfig";
import { useSubscription, PACKAGE_GOLD_MAP } from "@/lib/revenuecat";
import type { PurchasesPackage } from "react-native-purchases";

const SERVICE_NAMES_TR: Record<string, string> = {
  samanizm: "Şamanizm", burclar: "Burçlar", ruh: "Ruh Okuma",
  astroloji: "Astroloji", kahve: "Kahve Falı", el: "El Falı",
  numeroloji: "Numeroloji", ruya: "Rüya Yorumu", ask: "Aşkını Bul",
  tarot: "Tarot", dogum: "Doğum Haritası",
};

// RC package display data
const PKG_DISPLAY: Record<string, {
  gradient: [string, string];
  popular: boolean;
  advantage: boolean;
  gold: number;
  bonus: number;
  label: string;
  discount: number;
  desc: string;
  descEn: string;
}> = {
  tengri_starter:  { gradient: ["#1A1A30", "#0D1526"], popular: false, advantage: false, gold: 20,  bonus: 0, label: "Başlangıç Paketi", discount: 0,  desc: "", descEn: "" },
  tengri_premium:  { gradient: ["#1A1030", "#0D1526"], popular: true,  advantage: false, gold: 50,  bonus: 0, label: "Popüler Paket",    discount: 27, desc: "", descEn: "" },
  tengri_standard: { gradient: ["#1A0A20", "#0D1526"], popular: false, advantage: false, gold: 120, bonus: 0, label: "Büyük Paket",      discount: 43, desc: "", descEn: "" },
  tengri_vip:      { gradient: ["#1A0805", "#0D1526"], popular: false, advantage: true,  gold: 300, bonus: 0, label: "Mega Paket",       discount: 56, desc: "", descEn: "" },
};

// ─── Auth Gate (not logged in) ─────────────────────────────────────────────
function AuthGate({ lang, goldBalance }: { lang: string; goldBalance: number }) {
  const { canSpin } = useApp();
  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} style={ag.wrap}>
      <LinearGradient colors={["#0F0B20", "#0A0D18"]} style={ag.inner}>
        <View style={ag.giftRow}>
          <Text style={ag.giftIcon}>✦</Text>
          <View>
            <Text style={ag.giftTitle}>
              {lang === "tr" ? "Hoş Geldiniz Hediyesi" : "Welcome Gift"}
            </Text>
            <Text style={ag.giftSub}>
              {lang === "tr"
                ? `${FREE_START_GOLD} ücretsiz altın hesabınızda`
                : `${FREE_START_GOLD} free gold in your account`}
            </Text>
          </View>
        </View>

        <View style={ag.divider} />

        <Text style={ag.lockTitle}>
          {lang === "tr" ? "Altın Satın Almak İçin Giriş Yapın" : "Log in to Buy Gold"}
        </Text>
        <Text style={ag.lockDesc}>
          {lang === "tr"
            ? "Pakete erişmek için ücretsiz hesabınızla giriş yapın."
            : "Sign in with your free account to access packages."}
        </Text>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/auth");
          }}
          style={({ pressed }) => [ag.loginBtn, pressed && { opacity: 0.85 }]}
        >
          <LinearGradient colors={["#C8A020", "#9B6820"]} style={ag.loginBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="person-outline" size={18} color="#08051A" />
            <Text style={ag.loginBtnText}>
              {lang === "tr" ? "Giriş Yap / Kayıt Ol" : "Login / Register"}
            </Text>
          </LinearGradient>
        </Pressable>

        {canSpin && (
          <>
            <View style={ag.orRow}>
              <View style={ag.orLine} />
              <Text style={ag.orText}>{lang === "tr" ? "ya da" : "or"}</Text>
              <View style={ag.orLine} />
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/spin");
              }}
              style={ag.spinBtn}
            >
              <Ionicons name="refresh-circle-outline" size={20} color={Colors.gold} />
              <Text style={ag.spinBtnText}>
                {lang === "tr" ? "Günlük Çarkı Çevir" : "Spin Daily Wheel"}
              </Text>
            </Pressable>
          </>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

// ─── RC Package Card ──────────────────────────────────────────────────────
function GoldPackageCard({
  rcPkg,
  onBuy,
  buying,
  boughtId,
  lang,
}: {
  rcPkg: PurchasesPackage;
  onBuy: (pkg: PurchasesPackage) => void;
  buying: boolean;
  boughtId: string | null;
  lang: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const display = PKG_DISPLAY[rcPkg.identifier] ?? {
    gradient: ["#1A1A30", "#0D1526"] as [string, string],
    popular: false,
    advantage: false,
    gold: PACKAGE_GOLD_MAP[rcPkg.identifier] ?? 0,
    bonus: 0,
    label: rcPkg.identifier,
    discount: 0,
    desc: "",
    descEn: "",
  };
  const isThisBought = boughtId === rcPkg.identifier;
  const isBuying = buying && boughtId === null;

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={() => onBuy(rcPkg)}
      disabled={buying || !!boughtId}
    >
      <Animated.View style={[styles.pkgCard, display.popular && styles.pkgCardPopular, display.advantage && styles.pkgCardAdvantage, animStyle]}>
        {display.popular && !isThisBought && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>⭐ POPÜLER</Text>
          </View>
        )}
        {display.advantage && !isThisBought && (
          <View style={styles.advantageBadge}>
            <Text style={styles.advantageBadgeText}>✦ AVANTAJLI</Text>
          </View>
        )}
        {display.discount > 0 && !isThisBought && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>%{display.discount} İNDİRİM</Text>
          </View>
        )}
        <LinearGradient colors={isThisBought ? ["#0D2A1A", "#0A2010"] : display.gradient} style={styles.pkgCardInner}>
          <View style={styles.pkgLeft}>
            <View style={[styles.goldIconWrap, isThisBought && styles.goldIconWrapSuccess]}>
              <Text style={styles.goldIconText}>{isThisBought ? "✓" : "✦"}</Text>
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.pkgLabel}>{display.label}</Text>
              {display.bonus > 0 && !isThisBought ? (
                <Text style={[styles.pkgGold, isThisBought && { color: Colors.success }]} numberOfLines={1}>
                  {display.gold} <Text style={styles.pkgGoldUnit}>Altın</Text>
                  <Text style={styles.pkgGoldBonus}> + {display.bonus} Bonus Altın</Text>
                </Text>
              ) : (
                <Text style={[styles.pkgGold, isThisBought && { color: Colors.success }]}>
                  {display.gold} <Text style={styles.pkgGoldUnit}>{isThisBought ? "✓ Eklendi" : "Altın"}</Text>
                </Text>
              )}
            </View>
          </View>
          <View style={styles.pkgRight}>
            {isThisBought ? (
              <View style={[styles.pkgBuyBtn, styles.pkgBuyBtnSuccess]}>
                <Text style={[styles.pkgBuyBtnText, { color: "#fff" }]}>Tamam</Text>
              </View>
            ) : isBuying ? (
              <View style={[styles.pkgBuyBtn, styles.pkgBuyBtnBuying]}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <View>
                <Text style={styles.pkgPrice}>{rcPkg.product.priceString}</Text>
                <View style={styles.pkgBuyBtn}>
                  <Text style={styles.pkgBuyBtnText}>Satın Al</Text>
                </View>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ─── Unavailable Package Card (RC product not loaded — web or loading) ────────
function UnavailablePackageCard({ pkgId, lang }: { pkgId: string; lang: string }) {
  const display = PKG_DISPLAY[pkgId];
  if (!display) return null;
  const isWeb = Platform.OS === "web";
  return (
    <Animated.View style={[styles.pkgCard, display.popular && styles.pkgCardPopular, display.advantage && styles.pkgCardAdvantage]}>
      {display.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>⭐ POPÜLER</Text>
        </View>
      )}
      {display.advantage && (
        <View style={styles.advantageBadge}>
          <Text style={styles.advantageBadgeText}>✦ AVANTAJLI</Text>
        </View>
      )}
      {display.discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountBadgeText}>%{display.discount} İNDİRİM</Text>
        </View>
      )}
      <LinearGradient colors={display.gradient} style={styles.pkgCardInner}>
        <View style={styles.pkgLeft}>
          <View style={styles.goldIconWrap}>
            <Text style={styles.goldIconText}>✦</Text>
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.pkgLabel}>{display.label}</Text>
            {display.bonus > 0 ? (
              <Text style={styles.pkgGold} numberOfLines={1}>
                {display.gold} <Text style={styles.pkgGoldUnit}>Altın</Text>
                <Text style={styles.pkgGoldBonus}> + {display.bonus} Bonus</Text>
              </Text>
            ) : (
              <Text style={styles.pkgGold}>
                {display.gold} <Text style={styles.pkgGoldUnit}>Altın</Text>
              </Text>
            )}
          </View>
        </View>
        <View style={styles.pkgRight}>
          <View style={[styles.pkgBuyBtn, styles.pkgBuyBtnMobile]}>
            <Ionicons name="phone-portrait-outline" size={12} color={Colors.textDim} />
            <Text style={[styles.pkgBuyBtnText, { color: Colors.textDim, fontSize: 9 }]}>
              {isWeb ? (lang === "tr" ? "Mobil" : "Mobile") : (lang === "tr" ? "Yükleniyor" : "Loading")}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function PurchaseScreen() {
  const insets = useSafeAreaInsets();
  const { addGold, goldBalance, userProfile, canSpin } = useApp();
  const { lang } = useLang();
  const { packages, offeringsLoading, offeringsError, purchase, restore, isRestoring, refetchOfferings } = useSubscription();

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

  const isLoggedIn = !!userProfile;

  const ORDER = ["tengri_starter", "tengri_premium", "tengri_standard", "tengri_vip"];
  const sortedRcPkgs = [...packages]
    .filter((p) => ORDER.includes(p.identifier))
    .sort((a, b) => ORDER.indexOf(a.identifier) - ORDER.indexOf(b.identifier));
  const rcPkgMap = Object.fromEntries(sortedRcPkgs.map(p => [p.identifier, p]));

  // Always show all 4 packages after offerings settle.
  // Real RC package → real StoreKit purchase with price shown.
  // Missing package → UnavailablePackageCard (grey / disabled).
  const packagesToShow = ORDER;

  const handleRcBuy = async (rcPkg: PurchasesPackage) => {
    if (!isLoggedIn || buying || boughtId) return;
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

  const handleRestore = async () => {
    if (isRestoring) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await restore();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // silent — RC shows its own errors
    }
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

      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: topPad + 12, paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </Pressable>

        {/* Success Banner */}
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
                ? "Mistik okumalar için altın kullanın. Paket büyüdükçe tasarruf artar."
                : "Use gold for mystic readings. Bigger packages save more."}
            </Text>
          </Animated.View>
        )}

        {/* Balance Card */}
        <Animated.View entering={ZoomIn.delay(100).springify()} style={styles.balanceCard}>
          <LinearGradient colors={["#141420", "#0D1526"]} style={styles.balanceCardInner}>
            <Text style={styles.balanceIcon}>✦</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.balanceLabel}>
                {isLoggedIn ? (lang === "tr" ? "Mevcut Bakiyeniz" : "Current Balance") : (lang === "tr" ? "Hoş Geldiniz Hediyesi" : "Welcome Gift")}
              </Text>
              <Text style={styles.balanceValue}>
                {goldBalance} <Text style={styles.balanceUnit}>{lang === "tr" ? "altın" : "gold"}</Text>
              </Text>
            </View>
            {!isLoggedIn && canSpin && (
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/spin"); }}
                style={styles.spinChip}
              >
                <Ionicons name="refresh-circle-outline" size={16} color={Colors.gold} />
                <Text style={styles.spinChipText}>{lang === "tr" ? "Çark" : "Spin"}</Text>
              </Pressable>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Auth Gate OR Packages */}
        {!isLoggedIn ? (
          <AuthGate lang={lang} goldBalance={goldBalance} />
        ) : (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {lang === "tr" ? "✦ Altın Paketleri" : "✦ Gold Packages"}
            </Text>
            <Text style={styles.sectionPricingNote}>
              {lang === "tr" ? "Büyük paket, daha fazla tasarruf!" : "Bigger package, more savings!"}
            </Text>

            {Platform.OS === "web" && packages.length === 0 && !offeringsLoading && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.webNoticeBanner}>
                <Ionicons name="phone-portrait-outline" size={16} color={Colors.gold} />
                <Text style={styles.webNoticeText}>
                  {lang === "tr"
                    ? "Satın alma yalnızca mobil uygulamada çalışır. Expo Go ile telefonunuzda deneyin."
                    : "Purchases only work in the mobile app. Try on your phone with Expo Go."}
                </Text>
              </Animated.View>
            )}

            {offeringsLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={Colors.gold} />
                <Text style={styles.loadingText}>{lang === "tr" ? "Paketler yükleniyor..." : "Loading packages..."}</Text>
              </View>
            ) : offeringsError ? (
              <Animated.View entering={FadeIn.duration(400)} style={styles.rcErrorWrap}>
                <Ionicons name="cloud-offline-outline" size={32} color={Colors.textDim} />
                <Text style={styles.rcErrorTitle}>
                  {lang === "tr" ? "Paketler yüklenemedi" : "Packages unavailable"}
                </Text>
                <Text style={styles.rcErrorDesc}>
                  {lang === "tr"
                    ? "İnternet bağlantınızı kontrol edip tekrar deneyin."
                    : "Check your internet connection and try again."}
                </Text>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); refetchOfferings(); }}
                  style={styles.retryBtn}
                >
                  <Ionicons name="refresh-outline" size={16} color={Colors.gold} />
                  <Text style={styles.retryBtnText}>{lang === "tr" ? "Tekrar Dene" : "Try Again"}</Text>
                </Pressable>
              </Animated.View>
            ) : (
              packagesToShow.map((pkgId, i) => {
                const rcPkg = rcPkgMap[pkgId];
                return (
                  <Animated.View key={pkgId} entering={FadeInDown.delay(200 + i * 60).springify()}>
                    {rcPkg ? (
                      <GoldPackageCard rcPkg={rcPkg} onBuy={handleRcBuy} buying={buying} boughtId={boughtId} lang={lang} />
                    ) : (
                      <UnavailablePackageCard pkgId={pkgId} lang={lang} />
                    )}
                  </Animated.View>
                );
              })
            )}

            {!!purchaseError && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
                <Text style={styles.errorText}>{purchaseError}</Text>
              </Animated.View>
            )}

            {/* Spin Redirect for logged-in users */}
            {canSpin && (
              <Animated.View entering={FadeInDown.delay(500).springify()}>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/spin"); }}
                  style={styles.spinCard}
                >
                  <LinearGradient colors={["#1A1030", "#0D1526"]} style={styles.spinCardInner}>
                    <Ionicons name="refresh-circle-outline" size={28} color={Colors.gold} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.spinCardTitle}>
                        {lang === "tr" ? "Bugün Çark Çevirin!" : "Spin Today's Wheel!"}
                      </Text>
                      <Text style={styles.spinCardSub}>
                        {lang === "tr" ? "Ücretsiz altın kazanın — her gün bir kez" : "Win free gold — once per day"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Service Prices */}
        <Animated.View entering={FadeInDown.delay(isLoggedIn ? 500 : 200).springify()} style={styles.section}>
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
              {lang === "tr" ? `Başlangıçta ${FREE_START_GOLD} ücretsiz altın hediye!` : `Start with ${FREE_START_GOLD} free gold!`}
            </Text>
          </View>
        </Animated.View>

        {isLoggedIn && (
          <Pressable
            onPress={handleRestore}
            disabled={isRestoring}
            style={({ pressed }) => [styles.restoreBtn, pressed && { opacity: 0.7 }]}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={Colors.textDim} />
            ) : (
              <Text style={styles.restoreBtnText}>
                {lang === "tr" ? "Satın Almaları Geri Yükle" : "Restore Purchases"}
              </Text>
            )}
          </Pressable>
        )}

        <Pressable
          onPress={() => router.push("/guide" as any)}
          style={styles.guideBtn}
          hitSlop={8}
        >
          <Ionicons name="book-outline" size={14} color={Colors.gold} />
          <Text style={styles.guideBtnText}>
            {lang === "tr" ? "İlk Üyeler Kılavuzu" : "First Members Guide"}
          </Text>
          <Ionicons name="chevron-forward" size={12} color={Colors.gold + "80"} />
        </Pressable>

        <View style={styles.legalRow}>
          <Text style={styles.legal}>
            {lang === "tr"
              ? "Taahhüt yok • İstediğiniz zaman kullanın"
              : "No commitment • Use anytime"}
          </Text>
          <Pressable
            onPress={() => router.push("/legal?doc=privacy" as any)}
            hitSlop={8}
          >
            <Text style={styles.legalLink}>
              {lang === "tr" ? "Gizlilik Politikası" : "Privacy Policy"}
            </Text>
          </Pressable>
          <Text style={styles.legal}> • </Text>
          <Pressable
            onPress={() => router.push("/legal?doc=terms" as any)}
            hitSlop={8}
          >
            <Text style={styles.legalLink}>
              {lang === "tr" ? "Kullanım Koşulları" : "Terms of Use"}
            </Text>
          </Pressable>
        </View>
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
  spinChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.gold + "15", borderRadius: 10, borderWidth: 1, borderColor: Colors.gold + "30", paddingHorizontal: 10, paddingVertical: 6 },
  spinChipText: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.gold },

  section: { gap: 12 },
  sectionTitle: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.textSecondary, letterSpacing: 1 },
  sectionPricingNote: { fontSize: 11, fontFamily: "Lora_400Regular_Italic", color: Colors.textDim, marginTop: -6 },

  loadingWrap: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 24, justifyContent: "center" },
  loadingText: { fontSize: 13, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary },

  pkgCard: { borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, overflow: "hidden", marginBottom: 2 },
  pkgCardPopular: { borderColor: Colors.gold + "60", borderWidth: 2 },
  pkgCardAdvantage: { borderColor: "#C084FC" + "60", borderWidth: 2 },
  pkgCardInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 20 },
  popularBadge: { position: "absolute", top: 0, left: 12, backgroundColor: Colors.gold, paddingHorizontal: 10, paddingVertical: 3, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, zIndex: 2 },
  popularBadgeText: { fontSize: 9, fontFamily: "Lora_700Bold", color: Colors.background, letterSpacing: 1 },
  advantageBadge: { position: "absolute", top: 0, left: 12, backgroundColor: "#9333EA", paddingHorizontal: 10, paddingVertical: 3, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, zIndex: 2 },
  advantageBadgeText: { fontSize: 9, fontFamily: "Lora_700Bold", color: "#fff", letterSpacing: 1 },
  discountBadge: { position: "absolute", top: 0, right: 12, backgroundColor: Colors.success, paddingHorizontal: 8, paddingVertical: 3, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, zIndex: 2 },
  discountBadgeText: { fontSize: 9, fontFamily: "Lora_700Bold", color: "#fff", letterSpacing: 0.5 },
  pkgLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  goldIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gold + "20", borderWidth: 1, borderColor: Colors.gold + "40", alignItems: "center", justifyContent: "center" },
  goldIconWrapSuccess: { backgroundColor: Colors.success + "20", borderColor: Colors.success + "40" },
  goldIconText: { fontSize: 20, color: Colors.gold },
  pkgLabel: { fontSize: 11, fontFamily: "Lora_700Bold", color: Colors.textDim, letterSpacing: 0.5, marginBottom: 2 },
  pkgGold: { fontSize: 18, fontFamily: "Lora_700Bold", color: Colors.text },
  pkgGoldUnit: { fontSize: 13, fontFamily: "Lora_400Regular", color: Colors.textSecondary },
  pkgGoldBonus: { fontSize: 12, fontFamily: "Lora_400Regular", color: Colors.gold },
  pkgPerGold: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary, marginTop: 1 },
  pkgDesc: { fontSize: 11, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, marginTop: 2 },
  bonusBadge: { backgroundColor: "#C8A02022", borderWidth: 1, borderColor: "#C8A02055", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  bonusBadgeText: { fontSize: 9, fontFamily: "Lora_700Bold", color: Colors.gold, letterSpacing: 0.3 },
  pkgRight: { alignItems: "flex-end", gap: 6 },
  pkgPrice: { fontSize: 18, fontFamily: "Lora_700Bold", color: Colors.gold, textAlign: "right" },
  pkgBuyBtn: { backgroundColor: Colors.gold, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, minWidth: 88, alignItems: "center" },
  pkgBuyBtnBuying: { backgroundColor: Colors.textDim },
  pkgBuyBtnSuccess: { backgroundColor: Colors.success },
  pkgBuyBtnText: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.background },

  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#FF6B6B15", borderRadius: 10, borderWidth: 1, borderColor: "#FF6B6B30" },
  errorText: { fontSize: 13, fontFamily: "Lora_400Regular", color: "#FF6B6B", flex: 1 },

  spinCard: { borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: Colors.gold + "30" },
  spinCardInner: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  spinCardTitle: { fontSize: 14, fontFamily: "Lora_700Bold", color: Colors.text },
  spinCardSub: { fontSize: 12, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, marginTop: 2 },

  costTier: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  costTierBadge: { backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 10, paddingVertical: 6, minWidth: 52, alignItems: "center" },
  costTierValue: { fontSize: 13, fontFamily: "Lora_700Bold", color: Colors.text },
  costTierServices: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  costPill: { backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 10, paddingVertical: 5 },
  costPillText: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary },
  freeTierNote: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 4 },
  freeTierNoteText: { fontSize: 12, fontFamily: "Lora_400Regular_Italic", color: Colors.success },

  rcErrorWrap: { alignItems: "center", gap: 10, paddingVertical: 28, paddingHorizontal: 24, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.surface + "80" },
  rcErrorTitle: { fontSize: 15, fontFamily: "Lora_700Bold", color: Colors.textSecondary, textAlign: "center" },
  rcErrorDesc: { fontSize: 12, fontFamily: "Lora_400Regular_Italic", color: Colors.textDim, textAlign: "center", lineHeight: 18 },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: Colors.gold + "60", backgroundColor: Colors.gold + "15" },
  retryBtnText: { fontSize: 13, fontFamily: "Lora_700Bold", color: Colors.gold },

  restoreBtn: { alignSelf: "center", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: Colors.textDim + "40", minHeight: 36, alignItems: "center", justifyContent: "center" },
  restoreBtnText: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textDim, textDecorationLine: "underline" },

  webNoticeBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: Colors.gold + "10", borderWidth: 1, borderColor: Colors.gold + "30", borderRadius: 12, padding: 12, marginBottom: 4 },
  webNoticeText: { flex: 1, fontSize: 12, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, lineHeight: 18 },
  pkgBuyBtnMobile: { flexDirection: "row", gap: 4, alignItems: "center", backgroundColor: Colors.cardBorder },
  guideBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: Colors.gold + "30", backgroundColor: Colors.gold + "08" },
  guideBtnText: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.gold, letterSpacing: 0.5 },
  legalRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 2 },
  legal: { fontSize: 10, fontFamily: "Lora_400Regular", color: Colors.textDim, textAlign: "center", lineHeight: 16 },
  legalLink: { fontSize: 10, fontFamily: "Lora_400Regular", color: Colors.gold + "90", textAlign: "center", lineHeight: 16, textDecorationLine: "underline" },
});

const ag = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.gold + "30" },
  inner: { padding: 22, gap: 14 },
  giftRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  giftIcon: { fontSize: 38, color: Colors.gold },
  giftTitle: { fontSize: 15, fontFamily: "Lora_700Bold", color: Colors.gold },
  giftSub: { fontSize: 12, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, marginTop: 2 },
  divider: { borderTopWidth: 1, borderColor: Colors.cardBorder },
  lockTitle: { fontSize: 16, fontFamily: "Lora_700Bold", color: Colors.text },
  lockDesc: { fontSize: 13, fontFamily: "Lora_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  loginBtn: { borderRadius: 14, overflow: "hidden" },
  loginBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, paddingHorizontal: 24 },
  loginBtnText: { fontSize: 15, fontFamily: "Lora_700Bold", color: "#08051A" },
  orRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  orLine: { flex: 1, borderTopWidth: 1, borderColor: Colors.cardBorder },
  orText: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textDim },
  spinBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.gold + "30", backgroundColor: Colors.gold + "08" },
  spinBtnText: { fontSize: 14, fontFamily: "Lora_700Bold", color: Colors.gold },
});
