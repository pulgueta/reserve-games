import { PostHogProvider as BasePostHogProvider } from "@posthog/react";
import posthog from "posthog-js";
import type { ReactNode } from "react";

import { env } from "@/env";

if (typeof window !== "undefined" && env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: "https://us.i.posthog.com",
  });
}

interface PostHogProviderProps {
  children: ReactNode;
}

export default function PostHogProvider({ children }: PostHogProviderProps) {
  return <BasePostHogProvider client={posthog}>{children}</BasePostHogProvider>;
}
