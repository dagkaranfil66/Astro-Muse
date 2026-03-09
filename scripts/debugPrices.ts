import { getUncachableRevenueCatClient } from "./revenueCatClient";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;

// The working tengri_plus vs a new product
const PRODS = [
  { name: "tengri_plus (WORKS)", id: "prodd5caba5f73" },
  { name: "tengri_basic (FAILS)", id: "prodfb8ca44652" },
];

async function debug() {
  for (const prod of PRODS) {
    console.log(`\n▶ ${prod.name}`);
    
    // Try to set price - what does the response look like?
    const c = await getUncachableRevenueCatClient();
    const { data, error } = await (c as any).post({
      url: "/projects/{project_id}/products/{product_id}/test_store_prices",
      path: { project_id: PROJECT_ID, product_id: prod.id },
      body: { prices: [{ amount_micros: 1990000, currency: "USD" }] },
    });
    
    if (error) {
      const e = error as any;
      console.log(`  Set price: ERROR ${e?.type} — ${e?.message}`);
    } else {
      console.log(`  Set price response:`, JSON.stringify(data));
    }
  }
}
debug().catch(console.error);
