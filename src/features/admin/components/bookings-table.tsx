import { ClockIcon } from "@phosphor-icons/react";
import type { FC } from "react";

import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/format";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
type PaymentStatus = "pending" | "paid";
type PaymentMethod = "online" | "cash" | null;

interface BookingRow {
  _id: string;
  customerName: string;
  date: number;
  durationHours: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  unitId?: string | null;
}

interface BookingsTableProps {
  bookings: BookingRow[];
  title?: string;
  emptyLabel?: string;
}

type BadgeVariant = "default" | "warning" | "destructive" | "outline";

interface BadgeDescriptor {
  label: string;
  variant: BadgeVariant;
}

interface DayGroup {
  key: string;
  label: string;
  rows: BookingRow[];
}

const STATUS_BADGE: Record<BookingStatus, BadgeDescriptor> = {
  confirmed: { label: "Confirmada", variant: "default" },
  pending: { label: "Pendiente", variant: "warning" },
  completed: { label: "Completada", variant: "outline" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

function paymentBadge(
  paymentStatus: PaymentStatus,
  paymentMethod: PaymentMethod,
): BadgeDescriptor {
  if (paymentStatus === "paid" && paymentMethod === "online") {
    return { label: "Pagada en línea", variant: "default" };
  }
  if (paymentStatus === "paid" && paymentMethod === "cash") {
    return { label: "Pagada (efectivo)", variant: "default" };
  }
  if (paymentMethod === "cash") {
    return { label: "Efectivo pendiente", variant: "warning" };
  }
  return { label: "Sin pagar", variant: "outline" };
}

function groupByDay(bookings: BookingRow[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();

  for (const booking of bookings) {
    const day = new Date(booking.date);
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.rows.push(booking);
    } else {
      groups.set(key, {
        key,
        label: formatDate(booking.date),
        rows: [booking],
      });
    }
  }

  const ordered = [...groups.values()];
  ordered.sort((a, b) => a.rows[0].date - b.rows[0].date);
  for (const group of ordered) {
    group.rows.sort((a, b) => a.date - b.date);
  }
  return ordered;
}

export const BookingsTable: FC<BookingsTableProps> = ({
  bookings,
  title = "Reservas",
  emptyLabel = "No hay reservas todavía.",
}) => {
  const days = groupByDay(bookings);

  return (
    <section className="flex flex-col gap-4">
      {title ? (
        <h2 className="font-semibold text-foreground text-lg tracking-tight">
          {title}
        </h2>
      ) : null}

      {days.length === 0 ? (
        <p className="rounded-2xl border border-border border-dashed bg-card p-8 text-center text-muted-foreground text-sm">
          {emptyLabel}
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {days.map((day) => (
            <div key={day.key} className="flex flex-col gap-2">
              <h3 className="sticky top-0 z-10 -mx-1 bg-background/80 px-1 py-1 font-medium text-muted-foreground text-sm capitalize backdrop-blur">
                {day.label}
              </h3>

              <ul className="flex flex-col gap-2">
                {day.rows.map((booking) => {
                  const payment = paymentBadge(
                    booking.paymentStatus,
                    booking.paymentMethod,
                  );
                  const status = STATUS_BADGE[booking.status];

                  return (
                    <li
                      key={booking._id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-medium text-foreground">
                          <ClockIcon
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                          <span>
                            {formatTime(booking.date)} {"· "}
                            {booking.durationHours}h
                          </span>
                        </p>
                        <p className="truncate text-muted-foreground text-sm">
                          {booking.customerName}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant={payment.variant}>{payment.label}</Badge>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
