import type { Booking } from "@convex/schema";
import type { FC } from "react";
import { useWebHaptics } from "web-haptics/react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useBookingActions } from "@/features/bookings/hooks/use-bookings";
import { getConvexErrorMessage } from "@/lib/convex-errors";

const STATUS_STYLES: Record<Booking["status"], string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
  completed: "bg-secondary text-secondary-foreground",
};

interface BookingCardProps {
  booking: Booking;
}

export const BookingCard: FC<BookingCardProps> = ({ booking }) => {
  const haptic = useWebHaptics();
  const {
    cancelBooking: { mutateAsync: cancelBooking, isPending },
  } = useBookingActions();

  const canCancel =
    booking.status === "confirmed" || booking.status === "pending";

  const onCancel = async () => {
    try {
      await cancelBooking({ id: booking._id });
      haptic.trigger("success");
      toast.success("Booking cancelled");
    } catch (error) {
      haptic.trigger("error");
      toast.error(getConvexErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-sm">
          {new Date(booking.date).toLocaleString()}
        </p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[booking.status]}`}
        >
          {booking.status}
        </span>
      </div>
      <p className="text-muted-foreground text-sm">
        {booking.durationHours}h · ${booking.totalPrice} ·{" "}
        {booking.customerName}
      </p>
      {canCancel && (
        <Button
          variant="destructive"
          size="sm"
          className="mt-1 self-start"
          disabled={isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
      )}
    </div>
  );
};
