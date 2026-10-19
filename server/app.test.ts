import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app";
import products from "../data/products.json";
import expected from "../data/expected.json";

const app = createApp();

describe("POST /reprice", () => {
  it("returns results for data/products.json in the same order", async () => {
    const res = await request(app).post("/reprice").send(products);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expected);
  });

  it("returns an empty array for an empty list", async () => {
    const res = await request(app).post("/reprice").send([]);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it.each([
    ["an object", { sku: "X" }],
    ["a string", "products"],
    ["a number", 42],
    ["null", null],
  ])("responds 400 when the body is %s", async (_label, body) => {
    const res = await request(app)
      .post("/reprice")
      .set("Content-Type", "application/json")
      .send(JSON.stringify(body));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/array/);
  });

  it("responds 400 when the body is missing", async () => {
    const res = await request(app).post("/reprice");

    expect(res.status).toBe(400);
  });

  it("responds 400 with JSON on malformed JSON", async () => {
    const res = await request(app)
      .post("/reprice")
      .set("Content-Type", "application/json")
      .send("[{ broken");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("responds 400 with details when a product is invalid", async () => {
    const invalid = [{ ...products[0] }, { ...products[1], minPrice: -1, step: "10" }];
    const res = await request(app).post("/reprice").send(invalid);

    expect(res.status).toBe(400);
    const paths = res.body.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(["1.minPrice", "1.step"]));
  });

  it("responds 400 when minPrice is greater than maxPrice", async () => {
    const res = await request(app)
      .post("/reprice")
      .send([{ ...products[0], minPrice: 500000, maxPrice: 400000 }]);

    expect(res.status).toBe(400);
    expect(res.body.details[0].path).toBe("0.minPrice");
  });

  it("responds 400 when minPrice is not an integer", async () => {
    const res = await request(app)
      .post("/reprice")
      .send([{ ...products[0], minPrice: 370000.5 }]);

    expect(res.status).toBe(400);
  });
});
