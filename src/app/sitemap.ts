import type { MetadataRoute } from "next";
import { listPosts, listProducts } from "@/lib/server/store";
import { SITE_URL, SHOP_CATEGORIES, HELP_TOPICS, LEGAL_TOPICS } from "@/lib/site";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/shop/new-in`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/shop/sale`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/brands`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/journal`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/sell-to-us`, changeFrequency: "monthly", priority: 0.6 },
    ...HELP_TOPICS.map((topic) => ({
      url: `${SITE_URL}/help/${topic.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    ...LEGAL_TOPICS.map((topic) => ({
      url: `${SITE_URL}/legal/${topic.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];

  const journalRoutes: MetadataRoute.Sitemap = listPosts().map((post) => ({
    url: `${SITE_URL}/journal/${post.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.4,
    lastModified: new Date(post.publishedAt),
  }));

  const products = listProducts().filter((p) => p.status !== "DRAFT");

  const categoryRoutes: MetadataRoute.Sitemap = SHOP_CATEGORIES.map(
    (category) => ({
      url: `${SITE_URL}/shop/${category}`,
      changeFrequency: "daily",
      priority: 0.7,
    })
  );

  const brandRoutes: MetadataRoute.Sitemap = [
    ...new Set(products.map((p) => p.brand)),
  ].map((brand) => ({
    url: `${SITE_URL}/brands/${slugify(brand)}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/product/${p.slug}`,
    changeFrequency: "weekly",
    priority: p.status === "AVAILABLE" ? 0.8 : 0.4,
    lastModified: new Date(p.listedAt),
  }));

  return [
    ...staticRoutes,
    ...journalRoutes,
    ...categoryRoutes,
    ...brandRoutes,
    ...productRoutes,
  ].map((entry) => ({ ...entry, lastModified: entry.lastModified ?? now }));
}
