import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authedRoutes")({
  beforeLoad: ({ context }) => {
    // `userId` is resolved in the root `beforeLoad` from the Clerk session.
    if (!context.userId) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
