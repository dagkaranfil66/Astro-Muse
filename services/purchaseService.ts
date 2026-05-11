import { IAP_GOLD_MAP } from '@/lib/iap';
import { GOLD_PACKAGES } from '@/constants/serviceConfig';

export type PurchaseResult =
  | { success: true;  goldToAdd: number; packageId: string; packageLabel: string }
  | { success: false; cancelled: boolean; error: string };

export const purchaseService = {
  goldForProduct(productId: string): number {
    if (IAP_GOLD_MAP[productId] !== undefined) return IAP_GOLD_MAP[productId];
    const pkg = GOLD_PACKAGES.find((p) => p.id === productId);
    return pkg ? pkg.gold + pkg.bonus : 0;
  },

  labelForProduct(productId: string): string {
    const pkg = GOLD_PACKAGES.find((p) => p.id === productId);
    return pkg?.label ?? productId;
  },
};
