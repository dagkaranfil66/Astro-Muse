export const SERVICE_GOLD_COST: Record<string, number> = {
  samanizm: 2,
  burclar: 4,
  ruh: 4,
  astroloji: 4,
  kahve: 4,
  el: 4,
  numeroloji: 4,
  ruya: 4,
  ask: 4,
  tarot: 3,
  dogum: 3,
};

// 10  altın = 69,99 ₺  (6,99 ₺/altın — baz)
// 30  altın = 199,99 ₺ (6,67 ₺/altın — %5 indirim)
// 50  altın = 299,99 ₺ (6,00 ₺/altın — %14 indirim)
// 100 altın = 499,99 ₺ (5,00 ₺/altın — %28 indirim)
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
    popular: false,
  },
  {
    id: "tengri_premium",
    nameKey: "pkgPremium",
    label: "Premium",
    gold: 50,
    price: "299,99 ₺",
    perGold: "6,00 ₺",
    discount: 14,
    gradient: ["#1A0A20", "#0D1526"] as [string, string],
    popular: true,
  },
  {
    id: "tengri_vip",
    nameKey: "pkgVip",
    label: "VIP",
    gold: 100,
    price: "499,99 ₺",
    perGold: "5,00 ₺",
    discount: 28,
    gradient: ["#1A0805", "#0D1526"] as [string, string],
    popular: false,
  },
];

export const FREE_START_GOLD = 10;
