import { useOrganizationList } from "@clerk/tanstack-react-start";
import { useState } from "react";

/**
 * Become a venue partner: creates a Clerk organization (one org = one venue)
 * and makes it the active org. The `organization.created` webhook mirrors it
 * into an inactive venue stub the partner then completes in the dashboard.
 */
export function useBecomePartner() {
  const { isLoaded, createOrganization, setActive } = useOrganizationList();
  const [isPending, setIsPending] = useState(false);

  const becomePartner = async (name: string) => {
    if (!isLoaded || !createOrganization || !setActive) {
      throw new Error("La sesión aún no está lista. Intenta de nuevo.");
    }

    setIsPending(true);
    try {
      const org = await createOrganization({ name });
      await setActive({ organization: org.id });
      return org.id;
    } finally {
      setIsPending(false);
    }
  };

  return { becomePartner, isPending, isLoaded };
}
