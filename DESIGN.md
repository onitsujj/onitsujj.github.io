---
name: Jose Gayondato
description: A dark keynote stage with one cyan spotlight, for an AI Adoption Lead's profile.
colors:
  obsidian: "#0b0b0d"
  obsidian-raised: "#101013"
  hairline: "rgba(244, 241, 234, 0.10)"
  hairline-strong: "rgba(244, 241, 234, 0.18)"
  stage-white: "#f4f1ea"
  body-ash: "#c9c5bc"
  muted-stone: "#9a958c"
  spotlight-cyan: "#1cbdd4"
  spotlight-cyan-press: "#179bae"
  spotlight-haze: "rgba(28, 189, 212, 0.14)"
  spotlight-line: "rgba(28, 189, 212, 0.32)"
  on-cyan: "#04222a"
typography:
  display:
    fontFamily: "Space Grotesk, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(48px, 6vw, 92px)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Space Grotesk, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(30px, 3.4vw, 48px)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Space Grotesk, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(20px, 1.6vw, 26px)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  stat:
    fontFamily: "Space Grotesk, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(40px, 4vw, 64px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  lead:
    fontFamily: "Libre Franklin, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(19px, 1.5vw, 22px)"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Libre Franklin, system-ui, -apple-system, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.7
  body-sm:
    fontFamily: "Libre Franklin, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Space Mono, ui-monospace, SF Mono, monospace"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "0.16em"
  control:
    fontFamily: "Space Mono, ui-monospace, SF Mono, monospace"
    fontSize: "13px"
    fontWeight: 400
    letterSpacing: "0.04em"
rounded:
  thumb: "6px"
  sm: "8px"
  pill: "50%"
spacing:
  "1": "8px"
  "2": "16px"
  "3": "24px"
  "4": "40px"
  "5": "64px"
  gutter: "clamp(20px, 4vw, 40px)"
  section-y: "clamp(96px, 12vh, 160px)"
  maxw: "1180px"
components:
  button-primary:
    backgroundColor: "{colors.spotlight-cyan}"
    textColor: "{colors.on-cyan}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "14px 22px"
  button-primary-hover:
    backgroundColor: "{colors.spotlight-cyan-press}"
    textColor: "{colors.on-cyan}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.stage-white}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "14px 22px"
  button-ghost-hover:
    textColor: "{colors.spotlight-cyan}"
  brand-mark:
    backgroundColor: "{colors.spotlight-cyan}"
    textColor: "{colors.on-cyan}"
    rounded: "{rounded.sm}"
    size: "34px"
  nav-link:
    textColor: "{colors.muted-stone}"
    typography: "{typography.control}"
  nav-link-active:
    textColor: "{colors.stage-white}"
  row-card:
    backgroundColor: "transparent"
    padding: "40px 0"
  lightbox-control:
    backgroundColor: "rgba(255, 255, 255, 0.05)"
    textColor: "{colors.stage-white}"
    rounded: "{rounded.pill}"
    size: "46px"
---

# Design System: Jose Gayondato

## Overview

**Creative North Star: "The Keynote Stage"**

The site is a dark room with one speaker in one spotlight. The canvas is near-black obsidian with a faint film grain, so the black reads as a lit space, not a flat screen. Only one color, Spotlight Cyan, cuts through it. It marks the thing to look at next: the main button, the active nav tick, the key word in a headline.

The mood is cinematic, bold, and lit. Big tight-set Space Grotesk headlines carry the energy. The Approach section runs as a pinned keynote: the thesis builds on scroll, then each belief slides in like the next slide. The draggable 3D lanyard badge makes the speaker physical and present. Structure stays quiet: hairline rules, mono labels, one centered column. That way the type, the photos, and the badge own the stage.

Soft warnings (lean away, not hard bans): generic SaaS landing pages (gradient blobs, glass cards, pastel buttons), hype-AI or crypto looks (neon glow everywhere, many colors), and corporate CV templates (stock icons, skill bars, timeline boxes).

**Key Characteristics:**
- Near-black canvas with a live film-grain layer and one soft cyan glow behind the hero.
- One accent color, used for signal, never for decoration.
- Oversized, tightly tracked grotesk display type against calm, readable body text.
- Mono uppercase labels and hairline ticks as the wayfinding language.
- Scroll-driven "keynote" scenes on desktop; plain readable sections everywhere else.
- A physical signature object: the lanyard badge, in 3D or as its flat twin.

## Colors

A dark, near-neutral stage with warm-white type and a single cyan spotlight.

### Primary
- **Spotlight Cyan** (`spotlight-cyan`): the one signal. Primary button fill, brand mark, eyebrow dash, active nav underline, active section-index tick, scroll-progress bar, stat gauge bar, accent words in headlines, belief keys, recap links, focus rings, and text selection.
- **Spotlight Cyan Press** (`spotlight-cyan-press`): hover state of the primary button only.
- **Spotlight Haze** (`spotlight-haze`): the soft radial glow behind the hero badge, and the hover fill of lightbox controls.
- **Spotlight Line** (`spotlight-line`): the border of a gallery thumb on hover.
- **On Cyan** (`on-cyan`): deep teal-black text on any cyan fill (buttons, brand mark, skip link, selection).

