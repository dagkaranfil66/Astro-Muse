import { getUncachableRevenueCatClient } from "./revenueCatClient";
import {
  createProduct, listProducts,
  attachProductsToPackage, attachProductsToEntitlement,
} from "replit-revenuecat-v2";

const PROJECT_ID     = process.env.REVENUECAT_PROJECT_ID!;
const TEST_APP       = process.env.REVENUECAT_TEST_STORE_APP_ID!;
const ENTITLEMENT_ID = "entl0a6ac5c01c";

const PACKS = [
  { id: "tengri_basic",   pkgId: "pkge60e4187500", price: 1990000,  title: "Tengri 20 Altin Coin" },
  { id: "tengri_premium", pkgId: "pkgeabb552bd3c", price: 9990000,  title: "Tengri 140 Altin Coin" },
  { id: "tengri_vip",     pkgId: "pkge1b1bfd3fce", price: 19990000, title: "Tengri 360 Altin Coin" },
];

type TestPriceBody = { object: string; prices: any[] };

async function createSubs() {
  // Verify no existing test products for these
  const c0 = await getUncachableRevenueCatClient();
  const { data } = await listProducts({ client: c0, path: { project_id: PROJECT_ID }, query: { limit: 100 } });
  const all = data.items ?? [];
  const testProds = all.filter(p => p.app_id === TEST_APP);
  console.log("Existing test store products:", testProds.map(p => p.store_identifier).join(", "));

  for (const pack of PACKS) {
    const existing = testProds.find(p => p.store_identifier === pack.id);
    if (existing) { console.log(`\n${pack.id} already exists: ${existing.id} (${existing.type})`); continue; }
    console.log(`\n▶ Creating ${pack.id}...`);

    // Approach 1: subscription with duration in subscription object
    const c1 = await getUncachableRevenueCatClient();
    const { data: p1, error: e1 } = await createProduct({
      client: c1,
      path: { project_id: PROJECT_ID },
      body: {
        store_identifier: pack.id,
        app_id: TEST_APP,
        type: "subscription",
        display_name: pack.title,
        title: pack.title,
        subscription: { duration: "P1M" },
      } as any,
    });

    if (e1) {
      console.log(`  Approach 1 failed: ${(e1 as any)?.message}`);
      // Approach 2: duration at top level
      const c2 = await getUncachableRevenueCatClient();
      const { data: p2, error: e2 } = await createProduct({
        client: c2,
        path: { project_id: PROJECT_ID },
        body: {
          store_identifier: pack.id,
          app_id: TEST_APP,
          type: "subscription",
          display_name: pack.title,
          title: pack.title,
          duration: "P1M",
        } as any,
      });
      if (e2) { console.log(`  Approach 2 also failed: ${(e2 as any)?.message}`); continue; }
      const newId = p2.id;
      console.log(`  + Created (approach 2): ${newId}`);
      await attachAndPrice(newId, pack);
    } else {
      const newId = p1.id;
      console.log(`  + Created (approach 1): ${newId}`);
      await attachAndPrice(newId, pack);
    }
  }
  console.log("\n✅ Tamamlandı!");
}

async function attachAndPrice(prodId: string, pack: typeof PACKS[0]) {
  const c6 = await getUncachableRevenueCatClient();
  const { error: priceErr } = await (c6 as any).post({
    url: "/projects/{project_id}/products/{product_id}/test_store_prices",
    path: { project_id: PROJECT_ID, product_id: prodId },
    body: { prices: [{ amount_micros: pack.price, currency: "USD" }] },
  });
  console.log(priceErr ? `  ⚠ Price: ${(priceErr as any)?.message}` : `  + Price set`);

  const c7 = await getUncachableRevenueCatClient();
  const { error: entErr } = await attachProductsToEntitlement({ client: c7, path: { project_id: PROJECT_ID, entitlement_id: ENTITLEMENT_ID }, body: { product_ids: [prodId] } });
  console.log(entErr ? `  ⚠ Ent: ${(entErr as any)?.message}` : `  + Entitlement attached`);

  const c8 = await getUncachableRevenueCatClient();
  const { error: pkgErr } = await attachProductsToPackage({ client: c8, path: { project_id: PROJECT_ID, package_id: pack.pkgId }, body: { products: [{ product_id: prodId, eligibility_criteria: "all" }] } });
  console.log(pkgErr ? `  ⚠ Pkg: ${(pkgErr as any)?.message}` : `  + Package attached ✓`);
}

createSubs().catch(console.error);
