export type FieldErrors = Partial<Record<"title" | "body", string>>;

type ValidationDetailItem = {
  loc: (string | number)[];
  msg: string;
};

export class ApiError extends Error {
  status: number;
  fieldErrors: FieldErrors;

  constructor(message: string, status: number, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function fieldFromLoc(loc: (string | number)[]): "title" | "body" | null {
  const idx = loc.findIndex((part) => part === "title" || part === "body");
  if (idx === -1) return null;
  const field = loc[idx];
  return field === "title" || field === "body" ? field : null;
}

export async function apiErrorFromResponse(res: Response): Promise<ApiError> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return new ApiError(res.statusText || "Request failed", res.status);
  }

  if (res.status === 422 && body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    const fieldErrors: FieldErrors = {};

    if (Array.isArray(detail)) {
      for (const item of detail as ValidationDetailItem[]) {
        const field = fieldFromLoc(item.loc);
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = item.msg;
        }
      }
    }

    return new ApiError("Validation failed", res.status, fieldErrors);
  }

  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") {
      return new ApiError(detail, res.status);
    }
  }

  return new ApiError(res.statusText || "Request failed", res.status);
}
