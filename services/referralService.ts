import { storageService, userScopedKey } from './storageService';

// ─── Referral Service ─────────────────────────────────────────────────────────
// Local referral system (+5 gold each).
// Production path: add POST /api/referral/claim endpoint for cross-device validation.

const REFERRAL_GOLD      = 5;
const CODE_ALPHABET      = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 confusion

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export const referralService = {
  REFERRAL_GOLD,

  // ── Own code ─────────────────────────────────────────────────────────────────
  async getMyCode(email: string): Promise<string> {
    const key = userScopedKey(email, 'referral_code');
    const existing = await storageService.getString(key);
    if (existing) return existing;
    const code = generateCode();
    await storageService.setString(key, code);
    return code;
  },

  // ── Claimed check ─────────────────────────────────────────────────────────────
  async hasClaimedReferral(email: string): Promise<boolean> {
    const val = await storageService.getString(userScopedKey(email, 'referral_claimed'));
    return val === 'true';
  },

  // ── Claim a code ─────────────────────────────────────────────────────────────
  // Returns success + message. On success, caller must call addGold() via AppContext.
  async claimReferralCode(
    myEmail: string,
    inputCode: string,
  ): Promise<{ success: boolean; message: string; goldToAdd: number }> {
    const code = inputCode.trim().toUpperCase();

    if (code.length !== 6) {
      return { success: false, message: 'Kod 6 karakter olmalı', goldToAdd: 0 };
    }

    // Anti-abuse: already claimed
    if (await referralService.hasClaimedReferral(myEmail)) {
      return { success: false, message: 'Zaten bir davet kodu kullandın', goldToAdd: 0 };
    }

    // Can't use own code
    const myCode = await referralService.getMyCode(myEmail);
    if (code === myCode) {
      return { success: false, message: 'Kendi kodunu kullanamazsın 😄', goldToAdd: 0 };
    }

    // Mark as claimed
    await storageService.setString(userScopedKey(myEmail, 'referral_claimed'), 'true');

    // Production: call backend here to validate code + reward referrer across devices.
    // For now: reward this user locally.
    return {
      success:   true,
      message:   `+${REFERRAL_GOLD} altın kazandın! Kod geçerli. ✦`,
      goldToAdd: REFERRAL_GOLD,
    };
  },
};
