import type { Id } from "@convex/_generated/dataModel";
import type { RentalEquipment, Sport, Venue, VenueUnit } from "@convex/schema";
import {
  CheckCircleIcon,
  ClockIcon,
  CrosshairIcon,
  PlusIcon,
  TrashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { revalidateLogic, useStore } from "@tanstack/react-form";
import { useDebouncedValue } from "@tanstack/react-pacer";
import type { FC, ReactNode } from "react";
import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { useWebHaptics } from "web-haptics/react";

import { useAppForm } from "@/components/form/use-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import type { MapViewport } from "@/components/ui/map";
import { toast } from "@/components/ui/toast";
import { ChipGroup } from "@/features/venues/components/chip-group";
import {
  VenuePreviewCard,
  type VenuePreviewValues,
} from "@/features/venues/components/venue-preview-card";
import { useVenueActions } from "@/features/venues/hooks/use-venues";
import {
  TIME_UNIT_OPTIONS,
  venueFormSchema,
  WEEKDAYS,
} from "@/features/venues/lib/schemas";
import { useGeolocation } from "@/hooks/use-geolocation";
import { getConvexErrorMessage } from "@/lib/convex-errors";
import { CITY_OPTIONS, stateForCity } from "@/lib/locations";
import {
  CAPABILITY_META,
  type CapabilityFlags,
  SPORT_DEFAULTS,
} from "@/lib/sport-defaults";
import { sportEmoji, sportLabel } from "@/lib/sports";
import { cn } from "@/lib/utils";

// Heavy maplibre-gl map — lazy so it stays out of the editor's initial bundle.
const VenueLocationPicker = lazy(() =>
  import("@/features/venues/components/venue-location-picker").then((m) => ({
    default: m.VenueLocationPicker,
  })),
);

// Bogotá [lng, lat] — a sensible default center for the location picker.
const DEFAULT_CENTER: [number, number] = [-74.0836, 4.6533];

type EquipmentRow = {
  key: string;
  id?: Id<"rentalEquipment">;
  name: string;
  pricePerHour: string;
};
type UnitRow = { key: string; id?: Id<"venueUnits">; label: string };

interface VenueEditorProps {
  venue: Venue;
  units: VenueUnit[];
  equipment: RentalEquipment[];
}

/**
 * The venue configuration editor: a two-column section with the editable form
 * on the left and a debounced live preview (Pacer) of the public listing on the
 * right. Sport is fixed at creation, "active" is derived from completeness on
 * the server, and per-sport defaults seed the chip sets and equipment list.
 */
export const VenueEditor: FC<VenueEditorProps> = ({
  venue,
  units,
  equipment,
}) => {
  const haptic = useWebHaptics();
  const geo = useGeolocation();
  const { updateVenue, setEquipment, setUnits } = useVenueActions();

  const sport = venue.sport as Sport;
  const defaults = SPORT_DEFAULTS[sport];
  const keyCounter = useRef(0);
  const nextKey = () => `row-${keyCounter.current++}`;

  const [caps, setCaps] = useState<CapabilityFlags>(() => ({
    ...defaults.capabilities,
    ...(venue.capabilities ?? {}),
  }));
  const [cfg, setCfg] = useState(() => ({
    format: venue.sportConfig?.format ?? "",
    surface: venue.sportConfig?.surface ?? "",
    unitType: venue.sportConfig?.unitType ?? "",
    escenario: venue.sportConfig?.escenario ?? "",
    dimensions: venue.sportConfig?.dimensions ?? "",
    capacity: venue.sportConfig?.capacity ?? "",
  }));
  const [equip, setEquip] = useState<EquipmentRow[]>(() =>
    equipment.length > 0
      ? equipment.map((item) => ({
          key: item._id,
          id: item._id,
          name: item.name,
          pricePerHour: String(item.pricePerHour),
        }))
      : defaults.equipment.map((item, index) => ({
          key: `seed-${index}`,
          name: item.name,
          pricePerHour: String(item.priceCOP),
        })),
  );
  const [unitRows, setUnitRows] = useState<UnitRow[]>(() =>
    units.length > 0
      ? units.map((unit) => ({
          key: unit._id,
          id: unit._id,
          label: unit.label,
        }))
      : [1, 2].map((n) => ({
          key: `seed-${n}`,
          label: `${capitalize(defaults.unitNoun)} ${n}`,
        })),
  );
  const [days, setDays] = useState<Set<number>>(
    new Set(venue.operatingDays ?? [1, 2, 3, 4, 5, 6, 0]),
  );
  const [viewport, setViewport] = useState<Partial<MapViewport>>(() =>
    venue.lat != null && venue.lng != null
      ? { center: [venue.lng, venue.lat], zoom: 15 }
      : { center: DEFAULT_CENTER, zoom: 11 },
  );
  const [hasLocation, setHasLocation] = useState(
    venue.lat != null && venue.lng != null,
  );

  const toggleDay = (value: number) =>
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });

  const useMyLocation = async () => {
    const coords = await geo.request();
    if (coords) {
      setViewport({ center: [coords.lng, coords.lat], zoom: 16 });
      setHasLocation(true);
    } else {
      toast.error("No pudimos obtener tu ubicación.");
    }
  };

  const handleViewportChange = (next: MapViewport) => {
    setViewport(next);
    setHasLocation(true);
  };

  const form = useAppForm({
    onSubmitInvalid: () => haptic.trigger("error"),
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: { onSubmit: venueFormSchema },
    defaultValues: {
      name: venue.name,
      description: venue.description ?? "",
      sport,
      pricePerHour: venue.pricePerHour > 1 ? String(venue.pricePerHour) : "",
      timeUnit: venue.timeUnit ?? "hours",
      maxCapacity: venue.maxCapacity ? String(venue.maxCapacity) : "",
      contactPhone: venue.contactPhone ?? "",
      city: venue.city === "Por definir" ? "" : venue.city,
      fullAddress:
        venue.address.fullAddress === "Por definir"
          ? ""
          : venue.address.fullAddress,
      details: venue.address.details ?? "",
      openAt: venue.openAt ?? "08:00",
      closeAt: venue.closeAt ?? "22:00",
    },
    onSubmit: async ({ value }) => {
      if (days.size === 0) {
        haptic.trigger("error");
        toast.error("Elige al menos un día de operación.");
        return;
      }

      try {
        await updateVenue.mutateAsync({
          id: venue._id,
          data: {
            name: value.name,
            description: value.description.trim() || undefined,
            pricePerHour: Number(value.pricePerHour),
            timeUnit: value.timeUnit,
            chargeByTime: defaults.chargeByTime,
            maxCapacity: value.maxCapacity
              ? Number(value.maxCapacity)
              : undefined,
            contactPhone: value.contactPhone.trim() || undefined,
            address: {
              fullAddress: value.fullAddress,
              details: value.details.trim() || undefined,
            },
            city: value.city,
            state: stateForCity(value.city) ?? "",
            openAt: value.openAt,
            closeAt: value.closeAt,
            operatingDays: [...days],
            lat: hasLocation ? viewport.center?.[1] : undefined,
            lng: hasLocation ? viewport.center?.[0] : undefined,
            capabilities: caps,
            sportConfig: {
              format: cfg.format || undefined,
              surface: cfg.surface || undefined,
              unitType: cfg.unitType || undefined,
              escenario: cfg.escenario || undefined,
              dimensions: cfg.dimensions || undefined,
              capacity: cfg.capacity || undefined,
            },
          },
        });

        await Promise.all([
          setEquipment.mutateAsync({
            venueId: venue._id,
            items: caps.equipmentRental
              ? equip
                  .filter((row) => row.name.trim())
                  .map((row) => ({
                    id: row.id,
                    name: row.name.trim(),
                    pricePerHour: Number(row.pricePerHour) || 0,
                  }))
              : [],
          }),
          setUnits.mutateAsync({
            venueId: venue._id,
            units: caps.multipleUnits
              ? unitRows
                  .filter((row) => row.label.trim())
                  .map((row) => ({ id: row.id, label: row.label.trim() }))
              : [],
          }),
        ]);

        haptic.trigger("success");
        toast.success("Espacio actualizado.");
      } catch (error) {
        haptic.trigger("error");
        toast.error(getConvexErrorMessage(error));
      }
    },
  });

  // Live form values, debounced 300 ms into the preview (Pacer). The memo keeps
  // a stable reference unless an actual value changes, so the debounce timer
  // only resets on real edits.
  const liveValues = useStore(form.store, (state) => state.values);
  const previewSource = useMemo<VenuePreviewValues>(
    () => ({
      name: liveValues.name,
      sport,
      description: liveValues.description,
      pricePerHour: liveValues.pricePerHour,
      city: liveValues.city,
      fullAddress: liveValues.fullAddress,
      sportConfig: cfg,
      capabilities: caps,
      equipment: caps.equipmentRental ? equip : [],
    }),
    [liveValues, sport, cfg, caps, equip],
  );
  const [preview, debouncer] = useDebouncedValue(
    previewSource,
    { wait: 300 },
    (state) => ({ isPending: state.isPending }),
  );

  // Completeness mirrors the server's `isVenueComplete`; it drives the "ready to
  // publish" banner so the owner sees exactly what's left (no manual checkbox).
  const missing = useMemo(() => {
    const out: string[] = [];
    if ((liveValues.name?.trim().length ?? 0) < 3)
      out.push("Nombre del espacio");
    if ((Number(liveValues.pricePerHour) || 0) <= 0)
      out.push("Precio por hora");
    if (!liveValues.city) out.push("Ciudad");
    if (!liveValues.fullAddress?.trim()) out.push("Dirección");
    if (!hasLocation) out.push("Ubicación en el mapa");
    return out;
  }, [liveValues, hasLocation]);
  const ready = missing.length === 0;

  const isSaving =
    updateVenue.isPending || setEquipment.isPending || setUnits.isPending;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-6"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <div className="flex flex-col gap-6">
          {/* Identidad */}
          <Section title="Identidad">
            <form.AppField name="name">
              {(field) => (
                <field.TextField
                  label="Nombre del espacio"
                  placeholder="Cancha Sintética La 10"
                />
              )}
            </form.AppField>

            <div className="flex flex-col gap-1.5">
              <span className="font-medium text-sm">Deporte</span>
              <div className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2.5">
                <span className="text-lg">{sportEmoji(sport)}</span>
                <span className="font-medium">{sportLabel(sport)}</span>
                <span className="ml-auto text-muted-foreground text-xs">
                  No editable
                </span>
              </div>
            </div>

            <form.AppField name="description">
              {(field) => (
                <field.TextAreaField
                  label="Descripción (opcional)"
                  rows={3}
                  placeholder="Cuéntales a los jugadores sobre tu espacio"
                />
              )}
            </form.AppField>
          </Section>

          {/* Precios y reserva */}
          <Section title="Precios y reserva">
            <div className="grid gap-4 sm:grid-cols-2">
              <form.AppField name="pricePerHour">
                {(field) => {
                  const invalid =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={invalid}>
                      <FieldLabel htmlFor="pricePerHour">
                        Precio por hora
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupAddon align="inline-start">
                          <InputGroupText>COP</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          id="pricePerHour"
                          inputMode="numeric"
                          placeholder="90000"
                          value={field.state.value}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          onBlur={field.handleBlur}
                          aria-invalid={invalid}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>/ hora</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                      {invalid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : null}
                    </Field>
                  );
                }}
              </form.AppField>

              <form.AppField name="timeUnit">
                {(field) => (
                  <field.SelectField
                    label="Unidad de reserva"
                    options={TIME_UNIT_OPTIONS}
                  />
                )}
              </form.AppField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <form.AppField name="maxCapacity">
                {(field) => (
                  <field.TextField
                    label="Capacidad máxima (opcional)"
                    type="number"
                    inputMode="numeric"
                    placeholder="10"
                  />
                )}
              </form.AppField>
              <form.AppField name="contactPhone">
                {(field) => <field.PhoneField label="Teléfono de contacto" />}
              </form.AppField>
            </div>
          </Section>

          {/* Configuración deportiva */}
          <Section
            title="Configuración deportiva"
            description={`Lo que distingue a tu ${defaults.unitNoun}. Elige o escribe tus propios valores.`}
          >
            <ChipGroup
              label={defaults.formatEditorLabel}
              options={defaults.formats}
              value={cfg.format || null}
              onChange={(format) => setCfg((p) => ({ ...p, format }))}
              clearable
            />
            {defaults.surfaces ? (
              <ChipGroup
                label={defaults.surfaceEditorLabel ?? "Superficie"}
                options={defaults.surfaces}
                value={cfg.surface || null}
                onChange={(surface) => setCfg((p) => ({ ...p, surface }))}
                clearable
              />
            ) : null}
            {defaults.unitTypes ? (
              <ChipGroup
                label={defaults.unitTypeEditorLabel ?? "Tipo"}
                options={defaults.unitTypes}
                value={cfg.unitType || null}
                onChange={(unitType) => setCfg((p) => ({ ...p, unitType }))}
                clearable
              />
            ) : null}
            <ChipGroup
              label={defaults.escenarioEditorLabel}
              options={defaults.escenarios}
              value={cfg.escenario || null}
              onChange={(escenario) => setCfg((p) => ({ ...p, escenario }))}
              clearable
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="dimensions">
                  Dimensiones (opcional)
                </FieldLabel>
                <Input
                  id="dimensions"
                  value={cfg.dimensions}
                  onChange={(event) =>
                    setCfg((p) => ({ ...p, dimensions: event.target.value }))
                  }
                  placeholder={defaults.dimensionsExample ?? "40 × 20 m"}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="capacity">Aforo (opcional)</FieldLabel>
                <Input
                  id="capacity"
                  value={cfg.capacity}
                  onChange={(event) =>
                    setCfg((p) => ({ ...p, capacity: event.target.value }))
                  }
                  placeholder="10 jugadores"
                />
              </div>
            </div>
          </Section>

          {/* ¿Qué ofreces? */}
          <Section
            title="¿Qué ofreces en este espacio?"
            description="Cada servicio activo aparece en la ficha pública y, si aplica, como complemento al reservar."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {CAPABILITY_META.map((cap) => {
                const on = caps[cap.key];
                return (
                  <button
                    key={cap.key}
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={cap.label}
                    onClick={() =>
                      setCaps((prev) => ({
                        ...prev,
                        [cap.key]: !prev[cap.key],
                      }))
                    }
                    className="flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium text-sm">
                        {cap.label}
                      </span>
                      <span className="block text-muted-foreground text-xs">
                        {cap.description}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "relative h-6 w-10 shrink-0 rounded-full transition-colors",
                        on ? "bg-primary" : "bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 size-5 rounded-full bg-background shadow-sm transition-all",
                          on ? "left-[1.125rem]" : "left-0.5",
                        )}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Equipo en alquiler */}
          {caps.equipmentRental ? (
            <Section title="Equipo en alquiler">
              <div className="flex flex-col gap-2">
                {equip.map((row, index) => (
                  <div key={row.key} className="flex items-center gap-2">
                    <Input
                      value={row.name}
                      placeholder="Balón profesional"
                      onChange={(event) =>
                        setEquip((prev) =>
                          prev.map((item, i) =>
                            i === index
                              ? { ...item, name: event.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                    <InputGroup className="w-44 shrink-0">
                      <InputGroupAddon align="inline-start">
                        <InputGroupText>+COP</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        inputMode="numeric"
                        placeholder="5000"
                        value={row.pricePerHour}
                        onChange={(event) =>
                          setEquip((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? { ...item, pricePerHour: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </InputGroup>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Eliminar equipo"
                      onClick={() =>
                        setEquip((prev) => prev.filter((_, i) => i !== index))
                      }
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() =>
                  setEquip((prev) => [
                    ...prev,
                    { key: nextKey(), name: "", pricePerHour: "" },
                  ])
                }
              >
                <PlusIcon /> Agregar equipo
              </Button>
            </Section>
          ) : null}

          {/* Unidades */}
          {caps.multipleUnits ? (
            <Section
              title={`Tus ${defaults.unitNounPlural}`}
              description="Los clientes eligen una al reservar."
            >
              <div className="flex flex-col gap-2">
                {unitRows.map((row, index) => (
                  <div key={row.key} className="flex items-center gap-2">
                    <Input
                      value={row.label}
                      placeholder={`${capitalize(defaults.unitNoun)} ${index + 1}`}
                      onChange={(event) =>
                        setUnitRows((prev) =>
                          prev.map((item, i) =>
                            i === index
                              ? { ...item, label: event.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Eliminar unidad"
                      onClick={() =>
                        setUnitRows((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() =>
                  setUnitRows((prev) => [
                    ...prev,
                    {
                      key: nextKey(),
                      label: `${capitalize(defaults.unitNoun)} ${prev.length + 1}`,
                    },
                  ])
                }
              >
                <PlusIcon /> Agregar {defaults.unitNoun}
              </Button>
            </Section>
          ) : null}

          {/* Ubicación */}
          <Section title="Ubicación">
            <div className="grid gap-4 sm:grid-cols-2">
              <form.AppField name="city">
                {(field) => (
                  <field.SelectField
                    label="Ciudad"
                    placeholder="Elige una ciudad"
                    options={CITY_OPTIONS}
                  />
                )}
              </form.AppField>
              <form.AppField name="fullAddress">
                {(field) => (
                  <field.TextField
                    label="Dirección"
                    placeholder="Calle 10 #20-30"
                  />
                )}
              </form.AppField>
            </div>
            <form.AppField name="details">
              {(field) => (
                <field.TextField label="Detalles de la dirección (opcional)" />
              )}
            </form.AppField>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  Ubicación en el mapa
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={useMyLocation}
                  disabled={geo.status === "prompting"}
                >
                  <CrosshairIcon className="size-4" />
                  Usar mi ubicación
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Mueve el mapa para centrar el pin sobre la entrada del espacio.
              </p>
              <Suspense
                fallback={
                  <div className="h-56 w-full animate-pulse rounded-xl bg-muted" />
                }
              >
                <VenueLocationPicker
                  viewport={viewport}
                  onViewportChange={handleViewportChange}
                />
              </Suspense>
            </div>
          </Section>

          {/* Disponibilidad */}
          <Section title="Disponibilidad">
            <div className="grid gap-4 sm:grid-cols-2">
              <form.AppField name="openAt">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel htmlFor="openAt">Hora de apertura</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="openAt"
                        type="time"
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        onBlur={field.handleBlur}
                      />
                      <InputGroupAddon align="inline-end">
                        <ClockIcon />
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                )}
              </form.AppField>
              <form.AppField name="closeAt">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel htmlFor="closeAt">Hora de cierre</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="closeAt"
                        type="time"
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        onBlur={field.handleBlur}
                      />
                      <InputGroupAddon align="inline-end">
                        <ClockIcon />
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                )}
              </form.AppField>
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 font-medium text-sm">
                Días de operación
              </legend>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const active = days.has(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full border px-3 py-1.5 font-medium text-sm transition-colors",
                        active
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-muted",
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </Section>
        </div>

        {/* Preview + status (sticky on desktop) */}
        <aside className="flex h-fit flex-col gap-3 lg:sticky lg:top-4">
          <span className="font-medium text-muted-foreground text-sm">
            Vista previa
          </span>
          <VenuePreviewCard
            values={preview}
            isStale={debouncer.state.isPending}
          />
          <CompletenessBanner ready={ready} missing={missing} />
        </aside>
      </div>

      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t bg-background/90 py-3 backdrop-blur supports-backdrop-filter:bg-background/70">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
};

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

const Section: FC<SectionProps> = ({ title, description, children }) => (
  <section className="flex flex-col gap-4 rounded-xl border bg-card p-5">
    <div className="flex flex-col gap-1">
      <h2 className="font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
    </div>
    {children}
  </section>
);

const CompletenessBanner: FC<{ ready: boolean; missing: string[] }> = ({
  ready,
  missing,
}) =>
  ready ? (
    <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
      <CheckCircleIcon
        weight="fill"
        className="mt-0.5 size-4 shrink-0 text-primary"
      />
      <span>Tu espacio se publicará al guardar.</span>
    </div>
  ) : (
    <div className="flex flex-col gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
      <span className="flex items-center gap-2 font-medium">
        <WarningCircleIcon weight="fill" className="size-4 text-amber-500" />
        Para publicarlo, completa:
      </span>
      <ul className="ml-6 list-disc text-muted-foreground">
        {missing.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
