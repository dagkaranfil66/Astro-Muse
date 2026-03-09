import { getUncachableRevenueCatClient } from "./revenueCatClient";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;
const OFFERING_ID = "ofrngddb7839568";
const PACKAGES = [
  { name: "tengri_basic",   id: "pkge60e4187500" },
  { name: "tengri_plus",    id: "pkge7b9ee5a73a" },
  { name: "tengri_premium", id: "pkgeabb552bd3c" },
  { name: "tengri_vip",     id: "pkge1b1bfd3fce" },
];

async function main() {
  const c = await getUncachableRevenueCatClient();
  for (const pkg of PACKAGES) {
    const { data, error } = await (c as any).get({
      url: "/projects/{project_id}/offerings/{offering_id}/packages/{package_id}/products",
      path: { project_id: PROJECT_ID, offering_id: OFFERING_ID, package_id: pkg.id },
    });
    if (error) {
      console.log(`${pkg.name}: ERROR ${JSON.stringify(error)}`);
    } else {
      const items = data?.items ?? [];
      console.log(`${pkg.name} has ${items.length} product(s):`);
      for (const p of items) {
        console.log(`  → ${p.store_identifier} | type=${p.type} | id=${p.id} | app_id=${p.app_id}`);
      }
    }
  }
}
main().catch(console.error);
