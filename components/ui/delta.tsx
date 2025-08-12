"use client";

import { cn } from "@/lib/utils";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

interface DeltaProps {
  value?: number | null; // percent as decimal if variant="percent"; else absolute units
  variant?: "percent" | "absolute";
  precision?: number; // decimals for absolute
  className?: string;
  hideIfZero?: boolean; // default true
  positiveIcon?: "up" | "down"; // visual hint: which direction indicates improvement
}

export function Delta({
  value,
  variant = "percent",
  precision = 1,
  className,
  hideIfZero = true,
  positiveIcon = "up",
}: DeltaProps) {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  const magnitude = Math.abs(num);
  // hide near-zero noise
  if (hideIfZero && magnitude < 0.0005) return null;

  const isPositive = num > 0;
  const color = isPositive
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";

  const display =
    variant === "percent"
      ? `${(magnitude * 100).toLocaleString("pt-BR", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        })}%`
      : magnitude.toFixed(precision);

  const Up = <IconTrendingUp className="size-3" />;
  const Down = <IconTrendingDown className="size-3" />;
  const icon = isPositive
    ? positiveIcon === "down"
      ? Down
      : Up
    : positiveIcon === "down"
      ? Up
      : Down;

  return (
    <span className={cn("flex items-center gap-1 text-xs", color, className)}>
      {icon}
      {display}
    </span>
  );
}

export default Delta;
