import { getUncachableRevenueCatClient } from "./revenueCatClient";
import {
  listProducts, createProduct, deleteProduct,
  detachProductsFromPackage, detachProductsFromEntitlement,
  attachProductsToPackage, attachProductsToEntitlement,
  getProductsFromPackage,
} from "replit-revenuecat-v2";

const PROJECT_ID     = process.env.REVENUECAT_PROJECT_ID!;
const TEST_APP       = process.env.REVENUECAT_TEST_STORE_APP_ID!;
const ENTITLEMENT_ID = "entl0a6ac5c01c";

const PACKS = [
  { id: "tengri_basic",   pkgId: "pkge60e4187500", price: 1990000,  name: "Tengri 20 Altın Coin" },
  { id: "tengri_premium", pkgId: "pkgeabb552bd3c", price: 9990000,  name: "Tengri 140 Altın Coin" },
  { id: "tengri_vip",     pkgId: "pkge1b1bfd3fce", price: 19990000, name: "Tengri 360 Altın Coin" },
];

type TestPriceBody = { object: string; prices: any[] };

async function fixAll() {
  const c = await getUncachableRevenueCatClient();
  const { data } = await listProducts({ client: c, path: { project_id: PROJECT_ID }, query: { limit: 100 } });
  const all = data.items ?? [];

  for (const pack of PACKS) {
    console.log(`\n▶ ${pack.id}`);
    const existing = all.find(p => p.store_identifier === pack.id && p.app_id === TEST_APP);

    if (existing) {
      // Detach and delete consumable
      const c2 = await getUncachableRevenueCatClient();
      await detachProductsFromPackage({ client: c2, path: { project_id: PROJECT_ID, package_id: pack.pkgId }, body: { product_ids: [existing.id] } });
      const c3 = await getUncachableRevenueCatClient();
      await detachProductsFromEntitlement({ client: c3, path: { project_id: PROJECT_ID, entitlement_id: ENTITLEMENT_ID }, body: { product_ids: [existing.id] } });
      const c4 = await getUncachableRevenueCatClient();
      const { error: delErr } = await deleteProduct({ client: c4, path: { project_id: PROJECT_ID, product_id: existing.id } });
      if (delErr) { console.log(`  ✗ Del: ${(delErr as any)?.message}`); continue; }
      console.log(`  - Deleted ${existing.type}: ${existing.id}`);
    }

    // Create subscription (same type as working tengri_plus)
    const c5 = await getUncachableRevenueCatClient();
    const { data: newProd, error: createErr } = await createProduct({
      client: c5,
      path: { project_id: PROJECT_ID },
      body: { store_identifier: pack.id, app_id: TEST_APP, type: "subscription", display_name: pack.name } as any,
    });
    if (createErr) { console.log(`  ✗ Create: ${(createErr as any)?.message}`); continue; }
    const newId = newProd.id;
    console.log(`  + Created subscription: ${newId}`);

    // Set price
    const c6 = await getUncachableRevenueCatClient();
    const { error: priceErr } = await c6.post<TestPriceBody>({
      url: "/projects/{project_id}/products/{product_id}/test_store_prices",
      path: { project_id: PROJECT_ID, product_id: newId },
      body: { prices: [{ amount_micros: pack.price, currency: "USD" }] },
    });
    console.log(priceErr ? `  ⚠ Price: ${(priceErr as any)?.message}` : `  + Price set`);

    // Attach to entitlement
    const c7 = await getUncachableRevenueCatClient();
    const { error: entErr } = await attachProductsToEntitlement({ client: c7, path: { project_id: PROJECT_ID, entitlement_id: ENTITLEMENT_ID }, body: { product_ids: [newId] } });
    console.log(entErr ? `  ⚠ Ent: ${(entErr as any)?.message}` : `  + Entitlement attached`);

    // Attach to package
    const c8 = await getUncachableRevenueCatClient();
    const { error: pkgErr } = await attachProductsToPackage({ client: c8, path: { project_id: PROJECT_ID, package_id: pack.pkgId }, body: { products: [{ product_id: newId, eligibility_criteria: "all" }] } });
    console.log(pkgErr ? `  ⚠ Pkg: ${(pkgErr as any)?.message}` : `  + Package attached ✓`);
  }
  console.log("\n✅ Tamamlandı!");
}
fixAll().catch(console.error);
