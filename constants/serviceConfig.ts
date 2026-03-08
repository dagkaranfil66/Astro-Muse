export const SERVICE_GOLD_COST: Record<string, number> = {
  samanizm: 2,
  burclar: 3,
  ruh: 4,
  astroloji: 4,
  kahve: 4,
  el: 4,
  numeroloji: 4,
  ruya: 3,
  ask: 4,
  tarot: 3,
  dogum: 4,
};

// 20 altın  = 49,99 ₺  (2,50 ₺/altın — baz)
// 50+5=55   = 99,99 ₺  (1,82 ₺/altın — %27 indirim)
// 120+20=140 = 199,99 ₺ (1,43 ₺/altın — %43 indirim)
// 300+60=360 = 399,99 ₺ (1,11 ₺/altın — %56 indirim)
export const GOLD_PACKAGES = [
  {
    id: "tengri_basic",
    nameKey: "pkgBasic",
    label: "Başlangıç Paketi",
    gold: 20,
    bonus: 0,
    price: "49,99 ₺",
    perGold: "2,50 ₺",
    discount: 0,
    gradient: ["#1A1A30", "#0D1526"] as [string, string],
    popular: false,
  },
  {
    id: "tengri_plus",
    nameKey: "pkgPlus",
    label: "Popüler Paket",
    gold: 50,
    bonus: 5,
    price: "99,99 ₺",
    perGold: "1,82 ₺",
    discount: 27,
    gradient: ["#1A1030", "#0D1526"] as [string, string],
    popular: true,
  },
  {
    id: "tengri_premium",
    nameKey: "pkgPremium",
    label: "Premium Paket",
    gold: 120,
    bonus: 20,
    price: "199,99 ₺",
    perGold: "1,43 ₺",
    discount: 43,
    gradient: ["#1A0A20", "#0D1526"] as [string, string],
    popular: false,
  },
  {
    id: "tengri_vip",
    nameKey: "pkgVip",
    label: "Mega Paket",
    gold: 300,
    bonus: 60,
    price: "399,99 ₺",
    perGold: "1,11 ₺",
    discount: 56,
    gradient: ["#1A0805", "#0D1526"] as [string, string],
    popular: false,
  },
];

export const FREE_START_GOLD = 10;
