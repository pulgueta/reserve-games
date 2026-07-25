/**
 * Maps Clerk's UI (`<SignIn>`, `<SignUp>`, `<UserButton>`) onto our design
 * system by pointing Clerk's theme variables at the same CSS custom properties
 * the rest of the app uses. Because these are `var(--…)` references, Clerk's
 * widgets follow light/dark mode automatically. Typed by `ClerkProvider`'s
 * `appearance` prop at the call site.
 * See https://clerk.com/docs/guides/customizing-clerk/overview.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--primary)",
    colorBackground: "var(--card)",
    colorText: "var(--card-foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorInputBackground: "var(--background)",
    colorInputText: "var(--foreground)",
    colorDanger: "var(--destructive)",
    colorNeutral: "var(--foreground)",
    borderRadius: "var(--radius)",
    fontFamily: "var(--font-sans)",
  },
  elements: {
    card: "shadow-lg border border-border",
    headerTitle: "tracking-tight",
    formButtonPrimary:
      "bg-primary text-primary-foreground hover:bg-primary/90 normal-case",
    footerActionLink: "text-primary hover:text-primary/90",
  },
};
