import aggregate from "@convex-dev/aggregate/convex.config";
import geospatial from "@convex-dev/geospatial/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import authz from "@djpanda/convex-authz/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();

app.use(authz);
app.use(rateLimiter);
app.use(geospatial);
// Two named aggregate instances over the bookings table: paid revenue and
// effective (non-cancelled) count, both namespaced by venueId. See
// convex/bookingAggregates.ts.
app.use(aggregate, { name: "aggregateBookingRevenue" });
app.use(aggregate, { name: "aggregateBookingCount" });

export default app;
