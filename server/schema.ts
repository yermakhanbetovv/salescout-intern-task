import { z } from "zod";
import type { Product } from "../src/types";

const price = z.number().nonnegative();

const competitorSchema = z.object({
  seller: z.string(),
  price,
  inStock: z.boolean(),
});

const productSchema = z
  .object({
    sku: z.string().min(1),
    name: z.string(),
    myPrice: price,
    minPrice: price.int(),
    maxPrice: price.int(),
    step: price,
    competitors: z.array(competitorSchema),
  })
  .refine((p) => p.minPrice <= p.maxPrice, {
    error: "minPrice must be less than or equal to maxPrice",
    path: ["minPrice"],
  });

// The explicit annotation keeps the schema in sync with the shared Product type.
export const productsSchema: z.ZodType<Product[]> = z.array(productSchema);
