// Full-page screenshots of each page at 1440 and 390 px, saved to _review/ (untracked).
// Serve the repo root first:  python3 -m http.server 8000
// Then:                        node tools/checks/screens.mjs [page-name ...]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:8000";
const PAGES = {
  Main: "/", HowWeWork: "/how-we-work/", Platform: "/platform/", Clients: "/clients/",
  Trust: "/trust/", About: "/about/", Book: "/book/", Privacy: "/privacy/",
  MondayBrief: "/monday-brief/", SignIn: "/sign-in/", NotFound: "/404.html",
};
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PAGES);
mkdirSync("_review", { recursive: true });

const browser = await chromium.launch();
for (const width of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  for (const name of names) {
    await page.goto(BASE + PAGES[name], { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.screenshot({ path: `_review/${name}-${width}.png`, fullPage: true });
    console.log(`${name} @${width}${overflow > 0 ? `  WARNING: scrolls sideways by ${overflow}px` : ""}`);
  }
  await page.close();
}
await browser.close();
