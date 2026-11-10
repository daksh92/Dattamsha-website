# Dattamsha website

Marketing site for Dattamsha Data Labs, served by GitHub Pages at
**https://www.dattamsha.co.in** (`CNAME`), straight from `main`. Plain static HTML, one
CSS file and a little vanilla JavaScript. No framework, no third-party requests.

## How it is built

Page content lives in `src/`. A small build script (Python standard library only) writes the
served files at the repo root. **The generated files are committed**, because Pages serves this
branch exactly as it is.

```sh
python3 tools/build.py           # regenerate everything after editing src/ (or assets/js, no-js.css)
python3 tools/build.py --check   # change nothing; fail on any problem listed under "Checks"
python3 -m http.server 8000      # preview at http://localhost:8000
```

What the build does, in order:

1. Wraps each page in `src/pages/` with the shared head, header and footer, and stamps
   `{{key}}` values from `src/config.json` and `src/pages.json`. An unknown key, or any `{{`
   left in a page, stops the build. Config values are HTML-escaped (JSON-escaped inside the
   JSON-LD block), a `{{key}}` in a single-quoted attribute stops the build, as do a
   `booking_url` that is not https://, a malformed email, or two pages or redirects that
   write the same file.
2. Expands each motif placeholder (`<div class="motif motif--gargi motif--16" aria-hidden="true"></div>`)
   into the design's **inline SVG pattern band**, drawn from the tile in `src/motifs/<name>.svg`.
   A placeholder written in any other form (attribute order, extra attributes) stops the build
   rather than leaving an empty band.
3. Puts **™ after the first visible mention** of each name in the `trademarks` list in
   `src/config.json`, page by page. It never marks attribute values, `<head>`, scripts, SVG,
   code, form fields, `<template>`, `<noscript>`, `<option>`, `.visually-hidden` text, or
   anything inside an element with `hidden`, `data-no-tm`, `data-steps` or `data-answer-box`
   (the last two are the home-page demo regions that `home.js` hides or replaces at load).
   Add `data-no-tm` to any element whose mentions should not get the mark.
4. Adds `?v=<content hash>` to every `/assets/css/*.css` and `/assets/js/*.js` URL, so a
   deploy never pairs new HTML with a cached old stylesheet or script. Editing a JS file
   therefore changes every page that loads it: rebuild after editing `assets/js/`.
5. Writes `assets/css/site.css` (CSS custom properties from `src/tokens.json`, then
   `src/css/*.css` in name order), the redirect pages for retired URLs, `sitemap.xml`,
   `robots.txt` and `.well-known/security.txt`.

Never edit a generated file directly. Generated HTML pages and `site.css` start with a comment
saying so; `robots.txt`, `sitemap.xml` and `security.txt` do not (their formats have no room
for one), but they are generated all the same.

```
src/config.json        Site URL, booking URL, contact email, phone, founding date, CSP,
                       security.txt expiry, trademark list. Stamped into pages as {{key}}.
                       The email is still written out by hand in src/pages/privacy.html.
src/pages.json         Every page (URL, title, meta description, scripts) and every redirect
src/pages/*.html       The <main> content of each page
src/partials/          head, header, footer, home-page JSON-LD
src/css/*.css          Joined in order into assets/css/site.css (tokens first)
src/tokens.json        Design tokens (Dattamsha design system v2) → CSS custom properties
src/motifs/*.svg       Craft motif tiles → inlined as SVG pattern bands in each page
assets/css/no-js.css   Hand-written (not generated): loaded only through <noscript>
assets/js/site.js      Mobile menu, frame-busting (every page)
assets/js/home.js      The Ask Gargi and Birbal panels on the home page (scripted demo)
assets/js/book.js      Book page: builds the "leave your question" mail link
assets/fonts/          Subset fonts (SIL OFL); rebuild with tools/subset_fonts.py
assets/img/            Share image and touch icon; rebuild with node tools/share/render.mjs
```

## Checks

`npm ci` installs the dev-only tools (Playwright, axe-core, html-validate); nothing in
`node_modules` ships. `lychee` comes from Homebrew. With a local server running:

```sh
tools/checks/run_all.sh                         # HTML validation, links, browser checks, build check
node tools/checks/screens.mjs                   # screenshots at 1440 and 390 px into _review/
python3 -I tools/checks/copy_check.py           # words on each page vs the approved design
```

- **HTML validation**: html-validate on every served page.
- **Links**: lychee, offline, including `#fragment` links (`--include-fragments --index-files index.html`).
  Links that are still a `[PLACEHOLDER]` are left to the build check.
- **Browser checks** (`site_checks.mjs`): axe-core (WCAG 2.1 AA) with JavaScript at 1440/390/360
  px and in the no-JS state at 390 px (site scripts blocked, `<noscript>` unwrapped so
  `no-js.css` loads); any CSP violation or console error; any request to another origin;
  sideways scrolling; redirect pages; the mobile menu by keyboard. WebKit loads every page too.
