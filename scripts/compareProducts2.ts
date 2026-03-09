import { listProducts } from "replit-revenuecat-v2";
import { getUncachableRevenueCatClient } from "./revenueCatClient";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;

async function main() {
  const client = await getUncachableRevenueCatClient();
  const { data, error } = await listProducts({ client, path: { project_id: PROJECT_ID }, query: { limit: 50 } });
  if (error) { console.error("Error:", error); return; }
  const testStore = (data?.items ?? []).filter((p: any) => p.app?.type === "test_store");
  for (const p of testStore as any[]) {
    console.log(`\n[${p.store_identifier}] id=${p.id}`);
    console.log(`  type: ${p.type}`);
    console.log(`  display_name: ${p.display_name}`);
    console.log(`  title: ${p.title}`);
    console.log(`  subscription: ${JSON.stringify(p.subscription)}`);
    console.log(`  created_at: ${p.created_at}`);
  }
}
main().catch(console.error);
