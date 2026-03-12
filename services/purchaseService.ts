import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { PACKAGE_GOLD_MAP } from '@/lib/revenuecat';
import { GOLD_PACKAGES } from '@/constants/serviceConfig';

// ─── Purchase Service ─────────────────────────────────────────────────────────
// Wraps RevenueCat. Caller is responsible for calling addGold() via AppContext
// after a successful purchase to update React state.

export type PurchaseResult =
  | { success: true;  goldToAdd: number; packageId: string; packageLabel: string }
  | { success: false; cancelled: boolean; error: string };

export const purchaseService = {
  // Gold amount for a given RC package identifier
  goldForPackage(packageId: string): number {
    // Try PACKAGE_GOLD_MAP first (RC identifiers)
    if (PACKAGE_GOLD_MAP[packageId] !== undefined) return PACKAGE_GOLD_MAP[packageId];
    // Fallback: match by id in GOLD_PACKAGES (includes bonus)
    const pkg = GOLD_PACKAGES.find((p) => p.id === packageId);
    return pkg ? pkg.gold + pkg.bonus : 0;
  },

  labelForPackage(packageId: string): string {
    const pkg = GOLD_PACKAGES.find((p) => p.id === packageId);
    return pkg?.label ?? packageId;
  },

  async purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
    try {
      await Purchases.purchasePackage(pkg);
      const packageId = pkg.identifier;
      const goldToAdd = purchaseService.goldForPackage(packageId);
      return {
        success:      true,
        goldToAdd,
        packageId,
        packageLabel: purchaseService.labelForPackage(packageId),
      };
    } catch (e: any) {
      if (e?.userCancelled) {
        return { success: false, cancelled: true, error: 'İptal edildi' };
      }
      console.error('[Purchase] Error:', e);
      return { success: false, cancelled: false, error: e?.message ?? 'Satın alma başarısız' };
    }
  },

  async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    try {
      await Purchases.restorePurchases();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'Geri yükleme başarısız' };
    }
  },
};
