import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";

// ── Product IDs (Google Play Console'da tanımlı consumable ürünler) ────────────
export const IAP_PRODUCT_IDS = [
  "tengri_20_gold",
  "tengri_50_gold",
  "tengri_120_gold",
  "tengri_300_gold",
];

// ── Gold miktarları ────────────────────────────────────────────────────────────
export const IAP_GOLD_MAP: Record<string, number> = {
  tengri_20_gold:  20,
  tengri_50_gold:  55,   // 50 + 5 bonus
  tengri_120_gold: 140,  // 120 + 20 bonus
  tengri_300_gold: 360,  // 300 + 60 bonus
};

export const IAP_PACKAGE_ORDER = [
  "tengri_20_gold",
  "tengri_50_gold",
  "tengri_120_gold",
  "tengri_300_gold",
];

export function resolveGoldForProduct(productId: string): number {
  const direct = IAP_GOLD_MAP[productId];
  if (direct) return direct;
  const m = productId.match(/(\d+)/);
  const base = m ? parseInt(m[1], 10) : 0;
  if (base === 50) return 55;
  if (base === 120) return 140;
  if (base === 300) return 360;
  return base;
}

// ── Context ────────────────────────────────────────────────────────────────────
interface IAPCtx {
  isReady: boolean;
  products: any[];
  isLoading: boolean;
  isPurchasing: boolean;
  purchaseError: string | null;
  purchase: (productId: string) => Promise<number>;
  refetch: () => void;
}

const Context = createContext<IAPCtx | null>(null);

const IS_WEB = Platform.OS === "web";

// Lazy-load react-native-iap so a native init crash doesn't kill the whole app
function getRNIap() {
  try {
    return require("react-native-iap");
  } catch (e) {
    console.warn("[IAP] react-native-iap could not be loaded:", e);
    return null;
  }
}

export function IAPProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const initIAP = useCallback(async () => {
    if (IS_WEB) {
      setIsReady(true);
      return;
    }

    const RNIap = getRNIap();
    if (!RNIap) {
      console.warn("[IAP] Skipping IAP init — module not available");
      setIsReady(true);
      return;
    }

    try {
      setIsLoading(true);
      await RNIap.initConnection();
      console.log("[IAP] Connection initialized");
      try {
        const prods = await RNIap.getProducts({ skus: IAP_PRODUCT_IDS });
        console.log("[IAP] Products loaded:", prods.map((p: any) => p.productId));
        setProducts(prods);
      } catch (prodErr: any) {
        console.warn("[IAP] getProducts failed (non-fatal):", prodErr?.message ?? prodErr);
      }
      setIsReady(true);
    } catch (e: any) {
      console.error("[IAP] initConnection error:", e?.message ?? e);
      setIsReady(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initIAP();

    let purchaseUpdateSub: any;
    let purchaseErrorSub: any;

    if (!IS_WEB) {
      const RNIap = getRNIap();
      if (RNIap) {
        try {
          purchaseUpdateSub = RNIap.purchaseUpdatedListener(async (purchase: any) => {
            console.log("[IAP] purchaseUpdatedListener:", purchase.productId, purchase.transactionId);
            const receipt = purchase.transactionReceipt;
            if (receipt) {
              try {
                await RNIap.finishTransaction({ purchase, isConsumable: true });
                console.log("[IAP] Transaction finished:", purchase.transactionId);
              } catch (e) {
                console.error("[IAP] finishTransaction error:", e);
              }
            }
          });
        } catch (e) {
          console.warn("[IAP] purchaseUpdatedListener setup failed:", e);
        }

        try {
          purchaseErrorSub = RNIap.purchaseErrorListener((error: any) => {
            console.error("[IAP] purchaseErrorListener:", error.message, "code:", error.code);
          });
        } catch (e) {
          console.warn("[IAP] purchaseErrorListener setup failed:", e);
        }
      }
    }

    return () => {
      try { purchaseUpdateSub?.remove(); } catch {}
      try { purchaseErrorSub?.remove(); } catch {}
      if (!IS_WEB) {
        const RNIap = getRNIap();
        if (RNIap) {
          try { RNIap.endConnection(); } catch {}
        }
      }
    };
  }, [initIAP]);

  const purchase = useCallback(async (productId: string): Promise<number> => {
    if (IS_WEB) throw new Error("IAP not available on web");

    const RNIap = getRNIap();
    if (!RNIap) throw new Error("IAP module not available");

    setPurchaseError(null);
    setIsPurchasing(true);
    try {
      console.log("[IAP] Requesting purchase:", productId);
      await RNIap.requestPurchase({ sku: productId });
      const gold = resolveGoldForProduct(productId);
      console.log("[IAP] Purchase success, gold:", gold);
      return gold;
    } catch (e: any) {
      if (e?.code === "E_USER_CANCELLED") {
        throw new Error("cancelled");
      }
      const msg = e?.message ?? "Purchase failed";
      setPurchaseError(msg);
      console.error("[IAP] Purchase error:", msg);
      throw e;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const refetch = useCallback(() => {
    initIAP();
  }, [initIAP]);

  return (
    <Context.Provider value={{ isReady, products, isLoading, isPurchasing, purchaseError, purchase, refetch }}>
      {children}
    </Context.Provider>
  );
}

export function useIAP() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useIAP must be inside IAPProvider");
  return ctx;
}
