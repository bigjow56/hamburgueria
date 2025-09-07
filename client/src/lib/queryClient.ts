import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Overloaded function signatures
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response>;
export async function apiRequest(
  url: string,
  options: { method: string; body?: unknown },
): Promise<Response>;

// Implementation
export async function apiRequest(
  methodOrUrl: string,
  urlOrOptions: string | { method: string; body?: unknown },
  data?: unknown | undefined,
): Promise<Response> {
  let method: string;
  let url: string;
  let bodyData: unknown;

  // Check if first argument looks like a URL (starts with / or http)
  if (methodOrUrl.startsWith('/') || methodOrUrl.startsWith('http')) {
    // URL-first pattern: apiRequest("/api/endpoint", { method: "POST", body: data })
    url = methodOrUrl;
    const options = urlOrOptions as { method: string; body?: unknown };
    method = options.method;
    bodyData = options.body;
  } else {
    // Method-first pattern: apiRequest("POST", "/api/endpoint", data)
    method = methodOrUrl;
    url = urlOrOptions as string;
    bodyData = data;
  }

  const res = await fetch(url, {
    method,
    headers: bodyData ? { "Content-Type": "application/json" } : {},
    body: bodyData ? JSON.stringify(bodyData) : undefined,
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
    const res = await fetch(queryKey.join("/") as string, {
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
