import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/register")({
  component: () => (
    <SignUp routing="hash" signInUrl="/login" fallbackRedirectUrl="/" />
  ),
});
