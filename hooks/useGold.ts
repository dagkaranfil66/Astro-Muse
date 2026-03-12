import { useApp } from '@/context/AppContext';
import { SERVICE_GOLD_COST } from '@/constants/serviceConfig';
import { affordableServices, cheapestService } from '@/utils/categoryPricing';

// ─── useGold ──────────────────────────────────────────────────────────────────
// Primary gold hook — reads live state from AppContext.
// Always prefer this over goldService directly inside React components.

export function useGold() {
  const { goldBalance, spendGold, addGold, canAfford, getServiceCost } = useApp();

  return {
    balance:          goldBalance,
    spend:            spendGold,
    add:              addGold,
    canAfford,
    getServiceCost,
    getCost:          (service: string) => SERVICE_GOLD_COST[service] ?? 2,
    isAffordable:     (service: string) => canAfford(service),
    affordable:       affordableServices(goldBalance),
    cheapest:         cheapestService(),
    isRich:           goldBalance >= 30,
    isLow:            goldBalance < 5,
    isCriticallyLow:  goldBalance < 2,
    formattedBalance: `${goldBalance} ✦`,
  };
}
