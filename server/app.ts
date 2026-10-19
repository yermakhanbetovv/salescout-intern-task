import express, { type ErrorRequestHandler } from "express";
import { calculatePrice } from "../src/pricing";
import { productsSchema } from "./schema";

export function createApp() {
  const app = express();

  // strict: false lets primitives like `42` or `null` through to the array check below,
  // so every non-array body gets the same clear 400 response.
  app.use(express.json({ limit: "1mb", strict: false }));

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

  // express.json() throws on malformed JSON or a too large body;
  // answer with JSON instead of the default HTML error page.
  const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    const status = typeof err?.status === "number" ? err.status : 500;
    const message = status < 500 && err.expose ? String(err.message) : "Internal server error";
    res.status(status).json({ error: message });
  };
  app.use(errorHandler);

  return app;
}
