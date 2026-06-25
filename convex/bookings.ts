import { ConvexError } from "convex/values";
import { z } from "zod";

import { zAuthMutation, zAuthQuery, zInternalMutation, zQuery } from ".";
import { authz, venueScope } from "./authz";
import {
  bookingCountAggregate,
  bookingRevenueAggregate,
  bookingTriggers,
} from "./bookingAggregates";
import { errorMessages } from "./errors";
import {
  BOOKING_STATUSES,
  bookings,
  PAYMENT_METHODS,
  rentalEquipment,
  venues,
} from "./schema";

const HOUR_MS = 60 * 60 * 1000;
/** Colombia is UTC-5 year-round (no DST); the catalog is Colombia-only, so we
 * read booking wall-clock hours against this fixed offset.
 * ponytail: store a per-venue IANA timezone if coverage ever leaves Colombia. */
const BOGOTA_OFFSET_MS = 5 * HOUR_MS;

/**
 * Book a venue for the caller. The client sends only equipment ids + qty for
 * add-ons; `userId`, the unit/venue ownership, and every price (`subtotal`,
 * `addOnsTotal`, `totalPrice`) are resolved and snapshotted server-side from
 * the venue and equipment, so a client can never set its own price.
 */
export const create = zAuthMutation({
  args: bookings.tools.insert
    .omit({
      userId: true,
      addOns: true,
      subtotal: true,
      addOnsTotal: true,
      totalPrice: true,
      status: true,
      paymentStatus: true,
    })
    .extend({
      addOns: z
        .array(
          z.object({
            equipmentId: rentalEquipment.tools.id.shape.id,
            qty: z.coerce.number().min(1).max(20).default(1),
          }),
        )
        .default([]),
    }),
  ratelimit: "createBooking",
  handler: async (ctx, args) => {
    const { addOns: addOnInputs, ...rest } = args;

    const venue = await ctx.db.get(rest.venueId);

    if (!venue) {
      throw new ConvexError(errorMessages.notFound("venue"));
    }

    if (!venue.isActive) {
      throw new ConvexError(errorMessages.venueInactive);
    }

    if (rest.date < Date.now()) {
      throw new ConvexError(errorMessages.bookingInPast);
    }

    if (rest.unitId) {
      const unit = await ctx.db.get(rest.unitId);

      if (!unit || unit.venueId !== rest.venueId) {
        throw new ConvexError(errorMessages.notFound("unit"));
      }
    }

    const startMs = rest.date;
    const endMs = startMs + rest.durationHours * HOUR_MS;

    // Within operating days/hours (Bogota wall-clock). The client greys out
    // invalid slots; this is the server-side guard against a crafted request.
    const local = new Date(startMs - BOGOTA_OFFSET_MS);
    const operatingDays = venue.operatingDays ?? [0, 1, 2, 3, 4, 5, 6];
    const startHour = local.getUTCHours();
    const openHour = Number(venue.openAt.split(":")[0]);
    const closeHour = Number(venue.closeAt.split(":")[0]);

    if (
      !operatingDays.includes(local.getUTCDay()) ||
      startHour < openHour ||
      startHour + rest.durationHours > closeHour
    ) {
      throw new ConvexError(errorMessages.bookingOutsideHours);
    }

    // No overlapping non-cancelled booking for the same unit. Pure epoch-ms
    // math (timezone-agnostic); Convex runs the read+insert in one transaction,
    // so the check can't be raced.
    const sameDayWindow = await ctx.db
      .query("bookings")
      .withIndex("by_venue_and_date", (q) =>
        q
          .eq("venueId", rest.venueId)
          .gte("date", startMs - 12 * HOUR_MS)
          .lt("date", endMs),
      )
      .collect();

    const taken = sameDayWindow.some(
      (b) =>
        b.status !== "cancelled" &&
        (b.unitId ?? null) === (rest.unitId ?? null) &&
        b.date < endMs &&
        startMs < b.date + b.durationHours * HOUR_MS,
    );

    if (taken) {
      throw new ConvexError(errorMessages.slotTaken);
    }

    // Snapshot each add-on's name/price from the equipment row (rented for the
    // whole booking duration). Unknown/foreign/inactive equipment is dropped.
    const addOns: {
      equipmentId: (typeof addOnInputs)[number]["equipmentId"];
      name: string;
      price: number;
      qty: number;
    }[] = [];
    let addOnsTotal = 0;

    for (const input of addOnInputs) {
      const equipment = await ctx.db.get(input.equipmentId);

      if (
        !equipment ||
        equipment.venueId !== rest.venueId ||
        !equipment.isActive
      ) {
        continue;
      }

      const price = equipment.pricePerHour * rest.durationHours * input.qty;
      addOns.push({
        equipmentId: equipment._id,
        name: equipment.name,
        price,
        qty: input.qty,
      });
      addOnsTotal += price;
    }

    const subtotal = venue.pricePerHour * rest.durationHours;

    // Write through the trigger-wrapped db so the booking aggregates update.
    const db = bookingTriggers.wrapDB(ctx).db;

    return await db.insert("bookings", {
      ...rest,
      userId: ctx.userId,
      addOns,
      subtotal,
      addOnsTotal,
      totalPrice: subtotal + addOnsTotal,
      status: "confirmed",
      paymentStatus: "pending",
    });
  },
});