- **Build check** (`build.py --check`): generated files are current; no orphaned generated
  pages; no `{{` left; no plain `http://` links; no ™ inside an attribute; **no client
  names** in any generated file, `src/`, `assets/js/`, `no-js.css`, this README or
  `tools/share/` (checked against SHA-256 hashes in `tools/build.py`, so the names themselves
  are not in the repo; the report gives file and line, never the word); `security.txt` not
  expired (a warning from 60 days before); and no `[PLACEHOLDER]` showing on a page.

**The build check, `run_all.sh` and CI fail on purpose until the pending placeholders are
filled in** (today `[CIN]` and `[YOUR OWN LINE HERE]` on About, `[BOOKING URL]` in
`src/config.json`). Only the site owner can supply these, and the failure keeps a placeholder
from going live unnoticed. Every other check still runs and reports: the build check runs
last, and in CI every step runs even when an earlier one fails
(`.github/workflows/checks.yml`, read-only; it does not deploy).

`copy_check.py` compares against the design files, which still contain client names that were
removed from the site until legal approval. It prints those spots as
`[client name removed on purpose]` and counts them separately: never restore them.

### Pixel comparison (needs the handoff pack)

These dev scripts compare our renders with the approved design. They are not part of CI.

```sh
python3 -m pip install -r tools/requirements-dev.txt    # numpy, Pillow
node tools/checks/render_design.mjs [Name ...]          # design renders into _review/truth/
python3 -I tools/checks/diff_truth.py [Name ...]        # 1440 px diff against _review/truth/
```

- Need the handoff pack (`~/dattamsha-handoff`, or set `DATTAMSHA_HANDOFF=/path/to/pack`):
  `copy_check.py` (`source/`), `compare.py` and `diff_map.py` (`reference/`).
- Need the untracked `_review/truth/` folder (design sources and the captured Google Fonts
  CSS): `render_design.mjs`, `diff_truth.py`. Never publish `_review/`.

### Lighthouse (manual)

Not run in CI. Use Lighthouse 12.6.1 or later (12.2.1 errors on six audits with Playwright's
Chromium) on the default mobile profile, with Playwright's Chromium:

```sh
CHROME_PATH="$(node -e 'console.log(require("playwright").chromium.executablePath())')" \
  npx -y lighthouse@12.6.1 http://localhost:8000/ --chrome-flags="--headless=new" \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=html --output-path=_review/lighthouse-home.html
```

Latest scores (target ≥ 95 in every category): home 97, every other page 98–100. The 404
page scores 63 on SEO by design, because it is `noindex`.

## Deploying

With `.nojekyll`, **GitHub Pages serves every committed file**, not just the site: `src/`,
`tools/`, `README.md`, `package.json` and `.github/` are all reachable on the live domain.
Nothing in them is secret (the repository is public), and `robots.txt` asks crawlers to skip
`/src/`, `/tools/` and `/.github/`, but the clean fix is to publish only the built output. That
needs a decision on the Pages settings (serve a build folder, or deploy through a Pages
Actions workflow), so it has not been changed.

When the site moves to Caddy, publish **only** these paths (for example
`git archive HEAD <paths> | tar -x -C /srv/site`, or rsync with this include list; never rsync
the working copy, which holds the untracked `_review/` design files):

```
index.html  404.html  favicon.svg  robots.txt  sitemap.xml  CNAME (optional)
about/  book/  clients/  how-we-work/  monday-brief/  platform/  privacy/  sign-in/  trust/
about.html  contact.html  platform.html  pricing.html  security.html  products/  regions/
assets/  .well-known/
```

On Caddy, `encode zstd gzip`, and cache `/assets/css/*` and `/assets/js/*` for a year with
`immutable` (their URLs change with their content). Fonts and images are not versioned: keep
them, and the HTML, on a short max-age, or rename a file when it changes.

## Security and privacy on GitHub Pages

Pages cannot send response headers, so the protections live in each page: a strict
`Content-Security-Policy` meta tag (no inline script or style, nothing from other origins),
`strict-origin-when-cross-origin` referrers, and a frame-buster in `site.js`. There are no
cookies, trackers or analytics. A commented hook in `src/partials/head.html` marks where a
self-hosted Umami script can go later.

Not possible on Pages (add these when the site moves behind Caddy): HSTS,
`frame-ancestors` / `X-Frame-Options`, `Permissions-Policy`, CSP as a header with reporting,
and real 301 redirects in place of the redirect pages listed in `src/pages.json`.

## Fonts and licences

Fraunces, DM Sans and Noto Serif Devanagari, self-hosted under the SIL Open Font License
(`tools/fonts-src/OFL.txt`). After adding copy with new characters (new Devanagari words in
particular), run `.venv/bin/python tools/subset_fonts.py` (needs `tools/requirements.txt`).
