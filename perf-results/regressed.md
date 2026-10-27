# Performance: regressed

URL: http://localhost:3000/ (Nuxt dev server, `nuxt dev`, started 17:14; images from movies-proxy.vercel.app)
Branch: `feat/agent-skills` (baseline: `main`). No code modified by me.
Conditions identical to baseline: viewport 1350x900, CPU 4x, Fast 4G, cold load (reload, cache disabled).

This file replaces the earlier regressed values. The baseline column below is the current `baseline.md` (same dev server).

## 1. Core Web Vitals, 3 cold loads vs baseline

| Metric | Run 1 | Run 2 | Run 3 | **Median** | Baseline median | Change |
|---|---|---|---|---|---|---|
| TTFB (ms) | 1255.5 | 1269.1 | 1262.3 | **1262.3** | 24.8 | +1237 ms (~51x) |
| FCP (ms) | 3064 | 2904 | 2968 | **2968** | 916 | +2052 ms (3.2x) |
| LCP (ms) | 3064 | 2901 | 2966 | **2966** | 972 | +1994 ms (3.1x) |
| CLS | 0.05 | 0.00 | 0.05 | **0.05** | 1.00 | better (-0.95) |

TTFB and FCP come from the Navigation/Paint Timing entries after each trace. LCP and CLS come from the trace. FCP and LCP are within a few ms of each other in every run, because the first contentful paint is the same paint as the LCP element.

## 2. LCP element and sub-parts

LCP element (run 1): the first carousel card image, an `<img>` of `https://movies-proxy.vercel.app/ipx/f_webp&s_400x225/tmdb/bjiS5ipwxb9JFy3XRRN4OAilSeX.jpg` (image/webp, h2, priority Medium, not render-blocking, discovered from the HTML document). In the baseline the LCP element was the 1220x659 hero image.

| Sub-part | Run 1 | Run 2 | Run 3 | **Median** | % of median LCP | Baseline median |
|---|---|---|---|---|---|---|
| TTFB | 1255 | 1269 | 1262 | **1262** | 43% | 25 |
| Resource load delay | 38 | 21 | 29 | **29** | 1% | 163 |
| Resource load duration | 256 | 254 | 256 | **256** | 9% | 308 |
| Element render delay | 1515 | 1357 | 1420 | **1420** | 48% | 477 |
| **Total LCP (ms)** | 3064 | 2901 | 2966 | **2966** | | 972 |

In run 1 the image request was queued at 1293 ms and finished downloading at 1549 ms (79 ms download), but main thread processing of the response took 1373 ms, so the paint came late.

## 3. Layout shifts

| Run | # | Time (ms) | Score | Elements that moved | Likely cause per trace |
|---|---|---|---|---|---|
| 1 | 1 | 3430 | 0.0517 | `DIV#app-scroller` | Unsized `<img>` (carousel card image `s_400x225/.../bjiS5ipwxb9JFy3XRRN4OAilSeX.jpg`) |
| 2 | none | n/a | 0.00 | n/a | n/a (no layout-shift insight produced) |
| 3 | 1 | 3310 | 0.0517 | `DIV#app-scroller` | Same unsized `<img>` |

The baseline's 1.0 shift on `DIV#app-scroller` at about 0.75 to 0.95 s is not present on this branch. The remaining shift happens late, at 3.3 to 3.4 s.

## 4. INP (no reload: click "Scroll right" on first carousel, then click the Project Hail Mary card)

Trace (DevTools Performance panel), per interaction:

| Interaction | Total (ms) | Input delay | Processing | Presentation delay | Baseline total |
|---|---|---|---|---|---|
| Scroll right (`pointerdown`) | 198 | 6 | 115 | 77 | 76 (slowest of the trace) |
| Movie card (`pointerdown`) | 75 | 7 | 39 | 28 | not broken down |

webperf `INP.js` script (separate session), per interaction:

| Interaction | Total (ms) | Input delay | Processing | Presentation delay | Baseline total |
|---|---|---|---|---|---|
| Scroll right (`click → button > div`) | 72 | 4 | 35 | 33 | 24 |
| Movie card (`click → a > div.group > img`) | 56 | 4 | 32 | 19 | 56 |

- **INP (trace): 198 ms** (baseline 76 ms), just under the 200 ms "good" threshold.
- **INP (script): 72 ms** (baseline 56 ms), "good".
- Scroll right is the slower interaction on this branch. The card click is the same as baseline in the script session.
- As before, the trace and script sessions are not directly comparable.

## 5. DOM size and transfer

| Item | Regressed | Baseline |
|---|---|---|
| DOM elements | 6787 (DevTools trace: 6772) | 510 |
| Max DOM depth | 14 | 14 |
| Most children of one parent (DevTools) | 191 | not measured |
| Large layout updates (DevTools) | 83 to 99 ms, about 12,387 nodes needing layout | none flagged |
| Large style recalculations (DevTools) | 109 to 130 ms, about 6,730 elements | none flagged |
| Requests (Resource Timing) | 250 | 250 |
| HTML document transfer | 594,118 B (≈580 KiB) | 61,333 B |
| Browser-reported transfer | ≈923,700 B | 530,062 B |
| Cross-origin image bytes (20 images from movies-proxy, `transferSize = 0`), measured with curl | 334,584 B (≈327 KiB) | 652,468 B (19 images) |
| **Total transferred (approx.)** | **≈1,258,300 B (≈1.20 MiB)** | ≈1,182,500 B (≈1.13 MiB) |

The cross-origin total is an estimate: the browser reports 0 bytes for those images (no `Timing-Allow-Origin`), so I measured them separately with curl. About 203 same-origin dev-server module requests also report 0 bytes (cached or revalidated), so total transfer depends on the dev server's cache state.

## Other observations (no fixes proposed)

- DevTools DocumentLatency insight estimates FCP and LCP savings of about 1154 to 1168 ms and 397.9 kB of wasted bytes on the document (baseline: 0 ms, 40.9 kB).
- Render-blocking insight estimates 0 ms FCP savings in all three runs (baseline: 441 ms in run 1, 0 ms in runs 2 and 3).
- ImageDelivery insight estimates 32.3 kB of wasted bytes on load (baseline 49.3 kB).
- The trace includes the custom "nuxt" track from the Nuxt dev tooling, as in the baseline.
- Raw trace files were not saved because the MCP server only accepts paths inside the workspace.
