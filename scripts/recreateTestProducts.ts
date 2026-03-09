import { getUncachableRevenueCatClient } from "./revenueCatClient";
import {
  listProducts, createProduct, deleteProduct,
  detachProductsFromPackage, detachProductsFromEntitlement,
  attachProductsToPackage, attachProductsToEntitlement,
} from "replit-revenuecat-v2";

const PROJECT_ID     = process.env.REVENUECAT_PROJECT_ID!;
const TEST_APP       = process.env.REVENUECAT_TEST_STORE_APP_ID!;
const ENTITLEMENT_ID = "entl0a6ac5c01c";
const OFFERING_ID    = "ofrngddb7839568";

const GOLD_PACKS = [
  { id: "tengri_basic",   pkgId: "pkge60e4187500", price: 1990000, name: "Başlangıç 20 Altın" },
  { id: "tengri_plus",    pkgId: "pkge7b9ee5a73a", price: 4990000, name: "Plus 55 Altın" },
  { id: "tengri_premium", pkgId: "pkgeabb552bd3c", price: 9990000, name: "Premium 140 Altın" },
  { id: "tengri_vip",     pkgId: "pkge1b1bfd3fce", price: 19990000, name: "VIP 360 Altın" },
];

type TestPriceBody = { object: string; prices: any[] };

async function recreate() {
  // 1. Get all current products
  const c1 = await getUncachableRevenueCatClient();
  const { data: allData } = await listProducts({ client: c1, path: { project_id: PROJECT_ID }, query: { limit: 100 } });
  const all = allData.items ?? [];
  const testProds = all.filter(p => p.app_id === TEST_APP);
  console.log(`Found ${testProds.length} test store products`);

  for (const gp of GOLD_PACKS) {
    const existing = testProds.find(p => p.store_identifier === gp.id);
    if (existing) {
      console.log(`\n▶ ${gp.id} — existing: ${existing.id} (type: ${existing.type})`);
      
      // Detach from package
      const c2 = await getUncachableRevenueCatClient();
      await detachProductsFromPackage({ client: c2, path: { project_id: PROJECT_ID, package_id: gp.pkgId }, body: { product_ids: [existing.id] } });
      console.log(`  - Detached from package`);

      // Detach from entitlement
      const c3 = await getUncachableRevenueCatClient();
      await detachProductsFromEntitlement({ client: c3, path: { project_id: PROJECT_ID, entitlement_id: ENTITLEMENT_ID }, body: { product_ids: [existing.id] } });
      console.log(`  - Detached from entitlement`);

      // Delete
      const c4 = await getUncachableRevenueCatClient();
      const { error: delErr } = await deleteProduct({ client: c4, path: { project_id: PROJECT_ID, product_id: existing.id } });
      if (delErr) { console.log(`  ✗ Delete error: ${JSON.stringify(delErr)}`); continue; }
      console.log(`  ✓ Deleted`);
    } else {
      console.log(`\n▶ ${gp.id} — no existing test product`);
    }

    // Create consumable
    const c5 = await getUncachableRevenueCatClient();
    const { data: newProd, error: createErr } = await createProduct({
      client: c5,
      path: { project_id: PROJECT_ID },
      body: { store_identifier: gp.id, app_id: TEST_APP, type: "consumable", display_name: gp.name },
    });
    if (createErr) { console.log(`  ✗ Create error: ${JSON.stringify(createErr)}`); continue; }
    const newId = newProd.id;
    console.log(`  + Created consumable: ${newId}`);

    // Set price
    const c6 = await getUncachableRevenueCatClient();
    const { error: priceErr } = await c6.post<TestPriceBody>({
      url: "/projects/{project_id}/products/{product_id}/test_store_prices",
      path: { project_id: PROJECT_ID, product_id: newId },
      body: { prices: [{ amount_micros: gp.price, currency: "USD" }] },
    });
    console.log(priceErr ? `  ⚠ Price: ${(priceErr as any)?.message}` : `  + Price: $${gp.price/1000000}`);

    // Attach to entitlement
    const c7 = await getUncachableRevenueCatClient();
    const { error: entErr } = await attachProductsToEntitlement({ client: c7, path: { project_id: PROJECT_ID, entitlement_id: ENTITLEMENT_ID }, body: { product_ids: [newId] } });
    console.log(entErr ? `  ⚠ Entitlement: ${(entErr as any)?.message}` : `  + Attached to entitlement`);

    // Attach to package
    const c8 = await getUncachableRevenueCatClient();
    const { error: pkgErr } = await attachProductsToPackage({ client: c8, path: { project_id: PROJECT_ID, package_id: gp.pkgId }, body: { products: [{ product_id: newId, eligibility_criteria: "all" }] } });
    console.log(pkgErr ? `  ⚠ Package: ${(pkgErr as any)?.message}` : `  + Attached to package ✓`);
  }

  console.log("\n✅ Tamamlandı!");
}

recreate().catch(console.error);
