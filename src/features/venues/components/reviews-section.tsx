import type { Review } from "@convex/schema";
import { StarIcon } from "@phosphor-icons/react";
import type { FC } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span
      role="img"
      className={cn("inline-flex", className)}
      aria-label={`${value} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          weight="fill"
          className={cn(
            "size-4",
            n <= Math.round(value) ? "text-primary" : "text-muted",
          )}
        />
      ))}
    </span>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

interface ReviewsSectionProps {
  rating: number;
  reviewCount: number;
  reviews: Review[];
}

export const ReviewsSection: FC<ReviewsSectionProps> = ({
  rating,
  reviewCount,
  reviews,
}) => (
  <section>
    <div className="mb-4 flex items-center gap-3">
      <h2 className="font-semibold text-lg tracking-tight">Reseñas</h2>
      {reviewCount > 0 && (
        <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <Stars value={rating} />
          {rating.toLocaleString("es-CO", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}{" "}
          · {reviewCount} {reviewCount === 1 ? "reseña" : "reseñas"}
        </span>
      )}
    </div>

    {reviews.length === 0 ? (
      <p className="text-muted-foreground text-sm">
        Aún no hay reseñas. Sé el primero en reservar y opinar.
      </p>
    ) : (
      <ul className="flex flex-col gap-5">
        {reviews.map((review) => (
          <li key={review._id} className="flex gap-3">
            <Avatar className="size-9">
              <AvatarFallback>{initials(review.authorName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-medium text-sm">{review.authorName}</span>
                <Stars value={review.rating} className="text-xs" />
                <span className="text-muted-foreground text-xs">
                  {formatRelativeTime(review._creationTime)}
                </span>
              </div>
              <p className="text-pretty text-muted-foreground text-sm">
                {review.comment}
              </p>
            </div>
          </li>
        ))}
      </ul>
    )}
  </section>
);
