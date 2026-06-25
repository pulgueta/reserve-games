import {
  CalendarCheckIcon,
  CurrencyDollarIcon,
  type Icon,
  TicketIcon,
  TrendUpIcon,
} from "@phosphor-icons/react";
import type { FC } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { formatCOP } from "@/lib/format";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: Icon;
}

/** dashboard-4 stat card: label + icon over a muted "value plate". */
const StatCard: FC<StatCardProps> = ({ label, value, sub, icon: CardIcon }) => (
  <div className="rounded-xl border bg-card p-4">
    <div className="mb-3 flex items-center justify-between">
      <span className="font-medium text-sm">{label}</span>
      <CardIcon className="size-4 text-muted-foreground" />
    </div>
    <div className="rounded-lg border bg-muted/50 p-4">
      <p className="font-medium text-2xl tabular-nums tracking-tight sm:text-3xl">
        {value}
      </p>
      {sub ? <p className="mt-1 text-muted-foreground text-xs">{sub}</p> : null}
    </div>
  </div>
);

interface DashboardStatCardsProps {
  totalIncome: number;
  bookingCount: number;
  avgPerDay: number;
  upcomingCount: number;
  periodLabel: string;
  isLoading?: boolean;
}

export const DashboardStatCards: FC<DashboardStatCardsProps> = ({
  totalIncome,
  bookingCount,
  avgPerDay,
  upcomingCount,
  periodLabel,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-[120px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={`Ingresos · ${periodLabel}`}
        value={formatCOP(totalIncome)}
        icon={CurrencyDollarIcon}
      />
      <StatCard
        label={`Reservas · ${periodLabel}`}
        value={String(bookingCount)}
        icon={TicketIcon}
      />
      <StatCard
        label="Promedio por día"
        value={formatCOP(avgPerDay)}
        icon={TrendUpIcon}
      />
      <StatCard
        label="Próximas"
        value={String(upcomingCount)}
        sub="reservas por venir"
        icon={CalendarCheckIcon}
      />
    </div>
  );
};
