"use client";

import { Button } from "@/components/ui/button";
import { Delta } from "@/components/ui/delta";
import {
  IconArrowDown,
  IconArrowsUpDown,
  IconArrowUp,
  IconExternalLink,
  IconSearch,
} from "@tabler/icons-react";
import type {
  Cell,
  Column,
  ColumnDef,
  HeaderGroup,
  Row,
  SortingState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
// removed column toggle UI per request
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClusterUrlAggregates } from "@/lib/data/metrics-queries";

const columns: ColumnDef<ClusterUrlAggregates>[] = [
  {
    accessorKey: "name",
    header: "Página",
    cell: ({ row }: { row: Row<ClusterUrlAggregates> }) => {
      const url = row.original.url;
      const title = row.original.name || url;
      return (
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="font-medium hover:underline"
            title={url}
          >
            {title}
          </a>
          <IconExternalLink className="size-3.5 text-muted-foreground" />
        </div>
      );
    },
  },
  // Conversões
  {
    accessorKey: "amplitude_conversions",
    header: ({ column }: { column: Column<ClusterUrlAggregates> }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Conversões
        {column.getIsSorted() === "asc" ? (
          <IconArrowUp className="ml-1 size-3" />
        ) : column.getIsSorted() === "desc" ? (
          <IconArrowDown className="ml-1 size-3" />
        ) : (
          <IconArrowsUpDown className="ml-1 size-3" />
        )}
      </Button>
    ),
    cell: ({ row }: { row: Row<ClusterUrlAggregates> }) => {
      const pct = row.original.amplitude_conversions_delta_pct ?? 0;
      return (
        <div className="flex flex-col items-end">
          <div className="text-right font-medium">
            {row.original.amplitude_conversions.toLocaleString("pt-BR")}
          </div>
          <Delta value={pct} variant="percent" />
        </div>
      );
    },
  },
  // Impressões
  {
    accessorKey: "gsc_impressions",
    header: ({ column }: { column: Column<ClusterUrlAggregates> }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Impressões
        {column.getIsSorted() === "asc" ? (
          <IconArrowUp className="ml-1 size-3" />
        ) : column.getIsSorted() === "desc" ? (
          <IconArrowDown className="ml-1 size-3" />
        ) : (
          <IconArrowsUpDown className="ml-1 size-3" />
        )}
      </Button>
    ),
    cell: ({ row }: { row: Row<ClusterUrlAggregates> }) => {
      const pct = row.original.gsc_impressions_delta_pct ?? 0;
      return (
        <div className="flex flex-col items-end">
          <div className="text-right">{row.original.gsc_impressions.toLocaleString("pt-BR")}</div>
          <Delta value={pct} variant="percent" />
        </div>
      );
    },
  },
  // Cliques
  {
    accessorKey: "gsc_clicks",
    header: ({ column }: { column: Column<ClusterUrlAggregates> }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Cliques
        {column.getIsSorted() === "asc" ? (
          <IconArrowUp className="ml-1 size-3" />
        ) : column.getIsSorted() === "desc" ? (
          <IconArrowDown className="ml-1 size-3" />
        ) : (
          <IconArrowsUpDown className="ml-1 size-3" />
        )}
      </Button>
    ),
    cell: ({ row }: { row: Row<ClusterUrlAggregates> }) => {
      const pct = row.original.gsc_clicks_delta_pct ?? 0;
      return (
        <div className="flex flex-col items-end">
          <div className="text-right font-medium">
            {row.original.gsc_clicks.toLocaleString("pt-BR")}
          </div>
          <Delta value={pct} variant="percent" />
        </div>
      );
    },
  },
  // Posição
  {
    accessorKey: "gsc_position",
    header: ({ column }: { column: Column<ClusterUrlAggregates> }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Posição
        {column.getIsSorted() === "asc" ? (
          <IconArrowUp className="ml-1 size-3" />
        ) : column.getIsSorted() === "desc" ? (
          <IconArrowDown className="ml-1 size-3" />
        ) : (
          <IconArrowsUpDown className="ml-1 size-3" />
        )}
      </Button>
    ),
    cell: ({ row }: { row: Row<ClusterUrlAggregates> }) => {
      const delta = row.original.gsc_position_delta ?? 0;
      return (
        <div className="flex flex-col items-end">
          <div className="text-right">{row.original.gsc_position.toFixed(1)}</div>
          <Delta value={delta} variant="absolute" precision={1} positiveIcon="down" />
        </div>
      );
    },
  },
];

export function ClusterUrlsTable({ data = [] as ClusterUrlAggregates[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "amplitude_conversions", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility] = React.useState<Record<string, boolean>>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    // no column toggle controls
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-semibold">Páginas do Cluster</h2>
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative w-full sm:w-64">
            <IconSearch className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou URL..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<ClusterUrlAggregates>) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(
                  (header: HeaderGroup<ClusterUrlAggregates>["headers"][0]) => (
                    <TableHead
                      key={header.id}
                      className={
                        [
                          "amplitude_conversions",
                          "gsc_impressions",
                          "gsc_clicks",
                          "gsc_position",
                        ].includes(header.column.id as string)
                          ? "text-right"
                          : "text-left"
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ),
                )}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: Row<ClusterUrlAggregates>) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell: Cell<ClusterUrlAggregates, unknown>) => (
                    <TableCell
                      key={cell.id}
                      className={
                        [
                          "amplitude_conversions",
                          "gsc_impressions",
                          "gsc_clicks",
                          "gsc_position",
                        ].includes(cell.column.id as string)
                          ? "text-right"
                          : "text-left"
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhuma página encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
