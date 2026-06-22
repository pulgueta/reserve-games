type SeoInput = {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
};

/** Builds an Open Graph + Twitter meta array for a route's `head()`. */
export function seo({ title, description, keywords, image }: SeoInput) {
  return [
    { title },
    { name: "twitter:title", content: title },
    { property: "og:title", content: title },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    ...(description
      ? [
          { name: "description", content: description },
          { name: "twitter:description", content: description },
          { property: "og:description", content: description },
        ]
      : []),
    ...(keywords ? [{ name: "keywords", content: keywords }] : []),
    ...(image
      ? [
          { name: "twitter:image", content: image },
          { property: "og:image", content: image },
        ]
      : []),
  ];
}
