import type { WebhookEvent } from "@clerk/tanstack-react-start/server";
import { httpRouter } from "convex/server";
import { Webhook } from "svix";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

/**
 * Verifies a Clerk webhook with svix and returns the typed event, or `null`
 * when the signature/secret is invalid. `CLERK_WEBHOOK_SECRET` is set in the
 * Convex dashboard (Settings → Environment Variables), not the app env.
 */
async function verifyClerkWebhook(
  request: Request,
): Promise<WebhookEvent | null> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return null;
  }

  const payload = await request.text();
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  try {
    return new Webhook(secret).verify(payload, headers) as WebhookEvent;
  } catch (error) {
    console.error("Clerk webhook verification failed", error);
    return null;
  }
}

/**
 * Receives Clerk user lifecycle events and mirrors them into the `users` table.
 * Idempotent via `clerkId`, so svix retries are safe. Register the endpoint in
 * the Clerk dashboard at `<your-deployment>.convex.site/clerk-users-webhook`.
 */
const clerkWebhook = httpAction(async (ctx, request) => {
  const event = await verifyClerkWebhook(request);

  if (!event) {
    return new Response("Verification failed", { status: 400 });
  }

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } =
        event.data;
      const email = email_addresses[0]?.email_address;

      if (email) {
        const name = [first_name, last_name].filter(Boolean).join(" ").trim();

        await ctx.runMutation(internal.users.upsertFromClerk, {
          clerkId: id,
          email,
          name: name || undefined,
          imageUrl: image_url || undefined,
        });
      }
      break;
    }
    case "user.deleted": {
      if (event.data.id) {
        await ctx.runMutation(internal.users.deleteFromClerk, {
          clerkId: event.data.id,
        });
      }
      break;
    }
    // One Clerk organization = one venue. Mirror the org lifecycle and its
    // memberships into the `venues` row and the scoped convex-authz roles.
    case "organization.created": {
      await ctx.runMutation(internal.organizations.onOrgCreated, {
        orgId: event.data.id,
        name: event.data.name,
        createdBy: event.data.created_by ?? "",
      });
      break;
    }
    case "organization.deleted": {
      if (event.data.id) {
        await ctx.runMutation(internal.organizations.onOrgDeleted, {
          orgId: event.data.id,
        });
      }
      break;
    }
    case "organizationMembership.created":
    case "organizationMembership.updated": {
      await ctx.runMutation(internal.organizations.syncMembership, {
        orgId: event.data.organization.id,
        userId: event.data.public_user_data.user_id,
        roleSlug: event.data.role,
      });
      break;
    }
    case "organizationMembership.deleted": {
      await ctx.runMutation(internal.organizations.removeMembership, {
        orgId: event.data.organization.id,
        userId: event.data.public_user_data.user_id,
      });
      break;
    }
  }

  return new Response("OK", { status: 200 });
});

const http = httpRouter();

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: clerkWebhook,
});

export default http;
