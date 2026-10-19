import express from "express";
import { calculatePrice } from "../src/pricing";
import { productsSchema } from "./schema";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  app.post("/reprice", (req, res) => {
    if (!Array.isArray(req.body)) {
      res.status(400).json({ error: "Request body must be an array of products" });
      return;
    }

    const parsed = productsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid products",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    res.json(parsed.data.map(calculatePrice));
  });

  return app;
}
