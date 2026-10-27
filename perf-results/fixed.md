# Performance: fixed

URL: http://localhost:3000/ (Nuxt dev server, `nuxt dev`, HMR; images from movies-proxy.vercel.app)
Branch: `feat/agent-skills`, with the fixes below applied on top of the regressed state.
Conditions identical to baseline and regressed: viewport 1350x900, CPU 4x, Fast 4G, cold load (reload, cache disabled).

Differences from the earlier reference runs, as required by the new protocol:
- Load traces were kept running for 10 s after the reload (earlier runs auto-stopped, about 6 to 8 s).
- INP was measured with 3 "Scroll right" clicks on the first carousel followed by 3 clicks on a movie card (navigation prevented so the page stays put), per run, 3 runs.
- Dev-mode absolute numbers are inflated. Compare columns against each other, not against production.
- The `DIV#app-scroller` grid shift (the sidebar `NavBar` is parsed last, so the scroller moves from x=0 to x=70) is a known dev-mode artifact. It scores up to 1.0 in the tool-reported CLS. I report CLS both as the tool reports it and excluding that shift.

## 1. Core Web Vitals, 3 cold loads vs baseline and regressed

| Metric | Run 1 | Run 2 | Run 3 | **Fixed median** | Baseline median | Regressed median |
|---|---|---|---|---|---|---|
| TTFB (ms) | 29 | 22 | 21 | **22** | 24.8 | 1262.3 |
| FCP (ms) | 947 | 921 | 916 | **921** | 916 | 2968 |
| LCP (ms) | 947 | 921 | 916 | **921** | 972 | 2966 |
| CLS, tool-reported | 0.16 | 1.00 | 1.00 | **1.00** | 1.00 | 0.05 |
| CLS, excluding the `#app-scroller` artifact | 0.0018 | 0.0013 | 0.0013 | **0.0013** | about 0 | not isolated |

TTFB, FCP, LCP and tool-reported CLS come from the trace (FCP from the raw trace main-frame navigation). The ex-artifact CLS is summed from the raw trace layout-shift events, leaving out the one navigation event in which `#app-scroller` moves from x=0 to x=70.

For reference, the first held-trace measurement of the regressed code at the start of this work (single run) was: TTFB 1251 ms, LCP 10,722 ms (9,184 ms load delay), CLS 0.38 reported. The regressed.md medians above come from auto-stopped traces, which finish before the late LCP candidate appears.

## 2. LCP element and sub-parts

LCP element in run 1: hero `<img>`, `https://movies-proxy.vercel.app/ipx/f_webp&s_1220x659/tmdb/r08LxMJCbf1SiJIWeyH9aJmdqwC.jpg` (webp, discoverable from the HTML, `fetchpriority="high"`, matching preload). In runs 2 and 3 the LCP insight reported no network-resource sub-parts, only TTFB and render delay, so the LCP paint coincides with FCP.

| Sub-part | Run 1 | Run 2 | Run 3 | Baseline median | Regressed median |
|---|---|---|---|---|---|
| TTFB | 29 | 22 | 21 | 25 | 1262 |
| Resource load delay | 161 | n/a | n/a | 163 | 29 |
| Resource load duration | 307 | n/a | n/a | 308 | 256 |
| Element render delay | 449 | 898 | 895 | 477 | 1420 |
| **Total LCP (ms)** | 947 | 921 | 916 | 972 | 2966 |

n/a: the insight did not report a load-delay or load-duration sub-part for that run.

## 3. Layout shifts

Raw-trace shift events (times relative to navigation start):

| Run | Time (ms) | Score | Elements that moved | Note |
|---|---|---|---|---|
| 1 | about 1028 | 0.1602 | `DIV#app-scroller` x 0 to 70, hero and carousel `DIV`s | Same sidebar-arrival event, caught with more content painted |
| 1 | about 1377 | 0.0018 | footer `DIV`s, `#text`/`SPAN` (font swap) | Real shift, tiny |
| 2 | about 1 s | 1.0000 | `DIV#app-scroller` | Known artifact only |
| 2 | later | 0.0013 | footer `DIV`s, `#text`/`SPAN`, `IMG` (footer logo) | Real shift, tiny |
| 3 | about 1 s | 1.0000 | `DIV#app-scroller` | Known artifact only |
| 3 | later | 0.0013 | footer `DIV`s, `#text`/`SPAN`, `IMG` | Real shift, tiny |

