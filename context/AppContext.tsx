import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FREE_START_GOLD, SERVICE_GOLD_COST } from '@/constants/serviceConfig';

export interface Reading {
  id: string;
  service: string;
  serviceLabel: string;
  content: string;
  date: string;
  userInput?: string;
  goldSpent?: number;
}

export interface UserProfile {
  name: string;
  email: string;
  joinDate: string;
}

interface AppContextValue {
  goldBalance: number;
  readings: Reading[];
  userProfile: UserProfile | null;
  profilePhotoUri: string | null;
  setProfilePhoto: (uri: string | null) => Promise<void>;
  isLoaded: boolean;
  hasSeenOnboarding: boolean;
  markOnboardingDone: () => Promise<void>;
  canAfford: (service: string) => boolean;
  spendGold: (service: string) => boolean;
  addGold: (amount: number) => void;
  addReading: (reading: Omit<Reading, 'id' | 'date'>) => Promise<void>;
  setUserProfile: (profile: UserProfile) => Promise<void>;
  clearUserProfile: () => Promise<void>;
  getServiceCost: (service: string) => number;
  totalSpent: number;
  canSpin: boolean;
  lastSpinDate: string | null;
  performSpin: (prize: number) => Promise<void>;
  isPurchased: boolean;
  remainingReadings: number;
  consumeTrial: () => void;
  purchase: () => void;
  zodiacSign: string | null;
  setZodiacSign: (sign: string) => Promise<void>;
  canDailyFree: boolean;
  markDailyFreeUsed: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const KEYS = {
  gold: 'tengri_gold_v2',
  readings: 'tengri_readings',
  profile: 'tengri_profile',
  profilePhoto: 'tengri_profile_photo',
  lastSpin: 'tengri_last_spin',
  trialCount: 'tengri_trial_count',
  isPurchased: 'tengri_is_purchased',
  zodiac: 'tengri_zodiac',
  dailyFree: 'tengri_daily_free',
  onboarding: 'tengri_onboarding_done',
};

function isSpinAvailable(lastSpin: string | null): boolean {
  if (!lastSpin) return true;
  const last = new Date(lastSpin).getTime();
  const now = Date.now();
  return now - last >= 24 * 60 * 60 * 1000;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [goldBalance, setGoldBalance] = useState(FREE_START_GOLD);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [userProfile, setProfileState] = useState<UserProfile | null>(null);
  const [profilePhotoUri, setProfilePhotoState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSpinDate, setLastSpinDate] = useState<string | null>(null);
  const [lastDailyFreeDate, setLastDailyFreeDateState] = useState<string | null>(null);
  const [trialCount, setTrialCount] = useState(0);
  const [isPurchased, setIsPurchased] = useState(false);
  const [zodiacSign, setZodiacState] = useState<string | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [goldStr, readStr, profStr, photoStr, spinStr, tcStr, ipStr, zodStr, dfStr, obStr] = await Promise.all([
          AsyncStorage.getItem(KEYS.gold),
          AsyncStorage.getItem(KEYS.readings),
          AsyncStorage.getItem(KEYS.profile),
          AsyncStorage.getItem(KEYS.profilePhoto),
          AsyncStorage.getItem(KEYS.lastSpin),
          AsyncStorage.getItem(KEYS.trialCount),
          AsyncStorage.getItem(KEYS.isPurchased),
          AsyncStorage.getItem(KEYS.zodiac),
          AsyncStorage.getItem(KEYS.dailyFree),
          AsyncStorage.getItem(KEYS.onboarding),
        ]);
        if (goldStr !== null) setGoldBalance(parseInt(goldStr, 10));
        if (readStr) setReadings(JSON.parse(readStr));
        if (profStr) setProfileState(JSON.parse(profStr));
        if (photoStr) setProfilePhotoState(photoStr);
        if (spinStr) setLastSpinDate(spinStr);
        if (tcStr) setTrialCount(parseInt(tcStr, 10));
        if (ipStr) setIsPurchased(ipStr === 'true');
        if (zodStr) setZodiacState(zodStr);
        if (dfStr) setLastDailyFreeDateState(dfStr);
        if (obStr === 'true') setHasSeenOnboarding(true);
      } catch (e) {
        console.error('AppContext load error', e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const getServiceCost = (service: string) => SERVICE_GOLD_COST[service] ?? 2;

  const canAfford = (service: string) => goldBalance >= getServiceCost(service);

  const spendGold = (service: string): boolean => {
    const cost = getServiceCost(service);
    if (goldBalance < cost) return false;
    const next = goldBalance - cost;
    setGoldBalance(next);
    AsyncStorage.setItem(KEYS.gold, String(next));
    return true;
  };

  const addGold = (amount: number) => {
    const next = goldBalance + amount;
    setGoldBalance(next);
    AsyncStorage.setItem(KEYS.gold, String(next));
  };

  const addReading = async (reading: Omit<Reading, 'id' | 'date'>) => {
    const newReading: Reading = {
      ...reading,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      goldSpent: getServiceCost(reading.service),
    };
    const updated = [newReading, ...readings];
    setReadings(updated);
    await AsyncStorage.setItem(KEYS.readings, JSON.stringify(updated));
  };

  const setUserProfile = async (profile: UserProfile) => {
    setProfileState(profile);
    await AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile));
  };

