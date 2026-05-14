const fs = require('fs');
const path = require('path');

// ── Fix 1: PromiseUtlis.kt ─────────────────────────────────────────────────
// ObjectAlreadyConsumedException is internal in newer RN bridge
// String? → String mismatch for Promise.reject
const promiseUtlisPath = path.join(
  __dirname,
  '../node_modules/react-native-iap/android/src/main/java/com/dooboolab/rniap/PromiseUtlis.kt'
);

if (fs.existsSync(promiseUtlisPath)) {
  let content = fs.readFileSync(promiseUtlisPath, 'utf8');
  let changed = false;

  if (content.includes('ObjectAlreadyConsumedException')) {
    content = content.replace("import com.facebook.react.bridge.ObjectAlreadyConsumedException\n", "");
    content = content.replace(/} catch \(oce: ObjectAlreadyConsumedException\) \{/g, '} catch (e: Exception) {');
    content = content.replace(/Log\.d\(TAG, "Already consumed \$\{oce\.message\}"\)/g, 'Log.d(TAG, "Already consumed ${e.message}")');
    changed = true;
  }

  if (content.includes('this.reject(code, message, throwable)')) {
    content = content.replace('this.reject(code, message, throwable)', 'this.reject(code ?: "", message, throwable)');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(promiseUtlisPath, content, 'utf8');
    console.log('[fix-rn-iap] Patched PromiseUtlis.kt');
  } else {
    console.log('[fix-rn-iap] PromiseUtlis.kt already patched, skipping.');
  }
} else {
  console.warn('[fix-rn-iap] PromiseUtlis.kt not found, skipping.');
}

// ── Fix 2: RNIapModule.kt ─────────────────────────────────────────────────
// (a) enablePendingPurchases() no-arg removed in Billing Library 7.x
// (b) currentActivity unresolved + Activity type mismatch (Kotlin 2.x)
const rniapModulePath = path.join(
  __dirname,
  '../node_modules/react-native-iap/android/src/play/java/com/dooboolab/rniap/RNIapModule.kt'
);

if (fs.existsSync(rniapModulePath)) {
  let content = fs.readFileSync(rniapModulePath, 'utf8');
  let changed = false;

  // (a) enablePendingPurchases() → new Billing Library 7.x API
  if (content.includes('.enablePendingPurchases()') && !content.includes('PendingPurchasesParams')) {
    content = content.replace(
      'import com.android.billingclient.api.BillingClient',
      'import com.android.billingclient.api.BillingClient\nimport com.android.billingclient.api.PendingPurchasesParams'
    );
    content = content.replace(
      '.enablePendingPurchases()',
      '.enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())'
    );
    changed = true;
    console.log('[fix-rn-iap] Fixed enablePendingPurchases() for Billing Library 7.x');
  }

  // (b) Activity import + currentActivity fix (Kotlin 2.x)
  if (!content.includes('import android.app.Activity')) {
    content = content.replace('import android.util.Log', 'import android.app.Activity\nimport android.util.Log');
    changed = true;
  }

  if (content.includes('val activity = currentActivity')) {
    content = content.replace('val activity = currentActivity', 'val activity = reactContext.currentActivity as? Activity');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(rniapModulePath, content, 'utf8');
    console.log('[fix-rn-iap] Patched RNIapModule.kt');
  } else {
    console.log('[fix-rn-iap] RNIapModule.kt already patched, skipping.');
  }
} else {
  console.warn('[fix-rn-iap] RNIapModule.kt not found, skipping.');
}
