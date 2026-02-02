import { stagehandScraper } from "../services/scraper/stagehand-scraper";

const CRON_ENABLED = process.env.ENABLE_SCRAPER_CRON === "true";

const QUERIES_TO_SCRAPE = [
  "web-development",
  "mobile-development",
  "design",
  "digital-marketing",
  "writing",
  "translation",
  "business-consulting",
  "data-science",
  "javascript",
  "react",
  "python",
  "nodejs",
  "ui-ux",
];

async function runFullScraping(strapi: any) {
  strapi.log.info("🔄 Cron: Starting weekly scraping job...");

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const staleFreelancers = await strapi.entityService.findMany(
    "api::cached-freelancer.cached-freelancer" as any,
    {
      filters: { scrapedAt: { $lt: sixMonthsAgo.toISOString() } },
      fields: ["id"],
    },
  );

  for (const f of staleFreelancers) {
    await strapi.entityService.delete(
      "api::cached-freelancer.cached-freelancer" as any,
      f.id,
    );
  }

  if (staleFreelancers.length > 0) {
    strapi.log.info(
      `🧹 Cleaned ${staleFreelancers.length} stale freelancers (>6 months)`,
    );
  }

  for (const query of QUERIES_TO_SCRAPE) {
    try {
      const [workanaResults, hubstaffResults] = await Promise.all([
        stagehandScraper.scrapeWorkana(query, 1).catch((e) => {
          strapi.log.error(`Workana error for ${query}:`, e);
          return [];
        }),
        stagehandScraper.scrapeHubstaff(query, 1).catch((e) => {
          strapi.log.error(`Hubstaff error for ${query}:`, e);
          return [];
        }),
      ]);

      const allFreelancers = [
        ...workanaResults.map((f: any) => ({ ...f, source: "workana" })),
        ...hubstaffResults.map((f: any) => ({ ...f, source: "hubstaff" })),
      ];

      for (const freelancer of allFreelancers) {
        const existing = await strapi.entityService.findMany(
          "api::cached-freelancer.cached-freelancer" as any,
          {
            filters: {
              sourceId: freelancer.sourceId,
              source: freelancer.source,
            },
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

        if (existing && existing.length > 0) {
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

      strapi.log.info(
        `✅ Cached ${allFreelancers.length} freelancers for: ${query}`,
      );
      await new Promise((r) => setTimeout(r, 3000));
    } catch (error) {
      strapi.log.error(`❌ Error scraping ${query}:`, error);
    }
  }

  await stagehandScraper.close();
  strapi.log.info("✅ Weekly scraping job completed");
}

export default CRON_ENABLED
  ? {
      scraperJob: {
        task: async ({ strapi }) => {
          await runFullScraping(strapi);
        },
        options: {
          rule: "0 6 * * 1",
        },
      },
    }
  : {};
