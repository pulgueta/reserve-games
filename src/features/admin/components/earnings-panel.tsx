import type { FC } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { formatCOP } from "@/lib/format";
import { cn } from "@/lib/utils";

type Period = "week" | "month";

interface EarningPoint {
  day: number;
  income: number;
}

interface EarningsChartCardProps {
  series: EarningPoint[];
  period: Period;
  onPeriodChange: (period: Period) => void;
  isLoading?: boolean;
  className?: string;
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];

const weekday = new Intl.DateTimeFormat("es-CO", { weekday: "short" });
const dayNumber = new Intl.DateTimeFormat("es-CO", { day: "numeric" });

function shortDayLabel(timestamp: number, period: Period): string {
  const date = new Date(timestamp);
  return period === "week" ? weekday.format(date) : dayNumber.format(date);
}

const EarningsBars: FC<{ series: EarningPoint[]; period: Period }> = ({
  series,
  period,
}) => {
  const maxIncome = Math.max(0, ...series.map((point) => point.income));

  if (maxIncome <= 0) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-center text-muted-foreground text-sm">
          Aún no hay ingresos en este período.
        </p>
      </div>
    );
  }

  const lastIndex = series.length - 1;

  return (
    <div className="flex h-[200px] items-end gap-1.5">
      {series.map((point, index) => {
        const pct = Math.round((point.income / maxIncome) * 100);
        const isToday = index === lastIndex;
        const hasIncome = point.income > 0;

        return (
          <div
            key={point.day}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
          >
            <div className="flex w-full flex-1 items-end">
              <div
                title={formatCOP(point.income)}
                className={cn(
                  "w-full rounded-t-md transition-all",
                  hasIncome ? "bg-primary" : "min-h-[3px] bg-muted",
                  hasIncome && !isToday && "opacity-70",
                )}
                style={
                  hasIncome ? { height: `${Math.max(pct, 2)}%` } : undefined
                }
              />
            </div>
            <span
              className={cn(
                "w-full truncate text-center text-[10px] capitalize tabular-nums",
                isToday
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {shortDayLabel(point.day, period)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/** dashboard-4 chart card: header (title + period toggle) over the income bars. */
export const EarningsChartCard: FC<EarningsChartCardProps> = ({
  series,
  period,
  onPeriodChange,
  isLoading = false,
  className,
}) => (
  <div className={cn("flex flex-col rounded-xl border bg-card", className)}>
    <header className="flex items-center justify-between gap-3 border-border/60 border-b p-4">
      <h3 className="font-medium text-sm sm:text-base">Ingresos</h3>

      <div
        role="tablist"
        aria-label="Período de ganancias"
        className="inline-flex rounded-full bg-muted p-0.5"
      >
        {PERIODS.map(({ value, label }) => {
          const isActive = value === period;

          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onPeriodChange(value)}
              className={cn(
                "rounded-full px-3 py-1 font-medium text-xs outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </header>

    <div className="p-4">
      {isLoading ? (
        <Skeleton className="h-[200px] w-full rounded-lg" />
      ) : (
        <EarningsBars series={series} period={period} />
      )}
    </div>
  </div>
);
