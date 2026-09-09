# Dattamsha website

Marketing site for Dattamsha Data Labs and the Anvaya platform.
Served by GitHub Pages at **https://www.dattamsha.co.in** (`CNAME`), straight from `main`.

Hand-written static HTML. **No build step, no templating, no dependencies** — what is in the
repo is what ships. Open a page in a browser to preview it; push to `main` to deploy.

## Layout

```
index.html            Home
platform.html         How the loop works
about.html            Company
pricing.html          Plans
security.html         Security and data protection
contact.html          Demo request form
404.html              Not-found page
products/             sangam · sutradhar · gargi · margdarshak · phala
regions/              india · malaysia · uae
assets/site.css       All styling (171 lines, no framework)
assets/site.js        Menu, sign-in dropdown, frame-busting, contact form
assets/fonts.css      Self-hosted Newsreader + Tiro Devanagari Sanskrit subsets
assets/fonts/         .woff2 files
sitemap.xml           14 URLs — every page except 404.html
robots.txt            Allow all, points at the sitemap
.well-known/          security.txt (expires 2027-09-06)
.nojekyll             Stops GitHub Pages running Jekyll over the tree
```

## The one convention that matters

**The header nav and the footer are duplicated verbatim in all 15 HTML pages.** There is no
partial or include to edit. Changing either means a tree-wide find-and-replace, and the
markup must stay byte-identical across files so the next replace still matches:

```sh
perl -pi -e 's{OLD}{NEW}g' $(grep -rl 'OLD' . --include='*.html')
grep -rc 'NEW' . --include='*.html' | grep -v ':0'   # expect 15 files
```

Root pages link with `href="products/gargi.html"`; pages inside `products/` and `regions/`
use `../`. External links (sign-in, Formspree) are absolute, so they are identical everywhere.

## Sign-in links

Live in three places per product: the header **Sign in** dropdown, the footer **Sign in**
list, and a hero button on the product's own page.

| Product | URL |
| --- | --- |
| Sutradhar | `https://sutradhar.dattamsha.co.in/login` |
| Margdarshak | `https://margdarshak.dattamsha.co.in/login` |
| Gargi | `https://gargi.dattamsha.co.in/` |

Sangam and Phala have no sign-in — they are platform stages, not separate apps.
Every external link carries `target="_blank" rel="noopener"`; keep the `rel`, it blocks
reverse-tabnabbing (an opened page can otherwise navigate this one via `window.opener`).

## Security posture

GitHub Pages cannot send custom response headers, so the protections live in the pages:

- A **CSP `<meta>` tag in the `<head>` of every page.** It is `default-src 'self'` — no CDNs,
  no inline script, no inline style. Fonts, CSS and JS are all self-hosted for this reason.
  Formspree is allow-listed in `form-action` and `connect-src` only.
  Adding any third-party asset means editing that meta tag in all 15 pages, or it is blocked
  silently.
- `assets/site.js` opens with a **frame-buster**, standing in for `X-Frame-Options`.
- `<meta name="referrer" content="strict-origin-when-cross-origin">` on every page.

## Contact form

`contact.html` posts to Formspree. `assets/site.js` submits it with `fetch` so the visitor
stays on the page and sees an inline confirmation; if `fetch` or the network fails it falls
back to the browser's native POST to the same endpoint. A honeypot field catches bots, and
`_replyto` is mirrored from the email input on every keystroke so replies go to the sender.

## Adding a page

1. Copy the nearest existing page — it carries the nav, footer, CSP and referrer meta.
2. Fix relative paths (`../` inside `products/` and `regions/`).
3. Update `<title>`, `<meta name="description">`, `<link rel="canonical">` and the `og:` tags.
   Descriptions are kept at roughly 150–160 characters.
4. Add the URL to `sitemap.xml`.
5. If it belongs in the nav or footer, add it to **all 15 pages**, not just the new one.
