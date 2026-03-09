import { getUncachableRevenueCatClient } from "./revenueCatClient";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;

async function main() {
  const c = await getUncachableRevenueCatClient();
  const { data } = await (c as any).get({
    url: "/projects/{project_id}/products",
    path: { project_id: PROJECT_ID },
    query: { limit: 50 },
  });
  const items: any[] = data?.items ?? [];
  const testStore = items.filter(i => i.app?.type === "test_store");
  for (const p of testStore) {
    console.log(`\n[${p.store_identifier}] id=${p.id}`);
    console.log(`  type: ${p.type}`);
    console.log(`  display_name: ${p.display_name}`);
    console.log(`  title: ${p.title}`);
    console.log(`  subscription: ${JSON.stringify(p.subscription)}`);
    console.log(`  created_at: ${p.created_at}`);
  }
}
main().catch(console.error);
