import { useState, useCallback, useEffect, useRef } from 'react';
import { shareRewardService, type ShareRewardReason } from '@/services/shareRewardService';
import { useApp } from '@/context/AppContext';
import { SHARE_CONFIG } from '@/constants/shareConfig';

// ─── useShareReward ───────────────────────────────────────────────────────────

export type RewardStatus =
  | 'idle'
  | 'claiming'
  | 'awarded'
  | 'daily_limit'
  | 'duplicate'
  | 'cooldown'
  | 'no_auth'
  | 'error';

export function useShareReward(readingId: string | null) {
  const { userProfile, addGold } = useApp();
  const [status,          setStatus]          = useState<RewardStatus>('idle');
  const [sharesLeft,      setSharesLeft]      = useState<number>(SHARE_CONFIG.MAX_DAILY_SHARES);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cooldown countdown
  useEffect(() => {
    if (status === 'cooldown' && cooldownSeconds > 0) {
      timerRef.current = setInterval(() => {
        setCooldownSeconds((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current!);
            setStatus('idle');
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, cooldownSeconds]);

  const claim = useCallback(async () => {
    if (!readingId) return;
    if (status === 'claiming' || status === 'awarded' || status === 'daily_limit') return;
    if (!userProfile?.email) { setStatus('no_auth'); return; }

    setStatus('claiming');

    const result = await shareRewardService.claimReward(userProfile.email, readingId);

    if (result.success) {
      addGold(result.goldAwarded);
      setSharesLeft(result.sharesRemainingToday);
      setStatus('awarded');
    } else {
      switch (result.reason as ShareRewardReason) {
        case 'daily_limit':
          setStatus('daily_limit');
          break;
        case 'cooldown':
          setStatus('cooldown');
          setCooldownSeconds(result.remainingSeconds ?? SHARE_CONFIG.COOLDOWN_SECONDS);
          break;
        case 'duplicate':
          setStatus('duplicate');
          break;
        case 'no_auth':
          setStatus('no_auth');
          break;
        default:
          setStatus('error');
      }
    }
  }, [readingId, status, userProfile, addGold]);

  const reset = useCallback(() => {
    setStatus('idle');
    setCooldownSeconds(0);
  }, []);

  return {
    status,
    sharesLeft,
    cooldownSeconds,
    claim,
    reset,
    goldPerShare:  SHARE_CONFIG.REWARD_PER_SHARE,
    maxDailyShares: SHARE_CONFIG.MAX_DAILY_SHARES,
    isAwarded:     status === 'awarded',
    isLimited:     status === 'daily_limit',
    isCooling:     status === 'cooldown',
  };
}
