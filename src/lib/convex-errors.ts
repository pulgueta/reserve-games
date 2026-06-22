import { ConvexError } from "convex/values";

/** Extracts the human-readable message from a thrown `ConvexError`. */
export function getConvexErrorMessage(error: unknown) {
  if (error instanceof ConvexError) {
    return error.data as string;
  }

  return "Something went wrong. Please try again.";
}
