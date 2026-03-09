import { getUncachableRevenueCatClient } from "./revenueCatClient";
import { getProductsFromPackage, detachProductsFromPackage, attachProductsToPackage, listProducts } from "replit-revenuecat-v2";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;
const TEST_APP   = process.env.REVENUECAT_TEST_STORE_APP_ID!;

const TO_FIX = [
  { id: "tengri_premium", pkgId: "pkgeabb552bd3c", newProdId: "prodf33f865580" },
  { id: "tengri_vip",     pkgId: "pkge1b1bfd3fce", newProdId: "prod3f230cc5bc" },
];

async function swap() {
  for (const item of TO_FIX) {
    console.log(`\n▶ ${item.id}`);
    const c = await getUncachableRevenueCatClient();
    const { data } = await getProductsFromPackage({ client: c, path: { project_id: PROJECT_ID, package_id: item.pkgId } });
    const attached = (data as any)?.items ?? [];
    const oldTestProd = attached.find((p: any) => p.product?.app_id === TEST_APP);
    
    if (oldTestProd) {
      const oldId = oldTestProd.product?.id;
      console.log(`  Old test prod: ${oldId}`);
      const c2 = await getUncachableRevenueCatClient();
      const { error } = await detachProductsFromPackage({ client: c2, path: { project_id: PROJECT_ID, package_id: item.pkgId }, body: { product_ids: [oldId] } });
      console.log(error ? `  ✗ Detach: ${JSON.stringify(error)}` : `  - Detached old`);
    }
    
    const c3 = await getUncachableRevenueCatClient();
    const { error: attErr } = await attachProductsToPackage({ client: c3, path: { project_id: PROJECT_ID, package_id: item.pkgId }, body: { products: [{ product_id: item.newProdId, eligibility_criteria: "all" }] } });
    console.log(attErr ? `  ✗ Attach: ${JSON.stringify(attErr)}` : `  + New consumable attached ✓`);
  }
  console.log("\n✅ Tamamlandı!");
}
swap().catch(console.error);
