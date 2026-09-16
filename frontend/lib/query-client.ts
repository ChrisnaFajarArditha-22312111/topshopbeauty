import { QueryClient } from "@tanstack/react-query";

/**
 * Konfigurasi default TanStack QueryClient
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 menit data dianggap fresh
      gcTime: 1000 * 60 * 10,    // 10 menit data disimpan di memory cache
      retry: 1,                 // Retry 1x untuk kegagalan transient
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
