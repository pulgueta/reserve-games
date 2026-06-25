import { crud } from "convex-helpers/server/crud";

import schema from "./schema";

export const { create, read, update, destroy, paginate } = crud(
  schema,
  "reviews",
);
