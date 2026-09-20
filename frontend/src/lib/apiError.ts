import { isAxiosError } from "axios";
import type { ApiErrorResponse } from "@/types/auth";

/**
 * The API always returns errors as ApiErrorResponse ({ success, statusCode, message,
 * errors, traceId }) — this pulls a single display-ready string out of that shape,
 * falling back gracefully for network failures or anything unexpected.
 */
export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;
    if (data?.errors) {
      const firstFieldErrors = Object.values(data.errors)[0];
      if (firstFieldErrors?.length) {
        return firstFieldErrors[0];
      }
    }
    if (data?.message) {
      return data.message;
    }
    if (error.code === "ERR_NETWORK") {
      return "Could not reach the server. Please try again.";
    }
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function getApiFieldErrors(error: unknown): Record<string, string[]> | undefined {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.errors ?? undefined;
  }
  return undefined;
}
