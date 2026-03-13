import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import Purchases, {
  type PurchasesPackage,
  type CustomerInfo,
  type PurchasesOfferings,
  LOG_LEVEL,
} from "react-native-purchases";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ── Gold awarded per product identifier ──────────────────────────────────────
export const PACKAGE_GOLD_MAP: Record<string, number> = {
  tengri_starter:  20,
  tengri_premium:  50,
  tengri_standard: 120,
  tengri_vip:      300,
};

// ── Entitlement ID (must match RevenueCat dashboard) ─────────────────────────
export const RC_ENTITLEMENT = "altın";

// ── API key resolver ───────────────────────────────────────────────────────────
function getApiKey(): string {
  if (Platform.OS === "ios") {
    const key = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "";
    if (key) return key;
    // Fallback to test key (Expo Go / simulator)
    const test = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? "";
    if (test) {
      console.warn("[RC] iOS key missing — using TEST key");
      return test;
    }
    return "";
  }

  if (Platform.OS === "android") {
    const key = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "";
    if (key) return key;
    const test = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? "";
    if (test) {
      console.warn("[RC] Android key missing — using TEST key");
      return test;
    }
    return "";
  }

  // Web — purchases are mocked by RevenueCat SDK automatically
  return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? "";
}

// ── Context type ──────────────────────────────────────────────────────────────
interface SubscriptionCtx {
  isReady: boolean;
  customerInfo: CustomerInfo | undefined;
  offerings: PurchasesOfferings | undefined;
  packages: PurchasesPackage[];
  isLoading: boolean;
  offeringsLoading: boolean;
  offeringsError: boolean;
  refetchOfferings: () => void;
  purchase: (pkg: PurchasesPackage) => Promise<CustomerInfo>;
  restore: () => Promise<CustomerInfo>;
  isPurchasing: boolean;
  isRestoring: boolean;
  purchaseError: Error | null;
}

const Context = createContext<SubscriptionCtx | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const qc = useQueryClient();

  // Initialize RevenueCat once, safely inside useEffect
  useEffect(() => {
    console.log('REVENUECAT_INIT_START');
    async function init() {
      try {
        const apiKey = getApiKey();
        if (!apiKey) {
          console.warn("[RC] No API key found — purchases disabled. Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY in EAS secrets.");
          return;
        }

        if (Platform.OS !== "web") {
          Purchases.setLogLevel(LOG_LEVEL.WARN);
        }

        await Purchases.configure({ apiKey });
        console.log('REVENUECAT_INIT_OK platform=' + Platform.OS);
        setIsReady(true);

        // Prefetch customer info after init
        qc.invalidateQueries({ queryKey: ["rc", "customerInfo"] });
        qc.invalidateQueries({ queryKey: ["rc", "offerings"] });
      } catch (e) {
        console.error("[RC] configure failed:", e);
        // Do NOT crash — app continues without purchases
      }
    }

    init();
  }, []);

  const customerInfoQuery = useQuery<CustomerInfo>({
    queryKey: ["rc", "customerInfo"],
    queryFn: async () => {
      const info = await Purchases.getCustomerInfo();
      console.log("[RC] customerInfo fetched, activeSubscriptions:", info.activeSubscriptions);
      return info;
    },
    staleTime: 60_000,
    retry: 1,
    enabled: isReady,
  });

  const offeringsQuery = useQuery<PurchasesOfferings>({
    queryKey: ["rc", "offerings"],
    queryFn: async () => {
      const offerings = await Purchases.getOfferings();
      const pkgs = offerings.current?.availablePackages ?? [];
      if (pkgs.length === 0) {
        console.warn("[RC] No packages found — check RevenueCat dashboard.");
      } else {
        pkgs.forEach((p) =>
          console.log("[RC] Package:", p.identifier, "| price:", p.product?.priceString)
        );
      }
      return offerings;
    },
    staleTime: 0,
    retry: 2,
    retryDelay: 2000,
    enabled: isReady,
  });

  const purchaseMutation = useMutation<CustomerInfo, Error, PurchasesPackage>({
    mutationFn: async (pkg: PurchasesPackage) => {
      // This opens the real Apple/Google purchase sheet
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rc", "customerInfo"] });
    },
    onError: (e: any) => {
      if (e?.userCancelled) {
        console.log("[RC] Purchase cancelled by user");
      } else {
        console.error("[RC] Purchase error:", e);
      }
    },
  });

  const restoreMutation = useMutation<CustomerInfo, Error>({
    mutationFn: async () => {
      const info = await Purchases.restorePurchases();
      return info;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rc", "customerInfo"] });
    },
  });

  const packages = offeringsQuery.data?.current?.availablePackages ?? [];

  return (
    <Context.Provider
      value={{
        isReady,
        customerInfo:     customerInfoQuery.data,
        offerings:        offeringsQuery.data,
        packages,
        isLoading:        customerInfoQuery.isLoading || offeringsQuery.isLoading,
        offeringsLoading: offeringsQuery.isLoading,
        offeringsError:   offeringsQuery.isError,
        refetchOfferings: offeringsQuery.refetch,
        purchase:         purchaseMutation.mutateAsync,
        restore:          restoreMutation.mutateAsync,
        isPurchasing:     purchaseMutation.isPending,
        isRestoring:      restoreMutation.isPending,
        purchaseError:    purchaseMutation.error,
      }}
    >
      {children}
    </Context.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useSubscription() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useSubscription must be inside SubscriptionProvider");
  return ctx;
}
