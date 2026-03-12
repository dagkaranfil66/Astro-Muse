import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { type RewardStatus } from '@/hooks/useShareReward';
import { SHARE_CONFIG } from '@/constants/shareConfig';

interface Props {
  status:          RewardStatus;
  sharesLeft:      number;
  cooldownSeconds: number;
  goldPerShare?:   number;
  onShare:         () => void;
  lang?:           'tr' | 'en';
}

const TR_LABEL: Record<RewardStatus, string> = {
  idle:        'Paylaş +{g} Altın',
  claiming:    'Kontrol ediliyor...',
  awarded:     'Ödül alındı! ✓',
  daily_limit: 'Bugünkü limit doldu',
  duplicate:   'Zaten paylaştın',
  cooldown:    '{s}sn bekle',
  no_auth:     'Giriş gerekli',
  error:       'Hata oluştu',
};
const EN_LABEL: Record<RewardStatus, string> = {
  idle:        'Share +{g} Gold',
  claiming:    'Checking...',
  awarded:     'Reward claimed! ✓',
  daily_limit: 'Daily limit reached',
  duplicate:   'Already shared',
  cooldown:    'Wait {s}s',
  no_auth:     'Login required',
  error:       'An error occurred',
};

export function ShareRewardCard({
  status, sharesLeft, cooldownSeconds, goldPerShare = SHARE_CONFIG.REWARD_PER_SHARE, onShare, lang = 'tr',
}: Props) {
  const map   = lang === 'tr' ? TR_LABEL : EN_LABEL;
  const label = map[status]
    .replace('{g}', String(goldPerShare))
    .replace('{s}', String(cooldownSeconds));

  const isDisabled = status === 'daily_limit' || status === 'claiming';
  const isAwarded  = status === 'awarded';
  const isClaiming = status === 'claiming';

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.title}>
            <Ionicons name="share-social-outline" size={13} color={Colors.gold} />
            {' '}{lang === 'tr' ? `Paylaş, +${goldPerShare} Altın Kazan` : `Share & Earn +${goldPerShare} Gold`}
          </Text>
          <Text style={styles.sub}>
            {status === 'cooldown'
              ? (lang === 'tr' ? `${cooldownSeconds}sn sonra tekrar dene` : `Retry in ${cooldownSeconds}s`)
              : (lang === 'tr'
                  ? `Bugün ${sharesLeft} hak kaldı • Max ${SHARE_CONFIG.MAX_DAILY_SHARES}/gün`
                  : `${sharesLeft} left today • Max ${SHARE_CONFIG.MAX_DAILY_SHARES}/day`)}
          </Text>
        </View>

        <Pressable
          onPress={onShare}
          disabled={isDisabled}
          style={({ pressed }) => [
            styles.btn,
            isAwarded  && styles.btnSuccess,
            isDisabled && styles.btnDisabled,
            pressed && !isDisabled && { opacity: 0.8 },
          ]}
        >
          {isClaiming ? (
            <ActivityIndicator size="small" color={Colors.background} />
          ) : (
            <>
              <Ionicons
                name={isAwarded ? 'checkmark' : 'share-outline'}
                size={15}
                color={isDisabled ? Colors.textDim : Colors.background}
              />
              <Text style={[styles.btnText, isDisabled && styles.btnTextDim]}>
                {label}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.gold + '0E',
    borderWidth: 1, borderColor: Colors.gold + '30',
    borderRadius: 14, padding: 14,
  },
  row:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  info: { flex: 1, gap: 3 },
  title: { fontSize: 13, fontFamily: 'Lora_700Bold',    color: Colors.gold },
  sub:   { fontSize: 11, fontFamily: 'Lora_400Regular', color: Colors.textDim },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.gold,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9,
  },
  btnSuccess:  { backgroundColor: Colors.success },
  btnDisabled: { backgroundColor: Colors.cardBorder, opacity: 0.55 },
  btnText:    { fontSize: 12, fontFamily: 'Lora_700Bold', color: Colors.background },
  btnTextDim: { color: Colors.textDim },
});
