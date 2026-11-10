// Render the share image from its local template (no network).
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
const here = (p) => new URL(p, import.meta.url).href;
mkdirSync(fileURLToPath(new URL("../../assets/img/", import.meta.url)), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 627 } });
await page.goto(here("share.html"));
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: fileURLToPath(new URL("../../assets/img/share.png", import.meta.url)) });
await browser.close();
console.log("wrote assets/img/share.png (icons: python3 -I tools/icons/make_icons.py)");
