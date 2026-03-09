import { getUncachableRevenueCatClient } from "./revenueCatClient";
import { listProducts, getProduct } from "replit-revenuecat-v2";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;
const TEST_APP   = process.env.REVENUECAT_TEST_STORE_APP_ID!;

async function checkPlus() {
  const c = await getUncachableRevenueCatClient();
  const { data } = await listProducts({ client: c, path: { project_id: PROJECT_ID }, query: { limit: 100 } });
  const plusProd = data.items?.find(p => p.store_identifier === "tengri_plus" && p.app_id === TEST_APP);
  if (!plusProd) { console.log("tengri_plus test product not found!"); return; }
  
  const c2 = await getUncachableRevenueCatClient();
  const { data: prod } = await getProduct({ client: c2, path: { project_id: PROJECT_ID, product_id: plusProd.id } });
  console.log("tengri_plus full details:");
  console.log(JSON.stringify(prod, null, 2));
}
checkPlus().catch(console.error);
