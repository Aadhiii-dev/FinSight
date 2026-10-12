import type { ReactNode } from "react";

/**
 * IS 17802 / WCAG 1.1.1 + 1.4.1: every chart gets a text alternative.
 * - the chart wrapper carries a short description (role="img" + aria-label), and
 * - this component gives the same numbers as a real, screen-reader-friendly table.
 */
export function ChartTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <details className="mt-3 rounded-xl bg-muted p-3 text-sm">
      <summary className="cursor-pointer font-medium">View this chart as a table</summary>
      <div className="mt-3 max-h-72 overflow-auto" tabIndex={0} role="region" aria-label={`${caption} (scrollable table)`}>
        <table className="w-full min-w-[320px] text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-muted">
            <tr>
              {headers.map((h) => (
                <th key={h} scope="col" className="p-2 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                {r.map((c, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="p-2 font-medium">{c}</th>
                  ) : (
                    <td key={j} className="p-2 tabular-nums">{c}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
