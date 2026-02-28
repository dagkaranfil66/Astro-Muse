import React from "react";
import {
  View,
  Text,
  StyleSheet,
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
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const FEATURES = [
  { icon: "sparkles" as const, text: "30 mistik okuma hakkı" },
  { icon: "moon-outline" as const, text: "Türk Astrolojisi yorumları" },
  { icon: "cafe-outline" as const, text: "Kahve & El Falı" },
  { icon: "layers-outline" as const, text: "Tarot & Numeroloji" },
  { icon: "leaf-outline" as const, text: "Şamanizm Rehberliği" },
  { icon: "eye-outline" as const, text: "Ruh Okuma" },
];

export default function PurchaseScreen() {
  const insets = useSafeAreaInsets();
  const { purchase } = useApp();

  const glowOp = useSharedValue(0.5);
  const btnScale = useSharedValue(1);

  React.useEffect(() => {
    glowOp.value = withRepeat(withTiming(1, { duration: 1800 }), -1, true);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOp.value }));
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handlePurchase = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    btnScale.value = withSpring(0.95, {}, () => {
      btnScale.value = withSpring(1);
    });

    Alert.alert(
      "Satın Al",
      "30 okuma paketi 149,99 TL\n\nDevam etmek istiyor musunuz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Satın Al",
          onPress: () => {
            purchase();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0F1A10", "#070D1A", "#0D0820"]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />

      <Animated.View style={[styles.glow, glowStyle]} />

      <View style={[styles.inner, { paddingTop: topPad + 20, paddingBottom: botPad + 24 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </Pressable>

        <Animated.View entering={FadeIn.duration(600)} style={styles.badge}>
          <Ionicons name="diamond-outline" size={12} color={Colors.gold} />
          <Text style={styles.badgeText}>TENGRİ MİSTİK PAKETI</Text>
          <Ionicons name="diamond-outline" size={12} color={Colors.gold} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.iconBig}>
          <LinearGradient
            colors={["#1A1205", "#0D1526"]}
            style={styles.iconBigGrad}
          >
            <Ionicons name="moon" size={52} color={Colors.gold} />
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.titleBlock}>
          <Text style={styles.title}>Mistik Yolculuğa{"\n"}Devam Edin</Text>
          <Text style={styles.subtitle}>
            30 okuma hakkı ile tüm hizmetlerimize sınırsız erişim
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(300 + i * 60).springify()}
              style={styles.featureRow}
            >
              <View style={styles.featureCheck}>
                <Ionicons name="checkmark" size={14} color={Colors.gold} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          style={styles.priceBlock}
        >
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>30 Okuma Paketi</Text>
            <Text style={styles.price}>149,99 TL</Text>
          </View>
          <Text style={styles.priceNote}>Tek seferlik ödeme • Süresi dolmaz</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(700).springify()}
          style={[styles.btnWrap, btnStyle]}
        >
          <Pressable
            onPressIn={() => { btnScale.value = withSpring(0.97); }}
            onPressOut={() => { btnScale.value = withSpring(1); }}
            onPress={handlePurchase}
            style={styles.buyBtnOuter}
          >
            <LinearGradient
              colors={[Colors.goldLight, Colors.gold, Colors.accent]}
              style={styles.buyBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="sparkles" size={18} color={Colors.background} />
              <Text style={styles.buyBtnText}>Satın Al — 149,99 TL</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(800)}
          style={styles.legalNote}
        >
          Güvenli ödeme • İptal gerektirmez
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  glow: {
    position: "absolute",
    top: "20%",
    left: "50%",
    marginLeft: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.gold,
    opacity: 0.05,
    transform: [{ scaleX: 2 }],
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  closeBtn: {
    alignSelf: "flex-end",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "CinzelDecorative_400Regular",
    color: Colors.gold,
    letterSpacing: 2,
  },
  iconBig: {
    marginBottom: 24,
  },
  iconBigGrad: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  titleBlock: {
    alignItems: "center",
    marginBottom: 28,
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontFamily: "CinzelDecorative_700Bold",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 38,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  featureList: {
    width: "100%",
    gap: 10,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gold + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    color: Colors.text,
  },
  priceBlock: {
    width: "100%",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
    gap: 4,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    color: Colors.textSecondary,
  },
  price: {
    fontSize: 22,
    fontFamily: "CinzelDecorative_700Bold",
    color: Colors.gold,
  },
  priceNote: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
  },
  btnWrap: {
    width: "100%",
    marginBottom: 12,
  },
  buyBtnOuter: {
    borderRadius: 14,
    overflow: "hidden",
  },
  buyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    gap: 10,
  },
  buyBtnText: {
    fontSize: 16,
    fontFamily: "CinzelDecorative_700Bold",
    color: Colors.background,
    letterSpacing: 0.5,
  },
  legalNote: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
    textAlign: "center",
  },
});
