import { storageService, userScopedKey } from './storageService';
import { goldService } from './goldService';

// ─── Daily Wheel Service ──────────────────────────────────────────────────────
// Reads/writes same keys as AppContext (tengri_u_spin_{email}).
// Use this outside React (e.g. notifications). In components, use useDailyWheel().

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const dailyWheelService = {
  key: (email: string) => userScopedKey(email, 'spin'),

  async getLastSpinDate(email: string): Promise<string | null> {
    return storageService.getString(dailyWheelService.key(email));
  },

  msUntilNextSpin(lastSpin: string | null): number {
    if (!lastSpin) return 0;
    const elapsed = Date.now() - new Date(lastSpin).getTime();
    return Math.max(0, ONE_DAY_MS - elapsed);
  },

  async canSpin(email: string): Promise<boolean> {
    const last = await dailyWheelService.getLastSpinDate(email);
    return dailyWheelService.msUntilNextSpin(last) === 0;
  },

  // Use this only outside React — inside React call AppContext.performSpin() instead
  async performSpin(email: string, prize: number): Promise<{ newBalance: number }> {
    const now = new Date().toISOString();
    await storageService.setString(dailyWheelService.key(email), now);
    const newBalance = await goldService.addGold(email, prize);
    return { newBalance };
  },
};
