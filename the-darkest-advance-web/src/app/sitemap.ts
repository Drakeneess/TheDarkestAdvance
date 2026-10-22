import type { MetadataRoute } from "next";

const siteUrl = "https://thedarkestadvance.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/en`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/ru`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
