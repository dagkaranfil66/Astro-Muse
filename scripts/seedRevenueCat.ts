import { getUncachableRevenueCatClient } from "./revenueCatClient";
import {
  listProjects,
  listApps,
  listAppPublicApiKeys,
  listProducts,
  createProduct,
  listEntitlements,
  createEntitlement,
  attachProductsToEntitlement,
  listOfferings,
  createOffering,
  updateOffering,
  listPackages,
  createPackages,
  attachProductsToPackage,
  type App,
  type Product,
  type Offering,
} from "replit-revenuecat-v2";

const PROJECT_NAME = "Tengri";

const APP_STORE_BUNDLE_ID  = "com.tengristar.app";
const PLAY_STORE_PACKAGE_NAME = "com.tengristar.app";

const ENTITLEMENT_IDENTIFIER = "altın";
const ENTITLEMENT_DISPLAY_NAME = "Altın Erişimi";

const OFFERING_IDENTIFIER   = "default";
const OFFERING_DISPLAY_NAME = "Default Offering";

const GOLD_PRODUCTS = [
  {
    identifier: "tengri_basic",
    displayName: "Tengri Başlangıç",
    title: "20 Altın",
    packageLookupKey: "tengri_basic",
    packageDisplayName: "Başlangıç Paketi",
    prices: [
      { amount_micros: 1990000, currency: "USD" },
      { amount_micros: 1990000, currency: "TRY" },
    ],
  },
  {
    identifier: "tengri_plus",
    displayName: "Tengri Artı",
    title: "55 Altın (+5 Bonus)",
    packageLookupKey: "tengri_plus",
    packageDisplayName: "Popüler Paket",
    prices: [
      { amount_micros: 4990000, currency: "USD" },
      { amount_micros: 4990000, currency: "TRY" },
    ],
  },
  {
    identifier: "tengri_premium",
    displayName: "Tengri Premium",
    title: "140 Altın (+20 Bonus)",
    packageLookupKey: "tengri_premium",
    packageDisplayName: "Premium Paket",
    prices: [
      { amount_micros: 9990000, currency: "USD" },
      { amount_micros: 9990000, currency: "TRY" },
    ],
  },
  {
    identifier: "tengri_vip",
    displayName: "Tengri VIP",
    title: "360 Altın (+60 Bonus)",
    packageLookupKey: "tengri_vip",
    packageDisplayName: "Mega VIP Paketi",
    prices: [
      { amount_micros: 19990000, currency: "USD" },
      { amount_micros: 19990000, currency: "TRY" },
    ],
  },
];

type TestStorePricesResponse = {
  object: string;
  prices: { amount_micros: number; currency: string }[];
};

async function ensureProduct(
  client: any,
  projectId: string,
  existingProducts: Product[],
  targetApp: App,
  identifier: string,
  displayName: string,
  title: string,
  isTestStore: boolean
): Promise<Product> {
  const existing = existingProducts.find(
    (p) => p.store_identifier === identifier && p.app_id === targetApp.id
  );
  if (existing) {
    console.log(`  ✓ Product already exists [${targetApp.type}]: ${identifier}`);
    return existing;
  }

  const body: any = {
    store_identifier: identifier,
    app_id: targetApp.id,
    type: "consumable",
    display_name: displayName,
  };

  if (isTestStore) {
    body.title = title;
  }

  const { data, error } = await createProduct({ client, path: { project_id: projectId }, body });
  if (error) {
    const err = error as any;
    if (err?.type === "resource_already_exists") {
      // Product exists but wasn't in our cached list — fetch fresh and find it
      const { listProducts: lp } = await import("replit-revenuecat-v2");
      const freshClient2 = await getUncachableRevenueCatClient();
      const { data: freshList } = await lp({ client: freshClient2, path: { project_id: projectId }, query: { limit: 100 } });
      const found = freshList?.items?.find(
        (p) => p.store_identifier === identifier && p.app_id === targetApp.id
      ) ?? freshList?.items?.find((p) => p.store_identifier === identifier);
      if (found) {
        console.log(`  ✓ Product found (already existed) [${targetApp.type}]: ${identifier}`);
        return found;
      }
    }
    console.error("  ✗ Failed to create product:", identifier, error);
    throw new Error(`Failed to create product ${identifier}: ${JSON.stringify(error)}`);
  }
  console.log(`  + Created product [${targetApp.type}]: ${identifier} → ${data.id}`);
  return data;
}

