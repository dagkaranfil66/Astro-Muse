import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useReferral } from '@/hooks/useReferral';
import { referralService } from '@/services/referralService';

interface Props {
  lang?: 'tr' | 'en';
}

export function ReferralCard({ lang = 'tr' }: Props) {
  const { myCode, shareMyCode } = useReferral();
  const [copied, setCopied] = React.useState(false);

  if (!myCode) return null;

  const handleCopy = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="gift-outline" size={18} color={Colors.gold} />
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {lang === 'tr' ? 'Arkadaşını Davet Et' : 'Invite a Friend'}
          </Text>
          <Text style={styles.subtitle}>
            {lang === 'tr'
              ? `Kod kullanılırsa ikiniz de +${referralService.REFERRAL_GOLD} altın kazanırsınız`
              : `You both earn +${referralService.REFERRAL_GOLD} gold when your code is used`}
          </Text>
        </View>
      </View>

      <View style={styles.codeRow}>
        <Pressable onPress={handleCopy} style={styles.codeBox}>
          <Text style={styles.code}>{myCode}</Text>
          <View style={styles.copyBadge}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={Colors.gold} />
            <Text style={styles.copyText}>
              {copied ? (lang === 'tr' ? 'Kopyalandı' : 'Copied') : (lang === 'tr' ? 'Kopyala' : 'Copy')}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={shareMyCode}
          style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="share-social-outline" size={16} color={Colors.background} />
          <Text style={styles.shareBtnText}>{lang === 'tr' ? 'Paylaş' : 'Share'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F0825',
    borderWidth: 1, borderColor: Colors.gold + '35',
    borderRadius: 18, padding: 18, gap: 14,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headerText: { flex: 1, gap: 3 },
  title:    { fontSize: 15, fontFamily: 'Lora_700Bold',    color: Colors.text },
  subtitle: { fontSize: 11, fontFamily: 'Lora_400Regular', color: Colors.textDim, lineHeight: 17 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  codeBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.gold + '12', borderWidth: 1, borderColor: Colors.gold + '40',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  code: { fontSize: 22, fontFamily: 'Lora_700Bold', color: Colors.gold, letterSpacing: 7 },
  copyBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  copyText:  { fontSize: 11, fontFamily: 'Lora_400Regular', color: Colors.gold },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.gold, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 11,
  },
  shareBtnText: { fontSize: 13, fontFamily: 'Lora_700Bold', color: Colors.background },
});
