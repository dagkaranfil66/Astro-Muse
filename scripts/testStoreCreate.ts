import { getUncachableRevenueCatClient } from "./revenueCatClient";
import { createProductInStore, listProducts, createProduct } from "replit-revenuecat-v2";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;
const TEST_APP   = process.env.REVENUECAT_TEST_STORE_APP_ID!;

async function test() {
  // Check current test store products
  const c = await getUncachableRevenueCatClient();
  const { data } = await listProducts({ client: c, path: { project_id: PROJECT_ID }, query: { limit: 100 } });
  const testProds = data.items?.filter(p => p.app_id === TEST_APP) ?? [];
  console.log("Current test store products:", testProds.map(p => `${p.store_identifier}(${p.type})`).join(", "));

  // Try createProduct with only "title" field (no display_name)
  const c2 = await getUncachableRevenueCatClient();
  const { data: newProd, error } = await createProduct({
    client: c2,
    path: { project_id: PROJECT_ID },
    body: { store_identifier: "tengri_basic", app_id: TEST_APP, type: "subscription", display_name: "Tengri Temel 20 Altın" } as any,
  });
  
  if (error) {
    const e = error as any;
    console.log(`\ncreateProduct error: ${e?.type} — ${e?.message}`);
    
    // Try with title field
    const c3 = await getUncachableRevenueCatClient();
    const { data: p2, error: e2 } = await createProduct({
      client: c3,
      path: { project_id: PROJECT_ID },
      body: { store_identifier: "tengri_basic", app_id: TEST_APP, type: "subscription", display_name: "Tengri Temel 20 Altın", title: "Tengri Temel 20 Altın" } as any,
    });
    if (e2) { console.log(`With title also failed: ${(e2 as any)?.message}`); }
    else { console.log(`With title succeeded: ${p2?.id}`); }
  } else {
    console.log(`Created: ${newProd?.id}`);
  }
}
test().catch(console.error);
