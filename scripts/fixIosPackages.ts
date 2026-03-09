import { getUncachableRevenueCatClient } from "./revenueCatClient";
import { listOfferings, listPackages } from "replit-revenuecat-v2";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;
const IOS_APP_ID = process.env.REVENUECAT_APPLE_APP_STORE_APP_ID!;
const DROID_APP_ID = process.env.REVENUECAT_GOOGLE_PLAY_STORE_APP_ID!;

// Package ID → correct iOS product ID
const IOS_FIX = {
  "pkgeabb552bd3c": { name: "tengri_premium", correctIosProd: "prod5efb34d191", badProd: "prod53e04134ff" },
  "pkge1b1bfd3fce": { name: "tengri_vip",     correctIosProd: "prod6ef0211c48", badProd: "proded6f371cde" },
};

// Also fix Android packages (wrong :monthly identifiers)
// tengri_basic package: detach prod48465550c1 (tengri_basic:monthly android)
// tengri_plus package: detach prod6d2637c1c0 (tengri_plus:monthly android)
const DROID_DETACH = {
  "pkge60e4187500": { name: "tengri_basic", badProd: "prod48465550c1" },
  "pkge7b9ee5a73a": { name: "tengri_plus",  badProd: "prod6d2637c1c0" },
};

async function detach(packageId: string, productId: string, label: string) {
  const c = await getUncachableRevenueCatClient();
  const { data, error } = await (c as any).post({
    url: "/projects/{project_id}/packages/{package_id}/actions/detach_products",
    path: { project_id: PROJECT_ID, package_id: packageId },
    body: { product_ids: [productId] },
  });
  if (error) console.log(`  ✗ Detach ${label}: ${JSON.stringify(error)}`);
  else console.log(`  ✓ Detached ${label}`);
}

async function attach(packageId: string, productId: string, label: string) {
  const c = await getUncachableRevenueCatClient();
  const { data, error } = await (c as any).post({
    url: "/projects/{project_id}/packages/{package_id}/actions/attach_products",
    path: { project_id: PROJECT_ID, package_id: packageId },
    body: { products: [{ product_id: productId, eligibility_criteria: "all" }] },
  });
  if (error) {
    const e = error as any;
    if (e?.type === "unprocessable_entity_error") console.log(`  ✓ ${label} already attached`);
    else console.log(`  ✗ Attach ${label}: ${JSON.stringify(error)}`);
  } else {
    console.log(`  ✓ Attached ${label}`);
  }
}

async function main() {
  // Fix iOS packages
  for (const [pkgId, fix] of Object.entries(IOS_FIX)) {
    console.log(`\n[${fix.name}]`);
    await detach(pkgId, fix.badProd, `bad iOS prod ${fix.badProd}`);
    await attach(pkgId, fix.correctIosProd, `correct iOS prod ${fix.correctIosProd}`);
  }

  // Fix Android wrong :monthly identifiers
  for (const [pkgId, fix] of Object.entries(DROID_DETACH)) {
    console.log(`\n[${fix.name}] remove :monthly android`);
    await detach(pkgId, fix.badProd, `bad Android prod ${fix.badProd}`);
  }

  console.log("\n✅ Done. Verify with: npx tsx scripts/checkRevenueCat.ts");
}
main().catch(console.error);
