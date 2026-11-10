// Render the approved design files the way the design artifact shows them, for pixel
// comparison. Uses the exact Google Fonts files captured in the approved home-page export
// (copied, with their @font-face rules, into _review/truth/), and blocks every other
// network request just as the offline export does.
//   node tools/checks/render_design.mjs [Name ...]   -> _review/truth/<Name>-1440.png
// Needs: python3 -m http.server 8000 (repo root) and the files under _review/truth/.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = "http://localhost:8000";
const names = process.argv.slice(2).length ? process.argv.slice(2)
  : ["HowWeWork", "Platform", "Clients", "Trust", "About", "Book", "Privacy", "MondayBrief"];
const fontsCss = readFileSync("_review/truth/google-fonts.css", "utf8");

const browser = await chromium.launch();
for (const name of names) {
  const width = name === "MondayBrief" ? 820 : 1440;
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  await ctx.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith("https://fonts.googleapis.com/css2")) return route.fulfill({ body: fontsCss, contentType: "text/css" });
    if (url.startsWith(BASE) && !url.endsWith("support.js")) return route.continue();
    return route.abort();
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/_review/truth/src/${name}.dc.html`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `_review/truth/${name}-${width}.png`, fullPage: true });
  console.log(name, width, await page.evaluate(() => document.documentElement.scrollHeight));
  await ctx.close();
}
await browser.close();
