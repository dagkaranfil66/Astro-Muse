import { getUncachableRevenueCatClient } from "./revenueCatClient";
import { getProductsFromPackage } from "replit-revenuecat-v2";

const PROJECT_ID  = process.env.REVENUECAT_PROJECT_ID!;
const PKG_BASIC   = "pkge60e4187500"; // tengri_basic
const TEST_APP    = process.env.REVENUECAT_TEST_STORE_APP_ID!;

async function debug() {
  const c = await getUncachableRevenueCatClient();
  const { data, error } = await getProductsFromPackage({ client: c, path: { project_id: PROJECT_ID, package_id: PKG_BASIC } });
  if (error) { console.log("Error:", JSON.stringify(error)); return; }
  console.log("TEST_APP =", TEST_APP);
  console.log("\nProducts in tengri_basic package:");
  const items = (data as any)?.items ?? (data as any)?.products ?? [];
  for (const p of items) {
    console.log(JSON.stringify(p, null, 2));
  }
}

debug().catch(console.error);
