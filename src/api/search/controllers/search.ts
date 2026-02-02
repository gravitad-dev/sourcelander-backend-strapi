import { stagehandScraper } from "../../../services/scraper/stagehand-scraper";

const CACHE_TTL_HOURS = 24;
const scrapingQueue = new Map<string, Promise<number>>();

async function getCacheCount(strapi: any, query: string): Promise<number> {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - CACHE_TTL_HOURS);

  return await strapi.entityService.count(
    "api::cached-freelancer.cached-freelancer" as any,
    {
      filters: {
        $or: [
          { query: { $containsi: query } },
          { name: { $containsi: query } },
          { skills: { $containsi: query } },
        ],
        scrapedAt: { $gte: cutoff.toISOString() },
      },
    },
  );
}

async function saveFreelancers(strapi: any, freelancers: any[], query: string) {
  for (const freelancer of freelancers) {
    const existing = await strapi.entityService.findMany(
      "api::cached-freelancer.cached-freelancer" as any,
      {
        filters: { sourceId: freelancer.sourceId, source: freelancer.source },
        limit: 1,
      },
    );

    const data = {
      sourceId: freelancer.sourceId,
      source: freelancer.source,
      query,
      name: freelancer.name,
      title: freelancer.title,
      description: freelancer.description,
      profileUrl: freelancer.profileUrl,
      avatar: freelancer.avatar,
      country: freelancer.country,
      hourlyRate: freelancer.hourlyRate,
      skills: freelancer.skills,
      rating: freelancer.rating,
      projectsCompleted: freelancer.projectsCompleted,
      scrapedAt: new Date(),
    };

    if (existing?.length > 0) {
      await strapi.entityService.update(
        "api::cached-freelancer.cached-freelancer" as any,
        existing[0].id,
        { data } as any,
      );
    } else {
      await strapi.entityService.create(
        "api::cached-freelancer.cached-freelancer" as any,
        { data } as any,
      );
    }
  }
}

async function scrapeAllPages(strapi: any, query: string): Promise<number> {
  if (scrapingQueue.has(query)) {
    return scrapingQueue.get(query) as Promise<number>;
  }

  const scrapingPromise = (async () => {
    strapi.log.info(`📡 Scraping all pages for: ${query}`);

    const [workanaResults, hubstaffResults] = await Promise.all([
      stagehandScraper.scrapeWorkana(query, 3).catch(() => []),
      stagehandScraper.scrapeHubstaff(query, 3).catch(() => []),
    ]);

    const allFreelancers = [
      ...workanaResults.map((f: any) => ({ ...f, source: "workana" })),
      ...hubstaffResults.map((f: any) => ({ ...f, source: "hubstaff" })),
    ];

    await saveFreelancers(strapi, allFreelancers, query);
    strapi.log.info(
      `✅ Scraped ${allFreelancers.length} freelancers for: ${query}`,
    );

    return allFreelancers.length;
  })();

  scrapingQueue.set(query, scrapingPromise);

  try {
    return await scrapingPromise;
  } finally {
    scrapingQueue.delete(query);
  }
}

export default {
  async find(ctx: {
    request: { query: { query: any; page?: "1" } };
    body: {
      success: boolean;
      data: any;
      meta:
        | { total: number; page: number; hasMore: boolean }
        | { total: number; page: number; hasMore: boolean };
    };
  }) {
    const strapi = (global as any).strapi;
    const { query, page = "1" } = ctx.request.query;

    if (!query) {
      ctx.body = {
        success: true,
        data: [],
        meta: { total: 0, page: 1, hasMore: false },
      };
      return;
    }

    const pageNum = parseInt(page as string, 10);
    const limit = 9;
    const offset = (pageNum - 1) * limit;

    let cacheCount = await getCacheCount(strapi, query as string);

    if (cacheCount === 0) {
      try {
        await scrapeAllPages(strapi, query as string);
        cacheCount = await getCacheCount(strapi, query as string);
      } catch (error) {
        strapi.log.error(`Scraping failed for ${query}:`, error);
      }
    }

    const freelancers = await strapi.entityService.findMany(
      "api::cached-freelancer.cached-freelancer" as any,
      {
        filters: {
          $or: [
            { query: { $containsi: query } },
            { name: { $containsi: query } },
            { skills: { $containsi: query } },
          ],
        },
        limit: limit * 2,
        start: offset,
        sort: { scrapedAt: "desc" },
      },
    );

    const seen = new Set<string>();
    const uniqueFreelancers = freelancers
      .filter((f: any) => {
        if (seen.has(f.sourceId)) return false;
        seen.add(f.sourceId);
        return true;
      })
      .slice(0, limit);

    const hasMore = offset + uniqueFreelancers.length < cacheCount;

    ctx.body = {
      success: true,
      data: uniqueFreelancers.map((f: any) => ({
        id: f.sourceId,
        name: f.name,
        title:
          f.title ||
          f.query
            ?.replace(/-/g, " ")
            .split(" ")
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ") ||
          "Freelancer",
        description: f.description,
        profileUrl: f.profileUrl,
        profileImageUrl: f.avatar,
        country: f.country,
        hourlyRate: f.hourlyRate ? `$${f.hourlyRate}/hr` : "",
        skills: f.skills || [],
        rating: f.rating,
        projectsCompleted: f.projectsCompleted,
      })),
      meta: {
        total: cacheCount,
        page: pageNum,
        hasMore,
      },
    };
  },
};
