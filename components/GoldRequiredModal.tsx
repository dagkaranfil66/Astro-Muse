import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { DailyWheelCountdown } from './DailyWheelCountdown';
import { recommendedPackage } from '@/utils/categoryPricing';

interface Props {
  visible:        boolean;
  onClose:        () => void;
  requiredGold:   number;
  currentBalance: number;
  serviceName?:   string;
  lang?:          'tr' | 'en';
}

export function GoldRequiredModal({
  visible, onClose, requiredGold, currentBalance, serviceName, lang = 'tr',
}: Props) {
  const shortfall = requiredGold - currentBalance;
  const pkg       = recommendedPackage(shortfall);

  const handleBuyGold = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    router.push('/purchase');
  };

  const handleSpin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push('/spin');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="star" size={34} color={Colors.background} />
          </View>

          <Text style={styles.title}>
            {lang === 'tr' ? 'Yetersiz Altın' : 'Not Enough Gold'}
          </Text>

          <Text style={styles.desc}>
            {lang === 'tr'
              ? `${serviceName ? `${serviceName} için ` : ''}${requiredGold} altın gerekli.\n${shortfall} altın eksik (şu an: ${currentBalance} ✦).`
              : `${requiredGold} gold needed${serviceName ? ` for ${serviceName}` : ''}.\nYou need ${shortfall} more (current: ${currentBalance} ✦).`}
          </Text>

          {/* Recommended package hint */}
          {pkg && (
            <View style={styles.pkgHint}>
              <Text style={styles.pkgHintText}>
                💡 {lang === 'tr'
                  ? `${pkg.label} (${pkg.gold + pkg.bonus} ✦ — ${pkg.price}) yeterli`
                  : `${pkg.label} (${pkg.gold + pkg.bonus} ✦ — ${pkg.price}) would cover it`}
              </Text>
            </View>
          )}

          {/* Buy Gold */}
          <Pressable style={styles.primaryBtn} onPress={handleBuyGold}>
            <LinearGradient
              colors={[Colors.gold, Colors.accent]}
              style={styles.primaryBtnInner}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Ionicons name="diamond-outline" size={18} color={Colors.background} />
              <Text style={styles.primaryBtnText}>
                {lang === 'tr' ? 'Altın Satın Al' : 'Buy Gold'}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Spin wheel shortcut */}
          <Pressable onPress={handleSpin} style={styles.spinBtn}>
            <DailyWheelCountdown lang={lang} compact />
          </Pressable>

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>{lang === 'tr' ? 'Kapat' : 'Close'}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0F0825',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, borderTopColor: Colors.gold + '30',
    padding: 28, paddingBottom: 44, alignItems: 'center', gap: 12,
  },
  handle: {
    width: 36, height: 4, backgroundColor: Colors.gold + '40',
    borderRadius: 2, marginBottom: 6,
  },
  iconWrap: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20,
  },
  title: { fontSize: 20, fontFamily: 'Lora_700Bold', color: Colors.text, textAlign: 'center' },
  desc:  { fontSize: 14, fontFamily: 'Lora_400Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  pkgHint: {
    backgroundColor: Colors.gold + '12', borderWidth: 1, borderColor: Colors.gold + '28',
    borderRadius: 10, padding: 10, width: '100%',
  },
  pkgHintText: { fontSize: 12, fontFamily: 'Lora_400Regular', color: Colors.gold, textAlign: 'center' },
  primaryBtn:      { width: '100%', borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  primaryBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  primaryBtnText: { fontSize: 16, fontFamily: 'Lora_700Bold', color: Colors.background },
  spinBtn:  {
    width: '100%', backgroundColor: Colors.gold + '10',
    borderWidth: 1, borderColor: Colors.gold + '25', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 18,
  },
  closeBtn:     { paddingVertical: 8, marginTop: 4 },
  closeBtnText: { fontSize: 13, fontFamily: 'Lora_400Regular', color: Colors.textDim },
});
