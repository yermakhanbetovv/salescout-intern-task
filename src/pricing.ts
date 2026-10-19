import type { Product, PriceResult } from "./types";

/**
 * Rounds down to a whole tenge.
 *
 * `best - step` is computed in floating point, so e.g. 100.3 - 0.3 gives
 * 99.99999999999999 and a plain Math.floor would lose a whole tenge.
 * Trimming the float noise first (prices never need more than 6 decimals)
 * keeps the result mathematically correct.
 */
function floorToTenge(value: number): number {
  return Math.floor(Number(value.toFixed(6)));
}

/**
 * Чистая функция: рассчитывает новую цену для одного товара.
 * Правила — см. README, раздел «Правила расчёта цены».
 * Не меняйте сигнатуру и путь к файлу: решение проверяется автотестами.
 */
export function calculatePrice(product: Product): PriceResult {
  const { sku, myPrice, minPrice, maxPrice, step, competitors } = product;
  const base = { sku, oldPrice: myPrice };

  let best = Infinity;
  for (const competitor of competitors) {
    if (competitor.inStock && competitor.price < best) {
      best = competitor.price;
    }
  }

  if (best === Infinity) {
    return { ...base, newPrice: maxPrice, reason: "NO_COMPETITORS" };
  }

  const candidate = floorToTenge(best - step);

  if (candidate < minPrice) {
    return { ...base, newPrice: minPrice, reason: "AT_MIN" };
  }
  if (candidate > maxPrice) {
    return { ...base, newPrice: maxPrice, reason: "AT_MAX" };
  }
  return { ...base, newPrice: candidate, reason: "UNDERCUT" };
}
