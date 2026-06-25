import type { Venue } from "@convex/schema";
import { useEffect, useRef } from "react";

import {
  clearPendingVenue,
  peekPendingVenue,
} from "@/features/account/lib/pending-venue";
import { useVenueActions } from "@/features/venues/hooks/use-venues";

/**
 * Once the freshly-created venue stub exists, apply the basic data the partner
 * entered during onboarding (carried across the org-activation remount via
 * sessionStorage), then clear it. Runs at most once per stash.
 */
export function useApplyPendingVenue(venue: Venue | null | undefined) {
  const {
    updateVenue: { mutateAsync: updateVenue },
  } = useVenueActions();
  const applied = useRef(false);

  useEffect(() => {
    if (!venue || applied.current) {
      return;
    }
    const pending = peekPendingVenue();
    if (!pending) {
      return;
    }
    applied.current = true;
    updateVenue({
      id: venue._id,
      data: {
        sport: pending.sport,
        city: pending.city,
        state: pending.state,
        contactPhone: pending.contactPhone || undefined,
        address: { fullAddress: pending.fullAddress },
      },
    })
      .then(() => clearPendingVenue())
      .catch(() => {
        applied.current = false;
      });
  }, [venue, updateVenue]);
}
