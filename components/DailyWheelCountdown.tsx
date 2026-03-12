import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useDailyWheel } from '@/hooks/useDailyWheel';

interface Props {
  lang?:    'tr' | 'en';
  compact?: boolean;
}

export function DailyWheelCountdown({ lang = 'tr', compact = false }: Props) {
  const { canSpin, formattedCountdown, hoursRemaining } = useDailyWheel();

  const glow = useSharedValue(0.3);
  useEffect(() => {
    if (canSpin) {
      glow.value = withRepeat(
        withSequence(withTiming(1, { duration: 700 }), withTiming(0.3, { duration: 700 })),
        -1, false,
      );
    } else {
      glow.value = 0.3;
    }
  }, [canSpin]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glow.value,
    borderColor: canSpin
      ? `rgba(46, 204, 113, ${glow.value})`
      : Colors.gold + '30',
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/spin');
  };

  if (compact) {
    return (
      <Pressable onPress={handlePress} style={styles.compact}>
        <Ionicons
          name="radio-button-on-outline"
          size={16}
          color={canSpin ? Colors.success : Colors.gold}
        />
        <Text style={[styles.compactText, canSpin && { color: Colors.success }]}>
          {canSpin
            ? (lang === 'tr' ? '🎰 Çark Hazır!' : '🎰 Spin Ready!')
            : formattedCountdown}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.container, glowStyle]}>
        <View style={styles.left}>
          <Text style={styles.wheelEmoji}>🎰</Text>
          <View style={styles.textGroup}>
            <Text style={styles.title}>
              {lang === 'tr' ? 'Günlük Çark' : 'Daily Spin'}
            </Text>
            {canSpin ? (
              <Text style={[styles.sub, styles.subReady]}>
                {lang === 'tr' ? 'Hazır! Altın kazan 🎉' : 'Ready! Earn gold 🎉'}
              </Text>
            ) : (
              <Text style={styles.sub}>
                {lang === 'tr' ? `${hoursRemaining}sa sonra tekrar dön` : `Come back in ${hoursRemaining}h`}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.badge, canSpin && styles.badgeReady]}>
          {canSpin
            ? <Text style={[styles.badgeText, { color: Colors.success }]}>
                {lang === 'tr' ? 'ÇEVİR' : 'SPIN'}
              </Text>
            : <Text style={styles.countdown}>{formattedCountdown}</Text>}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0A0718', borderWidth: 1, borderRadius: 14, padding: 14,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 }, shadowRadius: 16,
    elevation: 6,
  },
  left:      { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  wheelEmoji: { fontSize: 28 },
  textGroup: { gap: 3 },
  title:     { fontSize: 14, fontFamily: 'Lora_700Bold',    color: Colors.text },
  sub:       { fontSize: 11, fontFamily: 'Lora_400Regular', color: Colors.textDim },
  subReady:  { color: Colors.success },
  badge: {
    backgroundColor: Colors.gold + '15', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7, alignItems: 'center', minWidth: 76,
  },
  badgeReady:  { backgroundColor: Colors.success + '18' },
  badgeText:   { fontSize: 12, fontFamily: 'Lora_700Bold', color: Colors.gold },
  countdown:   { fontSize: 13, fontFamily: 'Lora_700Bold', color: Colors.gold, letterSpacing: 1 },
  compact:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  compactText: { fontSize: 13, fontFamily: 'Lora_400Regular', color: Colors.gold },
});
