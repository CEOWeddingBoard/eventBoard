import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/pl/dashboard/",
          "/en/dashboard/",
          "/pl/sign-in",
          "/en/sign-in",
          "/pl/sign-up",
          "/en/sign-up",
          "/pl/onboarding",
          "/en/onboarding",
          "/api/",
          "/pl/api/",
          "/en/api/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl(""),
  };
}
