/**
 * DEPRECATED: This file is no longer used
 * The frontend now uses React Query directly with the API client (@/lib/api.ts)
 * instead of tRPC.
 * 
 * This file is kept for reference only and can be deleted.
 */

// Export a dummy implementation to prevent build errors if any old imports remain
export const trpc = {
  createClient: () => null,
  Provider: ({ children }: any) => children,
};

