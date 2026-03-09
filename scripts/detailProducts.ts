import { listProducts } from "replit-revenuecat-v2";
import { getUncachableRevenueCatClient } from "./revenueCatClient";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;
async function main() {
  const client = await getUncachableRevenueCatClient();
  const { data, error } = await listProducts({ client, path: { project_id: PROJECT_ID }, query: { limit: 50 } });
  if (error) { console.error("Error:", JSON.stringify(error)); return; }
  const items = (data?.items ?? []) as any[];
  console.log(`Total products: ${items.length}`);
  for (const p of items) {
    if (p.app?.type === "test_store") {
      console.log(`\n[TEST] ${p.store_identifier} | id=${p.id}`);
      console.log(`  type=${p.type} | display_name=${p.display_name} | title=${p.title}`);
      console.log(`  subscription=${JSON.stringify(p.subscription)}`);
      console.log(`  created_at=${p.created_at}`);
    }
  }
}
main().catch(console.error);
