import { getUncachableRevenueCatClient } from "./revenueCatClient";
import { listOfferings, listPackages } from "replit-revenuecat-v2";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;

async function main() {
  const c = await getUncachableRevenueCatClient();
  const { data: offerings } = await listOfferings({ client: c, path: { project_id: PROJECT_ID }, query: { limit: 20 } });
  const def = offerings?.items?.find((o: any) => o.lookup_key === "default");

  const c2 = await getUncachableRevenueCatClient();
  const { data: pkgs } = await listPackages({ client: c2, path: { project_id: PROJECT_ID, offering_id: def!.id }, query: { limit: 50 } });

  for (const pkg of (pkgs?.items ?? []) as any[]) {
    const c3 = await getUncachableRevenueCatClient();
    // Try WITHOUT offering_id in path
    const { data, error } = await (c3 as any).get({
      url: "/projects/{project_id}/packages/{package_id}/products",
      path: { project_id: PROJECT_ID, package_id: pkg.id },
    });
    if (error) {
      console.log(`${pkg.lookup_key}: GET /packages/${pkg.id}/products → ${JSON.stringify(error)}`);
    } else {
      const items = data?.items ?? [];
      console.log(`${pkg.lookup_key}: ${items.length} products → ${items.map((p: any) => `${p.store_identifier}(${p.app_id?.slice(-6)})`).join(", ")}`);
    }
  }
}
main().catch(console.error);
