import { QueryClient } from "@tanstack/react-query";

let browserClient: QueryClient | undefined;

/** New client per server render; one shared client in the browser. */
export function getQueryClient() {
  const make = () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
  if (typeof window === "undefined") return make();
  browserClient ??= make();
  return browserClient;
}
