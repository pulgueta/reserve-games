import { api } from "@convex/_generated/api";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";

/**
 * Staff for a venue are its Clerk organization members (listed/invited/removed
 * with Clerk org hooks). Convex only owns the active/inactive toggle, modelled
 * as the scoped `staff` role.
 */

/** Active/inactive state for the given org member ids. `skip` until there's an
 * org and at least one member to ask about. */
export function staffActiveQueryOptions(
  orgId: string | null | undefined,
  userIds: string[],
) {
  return convexQuery(
    api.staff.activeMap,
    orgId && userIds.length > 0 ? { orgId, userIds } : "skip",
  );
}

export function useStaffActive(
  orgId: string | null | undefined,
  userIds: string[],
) {
  return useQuery(staffActiveQueryOptions(orgId, userIds));
}

export function useStaffActions() {
  const setActive = useMutation({
    mutationFn: useConvexMutation(api.staff.setActive),
  });

  return { setActive };
}
