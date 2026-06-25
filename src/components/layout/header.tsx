import { UserButton, useOrganizationList } from "@clerk/tanstack-react-start";
import {
  CourtBasketballIcon,
  QrCodeIcon,
  SquaresFourIcon,
  StorefrontIcon,
  TicketIcon,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const navLinkClass =
  "rounded-lg px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground";
const navLinkActiveClass = "rounded-lg px-3 py-1.5 text-foreground text-sm";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4">
        <Link
          to="/"
          className="mr-2 flex items-center gap-2 font-bold text-lg tracking-tight"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CourtBasketballIcon className="size-4" weight="fill" />
          </span>
          ReserveGames
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          <Link
            to="/venues"
            search={{}}
            className={navLinkClass}
            activeProps={{ className: navLinkActiveClass }}
          >
            Espacios
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Unauthenticated>
            <Button nativeButton={false} render={<Link to="/login" />}>
              Entrar
            </Button>
          </Unauthenticated>
          <Authenticated>
            <AuthedNav />
            <UserButton />
          </Authenticated>
        </div>
      </nav>
    </header>
  );
}

function AuthedNav() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoaded, setActive, userMemberships } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  const memberships = userMemberships?.data ?? [];
  const adminOrg = memberships.find((m) => m.role === "org:admin");
  const staffOrg = memberships.find((m) => m.role === "org:member");

  // Switch the active org to the venue being managed/scanned, then refresh the
  // cached Clerk auth snapshot so the server-side role guard sees the new org
  // (the snapshot is frozen with staleTime: Infinity), then navigate.
  const goToOrg = async (orgId: string, to: "/dashboard" | "/scanner") => {
    if (setActive) {
      await setActive({ organization: orgId });
      await queryClient.invalidateQueries({ queryKey: ["clerkAuth"] });
    }
    await navigate({ to });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link to="/bookings" />}
      >
        <TicketIcon className="size-4" />
        <span className="hidden sm:inline">Mis reservas</span>
      </Button>

      {adminOrg && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToOrg(adminOrg.organization.id, "/dashboard")}
        >
          <SquaresFourIcon className="size-4" />
          <span className="hidden sm:inline">Panel</span>
        </Button>
      )}

      {!adminOrg && staffOrg && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToOrg(staffOrg.organization.id, "/scanner")}
        >
          <QrCodeIcon className="size-4" />
          <span className="hidden sm:inline">Escáner</span>
        </Button>
      )}

      {isLoaded && !adminOrg && !staffOrg && (
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link to="/become-partner" />}
        >
          <StorefrontIcon className="size-4" />
          <span className="hidden sm:inline">Convertirse en socio</span>
        </Button>
      )}
    </>
  );
}
