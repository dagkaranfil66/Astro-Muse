import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import Purchases, {
  type PurchasesPackage,
  type CustomerInfo,
  type PurchasesOfferings,
  LOG_LEVEL,
} from "react-native-purchases";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ── Gold awarded per identifier ───────────────────────────────────────────────
// Keyed by BOTH RC package identifier (e.g. "gold_20") AND product identifier
// (e.g. "tengri_gold_20") so lookups work regardless of which is used.
// Values are TOTAL gold including bonus.
export const PACKAGE_GOLD_MAP: Record<string, number> = {
  // RC package identifiers (used by rcPkg.identifier)
  gold_20:  20,
  gold_50:  55,   // 50 + 5 bonus
  gold_120: 140,  // 120 + 20 bonus
  gold_300: 360,  // 300 + 60 bonus
  // Product identifiers (used by rcPkg.product.identifier) — fallback
  tengri_gold_20:  20,
  tengri_gold_50:  55,
  tengri_gold_120: 140,
  tengri_gold_300: 360,
};

// ── Expected product IDs (for diagnostic comparison) ─────────────────────────
export const EXPECTED_PRODUCT_IDS = [
  "tengri_gold_20",
  "tengri_gold_50",
  "tengri_gold_120",
  "tengri_gold_300",
];

// ── RC package identifier order (cheapest → most expensive) ──────────────────
export const RC_PACKAGE_ORDER = ["gold_20", "gold_50", "gold_120", "gold_300"];

// ── Entitlement ID (must match RevenueCat dashboard) ─────────────────────────
export const RC_ENTITLEMENT = "altın";

