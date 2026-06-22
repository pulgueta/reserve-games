import { customCtx, NoOp } from "convex-helpers/server/customFunctions";
import {
  zCustomAction,
  zCustomMutation,
  zCustomQuery,
  zid,
  zodToConvex,
} from "convex-helpers/server/zod4";
import { defineTable } from "convex/server";
import type { GenericId } from "convex/values";
import { z } from "zod";

import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { requireUserId } from "./identity";

/**
 * Custom function builders. Every Convex function in this project is declared
 * with one of these instead of the raw `query`/`mutation`/`action` so that:
 *  - arguments and return values are validated with Zod (via `convex-helpers`),
 *  - the `zAuth*` variants resolve the Clerk user id once and inject it into
 *    `ctx.userId`, so handlers never re-implement the auth check.
 */
export const zQuery = zCustomQuery(query, NoOp);
export const zInternalQuery = zCustomQuery(internalQuery, NoOp);
export const zMutation = zCustomMutation(mutation, NoOp);
export const zInternalMutation = zCustomMutation(internalMutation, NoOp);
export const zAction = zCustomAction(action, NoOp);
export const zInternalAction = zCustomAction(internalAction, NoOp);

export const zAuthQuery = zCustomQuery(
  query,
  customCtx(async (ctx: QueryCtx) => ({ userId: await requireUserId(ctx) })),
);
export const zAuthMutation = zCustomMutation(
  mutation,
  customCtx(async (ctx: MutationCtx) => ({ userId: await requireUserId(ctx) })),
);
export const zAuthAction = zCustomAction(
  action,
  customCtx(async (ctx: ActionCtx) => ({ userId: await requireUserId(ctx) })),
);

function jsonSafeZid<TableName extends string>(
  tableName: TableName,
): z.ZodType<GenericId<TableName>> {
  return z.string().describe(`Convex Id<${tableName}>`) as unknown as z.ZodType<
    GenericId<TableName>
  >;
}

/**
 * Defines a table from a single Zod schema and derives every shape we need:
 *  - `.table()` for the schema definition,
 *  - `.schema` / `.insertSchema` / `.updateSchema` for typing,
 *  - `.tools.id` / `.tools.insert` / `.tools.update` as ready-made, wire-safe
 *    validators for function arguments.
 *
 * Adapted from https://gist.github.com/ImRLopezAI/13294581f3ed8e8478befe1bb664b690
 */
export function zodTable<
  Table extends string,
  T extends { [key: string]: z.ZodType },
>(tableName: Table, schema: (id: typeof zid) => T) {
  const fullSchema = z.object({
    ...schema(zid),
    _id: zid(tableName),
    _creationTime: z.number(),
  });

  const toolSafeFullSchema = z.object({
    ...schema(jsonSafeZid as typeof zid),
    _id: jsonSafeZid(tableName),
    _creationTime: z.number(),
  });

  const insertSchema = fullSchema.omit({
    _id: true,
    _creationTime: true,
  });
  const updateSchema = insertSchema.partial();

  const toolInsertSchema = toolSafeFullSchema.omit({
    _id: true,
    _creationTime: true,
  });
  const toolUpdateSchema = toolInsertSchema.partial();

  return {
    tableName,
    schema: fullSchema,
    insertSchema,
    updateSchema,
    table: () => {
      return defineTable(zodToConvex(insertSchema));
    },
    insert: () => zodToConvex(insertSchema),
    update: () => zodToConvex(updateSchema),
    tools: {
      insert: toolInsertSchema,
      update: z.object({
        data: toolUpdateSchema,
        id: jsonSafeZid(tableName),
      }),
      id: z.object({
        id: jsonSafeZid(tableName),
      }),
    },
  };
}
