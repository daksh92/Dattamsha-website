// Site-wide browser checks against a local server (python3 -m http.server 8000):
//   * axe-core (WCAG 2.0/2.1 A and AA): fails on serious or critical issues, with JavaScript
//     and in the no-JS state (site scripts blocked, <noscript> unwrapped so no-js.css loads)
//   * Content-Security-Policy violations and console errors: fails on any
//   * every request must be same-origin: fails on any third-party request
//   * no sideways scrolling at 360, 390 and 1440 px
//   * redirect pages land on their new URL
// Usage: node tools/checks/site_checks.mjs
import { chromium, webkit } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:8000";
const origin = new URL(BASE).origin;
const site = JSON.parse(readFileSync(new URL("../../src/pages.json", import.meta.url), "utf8"));
const pages = site.pages.map((p) => p.path);
let failures = 0;
const fail = (msg) => { failures++; console.log(`FAIL ${msg}`); };

const browser = await chromium.launch();
// WebKit (Safari's engine) applies some CSP rules differently, so pages are loaded there too.
const safari = await webkit.launch();

async function audit(path, { width, js, engine = browser }) {
  const context = await engine.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: js });
  const page = await context.newPage();
  const problems = [];
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (e) => {
      console.error(`CSP violation: ${e.violatedDirective} blocked ${e.blockedURI || "inline"}`);
    });
  });
  page.on("console", (m) => { if (m.type() === "error") problems.push(`console: ${m.text()}`); });
  page.on("pageerror", (e) => problems.push(`page error: ${e.message}`));
  page.on("request", (r) => {
    const url = r.url();
    if (url.startsWith("data:")) return;
    if (new URL(url).origin !== origin) problems.push(`third-party request: ${url}`);
  });
  page.on("requestfailed", (r) => problems.push(`request failed: ${r.url()} (${r.failure()?.errorText})`));
  page.on("response", (r) => { if (r.status() >= 400 && !r.url().endsWith("/404.html") && path !== "/404.html") problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 0) problems.push(`scrolls sideways by ${overflow}px`);
  if (engine === browser && (js || width === 1440)) {
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
    for (const v of axe.violations) {
      const line = `axe ${v.impact} ${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0].target.join(" ")}`;
      if (v.impact === "serious" || v.impact === "critical") problems.push(line);
      else console.log(`  note ${path} @${width}${js ? "" : " no-js"}: ${line}`);
    }
  }
  await context.close();
  const label = `${path} @${width}${js ? "" : " no-js"}${engine === safari ? " webkit" : ""}`;
  for (const p of problems) fail(`${label}: ${p}`);
  return problems.length;
}

// axe on the no-JS state. axe itself needs JavaScript (javaScriptEnabled:false hangs it), so
// instead the site's own scripts are answered with an empty body and every <noscript> in the
// page is unwrapped, which is what a browser with JavaScript off shows.
async function auditNoJsAxe(path, width = 390) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  await context.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin === origin && url.pathname.startsWith("/assets/js/")) {
      return route.fulfill({ status: 200, contentType: "text/javascript", body: "" });
    }
    if (req.resourceType() === "document" && url.origin === origin) {
      const response = await route.fetch();
      const body = (await response.text()).replace(/<noscript>([\s\S]*?)<\/noscript>/gi, "$1");
      return route.fulfill({ response, body });
    }
    return route.continue();
  });
  const page = await context.newPage();
  const problems = [];
  page.on("console", (m) => { if (m.type() === "error" && !(path === "/404.html" && /404/.test(m.text()))) problems.push(`console: ${m.text()}`); });
  page.on("pageerror", (e) => problems.push(`page error: ${e.message}`));
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const noJsCss = await page.evaluate(() => [...document.styleSheets].some((s) => (s.href || "").includes("/assets/css/no-js.css")));
  if (!noJsCss) problems.push("no-js.css did not load after unwrapping <noscript>");
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
  for (const v of axe.violations) {
    const line = `axe ${v.impact} ${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0].target.join(" ")}`;
    if (v.impact === "serious" || v.impact === "critical") problems.push(line);
    else console.log(`  note ${path} @${width} no-js axe: ${line}`);
  }
  await context.close();
  for (const p of problems) fail(`${path} @${width} no-js (axe): ${p}`);
}

for (const path of pages) {
  for (const width of [1440, 390, 360]) await audit(path, { width, js: true });
  await audit(path, { width: 390, js: false });
  await auditNoJsAxe(path, 390);
  await audit(path, { width: 1440, js: true, engine: safari });
  await audit(path, { width: 390, js: true, engine: safari });
}

// Redirect pages land where they should.
const ctx = await browser.newContext();
const page = await ctx.newPage();
for (const [oldPath, newPath] of Object.entries(site.redirects)) {
  await page.goto(BASE + oldPath);
  await page.waitForURL((u) => u.pathname === newPath.split("#")[0], { timeout: 5000 }).catch(() => {});
  const now = new URL(page.url());
  if (now.pathname + now.hash !== newPath) fail(`redirect ${oldPath} landed on ${now.pathname}${now.hash}, expected ${newPath}`);
}
await ctx.close();

// Mobile menu: keyboard operable, Escape closes, aria-expanded tracks state.
{
  const c = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const p = await c.newPage();
  await p.goto(BASE + "/");
  const toggle = p.locator(".menu-toggle");
  if (!(await toggle.isVisible())) fail("menu button not visible at 390px");
  await toggle.focus();
  await p.keyboard.press("Enter");
  if ((await toggle.getAttribute("aria-expanded")) !== "true") fail("menu does not open with Enter");
  if (!(await p.locator(".site-nav a").first().isVisible())) fail("nav links not visible when menu open");
  await p.keyboard.press("Escape");
  if ((await toggle.getAttribute("aria-expanded")) !== "false") fail("Escape does not close menu");
  await c.close();
}

await browser.close();
await safari.close();
console.log(failures ? `\n${failures} failure(s)` : "\nall browser checks passed");
process.exit(failures ? 1 : 0);