/**
 * Public: confirmed/pending bookings for a venue within a single day, used by
 * the booking flow to mark taken slots. `dayStart` is the local-midnight epoch
 * ms; returns the lean fields the client needs for availability.
 */
export const getDayBookings = zQuery({
  args: z.object({ venueId: venues.tools.id.shape.id, dayStart: z.number() }),
  handler: async (ctx, { venueId, dayStart }) => {
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const dayBookings = await ctx.db
      .query("bookings")
      .withIndex("by_venue_and_date", (q) =>
        q.eq("venueId", venueId).gte("date", dayStart).lt("date", dayEnd),
      )
      .collect();

    return dayBookings
      .filter((b) => b.status !== "cancelled")
      .map((b) => ({
        unitId: b.unitId ?? null,
        date: b.date,
        durationHours: b.durationHours,
      }));
  },
});

/**
 * The caller's bookings for their history, newest first. Entries vanish 30 days
 * after the booking date — a query-time filter, NOT a delete: the row stays
 * intact for the owner's calendar and earnings (per spec, cleanup must not touch
 * admin records). No cron needed.
 */
export const getMine = zAuthQuery({
  args: z.object({}),
  handler: async (ctx) => {
    const cutoff = Date.now() - 30 * 24 * HOUR_MS;

    const mine = await ctx.db
      .query("bookings")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.userId))
      .order("desc")
      .collect();

    // Enrich with the venue name/sport the history list shows (small N).
    return await Promise.all(
      mine
        .filter((b) => b.date >= cutoff)
        .map(async (b) => {
          const venue = await ctx.db.get(b.venueId);
          return {
            ...b,
            venueName: venue?.name ?? "Espacio",
            venueSport: venue?.sport ?? null,
          };
        }),
    );
  },
});

/** Cancel a booking — the customer, or the venue's socio (bookings:manage). */
export const cancel = zAuthMutation({
  args: bookings.tools.id,
  ratelimit: "cancelBooking",
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError(errorMessages.notFound("booking"));
    }

    if (booking.userId !== ctx.userId) {
      const venue = await ctx.db.get(booking.venueId);

      if (!venue?.orgId) {
        throw new ConvexError(errorMessages.unauthorized);
      }

      await authz.require(
        ctx,
        ctx.userId,
        "bookings:manage",
        venueScope(venue.orgId),
      );
    }

    await bookingTriggers
      .wrapDB(ctx)
      .db.patch(args.id, { status: "cancelled" });
  },
});

/** Advance a booking's status — the venue's socio only. */
export const setStatus = zAuthMutation({
  args: z.object({
    id: bookings.tools.id.shape.id,
    status: z.enum(BOOKING_STATUSES),
  }),
  ratelimit: "setBookingStatus",
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError(errorMessages.notFound("booking"));
    }

    const venue = await ctx.db.get(booking.venueId);

    if (!venue?.orgId) {
      throw new ConvexError(errorMessages.forbidden);
    }

    await authz.require(
      ctx,
      ctx.userId,
      "bookings:manage",
      venueScope(venue.orgId),
    );

    await bookingTriggers
      .wrapDB(ctx)
      .db.patch(args.id, { status: args.status });
  },
});

/**
 * Confirms a booking's payment and mints its QR exactly once. Customer-only.
 *
 * - `online`: marked paid immediately. ponytail/MOCK — this stands in for the
 *   Mercado Pago/Wompi webhook; a real integration must flip `paid` only from a
 *   signature-verified provider callback, never this client mutation.
 * - `cash`: stays `pending` (collected at the venue, flipped to `paid` when the
 *   QR is scanned). Either way the booking gets a stable, opaque `qrToken`.
 */
