import { getUncachableRevenueCatClient } from "./revenueCatClient";
import { listOfferings, listPackages } from "replit-revenuecat-v2";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;

async function main() {
  const c = await getUncachableRevenueCatClient();
  const { data: offerings } = await listOfferings({ client: c, path: { project_id: PROJECT_ID }, query: { limit: 20 } });
  const def = offerings?.items?.find((o: any) => o.lookup_key === "default");

  const c2 = await getUncachableRevenueCatClient();
  const { data: pkgs } = await listPackages({ client: c2, path: { project_id: PROJECT_ID, offering_id: def!.id }, query: { limit: 50 } });

  // Print first package full data to understand structure
  if (pkgs?.items?.length) {
    console.log("Full package object sample:", JSON.stringify(pkgs.items[0], null, 2));
  }
}
main().catch(console.error);
