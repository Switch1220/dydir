import puppeteer, { ElementHandle, Page } from "puppeteer-core";

const clickUntilHidden = async (page: Page, selector: string) => {
  while (true) {
    try {
      const nextButton = await page.waitForSelector(selector, {
        timeout: 1000,
      });
      if (!nextButton) {
        break;
      }
      await nextButton.click();
    } catch (error) {
      break;
    }
  }
};

const getJournalName = async (
  box: ElementHandle
): Promise<string | undefined> => {
  const journalElement = await box.$(".rankingnews_box_head > strong");
  return journalElement
    ? journalElement.evaluate((el) => el.innerText)
    : undefined;
};

const getNewsItems = async (box: ElementHandle): Promise<NewsItem[]> => {
  const newsList = await box.$$(".rankingnews_list > li > .list_content > a");
  const items: NewsItem[] = [];

  for (const news of newsList) {
    const title = await news.evaluate((el) => el.innerText);
    const link = await news.evaluate((el) => el.getAttribute("href"));

    if (link) {
      items.push({ title, link });
    } else {
      console.error(
        "News link missing. Naver news structure might have changed."
      );
      return []; // Early exit on missing link
    }
  }
  return items;
};

export interface NewsItem {
  title: string;
  link: string;
}

export interface JournalRankings {
  [journalName: string]: NewsItem[] | undefined;
}

const scrapeJournalRankings = async (
  page: Page
): Promise<JournalRankings | undefined> => {
  const rankingBoxes = await page.$$(
    "#wrap > div.rankingnews._popularWelBase._persist > div.rankingnews_box_wrap._popularRanking > div > div"
  );

  const rankingData: JournalRankings = {};

  for (const box of rankingBoxes) {
    const journalName = await getJournalName(box);

    if (!journalName) {
      console.error("Journal ranking box not found.");
      continue; // Skip to next box on missing journal name
    }

    const news = await getNewsItems(box);
    rankingData[journalName] = news;
  }

  return rankingData;
};

export const scrapeRankings = async (
  chromeUrl: string
): Promise<
  | { success: true; result: JournalRankings }
  | {
      success: false;
      error: "News link missing. Naver news structure might have changed.";
    }
  | { success: false; error: "Invalid chrome url." }
> => {
  try {
    const browser = await puppeteer.launch({
      executablePath: chromeUrl,
      headless: true,
    });
    const page = await browser.newPage();

    await page.goto("https://news.naver.com/main/ranking/popularDay.naver");

    await clickUntilHidden(
      page,
      "div.rankingnews._popularWelBase._persist > button"
    );

    const rankings = await scrapeJournalRankings(page);

    console.log(rankings);

    await browser.close();

    if (!rankings)
      return {
        success: false,
        error: "News link missing. Naver news structure might have changed.",
      };

    return { success: true, result: rankings };
  } catch (e) {
    return {
      success: false,
      error: (e as any).toString(),
    };
  }
};

export const getArticleContents = async (
  chromeUrl: string,
  articleLinks: string[]
): Promise<
  | { success: true; result: string[] }
  | {
      success: false;
      error: "News link missing. Naver news structure might have changed.";
    }
  | { success: false; error: "Invalid chrome url." }
> => {
  try {
    const browser = await puppeteer.launch({
      executablePath: chromeUrl,
      headless: true,
    });
    const page = await browser.newPage();

    const contents: string[] = [];

    for (const link of articleLinks) {
      await page.goto(link);

      const body = await page.$("article");
      const text = await body?.evaluate((el) => el.innerText);

      if (!text) continue;

      contents.push(text);
    }

    await browser.close();

    return {
      success: true,
      result: contents,
    };
  } catch (e) {
    return {
      success: false,
      error: (e as any).toString(),
    };
  }
};
