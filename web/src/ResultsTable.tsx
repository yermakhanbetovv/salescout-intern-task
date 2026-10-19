import type { PriceResult } from "../../src/types";
import { formatDiff, formatPrice, reasonLabels } from "./format";

export interface Row {
  name: string;
  result: PriceResult;
}

interface Props {
  rows: Row[];
}

export function ResultsTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="empty">Нет товаров для отображения.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Название</th>
            <th className="num">Было</th>
            <th className="num">Стало</th>
            <th className="num">Изменение</th>
            <th>Причина</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ name, result }, index) => {
            const diff = result.newPrice - result.oldPrice;
            const reason = reasonLabels[result.reason];
            return (
              <tr key={`${result.sku}-${index}`}>
                <td className="sku">{result.sku}</td>
                <td>{name}</td>
                <td className="num">{formatPrice(result.oldPrice)}</td>
                <td className="num strong">{formatPrice(result.newPrice)}</td>
                <td className={`num diff ${diff > 0 ? "up" : diff < 0 ? "down" : ""}`}>
                  {formatDiff(diff)}
                </td>
                <td>
                  <span className={`badge badge-${result.reason.toLowerCase()}`} title={reason.hint}>
                    {reason.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
