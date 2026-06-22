# Convex backend

Functions are written with the custom builders in `index.ts`, never the raw
`query` / `mutation` / `action`.

## Builders (`index.ts`)

- `zQuery` / `zMutation` / `zAction` (+ `zInternal*`) — Zod-validated args and
  returns via `convex-helpers/server/zod4`.
- `zAuthQuery` / `zAuthMutation` / `zAuthAction` — same, plus they resolve the
  Clerk user once and inject `ctx.userId` (throwing when signed out). Handlers
  read `const { userId } = ctx`.
- `zodTable(name, (id) => fields)` — defines a table from one Zod schema and
  derives `.table()`, `.schema`, `.insertSchema`, `.updateSchema`, and wire-safe
  argument validators `.tools.id` / `.tools.insert` / `.tools.update`.

## Layout

- `schema.ts` — tables (`venues`, `bookings`) + exported row types
  (`output<typeof table.schema>`).
- `identity.ts` — `getUserId` / `requireUserId` (the Clerk JWT subject).
- `errors.ts` — user-facing `ConvexError` message strings.
- `auth.config.ts` — registers Clerk as the auth provider via
  `CLERK_FRONTEND_API_URL`.
- `users.ts` / `venues.ts` / `bookings.ts` — one file per domain.

## Conventions

- Public reads → `zQuery`; writes → `zAuthMutation`, stamping ownership
  server-side (`ownerId: ctx.userId`). Never trust a client-sent owner/user id.
- Thin CRUD, **no row-level-security framework** — see
  https://stack.convex.dev/crud-and-rest. A single ownership check per write is
  enough; don't build a role/ACL system unless asked.
- Always query with `.withIndex("by_…")`; index names are `by_<field>` or
  `by_<field1>_<field2>`.

## Codegen

`_generated/` is produced by `npx convex dev` (or `npx convex codegen`), which
requires a configured deployment. Frontend imports from `@convex/_generated/*`
and `@convex/schema` only typecheck after it has run.
