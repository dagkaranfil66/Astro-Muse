import { getUncachableRevenueCatClient } from "./revenueCatClient";
import { listOfferings, getOffering } from "replit-revenuecat-v2";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;

async function check() {
  const c = await getUncachableRevenueCatClient();
  const { data } = await listOfferings({ client: c, path: { project_id: PROJECT_ID }, query: { limit: 20 } });
  console.log("All offerings:");
  data?.items?.forEach(o => {
    console.log(`  ${o.lookup_key} | id: ${o.id} | display: ${o.display_name}`);
  });
}
check().catch(console.error);
