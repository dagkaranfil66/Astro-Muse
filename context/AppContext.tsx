import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Reading {
  id: string;
  service: string;
  serviceLabel: string;
  content: string;
  date: string;
  userInput?: string;
}

interface AppContextValue {
  trialCount: number;
  isPurchased: boolean;
  remainingReadings: number;
  readings: Reading[];
  addReading: (reading: Omit<Reading, 'id' | 'date'>) => Promise<void>;
  consumeTrial: () => void;
  purchase: () => void;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const FREE_TRIALS = 3;
const STORAGE_KEYS = {
  trialCount: 'tengri_trial_count',
  isPurchased: 'tengri_is_purchased',
  readings: 'tengri_readings',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [trialCount, setTrialCount] = useState(0);
  const [isPurchased, setIsPurchased] = useState(false);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [tc, ip, rs] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.trialCount),
          AsyncStorage.getItem(STORAGE_KEYS.isPurchased),
          AsyncStorage.getItem(STORAGE_KEYS.readings),
        ]);
        if (tc) setTrialCount(parseInt(tc, 10));
        if (ip) setIsPurchased(ip === 'true');
        if (rs) setReadings(JSON.parse(rs));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  const consumeTrial = () => {
    const next = trialCount + 1;
    setTrialCount(next);
    AsyncStorage.setItem(STORAGE_KEYS.trialCount, String(next));
  };

  const purchase = () => {
    setIsPurchased(true);
    AsyncStorage.setItem(STORAGE_KEYS.isPurchased, 'true');
  };

  const addReading = async (reading: Omit<Reading, 'id' | 'date'>) => {
    const newReading: Reading = {
      ...reading,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
    };
    const updated = [newReading, ...readings];
    setReadings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.readings, JSON.stringify(updated));
  };

  const remainingReadings = isPurchased ? 30 : Math.max(0, FREE_TRIALS - trialCount);

  const value = useMemo(() => ({
    trialCount,
    isPurchased,
    remainingReadings,
    readings,
    addReading,
    consumeTrial,
    purchase,
    isLoaded,
  }), [trialCount, isPurchased, readings, isLoaded]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
}
