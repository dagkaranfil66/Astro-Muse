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

// 10 altın = 69,99 ₺ (6,99 ₺/altın)
// 30 altın = 199,99 ₺ (6,67 ₺/altın — %5 indirim)
export const GOLD_PACKAGES = [
  {
    id: "tengri_basic",
    nameKey: "pkgBasic",
    label: "Başlangıç",
    gold: 10,
    price: "69,99 ₺",
    perGold: "6,99 ₺",
    discount: 0,
    gradient: ["#1A1A30", "#0D1526"] as [string, string],
    popular: false,
  },
  {
    id: "tengri_plus",
    nameKey: "pkgPlus",
    label: "Avantajlı",
    gold: 30,
    price: "199,99 ₺",
    perGold: "6,67 ₺",
    discount: 5,
    gradient: ["#1A1030", "#0D1526"] as [string, string],
    popular: true,
  },
];

export const FREE_START_GOLD = 10;