async function seedRevenueCat() {
  const client = await getUncachableRevenueCatClient();

  // ── Find or use existing project ──────────────────────────────────
  const projectId = process.env.REVENUECAT_PROJECT_ID;
  if (!projectId) throw new Error("REVENUECAT_PROJECT_ID env var not set");

  const { data: projects, error: projError } = await listProjects({ client, query: { limit: 20 } });
  if (projError) throw new Error("Failed to list projects");

  const project = projects.items?.find((p) => p.id === projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);
  console.log("✓ Project:", project.name, `(${project.id})`);

  // ── Apps ─────────────────────────────────────────────────────────
  const { data: apps, error: appsError } = await listApps({ client, path: { project_id: project.id }, query: { limit: 20 } });
  if (appsError || !apps?.items?.length) throw new Error("Failed to list apps");

  let testApp = apps.items.find((a) => a.type === "test_store");
  let iosApp  = apps.items.find((a) => a.type === "app_store");
  let droidApp = apps.items.find((a) => a.type === "play_store");

  if (!testApp) throw new Error("No test store app found");
  console.log("✓ Test store app:", testApp.id);

  if (!iosApp) {
    const { data, error } = await (await import("replit-revenuecat-v2")).createApp({
      client, path: { project_id: project.id },
      body: { name: "Tengri iOS", type: "app_store", app_store: { bundle_id: APP_STORE_BUNDLE_ID } },
    });
    if (error) throw new Error("Failed to create iOS app");
    iosApp = data;
    console.log("+ Created iOS app:", iosApp.id);
  } else {
    console.log("✓ iOS app:", iosApp.id);
  }

  if (!droidApp) {
    const { data, error } = await (await import("replit-revenuecat-v2")).createApp({
      client, path: { project_id: project.id },
      body: { name: "Tengri Android", type: "play_store", play_store: { package_name: PLAY_STORE_PACKAGE_NAME } },
    });
    if (error) throw new Error("Failed to create Android app");
    droidApp = data;
    console.log("+ Created Android app:", droidApp.id);
  } else {
    console.log("✓ Android app:", droidApp.id);
  }

  // ── List existing products ────────────────────────────────────────
  const { data: existingProducts, error: prodListError } = await listProducts({
    client, path: { project_id: project.id }, query: { limit: 100 },
  });
  if (prodListError) throw new Error("Failed to list products");
  console.log(`\n✓ Existing products: ${existingProducts.items?.length ?? 0}`);

  // ── Entitlement ───────────────────────────────────────────────────
  const { data: entitlements } = await listEntitlements({ client, path: { project_id: project.id }, query: { limit: 20 } });
  let entitlement = entitlements?.items?.find((e) => e.lookup_key === ENTITLEMENT_IDENTIFIER);
  if (!entitlement) {
    const { data, error } = await createEntitlement({
      client, path: { project_id: project.id },
      body: { lookup_key: ENTITLEMENT_IDENTIFIER, display_name: ENTITLEMENT_DISPLAY_NAME },
    });
    if (error) throw new Error("Failed to create entitlement");
    entitlement = data;
    console.log("+ Created entitlement:", entitlement.id);
  } else {
    console.log("✓ Entitlement:", entitlement.lookup_key, `(${entitlement.id})`);
  }

  // ── Offering ──────────────────────────────────────────────────────
  const { data: offeringsData } = await listOfferings({ client, path: { project_id: project.id }, query: { limit: 20 } });
  let offering: Offering | undefined = offeringsData?.items?.find((o) => o.lookup_key === OFFERING_IDENTIFIER);
  if (!offering) {
    const { data, error } = await createOffering({
      client, path: { project_id: project.id },
      body: { lookup_key: OFFERING_IDENTIFIER, display_name: OFFERING_DISPLAY_NAME },
    });
    if (error) throw new Error("Failed to create offering");
    offering = data;
    console.log("+ Created offering:", offering.id);
  } else {
    console.log("✓ Offering:", offering.lookup_key, `(${offering.id})`);
  }

  if (!offering.is_current) {
    const { error } = await updateOffering({
      client, path: { project_id: project.id, offering_id: offering.id },
      body: { is_current: true },
    });
    if (error) throw new Error("Failed to set offering as current");
    console.log("✓ Set offering as current");
  }

  // ── Create products and packages ─────────────────────────────────
  console.log("\n── Creating gold packages ──────────────────────────────────");

  for (const gp of GOLD_PRODUCTS) {
    console.log(`\n▶ ${gp.identifier}`);

    const freshClient = await getUncachableRevenueCatClient();
    const { data: freshProducts } = await listProducts({ client: freshClient, path: { project_id: project.id }, query: { limit: 100 } });

    const testProduct  = await ensureProduct(freshClient, project.id, freshProducts.items ?? [], testApp, gp.identifier, gp.displayName, gp.title, true);
    const iosProduct   = await ensureProduct(freshClient, project.id, freshProducts.items ?? [], iosApp!, gp.identifier, gp.displayName, gp.title, false);
    const droidProduct = await ensureProduct(freshClient, project.id, freshProducts.items ?? [], droidApp!, gp.identifier, gp.displayName, gp.title, false);

    // Add test store prices
    const c2 = await getUncachableRevenueCatClient();
    const { error: priceError } = await c2.post<TestStorePricesResponse>({
      url: "/projects/{project_id}/products/{product_id}/test_store_prices",
      path: { project_id: project.id, product_id: testProduct.id },
      body: { prices: gp.prices },
    });
    if (priceError) {
      const errObj = priceError as any;
      if (errObj?.type === "resource_already_exists") {
        console.log("  ✓ Test store prices already set");
      } else {
        console.warn("  ⚠ Price set error:", JSON.stringify(priceError));
      }
    } else {
      console.log("  + Test store prices added");
    }

    // Attach to entitlement
    const c3 = await getUncachableRevenueCatClient();
    const { error: entErr } = await attachProductsToEntitlement({
      client: c3,
      path: { project_id: project.id, entitlement_id: entitlement!.id },
      body: { product_ids: [testProduct.id, iosProduct.id, droidProduct.id] },
    });
    if (entErr) {
      if ((entErr as any)?.type === "unprocessable_entity_error") {
        console.log("  ✓ Products already attached to entitlement");
      } else {
        console.warn("  ⚠ Entitlement attach error:", JSON.stringify(entErr));
      }
    } else {
      console.log("  + Attached to entitlement");
    }

    // Ensure package exists
    const c4 = await getUncachableRevenueCatClient();
    const { data: pkgList } = await listPackages({ client: c4, path: { project_id: project.id, offering_id: offering!.id }, query: { limit: 50 } });
    let pkg = pkgList?.items?.find((p) => p.lookup_key === gp.packageLookupKey);

    if (!pkg) {
      const c5 = await getUncachableRevenueCatClient();
      const { data: newPkg, error: pkgErr } = await createPackages({
        client: c5,
        path: { project_id: project.id, offering_id: offering!.id },
        body: { lookup_key: gp.packageLookupKey, display_name: gp.packageDisplayName },
      });
      if (pkgErr) {
        console.warn("  ⚠ Package create error:", JSON.stringify(pkgErr));
        continue;
      }
      pkg = newPkg;
      console.log("  + Created package:", pkg.id);
    } else {
      console.log("  ✓ Package exists:", pkg.id);
    }

    // Attach products to package
    const c6 = await getUncachableRevenueCatClient();
    const { error: pkgAttachErr } = await attachProductsToPackage({
      client: c6,
      path: { project_id: project.id, package_id: pkg.id },
      body: {
        products: [
          { product_id: testProduct.id,  eligibility_criteria: "all" },
          { product_id: iosProduct.id,   eligibility_criteria: "all" },
          { product_id: droidProduct.id, eligibility_criteria: "all" },
        ],
      },
    });
    if (pkgAttachErr) {
      const err = pkgAttachErr as any;
      if (err?.type === "unprocessable_entity_error") {
        console.log("  ✓ Products already attached to package");
      } else {
        console.warn("  ⚠ Package attach error:", JSON.stringify(pkgAttachErr));
      }
    } else {
      console.log("  + Products attached to package");
    }
  }

  // ── Print API keys ────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════");
  console.log("✅ RevenueCat seed complete!");
  const { data: testKeys } = await listAppPublicApiKeys({ client: await getUncachableRevenueCatClient(), path: { project_id: project.id, app_id: testApp.id } });
  const { data: iosKeys  } = await listAppPublicApiKeys({ client: await getUncachableRevenueCatClient(), path: { project_id: project.id, app_id: iosApp!.id } });
  const { data: droidKeys } = await listAppPublicApiKeys({ client: await getUncachableRevenueCatClient(), path: { project_id: project.id, app_id: droidApp!.id } });
  console.log("Test Store Key :", testKeys?.items?.[0]?.key ?? "N/A");
  console.log("iOS Key        :", iosKeys?.items?.[0]?.key ?? "N/A");
  console.log("Android Key    :", droidKeys?.items?.[0]?.key ?? "N/A");
  console.log("══════════════════════════════════════════");
}

seedRevenueCat().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
