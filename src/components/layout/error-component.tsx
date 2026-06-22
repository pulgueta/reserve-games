import { ArrowClockwiseIcon, WarningIcon } from "@phosphor-icons/react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link, useRouter } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();

  console.error(error);

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-4 p-6 text-center">
      <WarningIcon className="size-10 text-destructive" />
      <div className="space-y-1">
        <h1 className="font-bold text-xl tracking-tight">
          Something went wrong
        </h1>
        <p className="max-w-md text-pretty text-muted-foreground text-sm">
          {error.message}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.invalidate()}>
          <ArrowClockwiseIcon />
          Try again
        </Button>
        <Button nativeButton={false} render={<Link to="/" />}>
          Go home
        </Button>
      </div>
    </div>
  );
}
