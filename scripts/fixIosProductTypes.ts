import { getUncachableRevenueCatClient } from "./revenueCatClient";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;

// tengri_premium iOS (consumable→subscription) and tengri_vip iOS (consumable→subscription)
const TO_FIX = [
  { id: "prod5efb34d191", name: "tengri_premium (iOS)" },
  { id: "prod6ef0211c48", name: "tengri_vip (iOS)" },
];

async function main() {
  for (const prod of TO_FIX) {
    const c = await getUncachableRevenueCatClient();
    const { data, error } = await (c as any).post({
      url: "/projects/{project_id}/products/{product_id}",
      path: { project_id: PROJECT_ID, product_id: prod.id },
      body: { type: "subscription", subscription: { duration: "P1M" } },
    });
    if (error) {
      // Try PATCH
      const c2 = await getUncachableRevenueCatClient();
      const { data: d2, error: e2 } = await (c2 as any).patch({
        url: "/projects/{project_id}/products/{product_id}",
        path: { project_id: PROJECT_ID, product_id: prod.id },
        body: { type: "subscription" },
      });
      if (e2) console.log(`${prod.name}: ${JSON.stringify(e2)}`);
      else console.log(`✓ ${prod.name} updated via PATCH: ${JSON.stringify(d2)}`);
    } else {
      console.log(`✓ ${prod.name} updated: ${JSON.stringify(data)}`);
    }
  }
}
main().catch(console.error);
