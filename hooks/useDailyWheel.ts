import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';

// ─── useDailyWheel ────────────────────────────────────────────────────────────
// Live countdown to next daily spin + convenience helpers.

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getMsRemaining(lastSpin: string | null): number {
  if (!lastSpin) return 0;
  const elapsed = Date.now() - new Date(lastSpin).getTime();
  return Math.max(0, ONE_DAY_MS - elapsed);
}

function formatCountdown(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function useDailyWheel() {
  const { canSpin, lastSpinDate, performSpin } = useApp();
  const [msRemaining, setMsRemaining] = useState(() => getMsRemaining(lastSpinDate));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function tick() {
      const ms = getMsRemaining(lastSpinDate);
      setMsRemaining(ms);
      if (ms === 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    tick();
    if (!canSpin) {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [canSpin, lastSpinDate]);

  return {
    canSpin,
    lastSpinDate,
    msRemaining,
    formattedCountdown: formatCountdown(msRemaining),
    hoursRemaining:     Math.ceil(msRemaining / (60 * 60 * 1000)),
    performSpin,
  };
}