export const confirmPayment = zAuthMutation({
  args: z.object({
    id: bookings.tools.id.shape.id,
    paymentMethod: z.enum(PAYMENT_METHODS),
  }),
  ratelimit: "confirmPayment",
  handler: async (ctx, { id, paymentMethod }) => {
    const booking = await ctx.db.get(id);

    if (!booking) {
      throw new ConvexError(errorMessages.notFound("booking"));
    }

    if (booking.userId !== ctx.userId) {
      throw new ConvexError(errorMessages.unauthorized);
    }

    // Mint the QR once; re-confirming is idempotent and never regenerates it.
    const qrToken = booking.qrToken ?? crypto.randomUUID();

    // Write through the trigger-wrapped db: flipping to paid updates revenue.
    const db = bookingTriggers.wrapDB(ctx).db;

    await db.patch(id, {
      paymentMethod,
      paymentStatus:
        paymentMethod === "online" ? "paid" : booking.paymentStatus,
      qrToken,
    });

    return { qrToken };
  },
});

/** The four QR verification states surfaced to the scanner. */
const QR_STATES = ["authorized", "cash", "used", "invalid"] as const;

/**
 * Resolves a scanned QR token for the venue's owner or active staff and returns
 * one of four states. Single-use: the first valid scan stamps `verifiedAt`, so a
 * replayed screenshot reads as `used`. Scanning a cash booking collects it
 * (flips `paid`). Returns NO monetary fields.
 */
export const verifyByQr = zAuthMutation({
  args: z.object({ token: z.string().min(1) }),
  ratelimit: "verifyQr",
  handler: async (ctx, { token }) => {
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_qrToken", (q) => q.eq("qrToken", token))
      .unique();

    if (!booking || booking.status === "cancelled") {
      return { state: "invalid" as (typeof QR_STATES)[number] };
    }

    const venue = await ctx.db.get(booking.venueId);

    if (!venue?.orgId) {
      throw new ConvexError(errorMessages.forbidden);
    }

    // The scanner must be the socio or active staff of this venue's org.
    await authz.require(
      ctx,
      ctx.userId,
      "bookings:verify",
      venueScope(venue.orgId),
    );

    const info = {
      customerName: booking.customerName,
      date: booking.date,
      durationHours: booking.durationHours,
      venueName: venue.name,
      sport: venue.sport,
      paymentMethod: booking.paymentMethod ?? null,
    };

    if (booking.verifiedAt) {
      return { state: "used" as (typeof QR_STATES)[number], ...info };
    }

    const isCash =
      booking.paymentMethod === "cash" && booking.paymentStatus !== "paid";
    const state: (typeof QR_STATES)[number] = isCash ? "cash" : "authorized";

    await ctx.db.patch(booking._id, {
      verifiedAt: Date.now(),
      // Scanning a cash booking is the moment it's collected at the till.
      ...(isCash ? { paymentStatus: "paid" as const } : {}),
    });

    return { state, ...info };
  },
});

/**
 * Read-only monthly calendar for the venue's owner OR its active staff. Strips
 * every monetary field (subtotal/totals/add-ons) and contact details — staff
 * may see who/when and the payment indicator, never amounts.
 */
export const getByVenueForStaff = zAuthQuery({
  args: venues.tools.id,
  handler: async (ctx, args) => {
    const venue = await ctx.db.get(args.id);

    if (!venue?.orgId) {
      throw new ConvexError(errorMessages.forbidden);
    }

    await authz.require(
      ctx,
      ctx.userId,
      "bookings:viewCalendar",
      venueScope(venue.orgId),
    );

    const venueBookings = await ctx.db
      .query("bookings")
      .withIndex("by_venueId", (q) => q.eq("venueId", args.id))
      .order("desc")
      .collect();

    return venueBookings.map((b) => ({
      _id: b._id,
      unitId: b.unitId ?? null,
      customerName: b.customerName,
      date: b.date,
      durationHours: b.durationHours,
      status: b.status,
      paymentStatus: b.paymentStatus,
      paymentMethod: b.paymentMethod ?? null,
      verifiedAt: b.verifiedAt ?? null,
    }));
  },
});

/**
 * Owner earnings for a venue over the last 7 (week) or 30 (month) days. Counts
 * only confirmed-paid bookings (online + collected cash). Aggregated in-handler
 * over the date-bounded `by_venue_and_date` index — a small, bounded range, so
 * no rollup/aggregate component is needed at this scale.
 */
