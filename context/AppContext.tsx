import React, { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FREE_START_GOLD, SERVICE_GOLD_COST } from '@/constants/serviceConfig';
import {
  fsGetUser, fsCreateUser, fsUpdateUser, fsAddReading, fsGetReadings,
  FSUserData, FSReading,
} from '@/lib/firebase';

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
  loginProvider?: 'email' | 'apple' | 'google';
  appleUserId?: string;
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
  mistikName: string | null;
  mistikBirthDate: string | null;
  mistikFocusArea: string | null;
  setMistikProfile: (data: { name: string; birthDate: string; focusArea: string }) => Promise<void>;
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
  showWelcomeBonus: boolean;
  dismissWelcomeBonus: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// Global (device-level) keys
const GLOBAL_KEYS = {
  profile:       'tengri_profile',
  onboarding:    'tengri_onboarding_done',
  mistikProfile: 'tengri_mistik_profile',
};

// User-scoped AsyncStorage keys — fast local cache
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
  const [showWelcomeBonus, setShowWelcomeBonus]   = useState(false);
  const [mistikName, setMistikNameState]          = useState<string | null>(null);
  const [mistikBirthDate, setMistikBirthDateState] = useState<string | null>(null);
  const [mistikFocusArea, setMistikFocusAreaState] = useState<string | null>(null);

  const emailRef = useRef<string | null>(null);

  function uKeys() {
    return emailRef.current ? userKeys(emailRef.current) : null;
  }

  // ── Load user data (AsyncStorage first, then sync from Firestore) ────────
  async function loadUserData(email: string) {
    const k = userKeys(email);

    // 1. Load from local cache immediately (fast)
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

    const isNewLocal = goldStr === null;
    let startGold = goldStr !== null ? parseInt(goldStr, 10) : FREE_START_GOLD;

    // 2. Try Firestore — merge if cloud data is newer/different
    const fsData = await fsGetUser(email);

    if (fsData) {
      // Existing Firestore user — prefer cloud values
      startGold = fsData.goldBalance;
      await Promise.all([
        AsyncStorage.setItem(k.gold, String(fsData.goldBalance)),
        AsyncStorage.setItem(k.lastSpin, fsData.lastSpinDate ?? ''),
        AsyncStorage.setItem(k.trialCount, String(fsData.trialCount)),
        AsyncStorage.setItem(k.isPurchased, fsData.isPurchased ? 'true' : 'false'),
        AsyncStorage.setItem(k.zodiac, fsData.zodiacSign ?? ''),
        AsyncStorage.setItem(k.dailyFree, fsData.lastDailyFreeDate ?? ''),
        AsyncStorage.setItem(k.welcomeBonus, fsData.welcomeBonusGiven ? 'given' : ''),
      ]);
      setLastSpinDate(fsData.lastSpinDate ?? null);
      setTrialCount(fsData.trialCount);
      setIsPurchased(fsData.isPurchased);
      setZodiacState(fsData.zodiacSign ?? null);
      setLastDailyFreeDateState(fsData.lastDailyFreeDate ?? null);

      // Load readings from Firestore subcollection
      const fsReadings = await fsGetReadings(email);
      if (fsReadings.length > 0) {
        setReadings(fsReadings);
        await AsyncStorage.setItem(k.readings, JSON.stringify(fsReadings));
      } else {
        setReadings(readStr ? JSON.parse(readStr) : []);
      }
    } else {
      // New Firestore user — use local cache or defaults
      if (isNewLocal && wbStr === null) {
        startGold = startGold + 15;
        await AsyncStorage.setItem(k.welcomeBonus, 'given');
        await AsyncStorage.setItem(k.gold, String(startGold));
        console.log('[Tengri] Welcome bonus granted: +15 gold');
        setShowWelcomeBonus(true);
      }

      setLastSpinDate(spinStr ?? null);
      setTrialCount(tcStr ? parseInt(tcStr, 10) : 0);
      setIsPurchased(ipStr === 'true');
      setZodiacState(zodStr ?? null);
      setLastDailyFreeDateState(dfStr ?? null);
      setReadings(readStr ? JSON.parse(readStr) : []);

      // Create Firestore document for this user
      const newDoc: FSUserData = {
        email,
        name: '',
        joinDate: new Date().toISOString(),
        goldBalance: startGold,
        zodiacSign: zodStr ?? null,
        isPurchased: ipStr === 'true',
        lastSpinDate: spinStr ?? null,
        lastDailyFreeDate: dfStr ?? null,
        trialCount: tcStr ? parseInt(tcStr, 10) : 0,
        welcomeBonusGiven: true,
      };
      await fsCreateUser(newDoc);
    }

    setGoldBalance(startGold);
    setProfilePhotoState(photoStr ?? null);
  }

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [profStr, obStr, mpStr] = await Promise.all([
          AsyncStorage.getItem(GLOBAL_KEYS.profile),
          AsyncStorage.getItem(GLOBAL_KEYS.onboarding),
          AsyncStorage.getItem(GLOBAL_KEYS.mistikProfile),
        ]);
        if (obStr === 'true') setHasSeenOnboarding(true);
        if (mpStr) {
          try {
            const mp = JSON.parse(mpStr);
            if (mp.name) setMistikNameState(mp.name);
            if (mp.birthDate) setMistikBirthDateState(mp.birthDate);
            if (mp.focusArea) setMistikFocusAreaState(mp.focusArea);
          } catch {}
        }
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

  // ── Service cost ───────────────────────────────────────────────────────────
  const getServiceCost = (service: string) => SERVICE_GOLD_COST[service] ?? 2;
  const canAfford = (service: string) => goldBalance >= getServiceCost(service);

  // ── Gold ──────────────────────────────────────────────────────────────────
  const spendGold = (service: string): boolean => {
    const cost = getServiceCost(service);
    if (goldBalance < cost) return false;
    const next = goldBalance - cost;
    setGoldBalance(next);
    const k = uKeys();
    if (k) {
      AsyncStorage.setItem(k.gold, String(next));
      if (emailRef.current) fsUpdateUser(emailRef.current, { goldBalance: next });
    }
    return true;
  };

  const addGold = (amount: number) => {
    const next = goldBalance + amount;
    setGoldBalance(next);
    const k = uKeys();
    if (k) {
      AsyncStorage.setItem(k.gold, String(next));
      if (emailRef.current) fsUpdateUser(emailRef.current, { goldBalance: next });
    }
  };

  // ── Readings ──────────────────────────────────────────────────────────────
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
    if (k) {
      await AsyncStorage.setItem(k.readings, JSON.stringify(updated));
    }
    if (emailRef.current) {
      await fsAddReading(emailRef.current, newReading as FSReading);
    }
    return newReading.id;
  };

  // ── Profile ───────────────────────────────────────────────────────────────
  const setUserProfile = async (profile: UserProfile) => {
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

    await loadUserData(profile.email);

    // Sync name to Firestore
    await fsUpdateUser(profile.email, { name: profile.name, email: profile.email });
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

  // ── Photo ─────────────────────────────────────────────────────────────────
  const setProfilePhoto = async (uri: string | null) => {
    setProfilePhotoState(uri);
    const k = uKeys();
    if (!k) return;
    if (uri) await AsyncStorage.setItem(k.profilePhoto, uri);
    else     await AsyncStorage.removeItem(k.profilePhoto);
  };

  // ── Spin / daily free ─────────────────────────────────────────────────────
  const canSpin      = isSpinAvailable(lastSpinDate);
  const canDailyFree = isSpinAvailable(lastDailyFreeDate);

  const markDailyFreeUsed = async () => {
    const now = new Date().toISOString();
    setLastDailyFreeDateState(now);
    const k = uKeys();
    if (k) await AsyncStorage.setItem(k.dailyFree, now);
    if (emailRef.current) fsUpdateUser(emailRef.current, { lastDailyFreeDate: now });
  };

  const performSpin = async (prize: number) => {
    const now = new Date().toISOString();
    setLastSpinDate(now);
    const k = uKeys();
    if (k) await AsyncStorage.setItem(k.lastSpin, now);
    if (emailRef.current) fsUpdateUser(emailRef.current, { lastSpinDate: now });
    addGold(prize);
  };

  // ── Trials / purchase ─────────────────────────────────────────────────────
  const totalSpent = readings.reduce((s, r) => s + (r.goldSpent ?? 0), 0);

  const consumeTrial = () => {
    const next = trialCount + 1;
    setTrialCount(next);
    const k = uKeys();
    if (k) AsyncStorage.setItem(k.trialCount, String(next));
    if (emailRef.current) fsUpdateUser(emailRef.current, { trialCount: next });
  };

  const purchase = () => {
    setIsPurchased(true);
    const k = uKeys();
    if (k) AsyncStorage.setItem(k.isPurchased, 'true');
    if (emailRef.current) fsUpdateUser(emailRef.current, { isPurchased: true });
    addGold(30);
  };

  // ── Zodiac ────────────────────────────────────────────────────────────────
  const setZodiacSign = async (sign: string) => {
    setZodiacState(sign);
    const k = uKeys();
    if (k) await AsyncStorage.setItem(k.zodiac, sign);
    if (emailRef.current) fsUpdateUser(emailRef.current, { zodiacSign: sign });
  };

  // ── Onboarding ────────────────────────────────────────────────────────────
  const markOnboardingDone = async () => {
    setHasSeenOnboarding(true);
    await AsyncStorage.setItem(GLOBAL_KEYS.onboarding, 'true');
  };

  // ── Mistik Profil ─────────────────────────────────────────────────────────
  const setMistikProfile = async (data: { name: string; birthDate: string; focusArea: string }) => {
    if (data.name) setMistikNameState(data.name);
    if (data.birthDate) setMistikBirthDateState(data.birthDate);
    if (data.focusArea) setMistikFocusAreaState(data.focusArea);
    await AsyncStorage.setItem(GLOBAL_KEYS.mistikProfile, JSON.stringify(data));
  };

  const remainingReadings = isPurchased ? 30 : Math.max(0, 5 - trialCount);

  const dismissWelcomeBonus = () => setShowWelcomeBonus(false);

  const value = useMemo(() => ({
    goldBalance, readings, userProfile, profilePhotoUri,
    setProfilePhoto, isLoaded, hasSeenOnboarding, markOnboardingDone,
    canAfford, spendGold, addGold, addReading,
    setUserProfile, clearUserProfile, getServiceCost, totalSpent,
    canSpin, lastSpinDate, performSpin, isPurchased,
    remainingReadings, consumeTrial, purchase,
    zodiacSign, setZodiacSign, canDailyFree, markDailyFreeUsed,
    showWelcomeBonus, dismissWelcomeBonus,
    mistikName, mistikBirthDate, mistikFocusArea, setMistikProfile,
  }), [
    goldBalance, readings, userProfile, profilePhotoUri,
    isLoaded, hasSeenOnboarding, trialCount, isPurchased,
    lastSpinDate, zodiacSign, lastDailyFreeDate, showWelcomeBonus,
    mistikName, mistikBirthDate, mistikFocusArea,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
}
