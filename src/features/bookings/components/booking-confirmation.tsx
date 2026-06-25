import { MoneyIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import { useState } from "react";
import { useWebHaptics } from "web-haptics/react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import type { ConfirmedBooking } from "@/features/bookings/components/booking-flow";
import { QrTicket } from "@/features/bookings/components/qr-ticket";
import { useBookingActions } from "@/features/bookings/hooks/use-bookings";
import { getConvexErrorMessage } from "@/lib/convex-errors";
import { formatCOP, formatDateTime } from "@/lib/format";
import { bookingReference } from "@/lib/reference";

interface BookingConfirmationProps {
  booking: ConfirmedBooking;
}

type PaymentMethod = "online" | "cash";

export const BookingConfirmation: FC<BookingConfirmationProps> = ({
  booking,
}) => {
  const haptic = useWebHaptics();
  const {
    confirmPayment: { mutateAsync: confirmPayment, isPending },
  } = useBookingActions();
  const [paid, setPaid] = useState<{
    token: string;
    method: PaymentMethod;
  } | null>(null);

  const pay = async (method: PaymentMethod) => {
    try {
      const { qrToken } = await confirmPayment({
        id: booking.bookingId,
        paymentMethod: method,
      });
      haptic.trigger("success");
      toast.success(
        method === "online"
          ? "¡Pago confirmado!"
          : "Listo, paga en el local al llegar.",
      );
      setPaid({ token: qrToken, method });
    } catch (error) {
      haptic.trigger("error");
      toast.error(getConvexErrorMessage(error));
    }
  };

  if (paid) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-12">
        <QrTicket
          token={paid.token}
          reference={bookingReference(paid.token)}
          venueName={booking.venueName}
          sport={booking.sport}
          date={booking.date}
          durationHours={booking.durationHours}
          total={booking.total}
          paymentMethod={paid.method}
        />
        <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
          <Button nativeButton={false} render={<Link to="/bookings" />}>
            Ver mis reservas
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to="/" />}
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <h1 className="text-center font-semibold text-2xl tracking-tight">
        Confirma y paga
      </h1>
      <p className="mt-1 text-center text-muted-foreground text-sm">
        Tu reserva en {booking.venueName} está apartada. Elige cómo pagar.
      </p>

      <dl className="mt-6 w-full rounded-2xl border bg-card p-5 text-left text-sm">
        <div className="flex justify-between gap-2 py-1.5">
          <dt className="text-muted-foreground">Fecha y hora</dt>
          <dd className="font-medium">{formatDateTime(booking.date)}</dd>
        </div>
        {booking.unitLabel && (
          <div className="flex justify-between gap-2 py-1.5">
            <dt className="text-muted-foreground">Espacio</dt>
            <dd className="font-medium">{booking.unitLabel}</dd>
          </div>
        )}
        <div className="flex justify-between gap-2 py-1.5">
          <dt className="text-muted-foreground">Duración</dt>
          <dd className="font-medium">
            {booking.durationHours}{" "}
            {booking.durationHours === 1 ? "hora" : "horas"}
          </dd>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between gap-2 py-1.5">
          <dt className="font-semibold">Total</dt>
          <dd className="font-semibold">{formatCOP(booking.total)}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-col gap-2">
        <Button disabled={isPending} onClick={() => pay("online")}>
          Pagar en línea {formatCOP(booking.total)}
        </Button>
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() => pay("cash")}
        >
          <MoneyIcon className="size-4" />
          Pagar en efectivo en el local
        </Button>
      </div>

      <p className="mt-3 text-center text-muted-foreground text-xs">
        El pago en línea es una simulación; la pasarela real se integrará
        después.
      </p>
    </div>
  );
};
