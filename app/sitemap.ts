import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
     process.env.RENDER_EXTERNAL_URL ? `https://${process.env.RENDER_EXTERNAL_URL}` :
     "http://localhost:3000");

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/dashboard`,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  return routes;
}