Before the CLS fix, a raw trace of the previous state showed two extra shifts right after first paint: 0.3048 and 0.2091 (about 0.51 together), on top of the artifact. The three held-trace runs of that state were tool-reported 1.50, 1.39 and 1.27, so about 0.50, 0.39 and 0.27 without the artifact (derived as reported minus 1.00). The promo banner shift (hero and carousels moving down 77 px, 0.0541) is also gone.

## 4. INP (no reload: 3 clicks on "Scroll right" of the first carousel, then 3 clicks on a movie card)

Raw-trace EventTiming, worst click of each type per run:

| Interaction | Run 1 total (input / processing / presentation) | Run 2 | Run 3 | **Fixed median** | Before this fix (start of INP round, 1 run) | Regressed (single clicks) |
|---|---|---|---|---|---|---|
| Scroll right | 38 ms (8 / 3 / 27) | 33 ms (6 / 1 / 26) | 33 ms (5 / 2 / 26) | **33 ms** | 75 ms (11 / 22 / 41) | 198 ms (trace), 72 ms (script) |
| Movie card | 34 ms (9 / 2 / 23) | 24 ms (6 / 1 / 16) | 25 ms (7 / 1 / 16) | **25 ms** | 32 ms (10 / 1 / 21) | 75 ms (trace), 56 ms (script) |

| Metric | Run 1 | Run 2 | Run 3 | **Fixed median** | Baseline | Regressed |
|---|---|---|---|---|---|---|
| INP, trace (ms) | 38 | 33 | 33 | **33** | 76 | 198 |

The heatmap vendor handler cannot load in this environment (it is injected from `127.0.0.1:3000`, but the dev server only listens on `::1`), so it was not in any measured run. I tested it separately by injecting it into the page:

| Handler | One "Scroll right" click |
|---|---|
| Old (snapshot plus 300 ms busy loop inside the click) | 336 ms (4 / 306 / 26) |
| New (`public/vendor/heatmap.js`, work after next paint in 20 ms slices) | 40 ms (5 / 3 / 32), `window.__heatmap` still set |

## 5. DOM size and transfer

| Item | Fixed | Baseline | Regressed |
|---|---|---|---|
| DOM elements | 556 | 510 | 6787 |
| Max DOM depth | 14 | 14 | 14 |
| HTML document transfer | 82,581 B (≈81 KiB) | 61,333 B | 594,118 B |
| Browser-reported transfer | 570,388 B | 530,062 B | ≈923,700 B |
| Cross-origin image bytes (20 images from movies-proxy, `transferSize = 0`), measured with curl | 332,204 B (≈324 KiB) | 652,468 B (19 images) | 334,584 B (20 images) |
| **Total transferred (approx.)** | **≈902,600 B (≈0.86 MiB)** | ≈1,182,500 B (≈1.13 MiB) | ≈1,258,300 B (≈1.20 MiB) |
| Requests (Resource Timing) | 250 | 250 | 250 |

The Resource Timing buffer is capped at 250 entries and the dev server serves about 230 separate module files, so the request count is a cap, not a real count. As before, cross-origin images report 0 bytes (no `Timing-Allow-Origin`), so their sizes were measured with curl and the totals are estimates.

## Fixes (root cause → change → measured impact)