export const getVenueEarnings = zAuthQuery({
  args: z.object({
    venueId: venues.tools.id.shape.id,
    period: z.enum(["week", "month"]),
    anchor: z.number().optional(),
  }),
  handler: async (ctx, { venueId, period, anchor }) => {
    const venue = await ctx.db.get(venueId);

    if (!venue?.orgId) {
      throw new ConvexError(errorMessages.forbidden);
    }

    await authz.require(
      ctx,
      ctx.userId,
      "earnings:view",
      venueScope(venue.orgId),
    );

    const dayMs = 24 * HOUR_MS;
    const days = period === "week" ? 7 : 30;
    // Bucket on Bogota-local day boundaries.
    const todayStart =
      Math.floor(((anchor ?? Date.now()) - BOGOTA_OFFSET_MS) / dayMs) * dayMs +
      BOGOTA_OFFSET_MS;
    const from = todayStart - (days - 1) * dayMs;
    const to = todayStart + dayMs;

    const rows = await ctx.db
      .query("bookings")
      .withIndex("by_venue_and_date", (q) =>
        q.eq("venueId", venueId).gte("date", from).lt("date", to),
      )
      .collect();

    const series = Array.from({ length: days }, (_, i) => ({
      day: from + i * dayMs,
      income: 0,
    }));

    let totalIncome = 0;
    let bookingCount = 0;

    for (const b of rows) {
      if (b.paymentStatus !== "paid" || b.status === "cancelled") continue;
      const idx = Math.floor((b.date - from) / dayMs);
      if (idx >= 0 && idx < days) series[idx].income += b.totalPrice;
      totalIncome += b.totalPrice;
      bookingCount += 1;
    }

    return {
      totalIncome,
      bookingCount,
      avgPerDay: Math.round(totalIncome / days),
      series,
      from,
      to,
    };
  },
});

/**
 * Headline dashboard stats for a venue, read in O(log n) from the booking
 * aggregates: paid revenue + effective (non-cancelled) bookings for the period
 * and all-time, plus upcoming reservations. Socio-only (earnings scope).
 */
export const getVenueStats = zAuthQuery({
  args: z.object({
    venueId: venues.tools.id.shape.id,
    period: z.enum(["week", "month"]).default("month"),
  }),
  handler: async (ctx, { venueId, period }) => {
    const venue = await ctx.db.get(venueId);

    if (!venue?.orgId) {
      throw new ConvexError(errorMessages.forbidden);
    }

    await authz.require(
      ctx,
      ctx.userId,
      "earnings:view",
      venueScope(venue.orgId),
    );

    const now = Date.now();
    const days = period === "week" ? 7 : 30;
    const from = now - days * 24 * HOUR_MS;
    const rangeBounds = {
      lower: { key: from, inclusive: true },
      upper: { key: now, inclusive: false },
    } as const;

    const [
      rangeRevenue,
      rangeBookings,
      upcoming,
      allTimeRevenue,
      allTimeBookings,
    ] = await Promise.all([
      bookingRevenueAggregate.sum(ctx, {
        namespace: venueId,
        bounds: rangeBounds,
      }),
      bookingCountAggregate.sum(ctx, {
        namespace: venueId,
        bounds: rangeBounds,
      }),
      bookingCountAggregate.sum(ctx, {
        namespace: venueId,
        bounds: { lower: { key: now, inclusive: true } },
      }),
      bookingRevenueAggregate.sum(ctx, { namespace: venueId }),
      bookingCountAggregate.sum(ctx, { namespace: venueId }),
    ]);

    return {
      period,
      rangeRevenue,
      rangeBookings,
      avgPerDay: Math.round(rangeRevenue / days),
      upcoming,
      allTimeRevenue,
      allTimeBookings,
    };
  },
});

/**
 * One-shot backfill of the booking aggregates from existing rows. Idempotent
 * (`insertIfDoesNotExist`), so safe to re-run from the Convex dashboard.
 * ponytail: single-shot collect — paginate if the bookings table ever grows
 * past a few thousand rows.
 */
export const backfillBookingAggregates = zInternalMutation({
  args: z.object({}),
  handler: async (ctx) => {
    const all = await ctx.db.query("bookings").collect();

    for (const doc of all) {
      await bookingRevenueAggregate.insertIfDoesNotExist(ctx, doc);
      await bookingCountAggregate.insertIfDoesNotExist(ctx, doc);
    }

    return { backfilled: all.length };
  },
});
