import { fetch } from "expo/fetch";
import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Gets the base URL for the Express API server.
 *
 * Priority order:
 * 1. EXPO_PUBLIC_API_URL — explicit override baked in at build time (production builds)
 * 2. window.location.origin — on web/Median WebView, uses the current page origin
 *    so API requests are same-origin (no CORS). Metro dev server proxies /api/*
 *    to Express (port 5000) internally.
 * 3. EXPO_PUBLIC_DOMAIN — fallback for native Expo runtime (dev/local builds)
 */
export function getApiUrl(): string {
  // 1. On web (Median WebView / browser): use current page origin.
  //    This auto-adapts to dev domain in development and production domain in
  //    production without needing an explicit env var override.
  if (
    typeof window !== "undefined" &&
    typeof window.location !== "undefined" &&
    window.location.origin &&
    window.location.origin !== "null"
  ) {
    return window.location.origin;
  }

  // 2. On native (iOS/Android Expo runtime, no window.location):
  //    Use the explicit API URL baked in at bundle build time.
  //    EXPO_PUBLIC_API_URL is set to the production URL for production builds.
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  }

  // 3. Native fallback: derive URL from EXPO_PUBLIC_DOMAIN (dev builds)
  const host = process.env.EXPO_PUBLIC_DOMAIN;
  if (host) {
    return new URL(`https://${host}`).origin;
  }

  // 4. Last-resort hardcoded production URL — ensures the app never crashes
  //    if env vars somehow get stripped during the build process.
  console.warn("[getApiUrl] No env var found, falling back to hardcoded production URL");
  return "https://astro-muse.replit.app";
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const res = await fetch(url.toString(), {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const res = await fetch(url.toString(), {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
