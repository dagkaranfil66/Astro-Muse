import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withDelay, withSequence, withRepeat,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface Props {
  goldAdded:    number;
  packageName:  string;
  newBalance:   number;
  onClose:      () => void;
  lang?:        'tr' | 'en';
}

export function PurchaseSuccessCard({ goldAdded, packageName, newBalance, onClose, lang = 'tr' }: Props) {
  const scale      = useSharedValue(0);
  const opacity    = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const shine      = useSharedValue(0);

  useEffect(() => {
    opacity.value    = withTiming(1, { duration: 300 });
    scale.value      = withSpring(1, { damping: 14, stiffness: 140 });
    checkScale.value = withDelay(250, withSpring(1, { damping: 10, stiffness: 180 }));
    shine.value      = withDelay(500, withRepeat(
      withSequence(withTiming(1, { duration: 600 }), withTiming(0, { duration: 600 })),
      3, false,
    ));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));
  const shineStyle = useAnimatedStyle(() => ({
    shadowOpacity: shine.value * 0.7,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Success ring */}
      <Animated.View style={[styles.checkCircle, checkStyle, shineStyle]}>
        <Ionicons name="checkmark" size={42} color={Colors.background} />
      </Animated.View>

      <Text style={styles.title}>
        {lang === 'tr' ? 'Satın Alma Başarılı!' : 'Purchase Successful!'}
      </Text>
      <Text style={styles.pkgName}>{packageName}</Text>

      {/* Gold awarded pill */}
      <View style={styles.goldPill}>
        <Ionicons name="star" size={22} color={Colors.background} />
        <Text style={styles.goldText}>
          +{goldAdded} {lang === 'tr' ? 'Altın' : 'Gold'}
        </Text>
        <Ionicons name="star" size={22} color={Colors.background} />
      </View>

      {/* New balance */}
      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>
          {lang === 'tr' ? 'Yeni bakiye' : 'New balance'}
        </Text>
        <Text style={styles.balanceVal}>{newBalance} ✦</Text>
      </View>

      {/* Suggestions */}
      <View style={styles.suggestions}>
        <Text style={styles.suggestLabel}>
          {lang === 'tr' ? 'Şimdi ne yapmak istersin?' : "What would you like to do?"}
        </Text>
        <View style={styles.suggestRow}>
          {['☕ Kahve', '🔮 Tarot', '⭐ Burçlar'].map((s) => (
            <View key={s} style={styles.suggestPill}>
              <Text style={styles.suggestPillText}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
        onPress={onClose}
      >
        <Text style={styles.btnText}>
          {lang === 'tr' ? '✦  Mistik Rehberliğe Dön' : '✦  Return to Guidance'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B1A10',
    borderRadius: 24, padding: 30, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.success + '45', gap: 14,
  },
  checkCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.success, shadowOffset: { width: 0, height: 0 }, shadowRadius: 24,
    elevation: 12,
  },
  title:   { fontSize: 22, fontFamily: 'Lora_700Bold',    color: Colors.text, textAlign: 'center' },
  pkgName: { fontSize: 12, fontFamily: 'Lora_400Regular', color: Colors.gold, letterSpacing: 2 },
  goldPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.gold, paddingHorizontal: 28, paddingVertical: 11, borderRadius: 50,
  },
  goldText: { fontSize: 20, fontFamily: 'Lora_700Bold', color: Colors.background },
  balanceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.success + '12', borderWidth: 1, borderColor: Colors.success + '30',
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8,
  },
  balanceLabel: { fontSize: 13, fontFamily: 'Lora_400Regular', color: Colors.textDim },
  balanceVal:   { fontSize: 16, fontFamily: 'Lora_700Bold',    color: Colors.success },
  suggestions:  { alignItems: 'center', gap: 8, width: '100%' },
  suggestLabel: { fontSize: 12, fontFamily: 'Lora_400Regular', color: Colors.textDim },
  suggestRow:   { flexDirection: 'row', gap: 8 },
  suggestPill: {
    backgroundColor: Colors.gold + '12', borderWidth: 1, borderColor: Colors.gold + '30',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
  },
  suggestPillText: { fontSize: 12, color: Colors.gold, fontFamily: 'Lora_400Regular' },
  btn: {
    backgroundColor: Colors.success + '18', borderWidth: 1, borderColor: Colors.success + '40',
    borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12, marginTop: 4, width: '100%', alignItems: 'center',
  },
  btnText: { fontSize: 14, fontFamily: 'Lora_700Bold', color: Colors.success },
});
