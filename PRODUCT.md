# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A mixed audience, with no single primary visitor:

- Companies and event organizers weighing Jose for AI adoption work, talks, or workshops.
- Peers (tech leads, engineers) who follow his thinking on LinkedIn.
- Employers and recruiters judging him for a role.

The page must work for all three in one pass: who he is, what he believes about AI, and proof that he has done it.

## Product Purpose

A single-page personal profile for Jose Gayondato, AI Adoption Lead at Mandrill Tech. It exists to make one stance memorable and credible, then turn the visitor into a LinkedIn follower.

Success: the visitor follows Jose on LinkedIn. GitHub and email are secondary routes.

## Positioning

"AI doesn't replace your experts. It magnifies them." The claim rests on a decade of enterprise Java and five years leading delivery teams: he knows the shape of what needs building, so he can tell when AI is right and when it is confidently wrong. This is a practitioner's view of adoption, not a hype or tooling pitch.

## Operating Context

- Open question: where visitors arrive from, and what share use mobile. Not confirmed; do not assume.
- Sections today: hero, About, Approach (four principles), Talks & workshops, Connect.
- Hosted on GitHub Pages at https://onitsujj.github.io/.

## Capabilities and Constraints

- Stack: Vite, vanilla JS, GSAP (ScrollSmoother, reveals), and a vendored React Three Fiber + Rapier lanyard badge (`src/js/lanyard/`).
- A static badge image stands in when WebGL is unavailable, on mobile, and for crawlers.
- No automated tests by decision; verification is manual and visual (`docs/adr/0001-no-test-seam.md`).
- Structured data (schema.org Person / ProfilePage) lives in `src/index.html` and must stay in step with visible copy.
- Open decision: whether the copy voice is fixed. It is currently plain, first-person, and calm, but the user did not lock it.

## Brand Commitments

- The draggable 3D lanyard badge is a signature piece and stays.
- The title "AI Adoption Lead @ Mandrill Tech" and its link to https://www.mandrill.com.my/ stay in the hero.

## Evidence on Hand

- Talk: "Building AI-Driven Applications", Swinburne Week 5.0, INTI Subang, 2026, alongside Esther Chow. Photos in `src/assets/talk-swinburne-*.jpg` (web versions in `public/assets/`).
- Webinar: "How Finance Teams Build Management Dashboards in Minutes Using AI", 2026.
- Stat: 5 years leading teams to delivery; 10 years building enterprise systems.
- Portrait: `src/assets/profile.jpg`; badge art: `public/assets/card-badge.webp`.
- Absent, and must not be invented: client names or logos, testimonials, case-study metrics, audience numbers, press.

## Product Principles

1. Stance first. Every section should reinforce "magnify, don't replace".
2. Proof over claims. Show real talks and real experience; add nothing that cannot be shown.
3. One clear next step. The LinkedIn follow is the primary action; everything else is secondary.
4. Readable by three audiences at once. A client, a peer, and a recruiter should each find their answer without hunting.
