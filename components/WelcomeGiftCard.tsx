import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withSequence, withRepeat, withDelay,
  Easing, interpolate, FadeIn, FadeInDown, ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { FREE_START_GOLD } from '@/constants/serviceConfig';

const { width } = Dimensions.get('window');

interface Props {
  onClose: () => void;
  bonusAmount?: number;
  lang?: 'tr' | 'en';
}

const PARTICLES = [
  { x: 0.12, y: 0.18, size: 10, delay: 0,    dur: 2800 },
  { x: 0.82, y: 0.12, size: 8,  delay: 300,  dur: 3200 },
  { x: 0.25, y: 0.75, size: 7,  delay: 600,  dur: 2600 },
  { x: 0.70, y: 0.70, size: 12, delay: 150,  dur: 3500 },
  { x: 0.55, y: 0.08, size: 6,  delay: 900,  dur: 2400 },
  { x: 0.08, y: 0.55, size: 9,  delay: 450,  dur: 3100 },
  { x: 0.88, y: 0.45, size: 7,  delay: 750,  dur: 2900 },
  { x: 0.40, y: 0.88, size: 11, delay: 200,  dur: 3300 },
];

function Particle({ x, y, size, delay, dur }: typeof PARTICLES[0]) {
  const op = useSharedValue(0);
  const ty = useSharedValue(0);
  useEffect(() => {
    op.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: dur * 0.3 }),
        withTiming(0.7, { duration: dur * 0.4 }),
        withTiming(0, { duration: dur * 0.3 }),
      ), -1, false
    ));
    ty.value = withDelay(delay, withRepeat(
      withTiming(-28, { duration: dur, easing: Easing.inOut(Easing.sin) }),
      -1, true
    ));
  }, []);
  const s = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));
  return (
    <Animated.Text style={[{ position: 'absolute', left: x * (width - 48), top: y * 340, fontSize: size, color: Colors.gold }, s]}>
      ✦
    </Animated.Text>
  );
}

function GoldRing({ bonusAmount, lang }: { bonusAmount: number; lang: string }) {
  const rot = useSharedValue(0);
  const pulse = useSharedValue(1);
  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 6000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1, false
    );
  }, []);
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  return (
    <Animated.View entering={ZoomIn.delay(400).springify().damping(10)} style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 4 }}>
      <Animated.View style={[styles.ringOuter, ringStyle]}>
        {[0,1,2,3,4,5,6,7].map(i => (
          <Text key={i} style={[styles.ringDot, { transform: [{ rotate: `${i * 45}deg` }, { translateY: -42 }] }]}>✦</Text>
        ))}
      </Animated.View>
      <Animated.View style={[styles.goldBadge, badgeStyle]}>
        <LinearGradient colors={['#F5D060', Colors.gold, '#C0932A']} style={styles.goldBadgeGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.goldAmount}>+{bonusAmount}</Text>
          <Text style={styles.goldLabel}>{lang === 'tr' ? 'ALTIN' : 'GOLD'}</Text>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

