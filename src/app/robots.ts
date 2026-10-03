import type { MetadataRoute } from "next";
import { isPreview, SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Private routes remain crawlable so crawlers can see their noindex response.
  // Authentication, not robots.txt, protects account and administrative data.
  return isPreview
    ? { rules: { userAgent: "*", disallow: "/" } }
    : {
        rules: { userAgent: "*", allow: "/", disallow: "/api/" },
        sitemap: `${SITE_URL}/sitemap.xml`,
      };
}
