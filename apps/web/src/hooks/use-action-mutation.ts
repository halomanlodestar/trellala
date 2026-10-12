"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ActionError } from "@/lib/action-error";
import type { ActionResult } from "@/types";

type Options<T> = {
  success?: string;
  invalidate?: QueryKey[];
  /** Re-render server components after success (default true). */
  refresh?: boolean;
  onSuccess?: (data: T) => void;
  /** Return true to suppress the default error toast (e.g. when showing field errors). */
  onError?: (error: ActionError) => boolean | void;
};

/** Calls a server action through TanStack Query; unwraps ActionResult and toasts errors. */
export function useActionMutation<I, T>(action: (input: I) => Promise<ActionResult<T>>, opts: Options<T> = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<T, ActionError, I>({
    mutationFn: async (input) => {
      const result = await action(input);
      if (!result.ok) throw new ActionError(result.error);
      return result.data;
    },
    onSuccess: async (data) => {
      await Promise.all((opts.invalidate ?? []).map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      if (opts.refresh !== false) router.refresh();
      if (opts.success) toast.success(opts.success);
      opts.onSuccess?.(data);
    },
    onError: (error) => {
      if (opts.onError?.(error)) return;
      toast.error(error.message);
    },
  });
}
