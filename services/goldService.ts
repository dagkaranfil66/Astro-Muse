import AsyncStorage from '@react-native-async-storage/async-storage';
import { userScopedKey } from './storageService';
import { SERVICE_GOLD_COST, FREE_START_GOLD } from '@/constants/serviceConfig';

// ─── Gold Service ─────────────────────────────────────────────────────────────
// Reads/writes the SAME AsyncStorage keys as AppContext.
// Use this for one-shot operations (migrations, background tasks).
// In React components, prefer useGold() hook which syncs with AppContext state.

export const goldService = {
  key: (email: string) => userScopedKey(email, 'gold'),

  async getBalance(email: string): Promise<number> {
    const raw = await AsyncStorage.getItem(goldService.key(email));
    return raw !== null ? parseInt(raw, 10) : FREE_START_GOLD;
  },

  async setBalance(email: string, amount: number): Promise<void> {
    const clamped = Math.max(0, Math.floor(amount));
    await AsyncStorage.setItem(goldService.key(email), String(clamped));
  },

  async addGold(email: string, amount: number): Promise<number> {
    const current = await goldService.getBalance(email);
    const next = current + Math.max(0, Math.floor(amount));
    await goldService.setBalance(email, next);
    return next;
  },

  async spendGold(email: string, amount: number): Promise<{ success: boolean; balance: number }> {
    const current = await goldService.getBalance(email);
    if (current < amount) return { success: false, balance: current };
    const next = current - amount;
    await goldService.setBalance(email, next);
    return { success: true, balance: next };
  },

  async canAfford(email: string, service: string): Promise<boolean> {
    const cost = SERVICE_GOLD_COST[service] ?? 2;
    const balance = await goldService.getBalance(email);
    return balance >= cost;
  },

  getServiceCost(service: string): number {
    return SERVICE_GOLD_COST[service] ?? 2;
  },

  // Called after RevenueCat purchase completes — awards gold + updates storage
  async awardPurchaseGold(email: string, goldAmount: number): Promise<number> {
    const newBalance = await goldService.addGold(email, goldAmount);
    console.log(`[Gold] Awarded ${goldAmount} gold to ${email} after purchase. Balance: ${newBalance}`);
    return newBalance;
  },
};
