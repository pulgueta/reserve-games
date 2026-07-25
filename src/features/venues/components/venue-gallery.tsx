import { type FC, useState } from "react";

import { cn } from "@/lib/utils";

interface VenueGalleryProps {
  images: string[];
  name: string;
  fallbackEmoji: string;
}

export const VenueGallery: FC<VenueGalleryProps> = ({
  images,
  name,
  fallbackEmoji,
}) => {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-secondary text-6xl">
        {fallbackEmoji}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
        <img
          src={images[active]}
          alt={name}
          className="size-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "aspect-[4/3] w-24 overflow-hidden rounded-xl ring-2 transition-all",
                index === active
                  ? "ring-primary"
                  : "opacity-70 ring-transparent hover:opacity-100",
              )}
            >
              <img
                src={src}
                alt={`${name} ${index + 1}`}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
