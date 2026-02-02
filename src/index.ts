import { stagehandScraper } from "./services/scraper/stagehand-scraper";

const BOOTSTRAP_ENABLED = process.env.ENABLE_INITIAL_SCRAPER === "true";

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

async function runInitialScraping(strapi: any) {
  strapi.log.info("🚀 Bootstrap: Starting initial scraping...");

  for (const query of QUERIES_TO_SCRAPE) {
    if (!strapi?.entityService) {
      console.log("⚠️ Strapi reloaded, aborting scraping...");
      return;
    }

    try {
      const [workanaResults, hubstaffResults] = await Promise.all([
        stagehandScraper.scrapeWorkana(query, 1).catch(() => []),
        stagehandScraper.scrapeHubstaff(query, 1).catch(() => []),
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

      strapi.log.info(`✅ Cached ${allFreelancers.length} for: ${query}`);
      await new Promise((r) => setTimeout(r, 2000));
    } catch (error) {
      strapi.log.error(`❌ Error scraping ${query}:`, error);
    }
  }

  await stagehandScraper.close();
  strapi.log.info("✅ Initial scraping completed");
}

export default {
  register() {},
  async bootstrap({ strapi }) {
    if (BOOTSTRAP_ENABLED) {
      runInitialScraping(strapi);
    } else {
      strapi.log.info(
        "Bootstrap scraping disabled (ENABLE_INITIAL_SCRAPER!=true)",
      );
    }
  },
};
