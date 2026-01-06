import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, Page } from "puppeteer-core";

puppeteer.use(StealthPlugin());

const CHROME_PATHS = {
  win32: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  linux: "/usr/bin/google-chrome",
};

interface ScrapedFreelancer {
  sourceId: string;
  name: string;
  title?: string;
  description?: string;
  profileUrl: string;
  avatar?: string;
  country?: string;
  hourlyRate?: number;
  skills: string[];
  rating?: number;
  projectsCompleted?: number;
}

class PuppeteerScraperService {
  private browser: Browser | null = null;

  async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    const platform = process.platform as keyof typeof CHROME_PATHS;
    const executablePath = CHROME_PATHS[platform] || CHROME_PATHS.linux;

    this.browser = (await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    })) as unknown as Browser;

    return this.browser;
  }

  async scrapeWorkana(
    query: string,
    maxPages = 2,
    startPage = 1,
  ): Promise<ScrapedFreelancer[]> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    const results: ScrapedFreelancer[] = [];

    try {
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
      );

      for (let pageNum = startPage; pageNum < startPage + maxPages; pageNum++) {
        const url = `https://www.workana.com/freelancers?query=${encodeURIComponent(query)}&page=${pageNum}`;
        await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });

        await page
          .waitForSelector("article.js-worker, .container", { timeout: 15000 })
          .catch(() => {});

        const pageResults = await page.evaluate(() => {
          const freelancers: any[] = [];
          const cards = document.querySelectorAll("article.js-worker");

          cards.forEach((card) => {
            const profileLink = card.querySelector(
              'a[href*="/freelancer/"]',
            ) as HTMLAnchorElement | null;
            const img = card.querySelector("img") as HTMLImageElement | null;
            const name =
              img?.alt ||
              card.querySelector("h3, h4")?.textContent?.trim() ||
              "";
            const title = card
              .querySelector(".profession, .specialization")
              ?.textContent?.trim();
            const description = card
              .querySelector(".summary, .bio")
              ?.textContent?.trim();
            const country = card
              .querySelector(".country-name")
              ?.textContent?.trim();
            const rateText =
              card.querySelector(".price")?.textContent?.trim() || "";
            const rateMatch = rateText.match(/[\d.,]+/);
            const hourlyRate = rateMatch
              ? parseFloat(rateMatch[0].replace(",", "."))
              : undefined;

            const skills: string[] = [];
            card.querySelectorAll(".skills li, .skills a").forEach((s) => {
              const skill = s.textContent?.trim();
              if (skill) skills.push(skill);
            });

            if (profileLink?.href && name) {
              freelancers.push({
                sourceId: profileLink.href.split("/freelancer/")[1] || "",
                name,
                title,
                description,
                profileUrl: profileLink.href,
                avatar: img?.src || "",
                country,
                hourlyRate,
                skills,
              });
            }
          });

          return freelancers;
        });

        results.push(...pageResults);

        if (pageNum < maxPages) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    } finally {
      await page.close();
    }

    return results;
  }

  async scrapeHubstaff(
    query: string,
    maxPages = 2,
    startPage = 1,
  ): Promise<ScrapedFreelancer[]> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    const results: ScrapedFreelancer[] = [];

    try {
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
      );

      for (let pageNum = startPage; pageNum < startPage + maxPages; pageNum++) {
        const url = `https://hubstafftalent.net/search/profiles?search%5Bkeywords%5D=${encodeURIComponent(query)}&page=${pageNum}`;
        await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });

        await page
          .waitForSelector(".search-result", { timeout: 15000 })
          .catch(() => {});

        const pageResults = await page.evaluate(() => {
          const freelancers: any[] = [];
          const cards = document.querySelectorAll("#results .search-result");

          cards.forEach((card: any) => {
            const nameEl = card.querySelector("a.name");
            if (!nameEl) return;

            const name = nameEl.textContent?.trim() || "";
            const href = nameEl.href || "";
            const img = card.querySelector("img") as HTMLImageElement | null;
            const title = card
              .querySelector(".speciality")
              ?.textContent?.trim();
            const description = card
              .querySelector(".profil-bio")
              ?.textContent?.trim();
            const countryText =
              card.querySelector("span.location")?.textContent?.trim() || "";
            const country = countryText.replace(/^\s*/, "").trim();

            const rateText =
              card.querySelector(".pay-rate")?.textContent?.trim() || "";
            const rateMatch = rateText.match(/[\d.,]+/);
            const hourlyRate = rateMatch
              ? parseFloat(rateMatch[0].replace(",", "."))
              : undefined;

            const skills: string[] = [];
            card.querySelectorAll(".tag.tag-sm").forEach((s: any) => {
              const skill = s.textContent?.trim();
              if (skill && skill.length < 50) skills.push(skill);
            });

            const idMatch = href.match(/\/profiles\/([^\/\?]+)/);
            freelancers.push({
              sourceId: `hubstaff-${idMatch?.[1] || Math.random().toString(36).substr(2, 9)}`,
              name,
              title: title || "Freelancer",
              description: description || "",
              profileUrl: href,
              avatar: img?.src || "",
              country,
              hourlyRate,
              skills,
            });
          });

          return freelancers;
        });

        results.push(...pageResults);

        if (pageNum < maxPages) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    } finally {
      await page.close();
    }

    return results;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const puppeteerScraper = new PuppeteerScraperService();