1. **Slow CMS call on the SSR critical path (TTFB).** `/api/featured` (1.2 s upstream) was awaited before the hero and carousel data → the endpoint is now a cached handler (`defineCachedEventHandler`, stale-while-revalidate) and the page calls it with a 300 ms timeout and falls back to the default list → TTFB 1262 ms to 22 ms.
2. **Page hidden until a vendor script returns (FCP and LCP).** The A/B anti-flicker snippet kept `<html>` at `opacity: 0` until `/ab/experiments.js` (1.5 s server delay) finished, and the first paint was at 2992 ms, right after it → the hiding snippet and style are removed, and the A/B script stays `async` with `fetchpriority="low"` → FCP 2968 ms to 921 ms.
3. **Hero image discovered at 10.4 s (LCP).** The hero was `ClientOnly` with a CSS `background-image` on an unsized `ipx/_/` JPEG, and a manual preload pointed at a different URL → the hero is server-rendered `<NuxtImg>` again with `fetchpriority="high"` and a matching preload (`preload: { fetchPriority: 'high' }`), the `ClientOnly` wrapper and manual `useHead` preload are removed → on the held-trace run LCP 10,722 ms to a median of 921 ms (the "discoverable in initial document" check no longer fails).
4. **60k-item ticker blocking hydration (LCP, INP).** The `live-updates` plugin built a 60,000-item JSON snapshot and parsed and sorted it every second on the main thread (the sort result was unused) → the work moved to a Web Worker started after `app:suspense:resolve`, with no sort → removes a 1029 ms hydration frame that included the snapshot build, and the 170 ms per-second interval task.
5. **Promo banner inserted after mount (CLS).** It was fetched in `onMounted` (800 ms upstream) and inserted above the hero with no reserved space, shifting hero and carousels by 77 px (0.0541) → the banner is fetched during SSR through a cached endpoint (500 ms timeout), so it is in the initial HTML → shift gone.
6. **HTML and DOM bloat (CLS, INP, transfer).** Each carousel rendered 3 pages (60 cards) plus one `<span>` per word of every overview for a hover effect that animated nothing, giving a 594 KB document and 6787 elements. The `NavBar` sits at the end of that document, so the browser painted a partial page and then re-laid it out (0.51 of CLS) → one page is rendered upfront and the next pages load when the user is within three screens of the end of the row, and the quick view is a single text node → HTML 594 KB to 82 KB, DOM 6787 to 556, non-artifact CLS 0.51 to 0.0013.
7. **Layout thrashing on every carousel scroll click (INP).** `equalizeCardHeights` wrote `minHeight` and read `offsetHeight` for every card (forced layout per card); cards are flex items and already stretch to equal height → function and `data-card` removed → scroll-click processing time 22 to 39 ms down to 1 to 3 ms, INP 75 ms to 33 ms.
8. **Heatmap vendor blocking clicks (INP).** The click handler snapshotted the document and busy-looped 300 ms inside the interaction → it now records the pointer position immediately and does the snapshot work after the next paint in 20 ms slices that yield to the main thread, and the loader injects the script after the `load` event when idle with `fetchPriority = 'low'` → 336 ms to 40 ms on a click when the vendor is loaded (not loadable in this environment, so not in the measured medians).

## Trade-offs and caveats

- **Anti-flicker removal (fix 2):** an A/B experiment that changes visible content can flash the original content briefly. Bringing it back would need a scoped hide (only the experiment's target element, with a short timeout), not a full-page hide.
- **Server caches (fixes 1 and 5):** the first request after a server start, or after the cache expires and cannot be served stale, still waits up to the timeout (300 ms and 500 ms) and then renders without the editorial config or promo banner for that visitor. Later visitors get them from cache. TTFB in the fixed runs reflects a warm cache.
- **Heatmap (fix 8):** the snapshot is now taken after the next paint, so it can differ slightly from the page at the exact moment of the click. The recorded values are unchanged in shape.
- **Carousel (fix 6):** the next pages load on scroll, so on a very slow network a fast scroller could briefly reach the end of the loaded cards.
- **Not changed:** the `#app-scroller` grid shift (left alone as instructed), the Bungee card-title font (its swap showed no measurable shift), and `app.vue`.
- **Not verified:** `pnpm lint` and `pnpm typecheck` were run after round 1 (typecheck needed a type fix, then both passed with only two pre-existing `prefer-const` warnings in `public/vendor/heatmap.js`, which the heatmap rewrite also removes). After rounds 2 and 3 the checks were skipped at your request.
- **Not testable here:** the third-party heatmap origin (`127.0.0.1:3000` against a server listening on `::1`).
