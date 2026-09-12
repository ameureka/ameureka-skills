---
name: enterprise-svg-architect
description: 'Draw enterprise-grade architecture and topology SVG diagrams — especially for identity/authentication, zero-trust and clientless (无端) access, SSO integration, reverse-proxy/gateway convergence, and system-integration flows. Produces self-contained SVGs with trust-boundary zones (public internet / DMZ / internal), component nodes, labeled data-flow arrows (protocols like HTTPS/302/SAML/OIDC/SSO), and a legend; auto-adapts to light/dark mode and exports to 2x PNG via a bundled script. Use when the user asks to draw or visualize a system architecture, network topology, deployment diagram, integration or 接入 diagram, an auth/login flow at the architectural level, trust boundaries, or how system X integrates into system Y. Trigger phrases — 架构图, 拓扑图, 部署图, 集成图, 接入图, 信任边界, 最终效果图, enterprise architecture diagram, topology diagram, zero-trust access diagram, SSO integration diagram.'
---

# Enterprise SVG Architect

## Overview

Produce precise, professional, self-contained architecture/topology SVGs that render identically inline (visualize plugin), in a browser, and as exported PNG. Diagrams encode meaning through **trust-boundary zones**, **component nodes**, and **labeled data-flow arrows** — not decoration. Every SVG is written to a file, adapts to light/dark mode via an embedded `@media` block, and is exported to 2x PNG for docs/PPT.

This skill is self-contained. It does NOT depend on the visualize plugin's pre-built CSS classes (`c-blue`, `t`, `ts`) — those exist only inside that host. Instead it defines its own `<style>` with concrete palette hex + dark-mode overrides, so the same SVG works everywhere.

## Workflow

1. **Scope the diagram.** Confirm three things (ask only if unclear): (a) the systems/components involved, (b) the trust zones each lives in (public / DMZ / internal / partner), (c) the primary flow(s) to show. Count the nouns — if >8 components, split into an overview + per-flow detail diagrams rather than one dense canvas.
2. **Pick a topology pattern.** See `references/architecture-patterns.md` for the standard enterprise layouts (zoned-lanes, reverse-proxy convergence, zero-trust access, SSO/identity federation, hub-and-spoke). Choose one; don't invent layout from scratch.
3. **Do the layout math BEFORE writing SVG.** Read `references/svg-conventions.md` for the coordinate system, CJK text-width calibration, box-sizing formula, zone-nesting rules, and the mandatory viewBox checklist. Cramped/overlapping boxes are the #1 failure — compute widths and gaps first.
4. **Start from the template.** Copy `assets/template.svg` — it already contains the light+dark `<style>`, the arrow marker, and a zone/node/flow example. Fill in nodes and flows.
5. **Draw zones → components → flows → legend**, in that z-order. Zones are large dashed containers (one ramp each). Components are solid nodes colored by category. Flows are arrows with short protocol labels placed in clear space. Add a one-line legend whenever color or line-style encodes meaning.
6. **Verify** against the checklist at the bottom of `references/svg-conventions.md` (viewBox fits, no overlaps, no arrow crosses an unrelated box, every text has a class, CJK labels fit their boxes, dark-mode overrides present for every color).
7. **Write the `.svg` file**, then **export PNG** with `scripts/svg_to_png.py <file.svg>` (defaults to 2x). Read the PNG back to visually confirm CJK rendered (no tofu boxes) and nothing clipped.
8. **Render inline** (if the visualize plugin is available) by passing the SVG source to `show_widget`, and/or deliver the `.svg` + `@2x.png` files.

## Core rules (essentials — full detail in references)

- **Canvas**: `viewBox="0 0 680 H"`, `width="100%"`, `role="img"` with `<title>`+`<desc>` first. Keep width 680 (matches inline host 1:1). Content stays in x=40..640. Set H = lowest element + ~24px.
- **Self-theming**: define colors in a `<style>` block using concrete palette hex, plus a `@media (prefers-color-scheme: dark)` override for EVERY color class. Never rely on host classes. Palette hex table is in `references/svg-conventions.md`.
- **Color encodes category, not sequence.** ≤2 meaningful ramps + gray for neutral/structural. Zones and node-categories each get one ramp. Add a legend when color carries meaning.
- **CJK is wide**: ~15px per character at 14px, ~13px at 12px (Latin is ~8px/7px). Size every box from its longest label using the formula in the conventions file, or Chinese labels WILL overflow.
- **Arrows**: 1.5px, single-direction flow where possible; never route a line through an unrelated box (use an L-bend `<path>` with `fill="none"`). Protocol labels (HTTPS, 302, SAML, OIDC) go in clear space, ≤3 words.
- **Trust boundaries**: draw as large dashed rounded rects with a top-left label; nest components inside with ≥20px padding. Public internet, DMZ, and internal network are conventionally distinct zones — see patterns file.
- **No** gradients, shadows, blur, emoji, or `<style>` color without a dark-mode counterpart. Two font sizes only: 14px (labels), 12px (subtitles/flow labels). Sentence case.

## Bundled resources

- `references/svg-conventions.md` — coordinate system, full palette hex table (9 ramps, light+dark), text/box sizing math with CJK calibration, arrow marker, zone-nesting rules, and the pre-flight verification checklist. **Read before drawing.**
- `references/architecture-patterns.md` — the enterprise topology patterns (zoned-lanes, reverse-proxy convergence, zero-trust/clientless access, SSO/identity federation, deployment/hub-spoke), each with when-to-use, a layout sketch, and node/flow conventions. **Read to pick a layout.**
- `assets/template.svg` — copy-to-start skeleton: light+dark `<style>`, arrow marker defs, one zone + one node + one flow + legend. Replace the example contents.
- `scripts/svg_to_png.py` — export SVG → PNG. Usage: `python3 scripts/svg_to_png.py input.svg [-s SCALE] [-o out.png]`. Default scale 2 (→ `input@2x.png`). Uses `rsvg-convert`, falls back to headless Chrome; renders light mode (ignores `@media dark`), which is what you want for a shareable PNG. Run `--help` for options.

## Delivery

Save both the `.svg` (adaptive source) and `@2x.png` (portable) next to the user's related files, using a dated, descriptive name (e.g. `<project>_<subject>_架构图_YYYYMMDD.svg`). Always visually verify the exported PNG before presenting.
