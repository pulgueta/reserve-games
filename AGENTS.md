# AGENTS.md

Reserve game is a platform where sport fields can add their fields for users to book appointments and pay inside for the hour that they are going to pay.

> [!IMPORTANT]
> Keep `AGENTS.md` updated with project status.

<!-- intent-skills:start -->
## Skill Loading

Before substantial work:

- Skill check: run `pnpm dlx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

---

## 0. The discipline (read before editing anything)

Before you change a file:

1. **Research before code.** Read the file, its imports, and its callers.
2. **State assumptions; surface tradeoffs.** If two interpretations exist, name them. If a simpler path exists, say so. If something is unclear, stop and ask — do not paper over confusion with defensive code.
3. **Surgical changes only.** Every changed line must trace to the task. Don't reformat, "improve", or refactor adjacent code. Match existing style. Remove only the orphans *your* change created; flag pre-existing dead code, don't delete it.
4. **Goal-driven verification.** Turn the task into a checkable goal and loop until it passes. The required gates are in §5.

If a senior engineer would call your change overcomplicated or speculative, rewrite it smaller.

---

## 1. Architecture & conventions

### 1.0 Code style

**Components**

- Always arrow function components — never `function` declarations:
  ```tsx
  export const MyComponent: FC<MyComponentProps> = ({ foo }) => { ... };
  ```
- Props use interfaces, never type aliases. If the component accepts children, extend `PropsWithChildren`:
  ```tsx
  interface MyComponentProps extends PropsWithChildren {
    foo: string;
  }
  ```
- Named exports only — no default exports unless the package or file convention requires it (e.g. route files).

**Utilities & hooks**

- Regular function declarations, not arrow functions:
  ```ts
  export function useMyHook() { ... }
  export function formatDate(date: Date) { ... }
  ```

**Imports**

- Follow `verbatimModuleSyntax`: use `import type` for type-only imports, never mix value and type imports in a single statement:
  ```ts
  import type { FC, PropsWithChildren } from "react";
  import { useState } from "react";
  ```

**Native APIs over libraries**

Prefer native platform/JS APIs before reaching for a dependency:

- **Formatting** — use `Intl` APIs, never `date-fns`, `moment`, `numeral`, etc.:
  ```ts
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(amount);
  new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(date);
  new Intl.RelativeTimeFormat("es-CO", { numeric: "auto" }).format(-3, "day"); // "hace 3 días"
  new Intl.ListFormat("es-CO", { style: "long", type: "conjunction" }).format(items);
  new Intl.PluralRules("es-CO").select(count); // "one" | "other"
  ```
- **URLs** — `URL` / `URLSearchParams` over string concatenation or `qs`.
- **Dates** — `Date` or `Temporal` (when available) over wrapper libraries.
- Only add a dependency when the native API is genuinely insufficient for the use case.

---

A TanStack Start app (file-based routing, SSR) on a Convex backend with Clerk auth. Code is organized **feature-first**, kebab-case throughout:

- **Feature code** lives under `src/features/<domain>/` with `components/` and `hooks/` subfolders (e.g. `src/features/venues/components/venue-card.tsx`, `src/features/bookings/hooks/use-bookings.ts`). Keep a feature's pieces together along that grain.
- **Shared, feature-agnostic code** stays global: the design system in `src/components/ui/` (Base UI + shadcn-style, `base-maia`), form fields in `src/components/form/`, app shell in `src/components/layout/`, cross-cutting hooks in `src/hooks/`, and helpers/tokens in `src/lib/` (`format.ts` for es-CO `Intl`, `sports.ts` for sport metadata, `clerk-appearance.ts`).
- **Backend** is one Convex file per domain in `convex/`, plus generic internal CRUD in `convex/crud.ts` and the Clerk → Convex user webhook in `convex/http.ts`.

### 1.1 Components

- Functional `FC` components, named exports, colocated under `src/features/<domain>/components/` (feature UI) or `src/components/{ui,form,layout}/` (shared). Shared primitives live in `src/components/ui/` (Base UI + shadcn-style); form fields in `src/components/form/`.
- Heavy/below-the-fold components are `lazy()`-loaded. Use React 19 `<Activity mode="visible|hidden">` to keep hidden subtrees mounted (preserves state) instead of unmount/remount.
- Icons: `@phosphor-icons/react` (`weight="bold"` by default via the root `IconContext`). Haptics: `useWebHaptics()` from `web-haptics/react`.

### 1.2 Forms — `useAppForm` only

Build forms with `useAppForm` (`src/components/form/use-form.tsx`, created via `createFormHook`). It exposes the field components (`TextField`, `TextAreaField`, `PasswordField`, `SelectField`, `SwitchField`, `CheckboxField`, `RadioGroupField`) and form components (`SubmitButton`, `ResetButton`). Don't hand-roll form state.

```tsx
const form = useAppForm({
  onSubmitInvalid: () => haptic.trigger("error"),
  validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
  validators: { onSubmit: someZodSchema },
  defaultValues,
  onSubmit: async ({ value }) => {
    try {
      await mutation(value);
      haptic.trigger("success"); toast.success("…"); form.reset();
    } catch (error) {
      haptic.trigger("error"); toast.error(getConvexErrorMessage(error));
    }
  },
});
```

### 1.3 Backend — Convex

Functions use the custom builders in `convex/index.ts`, never the raw Convex `query` / `mutation` / `action`:

- `zQuery` / `zMutation` / `zAction` (+ `zInternal*`) — Zod-validated args and returns.
- `zAuthQuery` / `zAuthMutation` / `zAuthAction` — same, plus they resolve the Clerk user and inject `ctx.userId` (throwing when unauthenticated).
- `zodTable(name, schema)` — defines a table from one Zod schema and derives its row type, insert/update schemas, and wire-safe arg validators. Tables live in `convex/schema.ts`.

Conventions:

- One file per domain. Public reads use `zQuery`; writes use an auth builder and stamp ownership server-side (`ownerId: ctx.userId`) — never trust a client-sent owner/user id.
- Thin CRUD with a single ownership check per write; no row-level-security / ACL framework unless asked.
- Throw `ConvexError` (messages centralized in `convex/errors.ts`); read them on the client with `getConvexErrorMessage`.
- Always query through an index (`by_<field>` / `by_<field1>_<field2>` via `.withIndex(...)`); never an unindexed scan.

### 1.4 Data fetching & state

Convex talks to TanStack Query via `@convex-dev/react-query`. One hook module per domain (e.g. `use-venues`):

- Export **query-options factories**, then wrap them in thin `use*` hooks — the factory is reused by both route loaders and components, so there's no waterfall.

  ```ts
  const xQueryOptions = (args) => convexQuery(api.x.y, args); // shared by loaders + hooks
  const useX = (args) => useSuspenseQuery(xQueryOptions(args)); // useQuery for optional/lazy/streaming
  ```

- Group mutations in a `use*Actions()` hook (one `useMutation({ mutationFn: useConvexMutation(api.x.y) })` per action; add `.withOptimisticUpdate(...)` where it helps).
- Never call `useQuery(convexQuery(...))` inline — always factory + `use*` hook.
- Cache/stale tiers come from the shared config in `src/config/cache.ts`, not ad-hoc per call.
- Env is split and validated with `@t3-oss/env-core` (client vs server under `src/env/`); import from there, never read `process.env` / `import.meta.env` directly.

### 1.5 Routing & auth

File-based routes in `src/routes/`. Clerk is resolved on the server during the root route's `beforeLoad` and injected into router context as `{ userId, token }`; the same auth seeds Convex for SSR.

- **Loaders prefetch**: `ensureQueryData(xQueryOptions())` for above-the-fold data, `prefetchQuery(...)` for below-the-fold/streamed; components then read the same factory (cache hit).
- **Guards**: protected subtrees live under `_authedRoutes/` (a `beforeLoad` redirects to `/login` when there's no `userId`); logged-out pages (`login` / `register`) live under `_auth/` and render Clerk's `<SignIn>` / `<SignUp>`.
- Per-route SEO via the `seo()` helper in `head: () => ({ meta: seo({...}) })`; read `loaderData` in `head` for dynamic titles.

---

## 2. Think before coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 3. Simplicity & surgical changes

- Minimum code that solves the problem. No speculative features, abstractions
  for single-use code, configurability that wasn't requested, or error handling
  for impossible scenarios. If 200 lines could be 50, rewrite it.
- Touch only what you must. Don't "improve" adjacent code, comments, or
  formatting. Match existing style. Remove only the orphans your change created;
  flag pre-existing dead code instead of deleting it. Every changed line traces
  to the task.

## 4. Committing

When asked to commit, group files by relevance and relationship — one commit per logical unit (e.g. Convex backend changes together, UI components together, config/docs together). Never bundle unrelated files into a single commit.

Commit messages must be short: `type(scope): brief description` — no body, no bullet points. The diff is the documentation. Examples:

```sh
feat(appointments): add reschedule request form
fix(auth): seed initialAuth before hydration
chore(convex): update schema validators
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`. Keep scope tight (the domain/folder, not the whole app).

---

## 5. Goal-driven execution & required gates

Turn the task into a verifiable goal and loop until it passes ("add validation"
→ "write tests for invalid inputs, then make them pass"). Before you call a task
done, run:

- `pnpm doctor:diff` — when you touched React. No new regressions vs `main` (a
  known baseline of pre-existing warnings exists; don't fix unrelated ones).
- `pnpm lint` and `pnpm format` on **your** files (double quotes, 2-space indent,
  `import type` for type-only imports). Don't reformat files you didn't change.
- `pnpm build` (vite) → exit 0 for anything affecting the build/SSR.

Useful commands:

```sh
pnpm dev                                   # convex dev + vite
pnpm doctor:diff                           # react-doctor on the diff
pnpm doctor:full                           # react-doctor for full project coverage
```

**These guidelines are working if:** fewer unnecessary diffs, fewer rewrites due
to overcomplication, and clarifying questions come before implementation rather
than after mistakes.