### Neutral
- **Obsidian** (`obsidian`): the page itself and the nav's fade.
- **Obsidian Raised** (`obsidian-raised`): the pinned Approach stage and the mobile nav drawer. One step up, never more.
- **Stage White** (`stage-white`): headlines, titles, primary text, the stat numbers.
- **Body Ash** (`body-ash`): running body copy and leads.
- **Muted Stone** (`muted-stone`): labels, meta, captions, resting nav links. Chosen to clear WCAG AA on Obsidian.
- **Hairline** (`hairline`) and **Hairline Strong** (`hairline-strong`): section dividers, row rules, ghost button borders, the note rule in Approach.

### Named Rules
**The One Spotlight Rule.** Spotlight Cyan is the only hue on the page. Photos may bring their own color; the interface never adds a second accent.

**The Signal-Not-Paint Rule.** Cyan marks a place to look or act. It never fills a large area; the largest cyan surface is the primary button.

## Typography

**Display Font:** Space Grotesk (with system-ui, sans-serif)
**Body Font:** Libre Franklin (with system-ui, sans-serif)
**Label/Mono Font:** Space Mono (with ui-monospace, SF Mono, monospace)

**Character:** Space Grotesk speaks from the stage: loud, tight, a little engineered. Libre Franklin is the calm voice in the room that explains. Space Mono is the stage crew's labels: small, uppercase, widely tracked.

Space Grotesk is a brand lock. The detector suppression in `src/css/tokens.css` records that choice.

### Hierarchy
- **Display** (600, `clamp(48px, 6vw, 92px)`, 0.95): the hero headline only. Tracked at -0.035em, with a soft dark text-shadow so it holds over the 3D stage.
- **Headline** (600, `clamp(30px, 3.4vw, 48px)`, 1.05): section h2s. The pinned Approach thesis scales up to `clamp(34px, 6vw, 76px)`.
- **Title** (600, `clamp(20px, 1.6vw, 26px)`): talk titles and the hero sub-line (at 500). Beliefs use it at 500 with 1.25 leading.
- **Stat** (700, `clamp(40px, 4vw, 64px)`, tabular numbers): the About numbers.
- **Lead** (400, `clamp(19px, 1.5vw, 22px)`, 1.55): opening paragraphs, around 32 to 46ch wide.
- **Body** (400, 17px, 1.7): running copy. `text-wrap: pretty` on paragraphs, `balance` on headings.
- **Label** (400 or 700, 12px, 0.16em, uppercase): section labels, eyebrows, belief keys. The drag hint and scroll cue use 11px.
- **Control** (400, 13px, 0.04em): buttons and nav links, in mono.

### Named Rules
**The Three Voices Rule.** Grotesk for claims, Franklin for explanation, Mono for labels and controls. A font never borrows another voice's job.

## Layout

One centered column (`maxw`, 1180px) with the same horizontal `gutter` everywhere, so left edges line up down the whole page. Sections share one vertical rhythm (`section-y`) and are split by a single hairline on top. Inside a section, a 12-column grid places content: About splits 5 columns of headline against 6 columns of body, with the body dropped to align with the headline, not the label.

Spacing follows an 8px base (8, 16, 24, 40, 64).

The hero fills the full viewport (`100dvh`). Text sits left in a 560px column; the lanyard stage spans 130% of the width so the badge hangs right of center. Text lets pointer events pass through, so the whole hero is draggable except the links.

Fixed chrome sits outside the scroll layer: the nav (76px), a 2px cyan progress bar on the top edge, and a right-edge section index of hairline ticks.

Responsive:
- At 900px and below, the 3D stage is removed. The flat badge leads the hero above the copy, with a gentle sway. Grids and talk rows collapse to one column.
- At 820px and below, the section index hides, and the nav becomes a drop-down drawer on Obsidian Raised. The Approach keynote scene only runs above 820px with motion allowed.

## Elevation & Depth

Depth comes from light, not from stacked cards. Surfaces are flat and separated by hairlines and one small tonal step (Obsidian to Obsidian Raised). Depth is carried by the film-grain overlay, the cyan haze behind the hero, dark text-shadows that lift the hero type off the 3D scene, and the physical badge with its own drop shadow. Shadows appear only on real objects: the badge, the metal clip, and the enlarged lightbox photo.

### Shadow Vocabulary
- **Stage lift** (`text-shadow: 0 2px 30px rgba(0,0,0,0.55), 0 0 1px rgba(0,0,0,0.85)`): hero headline over the 3D stage; sub-lines use `0 1px 16px rgba(0,0,0,0.6)`. Removed on mobile.
- **Badge drop** (`filter: drop-shadow(0 26px 48px rgba(0,0,0,0.6))`): the flat badge card.
- **Lightbox float** (`box-shadow: 0 30px 80px rgba(0,0,0,0.55)`): the enlarged talk photo.

