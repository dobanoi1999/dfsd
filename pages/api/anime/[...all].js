const puppeteer = require("puppeteer");
const chromium = require("chrome-aws-lambda");
export default async function handler(req, res) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });

  const ep = req.query?.all[1] || "";
  await page.goto(`${process.env.URL_CRAWL}/${req.query?.all[0]}/${ep}`);

  const data = await page.evaluate(() => {
    try {
      const title = document.querySelector(".film-info-title").innerText || "";
      const views =
        document.querySelector(".film-info-views > span").innerText || "";
      const desc =
        document.querySelector(".film-info > .film-info-description")
          .innerText || "";
      const genreDoc =
        document.querySelector(".film-info > .film-info-genre") || [];
      const episodeList = document.querySelectorAll(".episode-item");
      const genre = Array.from(genreDoc.children).map((i) => {
        return {
          href: i.getAttribute("href"),
          tag: i.innerText,
        };
      });
      const episodes = Array.from(episodeList).map((i) => {
        return {
          href: i.children[0]?.getAttribute("href") || "/",
          text: i.children[0]?.children[1]?.children[0]?.innerText || "",
        };
      });
      const video =
        document.getElementsByTagName("video")[0]?.getAttribute("src") || "";

      const info = { video, title, views, desc, genre };
      return {
        info,
        episodes,
      };
    } catch (error) {
      return {};
    }
  });
  browser.close();
  if (typeof data !== "object") {
    return res.json({});
  }
  res.json(data);
}
