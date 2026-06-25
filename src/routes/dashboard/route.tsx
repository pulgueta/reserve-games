import { createFileRoute, redirect } from "@tanstack/react-router";

import { DashboardShell } from "@/components/layout/dashboard-shell";

/** Venue-owner shell + guard. `role` reflects the ACTIVE org, which the Header's
 * org switch and the become-partner flow set before navigating here; every
 * Convex write re-checks the venue scope, so this guard is UX only. */
export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ context }) => {
    if (!context.userId) {
      throw redirect({ to: "/login" });
    }
    if (context.role !== "admin") {
      throw redirect({ to: "/" });
    }
  },
  component: DashboardShell,
});
