import { ArrowLeftIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";

import { Button } from "@/components/ui/button";
import { StaffManager } from "@/features/admin/components/staff-manager";

/** Team management page (org admins only — gated in the route's beforeLoad). */
export const TeamPage: FC = () => (
  <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
    <div>
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link to="/dashboard" />}
      >
        <ArrowLeftIcon className="size-4" />
        Volver al panel
      </Button>
      <h1 className="mt-2 font-semibold text-2xl tracking-tight">Equipo</h1>
    </div>

    <StaffManager />
  </div>
);
