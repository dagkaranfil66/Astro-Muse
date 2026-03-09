import { getUncachableRevenueCatClient } from "./revenueCatClient";
import { listProducts, listPackages, listOfferings } from "replit-revenuecat-v2";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;
const TEST_APP   = process.env.REVENUECAT_TEST_STORE_APP_ID!;
const IOS_APP    = process.env.REVENUECAT_APPLE_APP_STORE_APP_ID!;
const DROID_APP  = process.env.REVENUECAT_GOOGLE_PLAY_STORE_APP_ID!;

const appName = (id: string) => id === TEST_APP ? "test_store" : id === IOS_APP ? "app_store" : id === DROID_APP ? "play_store" : id;

async function check() {
  const client = await getUncachableRevenueCatClient();
  const { data: products } = await listProducts({ client, path: { project_id: PROJECT_ID }, query: { limit: 100 } });
  const tengri = products.items?.filter(p =>
    ["tengri_basic","tengri_plus","tengri_premium","tengri_vip"].includes(p.store_identifier!)
  ) ?? [];

  console.log(`\n=== Tengri Products (${tengri.length}) ===`);
  for (const p of tengri) {
    console.log(`  ${p.store_identifier} | ${appName(p.app_id!)} | id: ${p.id} | type: ${p.type}`);
  }

  const c2 = await getUncachableRevenueCatClient();
  const { data: offerings } = await listOfferings({ client: c2, path: { project_id: PROJECT_ID }, query: { limit: 20 } });
  const def = offerings?.items?.find(o => o.lookup_key === "default");
  if (!def) { console.log("No default offering!"); return; }

  const c3 = await getUncachableRevenueCatClient();
  const { data: pkgs } = await listPackages({ client: c3, path: { project_id: PROJECT_ID, offering_id: def.id }, query: { limit: 50 } });

  console.log(`\n=== Packages in default offering (${pkgs?.items?.length ?? 0}) ===`);
  for (const pkg of pkgs?.items ?? []) {
    console.log(`  ${pkg.lookup_key} | id: ${pkg.id}`);
  }
}

check().catch(console.error);
