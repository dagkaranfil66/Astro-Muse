import { SERVICE_GOLD_COST, GOLD_PACKAGES, FREE_START_GOLD } from '@/constants/serviceConfig';

// ─── Category Pricing Utilities ───────────────────────────────────────────────

export type PriceCategory = 'free' | 'low' | 'medium' | 'high';

export function getPriceCategory(service: string): PriceCategory {
  const cost = SERVICE_GOLD_COST[service] ?? 2;
  if (cost === 0) return 'free';
  if (cost <= 2) return 'low';
  if (cost <= 4) return 'medium';
  return 'high';
}

export function formatGoldCost(service: string): string {
  return `${SERVICE_GOLD_COST[service] ?? 2} ✦`;
}

export function getServiceCost(service: string): number {
  return SERVICE_GOLD_COST[service] ?? 2;
}

// Services the user can currently afford
export function affordableServices(balance: number): string[] {
  return Object.entries(SERVICE_GOLD_COST)
    .filter(([, cost]) => balance >= cost)
    .map(([svc]) => svc);
}

// Cheapest available service
export function cheapestService(): { service: string; cost: number } {
  const entries = Object.entries(SERVICE_GOLD_COST);
  const [service, cost] = entries.reduce((min, cur) => (cur[1] < min[1] ? cur : min));
  return { service, cost };
}

// How many readings of a given service can the user do
export function readingsAffordable(balance: number, service: string): number {
  const cost = SERVICE_GOLD_COST[service] ?? 2;
  if (cost === 0) return Infinity;
  return Math.floor(balance / cost);
}

// Best-value package for a given gold target
export function recommendedPackage(goldNeeded: number) {
  const sorted = [...GOLD_PACKAGES].sort((a, b) => (a.gold + a.bonus) - (b.gold + b.bonus));
  return sorted.find((p) => p.gold + p.bonus >= goldNeeded) ?? GOLD_PACKAGES[GOLD_PACKAGES.length - 1];
}

export { SERVICE_GOLD_COST, GOLD_PACKAGES, FREE_START_GOLD };
