import { useOrganization } from "@clerk/tanstack-react-start";
import { PlusIcon, TrashIcon, UsersIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useWebHaptics } from "web-haptics/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import {
  useStaffActions,
  useStaffActive,
} from "@/features/staff/hooks/use-staff";
import { getConvexErrorMessage } from "@/lib/convex-errors";

function initialFor(label: string): string {
  return label.trim().charAt(0).toUpperCase() || "?";
}

/**
 * Staff = the venue's Clerk organization members. The member list, invitations,
 * invite and removal all run through Clerk org hooks; the active/inactive toggle
 * is the one piece Convex owns (the scoped `staff` role).
 */
export const StaffManager = () => {
  const haptic = useWebHaptics();
  const { organization, memberships, invitations } = useOrganization({
    memberships: { infinite: true },
    invitations: { infinite: true },
  });
  const { setActive } = useStaffActions();

  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  const orgId = organization?.id ?? null;
  const members = memberships?.data ?? [];
  const staffMembers = members.filter((m) => m.role === "org:member");
  const staffIds = staffMembers
    .map((m) => m.publicUserData?.userId)
    .filter((id): id is string => Boolean(id));

  const { data: activeRows } = useStaffActive(orgId, staffIds);
  const activeById = new Map(
    (activeRows ?? []).map((r) => [r.userId, r.active]),
  );

  const invites = (invitations?.data ?? []).filter(
    (i) => i.status === "pending",
  );
  const isEmpty = members.length === 0 && invites.length === 0;

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed || pending || !organization) {
      haptic.trigger("error");
      return;
    }

    setPending(true);
    try {
      await organization.inviteMember({
        emailAddress: trimmed,
        role: "org:member",
      });
      await invitations?.revalidate?.();
      haptic.trigger("success");
      toast.success("Invitación enviada.");
      setEmail("");
    } catch (error) {
      haptic.trigger("error");
      toast.error(
        error instanceof Error ? error.message : "No se pudo invitar.",
      );
    } finally {
      setPending(false);
    }
  };

  const onToggleActive = async (userId: string, isActive: boolean) => {
    if (!orgId) return;
    try {
      await setActive.mutateAsync({ orgId, userId, isActive });
      haptic.trigger("success");
      toast.success(isActive ? "Staff activado." : "Staff desactivado.");
    } catch (error) {
      haptic.trigger("error");
      toast.error(getConvexErrorMessage(error));
    }
  };

  const onRemove = async (membership: (typeof members)[number]) => {
    try {
      await membership.destroy();
      await memberships?.revalidate?.();
      haptic.trigger("success");
      toast.success("Miembro eliminado.");
    } catch {
      haptic.trigger("error");
      toast.error("No se pudo eliminar.");
    }
  };

  const onCancelInvite = async (invite: (typeof invites)[number]) => {
    try {
      await invite.revoke();
      await invitations?.revalidate?.();
      haptic.trigger("success");
      toast.success("Invitación cancelada.");
    } catch {
      haptic.trigger("error");
      toast.error("No se pudo cancelar.");
    }
  };

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <header className="flex flex-col gap-1">
        <h2 className="font-semibold text-foreground tracking-tight">Equipo</h2>
        <p className="text-muted-foreground text-sm">
          Invita staff para escanear códigos y ver el calendario.
        </p>
      </header>

      <form
        onSubmit={handleInvite}
        className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <Input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="correo@ejemplo.com"
          aria-label="Correo del miembro"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={pending}
          required
          className="sm:flex-1"
        />
        <Button type="submit" disabled={pending} className="shrink-0">
          <PlusIcon />
          Invitar miembro
        </Button>
      </form>

      {!memberships?.data && <Spinner className="mx-auto my-8" />}

      {memberships?.data && isEmpty ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-border border-dashed py-10 text-center">
          <UsersIcon className="size-6 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            Aún no hay miembros ni invitaciones.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {members.map((member) => {
            const data = member.publicUserData;
            const label =
              [data?.firstName, data?.lastName].filter(Boolean).join(" ") ||
              data?.identifier ||
              "Miembro";
            const isAdmin = member.role === "org:admin";
            const userId = data?.userId;
            const active = userId ? (activeById.get(userId) ?? true) : true;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm"
                  >
                    {initialFor(label)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground text-sm">
                      {label}
                    </p>
                    {data?.identifier && (
                      <p className="truncate text-muted-foreground text-sm">
                        {data.identifier}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {isAdmin ? (
                    <Badge>Administrador</Badge>
                  ) : (
                    <>
                      <Badge variant={active ? "default" : "secondary"}>
                        {active ? "Activo" : "Inactivo"}
                      </Badge>
                      <Switch
                        checked={active}
                        onCheckedChange={(checked) =>
                          userId && onToggleActive(userId, checked)
                        }
                        aria-label={
                          active
                            ? `Desactivar a ${label}`
                            : `Activar a ${label}`
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onRemove(member)}
                        aria-label={`Eliminar a ${label}`}
                      >
                        <TrashIcon />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {invites.length > 0 && (
            <>
              <Separator className="my-2" />
              <p className="text-muted-foreground text-sm">
                Invitaciones pendientes
              </p>
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground text-sm"
                    >
                      {initialFor(invite.emailAddress)}
                    </span>
                    <p className="truncate font-medium text-foreground text-sm">
                      {invite.emailAddress}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary">Pendiente</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancelInvite(invite)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
};
