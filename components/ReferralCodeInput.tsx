import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useReferral } from '@/hooks/useReferral';

interface Props {
  lang?: 'tr' | 'en';
}

export function ReferralCodeInput({ lang = 'tr' }: Props) {
  const { hasClaimedCode, isClaiming, claimMessage, claimSuccess, claimCode } = useReferral();
  const [code, setCode] = useState('');

  if (hasClaimedCode) {
    return (
      <View style={styles.appliedBox}>
        <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
        <Text style={styles.appliedText}>
          {lang === 'tr' ? '✓ Davet kodu uygulandı' : '✓ Referral code applied'}
        </Text>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (code.length !== 6 || isClaiming) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await claimCode(code);
    if (claimSuccess) setCode('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {lang === 'tr' ? '🎁 Davet Kodu Var mı?' : '🎁 Have a Referral Code?'}
      </Text>
      <Text style={styles.hint}>
        {lang === 'tr'
          ? 'Arkadaşının kodunu gir, ikiniz de +5 altın kazan'
          : "Enter your friend's code — you both earn +5 gold"}
      </Text>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, code.length === 6 && { borderColor: Colors.gold + '80' }]}
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          placeholder="XXXXXX"
          placeholderTextColor={Colors.textDim}
          maxLength={6}
          autoCapitalize="characters"
          editable={!isClaiming}
        />
        <Pressable
          onPress={handleSubmit}
          disabled={isClaiming || code.length !== 6}
          style={({ pressed }) => [
            styles.btn,
            (isClaiming || code.length !== 6) && styles.btnDisabled,
            pressed && !isClaiming && code.length === 6 && { opacity: 0.85 },
          ]}
        >
          {isClaiming
            ? <ActivityIndicator size="small" color={Colors.background} />
            : <Text style={styles.btnText}>{lang === 'tr' ? 'Kullan' : 'Apply'}</Text>}
        </Pressable>
      </View>

      {claimMessage ? (
        <Text style={[styles.msg, claimSuccess && styles.msgSuccess]}>
          {claimMessage}
        </Text>
      ) : null}
    </View>
  );
}

// Ionicons import needed
import { Ionicons } from '@expo/vector-icons';

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 14, fontFamily: 'Lora_700Bold',    color: Colors.text },
  hint:  { fontSize: 11, fontFamily: 'Lora_400Regular', color: Colors.textDim },
  row:   { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: Colors.gold + '0E', borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 20, fontFamily: 'Lora_700Bold', color: Colors.gold,
    letterSpacing: 8, textAlign: 'center',
  },
  btn: {
    backgroundColor: Colors.gold, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 10, justifyContent: 'center', alignItems: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: 14, fontFamily: 'Lora_700Bold', color: Colors.background },
  msg:        { fontSize: 12, fontFamily: 'Lora_400Regular', color: Colors.error,   marginTop: 2 },
  msgSuccess: { color: Colors.success },
  appliedBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.success + '15', borderWidth: 1, borderColor: Colors.success + '30',
    borderRadius: 10, padding: 10,
  },
  appliedText: { fontSize: 13, fontFamily: 'Lora_700Bold', color: Colors.success },
});
