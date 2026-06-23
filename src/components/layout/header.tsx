import { UserButton } from "@clerk/tanstack-react-start";
import { CourtBasketballIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";

import ThemeToggle from "@/components/ThemeToggle";
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
            <UserButton />
          </Authenticated>
        </div>
      </nav>
    </header>
  );
}
