import { getUncachableRevenueCatClient } from "./revenueCatClient";
import { listPackages, getProductsFromPackage, listProducts } from "replit-revenuecat-v2";

const PROJECT_ID  = process.env.REVENUECAT_PROJECT_ID!;
const OFFERING_ID = "ofrngddb7839568";
const TEST_APP    = process.env.REVENUECAT_TEST_STORE_APP_ID!;

const PRICES: Record<string, number> = {
  tengri_basic: 1990000, tengri_plus: 4990000,
  tengri_premium: 9990000, tengri_vip: 19990000
};

type TestPriceBody = { object: string; prices: { amount_micros: number; currency: string }[] };

async function verify() {
  // List packages
  const c = await getUncachableRevenueCatClient();
  const { data: pkgData } = await listPackages({ client: c, path: { project_id: PROJECT_ID, offering_id: OFFERING_ID }, query: { limit: 50 } });
  const pkgs = pkgData.items ?? [];
  console.log(`\n✦ Offering'de ${pkgs.length} paket:`);

  // All products
  const c0 = await getUncachableRevenueCatClient();
  const { data: allProds } = await listProducts({ client: c0, path: { project_id: PROJECT_ID }, query: { limit: 100 } });
  const all = allProds.items ?? [];

  for (const pkg of pkgs) {
    const c2 = await getUncachableRevenueCatClient();
    const { data: prodData } = await getProductsFromPackage({ client: c2, path: { project_id: PROJECT_ID, package_id: pkg.id } });
    const attached = prodData?.items ?? [];
    const testProd = attached.find(p => p.app_id === TEST_APP);
    
    // Ensure USD price set
    const testProdObj = all.find(p => p.store_identifier === pkg.lookup_key && p.app_id === TEST_APP);
    if (testProdObj) {
      const c3 = await getUncachableRevenueCatClient();
      const { error: priceErr } = await c3.post<TestPriceBody>({
        url: "/projects/{project_id}/products/{product_id}/test_store_prices",
        path: { project_id: PROJECT_ID, product_id: testProdObj.id },
        body: { prices: [{ amount_micros: PRICES[pkg.lookup_key!] ?? 1990000, currency: "USD" }] },
      });
      const priceStatus = priceErr ? (priceErr as any)?.type === "resource_already_exists" ? "fiyat ✓" : `fiyat ✗` : "fiyat eklendi ✓";
      console.log(`  ${pkg.lookup_key} | bağlı: ${attached.length} ürün | test: ${testProd ? "✓" : "✗"} | ${priceStatus}`);
    } else {
      console.log(`  ${pkg.lookup_key} | bağlı: ${attached.length} ürün | test prod: bulunamadı`);
    }
  }
  console.log("\n✅ Doğrulama tamamlandı");
}

verify().catch(console.error);
