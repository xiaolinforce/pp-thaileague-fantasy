import type { MetadataRoute } from "next";
import { isPreview, PUBLIC_PATHS, SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // Do not invent modification dates: fixture changes are maintained separately.
  return isPreview
    ? []
    : PUBLIC_PATHS.map((path) => ({ url: new URL(path, SITE_URL).href }));
}
