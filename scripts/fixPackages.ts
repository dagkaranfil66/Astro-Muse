import { getUncachableRevenueCatClient } from "./revenueCatClient";
import { listProducts, attachProductsToPackage } from "replit-revenuecat-v2";

const PROJECT_ID   = process.env.REVENUECAT_PROJECT_ID!;
const TEST_APP     = process.env.REVENUECAT_TEST_STORE_APP_ID!;
const IOS_APP      = process.env.REVENUECAT_APPLE_APP_STORE_APP_ID!;

// Package IDs from checkRevenueCat output
const PACKAGES: Record<string, string> = {
  tengri_basic:   "pkge60e4187500",
  tengri_plus:    "pkge7b9ee5a73a",
  tengri_premium: "pkgeabb552bd3c",
  tengri_vip:     "pkge1b1bfd3fce",
};

async function fix() {
  const c = await getUncachableRevenueCatClient();
  const { data } = await listProducts({ client: c, path: { project_id: PROJECT_ID }, query: { limit: 100 } });
  const all = data.items ?? [];

  for (const [name, pkgId] of Object.entries(PACKAGES)) {
    const testProd = all.find(p => p.store_identifier === name && p.app_id === TEST_APP);
    const iosProd  = all.find(p => p.store_identifier === name && p.app_id === IOS_APP);
    
    if (!testProd) { console.log(`✗ ${name}: no test_store product`); continue; }
    console.log(`\n▶ ${name} | test: ${testProd.id} | ios: ${iosProd?.id ?? "none"}`);

    const products: { product_id: string; eligibility_criteria: string }[] = [
      { product_id: testProd.id, eligibility_criteria: "all" },
    ];
    if (iosProd) products.push({ product_id: iosProd.id, eligibility_criteria: "all" });

    const c2 = await getUncachableRevenueCatClient();
    const { error } = await attachProductsToPackage({
      client: c2,
      path: { project_id: PROJECT_ID, package_id: pkgId },
      body: { products },
    });

    if (error) {
      const e = error as any;
      if (e?.type === "unprocessable_entity_error") {
        console.log(`  ✓ Already attached`);
      } else {
        console.log(`  ⚠ Error:`, e?.message);
      }
    } else {
      console.log(`  + Attached ✓`);
    }
  }
  console.log("\n✅ Done!");
}

fix().catch(console.error);
