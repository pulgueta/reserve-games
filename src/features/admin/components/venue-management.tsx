import type { Venue } from "@convex/schema";
import {
  ArrowSquareOutIcon,
  CalendarBlankIcon,
  PencilSimpleIcon,
  QrCodeIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useApplyPendingVenue } from "@/features/account/hooks/use-apply-pending-venue";
import { BookingsTable } from "@/features/admin/components/bookings-table";
import { EarningsChartCard } from "@/features/admin/components/earnings-panel";
import { DashboardStatCards } from "@/features/admin/components/stats-cards";
import {
  useStaffCalendar,
  useVenueEarnings,
} from "@/features/bookings/hooks/use-bookings";
import {
  useVenueByOrg,
  useVenueStats,
} from "@/features/venues/hooks/use-venues";

interface VenueManagementProps {
  orgId: string;
}

/** Owner overview (dashboard-4 layout): headline + stat cards, an income chart
 * beside quick actions, upcoming bookings, then the venue config form. The
 * `/dashboard` shell already guarantees an admin; the loader prefetched the
 * venue, so the loading branch is normally skipped on first paint. */
export const VenueManagement: FC<VenueManagementProps> = ({ orgId }) => {
  const { data: venue, isLoading } = useVenueByOrg(orgId);

  // Apply any basic data captured during onboarding once the stub is ready.
  useApplyPendingVenue(venue);

  if (isLoading) {
    return <Spinner className="mx-auto my-24" />;
  }

  if (!venue) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-muted-foreground">
        Estamos preparando tu espacio. Recarga en unos segundos.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-semibold text-2xl tracking-tight">
            {venue.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            {venue.isActive
              ? "Tu espacio está activo y visible para los clientes."
              : "Completa la información para publicarlo."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link to="/venues/$venueId" params={{ venueId: venue.uuid }} />
            }
          >
            <ArrowSquareOutIcon className="size-4" />
            Ver espacio público
          </Button>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link to="/dashboard/venue" />}
          >
            <PencilSimpleIcon className="size-4" />
            Editar espacio
          </Button>
        </div>
      </header>

      <VenueStats venueId={venue._id} />
    </div>
  );
};

const VenueStats: FC<{ venueId: Venue["_id"] }> = ({ venueId }) => {
  const [period, setPeriod] = useState<"week" | "month">("week");
  // Frozen at mount so the "upcoming" cutoff is stable across re-renders.
  const [now] = useState(() => Date.now());

  // Headline numbers come from the booking aggregates (O(log n)); the chart
  // series and the upcoming-bookings table read the bounded scans.
  const stats = useVenueStats(venueId, period);
  const earnings = useVenueEarnings(venueId, period);
  // The admin bookings list shows no amounts, so it reads the same financial-
  // free projection the staff calendar does.
  const { data: bookings } = useStaffCalendar(venueId);

  const upcoming = (bookings ?? []).filter(
    (booking) => booking.date >= now && booking.status !== "cancelled",
  );

  return (
    <div className="flex flex-col gap-4">
      <DashboardStatCards
        totalIncome={stats.data?.rangeRevenue ?? 0}
        bookingCount={stats.data?.rangeBookings ?? 0}
        avgPerDay={stats.data?.avgPerDay ?? 0}
        upcomingCount={stats.data?.upcoming ?? upcoming.length}
        periodLabel={period === "week" ? "Semana" : "Mes"}
        isLoading={stats.isLoading}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <EarningsChartCard
          className="lg:col-span-2"
          series={earnings.data?.series ?? []}
          period={period}
          onPeriodChange={setPeriod}
          isLoading={earnings.isLoading}
        />
        <QuickActions />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold tracking-tight">Reservas próximas</h2>
        <BookingsTable
          bookings={upcoming.slice(0, 8)}
          title=""
          emptyLabel="Aún no hay reservas próximas."
        />
      </section>
    </div>
  );
};

const actionClass =
  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-medium text-sm transition-colors hover:bg-accent";

const QuickActions: FC = () => (
  <div className="flex flex-col rounded-xl border bg-card">
    <header className="border-border/60 border-b p-4">
      <h3 className="font-medium text-sm sm:text-base">Acciones rápidas</h3>
    </header>
    <nav className="flex flex-col gap-1 p-2">
      <Link to="/dashboard/team" className={actionClass}>
        <UsersThreeIcon className="size-4 text-muted-foreground" />
        <span>Gestionar equipo</span>
      </Link>
      <Link to="/scanner" className={actionClass}>
        <QrCodeIcon className="size-4 text-muted-foreground" />
        <span>Abrir escáner</span>
      </Link>
      <Link to="/scanner/calendar" className={actionClass}>
        <CalendarBlankIcon className="size-4 text-muted-foreground" />
        <span>Ver calendario</span>
      </Link>
    </nav>
  </div>
);
