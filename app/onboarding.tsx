import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Image,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolateColor,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");

// ─── Mandala Ring ───────────────────────────────────────────────────────────
function MandalaRing({ radius, dotCount, color, duration, reverse }: {
  radius: number; dotCount: number; color: string; duration: number; reverse?: boolean;
}) {
  const rotate = useSharedValue(0);
  React.useEffect(() => {
    rotate.value = withRepeat(withTiming(reverse ? -360 : 360, { duration, easing: Easing.linear }), -1, false);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  const size = radius * 2 + 6;
  return (
    <Animated.View style={[{ width: size, height: size, position: "absolute", alignItems: "center", justifyContent: "center" }, style]}>
      {Array.from({ length: dotCount }, (_, i) => {
        const angle = (i / dotCount) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <View key={i} style={{
            position: "absolute",
            width: i % 3 === 0 ? 5 : 3, height: i % 3 === 0 ? 5 : 3,
            borderRadius: 3, backgroundColor: color,
            opacity: i % 3 === 0 ? 0.9 : 0.4,
            left: size / 2 + x - 2.5, top: size / 2 + y - 2.5,
          }} />
        );
      })}
    </Animated.View>
  );
}

// ─── Star Ring ───────────────────────────────────────────────────────────────
function StarRing({ radius, count, color, duration, reverse }: {
  radius: number; count: number; color: string; duration: number; reverse?: boolean;
}) {
  const rotate = useSharedValue(0);
  React.useEffect(() => {
    rotate.value = withRepeat(withTiming(reverse ? -360 : 360, { duration, easing: Easing.linear }), -1, false);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  const size = radius * 2 + 24;
  return (
    <Animated.View style={[{ width: size, height: size, position: "absolute", alignItems: "center", justifyContent: "center" }, style]}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const big = i % 3 === 0;
        return (
          <Text key={i} style={{
            position: "absolute", fontSize: big ? 11 : 7, color,
            opacity: big ? 0.95 : 0.45,
            left: size / 2 + x - (big ? 5.5 : 3.5),
            top:  size / 2 + y - (big ? 5.5 : 3.5),
          }}>✦</Text>
        );
      })}
    </Animated.View>
  );
}

// ─── Twinkle Star ────────────────────────────────────────────────────────────
function TwinkleStar({ left, top, sz, delay, dur, color }: {
  left: number; top: number; sz: number; delay: number; dur: number; color?: string;
}) {
  const op = useSharedValue(0.05);
  React.useEffect(() => {
    op.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1,    { duration: dur, easing: Easing.out(Easing.sin) }),
        withTiming(0.05, { duration: dur, easing: Easing.in(Easing.sin) })
      ), -1, false
    ));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    <Animated.Text style={[{ position: "absolute", fontSize: sz, color: color ?? Colors.gold, left, top }, style]}>✦</Animated.Text>
  );
}

// ─── Shooting Star ───────────────────────────────────────────────────────────
const SHOOTING_STARS = Array.from({ length: 8 }, (_, i) => {
  const isGold = i % 3 === 0;
  return {
    startX:   -120 + Math.random() * (width + 80),
    startY:   -30  + Math.random() * (height * 0.72),
    angle:    18   + Math.random() * 22,
    duration: 1400 + Math.random() * 1800,
    delay:    i * 2000 + Math.random() * 3200,
    length:   90 + Math.random() * 100,
    travel:   380 + Math.random() * 200,
    headSize: 2 + Math.random() * 2,
    isGold,
  };
});