export function WelcomeGiftCard({ onClose, bonusAmount = FREE_START_GOLD, lang = 'tr' }: Props) {
  const cardScale = useSharedValue(0.7);
  const cardOp = useSharedValue(0);
  const glow = useSharedValue(0.15);

  useEffect(() => {
    cardOp.value = withTiming(1, { duration: 300 });
    cardScale.value = withSpring(1, { damping: 11, stiffness: 100, mass: 0.9 });
    glow.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.15, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      ), -1, false
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: cardOp.value,
    transform: [{ scale: cardScale.value }],
    shadowOpacity: interpolate(glow.value, [0.15, 0.9], [0.3, 0.85]),
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={['#130A2E', '#0D0520', '#0A1228']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

      {/* Top banner */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.topBanner}>
        <Text style={styles.bannerText}>✦  T E N G R I  ✦</Text>
      </Animated.View>

      {/* Emoji */}
      <Animated.Text entering={ZoomIn.delay(200).springify()} style={styles.emoji}>🎁</Animated.Text>

      {/* Title */}
      <Animated.Text entering={FadeInDown.delay(300).springify()} style={styles.title}>
        {lang === 'tr' ? 'Hoş Geldin Hediyesi' : 'Welcome Gift'}
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(380).springify()} style={styles.subtitle}>
        {lang === 'tr' ? 'Yıldızlar seni bekliyordu' : 'The stars were waiting for you'}
      </Animated.Text>

      {/* Animated gold ring + badge */}
      <GoldRing bonusAmount={bonusAmount} lang={lang} />

      {/* Description */}
      <Animated.Text entering={FadeInDown.delay(550).springify()} style={styles.desc}>
        {lang === 'tr'
          ? `Tengri'ye katıldığın için `
          : `For joining Tengri, we've gifted you `}
        <Text style={styles.highlight}>{bonusAmount} {lang === 'tr' ? 'altın' : 'gold'}</Text>
        {lang === 'tr' ? ' hediye ettik.' : '.'}
        {'\n'}
        <Text style={styles.aiTag}>
          {lang === 'tr' ? '✦ AI Destekli · Sana Özel' : '✦ AI-Powered · Personalized for You'}
        </Text>
      </Animated.Text>

      {/* Service pills */}
      <Animated.View entering={FadeInDown.delay(650).springify()} style={styles.features}>
        {['☕ Kahve', '🔮 Tarot', '⭐ Burçlar', '🌙 Rüya', '🤚 El Falı'].map((f, i) => (
          <Animated.View key={f} entering={FadeIn.delay(700 + i * 80)} style={styles.pill}>
            <Text style={styles.pillText}>{f}</Text>
          </Animated.View>
        ))}
      </Animated.View>

      {/* CTA button */}
      <Animated.View entering={FadeInDown.delay(900).springify()} style={{ width: '100%' }}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] }]}
          onPress={onClose}
        >
          <LinearGradient colors={['#F5D060', Colors.gold, '#B8840F']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.btnText}>
              {lang === 'tr' ? '✦  Mistik Yolculuğu Başlat' : '✦  Begin the Journey'}
            </Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D0520',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.gold + '50',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 36,
    elevation: 20,
    gap: 12,
    overflow: 'hidden',
  },
  topBanner: {
    backgroundColor: Colors.gold + '18',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.gold + '30',
  },
  bannerText: { fontSize: 10, fontFamily: 'Lora_400Regular', color: Colors.gold, letterSpacing: 6 },
  emoji: { fontSize: 56 },
  title: { fontSize: 24, fontFamily: 'Lora_700Bold', color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: 11, fontFamily: 'Lora_400Regular_Italic', color: Colors.gold + 'CC', letterSpacing: 2, textAlign: 'center' },

  ringOuter: {
    position: 'absolute',
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringDot: {
    position: 'absolute',
    fontSize: 8,
    color: Colors.gold + '80',
  },
  goldBadge: {
    borderRadius: 60,
    overflow: 'hidden',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 12,
  },
  goldBadgeGrad: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 60,
  },
  goldAmount: { fontSize: 32, fontFamily: 'Lora_700Bold', color: '#1A0A00', lineHeight: 36 },
  goldLabel: { fontSize: 11, fontFamily: 'Lora_700Bold', color: '#3A1A00', letterSpacing: 3 },

  desc: { fontSize: 13, fontFamily: 'Lora_400Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  highlight: { color: Colors.gold, fontFamily: 'Lora_700Bold' },
  aiTag: { fontSize: 11, color: Colors.gold + 'AA', fontFamily: 'Lora_400Regular_Italic' },

  features: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  pill: {
    backgroundColor: Colors.gold + '15',
    borderWidth: 1,
    borderColor: Colors.gold + '35',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: { fontSize: 11, color: Colors.gold, fontFamily: 'Lora_400Regular' },

  btn: { borderRadius: 16, overflow: 'hidden' },
  btnGrad: { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  btnText: { fontSize: 16, fontFamily: 'Lora_700Bold', color: '#1A0A00', letterSpacing: 1 },
});
