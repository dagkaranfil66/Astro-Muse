import { fetch } from "expo/fetch";
import { Platform } from "react-native";
import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Gets the base URL for the Express API server.
 *
 * NATIVE (iOS/Android): ALWAYS use build-time env var. Do NOT trust window.location
 * because expo-router polyfills it from app.json's `extra.router.origin` value.
 *
 * WEB (browser): use window.location.origin so API requests are same-origin.
 */
export function getApiUrl(): string {
  // ── NATIVE PATH ──────────────────────────────────────────────────────────
  if (Platform.OS !== "web") {
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
    }
    const host = process.env.EXPO_PUBLIC_DOMAIN;
    if (host) {
      return new URL(`https://${host}`).origin;
    }
    return "https://astro-muse.replit.app";
  }

  // ── WEB PATH ─────────────────────────────────────────────────────────────
  if (
    typeof window !== "undefined" &&
    typeof window.location !== "undefined" &&
    window.location.origin &&
    window.location.origin !== "null" &&
    // Defensive: if window.location.origin is the bare replit.com (router polyfill leak),
    // fall through to env var instead of pointing API at the wrong host.
    !/^https?:\/\/replit\.com\/?$/i.test(window.location.origin)
  ) {
    return window.location.origin;
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  }
  const host = process.env.EXPO_PUBLIC_DOMAIN;
  if (host) {
    return new URL(`https://${host}`).origin;
  }
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
