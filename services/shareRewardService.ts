import { getApiUrl } from '@/lib/query-client';
import { SHARE_CONFIG } from '@/constants/shareConfig';

// ─── Share Reward Service ─────────────────────────────────────────────────────
// Validates and claims share rewards via backend API.
// Backend: POST /api/share/claim-reward — validates daily limits, cooldown, duplicate.

export type ShareRewardReason =
  | 'daily_limit'
  | 'cooldown'
  | 'duplicate'
  | 'no_auth'
  | 'error';

export type ShareRewardResult =
  | { success: true;  goldAwarded: number; sharesRemainingToday: number }
  | { success: false; reason: ShareRewardReason; message: string; remainingSeconds?: number };

export const shareRewardService = {
  async claimReward(email: string, readingId: string): Promise<ShareRewardResult> {
    if (!email) {
      return { success: false, reason: 'no_auth', message: 'Giriş gerekli' };
    }
    if (!readingId) {
      return { success: false, reason: 'error', message: 'Okuma ID gerekli' };
    }

    try {
      const url = new URL('/api/share/claim-reward', getApiUrl());
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readingId, email }),
      });

      if (!res.ok && res.status === 401) {
        return { success: false, reason: 'no_auth', message: 'Giriş gerekli' };
      }

      const data = await res.json();

      if (data.success) {
        return {
          success: true,
          goldAwarded: data.goldAwarded ?? SHARE_CONFIG.REWARD_PER_SHARE,
          sharesRemainingToday: data.sharesRemainingToday ?? 0,
        };
      }

      return {
        success:          false,
        reason:           (data.reason as ShareRewardReason) ?? 'error',
        message:          data.message ?? 'Ödül alınamadı',
        remainingSeconds: data.remainingSeconds,
      };
    } catch {
      return { success: false, reason: 'error', message: 'Bağlantı hatası' };
    }
  },

  // Constants re-exported for convenience
  REWARD_PER_SHARE: SHARE_CONFIG.REWARD_PER_SHARE,
  MAX_DAILY_SHARES: SHARE_CONFIG.MAX_DAILY_SHARES,
  COOLDOWN_SECONDS: SHARE_CONFIG.COOLDOWN_SECONDS,
};
