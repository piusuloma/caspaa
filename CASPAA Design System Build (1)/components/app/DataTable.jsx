import React from 'react';

/* Renders the app's .tbl: uppercase 12px header band on #f8fafc, hairline row
   dividers, hover tint, tabular figures, and the stylesheet's own
   "Nothing to show yet." message when tbody is empty. */
export function DataTable({ columns = [], rows = [], onRowClick, footer }) {
  return (
    <table className="tbl">
      <thead>
        <tr>{columns.map(c => (
          <th key={c.key} className={c.align === 'right' ? 'num' : undefined}>{c.header}</th>
        ))}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id || i} onClick={onRowClick ? () => onRowClick(r) : undefined}
            className={onRowClick ? 'cursor-pointer' : undefined}>
            {columns.map(c => (
              <td key={c.key} className={c.align === 'right' ? 'num' : undefined}>
                {c.render ? c.render(r) : r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {footer && <tfoot>{footer}</tfoot>}
    </table>
  );
}
