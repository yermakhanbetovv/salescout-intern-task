import express from "express";
import { calculatePrice } from "../src/pricing";
import type { Product } from "../src/types";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  app.post("/reprice", (req, res) => {
    if (!Array.isArray(req.body)) {
      res.status(400).json({ error: "Request body must be an array of products" });
      return;
    }

    const products = req.body as Product[];
    res.json(products.map(calculatePrice));
  });

  return app;
}
