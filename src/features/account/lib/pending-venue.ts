import type { Sport } from "@/lib/sports";

const KEY = "rg:pending-venue";

export interface PendingVenue {
  contactPhone: string;
  sport: Sport;
  city: string;
  state: string;
  fullAddress: string;
}

/**
 * The org → venue bridge. `becomePartner` creates the Clerk org, whose webhook
 * mirrors an inactive venue stub — but activating the org remounts the
 * dashboard, unmounting the onboarding form. So we stash the basic data the
 * partner entered in sessionStorage and apply it to the stub once it appears
 * (see {@link useApplyPendingVenue}).
 */
export function savePendingVenue(data: PendingVenue) {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  }
}

export function peekPendingVenue(): PendingVenue | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  const raw = sessionStorage.getItem(KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as PendingVenue;
  } catch {
    return null;
  }
}

export function clearPendingVenue() {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(KEY);
  }
}
