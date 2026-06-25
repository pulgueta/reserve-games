import type { Id } from "@convex/_generated/dataModel";
import type { FC } from "react";
import { useWebHaptics } from "web-haptics/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { QrViewerButton } from "@/features/bookings/components/qr-ticket";
import { useBookingActions } from "@/features/bookings/hooks/use-bookings";
import { getConvexErrorMessage } from "@/lib/convex-errors";
import { formatCOP, formatDateTime } from "@/lib/format";
import { bookingReference } from "@/lib/reference";
import { sportEmoji } from "@/lib/sports";

/** The shape returned by `bookings.getMine` (booking row + venue summary). */
export interface BookingHistoryItem {
  _id: Id<"bookings">;
  date: number;
  durationHours: number;
  totalPrice: number;
  customerName: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid";
  paymentMethod?: "online" | "cash" | null;
  qrToken?: string | null;
  venueName: string;
  venueSport: string | null;
}

const STATUS_LABEL: Record<BookingHistoryItem["status"], string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
};

function paymentBadge(item: BookingHistoryItem): {
  label: string;
  variant: "default" | "warning" | "outline";
} {
  if (item.paymentStatus === "paid") {
    return {
      label:
        item.paymentMethod === "cash" ? "Pagada (efectivo)" : "Pagada en línea",
      variant: "default",
    };
  }
  if (item.paymentMethod === "cash") {
    return { label: "Efectivo pendiente", variant: "warning" };
  }
  return { label: "Sin pagar", variant: "outline" };
}

interface BookingCardProps {
  booking: BookingHistoryItem;
}

export const BookingCard: FC<BookingCardProps> = ({ booking }) => {
  const haptic = useWebHaptics();
  const {
    cancelBooking: { mutateAsync: cancelBooking, isPending: cancelling },
    confirmPayment: { mutateAsync: confirmPayment, isPending: paying },
  } = useBookingActions();

  const canCancel =
    booking.status === "confirmed" || booking.status === "pending";
  const badge = paymentBadge(booking);

  const onCancel = async () => {
    try {
      await cancelBooking({ id: booking._id });
      haptic.trigger("success");
      toast.success("Reserva cancelada.");
    } catch (error) {
      haptic.trigger("error");
      toast.error(getConvexErrorMessage(error));
    }
  };

  const onPay = async (paymentMethod: "online" | "cash") => {
    try {
      await confirmPayment({ id: booking._id, paymentMethod });
      haptic.trigger("success");
      toast.success(
        paymentMethod === "online"
          ? "¡Pago confirmado!"
          : "Listo, paga en el local al llegar.",
      );
    } catch (error) {
      haptic.trigger("error");
      toast.error(getConvexErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">
            {booking.venueSport ? `${sportEmoji(booking.venueSport)} ` : ""}
            {booking.venueName}
          </p>
          <p className="text-muted-foreground text-sm">
            {formatDateTime(booking.date)} · {booking.durationHours}h ·{" "}
            {formatCOP(booking.totalPrice)}
          </p>
        </div>
        <Badge
          variant={booking.status === "cancelled" ? "destructive" : "outline"}
        >
          {STATUS_LABEL[booking.status]}
        </Badge>
      </div>

      {booking.status !== "cancelled" && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>

          {booking.qrToken ? (
            <QrViewerButton
              token={booking.qrToken}
              reference={bookingReference(booking.qrToken)}
            />
          ) : (
            <>
              <Button
                size="sm"
                disabled={paying}
                onClick={() => onPay("online")}
              >
                Pagar en línea
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={paying}
                onClick={() => onPay("cash")}
              >
                Pagar en el local
              </Button>
            </>
          )}

          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              className="ml-auto"
              disabled={cancelling}
              onClick={onCancel}
            >
              Cancelar
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
