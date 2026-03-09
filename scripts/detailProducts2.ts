import { listProducts } from "replit-revenuecat-v2";
import { getUncachableRevenueCatClient } from "./revenueCatClient";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;
async function main() {
  const client = await getUncachableRevenueCatClient();
  const { data, error } = await listProducts({ client, path: { project_id: PROJECT_ID }, query: { limit: 50 } });
  if (error) { console.error("Error:", JSON.stringify(error)); return; }
  const items = (data?.items ?? []) as any[];
  console.log(`Total: ${items.length}`);
  // Print first item to see structure
  if (items.length > 0) console.log("Sample keys:", Object.keys(items[0]));
  for (const p of items) {
    const appType = p.app?.type ?? "unknown";
    console.log(`${p.store_identifier} | app_type=${appType} | type=${p.type} | id=${p.id}`);
  }
}
main().catch(console.error);
