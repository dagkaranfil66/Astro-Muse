export const SERVICE_GOLD_COST: Record<string, number> = {
  samanizm:  2,
  burclar:   4,
  ruya:      4,
  tarot:     4,
  ruh:       6,
  astroloji: 6,
  kahve:     6,
  el:        6,
  numeroloji:6,
  ask:       6,
  dogum:     6,
};

// 20 altın  = 71,99 ₺  (3,60 ₺/altın — baz)
// 50+5=55   = 144,99 ₺ (2,64 ₺/altın — %27 indirim)
// 120+20=140 = 289,99 ₺ (2,07 ₺/altın — %43 indirim)
// 300+60=360 = 579,99 ₺ (1,61 ₺/altın — %56 indirim)
// GOLD_PACKAGES is reference data only. Actual prices come from Google Play.
export const GOLD_PACKAGES = [
  {
    id: "tengri_20_gold",
    nameKey: "pkgBasic",
    label: "Başlangıç Paketi",
    gold: 20,
    bonus: 0,
    price: "71,99 ₺",
    perGold: "3,60 ₺",
    discount: 0,
    gradient: ["#1A1A30", "#0D1526"] as [string, string],
    popular: false,
  },
  {
    id: "tengri_50_gold",
    nameKey: "pkgPlus",
    label: "Popüler Paket",
    gold: 50,
    bonus: 5,
    price: "144,99 ₺",
    perGold: "2,64 ₺",
    discount: 27,
    gradient: ["#1A1030", "#0D1526"] as [string, string],
    popular: true,
  },
  {
    id: "tengri_120_gold",
    nameKey: "pkgPremium",
    label: "Büyük Paket",
    gold: 120,
    bonus: 20,
    price: "289,99 ₺",
    perGold: "2,07 ₺",
    discount: 43,
    gradient: ["#1A0A20", "#0D1526"] as [string, string],
    popular: false,
  },
  {
    id: "tengri_300_gold",
    nameKey: "pkgVip",
    label: "Mega Paket",
    gold: 300,
    bonus: 60,
    price: "579,99 ₺",
    perGold: "1,61 ₺",
    discount: 56,
    gradient: ["#1A0805", "#0D1526"] as [string, string],
    popular: false,
  },
];

export const FREE_START_GOLD = 15;
