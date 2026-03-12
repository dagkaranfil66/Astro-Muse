import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withSequence, withRepeat,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FREE_START_GOLD } from '@/constants/serviceConfig';

interface Props {
  onClose: () => void;
  bonusAmount?: number;
  lang?: 'tr' | 'en';
}

export function WelcomeGiftCard({ onClose, bonusAmount = FREE_START_GOLD, lang = 'tr' }: Props) {
  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.82);
  const glow    = useSharedValue(0.2);
  const star    = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 350 });
    scale.value   = withSpring(1, { damping: 13, stiffness: 110 });
    glow.value    = withRepeat(withSequence(
      withTiming(0.7, { duration: 900 }),
      withTiming(0.2, { duration: 900 }),
    ), -1, false);
    star.value = withRepeat(withTiming(1, { duration: 3000 }), -1, false);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ scale: scale.value }],
    shadowOpacity: glow.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Header */}
      <View style={styles.topBanner}>
        <Text style={styles.bannerText}>✦  T E N G R I  ✦</Text>
      </View>

      <Text style={styles.emoji}>🎁</Text>
      <Text style={styles.title}>
        {lang === 'tr' ? 'Hoş Geldin Hediyesi' : 'Welcome Gift'}
      </Text>
      <Text style={styles.subtitle}>
        {lang === 'tr' ? 'Yıldızlar seni bekliyordu' : 'The stars were waiting for you'}
      </Text>

      {/* Gold badge */}
      <View style={styles.goldBadge}>
        <Ionicons name="star" size={18} color={Colors.background} />
        <Text style={styles.goldText}>+{bonusAmount} {lang === 'tr' ? 'Altın' : 'Gold'}</Text>
        <Ionicons name="star" size={18} color={Colors.background} />
      </View>

      <Text style={styles.desc}>
        {lang === 'tr'
          ? `Tengri'ye katıldığın için `
          : `For joining Tengri, we've gifted you `}
        <Text style={styles.highlight}>{bonusAmount} {lang === 'tr' ? 'altın' : 'gold'}</Text>
        {lang === 'tr' ? ' hediye ettik.\nMistik yolculuğuna şimdi başla.' : '.\nStart your mystical journey now.'}
      </Text>

      {/* Feature row */}
      <View style={styles.features}>
        {['☕ Kahve', '🔮 Tarot', '⭐ Burçlar', '🌙 Rüya'].map((f) => (
          <View key={f} style={styles.pill}>
            <Text style={styles.pillText}>{f}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
        onPress={onClose}
      >
        <Text style={styles.btnText}>
          {lang === 'tr' ? '✦  Yolculuğu Başlat' : '✦  Begin the Journey'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F0825',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gold + '45',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 28,
    elevation: 14,
    gap: 14,
  },
  topBanner: {
    backgroundColor: Colors.gold + '15',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  bannerText: { fontSize: 10, fontFamily: 'Lora_400Regular', color: Colors.gold, letterSpacing: 5 },
  emoji:    { fontSize: 52 },
  title:    { fontSize: 22, fontFamily: 'Lora_700Bold',    color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: 11, fontFamily: 'Lora_400Regular', color: Colors.gold, letterSpacing: 3, textAlign: 'center' },
  goldBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.gold,
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 50,
  },
  goldText: { fontSize: 18, fontFamily: 'Lora_700Bold', color: Colors.background },
  desc:      { fontSize: 13, fontFamily: 'Lora_400Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  highlight: { color: Colors.gold, fontFamily: 'Lora_700Bold' },
  features:  { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  pill: {
    backgroundColor: Colors.gold + '12', borderWidth: 1, borderColor: Colors.gold + '30',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  pillText: { fontSize: 11, color: Colors.gold, fontFamily: 'Lora_400Regular' },
  btn: {
    backgroundColor: Colors.gold, borderRadius: 14,
    paddingHorizontal: 36, paddingVertical: 14, marginTop: 4, width: '100%', alignItems: 'center',
  },
  btnText: { fontSize: 16, fontFamily: 'Lora_700Bold', color: Colors.background, letterSpacing: 1 },
});
