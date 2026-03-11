import React, { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';
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
  addReading: (reading: Omit<Reading, 'id' | 'date'>) => Promise<string>;
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

// Global (device-level) keys
const GLOBAL_KEYS = {
  profile:    'tengri_profile',
  onboarding: 'tengri_onboarding_done',
};

// User-scoped keys — one namespace per email address
function userKeys(email: string) {
  const safe = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return {
    gold:         `tengri_u_gold_${safe}`,
    readings:     `tengri_u_readings_${safe}`,
    profilePhoto: `tengri_u_photo_${safe}`,
    lastSpin:     `tengri_u_spin_${safe}`,
    trialCount:   `tengri_u_trials_${safe}`,
    isPurchased:  `tengri_u_purchased_${safe}`,
    zodiac:       `tengri_u_zodiac_${safe}`,
    dailyFree:    `tengri_u_daily_${safe}`,
    welcomeBonus: `tengri_u_welcome_${safe}`,
  };
}

function isSpinAvailable(lastSpin: string | null): boolean {
  if (!lastSpin) return true;
  return Date.now() - new Date(lastSpin).getTime() >= 24 * 60 * 60 * 1000;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [goldBalance, setGoldBalance]           = useState(FREE_START_GOLD);
  const [readings, setReadings]                 = useState<Reading[]>([]);
  const [userProfile, setProfileState]          = useState<UserProfile | null>(null);
  const [profilePhotoUri, setProfilePhotoState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded]                 = useState(false);
  const [lastSpinDate, setLastSpinDate]         = useState<string | null>(null);
  const [lastDailyFreeDate, setLastDailyFreeDateState] = useState<string | null>(null);
  const [trialCount, setTrialCount]             = useState(0);
  const [isPurchased, setIsPurchased]           = useState(false);
  const [zodiacSign, setZodiacState]            = useState<string | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  // Track current user's email so write helpers can scope their keys
  const emailRef = useRef<string | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────
  function uKeys() {
    return emailRef.current ? userKeys(emailRef.current) : null;
  }

  // Load user-specific data for a given email
  async function loadUserData(email: string) {
    const k = userKeys(email);
    const [goldStr, readStr, photoStr, spinStr, tcStr, ipStr, zodStr, dfStr, wbStr] = await Promise.all([
      AsyncStorage.getItem(k.gold),
      AsyncStorage.getItem(k.readings),
      AsyncStorage.getItem(k.profilePhoto),
      AsyncStorage.getItem(k.lastSpin),
      AsyncStorage.getItem(k.trialCount),
      AsyncStorage.getItem(k.isPurchased),
      AsyncStorage.getItem(k.zodiac),
      AsyncStorage.getItem(k.dailyFree),
      AsyncStorage.getItem(k.welcomeBonus),
    ]);

    const isNewUser = goldStr === null;
    let startGold = goldStr !== null ? parseInt(goldStr, 10) : FREE_START_GOLD;

    // One-time welcome bonus: +15 gold for brand new accounts
    if (isNewUser && wbStr === null) {
      startGold = startGold + 15;
      await AsyncStorage.setItem(k.welcomeBonus, 'given');
      await AsyncStorage.setItem(k.gold, String(startGold));
      console.log('[Tengri] Welcome bonus granted: +15 gold');
    }

    setGoldBalance(startGold);
    setReadings(readStr ? JSON.parse(readStr) : []);
    setProfilePhotoState(photoStr ?? null);
    setLastSpinDate(spinStr ?? null);
    setTrialCount(tcStr ? parseInt(tcStr, 10) : 0);
    setIsPurchased(ipStr === 'true');
    setZodiacState(zodStr ?? null);
    setLastDailyFreeDateState(dfStr ?? null);
  }

  // ── Initial load ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [profStr, obStr] = await Promise.all([
          AsyncStorage.getItem(GLOBAL_KEYS.profile),
          AsyncStorage.getItem(GLOBAL_KEYS.onboarding),
        ]);
        if (obStr === 'true') setHasSeenOnboarding(true);
        if (profStr) {
          const profile: UserProfile = JSON.parse(profStr);
          setProfileState(profile);
          emailRef.current = profile.email;
          await loadUserData(profile.email);
        }
      } catch (e) {
        console.error('AppContext load error', e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // ── Service cost ───────────────────────────────────────────────────────
  const getServiceCost = (service: string) => SERVICE_GOLD_COST[service] ?? 2;
  const canAfford = (service: string) => goldBalance >= getServiceCost(service);

  // ── Gold ───────────────────────────────────────────────────────────────
  const spendGold = (service: string): boolean => {
    const cost = getServiceCost(service);
    if (goldBalance < cost) return false;
    const next = goldBalance - cost;
    setGoldBalance(next);
    const k = uKeys();
    if (k) AsyncStorage.setItem(k.gold, String(next));
    return true;
  };

  const addGold = (amount: number) => {
    const next = goldBalance + amount;
    setGoldBalance(next);
    const k = uKeys();
    if (k) AsyncStorage.setItem(k.gold, String(next));
  };

  // ── Readings ───────────────────────────────────────────────────────────
  const addReading = async (reading: Omit<Reading, 'id' | 'date'>): Promise<string> => {
    const newReading: Reading = {
      ...reading,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      goldSpent: getServiceCost(reading.service),
    };
    const updated = [newReading, ...readings];
    setReadings(updated);
    const k = uKeys();
    if (k) await AsyncStorage.setItem(k.readings, JSON.stringify(updated));
    return newReading.id;
  };

  // ── Profile ────────────────────────────────────────────────────────────
  const setUserProfile = async (profile: UserProfile) => {
    // Reset state before loading new user's data
    setGoldBalance(FREE_START_GOLD);
    setReadings([]);
    setProfilePhotoState(null);
    setLastSpinDate(null);
    setLastDailyFreeDateState(null);
    setTrialCount(0);
    setIsPurchased(false);
    setZodiacState(null);

    emailRef.current = profile.email;
    setProfileState(profile);
    await AsyncStorage.setItem(GLOBAL_KEYS.profile, JSON.stringify(profile));

    // Load this user's stored data (or stay at defaults if new user)
    await loadUserData(profile.email);
  };

  const clearUserProfile = async () => {
    emailRef.current = null;
    setProfileState(null);
    setProfilePhotoState(null);
    setGoldBalance(FREE_START_GOLD);
    setReadings([]);
    setLastSpinDate(null);
    setLastDailyFreeDateState(null);
    setTrialCount(0);
    setIsPurchased(false);
    setZodiacState(null);
    await AsyncStorage.removeItem(GLOBAL_KEYS.profile);
  };

  // ── Photo ──────────────────────────────────────────────────────────────
  const setProfilePhoto = async (uri: string | null) => {
    setProfilePhotoState(uri);
    const k = uKeys();
    if (!k) return;
    if (uri) await AsyncStorage.setItem(k.profilePhoto, uri);
    else     await AsyncStorage.removeItem(k.profilePhoto);
  };

  // ── Spin / daily free ──────────────────────────────────────────────────
  const canSpin      = isSpinAvailable(lastSpinDate);
  const canDailyFree = isSpinAvailable(lastDailyFreeDate);

  const markDailyFreeUsed = async () => {
    const now = new Date().toISOString();
    setLastDailyFreeDateState(now);
    const k = uKeys();
    if (k) await AsyncStorage.setItem(k.dailyFree, now);
  };

  const performSpin = async (prize: number) => {
    const now = new Date().toISOString();
    setLastSpinDate(now);
    const k = uKeys();
    if (k) await AsyncStorage.setItem(k.lastSpin, now);
    addGold(prize);
  };

  // ── Trials / purchase ──────────────────────────────────────────────────
  const totalSpent = readings.reduce((s, r) => s + (r.goldSpent ?? 0), 0);

  const consumeTrial = () => {
    const next = trialCount + 1;
    setTrialCount(next);
    const k = uKeys();
    if (k) AsyncStorage.setItem(k.trialCount, String(next));
  };

  const purchase = () => {
    setIsPurchased(true);
    const k = uKeys();
    if (k) AsyncStorage.setItem(k.isPurchased, 'true');
    addGold(30);
  };

  // ── Zodiac ─────────────────────────────────────────────────────────────
  const setZodiacSign = async (sign: string) => {
    setZodiacState(sign);
    const k = uKeys();
    if (k) await AsyncStorage.setItem(k.zodiac, sign);
  };

  // ── Onboarding ─────────────────────────────────────────────────────────
  const markOnboardingDone = async () => {
    setHasSeenOnboarding(true);
    await AsyncStorage.setItem(GLOBAL_KEYS.onboarding, 'true');
  };

  const remainingReadings = isPurchased ? 30 : Math.max(0, 5 - trialCount);

  const value = useMemo(() => ({
    goldBalance, readings, userProfile, profilePhotoUri,
    setProfilePhoto, isLoaded, hasSeenOnboarding, markOnboardingDone,
    canAfford, spendGold, addGold, addReading,
    setUserProfile, clearUserProfile, getServiceCost, totalSpent,
    canSpin, lastSpinDate, performSpin, isPurchased,
    remainingReadings, consumeTrial, purchase,
    zodiacSign, setZodiacSign, canDailyFree, markDailyFreeUsed,
  }), [
    goldBalance, readings, userProfile, profilePhotoUri,
    isLoaded, hasSeenOnboarding, trialCount, isPurchased,
    lastSpinDate, zodiacSign, lastDailyFreeDate,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
}
