import {
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  MoneyIcon,
  QrCodeIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { qrcodeDataURI } from "etiket";
import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCOP, formatDateTime } from "@/lib/format";
import { sportEmoji, sportLabel } from "@/lib/sports";
import { cn } from "@/lib/utils";

type PaymentMethod = "online" | "cash" | null;

/**
 * Encode `text` as an SVG QR data URI. `etiket` renders synchronously, so the
 * QR is available on first paint (SSR included) — no async state, no placeholder
 * swap, no layout shift.
 */
function qrSrc(text: string, size: number): string {
  return qrcodeDataURI(text, { size, margin: 1 });
}

interface DetailRowProps {
  icon: FC<{ className?: string; weight?: "bold" | "fill" }>;
  label: string;
  value: string;
}

const DetailRow: FC<DetailRowProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <span className="flex items-center gap-2 text-muted-foreground text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      {label}
    </span>
    <span className="text-right font-medium text-foreground text-sm">
      {value}
    </span>
  </div>
);

interface PaymentBadgeProps {
  paymentMethod: PaymentMethod;
}

const PaymentBadge: FC<PaymentBadgeProps> = ({ paymentMethod }) => {
  if (paymentMethod === "online") {
    return (
      <Badge className="gap-1.5 rounded-full">
        <CheckCircleIcon className="size-3.5" weight="fill" />
        Pagada en línea
      </Badge>
    );
  }

  if (paymentMethod === "cash") {
    return (
      <Badge
        variant="warning"
        className="gap-1.5 rounded-full bg-warning/10 text-warning"
      >
        <MoneyIcon className="size-3.5" weight="fill" />
        Pago en efectivo · cobra en el local
      </Badge>
    );
  }

  return null;
};

interface QrTicketProps {
  token: string;
  reference: string;
  venueName: string;
  sport: string;
  date: number;
  durationHours: number;
  total: number;
  paymentMethod: PaymentMethod;
}

/**
 * Post-payment success ticket: a centered receipt card with a scannable QR,
 * the mono booking reference and the booking details. Purely presentational —
 * all data and the QR token arrive via props.
 */
export const QrTicket: FC<QrTicketProps> = ({
  token,
  reference,
  venueName,
  sport,
  date,
  durationHours,
  total,
  paymentMethod,
}) => {
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircleIcon className="size-8 text-primary" weight="fill" />
        </div>
        <h2 className="mt-4 font-semibold text-foreground text-xl tracking-tight">
          ¡Reserva confirmada!
        </h2>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <div className="rounded-xl border border-border bg-background p-3">
          <img
            src={qrSrc(token, 240)}
            alt={`Código QR de la reserva ${reference}`}
            width={200}
            height={200}
            className="size-50 rounded-lg"
          />
        </div>
        <p className="mt-3 font-mono text-foreground text-sm tracking-wider">
          {reference}
        </p>
      </div>

      <Separator className="my-5 border-dashed" />

      <div className="divide-y divide-dashed divide-border">
        <DetailRow
          icon={MapPinIcon}
          label="Sede"
          value={`${sportEmoji(sport)} ${venueName} · ${sportLabel(sport)}`}
        />
        <DetailRow
          icon={ClockIcon}
          label="Fecha"
          value={formatDateTime(date)}
        />
        <DetailRow
          icon={ClockIcon}
          label="Duración"
          value={`${durationHours} h`}
        />
        <DetailRow
          icon={CurrencyDollarIcon}
          label="Total"
          value={formatCOP(total)}
        />
      </div>

      {paymentMethod ? (
        <div className="mt-5 flex justify-center">
          <PaymentBadge paymentMethod={paymentMethod} />
        </div>
      ) : null}
    </div>
  );
};

interface QrViewerButtonProps {
  token: string;
  reference: string;
  label?: string;
}

/**
 * Outline button that opens a fullscreen overlay showing the booking QR at a
 * larger size. The overlay is a fixed-position dialog (no Dialog primitive
 * exists): it traps focus on the close button, closes on Escape and on
 * backdrop click.
 */
export const QrViewerButton: FC<QrViewerButtonProps> = ({
  token,
  reference,
  label = "Ver QR",
}) => {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <QrCodeIcon className="size-4" />
        {label}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={close}
            className={cn(
              "absolute inset-0 bg-background/95 backdrop-blur",
              "cursor-default",
            )}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Código QR de la reserva ${reference}`}
            className="relative w-full max-w-xs rounded-2xl border bg-card p-6 text-center shadow-sm"
          >
            <div className="flex justify-center">
              <div className="rounded-xl border border-border bg-background p-3">
                <img
                  src={qrSrc(token, 280)}
                  alt={`Código QR de la reserva ${reference}`}
                  width={280}
                  height={280}
                  className="size-70 rounded-lg"
                />
              </div>
            </div>

            <p className="mt-4 font-mono text-foreground text-sm tracking-wider">
              {reference}
            </p>

            <Button
              ref={closeButtonRef}
              variant="outline"
              className="mt-5 w-full"
              onClick={close}
            >
              <XCircleIcon className="size-4" />
              Cerrar
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
};
