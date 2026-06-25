import { CalendarBlankIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookingActions } from "@/features/bookings/hooks/use-bookings";
import { seo } from "@/lib/seo";

// The scanner pulls in the camera + barcode-detector stack; load it only when
// the scanner page is actually opened.
const QrScanner = lazy(() =>
  import("@/features/admin/components/qr-scanner").then((m) => ({
    default: m.QrScanner,
  })),
);

export const Route = createFileRoute("/scanner/")({
  head: () => ({ meta: seo({ title: "Escáner de acceso — ReserveGames" }) }),
  component: ScannerPage,
});

function ScannerPage() {
  const { verifyByQr } = useBookingActions();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-semibold text-2xl tracking-tight">
          Control de acceso
        </h1>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link to="/scanner/calendar" />}
        >
          <CalendarBlankIcon className="size-4" />
          Calendario
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
        <QrScanner onVerify={(token) => verifyByQr.mutateAsync({ token })} />
      </Suspense>
    </div>
  );
}
