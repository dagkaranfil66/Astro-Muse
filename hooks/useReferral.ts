import { useState, useEffect, useCallback } from 'react';
import { referralService } from '@/services/referralService';
import { useApp } from '@/context/AppContext';
import { useLang } from '@/context/LanguageContext';
import { buildReferralInvite } from '@/utils/shareMessageBuilder';
import { Share } from 'react-native';
import * as Haptics from 'expo-haptics';

// ─── useReferral ──────────────────────────────────────────────────────────────

export function useReferral() {
  const { userProfile, addGold } = useApp();
  const { lang }  = useLang();
  const email     = userProfile?.email ?? '';

  const [myCode,        setMyCode]        = useState<string | null>(null);
  const [hasClaimedCode, setHasClaimedCode] = useState(false);
  const [isClaiming,    setIsClaiming]    = useState(false);
  const [claimMessage,  setClaimMessage]  = useState('');
  const [claimSuccess,  setClaimSuccess]  = useState(false);

  useEffect(() => {
    if (!email) return;
    referralService.getMyCode(email).then(setMyCode);
    referralService.hasClaimedReferral(email).then(setHasClaimedCode);
  }, [email]);

  const claimCode = useCallback(async (inputCode: string) => {
    if (!email || isClaiming) return { success: false, message: '' };
    setIsClaiming(true);
    setClaimMessage('');

    const result = await referralService.claimReferralCode(email, inputCode);

    if (result.success) {
      addGold(result.goldToAdd);         // updates AppContext + AsyncStorage
      setClaimSuccess(true);
      setHasClaimedCode(true);
    }

    setClaimMessage(result.message);
    setIsClaiming(false);
    Haptics.notificationAsync(
      result.success
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    );
    return result;
  }, [email, isClaiming, addGold]);

  const shareMyCode = useCallback(async () => {
    if (!myCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({ message: buildReferralInvite(myCode, lang) });
    } catch {}
  }, [myCode, lang]);

  return {
    myCode,
    hasClaimedCode,
    isClaiming,
    claimMessage,
    claimSuccess,
    claimCode,
    shareMyCode,
    isLoggedIn: !!email,
  };
}
