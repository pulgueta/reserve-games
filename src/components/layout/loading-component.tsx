import { SpinnerIcon } from "@phosphor-icons/react";

export function LoadingComponent() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
      <SpinnerIcon className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
