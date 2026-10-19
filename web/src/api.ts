import type { PriceResult, Product } from "../../src/types";

interface ApiError {
  error: string;
  details?: { path: string; message: string }[];
}

export async function reprice(products: Product[], signal?: AbortSignal): Promise<PriceResult[]> {
  const res = await fetch("/reprice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(products),
    signal,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    const details = body?.details?.map((d) => `${d.path}: ${d.message}`).join("; ");
    throw new Error(
      [body?.error ?? `Request failed with status ${res.status}`, details].filter(Boolean).join(" — "),
    );
  }

  return (await res.json()) as PriceResult[];
}
