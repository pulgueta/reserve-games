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

---

## 0. The discipline (read before editing anything)

Before you change a file:

1. **Research before code.** Read the file, its imports, its callers, and the relation links below.
2. **State assumptions; surface tradeoffs.** If two interpretations exist, name them. If a simpler path exists, say so. If something is unclear, stop and ask — do not paper over confusion with defensive code.
3. **Surgical changes only.** Every changed line must trace to the task. Don't reformat, "improve", or refactor adjacent code. Match existing style. Remove only the orphans *your* change created; flag pre-existing dead code, don't delete it.
4. **Goal-driven verification.** Turn the task into a checkable goal and loop until it passes. The required gates are in §7.

If a senior engineer would call your change overcomplicated or speculative, rewrite it smaller.

---

## 1. Components

- Functional `FC` components, named exports, colocated under `src/components/<domain>/`. Shared primitives live in `src/components/ui/` (Base UI + shadcn-style), forms in `src/components/form/`.
- **Heavy/below-the-fold components are `lazy()`-loaded**. Use React 19 `<Activity mode="visible|hidden">` to keep mounted-but-hidden subtrees warm instead of unmount/remount, this preserves the component state.
- Icons: `@phosphor-icons/react`, `weight="bold"` by default via the root `IconContext`.
- Haptics: `useWebHaptics()` from `web-haptics/react`.

### 1.1 Forms — TanStack Form via `useAppForm` ONLY

- `useAppForm` (from `src/components/form/use-form.tsx`) — created with `createFormHook`, exposes field components (`TextField`, `TextAreaField`, `PasswordField`, `SelectField`, `SwitchField`, `CheckboxField`, `RadioGroupField`) and form components (`SubmitButton`, `ResetButton`).

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
      haptic.trigger("error");
    }
  },
});
```

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

- `pnpm dlx react-doctor@latest . --project panabarbero --verbose --diff` — when
  you touched React. No new regressions vs `main` (a known baseline of
  pre-existing warnings exists; don't fix unrelated ones).
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
