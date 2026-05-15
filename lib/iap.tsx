import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";

// ── Product IDs ────────────────────────────────────────────────────────────────
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

function getRNIap() {
  try {
    return require("react-native-iap");
  } catch (e) {
    console.warn("[IAP] react-native-iap could not be loaded:", e);
    return null;
  }
}

interface PendingPurchase {
  productId: string;
  resolve: (gold: number) => void;
  reject: (err: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

export function IAPProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Pending purchase: set by purchase(), resolved/rejected by listeners
  const pendingRef = useRef<PendingPurchase | null>(null);

  // ── Finish a transaction safely (consume + acknowledge) ────────────────────
  const finishPurchase = useCallback(async (RNIap: any, purchase: any) => {
    const receipt = purchase.transactionReceipt ?? purchase.purchaseToken;
    if (!receipt) {
      console.warn("[IAP] No receipt on purchase, skipping finishTransaction:", purchase.productId);
      return;
    }
    try {
      await RNIap.finishTransaction({ purchase, isConsumable: true });
      console.log("[IAP] ✅ finishTransaction OK:", purchase.productId, purchase.transactionId);
    } catch (e: any) {
      // Already consumed is fine — purchase was already handled
      const msg = e?.message ?? String(e);
      if (msg.includes("already") || msg.includes("consumed")) {
        console.log("[IAP] ℹ️ Already consumed:", purchase.productId);
      } else {
        console.error("[IAP] ❌ finishTransaction error:", msg, "product:", purchase.productId);
      }
    }
  }, []);

  // ── Init connection + load products ───────────────────────────────────────
  const initIAP = useCallback(async () => {
    if (IS_WEB) {
      setIsReady(true);
      return;
    }

    const RNIap = getRNIap();
    if (!RNIap) {
      console.warn("[IAP] Module not available, skipping init");
      setIsReady(true);
      return;
    }

    try {
      setIsLoading(true);
      console.log("[IAP] Initializing connection...");
      await RNIap.initConnection();
      console.log("[IAP] ✅ Connection initialized");

      // ── Load products ────────────────────────────────────────────────────
      try {
        const prods = await RNIap.getProducts({ skus: IAP_PRODUCT_IDS });
        console.log("[IAP] Products loaded:", prods.length, prods.map((p: any) => p.productId));
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

  // ── Setup listeners + init ─────────────────────────────────────────────────
  // CRITICAL: Listeners MUST be set up BEFORE initConnection().
  // On Android, initConnection() triggers purchaseUpdatedListener for any
  // pending/unacknowledged purchases from previous sessions.
  // If listeners aren't ready, those callbacks are missed → "stuck processing".
  useEffect(() => {
    if (IS_WEB) {
      initIAP();
      return;
    }

    const RNIap = getRNIap();
    if (!RNIap) {
      initIAP();
      return;
    }

    let purchaseUpdateSub: any;
    let purchaseErrorSub: any;

    // ── 1. Purchase updated listener (success) ───────────────────────────────
    try {
      purchaseUpdateSub = RNIap.purchaseUpdatedListener(async (purchase: any) => {
        console.log("[IAP] 🔔 purchaseUpdatedListener fired:", purchase.productId,
          "state:", purchase.purchaseStateAndroid, "txn:", purchase.transactionId);

        // ALWAYS finish/consume the transaction — this unblocks Google Play's
        // "İşleminiz gerçekleştiriyor" screen
        await finishPurchase(RNIap, purchase);

        // Resolve the active purchase promise if product matches
        const pending = pendingRef.current;
        if (pending && pending.productId === purchase.productId) {
          console.log("[IAP] ✅ Resolving pending purchase:", purchase.productId);
          clearTimeout(pending.timeout);
          pendingRef.current = null;
          const gold = resolveGoldForProduct(purchase.productId);
          pending.resolve(gold);
        } else if (pending) {
          console.warn("[IAP] Product mismatch — pending:", pending.productId, "got:", purchase.productId);
        } else {
          // No pending promise — purchase came from a previous session.
          // Gold was likely already given; just consuming is correct.
          console.log("[IAP] ℹ️ No pending promise for:", purchase.productId, "(previous session purchase)");
        }
      });
      console.log("[IAP] purchaseUpdatedListener registered");
    } catch (e) {
      console.warn("[IAP] purchaseUpdatedListener setup failed:", e);
    }

    // ── 2. Purchase error listener ───────────────────────────────────────────
    try {
      purchaseErrorSub = RNIap.purchaseErrorListener((error: any) => {
        console.error("[IAP] 🔔 purchaseErrorListener:", error?.code, error?.message);

        const pending = pendingRef.current;
        if (pending) {
          clearTimeout(pending.timeout);
          pendingRef.current = null;
          if (error?.code === "E_USER_CANCELLED") {
            console.log("[IAP] User cancelled purchase");
            pending.reject(new Error("cancelled"));
          } else {
            const msg = error?.message ?? "Purchase failed";
            setPurchaseError(msg);
            pending.reject(new Error(msg));
          }
        }
      });
      console.log("[IAP] purchaseErrorListener registered");
    } catch (e) {
      console.warn("[IAP] purchaseErrorListener setup failed:", e);
    }

    // ── 3. NOW init connection (after listeners are ready) ───────────────────
    initIAP();

    return () => {
      try { purchaseUpdateSub?.remove(); } catch {}
      try { purchaseErrorSub?.remove(); } catch {}
      try { RNIap.endConnection(); } catch {}
    };
  }, [initIAP, finishPurchase]);

  // ── Purchase function ──────────────────────────────────────────────────────
  const purchase = useCallback(async (productId: string): Promise<number> => {
    if (IS_WEB) throw new Error("IAP not available on web");

    const RNIap = getRNIap();
    if (!RNIap) throw new Error("IAP module not available");

    // Cancel any leftover pending purchase
    if (pendingRef.current) {
      console.warn("[IAP] Cancelling previous pending purchase:", pendingRef.current.productId);
      clearTimeout(pendingRef.current.timeout);
      pendingRef.current.reject(new Error("cancelled"));
      pendingRef.current = null;
    }

    setPurchaseError(null);
    setIsPurchasing(true);

    return new Promise<number>((resolve, reject) => {
      // 90-second timeout — Google Play dialog can be slow
      const timeout = setTimeout(() => {
        if (pendingRef.current?.productId === productId) {
          console.error("[IAP] ⏰ Purchase timed out:", productId);
          pendingRef.current = null;
          setIsPurchasing(false);
          reject(new Error("Purchase timed out. Please try again."));
        }
      }, 90_000);

      pendingRef.current = {
        productId,
        resolve: (gold) => {
          setIsPurchasing(false);
          resolve(gold);
        },
        reject: (err) => {
          setIsPurchasing(false);
          if (err.message !== "cancelled") {
            setPurchaseError(err.message);
          }
          reject(err);
        },
        timeout,
      };

      console.log("[IAP] 🛒 Calling requestPurchase:", productId);
      // Note: requestPurchase is fire-and-forget on Android.
      // The result comes via purchaseUpdatedListener / purchaseErrorListener.
      try {
        RNIap.requestPurchase({ sku: productId });
      } catch (e: any) {
        clearTimeout(timeout);
        pendingRef.current = null;
        setIsPurchasing(false);
        const msg = e?.message ?? "Purchase failed";
        console.error("[IAP] ❌ requestPurchase threw synchronously:", msg);
        setPurchaseError(msg);
        reject(new Error(msg));
      }
    });
  }, []);

  const refetch = useCallback(() => {
    setProducts([]);
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
