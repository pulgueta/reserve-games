import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { type FC, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CITY_OPTIONS, stateForCity } from "@/lib/locations";
import type { Sport } from "@/lib/sports";
import { SPORT_LIST } from "@/lib/sports";
import { cn } from "@/lib/utils";
import type { VenuesSearch } from "../lib/venues-search";

const ANY = "all";

const chipClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-medium text-sm transition-colors";

interface SearchFiltersProps {
  search: VenuesSearch;
}

/** URL-driven listing filters: free-text, sport chips, and city. */
export const SearchFilters: FC<SearchFiltersProps> = ({ search }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(search.q ?? "");

  const update = (patch: Partial<VenuesSearch>) =>
    navigate({ to: "/venues", search: (prev) => ({ ...prev, ...patch }) });

  const onSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    update({ q: query.trim() || undefined });
  };

  const hasFilters = Boolean(search.sport || search.city || search.q);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={onSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca por nombre del espacio"
              aria-label="Buscar espacios"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>

        <Select
          value={search.city ?? ANY}
          onValueChange={(city) =>
            update({
              city: !city || city === ANY ? undefined : city,
              state: !city || city === ANY ? undefined : stateForCity(city),
            })
          }
        >
          <SelectTrigger className="sm:w-52">
            <SelectValue>
              {(value) =>
                !value || value === ANY ? "Todas las ciudades" : value
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todas las ciudades</SelectItem>
            {CITY_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => update({ sport: undefined })}
          className={cn(
            chipClass,
            search.sport
              ? "border-border bg-card text-foreground hover:bg-muted"
              : "border-transparent bg-primary text-primary-foreground",
          )}
        >
          Todos
        </button>
        {SPORT_LIST.map((sport) => {
          const active = search.sport === sport.value;
          return (
            <button
              key={sport.value}
              type="button"
              onClick={() =>
                update({ sport: active ? undefined : (sport.value as Sport) })
              }
              className={cn(
                chipClass,
                active
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              <span aria-hidden>{sport.emoji}</span>
              {sport.label}
            </button>
          );
        })}
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            navigate({ to: "/venues", search: {} });
          }}
          className="inline-flex w-fit items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
        >
          <XIcon className="size-4" />
          Limpiar filtros
        </button>
      )}
    </div>
  );
};
