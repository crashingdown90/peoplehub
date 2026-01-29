"use client";

// @ai:cx - Table with sorting and pagination

import * as React from "react";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowDownUp, ChevronLeft, ChevronRight } from "lucide-react";

// ============================================
// Shadcn-style Table Components
// ============================================

const TableRoot = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
));
TableRoot.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

// ============================================
// Custom Table with sorting/pagination (legacy)
// ============================================

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onSortChange?: (key: string, direction: "asc" | "desc") => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  className?: string;
}

function TableLegacy<T extends Record<string, unknown>>({
  columns,
  data,
  onSortChange,
  pagination,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari...",
  className,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      if (av === undefined) return 1;
      if (bv === undefined) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [data, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    const nextDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortDir(nextDir);
    onSortChange?.(key, nextDir);
  };

  return (
    <div className={cn("w-full overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]", className)}>
      {onSearchChange && (
        <div className="border-b border-[var(--color-border)] p-3">
          <input
            type="search"
            value={searchValue || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </div>
      )}
      <div className="w-full overflow-auto">
        <table className="min-w-full text-left text-sm text-[var(--color-text)]">
          <thead className="bg-[var(--color-bg)] text-xs uppercase text-[var(--color-text-subtle)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
                  className={cn(
                    "px-4 py-3 font-semibold",
                    col.sortable && "cursor-pointer select-none hover:text-[var(--color-text)]",
                    col.className
                  )}
                  onClick={col.sortable ? () => toggleSort(String(col.key)) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && <ArrowDownUp className="h-4 w-4" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-[var(--color-text-subtle)]" colSpan={columns.length}>
                  Tidak ada data
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr key={idx} className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg)]">
                  {columns.map((col) => (
                    <td key={String(col.key)} className={cn("px-4 py-3", col.className)}>
                      {col.render ? col.render(row) : String(row[col.key as keyof typeof row] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-subtle)]">
          <span>
            Halaman {pagination.page} dari {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1 min-h-[44px] hover:bg-[var(--color-bg)] disabled:opacity-50"
              onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" /> Sebelumnya
            </button>
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1 min-h-[44px] hover:bg-[var(--color-bg)] disabled:opacity-50"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
            >
              Selanjutnya <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export shadcn-style components as named exports
// Export TableRoot as Table for shadcn compatibility
export {
  TableRoot as Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableLegacy,
};
