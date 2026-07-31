import * as React from 'react';

export interface DataTableColumn<T = any> {
  key: string;
  header: React.ReactNode;
  /** 'right' adds .num — right-aligned with tabular figures. Use for money and counts. */
  align?: 'left' | 'right';
  render?: (row: T) => React.ReactNode;
}

/** Records table (.tbl). Put it in a Card with padding="p-0". */
export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  footer?: React.ReactNode;
}

export function DataTable<T = any>(props: DataTableProps<T>): JSX.Element;
