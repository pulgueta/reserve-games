import { TicketIcon } from "@phosphor-icons/react";
import type { FC } from "react";
import { useState } from "react";

import { BookingCard } from "@/features/bookings/components/booking-card";
import { useMyBookings } from "@/features/bookings/hooks/use-bookings";
import { cn } from "@/lib/utils";

type Tab = "upcoming" | "history" | "cancelled";

const TABS: { value: Tab; label: string }[] = [
  { value: "upcoming", label: "Próximas" },
  { value: "history", label: "Historial" },
  { value: "cancelled", label: "Canceladas" },
];

/** The signed-in user's bookings, split into upcoming / history / cancelled.
 * `now` is captured once per mount (lazy init) so the render stays pure. */
export const BookingsPage: FC = () => {
  const { data: bookings } = useMyBookings();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [now] = useState(() => Date.now());

  const filtered = bookings.filter((b) => {
    if (tab === "cancelled") {
      return b.status === "cancelled";
    }
    if (b.status === "cancelled") {
      return false;
    }
    return tab === "upcoming" ? b.date >= now : b.date < now;
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-8">
      <h1 className="font-semibold text-2xl tracking-tight">Mis reservas</h1>

      <div className="flex gap-1 rounded-full bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 font-medium text-sm transition-colors",
              tab === t.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
          <TicketIcon className="size-8" />
          <p className="text-sm">No tienes reservas en esta sección.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((booking) => (
            <BookingCard key={booking._id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
};
