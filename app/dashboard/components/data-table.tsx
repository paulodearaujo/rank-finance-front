"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/lib/database.types";
import { IconArrowDown, IconArrowUp, IconSearch } from "@tabler/icons-react";
import type {
  Cell,
  Column,
  ColumnDef,
  ColumnFiltersState,
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

// Thresholds para badges de coerência
const COHERENCE_THRESHOLDS = {
  HIGH: 0.7,
  MEDIUM: 0.5,
} as const;

// Tipo combinando métricas do cluster com campos agregados de outras tabelas
interface ClusterData
  extends Required<
    Pick<
      Tables<"blog_cluster_metrics">,
      "cluster_id" | "cluster_size" | "cluster_coherence" | "cluster_density"
    >
  > {
  // Campos adicionais agregados de outras tabelas
  cluster_name: string; // De blog_clusters
  gsc_clicks: number; // Agregado de blog_articles_metrics
  gsc_impressions: number; // Agregado de blog_articles_metrics
  gsc_ctr: number; // Calculado
  amplitude_conversions: number; // Agregado de blog_articles_metrics
}

const columns: ColumnDef<ClusterData>[] = [
  {
    accessorKey: "cluster_name",
    header: "Cluster",
    cell: ({ row }: { row: Row<ClusterData> }) => (
      <div className="font-medium">
        {row.original.cluster_name || `Cluster ${row.original.cluster_id}`}
      </div>
    ),
  },
  {
    accessorKey: "cluster_size",
    header: ({ column }: { column: Column<ClusterData> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Tamanho
          {column.getIsSorted() === "asc" ? (
            <IconArrowUp className="ml-1 size-3" />
          ) : column.getIsSorted() === "desc" ? (
            <IconArrowDown className="ml-1 size-3" />
          ) : null}
        </Button>
      );
    },
    cell: ({ row }: { row: Row<ClusterData> }) => (
      <div className="text-center">{row.getValue("cluster_size")}</div>
    ),
  },
  {
    accessorKey: "gsc_clicks",
    header: ({ column }: { column: Column<ClusterData> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Clicks
          {column.getIsSorted() === "asc" ? (
            <IconArrowUp className="ml-1 size-3" />
          ) : column.getIsSorted() === "desc" ? (
            <IconArrowDown className="ml-1 size-3" />
          ) : null}
        </Button>
      );
    },
    cell: ({ row }: { row: Row<ClusterData> }) => {
      const clicks = row.getValue("gsc_clicks") as number;
      return <div className="text-right font-medium">{clicks.toLocaleString("pt-BR")}</div>;
    },
  },
  {
    accessorKey: "amplitude_conversions",
    header: ({ column }: { column: Column<ClusterData> }) => {
      return (
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
          ) : null}
        </Button>
      );
    },
    cell: ({ row }: { row: Row<ClusterData> }) => {
      const conversions = row.getValue("amplitude_conversions") as number;
      return <div className="text-right font-medium">{conversions.toLocaleString("pt-BR")}</div>;
    },
  },
  {
    accessorKey: "gsc_ctr",
    header: ({ column }: { column: Column<ClusterData> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          CTR
          {column.getIsSorted() === "asc" ? (
            <IconArrowUp className="ml-1 size-3" />
          ) : column.getIsSorted() === "desc" ? (
            <IconArrowDown className="ml-1 size-3" />
          ) : null}
        </Button>
      );
    },
    cell: ({ row }: { row: Row<ClusterData> }) => {
      const ctr = row.getValue("gsc_ctr") as number;
      return <div className="text-right">{(ctr * 100).toFixed(2)}%</div>;
    },
  },
  {
    accessorKey: "cluster_coherence",
    header: ({ column }: { column: Column<ClusterData> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Coerência
          {column.getIsSorted() === "asc" ? (
            <IconArrowUp className="ml-1 size-3" />
          ) : column.getIsSorted() === "desc" ? (
            <IconArrowDown className="ml-1 size-3" />
          ) : null}
        </Button>
      );
    },
    cell: ({ row }: { row: Row<ClusterData> }) => {
      const coherence = row.getValue("cluster_coherence") as number;
      const variant =
        coherence > COHERENCE_THRESHOLDS.HIGH
          ? "default"
          : coherence > COHERENCE_THRESHOLDS.MEDIUM
            ? "secondary"
            : "destructive";
      return (
        <div className="text-center">
          <Badge variant={variant}>{coherence.toFixed(2)}</Badge>
        </div>
      );
    },
  },
];

export function DataTable({
  data = [],
  clusterCreatedAt,
}: {
  data: ClusterData[];
  clusterCreatedAt?: string | null; // Already formatted date string
}) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "gsc_clicks", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Leaderboard de Clusters</h2>
        <div className="relative w-64">
          <IconSearch className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar clusters..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<ClusterData>) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: HeaderGroup<ClusterData>["headers"][0]) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: Row<ClusterData>) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell: Cell<ClusterData, unknown>) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum cluster encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length === data.length ? (
            <>Mostrando todos os {table.getFilteredRowModel().rows.length} clusters</>
          ) : (
            <>
              Mostrando {table.getFilteredRowModel().rows.length} de {data.length} clusters
              filtrados
            </>
          )}
        </div>
        {clusterCreatedAt && (
          <div className="text-xs text-muted-foreground">Categorização de {clusterCreatedAt}</div>
        )}
      </div>
    </div>
  );
}
