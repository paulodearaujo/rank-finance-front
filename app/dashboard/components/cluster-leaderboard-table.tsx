"use client";

import { Button } from "@/components/ui/button";
import { Delta } from "@/components/ui/delta";
import { IconArrowDown, IconArrowsUpDown, IconArrowUp, IconSearch } from "@tabler/icons-react";
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
import { useVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
// removed column toggle UI per request
import { Input } from "@/components/ui/input";
// removed pagination controls per request
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/lib/database.types";

// Coerência não exibida no momento; thresholds removidos por ora (YAGNI)

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
  gsc_position: number; // Calculado (média ponderada)
  amplitude_conversions: number; // Agregado de blog_articles_metrics
  // Deltas (segunda metade vs primeira metade do período)
  gsc_clicks_delta?: number;
  gsc_clicks_delta_pct?: number;
  gsc_impressions_delta?: number;
  gsc_impressions_delta_pct?: number;
  amplitude_conversions_delta?: number;
  amplitude_conversions_delta_pct?: number;
  gsc_position_delta?: number;
  gsc_position_delta_pct?: number;
}

export function ClusterLeaderboardTable({
  data = [],
  clusterCreatedAt,
  selectedWeeks,
}: {
  data: ClusterData[];
  clusterCreatedAt?: string | null; // Already formatted date string
  selectedWeeks?: string[];
}) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "amplitude_conversions", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility] = React.useState<Record<string, boolean>>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [inputValue, setInputValue] = React.useState("");
  const deferredInput = React.useDeferredValue(inputValue);
  React.useEffect(() => {
    setGlobalFilter(deferredInput);
  }, [deferredInput]);

  const weeksParam =
    selectedWeeks && selectedWeeks.length > 0 ? `?weeks=${selectedWeeks.join(",")}` : "";

  // Reusable sortable header (shadcn style)
  const SortableHeader = React.useCallback(
    ({
      column,
      title,
      align = "right",
    }: {
      column: Column<ClusterData>;
      title: string;
      align?: "left" | "center" | "right";
    }) => {
      const justifyClass =
        align === "center"
          ? "justify-center text-center"
          : align === "left"
            ? "justify-start text-left"
            : "justify-end text-right";
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className={`h-auto p-0 font-medium cursor-pointer w-full ${justifyClass}`}
        >
          <span className="inline-flex items-center gap-1">
            <span>{title}</span>
            <span className="inline-flex w-4 justify-center">
              {column.getIsSorted() === "asc" ? (
                <IconArrowUp className="size-3" />
              ) : column.getIsSorted() === "desc" ? (
                <IconArrowDown className="size-3" />
              ) : (
                <IconArrowsUpDown className="size-3 opacity-50" />
              )}
            </span>
          </span>
        </Button>
      );
    },
    [],
  );

  const columns: ColumnDef<ClusterData>[] = React.useMemo(
    () => [
      {
        accessorKey: "cluster_name",
        header: "Cluster",
        cell: ({ row }: { row: Row<ClusterData> }) => (
          <div className="font-medium">
            <Link
              href={`/clusters/${row.original.cluster_id}${weeksParam}`}
              className="hover:underline cursor-pointer"
            >
              {row.original.cluster_name || `Cluster ${row.original.cluster_id}`}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: "cluster_size",
        header: ({ column }: { column: Column<ClusterData> }) => (
          <SortableHeader column={column} title="Páginas" align="center" />
        ),
        cell: ({ row }: { row: Row<ClusterData> }) => (
          <div className="text-center">{row.getValue("cluster_size")}</div>
        ),
      },
      // Ordem dos cards: Conversões, Impressões, Cliques, Posição
      {
        accessorKey: "amplitude_conversions",
        header: ({ column }: { column: Column<ClusterData> }) => (
          <SortableHeader column={column} title="Conversões" />
        ),
        cell: ({ row }: { row: Row<ClusterData> }) => {
          const conversions = row.getValue("amplitude_conversions") as number;
          const pct = row.original.amplitude_conversions_delta_pct ?? 0;
          return (
            <div className="flex flex-col items-end">
              <div className="text-right font-medium">{conversions.toLocaleString("pt-BR")}</div>
              <Delta value={pct} variant="percent" />
            </div>
          );
        },
      },
      {
        accessorKey: "gsc_impressions",
        header: ({ column }: { column: Column<ClusterData> }) => (
          <SortableHeader column={column} title="Impressões" />
        ),
        cell: ({ row }: { row: Row<ClusterData> }) => {
          const impressions = row.getValue("gsc_impressions") as number;
          const pct = row.original.gsc_impressions_delta_pct ?? 0;
          return (
            <div className="flex flex-col items-end">
              <div className="text-right">{impressions.toLocaleString("pt-BR")}</div>
              <Delta value={pct} variant="percent" />
            </div>
          );
        },
      },
      {
        accessorKey: "gsc_clicks",
        header: ({ column }: { column: Column<ClusterData> }) => (
          <SortableHeader column={column} title="Cliques" />
        ),
        cell: ({ row }: { row: Row<ClusterData> }) => {
          const clicks = row.getValue("gsc_clicks") as number;
          const pct = row.original.gsc_clicks_delta_pct ?? 0;
          return (
            <div className="flex flex-col items-end">
              <div className="text-right font-medium">{clicks.toLocaleString("pt-BR")}</div>
              <Delta value={pct} variant="percent" />
            </div>
          );
        },
      },
      {
        accessorKey: "gsc_position",
        header: ({ column }: { column: Column<ClusterData> }) => (
          <SortableHeader column={column} title="Posição" />
        ),
        cell: ({ row }: { row: Row<ClusterData> }) => {
          const pos = row.getValue("gsc_position") as number;
          const delta = row.original.gsc_position_delta ?? 0;
          return (
            <div className="flex flex-col items-end">
              <div className="text-right">{Number(pos).toFixed(1)}</div>
              <Delta value={delta} variant="absolute" precision={1} positiveIcon="down" />
            </div>
          );
        },
      },
      // CTR: importado/derivado mas não exibido no momento
      // Coerência removida do leaderboard atual (mantida apenas no back)
    ],
    [weeksParam, SortableHeader],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    // no column toggle handlers in UI
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Virtualization when many rows
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const rows = table.getRowModel().rows;
  const useVirtual = rows.length > 100;
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 44,
    overscan: 8,
  });

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Ranking de Clusters</h2>
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative w-full sm:w-64">
            <IconSearch className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar clusters..."
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table className="table-fixed">
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<ClusterData>) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: HeaderGroup<ClusterData>["headers"][0]) => {
                  const id = header.column.id as string;
                  const cls =
                    id === "cluster_size"
                      ? "text-center w-[5.5rem]"
                      : id === "gsc_position"
                        ? "text-right w-[6.5rem] md:w-[7rem]"
                        : ["gsc_impressions", "gsc_clicks", "amplitude_conversions"].includes(id)
                          ? "text-right w-[9.5rem] md:w-[10rem]"
                          : id === "cluster_name"
                            ? "text-left w-[38%] md:w-[34%] lg:w-[30%] pr-2 md:pr-4"
                            : "text-left";
                  return (
                    <TableHead key={header.id} className={cls}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              useVirtual ? (
                <tr>
                  <td colSpan={columns.length} className="p-0">
                    <div ref={containerRef} className="max-h-[640px] overflow-auto">
                      <div style={{ height: rowVirtualizer.getTotalSize() }} className="relative">
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                          const row = rows[virtualRow.index] as Row<ClusterData>;
                          return (
                            <div
                              key={row.id}
                              data-index={virtualRow.index}
                              ref={rowVirtualizer.measureElement}
                              className="absolute top-0 left-0 w-full"
                              style={{ transform: `translateY(${virtualRow.start}px)` }}
                            >
                              <TableRow
                                data-state={row.getIsSelected() && "selected"}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={(e: React.MouseEvent<HTMLTableRowElement>) => {
                                  // Não navegar se clicar em um link
                                  if ((e.target as HTMLElement).closest("a")) return;
                                  const url = `/clusters/${row.original.cluster_id}${weeksParam}`;
                                  router.push(url);
                                }}
                              >
                                {row.getVisibleCells().map((cell: Cell<ClusterData, unknown>) => {
                                  const id = cell.column.id as string;
                                  const cls =
                                    id === "cluster_size"
                                      ? "text-center w-[5.5rem]"
                                      : id === "gsc_position"
                                        ? "text-right w-[6.5rem] md:w-[7rem]"
                                        : [
                                              "gsc_impressions",
                                              "gsc_clicks",
                                              "amplitude_conversions",
                                            ].includes(id)
                                          ? "text-right w-[9.5rem] md:w-[10rem]"
                                          : id === "cluster_name"
                                            ? "text-left w-[38%] md:w-[34%] lg:w-[30%] pr-2 md:pr-4"
                                            : "text-left";
                                  return (
                                    <TableCell key={cell.id} className={cls}>
                                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row: Row<ClusterData>) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={(e: React.MouseEvent<HTMLTableRowElement>) => {
                      // Não navegar se clicar em um link
                      if ((e.target as HTMLElement).closest("a")) return;
                      const url = `/clusters/${row.original.cluster_id}${weeksParam}`;
                      console.log("Clicou na linha, navegando para:", url);
                      router.push(url);
                    }}
                  >
                    {row.getVisibleCells().map((cell: Cell<ClusterData, unknown>) => {
                      const id = cell.column.id as string;
                      const cls =
                        id === "cluster_size"
                          ? "text-center w-[5.5rem]"
                          : id === "gsc_position"
                            ? "text-right w-[6.5rem] md:w-[7rem]"
                            : ["gsc_impressions", "gsc_clicks", "amplitude_conversions"].includes(
                                  id,
                                )
                              ? "text-right w-[9.5rem] md:w-[10rem]"
                              : id === "cluster_name"
                                ? "text-left w-[38%] md:w-[34%] lg:w-[30%] pr-2 md:pr-4"
                                : "text-left";
                      return (
                        <TableCell key={cell.id} className={cls}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )
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

      <div className="flex items-center justify-between gap-2">
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
          <div className="text-xs text-muted-foreground ml-auto">
            Categorização de{" "}
            {new Date(clusterCreatedAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
}
