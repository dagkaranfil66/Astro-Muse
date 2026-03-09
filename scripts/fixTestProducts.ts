import { getUncachableRevenueCatClient } from "./revenueCatClient";
import {
  listProducts, createProduct,
  attachProductsToPackage, attachProductsToEntitlement,
  detachProductsFromPackage, detachProductsFromEntitlement,
} from "replit-revenuecat-v2";

const PROJECT_ID     = process.env.REVENUECAT_PROJECT_ID!;
const TEST_APP       = process.env.REVENUECAT_TEST_STORE_APP_ID!;
const ENTITLEMENT_ID = "entl0a6ac5c01c";

const GOLD_PACKS = [
  { id: "tengri_basic",   pkgId: "pkge60e4187500", price: 1990000,  title: "Tengri 20 Altın Coin", gold: 20 },
  { id: "tengri_plus",    pkgId: "pkge7b9ee5a73a", price: 4990000,  title: "Tengri 55 Altın Coin", gold: 55 },
  { id: "tengri_premium", pkgId: "pkgeabb552bd3c", price: 9990000,  title: "Tengri 140 Altın Coin", gold: 140 },
  { id: "tengri_vip",     pkgId: "pkge1b1bfd3fce", price: 19990000, title: "Tengri 360 Altın Coin", gold: 360 },
];

type TestPriceBody = { object: string; prices: any[] };

async function fixTestProducts() {
  const c = await getUncachableRevenueCatClient();
  const { data } = await listProducts({ client: c, path: { project_id: PROJECT_ID }, query: { limit: 100 } });
  const all = data.items ?? [];

  for (const gp of GOLD_PACKS) {
    const existing = all.find(p => p.store_identifier === gp.id && p.app_id === TEST_APP);
    console.log(`\n▶ ${gp.id}`);

    if (existing) {
      console.log(`  Existing: ${existing.id} (type: ${existing.type})`);
      // Re-attach existing to package + entitlement (in case it got detached)
      const c2 = await getUncachableRevenueCatClient();
      const { error: pkgErr } = await attachProductsToPackage({ client: c2, path: { project_id: PROJECT_ID, package_id: gp.pkgId }, body: { products: [{ product_id: existing.id, eligibility_criteria: "all" }] } });
      console.log(pkgErr ? `  ⚠ Pkg attach: ${(pkgErr as any)?.type}` : `  + Re-attached to package`);
      const c3 = await getUncachableRevenueCatClient();
      const { error: entErr } = await attachProductsToEntitlement({ client: c3, path: { project_id: PROJECT_ID, entitlement_id: ENTITLEMENT_ID }, body: { product_ids: [existing.id] } });
      console.log(entErr ? `  ⚠ Ent attach: ${(entErr as any)?.type}` : `  + Re-attached to entitlement`);
      
      // Set/update price for existing product
      const c4 = await getUncachableRevenueCatClient();
      await c4.post<TestPriceBody>({ url: "/projects/{project_id}/products/{product_id}/test_store_prices", path: { project_id: PROJECT_ID, product_id: existing.id }, body: { prices: [{ amount_micros: gp.price, currency: "USD" }] } });
      console.log(`  + Price ensured`);
      continue;
    }

    // Create new consumable product with title
    const c5 = await getUncachableRevenueCatClient();
    const { data: newProd, error: createErr } = await createProduct({
      client: c5,
      path: { project_id: PROJECT_ID },
      body: { store_identifier: gp.id, app_id: TEST_APP, type: "consumable", display_name: gp.title, title: gp.title } as any,
    });

    if (createErr) {
      console.log(`  ✗ Create: ${JSON.stringify(createErr)}`);
      continue;
    }
    const newId = newProd.id;
    console.log(`  + Created: ${newId}`);

    // Set price
    const c6 = await getUncachableRevenueCatClient();
    const { error: priceErr } = await c6.post<TestPriceBody>({ url: "/projects/{project_id}/products/{product_id}/test_store_prices", path: { project_id: PROJECT_ID, product_id: newId }, body: { prices: [{ amount_micros: gp.price, currency: "USD" }] } });
    console.log(priceErr ? `  ⚠ Price: ${(priceErr as any)?.message}` : `  + Price set`);

    // Attach to entitlement
    const c7 = await getUncachableRevenueCatClient();
    const { error: entErr } = await attachProductsToEntitlement({ client: c7, path: { project_id: PROJECT_ID, entitlement_id: ENTITLEMENT_ID }, body: { product_ids: [newId] } });
    console.log(entErr ? `  ⚠ Ent: ${(entErr as any)?.message}` : `  + Entitlement attached`);

    // Attach to package
    const c8 = await getUncachableRevenueCatClient();
    const { error: pkgErr } = await attachProductsToPackage({ client: c8, path: { project_id: PROJECT_ID, package_id: gp.pkgId }, body: { products: [{ product_id: newId, eligibility_criteria: "all" }] } });
    console.log(pkgErr ? `  ⚠ Pkg: ${(pkgErr as any)?.message}` : `  + Package attached ✓`);
  }

  console.log("\n✅ Tamamlandı!");
}

fixTestProducts().catch(console.error);
