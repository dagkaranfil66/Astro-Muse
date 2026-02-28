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

export const GOLD_PACKAGES = [
  {
    id: "starter",
    nameKey: "pkgStarter",
    gold: 15,
    price: "29,99 ₺",
    perGold: "2,00 ₺",
    gradient: ["#1A1A30", "#0D1526"] as [string, string],
    popular: false,
  },
  {
    id: "standard",
    nameKey: "pkgStandard",
    gold: 40,
    price: "74,99 ₺",
    perGold: "1,87 ₺",
    gradient: ["#1A1030", "#0D1526"] as [string, string],
    popular: true,
  },
  {
    id: "premium",
    nameKey: "pkgPremium",
    gold: 80,
    price: "139,99 ₺",
    perGold: "1,75 ₺",
    gradient: ["#1A0A20", "#0D1526"] as [string, string],
    popular: false,
  },
  {
    id: "vip",
    nameKey: "pkgVip",
    gold: 150,
    price: "249,99 ₺",
    perGold: "1,67 ₺",
    gradient: ["#1A0805", "#0D1526"] as [string, string],
    popular: false,
  },
];

export const FREE_START_GOLD = 10;
