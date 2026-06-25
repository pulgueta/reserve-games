import { UserButton, useOrganization } from "@clerk/tanstack-react-start";
import {
  CalendarBlankIcon,
  CourtBasketballIcon,
  HouseIcon,
  type Icon,
  PencilSimpleIcon,
  QrCodeIcon,
  SquaresFourIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { FC } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface NavItem {
  to: string;
  label: string;
  icon: Icon;
  /** Match the path exactly (index routes) instead of by prefix. */
  exact?: boolean;
}

const NAV: readonly NavItem[] = [
  { to: "/dashboard", label: "Resumen", icon: SquaresFourIcon, exact: true },
  { to: "/dashboard/venue", label: "Espacio", icon: PencilSimpleIcon },
  { to: "/dashboard/team", label: "Equipo", icon: UsersThreeIcon },
  { to: "/scanner", label: "Escáner", icon: QrCodeIcon, exact: true },
  { to: "/scanner/calendar", label: "Calendario", icon: CalendarBlankIcon },
];

function isItemActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.to : pathname.startsWith(item.to);
}

const DashboardSidebar: FC<{ pathname: string }> = ({ pathname }) => {
  const { organization, membership } = useOrganization();
  // Staff (org members) only get the scanner + calendar; the admin-only sections
  // are filtered out so the sidebar matches what they can actually open.
  const isAdmin = membership?.role === "org:admin";
  const items = isAdmin
    ? NAV
    : NAV.filter((item) => item.to.startsWith("/scanner"));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-2.5 py-3">
        <Link
          to="/dashboard"
          className="-m-1 flex items-center gap-2.5 rounded-md p-1 transition-colors hover:bg-sidebar-accent"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CourtBasketballIcon className="size-4" weight="fill" />
          </span>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold text-sm leading-tight">
              {organization?.name ?? "ReserveGames"}
            </span>
            <span className="truncate text-muted-foreground text-xs leading-tight">
              Panel de socio
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2.5">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      render={<Link to={item.to} />}
                      isActive={isItemActive(pathname, item)}
                      tooltip={item.label}
                    >
                      <ItemIcon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2.5 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to="/" />}
              tooltip="Volver al sitio"
            >
              <HouseIcon className="size-4" />
              <span>Volver al sitio</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

/** Venue-owner chrome: collapsible sidebar + an inset bordered content card with
 * a sticky topbar. The page renders into the scrollable `<Outlet/>`. */
export const DashboardShell: FC = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const activeLabel =
    NAV.find((item) => isItemActive(pathname, item))?.label ?? "Panel";

  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar pathname={pathname} />
      <div className="h-svh w-full overflow-hidden lg:p-2">
        <div className="flex h-full w-full flex-col overflow-hidden bg-background lg:rounded-xl lg:border">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-card px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1.5" />
              <span className="font-medium text-sm">{activeLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserButton />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
