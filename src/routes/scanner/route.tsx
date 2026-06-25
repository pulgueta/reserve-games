import { createFileRoute, redirect } from "@tanstack/react-router";

import { DashboardShell } from "@/components/layout/dashboard-shell";

/** Scanner subtree for admins and active staff. It renders the same sidebar
 * shell as the dashboard so the chrome stays consistent (the nav is filtered to
 * scanner-only for staff). `verifyByQr` re-checks the venue scope server-side,
 * so this guard is UX only. */
export const Route = createFileRoute("/scanner")({
  beforeLoad: ({ context }) => {
    if (!context.userId) {
      throw redirect({ to: "/login" });
    }
    if (context.role !== "admin" && context.role !== "staff") {
      throw redirect({ to: "/" });
    }
  },
  component: DashboardShell,
});
