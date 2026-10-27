You are fixing web performance regressions on this branch.

The Nuxt dev server is already running at http://localhost:3000 with HMR.

Use the Chrome DevTools MCP for evidence, the webperf skills
(webperf-core-web-vitals, webperf-loading, webperf-media, webperf-interaction)
for diagnosis, and the modern-web-guidance skill before writing any
HTML/CSS/JS fix.

Measurement protocol (identical every time, same as the reference files):
- Viewport 1350x900, CPU 4x, network Fast 4G, cold load, cache disabled
- Keep the load trace running until the page settles (at least 10 s)
- INP: without reload, click "Scroll right" on the first carousel, then a movie
  card (prevent navigation if needed), 3 times each
- Median of 3 runs

Dev-mode caveats: absolute numbers are inflated by the dev server, so compare
against regressed.md (same dev server), not production expectations. The CLS
1.0 shift on #app-scroller in baseline.md is a dev-mode artifact; ignore it.

Work in three rounds, in this order: LCP, then CLS, then INP.
For each round:
1. MEASURE: record the current numbers.
2. INVESTIGATE: find the root cause in the trace (LCP sub-parts, layout-shift
   sources, interaction phases, script attribution). State your hypothesis and
   the evidence BEFORE editing code.
3. FIX: consult modern-web-guidance, then fix the root cause in the code.
4. VERIFY: cold reload, re-measure with the exact protocol above and show a
   before/after table. If the metric did not improve, revert and try again.
   Note when fixing one metric reveals or worsens another.

Rules:
- Fix the root causes, do not hide symptoms or game the measurement.
- Keep user-facing features (promo banner, hero, carousels, card quick view,
  trending ticker, A/B testing and heatmap vendors). You may change HOW and
  WHEN they load or run. If you remove something, justify it as a deliberate
  trade-off.