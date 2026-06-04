import { ApiError } from "../api/errors";
import type { FieldErrors } from "../api/errors";

export type MappedApiError = {
  globalMessage?: string;
  fieldErrors?: FieldErrors;
};

const API_UNREACHABLE =
  "Cannot reach the API. Is uvicorn running on port 8000?";

export function mapApiError(
  err: unknown,
  fallback = "Request failed",
): MappedApiError {
  if (err instanceof ApiError && err.status === 401) {
    return {};
  }
  if (err instanceof TypeError) {
    return { globalMessage: API_UNREACHABLE };
  }
  if (err instanceof ApiError) {
    if (Object.keys(err.fieldErrors).length > 0) {
      return { fieldErrors: err.fieldErrors };
    }
    return { globalMessage: err.message };
  }
  return { globalMessage: fallback };
}

export function applyMappedError(
  mapped: MappedApiError,
  setGlobalError: (message: string) => void,
  setFieldErrors: (errors: FieldErrors) => void,
): void {
  if (!mapped.globalMessage && !mapped.fieldErrors) {
    return;
  }
  if (mapped.fieldErrors && Object.keys(mapped.fieldErrors).length > 0) {
    setFieldErrors(mapped.fieldErrors);
  } else if (mapped.globalMessage) {
    setGlobalError(mapped.globalMessage);
  }
}
