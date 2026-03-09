import { getUncachableRevenueCatClient } from "./revenueCatClient";
import {
  listProducts, createProduct,
  listPackages, attachProductsToPackage,
  listEntitlements, attachProductsToEntitlement,
} from "replit-revenuecat-v2";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;
const TEST_APP   = process.env.REVENUECAT_TEST_STORE_APP_ID!;
const IOS_APP    = process.env.REVENUECAT_APPLE_APP_STORE_APP_ID!;
const DROID_APP  = process.env.REVENUECAT_GOOGLE_PLAY_STORE_APP_ID!;
const OFFERING_ID = "ofrngddb7839568"; // from checkRevenueCat output
const ENTITLEMENT_ID = "entl0a6ac5c01c"; // from seed output

const GOLD_PRODUCTS = [
  { id: "tengri_basic",   pkgId: "pkge60e4187500" },
  { id: "tengri_plus",    pkgId: "pkge7b9ee5a73a" },
  { id: "tengri_premium", pkgId: "pkgeabb552bd3c" },
  { id: "tengri_vip",     pkgId: "pkge1b1bfd3fce" },
];

type TestStorePricesResponse = { object: string; prices: { amount_micros: number; currency: string }[] };

const PRICES: Record<string, number> = {
  tengri_basic: 1990000, tengri_plus: 4990000,
  tengri_premium: 9990000, tengri_vip: 19990000
};

async function fix() {
  // 1. Get all products
  const c1 = await getUncachableRevenueCatClient();
  const { data: allProds } = await listProducts({ client: c1, path: { project_id: PROJECT_ID }, query: { limit: 100 } });
  const prods = allProds.items ?? [];

  for (const gp of GOLD_PRODUCTS) {
    console.log(`\n▶ ${gp.id}`);
    
    const testProd  = prods.find(p => p.store_identifier === gp.id && p.app_id === TEST_APP);
    const iosProd   = prods.find(p => p.store_identifier === gp.id && p.app_id === IOS_APP);
    let droidProd   = prods.find(p => p.store_identifier === gp.id && p.app_id === DROID_APP);

    if (!testProd) { console.log("  ✗ No test_store product!"); continue; }
    if (!iosProd)  { console.log("  ✗ No app_store product!"); continue; }
    console.log(`  ✓ test: ${testProd.id}  ios: ${iosProd.id}`);
    
    // Create play_store product if missing
    if (!droidProd) {
      const c2 = await getUncachableRevenueCatClient();
      const { data, error } = await createProduct({
        client: c2, path: { project_id: PROJECT_ID },
        body: { store_identifier: gp.id, app_id: DROID_APP, type: "consumable", display_name: gp.id },
      });
      if (error) {
        const e = error as any;
        if (e?.type === "resource_already_exists") {
          const c3 = await getUncachableRevenueCatClient();
          const { data: fresh } = await listProducts({ client: c3, path: { project_id: PROJECT_ID }, query: { limit: 100 } });
          droidProd = fresh.items?.find(p => p.store_identifier === gp.id && p.app_id === DROID_APP);
          console.log(`  ✓ android already exists: ${droidProd?.id}`);
        } else { console.log("  ✗ android create error:", JSON.stringify(error)); continue; }
      } else {
        droidProd = data;
        console.log(`  + Created android: ${droidProd.id}`);
      }
    } else {
      console.log(`  ✓ android: ${droidProd.id}`);
    }

    // Set test store price
    const c4 = await getUncachableRevenueCatClient();
    const { error: priceErr } = await c4.post<TestStorePricesResponse>({
      url: "/projects/{project_id}/products/{product_id}/test_store_prices",
      path: { project_id: PROJECT_ID, product_id: testProd.id },
      body: { prices: [{ amount_micros: PRICES[gp.id], currency: "USD" }] },
    });
    if (priceErr) {
      const e = priceErr as any;
      console.log(e?.type === "resource_already_exists" ? "  ✓ Prices already set" : `  ⚠ Price: ${e?.message}`);
    } else {
      console.log("  + USD price set");
    }

    // Attach to entitlement
    const c5 = await getUncachableRevenueCatClient();
    const { error: entErr } = await attachProductsToEntitlement({
      client: c5,
      path: { project_id: PROJECT_ID, entitlement_id: ENTITLEMENT_ID },
      body: { product_ids: [testProd.id, iosProd.id, droidProd!.id].filter(Boolean) },
    });
    if (entErr) {
      const e = entErr as any;
      console.log(e?.type === "unprocessable_entity_error" ? "  ✓ Already in entitlement" : `  ⚠ Entitlement: ${e?.message}`);
    } else {
      console.log("  + Attached to entitlement");
    }

    // Attach to package
    const c6 = await getUncachableRevenueCatClient();
    const { error: pkgErr } = await attachProductsToPackage({
      client: c6,
      path: { project_id: PROJECT_ID, package_id: gp.pkgId },
      body: {
        products: [
          { product_id: testProd.id,   eligibility_criteria: "all" },
          { product_id: iosProd.id,    eligibility_criteria: "all" },
          { product_id: droidProd!.id, eligibility_criteria: "all" },
        ].filter(p => p.product_id),
      },
    });
    if (pkgErr) {
      const e = pkgErr as any;
      if (e?.type === "unprocessable_entity_error") {
        console.log("  ✓ Already attached to package");
      } else {
        // Try attaching only test store product
        const c7 = await getUncachableRevenueCatClient();
        const { error: e2 } = await attachProductsToPackage({
          client: c7,
          path: { project_id: PROJECT_ID, package_id: gp.pkgId },
          body: { products: [{ product_id: testProd.id, eligibility_criteria: "all" }] },
        });
        if (e2) {
          const e3 = e2 as any;
          console.log(e3?.type === "unprocessable_entity_error" ? "  ✓ Test product already in package" : `  ⚠ Pkg attach: ${e3?.message}`);
        } else {
          console.log("  + Test product attached to package");
        }
      }
    } else {
      console.log("  + All products attached to package ✓");
    }
  }
  console.log("\n✅ Fix complete!");
}

fix().catch(console.error);
