import { useEffect, useState } from "react";
import sampleProducts from "../../data/products.json";
import type { Product } from "../../src/types";
import { reprice } from "./api";
import { ResultsTable, type Row } from "./ResultsTable";

export function App() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const products = sampleProducts as Product[];
    const controller = new AbortController();

    setLoading(true);
    reprice(products, controller.signal)
      .then((results) => {
        setRows(results.map((result, i) => ({ result, name: products[i]?.name ?? "" })));
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>SaleScout — прайс-бот</h1>
        <p className="subtitle">
          Пересчёт цен относительно конкурентов: было / стало по каждому товару.
        </p>
      </header>

      <section className="card">
        <div className="card-header">
          <h2>Результат</h2>
          {loading && <span className="muted">Загрузка…</span>}
        </div>
        {error ? <p className="error">Ошибка: {error}</p> : <ResultsTable rows={rows} />}
      </section>
    </main>
  );
}
