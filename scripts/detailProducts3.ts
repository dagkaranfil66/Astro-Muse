import { listProducts } from "replit-revenuecat-v2";
import { getUncachableRevenueCatClient } from "./revenueCatClient";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;
const TEST_APP_ID = "appb1eae4775c";

async function main() {
  const client = await getUncachableRevenueCatClient();
  const { data, error } = await listProducts({ client, path: { project_id: PROJECT_ID }, query: { limit: 50 } });
  if (error) { console.error("Error:", JSON.stringify(error)); return; }
  const items = (data?.items ?? []) as any[];
  
  console.log("=== TEST STORE PRODUCTS ===");
  const testProds = items.filter(p => p.app_id === TEST_APP_ID);
  for (const p of testProds) {
    console.log(`${p.store_identifier} | id=${p.id} | type=${p.type} | sub=${JSON.stringify(p.subscription)}`);
  }
  
  console.log("\n=== OTHER PRODUCTS (non-test) WITH RELEVANT NAMES ===");
  const relevantNames = ["tengri_basic", "tengri_plus", "tengri_premium", "tengri_vip"];
  const other = items.filter(p => p.app_id !== TEST_APP_ID && relevantNames.includes(p.store_identifier));
  for (const p of other) {
    console.log(`${p.store_identifier} | app_id=${p.app_id} | id=${p.id} | type=${p.type}`);
  }
}
main().catch(console.error);
