import { Outlet } from "@tanstack/react-router";
import type { FC } from "react";

import { Header } from "@/components/layout/header";

/** Public + customer chrome: the marketing header over a full-height main.
 * Shared by every customer-facing route (`/`, `/venues`, `/bookings`, …) so the
 * header stays mounted across navigations — no flash, no layout shift. */
export const MarketingShell: FC = () => (
  <>
    <Header />
    <main className="min-h-[calc(100dvh-4rem)]">
      <Outlet />
    </main>
  </>
);
