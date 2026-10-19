import type { Reason } from "../../src/types";

const priceFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

export function formatPrice(value: number): string {
  return `${priceFormat.format(value)} ₸`;
}

export function formatDiff(value: number): string {
  if (value === 0) return "—";
  const sign = value > 0 ? "+" : "−";
  return `${sign}${formatPrice(Math.abs(value))}`;
}

export const reasonLabels: Record<Reason, { label: string; hint: string }> = {
  UNDERCUT: {
    label: "Дешевле конкурента",
    hint: "Цена на шаг ниже лучшего конкурента в наличии",
  },
  AT_MIN: {
    label: "Минимум",
    hint: "Чтобы обойти конкурента, пришлось бы опуститься ниже minPrice",
  },
  AT_MAX: {
    label: "Максимум",
    hint: "Конкуренты дороже maxPrice — ставим максимально допустимую цену",
  },
  NO_COMPETITORS: {
    label: "Нет конкурентов",
    hint: "Нет конкурентов в наличии — ставим maxPrice",
  },
};
