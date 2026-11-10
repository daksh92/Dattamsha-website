// Render the share image and touch icon from local templates (no network).
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { mkdirSync, readFileSync } from "node:fs";
const here = (p) => new URL(p, import.meta.url).href;
mkdirSync(fileURLToPath(new URL("../../assets/img/", import.meta.url)), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 627 } });
await page.goto(here("share.html"));
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: fileURLToPath(new URL("../../assets/img/share.png", import.meta.url)) });
const icon = await browser.newPage({ viewport: { width: 180, height: 180 } });
const svg = readFileSync(new URL("../../favicon.svg", import.meta.url), "utf8").replace("<svg ", '<svg width="180" height="180" ');
await icon.setContent(`<style>html,body{margin:0;background:#fbf6ea}svg{display:block}</style>${svg}`);
await icon.screenshot({ path: fileURLToPath(new URL("../../assets/img/apple-touch-icon.png", import.meta.url)) });
await browser.close();
console.log("wrote assets/img/share.png and assets/img/apple-touch-icon.png");