function ShootingStar({ cfg }: { cfg: typeof SHOOTING_STARS[0] }) {
  const progress = useSharedValue(0);
  const opacity  = useSharedValue(0);
  React.useEffect(() => {
    const cycle = cfg.duration + cfg.delay + 1200;
    const loop = () => {
      progress.value = 0;
      opacity.value  = 0;
      opacity.value = withDelay(cfg.delay, withSequence(
        withTiming(1,   { duration: 180 }),
        withDelay(cfg.duration - 360, withTiming(0, { duration: 360 }))
      ));
      progress.value = withDelay(cfg.delay, withTiming(1, { duration: cfg.duration, easing: Easing.out(Easing.quad) }));
    };
    loop();
    const id = setInterval(loop, cycle);
    return () => clearInterval(id);
  }, []);
  const rad = (cfg.angle * Math.PI) / 180;
  const dx  = Math.cos(rad) * cfg.travel;
  const dy  = Math.sin(rad) * cfg.travel;
  const trailStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: progress.value * dx }, { translateY: progress.value * dy }],
  }));
  const headStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: progress.value * dx + Math.cos(rad) * cfg.length * 0.82 },
      { translateY: progress.value * dy + Math.sin(rad) * cfg.length * 0.82 },
    ],
  }));
  const headColor = cfg.isGold ? "rgba(255,220,80,1)" : "rgba(255,255,255,1)";
  const tailColor = cfg.isGold
    ? ["rgba(200,160,32,0)", "rgba(220,180,60,0.55)", "rgba(255,220,80,0.95)"] as const
    : ["rgba(30,60,120,0)", "rgba(160,120,240,0.6)", "rgba(255,255,255,0.95)"] as const;
  return (
    <View style={{ position: "absolute", top: cfg.startY, left: cfg.startX }}>
      <Animated.View style={trailStyle}>
        <LinearGradient colors={tailColor} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={{ width: cfg.length, height: 1.8, borderRadius: 2, transform: [{ rotate: `${cfg.angle}deg` }] }} />
      </Animated.View>
      <Animated.View style={[{
        position: "absolute",
        width: cfg.headSize * 2, height: cfg.headSize * 2, borderRadius: cfg.headSize,
        backgroundColor: headColor,
        top: -(cfg.headSize), left: -(cfg.headSize),
      }, headStyle]} />
    </View>
  );
}

// ─── Cosmic Symbols ──────────────────────────────────────────────────────────
const COSMIC_SYMBOLS = [
  { symbol: "☀", x: width * 0.08, y: height * 0.10, size: 16, duration: 22000, delay: 0,    color: "#FFD700" },
  { symbol: "☽", x: width * 0.84, y: height * 0.14, size: 20, duration: 28000, delay: 4000, color: "#C8A0DC" },
  { symbol: "✦", x: width * 0.04, y: height * 0.35, size: 12, duration: 18000, delay: 2000, color: "#5B9BD5" },
  { symbol: "✧", x: width * 0.88, y: height * 0.48, size: 10, duration: 24000, delay: 7000, color: "#FF6B9D" },
  { symbol: "☿", x: width * 0.76, y: height * 0.30, size: 13, duration: 20000, delay: 3000, color: "#5B9BD5" },
  { symbol: "⋆", x: width * 0.52, y: height * 0.05, size: 14, duration: 26000, delay: 9000, color: "#C0932A" },
  { symbol: "☾", x: width * 0.08, y: height * 0.75, size: 18, duration: 25000, delay: 1000, color: "#C8A0DC" },
];

function CosmicSymbol({ cfg }: { cfg: typeof COSMIC_SYMBOLS[0] }) {
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(0);
  React.useEffect(() => {
    opacity.value = withDelay(cfg.delay, withRepeat(withSequence(
      withTiming(0.18, { duration: cfg.duration * 0.4 }),
      withTiming(0.07, { duration: cfg.duration * 0.3 }),
      withTiming(0.22, { duration: cfg.duration * 0.3 }),
    ), -1, true));
    translateY.value = withDelay(cfg.delay, withRepeat(withSequence(
      withTiming(-8, { duration: cfg.duration * 0.5 }),
      withTiming(8,  { duration: cfg.duration * 0.5 }),
    ), -1, true));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
  return (
    <Animated.View style={[{ position: "absolute", left: cfg.x, top: cfg.y }, style]}>
      <Text style={{ fontSize: cfg.size, color: cfg.color }}>{cfg.symbol}</Text>
    </Animated.View>
  );
}

const BG_TWINKLES = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * 2 * Math.PI;
  const r = 70 + (i % 5) * 36;
  return {
    left:  width * 0.5 + Math.cos(angle) * r * 1.6 - 6,
    top:   height * 0.3 + Math.sin(angle) * r - 6,
    sz:    i % 4 === 0 ? 9 : 6,
    delay: i * 440,
    dur:   800 + (i % 5) * 300,
    color: i % 3 === 0 ? Colors.gold : i % 3 === 1 ? "#5B9BD5" : "#C8A0DC",
  };
});

function CosmicBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" } as any]}>
      <LinearGradient colors={["#08051A", "#070D1A", "#0D0820", "#08051A"]} style={StyleSheet.absoluteFill} />
      {COSMIC_SYMBOLS.map((cfg, i) => <CosmicSymbol key={i} cfg={cfg} />)}
      {SHOOTING_STARS.map((cfg, i) => <ShootingStar key={i} cfg={cfg} />)}
      {BG_TWINKLES.map((s, i) => <TwinkleStar key={i} {...s} />)}
    </View>
  );
}

// ─── Animated Logo ────────────────────────────────────────────────────────────
function AnimatedLogoCenter() {
  const floatY  = useSharedValue(0);
  const breathe = useSharedValue(1);
  const phase   = useSharedValue(0);
  React.useEffect(() => {
    floatY.value = withRepeat(withSequence(
      withTiming(-10, { duration: 4000 }), withTiming(0, { duration: 4000 })
    ), -1, false);
    breathe.value = withRepeat(withSequence(
      withTiming(1.055, { duration: 3800, easing: Easing.inOut(Easing.sin) }),
      withTiming(1.000, { duration: 3800, easing: Easing.inOut(Easing.sin) })
    ), -1, false);
    phase.value = withRepeat(withSequence(
      withTiming(1, { duration: 10000 }), withTiming(0, { duration: 10000 })
    ), -1, false);
  }, []);
  const floatStyle   = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
  const breatheStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));
  const glowStyle    = useAnimatedStyle(() => ({
    transform: [{ scale: 1.0 + phase.value * 0.22 }],
    opacity: 0.05 + phase.value * 0.17,
    backgroundColor: interpolateColor(phase.value, [0, 1], ["#FF6B9D", "#5B9BD5"]),
  }));
  const CX = 110, CY = 110;
  return (
    <View style={styles.logoCenter}>
      <Animated.View style={[styles.glowOuter, glowStyle]} />
      <MandalaRing radius={90}  dotCount={24} color="#5B9BD5" duration={12000} />
      <MandalaRing radius={72}  dotCount={16} color="#FF6B9D" duration={9000}  reverse />
      <MandalaRing radius={108} dotCount={8}  color="#9B59B6" duration={18000} />
      <StarRing    radius={112} count={16}    color={Colors.gold} duration={28000} reverse />
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 2 * Math.PI + i * 0.52;
        const r  = 118 + (i % 4) * 7;
        const sz = i % 4 === 0 ? 10 : i % 3 === 0 ? 8 : 6;
        return <TwinkleStar key={i} left={CX + Math.cos(angle) * r - sz / 2} top={CY + Math.sin(angle) * r - sz / 2} sz={sz} delay={i * 380} dur={900 + (i % 5) * 280} />;
      })}
      <Animated.View style={floatStyle}>
        <Animated.View style={breatheStyle}>
          <Image source={require("@/assets/images/tengri-logo.png")} style={styles.logoImage} resizeMode="contain" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ─── Pulsing Icon ─────────────────────────────────────────────────────────────
