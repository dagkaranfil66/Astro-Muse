import React, { createContext, useContext } from "react";
import { Platform } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import { useMutation, useQuery } from "@tanstack/react-query";

const TEST_KEY  = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY  ?? "";
const IOS_KEY   = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY   ?? "";
const DROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "";

export const RC_ENTITLEMENT = "altın";

export const PACKAGE_GOLD_MAP: Record<string, number> = {
  tengri_starter:  20,
  tengri_premium:  50,
  tengri_standard: 120,
  tengri_vip:      300,
};

function getApiKey(): string {
  if (Platform.OS === "ios") {
    if (IOS_KEY) {
      console.log("[RC] Key source: iOS →", IOS_KEY.slice(0, 12) + "...");
      return IOS_KEY;
    }
    console.warn("[RC] EXPO_PUBLIC_REVENUECAT_IOS_API_KEY is empty — falling back to TEST key");
    if (!TEST_KEY) throw new Error("[RC] No API key available for iOS. Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY.");
    console.log("[RC] Key source: TEST (fallback for iOS) →", TEST_KEY.slice(0, 12) + "...");
    return TEST_KEY;
  }

  if (Platform.OS === "android") {
    if (DROID_KEY) {
      console.log("[RC] Key source: Android →", DROID_KEY.slice(0, 12) + "...");
      return DROID_KEY;
    }
    console.warn("[RC] EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY is empty — falling back to TEST key");
    if (!TEST_KEY) throw new Error("[RC] No API key available for Android. Set EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY.");
    console.log("[RC] Key source: TEST (fallback for Android) →", TEST_KEY.slice(0, 12) + "...");
    return TEST_KEY;
  }

  // Web / other — TEST key only (purchases are mocked on web)
  if (TEST_KEY) {
    console.log("[RC] Key source: TEST (web/other platform:", Platform.OS, ") →", TEST_KEY.slice(0, 12) + "...");
    return TEST_KEY;
  }
  console.warn("[RC] EXPO_PUBLIC_REVENUECAT_TEST_API_KEY is empty — purchases disabled on web");
  return "";
}

let _rcInitialized = false;

export function initializeRevenueCat() {
  if (_rcInitialized) return;
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error("[RC] apiKey is EMPTY — RevenueCat NOT configured. Check EXPO_PUBLIC_REVENUECAT_* secrets.");
      return;
    }
    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    console.log("[RC] Calling Purchases.configure()...");
    Purchases.configure({ apiKey });
    _rcInitialized = true;
    console.log("[RC] Purchases.configure() SUCCESS ✓");
  } catch (e) {
    console.error("[RC] initializeRevenueCat error:", e);
  }
}

function useSubscriptionContext() {
  const customerInfoQuery = useQuery({
    queryKey: ["revenuecat", "customerInfo"],
    queryFn: async () => {
      console.log("[RC] getCustomerInfo() called");
      const info = await Purchases.getCustomerInfo();
      console.log("[RC] getCustomerInfo() success, activeSubscriptions:", info.activeSubscriptions);
      return info;
    },
    staleTime: 60_000,
    retry: 1,
    enabled: _rcInitialized,
  });

  const offeringsQuery = useQuery({
    queryKey: ["revenuecat", "offerings"],
    queryFn: async () => {
      console.log("[RC] getOfferings() called");
      const offerings = await Purchases.getOfferings();
      const pkgs = offerings.current?.availablePackages ?? [];
      console.log("[RC] getOfferings() success — availablePackages count:", pkgs.length);
      if (pkgs.length === 0) {
        console.warn("[RC] availablePackages is EMPTY. Full offerings response:", JSON.stringify(offerings, null, 2));
      } else {
        pkgs.forEach((p) =>
          console.log("[RC] Package →", p.identifier, "| price:", p.product?.priceString, "| productId:", p.product?.identifier)
        );
      }
      return offerings;
    },
    staleTime: 0,
    retry: 2,
    retryDelay: 1000,
    enabled: _rcInitialized,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    },
    onSuccess: () => customerInfoQuery.refetch(),
  });

  const restoreMutation = useMutation({
    mutationFn: () => Purchases.restorePurchases(),
    onSuccess: () => customerInfoQuery.refetch(),
  });

  const packages = offeringsQuery.data?.current?.availablePackages ?? [];

  return {
    customerInfo:    customerInfoQuery.data,
    offerings:       offeringsQuery.data,
    packages,
    isLoading:       customerInfoQuery.isLoading || offeringsQuery.isLoading,
    offeringsLoading: offeringsQuery.isLoading,
    offeringsError:  offeringsQuery.isError,
    refetchOfferings: offeringsQuery.refetch,
    purchase:        purchaseMutation.mutateAsync,
    restore:         restoreMutation.mutateAsync,
    isPurchasing:    purchaseMutation.isPending,
    isRestoring:     restoreMutation.isPending,
    purchaseError:   purchaseMutation.error,
  };
}

type SubscriptionCtx = ReturnType<typeof useSubscriptionContext>;
const Context = createContext<SubscriptionCtx | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const value = useSubscriptionContext();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSubscription() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useSubscription must be inside SubscriptionProvider");
  return ctx;
}
