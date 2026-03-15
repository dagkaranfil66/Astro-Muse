import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useUserIdentity } from '@/hooks/useUserIdentity';

interface Props {
  onPress: () => void;
  lang?: 'tr' | 'en';
}

// Shows a highlighted banner for the first free coffee reading.
// Auto-hides once the free coffee has been used.
export function FreeCoffeeHighlight({ onPress, lang = 'tr' }: Props) {
  const { hasUsedFirstFreeCoffee, isLoggedIn } = useUserIdentity();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.03, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1, false,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  if (!isLoggedIn || hasUsedFirstFreeCoffee) return null;

  return (
    <Animated.View style={pulseStyle}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.container, pressed && { opacity: 0.8 }]}
      >
        <View style={styles.freeBadge}>
          <Text style={styles.freeBadgeText}>{lang === 'tr' ? 'ÜCRETSİZ' : 'FREE'}</Text>
        </View>

        <Text style={styles.emoji}>☕</Text>

        <View style={styles.content}>
          <Text style={styles.title}>
            {lang === 'tr' ? 'İlk Kahve Analizin Ücretsiz!' : 'Your First Coffee Analysis is Free!'}
          </Text>
          <Text style={styles.sub}>
            {lang === 'tr' ? 'Bir kerelik • Altın harcamadan dene' : 'One time • No gold needed'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color={Colors.gold} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A0D05',
    borderWidth: 1, borderColor: Colors.gold + '55',
    borderRadius: 16, padding: 14, gap: 10,
    position: 'relative', overflow: 'visible',
  },
  freeBadge: {
    position: 'absolute', top: -9, left: 14,
    backgroundColor: Colors.success,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  freeBadgeText: { fontSize: 9, fontFamily: 'Lora_700Bold', color: '#fff', letterSpacing: 1 },
  emoji:   { fontSize: 30 },
  content: { flex: 1, gap: 3 },
  title:   { fontSize: 14, fontFamily: 'Lora_700Bold',    color: Colors.text },
  sub:     { fontSize: 11, fontFamily: 'Lora_400Regular', color: Colors.gold },
});