### Named Rules
**The Real-Object Rule.** Only things that exist as objects cast shadows: the badge, its clip, a photo held up to the light. Interface panels stay flat.

## Shapes

Gently rounded, never soft. Controls and the brand mark use an 8px radius; gallery thumbs use 6px; lightbox controls are circles. Most structure has no shape at all: talk rows, sections, and the Approach note are defined only by hairlines (1px, or a 2px left rule for the note). The recurring small geometry is the hairline tick: the eyebrow dash, the section-index ticks, the stat gauge bar, and the Approach progress rail are all 2px lines that fill or lengthen.

## Components

Components should feel tactile and confident: they respond to the hand with clear press, drag, and hover feedback. The badge sets the bar, since it can be grabbed and flung.

### Buttons
- **Shape:** gently rounded (8px), mono label, 14px by 22px padding.
- **Primary:** Spotlight Cyan fill with On Cyan text. Used for the conversion path only: "Follow" in the nav, "Let's connect" in the hero, "Follow on LinkedIn" in Connect.
- **Hover / Focus:** fill deepens to Spotlight Cyan Press; the trailing arrow springs 4px right on the signature ease. Focus shows a 2px cyan outline at 3px offset.
- **Tactile layer (fine pointers, motion allowed):** primary buttons and the brand mark pull magnetically toward the cursor. On press, a primary button gives to 0.96 scale and springs back on the signature ease (`src/js/animations/micro.js`).
- **Ghost:** transparent with a Hairline Strong border and Stage White text; hover turns border and text cyan. No press feedback today.

### Talk rows
- **Style:** full-width rows split by hairlines, three columns (type label, title and description, year rail). The year and recap link sit hard right so the list scans down one edge.
- **Hover:** the row content steps 14px right on the signature ease; the dividers stay still.
- **Gallery:** a draggable strip of 130px-tall photo thumbs under the row. On hover devices, thumbs rest in greyscale and come to full color, lift 2px, and take a Spotlight Line border on hover or focus.

### Navigation
- **Style:** fixed 76px bar that fades from Obsidian to clear, with an 8px backdrop blur; it turns solid with a hairline once scrolled. The brand is a cyan 34px "JG" mark plus the name in Space Grotesk.
- **Links:** mono 13px in Muted Stone; hover and active turn Stage White, and the active link gets a cyan underline that draws in from the left.
- **Mobile:** a three-line toggle that morphs into an X opens a drawer below the bar.

### Section index
A right-edge column of hairline ticks, one per section. At rest each tick is half length and dim. Hover or focus extends it and reveals a mono label. The active section's tick is full length and cyan. Hidden at 820px and below.

### Lightbox
A full-screen Obsidian veil (92% opacity, 6px blur) holding one photo, a caption, and a counter. Controls are 46px circles with a hairline border; on hover they take a cyan border, cyan icon, and Spotlight Haze fill. On small screens the prev and next controls move to the bottom.

### Lanyard badge (signature)
The site's signature object. On capable desktop browsers, a 3D badge (React Three Fiber and Rapier physics) hangs from a white Mandrill-logo strap and can be dragged. Everywhere else, a pixel-matched flat twin stands in: strap, brushed-metal clip, and a 232px card with a deep drop shadow. On mobile it leads the hero and sways gently.

### Approach keynote scene
On desktop with motion, the Approach section pins to the viewport on Obsidian Raised. The thesis assembles line by line, the accent word holds, then each belief slides through the center one at a time. A left-edge rail of 2px ticks fills in cyan as each belief arrives. Without the scene, the same content reads as a normal three-column section.

## Do's and Don'ts

### Do:
- **Do** keep Spotlight Cyan as the only interface hue, and keep it to signals: the conversion buttons, active states, key words.
- **Do** set claims in Space Grotesk at 600 with tight negative tracking, and explanations in Libre Franklin at 17px / 1.7.
- **Do** use mono uppercase labels (12px, 0.16em) and 2px hairline ticks for wayfinding.
- **Do** separate sections and rows with hairlines (`hairline`), not boxes or cards.
- **Do** give every scroll scene a plain static fallback for narrow screens, no-JS, and reduced motion.
- **Do** keep the lanyard badge, in 3D or its flat twin, as the hero's signature object.
- **Do** keep hover and press feedback clear and physical, like the arrow spring, the row step, the magnetic pull, and the press-and-spring on primary buttons.

### Don't:
- **Don't** add a second accent color or tint large surfaces cyan.
- **Don't** put shadows on panels or cards; shadows belong to real objects only.
- **Don't** lean toward generic SaaS landing styling: gradient blobs, glass cards, pastel buttons (soft warning).
- **Don't** lean toward hype-AI or crypto styling: neon glow everywhere, many colors (soft warning).
- **Don't** lean toward corporate CV templates: stock icons, skill bars, timeline boxes (soft warning).
