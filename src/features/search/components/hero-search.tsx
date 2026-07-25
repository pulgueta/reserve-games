import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { type FC, useId, useState } from "react";

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
import { SPORT_OPTIONS, sportLabel } from "@/lib/sports";

const ANY = "all";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface FieldShellProps {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}

const FieldShell: FC<FieldShellProps> = ({ label, htmlFor, children }) => (
  <div className="flex flex-col gap-1.5">
    <label
      htmlFor={htmlFor}
      className="font-medium text-muted-foreground text-xs"
    >
      {label}
    </label>
    {children}
  </div>
);

/**
 * Home hero search: Actividad · Ubicación · Fecha · Hora → navigates to the
 * listing with the chosen facets. Date/time are forwarded so the listing and
 * booking flow can pre-fill the desired slot.
 */
export const HeroSearch: FC = () => {
  const navigate = useNavigate();
  const dateId = useId();
  const timeId = useId();
  const [sport, setSport] = useState<string>(ANY);
  const [city, setCity] = useState<string>(ANY);
  const [date, setDate] = useState<string>(todayISO());
  const [time, setTime] = useState<string>("19:00");

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate({
      to: "/venues",
      search: {
        sport: sport === ANY ? undefined : (sport as Sport),
        city: city === ANY ? undefined : city,
        state: city === ANY ? undefined : stateForCity(city),
        date: date || undefined,
        time: time || undefined,
      },
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border/60 bg-card/95 p-3 shadow-xl ring-1 ring-black/5 backdrop-blur supports-backdrop-filter:bg-card/80 sm:p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FieldShell label="Actividad">
          <Select value={sport} onValueChange={(v) => setSport(v ?? ANY)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value) =>
                  !value || value === ANY
                    ? "Todos los deportes"
                    : sportLabel(value)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Todos los deportes</SelectItem>
              {SPORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>

        <FieldShell label="Ubicación">
          <Select value={city} onValueChange={(v) => setCity(v ?? ANY)}>
            <SelectTrigger className="w-full">
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
        </FieldShell>

        <FieldShell label="Fecha" htmlFor={dateId}>
          <Input
            id={dateId}
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
          />
        </FieldShell>

        <FieldShell label="Hora" htmlFor={timeId}>
          <Input
            id={timeId}
            type="time"
            value={time}
            step={1800}
            onChange={(e) => setTime(e.target.value)}
          />
        </FieldShell>
      </div>

      <Button type="submit" size="lg" className="mt-3 w-full gap-2">
        <MagnifyingGlassIcon data-icon="inline-start" />
        Buscar disponibilidad
      </Button>
    </form>
  );
};
