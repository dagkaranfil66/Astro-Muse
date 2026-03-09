import { getUncachableRevenueCatClient } from "./revenueCatClient";
import { listEntitlements } from "replit-revenuecat-v2";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;

async function check() {
  const c = await getUncachableRevenueCatClient();
  const { data } = await listEntitlements({ client: c, path: { project_id: PROJECT_ID }, query: { limit: 20 } });
  console.log("Entitlements:");
  data?.items?.forEach(e => console.log(`  id: ${e.id} | lookup_key: ${e.lookup_key} | display_name: ${e.display_name}`));
}
check().catch(console.error);
