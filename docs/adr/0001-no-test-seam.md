# ADR 0001 — Defer a test seam and automated test suite

- **Status:** Accepted
- **Date:** 2026-06-29

## Context

This is a small, single-page personal profile site (Vite + vanilla JS + GSAP,
with a vendored React-three lanyard). An architecture review on 2026-06-29
noted that every animation module talks to the live DOM and the GSAP singleton
directly — the **interface is not the test surface, the DOM is**. No automated
tests exist; verification has always been manual and visual.

Making the logic testable (counter number formatting, flick-vs-tap detection,
the focus-trap index math, the keynote-scene phase sequencing) would mean
introducing a **seam**: injecting the elements and a GSAP handle into
`reveals.js`, `loader.js`, and `micro.js` so a recording stub can stand in for
GSAP, plus adding a toolchain (Vitest + happy-dom).

## Decision

We deliberately **do not** add a test seam or an automated test suite at this
time.

By the principle *one adapter = hypothetical seam, two = real*, there is
currently a single adapter — the real DOM/GSAP. A seam built for tests alone
would be hypothetical: the second adapter (the stub) only exists to justify the
first. At this scale the cost — a dependency-injection refactor across three
modules plus ongoing maintenance — outweighs the benefit. The site is small,
behavior is visually verifiable in a browser, and tests have been deferred by
choice from the start.

## Consequences

- The logic above stays reachable only through a real browser; verification
  remains manual/visual.
- **Revisit when** the site grows materially (more sections/features) or a real
  test suite becomes a goal in its own right.
- Future architecture reviews should not re-propose a test seam without one of
  those triggers — this ADR is the answer to "why no tests?".
