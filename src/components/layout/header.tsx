import { UserButton } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";

import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

const navLinkClass =
  "rounded-lg px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground";
const navLinkActiveClass = "rounded-lg px-3 py-1.5 text-foreground";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4">
        <Link to="/" className="mr-2 font-bold text-lg tracking-tight">
          Reserve Games
        </Link>

        <div className="flex items-center gap-1 text-sm">
          <Link
            to="/venues"
            className={navLinkClass}
            activeProps={{ className: navLinkActiveClass }}
          >
            Venues
          </Link>
          <Authenticated>
            <Link
              to="/profile"
              className={navLinkClass}
              activeProps={{ className: navLinkActiveClass }}
            >
              Dashboard
            </Link>
          </Authenticated>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Unauthenticated>
            <Button nativeButton={false} render={<Link to="/login" />}>
              Sign in
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
