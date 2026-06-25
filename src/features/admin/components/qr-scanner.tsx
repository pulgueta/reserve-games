import {
  CameraIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  MoneyIcon,
  QrCodeIcon,
  UserIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import type { FC, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWebHaptics } from "web-haptics/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/lib/format";
import { sportEmoji, sportLabel } from "@/lib/sports";
import { cn } from "@/lib/utils";

type VerifyState = "authorized" | "cash" | "used" | "invalid";

interface VerifyResult {
  state: VerifyState;
  customerName?: string;
  date?: number;
  durationHours?: number;
  venueName?: string;
  sport?: string;
  paymentMethod?: "online" | "cash" | null;
}

interface QrScannerProps {
  onVerify: (token: string) => Promise<VerifyResult | null>;
}

const SCAN_INTERVAL_MS = 400;

function isBarcodeDetectorSupported(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

export const QrScanner: FC<QrScannerProps> = ({ onVerify }) => {
  const haptic = useWebHaptics();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // biome-ignore lint/suspicious/noExplicitAny: BarcodeDetector lacks DOM lib types.
  const detectorRef = useRef<any>(null);
  const verifyingRef = useRef(false);

  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Resolved after mount so the server and first client render agree (no
  // hydration mismatch); BarcodeDetector only exists in the browser anyway.
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(isBarcodeDetectorSupported());
  }, []);

  const stopCamera = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  const runVerify = useCallback(
    async (token: string) => {
      const value = token.trim();
      if (!value || verifyingRef.current) {
        return;
      }
      verifyingRef.current = true;
      stopCamera();
      setVerifying(true);
      setCameraError(null);
      try {
        const next = await onVerify(value);
        const resolved: VerifyResult = next ?? { state: "invalid" };
        setResult(resolved);
        haptic.trigger(resolved.state === "invalid" ? "error" : "success");
      } catch {
        setResult({ state: "invalid" });
        haptic.trigger("error");
      } finally {
        setVerifying(false);
        verifyingRef.current = false;
      }
    },
    [haptic, onVerify, stopCamera],
  );

  const startCamera = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setCameraError(
        "Tu navegador no permite acceder a la cámara. Usa la búsqueda manual.",
      );
      return;
    }
    if (!supported) {
      setCameraError(
        "El escaneo automático no está disponible en este dispositivo. Pega el código abajo.",
      );
      return;
    }

    setCameraError(null);
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        return;
      }
      video.srcObject = stream;
      await video.play().catch(() => undefined);

      // biome-ignore lint/suspicious/noExplicitAny: BarcodeDetector lacks DOM lib types.
      const Detector = (window as any).BarcodeDetector;
      detectorRef.current = new Detector({ formats: ["qr_code"] });

      setScanning(true);

      intervalRef.current = setInterval(async () => {
        const detector = detectorRef.current;
        const el = videoRef.current;
        if (!detector || !el || verifyingRef.current || el.readyState < 2) {
          return;
        }
        try {
          const codes = await detector.detect(el);
          const raw = codes?.[0]?.rawValue;
          if (raw) {
            await runVerify(raw);
          }
        } catch {
          // Transient detect failures (e.g. frame not ready) are ignored.
        }
      }, SCAN_INTERVAL_MS);
    } catch {
      stopCamera();
      setCameraError(
        "No pudimos acceder a la cámara. Revisa los permisos o usa la búsqueda manual.",
      );
    }
  }, [runVerify, stopCamera, supported]);

  const reset = useCallback(() => {
    setResult(null);
    setManualToken("");
    setCameraError(null);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  if (result) {
    return <ResultCard result={result} onReset={reset} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCodeIcon className="size-5 text-primary" weight="fill" />
            Control de acceso
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Escanea el QR de la reserva o pega el código para verificar el
            acceso.
          </p>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-950">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              aria-label="Vista de la cámara para escanear el QR"
              className={cn(
                "size-full object-cover transition-opacity",
                scanning ? "opacity-100" : "opacity-0",
              )}
            />

            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-neutral-400">
                <CameraIcon className="size-10" />
                <p className="px-6 text-sm">
                  {supported
                    ? "Toca «Iniciar escaneo» para activar la cámara"
                    : "Escaneo automático no disponible — usa la búsqueda manual"}
                </p>
              </div>
            )}

            <CornerBrackets active={scanning} />

            {verifying && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/60">
                <Spinner className="size-8 text-primary-foreground" />
              </div>
            )}
          </div>

          {cameraError && (
            <p
              role="alert"
              className="rounded-xl bg-warning/10 px-3 py-2 text-sm text-warning-foreground"
            >
              {cameraError}
            </p>
          )}

          <div className="flex gap-2">
            {scanning ? (
              <Button variant="outline" className="flex-1" onClick={stopCamera}>
                Detener escaneo
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={startCamera}
                disabled={!supported || verifying}
              >
                <CameraIcon className="size-4" />
                Iniciar escaneo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Búsqueda manual</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void runVerify(manualToken);
            }}
          >
            <Input
              value={manualToken}
              onChange={(event) => setManualToken(event.target.value)}
              placeholder="Pega el código de la reserva"
              aria-label="Código de la reserva"
              className="font-mono"
              autoComplete="off"
              spellCheck={false}
            />
            <Button
              type="submit"
              disabled={verifying || manualToken.trim().length === 0}
            >
              {verifying ? <Spinner className="size-4" /> : "Verificar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

interface CornerBracketsProps {
  active: boolean;
}

const CornerBrackets: FC<CornerBracketsProps> = ({ active }) => {
  const base = cn(
    "absolute size-10 transition-colors",
    active ? "border-primary" : "border-neutral-600",
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-6">
      <span
        className={cn(
          base,
          "top-0 left-0 rounded-tl-2xl border-t-4 border-l-4",
        )}
      />
      <span
        className={cn(
          base,
          "top-0 right-0 rounded-tr-2xl border-t-4 border-r-4",
        )}
      />
      <span
        className={cn(
          base,
          "bottom-0 left-0 rounded-bl-2xl border-b-4 border-l-4",
        )}
      />
      <span
        className={cn(
          base,
          "right-0 bottom-0 rounded-br-2xl border-r-4 border-b-4",
        )}
      />
    </div>
  );
};

interface StateStyle {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  headerClass: string;
  iconWrapClass: string;
  showDetails: boolean;
}

function getStateStyle(result: VerifyResult): StateStyle {
  switch (result.state) {
    case "authorized":
      return {
        icon: <CheckCircleIcon className="size-10" weight="fill" />,
        title: "Acceso autorizado",
        subtitle: "Reserva válida — Pagada en línea",
        headerClass: "bg-primary/10 text-primary",
        iconWrapClass: "bg-primary text-primary-foreground",
        showDetails: true,
      };
    case "cash":
      return {
        icon: <MoneyIcon className="size-10" weight="fill" />,
        title: "Cobrar en caja",
        subtitle: "Reserva válida — Pago en efectivo",
        headerClass: "bg-warning/10 text-warning-foreground",
        iconWrapClass: "bg-warning text-warning-foreground",
        showDetails: true,
      };
    case "used":
      return {
        icon: <WarningCircleIcon className="size-10" weight="fill" />,
        title: "Reserva expirada o ya registrada",
        subtitle: "Este código no puede usarse de nuevo",
        headerClass: "bg-muted text-muted-foreground",
        iconWrapClass: "bg-muted-foreground/20 text-muted-foreground",
        showDetails: false,
      };
    case "invalid":
      return {
        icon: <XCircleIcon className="size-10" weight="fill" />,
        title: "QR no reconocido",
        subtitle: "Reserva no encontrada",
        headerClass: "bg-destructive/10 text-destructive",
        iconWrapClass: "bg-destructive text-primary-foreground",
        showDetails: false,
      };
  }
}

interface ResultCardProps {
  result: VerifyResult;
  onReset: () => void;
}

const ResultCard: FC<ResultCardProps> = ({ result, onReset }) => {
  const style = getStateStyle(result);
  const { customerName, venueName, sport, date, durationHours } = result;

  return (
    <Card className="overflow-hidden">
      <div
        className={cn(
          "flex flex-col items-center gap-3 px-6 py-8 text-center",
          style.headerClass,
        )}
      >
        <span
          className={cn(
            "flex size-16 items-center justify-center rounded-full shadow-sm",
            style.iconWrapClass,
          )}
        >
          {style.icon}
        </span>
        <h2 className="font-semibold text-2xl tracking-tight">{style.title}</h2>
        {style.subtitle && (
          <p className="text-sm opacity-90">{style.subtitle}</p>
        )}
      </div>

      {style.showDetails && (
        <CardContent className="flex flex-col gap-3 pt-2">
          {result.paymentMethod && (
            <div className="flex justify-center">
              <Badge variant={result.state === "cash" ? "warning" : "default"}>
                {result.paymentMethod === "cash"
                  ? "Pago en efectivo"
                  : "Pago en línea"}
              </Badge>
            </div>
          )}

          <Separator />

          <dl className="flex flex-col gap-3">
            {customerName && (
              <DetailRow
                icon={<UserIcon className="size-4" />}
                label="Cliente"
                value={customerName}
              />
            )}
            {venueName && (
              <DetailRow
                icon={<MapPinIcon className="size-4" />}
                label="Sede"
                value={
                  <span className="flex items-center gap-1.5">
                    {sport && <span aria-hidden>{sportEmoji(sport)}</span>}
                    {venueName}
                    {sport && (
                      <span className="text-muted-foreground">
                        · {sportLabel(sport)}
                      </span>
                    )}
                  </span>
                }
              />
            )}
            {typeof date === "number" && (
              <DetailRow
                icon={<ClockIcon className="size-4" />}
                label="Fecha y hora"
                value={formatDateTime(date)}
              />
            )}
            {typeof durationHours === "number" && (
              <DetailRow
                icon={<ClockIcon className="size-4" />}
                label="Duración"
                value={`${durationHours} ${durationHours === 1 ? "hora" : "horas"}`}
              />
            )}
          </dl>
        </CardContent>
      )}

      <CardContent className={cn(style.showDetails ? "pt-2" : "pt-0")}>
        <Button variant="outline" className="w-full" onClick={onReset}>
          <QrCodeIcon className="size-4" />
          Escanear otra
        </Button>
      </CardContent>
    </Card>
  );
};

interface DetailRowProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

const DetailRow: FC<DetailRowProps> = ({ icon, label, value }) => (
  <div className="flex items-start justify-between gap-4">
    <dt className="flex items-center gap-2 text-muted-foreground text-sm">
      {icon}
      {label}
    </dt>
    <dd className="text-right font-medium text-foreground text-sm">{value}</dd>
  </div>
);
