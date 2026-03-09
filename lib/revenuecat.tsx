import React, { createContext, useContext } from "react";
import { Platform } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import { useMutation, useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";

const TEST_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? "";
const IOS_KEY  = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "";
const DROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "";

export const RC_ENTITLEMENT = "altın";

// Map RevenueCat package lookup_key → total gold amount (base + bonus)
export const PACKAGE_GOLD_MAP: Record<string, number> = {
  tengri_basic:    20,
  tengri_plus:     55,
  tengri_premium:  140,
  tengri_vip:      360,
};

function getApiKey(): string {
  if (!TEST_KEY || !IOS_KEY || !DROID_KEY) {
    console.warn("[RevenueCat] API keys not configured");
    return TEST_KEY;
  }
  if (__DEV__ || Platform.OS === "web" || Constants.executionEnvironment === "storeClient") {
    return TEST_KEY;
  }
  if (Platform.OS === "ios") return IOS_KEY;
  if (Platform.OS === "android") return DROID_KEY;
  return TEST_KEY;
}

let _rcInitialized = false;
export function initializeRevenueCat() {
  if (_rcInitialized) return;
  try {
    const apiKey = getApiKey();
    if (!apiKey) return;
    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });
    _rcInitialized = true;
    console.log("[RevenueCat] Configured");
  } catch (e) {
    console.warn("[RevenueCat] Init error:", e);
  }
}

function useSubscriptionContext() {
  const customerInfoQuery = useQuery({
    queryKey: ["revenuecat", "customerInfo"],
    queryFn: () => Purchases.getCustomerInfo(),
    staleTime: 60_000,
    retry: 1,
  });

  const offeringsQuery = useQuery({
    queryKey: ["revenuecat", "offerings"],
    queryFn: () => Purchases.getOfferings(),
    staleTime: 0,
    retry: 2,
    retryDelay: 1000,
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
    customerInfo: customerInfoQuery.data,
    offerings: offeringsQuery.data,
    packages,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
    offeringsError: offeringsQuery.isError,
    refetchOfferings: offeringsQuery.refetch,
    purchase: purchaseMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    purchaseError: purchaseMutation.error,
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
