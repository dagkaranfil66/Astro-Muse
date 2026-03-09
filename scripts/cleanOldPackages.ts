import { getUncachableRevenueCatClient } from "./revenueCatClient";
import { listPackages, deletePackageFromOffering } from "replit-revenuecat-v2";

const PROJECT_ID   = process.env.REVENUECAT_PROJECT_ID!;
const OFFERING_ID  = "ofrngddb7839568";
const VALID_KEYS   = new Set(["tengri_basic", "tengri_plus", "tengri_premium", "tengri_vip"]);

async function clean() {
  const c = await getUncachableRevenueCatClient();
  const { data } = await listPackages({ client: c, path: { project_id: PROJECT_ID, offering_id: OFFERING_ID }, query: { limit: 50 } });
  const pkgs = data.items ?? [];

  console.log(`Found ${pkgs.length} packages:`);
  pkgs.forEach(p => console.log(`  ${p.lookup_key} | ${p.id}`));

  const toDelete = pkgs.filter(p => !VALID_KEYS.has(p.lookup_key!));
  console.log(`\nDeleting ${toDelete.length} old packages...`);

  for (const pkg of toDelete) {
    const c2 = await getUncachableRevenueCatClient();
    const { error } = await deletePackageFromOffering({
      client: c2,
      path: { project_id: PROJECT_ID, offering_id: OFFERING_ID, package_id: pkg.id },
    });
    if (error) {
      console.log(`  ✗ ${pkg.lookup_key}: ${JSON.stringify(error)}`);
    } else {
      console.log(`  ✓ Silindi: ${pkg.lookup_key}`);
    }
  }
  console.log("\n✅ Temizlik tamamlandı!");
}

clean().catch(console.error);
