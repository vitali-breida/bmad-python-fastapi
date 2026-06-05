const BASE = "/health";

export type HealthResponse = {
  status: string;
  version: string;
};

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(BASE);
  if (!res.ok) {
    throw new Error(`Health check failed (${res.status})`);
  }
  return res.json() as Promise<HealthResponse>;
}
