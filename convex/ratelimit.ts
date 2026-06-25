import type { RunMutationCtx } from "@convex-dev/rate-limiter";
import { MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError } from "convex/values";

import { components } from "./_generated/api";
import { errorMessages } from "./errors";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  /** Blanket fallback for any zAuth write that declares no granular key. */
  authWrite: { kind: "token bucket", rate: 60, period: MINUTE, capacity: 60 },
  /** staff.setActive — tight, to stop rapid bulk activate/deactivate abuse. */
  setActive: { kind: "fixed window", rate: 5, period: MINUTE },
  /** bookings.create — a customer placing reservations. */
  createBooking: {
    kind: "token bucket",
    rate: 20,
    period: MINUTE,
    capacity: 20,
  },
  /** bookings.cancel — customer or socio cancelling. */
  cancelBooking: {
    kind: "token bucket",
    rate: 15,
    period: MINUTE,
    capacity: 15,
  },
  /** bookings.setStatus — socio advancing a booking's status. */
  setBookingStatus: {
    kind: "token bucket",
    rate: 30,
    period: MINUTE,
    capacity: 30,
  },
  /** bookings.confirmPayment — payment step; tight window to block replay. */
  confirmPayment: { kind: "fixed window", rate: 10, period: MINUTE },
  /** bookings.verifyByQr — scanner at the door; high legit throughput. */
  verifyQr: { kind: "token bucket", rate: 60, period: MINUTE, capacity: 60 },
  /** venues.update — socio saving venue config. */
  updateVenue: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 20 },
  /** rentalEquipment.setForVenue — socio editing the add-on list. */
  setEquipment: {
    kind: "token bucket",
    rate: 20,
    period: MINUTE,
    capacity: 20,
  },
  /** venueUnits.setForVenue — socio editing bookable units. */
  setUnits: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 20 },
});

export type RateLimitName = keyof NonNullable<typeof rateLimiter.limits>;

export const rateLimitOrThrow = async (
  ctx: RunMutationCtx,
  name: RateLimitName,
  key: string,
) => {
  const { ok } = await rateLimiter.limit(ctx, name, { key });

  if (!ok) {
    throw new ConvexError(errorMessages.rateLimitExceeded);
  }
};
