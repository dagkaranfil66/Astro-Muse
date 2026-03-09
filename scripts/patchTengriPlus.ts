import { getUncachableRevenueCatClient } from "./revenueCatClient";
import { createProductInStore } from "replit-revenuecat-v2";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;
const TEST_APP   = process.env.REVENUECAT_TEST_STORE_APP_ID!;
const PLUS_PROD  = "prodd5caba5f73";

type TestPriceBody = { object: string; prices: any[] };

async function patch() {
  // Try to set title via test store prices endpoint (might accept extra metadata)
  const c = await getUncachableRevenueCatClient();
  
  // Try createProductInStore for the test store product
  const { data, error } = await createProductInStore({
    client: c,
    path: { project_id: PROJECT_ID, product_id: PLUS_PROD },
    body: { 
      title: "Tengri 55 Altın Coin",
      store: "test_store",
    } as any,
  });
  
  if (error) {
    const e = error as any;
    console.log(`createProductInStore: ${e?.type} — ${e?.message}`);
    
    // Try via raw API call to patch title
    const c2 = await getUncachableRevenueCatClient();
    const { error: e2 } = await c2.post<any>({
      url: "/projects/{project_id}/products/{product_id}/store_products",
      path: { project_id: PROJECT_ID, product_id: PLUS_PROD },
      body: { title: "Tengri 55 Altın Coin", store: "test_store" },
    });
    if (e2) { console.log("Raw patch also failed:", JSON.stringify(e2)); }
    else { console.log("Raw patch succeeded!"); }
  } else {
    console.log("createProductInStore succeeded:", JSON.stringify(data));
  }
}
patch().catch(console.error);
