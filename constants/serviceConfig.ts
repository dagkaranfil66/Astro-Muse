export const SERVICE_GOLD_COST: Record<string, number> = {
  samanizm: 1,
  burclar: 3,
  ruh: 1,
  astroloji: 2,
  kahve: 2,
  el: 2,
  numeroloji: 2,
  ruya: 2,
  ask: 2,
  tarot: 3,
  dogum: 3,
};

// Base rate: 49,99 ₺ / 20 ✦ = 2,50 ₺ per gold
// Standart: 50 ✦ × 2,50 = 125 → 109,99 (%12 off)
// Premium:  100 ✦ × 2,50 = 250 → 199,99 (%20 off)
// VIP:      200 ✦ × 2,50 = 500 → 349,99 (%30 off)
export const GOLD_PACKAGES = [
  {
    id: "starter",
    nameKey: "pkgStarter",
    label: "Başlangıç",
    gold: 20,
    price: "49,99 ₺",
    perGold: "2,50 ₺",
    discount: 0,
    gradient: ["#1A1A30", "#0D1526"] as [string, string],
    popular: false,
  },
  {
    id: "standard",
    nameKey: "pkgStandard",
    label: "Standart",
    gold: 50,
    price: "109,99 ₺",
    perGold: "2,20 ₺",
    discount: 12,
    gradient: ["#1A1030", "#0D1526"] as [string, string],
    popular: true,
  },
  {
    id: "premium",
    nameKey: "pkgPremium",
    label: "Premium",
    gold: 100,
    price: "199,99 ₺",
    perGold: "2,00 ₺",
    discount: 20,
    gradient: ["#1A0A20", "#0D1526"] as [string, string],
    popular: false,
  },
  {
    id: "vip",
    nameKey: "pkgVip",
    label: "VIP",
    gold: 200,
    price: "349,99 ₺",
    perGold: "1,75 ₺",
    discount: 30,
    gradient: ["#1A0805", "#0D1526"] as [string, string],
    popular: false,
  },
];

export const FREE_START_GOLD = 10;