// ── API key resolver ───────────────────────────────────────────────────────────
function getApiKey(): { key: string; source: string } {
  if (Platform.OS === "ios") {
    const key = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "";
    if (key) return { key, source: "EXPO_PUBLIC_REVENUECAT_IOS_API_KEY" };
    const test = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? "";
    if (test) return { key: test, source: "EXPO_PUBLIC_REVENUECAT_TEST_API_KEY (fallback)" };
    return { key: "", source: "NONE" };
  }
  if (Platform.OS === "android") {
    const key = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "";
    if (key) return { key, source: "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY" };
    const test = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? "";
    if (test) return { key: test, source: "EXPO_PUBLIC_REVENUECAT_TEST_API_KEY (fallback)" };
    return { key: "", source: "NONE" };
  }
  const test = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? "";
  return { key: test, source: `TEST (web/other platform: ${Platform.OS})` };
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
  offeringsEmpty: boolean;
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

  useEffect(() => {
    const { key: apiKey, source } = getApiKey();

    console.log("RevenueCat init başladı");
    console.log("=== [RC] INIT START ===");
    console.log("[RC] Platform:", Platform.OS);
    console.log("[RC] API key source:", source);
    console.log("[RC] API key prefix:", apiKey ? apiKey.slice(0, 12) + "..." : "(none)");
    console.log("[RC] Expected product IDs:", EXPECTED_PRODUCT_IDS.join(", "));

    // Safety timeout: if RC doesn't init within 10s, unblock the UI
    const initTimeout = setTimeout(() => {
      console.warn("[RC] ⚠️ INIT TIMEOUT (10s) — forcing isReady=true to unblock UI");
      setIsReady(true);
    }, 10000);

    async function init() {
      try {
        if (!apiKey) {
          console.error("[RC] ❌ NO API KEY FOUND");
          console.error("[RC]    → Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY in EAS secrets for iOS builds");
          clearTimeout(initTimeout);
          setIsReady(true);
          return;
        }

        if (Platform.OS !== "web") {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
          console.log("[RC] Debug logging enabled");
        }

        console.log("[RC] Calling Purchases.configure()...");
        await Purchases.configure({ apiKey });
        console.log("[RC] ✅ configure() SUCCESS");
        clearTimeout(initTimeout);
        setIsReady(true);

        qc.invalidateQueries({ queryKey: ["rc", "customerInfo"] });
        qc.invalidateQueries({ queryKey: ["rc", "offerings"] });
      } catch (e: any) {
        console.error("[RC] ❌ configure() FAILED:", e?.message ?? e);
        console.error("[RC]    Code:", e?.code);
        console.error("[RC]    Full error:", JSON.stringify(e, null, 2));
        clearTimeout(initTimeout);
        setIsReady(true);
      }
    }

    init();
    return () => clearTimeout(initTimeout);
  }, []);

  const customerInfoQuery = useQuery<CustomerInfo>({
    queryKey: ["rc", "customerInfo"],
    queryFn: async () => {
      console.log("[RC] getCustomerInfo() called");
      const info = await Purchases.getCustomerInfo();
      console.log("[RC] getCustomerInfo() success, activeSubscriptions:", info.activeSubscriptions);
      return info;
    },
    staleTime: 60_000,
    retry: 1,
    enabled: isReady,
  });

  const offeringsQuery = useQuery<PurchasesOfferings>({
    queryKey: ["rc", "offerings"],
    queryFn: async () => {
      console.log("=== [RC] getOfferings() CALLED ===");

      const offeringsPromise = Purchases.getOfferings();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("[RC] getOfferings() timed out after 10s")), 10000)
      );

      let offerings: PurchasesOfferings;
      try {
        offerings = await Promise.race([offeringsPromise, timeoutPromise]);
      } catch (e: any) {
        console.error("[RC] ❌ getOfferings() ERROR:", e?.message ?? e);
        console.error("[RC]    Code:", e?.code);
        console.error("[RC]    underlyingError:", e?.underlyingErrorMessage ?? e?.userInfo);
        throw e;
      }

      // ── User-requested debug logs ──
      console.log("RevenueCat offerings:", offerings);
      console.log("Current offering:", offerings?.current?.identifier);
      console.log(
        "Available packages:",
        offerings?.current?.availablePackages?.map((p) => ({
          identifier: p.identifier,
          productId: p.product.identifier,
          priceString: p.product.priceString,
          title: p.product.title,
        }))
      );

      if (!offerings.current) {
        console.log("No offerings returned from RevenueCat");
      }

      if (offerings.current) {
        console.log("Packages:", offerings.current.availablePackages);
      }

      // ── Full diagnostic dump ──
      const allOfferingKeys = Object.keys(offerings.all ?? {});
      console.log("[RC] ── OFFERINGS DIAGNOSTIC ──");
      console.log("[RC] offerings.current:", offerings.current ? offerings.current.identifier : "null ← NO CURRENT OFFERING");
      console.log("[RC] offerings.all keys:", allOfferingKeys.length > 0 ? allOfferingKeys.join(", ") : "(empty)");

      if (offerings.current) {
        const pkgs = offerings.current.availablePackages;
        console.log("[RC] currentOffering.availablePackages count:", pkgs.length);
        if (pkgs.length === 0) {
          console.error("[RC] ❌ Current offering has 0 packages");
          console.error("[RC]    → Check: RC Dashboard → Offerings → Add packages to current offering");
        }
        pkgs.forEach((p, i) => {
          console.log(`[RC]   [${i}] identifier: ${p.identifier}`);
          console.log(`[RC]       product.identifier: ${p.product.identifier}`);
          console.log(`[RC]       product.priceString: ${p.product.priceString}`);
          console.log(`[RC]       product.title: ${p.product.title}`);
          const expected = EXPECTED_PRODUCT_IDS.includes(p.product.identifier);
          if (!expected) {
            console.warn(`[RC]       ⚠️ Product ID mismatch! "${p.product.identifier}" not in expected list`);
          }
        });

        // Check which expected IDs are missing
        const foundIds = pkgs.map(p => p.product.identifier);
        const missing = EXPECTED_PRODUCT_IDS.filter(id => !foundIds.includes(id));
        if (missing.length > 0) {
          console.warn("[RC] ⚠️ Missing expected product IDs:", missing.join(", "));
          console.warn("[RC]    → These products may be missing from App Store Connect or RC offering");
        } else {
          console.log("[RC] ✅ All expected product IDs found");
        }
      } else {
        console.error("[RC] ❌ offerings.current is null");
        console.error("[RC]    CAUSE 1: No offering set as 'Current' in RC Dashboard");
        console.error("[RC]    CAUSE 2: API key pointing to wrong RC project");
        console.error("[RC]    CAUSE 3: App Store Connect products not yet approved");
        console.error("[RC] Full offerings JSON:", JSON.stringify(offerings));
      }

      return offerings;
    },
    staleTime: 0,
    retry: 2,
    retryDelay: (attempt) => {
      const delay = attempt === 0 ? 2000 : 5000;
      console.log(`[RC] Retrying getOfferings (attempt ${attempt + 1}) in ${delay}ms...`);
      return delay;
    },
    enabled: isReady,
  });

  const purchaseMutation = useMutation<CustomerInfo, Error, PurchasesPackage>({
    mutationFn: async (pkg: PurchasesPackage) => {
      console.log("[RC] purchasePackage:", pkg.identifier, pkg.product.priceString);
      const result = await Purchases.purchasePackage(pkg);
      console.log("Purchase result:", result);
      console.log("Customer info:", result.customerInfo);
      return result.customerInfo;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rc", "customerInfo"] });
    },
    onError: (e: any) => {
      if (e?.userCancelled) {
        console.log("[RC] Purchase cancelled by user");
      } else {
        console.error("[RC] ❌ Purchase error:", e?.message ?? e, "code:", e?.code);
      }
    },
  });

  const restoreMutation = useMutation<CustomerInfo, Error>({
    mutationFn: async () => {
      console.log("[RC] restorePurchases() called");
      const info = await Purchases.restorePurchases();
      console.log("[RC] restorePurchases() success");
      return info;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rc", "customerInfo"] });
    },
  });

  const packages = offeringsQuery.data?.current?.availablePackages ?? [];

  // offeringsEmpty: query finished (no loading, no error) but packages is still 0
  const offeringsEmpty =
    !offeringsQuery.isLoading &&
    !offeringsQuery.isError &&
    offeringsQuery.isFetched &&
    packages.length === 0;

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
        offeringsEmpty,
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
