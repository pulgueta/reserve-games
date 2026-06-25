import { useOrganization } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { VenueOnboarding } from "@/features/account/components/venue-onboarding";
import { VenueManagement } from "@/features/admin/components/venue-management";

/** Partner dashboard gate. Org/role come from Clerk (auth gating, not data), so
 * these stay as guards; the venue data itself is handled inside VenueManagement. */
export const DashboardPage: FC = () => {
  const { isLoaded, organization, membership } = useOrganization();

  if (!isLoaded) {
    return <Spinner className="mx-auto my-24" />;
  }

  if (!organization) {
    return <VenueOnboarding />;
  }

  if (membership?.role !== "org:admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-muted-foreground">
        <p>Esta sección es solo para administradores del espacio.</p>
        <Button
          variant="outline"
          className="mt-4"
          nativeButton={false}
          render={<Link to="/scanner" />}
        >
          Ir al escáner
        </Button>
      </div>
    );
  }

  return <VenueManagement orgId={organization.id} />;
};
