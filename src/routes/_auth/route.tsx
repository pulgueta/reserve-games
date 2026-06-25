import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  component: () => (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <Outlet />
    </div>
  ),
});