function PulsingIcon({ icon, color }: { icon: string; color: string }) {
  const scale = useSharedValue(1);
  const glow  = useSharedValue(0);
  React.useEffect(() => {
    scale.value = withRepeat(withSequence(
      withTiming(1.08, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      withTiming(1.00, { duration: 2400, easing: Easing.inOut(Easing.sin) })
    ), -1, false);
    glow.value = withRepeat(withSequence(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
    ), -1, false);
  }, []);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle  = useAnimatedStyle(() => ({ opacity: 0.10 + glow.value * 0.25, transform: [{ scale: 1 + glow.value * 0.35 }] }));
  const ringStyle  = useAnimatedStyle(() => ({ opacity: 0.06 + glow.value * 0.14, transform: [{ scale: 1 + glow.value * 0.55 }] }));
  return (
    <View style={styles.pulsingIconWrap}>
      <Animated.View style={[styles.pulseRingOuter, { borderColor: color }, ringStyle]} />
      <Animated.View style={[styles.pulseGlow, { backgroundColor: color }, glowStyle]} />
      <Animated.View style={[styles.iconCircleInner, { borderColor: color + "60" }, scaleStyle]}>
        <Text style={[styles.iconText, { color }]}>{icon}</Text>
      </Animated.View>
    </View>
  );
}

// ─── Slides definition ────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: "disclaimer",
    type: "disclaimer" as const,
    title: null,
    accent: "#C25A6A",
  },
  {
    id: "welcome",
    type: "logo" as const,
    title: "Tengri'ye\nHoş Geldin",
    subtitle: "Kadim mistik bilgelik ve yapay zekâ ile\nkaderinin işaretlerini keşfet.",
    detail: "✨ Yıldızlar, semboller ve kadim bilgiler seni bekliyor.",
    accent: Colors.gold,
    cta: "Keşfetmeye Başla",
  },
  {
    id: "services",
    type: "icon" as const,
    icon: "🔮",
    title: "11 Mistik\nHizmet",
    subtitle: "Kahve falı, tarot, astroloji ve kadim mistik bilgiler ile hayatının işaretlerini keşfet.",
    detail: "☕ Kahve  •  🔮 Tarot  •  ✋ El  •  🌙 Astroloji\n🔢 Numeroloji  •  🧿 Ruh Okuma  •  🌌 Rüya\n⭐ Burçlar  •  ✨ Doğum  •  ❤️ Aşk  •  🪶 Şamanizm",
    accent: "#9B6FBB",
    cta: "Hizmetleri Keşfet",
  },
  {
    id: "gold",
    type: "icon" as const,
    icon: "✦",
    title: "Ücretsiz\nBaşla",
    subtitle: "Her gün şans çarkını çevir, altın kazan.",
    detail: "✨ Günlük ücretsiz mistik okuma seni bekliyor.\n\nYeni üyeler 10 altın ile başlar.",
    accent: Colors.gold,
    cta: "Devam Et",
  },
  {
    id: "final",
    type: "icon" as const,
    icon: "☽",
    title: "Mistik Yolculuğa\nBaşla",
    subtitle: "Bir hesap oluştur ve mistik yolculuğunu başlat.\nOkumalarını kaydet ve kaderinin işaretlerini takip et.",
    detail: "",
    accent: Colors.gold,
  },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { markOnboardingDone } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const isLast = activeIndex === SLIDES.length - 1;
  const isDisclaimer = activeIndex === 0;

  const goNext = () => {
    if (isLast) { handleSkip(); return; }
    setActiveIndex((i) => i + 1);
  };

  const handleSkip = async () => {
    await markOnboardingDone();
    router.replace("/(tabs)");
  };

  const handleAuth = async () => {
    await markOnboardingDone();
    router.replace("/auth");
  };

  const slide = SLIDES[activeIndex];

  return (
    <View style={styles.container}>
      <CosmicBackground />

      {/* ── Slide content ── */}
      <Animated.View
        key={slide.id}
        entering={FadeIn.duration(400)}
        exiting={FadeOut.duration(200)}
        style={[styles.slide, { paddingTop: topPad + 20, paddingBottom: botPad + 160 }]}
      >
        {/* Disclaimer slide */}
        {slide.type === "disclaimer" && (
          <View style={styles.disclaimerWrap}>
            <View style={styles.disclaimerIconRow}>
              <Text style={styles.disclaimerIcon}>✦</Text>
            </View>
            <View style={styles.disclaimerBox}>
              <Text style={[styles.disclaimerTitle, { fontFamily: "Lora_700Bold" }]}>
                Önemli Bilgilendirme
              </Text>
              <View style={styles.disclaimerDivider} />
              <Text style={[styles.disclaimerText, { fontFamily: "Lora_400Regular_Italic" }]}>
                Bu uygulamada sunulan yorumlar yalnızca eğlence amaçlıdır. Geleceği öngörme veya kişisel kararları yönlendirme amacı taşımaz.
              </Text>
              <Text style={[styles.disclaimerTextSmall, { fontFamily: "Lora_400Regular" }]}>
                Uygulamayı kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız:
              </Text>
              <View style={styles.disclaimerLinksRow}>
                <TouchableOpacity
                  onPress={() => router.push("/privacy")}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.disclaimerLink, { fontFamily: "Lora_700Bold" }]}>
                    Gizlilik Politikası
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.disclaimerLinkSep, { fontFamily: "Lora_400Regular" }]}>·</Text>
                <TouchableOpacity
                  onPress={() => router.push("/terms")}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.disclaimerLink, { fontFamily: "Lora_700Bold" }]}>
                    Kullanım Koşulları
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Logo slide */}
        {slide.type === "logo" && (
          <>
            <View style={styles.logoCenterWrap}>
              <AnimatedLogoCenter />
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.title, { fontFamily: "Lora_700Bold" }]}>{slide.title}</Text>
              <View style={[styles.divider, { backgroundColor: slide.accent + "60" }]} />
              <Text style={[styles.subtitle, { fontFamily: "Lora_400Regular" }]}>{slide.subtitle}</Text>
              {!!slide.detail && (
                <Text style={[styles.detail, { fontFamily: "Lora_400Regular_Italic" }]}>{slide.detail}</Text>
              )}
            </View>
          </>
        )}

        {/* Icon slides */}
        {slide.type === "icon" && (
          <>
            <View style={styles.pulsingWrap}>
              <PulsingIcon icon={(slide as any).icon} color={slide.accent} />
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.title, { fontFamily: "Lora_700Bold" }]}>{slide.title}</Text>
              <View style={[styles.divider, { backgroundColor: slide.accent + "60" }]} />
              <Text style={[styles.subtitle, { fontFamily: "Lora_400Regular" }]}>{slide.subtitle}</Text>
              {!!(slide as any).detail && (
                <Text style={[styles.detail, { fontFamily: "Lora_400Regular_Italic" }]}>{(slide as any).detail}</Text>
              )}
            </View>
          </>
        )}
      </Animated.View>

      {/* ── Bottom controls ── */}
      <LinearGradient
        colors={["transparent", "rgba(8,5,26,0.95)", "#08051A"]}
        style={[styles.bottomGradient, { paddingBottom: botPad + 20, pointerEvents: "box-none" as any }]}
      >
        {/* Dot indicators (hidden on disclaimer) */}
        {!isDisclaimer && (
          <View style={styles.dots}>
            {SLIDES.slice(1).map((_, i) => {
              const active = i === activeIndex - 1;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { width: active ? 28 : 8, opacity: active ? 1 : 0.3 },
                  ]}
                />
              );
            })}
          </View>
        )}

        <View style={styles.buttonGroup}>
          {isDisclaimer ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={goNext} activeOpacity={0.85}>
              <LinearGradient colors={["#C8A020", "#9B6820"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnInner}>
                <Text style={[styles.primaryBtnText, { fontFamily: "Lora_700Bold" }]}>Anladım, Devam Et →</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : isLast ? (
            <>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleAuth} activeOpacity={0.85}>
                <LinearGradient colors={["#D4A822", "#A87220"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnInner}>
                  <Text style={[styles.primaryBtnText, { fontFamily: "Lora_700Bold" }]}>Ücretsiz Hesap Oluştur</Text>
                  <Text style={[styles.primaryBtnBadge, { fontFamily: "Lora_400Regular" }]}>✦ 10 Altın Hediye ile Başla</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleAuth} activeOpacity={0.8}>
                <Text style={[styles.secondaryBtnText, { fontFamily: "Lora_400Regular" }]}>Giriş Yap</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipLink}>
                <Text style={[styles.skipText, { fontFamily: "Lora_400Regular" }]}>Geç</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.primaryBtn} onPress={goNext} activeOpacity={0.85}>
                <LinearGradient colors={["#C8A020", "#9B6820"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnInner}>
                  <Text style={[styles.primaryBtnText, { fontFamily: "Lora_700Bold" }]}>
                    {(SLIDES[activeIndex] as any).cta ?? "Devam Et"} →
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipLink}>
                <Text style={[styles.skipText, { fontFamily: "Lora_400Regular" }]}>Geç</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08051A" },

  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  // ── Disclaimer ──
  disclaimerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  disclaimerIconRow: {
    marginBottom: 28,
  },
  disclaimerIcon: {
    fontSize: 36,
    color: "#C25A6A",
    textAlign: "center",
  },
  disclaimerBox: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#C25A6A40",
    borderRadius: 20,
    padding: 28,
    backgroundColor: "rgba(194,90,106,0.06)",
  },
  disclaimerTitle: {
    fontSize: 20,
    color: "#E8B4BC",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 1,
  },
  disclaimerDivider: {
    height: 1,
    backgroundColor: "#C25A6A40",
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 16,
    color: "#D4909A",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 20,
  },
  disclaimerLinksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 14,
  },
  disclaimerLink: {
    fontSize: 13,
    color: "#E8B4BC",
    textDecorationLine: "underline",
  },
  disclaimerLinkSep: {
    fontSize: 13,
    color: "#8A5560",
  },
  disclaimerTextSmall: {
    fontSize: 13,
    color: "#8A5560",
    textAlign: "center",
    lineHeight: 20,
  },

  // ── Logo ──
  logoCenterWrap: { marginBottom: 24 },
  logoCenter: {
    width: 232, height: 232,
    alignItems: "center", justifyContent: "center",
  },
  glowOuter: {
    position: "absolute",
    width: 220, height: 220, borderRadius: 110,
  },
  logoImage: { width: 130, height: 130 },

  // ── Pulsing icon ──
  pulsingWrap: { marginBottom: 28 },
  pulsingIconWrap: {
    width: 140, height: 140,
    alignItems: "center", justifyContent: "center",
  },
  pulseRingOuter: {
    position: "absolute",
    width: 140, height: 140, borderRadius: 70, borderWidth: 1,
  },
  pulseGlow: {
    position: "absolute",
    width: 100, height: 100, borderRadius: 50,
  },
  iconCircleInner: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  iconText: { fontSize: 44, textAlign: "center" },

  // ── Text ──
  textBlock: { alignItems: "center", width: "100%" },
  title: {
    fontSize: 34, color: Colors.text,
    textAlign: "center", lineHeight: 42,
    marginBottom: 18, letterSpacing: 0.5,
  },
  divider: { width: 40, height: 1.5, borderRadius: 2, marginBottom: 18 },
  subtitle: {
    fontSize: 15, color: Colors.textSecondary,
    textAlign: "center", lineHeight: 24, marginBottom: 16,
  },
  detail: {
    fontSize: 12, color: Colors.textDim,
    textAlign: "center", lineHeight: 20,
  },

  // ── Bottom ──
  bottomGradient: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    paddingTop: 70,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 22,
    alignItems: "center",
  },
  dot: { height: 4, borderRadius: 2, backgroundColor: Colors.gold },
  buttonGroup: {
    width: "100%", paddingHorizontal: 32,
    alignItems: "center", gap: 12,
  },
  primaryBtn: { width: "100%", borderRadius: 16, overflow: "hidden" },
  primaryBtnInner: { paddingVertical: 18, alignItems: "center", gap: 4 },
  primaryBtnText: { fontSize: 17, color: "#08051A", letterSpacing: 0.5 },
  primaryBtnBadge: { fontSize: 12, color: "#08051Aaa", letterSpacing: 0.3 },
  secondaryBtn: {
    width: "100%", paddingVertical: 15, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.gold + "60", alignItems: "center",
    backgroundColor: "rgba(200,160,32,0.06)",
  },
  secondaryBtnText: { fontSize: 16, color: Colors.gold },
  skipLink: { paddingVertical: 8 },
  skipText: { fontSize: 13, color: Colors.textDim },
});
