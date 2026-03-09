import { getUncachableRevenueCatClient } from "./revenueCatClient";
import { listOfferings, listPackages } from "replit-revenuecat-v2";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;

async function main() {
  const c = await getUncachableRevenueCatClient();
  const { data: offerings } = await listOfferings({ client: c, path: { project_id: PROJECT_ID }, query: { limit: 20 } });
  const def = offerings?.items?.find((o: any) => o.lookup_key === "default");
  if (!def) { console.log("No default offering!"); return; }
  console.log("Offering ID:", def.id);

  const c2 = await getUncachableRevenueCatClient();
  const { data: pkgs } = await listPackages({ client: c2, path: { project_id: PROJECT_ID, offering_id: def.id }, query: { limit: 50 } });

  for (const pkg of (pkgs?.items ?? []) as any[]) {
    console.log(`\nPackage: ${pkg.lookup_key} (${pkg.id})`);
    // Try to get products attached to this package
    const c3 = await getUncachableRevenueCatClient();
    const { data: prodData, error } = await (c3 as any).get({
      url: "/projects/{project_id}/offerings/{offering_id}/packages/{package_id}",
      path: { project_id: PROJECT_ID, offering_id: def.id, package_id: pkg.id },
    });
    if (error) {
      console.log(`  GET error: ${JSON.stringify(error)}`);
    } else {
      console.log(`  Full pkg data:`, JSON.stringify(prodData));
    }
  }
}
main().catch(console.error);
