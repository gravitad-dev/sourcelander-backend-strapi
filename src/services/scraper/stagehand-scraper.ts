import { Stagehand } from "@browserbasehq/stagehand";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const FreelancerSchema = z.object({
  sourceId: z.string(),
  name: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  profileUrl: z.string(),
  avatar: z.string().optional(),
  country: z.string().optional(),
  hourlyRate: z.number().optional(),
  skills: z.array(z.string()),
});

type ScrapedFreelancer = z.infer<typeof FreelancerSchema>;

class StagehandScraperService {
  private stagehand: Stagehand | null = null;
  private genAI: GoogleGenerativeAI | null = null;

  async init() {
    if (this.stagehand) return;

    // Inicializar Groq API (gratuito y rápido)
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY no está configurada en las variables de entorno",
      );
    }

    // Configurar Stagehand con Groq como modelo
    const headlessEnv = process.env.STAGEHAND_HEADLESS;
    const isHeadless =
      headlessEnv === undefined
        ? true
        : !["false", "0", "no"].includes(headlessEnv.toLowerCase());

    const stagehandOptions: any = {
      env: "LOCAL",
      localBrowserLaunchOptions: {
        headless: isHeadless,
      },
      model: {
        modelName:
          process.env.STAGEHAND_MODEL_NAME || "groq-llama-3.3-70b-versatile",
        apiKey: apiKey,
      },
    };

    this.stagehand = new Stagehand(stagehandOptions);

    await this.stagehand.init();
  }

  async scrapeWorkana(
    query: string,
    maxPages = 1,
  ): Promise<ScrapedFreelancer[]> {
    await this.init();
    if (!this.stagehand) return [];

    const page = this.stagehand.context.pages()[0];
    const allResults: ScrapedFreelancer[] = [];

    for (let i = 1; i <= maxPages; i++) {
      await page.goto(
        `https://www.workana.com/freelancers?query=${encodeURIComponent(query)}&page=${i}`,
      );

      const freelancers = await this.stagehand.extract(
        "Extract all freelancer profiles from the list, including their name, title, description, profile URL, avatar image source, country, hourly rate, and skills tags.",
        z.array(FreelancerSchema) as any,
        { page },
      );

      allResults.push(...(freelancers as ScrapedFreelancer[]));
    }

    return allResults;
  }

  async scrapeHubstaff(
    query: string,
    maxPages = 1,
  ): Promise<ScrapedFreelancer[]> {
    await this.init();
    if (!this.stagehand) return [];

    const page = this.stagehand.context.pages()[0];
    const allResults: ScrapedFreelancer[] = [];

    for (let i = 1; i <= maxPages; i++) {
      await page.goto(
        `https://hubstafftalent.net/search/profiles?search%5Bkeywords%5D=${encodeURIComponent(query)}&page=${i}`,
      );

      const freelancers = await this.stagehand.extract(
        "Extract all freelancer profiles from the search results. Get the name, title, description, profile URL from the link, avatar image, country, hourly rate, and all listed skills.",
        z.array(FreelancerSchema) as any,
        { page },
      );

      allResults.push(...(freelancers as ScrapedFreelancer[]));
    }

    return allResults;
  }

  async close() {
    if (this.stagehand) {
      await this.stagehand.close();
      this.stagehand = null;
    }
  }
}

export const stagehandScraper = new StagehandScraperService();
