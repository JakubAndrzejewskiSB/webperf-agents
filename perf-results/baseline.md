# Performance baseline

URL: http://localhost:3000/ (Nuxt dev server, `nuxt dev`, started 17:14; images from movies-proxy.vercel.app)
Branch: `main`. No code modified.
Conditions: viewport 1350x900, CPU 4x, network Fast 4G, cold load (reload, cache disabled).

This file replaces the earlier baseline values, which were measured in a different server state (for example 47 requests and CLS about 0, versus 250 requests and CLS 1.00 now).

## 1. Core Web Vitals, per run and median (3 cold loads)

| Metric | Run 1 | Run 2 | Run 3 | **Median** |
|---|---|---|---|---|
| TTFB (ms) | 24.1 | 40.6 | 24.8 | **24.8** |
| FCP (ms) | 676 | 916 | 928 | **916** |
| LCP (ms) | 781 | 972 | 977 | **972** |
| CLS | 1.0050 | 1.00 | 1.0001 | **1.00** |

TTFB and FCP come from the Navigation/Paint Timing entries after each trace. LCP and CLS come from the trace. TTFB and FCP are read from a page script run after each trace, so run 1 values come from the run 1 page.

## 2. LCP element and sub-parts

LCP element: hero `<img>` (Spider-Man: Brand New Day backdrop), `https://movies-proxy.vercel.app/ipx/f_webp&s_1220x659/tmdb/r08LxMJCbf1SiJIWeyH9aJmdqwC.jpg` (image/webp, h2, priority Low, not render-blocking, discovered from the HTML document).

| Sub-part | Run 1 | Run 2 | Run 3 | **Median** | % of median LCP |
|---|---|---|---|---|---|
| TTFB | 24 | 41 | 25 | **25** | 3% |
| Resource load delay | 175 | 146 | 163 | **163** | 17% |
| Resource load duration | 308 | 308 | 305 | **308** | 32% |
| Element render delay | 273 | 477 | 485 | **477** | 49% |
| **Total LCP (ms)** | 781 | 972 | 977 | **972** | |

In run 1 the image request was queued at 199 ms, sent at 202 ms and finished downloading at 507 ms (131 ms download time, 106 ms main thread processing).

## 3. Layout shifts

Run 1 (cluster 705 to 2012 ms, cluster score 1.0050):

| # | Time (ms) | Score | Elements that moved | Likely cause per trace |
|---|---|---|---|---|
| 1 | 705 | 0.0049 | `DIV`, `P.mt-2 op80 leading-relaxed of-hidden line-clamp-3 md:line-clamp-5 text-xs md:text-base` (hero description) | none identified |
| 2 | 755 | 1.0000 | `DIV#app-scroller` | none identified |
| 3 | 1012 | 0.0001 | `#text`, `DIV`, `DIV`, `SPAN` | DM Sans woff2 loaded over the network; unsized `<img>` `/movies-sm.webp` |

Run 3 (cluster 954 to 2324 ms, cluster score 1.0001):

| # | Time (ms) | Score | Elements that moved | Likely cause per trace |
|---|---|---|---|---|
| 1 | 954 | 1.0000 | `DIV#app-scroller` | none identified |
| 2 | 1324 | 0.0001 | `#text`, `DIV`, `DIV`, `SPAN` | DM Sans woff2 loaded over the network; unsized `<img>` `/movies-sm.webp` |

Run 2 reports CLS 1.00 as well; its shifts were not inspected in detail. In every inspected run, one shift of 1.0 on `#app-scroller` accounts for essentially the whole score.

## 4. INP (no reload: click "Scroll right" on first carousel, then click the Project Hail Mary card)

Trace (DevTools Performance panel):

| Interaction | Total (ms) | Input delay | Processing | Presentation delay |
|---|---|---|---|---|
| Slowest interaction in the trace (`pointerdown`) | 76 | 5 | 43 | 28 |

The trace tool only breaks down its single longest interaction, so there is no separate trace breakdown for the second click.

webperf `INP.js` script (separate session), per interaction:

| Interaction | Total (ms) | Input delay | Processing | Presentation delay |
|---|---|---|---|---|
| Scroll right (`click → button > div`) | 24 | 4 | 2 | 18 |
| Movie card (`click → a > div.aspect-10/16 > img`) | 56 | 3 | 30 | 22 |

- **INP (trace): 76 ms.**
- **INP (script): 56 ms**, the movie card click. Both are under the 200 ms "good" threshold.
- The two sessions are not directly comparable, because the trace session includes tracing overhead and registers `pointerdown` events.

## 5. DOM size and transfer

| Item | Value |
|---|---|
| DOM elements | 510 (run 1: 501) |
| Max DOM depth | 14 |
| Requests (Resource Timing) | 250 (230 same-origin dev-server module requests) |
| HTML document transfer | 61,333 B (≈60 KiB) |
| Browser-reported transfer, runs 2 and 3 | 530,062 B (≈518 KiB) |
| Browser-reported transfer, run 1 | 6,566,350 B (≈6.26 MiB) |
| Cross-origin image bytes (19 images from movies-proxy, `transferSize = 0`), measured with curl | 652,468 B (≈637 KiB) |
| **Total transferred, runs 2 and 3 (approx.)** | **≈1,182,500 B (≈1.13 MiB)** |

Run 1 transferred far more because the dev server sent the Vite module files in full on that load. In runs 2 and 3, 199 of the same-origin module requests reported 0 bytes (served from the browser cache or revalidated), so the transfer total depends on the dev server's cache state. The median total across the three runs is about 1.13 MiB, taking run 1 as the outlier; run 1's image bytes were not measured.

The browser reports `transferSize = 0` for cross-origin images because the proxy sends no `Timing-Allow-Origin` header, so I measured their sizes with curl, and the total is an estimate.

## Other notes (observations only)

- DevTools render-blocking insight estimated FCP savings of 441 ms in run 1 and 0 ms in runs 2 and 3.
- ImageDelivery insight estimated 49.3 kB of wasted bytes on load.
- DocumentLatency insight estimated 40.9 kB of wasted bytes.
- The trace includes a custom "nuxt" track from the Nuxt dev tooling, which was not present before.
- The trace was not saved to disk because the MCP server only accepts paths inside the workspace.
