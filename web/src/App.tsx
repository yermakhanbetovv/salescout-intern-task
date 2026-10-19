import { useEffect, useRef, useState } from "react";
import sampleProducts from "../../data/products.json";
import type { Product } from "../../src/types";
import { reprice } from "./api";
import { ResultsTable, type Row } from "./ResultsTable";

const sampleJson = JSON.stringify(sampleProducts, null, 2);

export function App() {
  const [input, setInput] = useState(sampleJson);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  async function run(json: string) {
    let products: Product[];
    try {
      products = JSON.parse(json) as Product[];
    } catch {
      setError("Некорректный JSON во входных данных");
      return;
    }

    // Cancel the previous request so a slow response can't overwrite a newer one.
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const results = await reprice(products, controller.signal);
      setRows(results.map((result, i) => ({ result, name: products[i]?.name ?? "" })));
    } catch (e) {
      if (controller.signal.aborted) return;
      setRows([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    void run(sampleJson);
    return () => controllerRef.current?.abort();
  }, []);

  function resetSample() {
    setInput(sampleJson);
    void run(sampleJson);
  }

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

      <details className="card">
        <summary>Входные данные (JSON)</summary>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          rows={18}
        />
        <div className="actions">
          <button type="button" onClick={() => void run(input)} disabled={loading}>
            Пересчитать
          </button>
          <button type="button" className="secondary" onClick={resetSample} disabled={loading}>
            Вернуть пример
          </button>
        </div>
      </details>
    </main>
  );
}
