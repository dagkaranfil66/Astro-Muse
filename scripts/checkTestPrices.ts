import { getUncachableRevenueCatClient } from "./revenueCatClient";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;
const PRODS = {
  "tengri_plus":    "prodd5caba5f73",
  "tengri_basic":   "prodfb8ca44652",
  "tengri_premium": "prod3b13a98c47",
  "tengri_vip":     "prodc3dbeda3eb",
};

type PriceData = { object: string; prices: { amount_micros: number; currency: string }[] };

async function checkPrices() {
  for (const [name, prodId] of Object.entries(PRODS)) {
    const c = await getUncachableRevenueCatClient();
    const { data, error } = await c.get<PriceData>({
      url: "/projects/{project_id}/products/{product_id}/test_store_prices",
      path: { project_id: PROJECT_ID, product_id: prodId },
    });
    if (error) { console.log(`${name}: ERROR ${JSON.stringify(error)}`); }
    else { 
      const prices = data?.prices ?? [];
      console.log(`${name}: ${prices.length > 0 ? prices.map(p => `${p.currency} ${p.amount_micros/1000000}`).join(", ") : "NO PRICES"}`);
    }
  }
}
checkPrices().catch(console.error);
