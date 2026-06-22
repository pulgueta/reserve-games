import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function NotFoundComponent() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-1">
        <h1 className="font-bold text-2xl tracking-tight">Page not found</h1>
        <p className="text-muted-foreground text-sm">
          The page you're looking for doesn't exist.
        </p>
      </div>
      <Button nativeButton={false} render={<Link to="/" />}>
        Go home
      </Button>
    </div>
  );
}