  const clearUserProfile = async () => {
    setProfileState(null);
    setProfilePhotoState(null);
    await Promise.all([
      AsyncStorage.removeItem(KEYS.profile),
      AsyncStorage.removeItem(KEYS.profilePhoto),
    ]);
  };

  const setProfilePhoto = async (uri: string | null) => {
    setProfilePhotoState(uri);
    if (uri) {
      await AsyncStorage.setItem(KEYS.profilePhoto, uri);
    } else {
      await AsyncStorage.removeItem(KEYS.profilePhoto);
    }
  };

  const canSpin = isSpinAvailable(lastSpinDate);
  const canDailyFree = isSpinAvailable(lastDailyFreeDate);

  const markDailyFreeUsed = async () => {
    const now = new Date().toISOString();
    setLastDailyFreeDateState(now);
    await AsyncStorage.setItem(KEYS.dailyFree, now);
  };

  const performSpin = async (prize: number) => {
    const now = new Date().toISOString();
    setLastSpinDate(now);
    await AsyncStorage.setItem(KEYS.lastSpin, now);
    addGold(prize);
  };

  const totalSpent = readings.reduce((s, r) => s + (r.goldSpent ?? 0), 0);

  const consumeTrial = () => {
    const next = trialCount + 1;
    setTrialCount(next);
    AsyncStorage.setItem(KEYS.trialCount, String(next));
  };

  const purchase = () => {
    setIsPurchased(true);
    AsyncStorage.setItem(KEYS.isPurchased, 'true');
    addGold(30);
  };

  const setZodiacSign = async (sign: string) => {
    setZodiacState(sign);
    await AsyncStorage.setItem(KEYS.zodiac, sign);
  };

  const markOnboardingDone = async () => {
    setHasSeenOnboarding(true);
    await AsyncStorage.setItem(KEYS.onboarding, 'true');
  };

  const remainingReadings = isPurchased ? 30 : Math.max(0, 5 - trialCount);

  const value = useMemo(() => ({
    goldBalance,
    readings,
    userProfile,
    profilePhotoUri,
    setProfilePhoto,
    isLoaded,
    hasSeenOnboarding,
    markOnboardingDone,
    canAfford,
    spendGold,
    addGold,
    addReading,
    setUserProfile,
    clearUserProfile,
    getServiceCost,
    totalSpent,
    canSpin,
    lastSpinDate,
    performSpin,
    isPurchased,
    remainingReadings,
    consumeTrial,
    purchase,
    zodiacSign,
    setZodiacSign,
    canDailyFree,
    markDailyFreeUsed,
  }), [goldBalance, readings, userProfile, profilePhotoUri, isLoaded, hasSeenOnboarding, trialCount, isPurchased, lastSpinDate, zodiacSign, lastDailyFreeDate]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
}
