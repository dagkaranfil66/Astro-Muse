import { getUncachableRevenueCatClient } from "./revenueCatClient";
import { listOfferings, listPackages } from "replit-revenuecat-v2";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;
const TEST_APP = process.env.REVENUECAT_TEST_STORE_APP_ID!;

async function main() {
  const c = await getUncachableRevenueCatClient();
  const { data: offerings } = await listOfferings({ client: c, path: { project_id: PROJECT_ID }, query: { limit: 20 } });
  const def = offerings?.items?.find((o: any) => o.lookup_key === "default");

  const c2 = await getUncachableRevenueCatClient();
  const { data: pkgs } = await listPackages({ client: c2, path: { project_id: PROJECT_ID, offering_id: def!.id }, query: { limit: 50 } });

  for (const pkg of (pkgs?.items ?? []) as any[]) {
    const c3 = await getUncachableRevenueCatClient();
    const { data } = await (c3 as any).get({
      url: "/projects/{project_id}/packages/{package_id}/products",
      path: { project_id: PROJECT_ID, package_id: pkg.id },
    });
    const items = data?.items ?? [];
    console.log(`\n=== ${pkg.lookup_key} ===`);
    for (const item of items) {
      console.log("  keys:", Object.keys(item));
      console.log("  product_id:", item.product_id);
      console.log("  store_identifier:", item.store_identifier);
      console.log("  eligibility_criteria:", item.eligibility_criteria);
      console.log("  full:", JSON.stringify(item));
    }
  }
}
main().catch(console.error);
