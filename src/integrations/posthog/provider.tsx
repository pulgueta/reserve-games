import { PostHogProvider as BasePostHogProvider } from "@posthog/react";
import posthog from "posthog-js";
import type { ReactNode } from "react";

import { clientEnv } from "@/env/client";

if (typeof window !== "undefined" && clientEnv.VITE_POSTHOG_KEY) {
  posthog.init(clientEnv.VITE_POSTHOG_KEY, {
    api_host: "https://us.i.posthog.com",
  });
}

interface PostHogProviderProps {
  children: ReactNode;
}

export default function PostHogProvider({ children }: PostHogProviderProps) {
  return <BasePostHogProvider client={posthog}>{children}</BasePostHogProvider>;
}
