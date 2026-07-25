import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import type { Sport } from "@/lib/sports";
import { SPORT_LIST } from "@/lib/sports";
import { cn } from "@/lib/utils";

const chipClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 font-medium text-sm transition-colors";

interface CategoryChipsProps {
  /** Highlights the matching chip; "Todos" is active when omitted. */
  activeSport?: Sport;
}

/**
 * Horizontally scrollable sport categories. Each chip navigates to the listing
 * filtered by that sport ("Todos" clears the filter).
 */
export const CategoryChips: FC<CategoryChipsProps> = ({ activeSport }) => (
  <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <Link
      to="/venues"
      search={{}}
      className={cn(
        chipClass,
        activeSport
          ? "border-border bg-card text-foreground hover:bg-muted"
          : "border-transparent bg-primary text-primary-foreground",
      )}
    >
      Todos
    </Link>

    {SPORT_LIST.map((sport) => {
      const active = activeSport === sport.value;
      return (
        <Link
          key={sport.value}
          to="/venues"
          search={{ sport: sport.value }}
          className={cn(
            chipClass,
            active
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-muted",
          )}
        >
          <span aria-hidden>{sport.emoji}</span>
          {sport.label}
        </Link>
      );
    })}
  </div>
);
