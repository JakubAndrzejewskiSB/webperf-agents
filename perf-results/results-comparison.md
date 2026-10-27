I fixed the LCP, CLS and INP regressions, and the results are in [perf-results/fixed.md](perf-results/fixed.md). Lint and typecheck were only run after round 1, where both passed. I skipped them for rounds 2 and 3 as you asked, so those changes are unchecked.

The numbers below are medians of 3 runs. The load runs held the trace for 10 s after a cold reload. For INP I clicked "Scroll right" 3 times and a movie card 3 times per run.

| | Baseline | Regressed | Fixed |
|---|---|---|---|
| TTFB | 24.8 ms | 1262 ms | 22 ms |
| FCP | 916 ms | 2968 ms | 921 ms |
| LCP | 972 ms | 2968 ms | 921 ms |
| CLS, tool-reported | 1.00 | 0.05 | 1.00 |
| CLS, excluding the `#app-scroller` artifact | about 0 | not isolated | 0.0013 |
| INP, trace | 76 ms | 198 ms | 33 ms |
| DOM elements | 510 | 6787 | 556 |
| HTML document | 61 KB | 594 KB | 82 KB |
| Total transfer (estimate) | about 1.13 MiB | about 1.20 MiB | about 0.86 MiB |

At the start of this work, a held 10 s trace of the regressed code gave LCP 10.7 s. The earlier regressed medians came from auto-stopped traces that end before that late LCP candidate appears.

**Root causes, by round**
- **LCP:**
  - The 1.2 s `/api/featured` call blocked server rendering.
  - The A/B anti-flicker snippet kept the page at `opacity: 0` until a vendor script returned, which gated first paint.
  - The hero was client-only and used a CSS background image, so the browser found it at 10.4 s.
  - The 60k-item trending ticker blocked hydration on the main thread.
- **CLS:**
  - The sidebar nav is last in the HTML, so a bloated 594 KB document got painted in part and then re-laid out (about 0.51 of CLS). Cutting the document to 82 KB removed those shifts.
  - The promo banner also fetched on the client and pushed the page down by 77 px.
- **INP:**
  - `equalizeCardHeights` forced a layout per card on every scroll click. The cards are flex items and already stretch to equal height, so I removed it.
  - The heatmap vendor script blocked clicks for 300 ms. Its handler now does the heavy work after the next paint, in short slices.

**Caveats**
- **Artifact:** the `#app-scroller` shift is the dev-mode artifact you told me to ignore. I left `app.vue` alone and report CLS both ways.
- **Heatmap:** it can't load here. It is injected from `127.0.0.1:3000` and the dev server only listens on `::1`, so it isn't in the measured numbers. I tested it by injecting it manually: one click went from 336 ms with the old handler to 40 ms with the new one.
- **Warm cache:** TTFB reflects a warm cache for the featured and promo endpoints. A first request after a cache miss waits up to 300 ms or 500 ms, then renders without that content.
- **Anti-flicker:** removing it means an A/B experiment that changes visible content could flash the original for a moment.
- **Request count:** the 250 requests in the table is the Resource Timing buffer cap, not a real count.

I removed the temporary raw traces from `perf-results/`.

### Modern Web Guidance
- **`optimize-image-priority`**: I put `fetchpriority="high"` on the hero image and used the matching `preload: { fetchPriority: 'high' }` option, replacing the manual preload whose URL never matched ("Always apply `fetchpriority="high"` to the LCP image").
- **`optimize-script-priority`**: I kept the A/B and heatmap vendor scripts `async` with `fetchpriority="low"` so they stay off the critical path ("Deprioritize scripts that are not required for the initial user experience").
- **`break-up-long-tasks`**: the heatmap work now runs in 20 ms slices using `scheduler.yield()` with a `setTimeout` fallback, so it can't block input ("Yield to the main thread periodically to keep the UI responsive").