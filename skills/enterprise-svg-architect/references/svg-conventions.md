# SVG conventions (read before drawing)

Table of contents:
1. Canvas & coordinate system
2. Palette (9 ramps, light + dark hex)
3. Self-theming `<style>` boilerplate
4. Text classes & CJK width calibration
5. Box sizing formula
6. Zones (trust boundaries) & nesting
7. Arrows & flow labels
8. Pre-flight verification checklist

---

## 1. Canvas & coordinate system

- Root: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 H" role="img">` with `<title>` and `<desc>` as the first two children (screen-reader summary).
- **Keep viewBox width at 680.** It maps 1:1 to the inline host width, so 14px text renders at 14px. If content is naturally narrow, center it (e.g. x=140..540) — do not shrink the viewBox.
- Safe area: x = 40..640, y = 40..(H-24). Never use negative coordinates.
- Set `H` = (bottom-most element edge, including text baselines + ~4px descent) + 24px. Don't guess; compute from your lowest element.
- Transparent background — the host/card provides it. Never paint an outer background rect (except deliberate physical scenes, not relevant here).

## 2. Palette (use only these hex; every color needs a dark counterpart)

Each ramp: `50` lightest fill · `600` stroke · `800/900` text-on-light. In dark mode swap to `800` fill · `200` stroke · `100` text.

| ramp | 50 | 100 | 200 | 400 | 600 | 800 | 900 |
|---|---|---|---|---|---|---|---|
| gray | #F1EFE8 | #D3D1C7 | #B4B2A9 | #888780 | #5F5E5A | #444441 | #2C2C2A |
| blue | #E6F1FB | #B5D4F4 | #85B7EB | #378ADD | #185FA5 | #0C447C | #042C53 |
| teal | #E1F5EE | #9FE1CB | #5DCAA5 | #1D9E75 | #0F6E56 | #085041 | #04342C |
| purple | #EEEDFE | #CECBF6 | #AFA9EC | #7F77DD | #534AB7 | #3C3489 | #26215C |
| coral | #FAECE7 | #F5C4B3 | #F0997B | #D85A30 | #993C1D | #712B13 | #4A1B0C |
| pink | #FBEAF0 | #F4C0D1 | #ED93B1 | #D4537E | #993556 | #72243E | #4B1528 |
| green | #EAF3DE | #C0DD97 | #97C459 | #639922 | #3B6D11 | #27500A | #173404 |
| amber | #FAEEDA | #FAC775 | #EF9F27 | #BA7517 | #854F0B | #633806 | #412402 |
| red | #FCEBEB | #F7C1C1 | #F09595 | #E24B4A | #A32D2D | #791F1F | #501313 |

**Assignment rules**: color = category, never sequence. Use gray for neutral/structural (users, generic steps, the internal LAN). Pick ≤2 meaningful ramps for the rest. Semantic reservations: green=ok/allowed, amber=warning/pending, red=danger/blocked — use only when the node truly means that. For trust zones a good default is: public internet = red/coral tint (untrusted), DMZ = amber tint, internal = green/teal tint (trusted), partner = purple.

Text on a colored fill uses the **800 or 900** stop of the same ramp (light) / **100** (dark) — never black or gray. Title and subtitle in one box must be two different stops (title darker, subtitle lighter).

## 3. Self-theming `<style>` boilerplate

Define one class trio per color: node fill/stroke, title text, subtitle text. Add a `@media (prefers-color-scheme: dark)` block overriding all of them. Example for gray/blue/purple (extend per ramp used):

```
<style>
text{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}
.t{font-size:14px}.ts{font-size:12px}.th{font-size:14px;font-weight:500}
.arr{stroke:#888780;stroke-width:1.5;fill:none}.leg{fill:#6f6e69}
.zone{fill:none;stroke-width:1.2;stroke-dasharray:6 4}
.n-gray{fill:#F1EFE8;stroke:#5F5E5A;stroke-width:1}.tx-gray{fill:#2C2C2A}.tx-gray-s{fill:#5F5E5A}
.n-blue{fill:#E6F1FB;stroke:#185FA5;stroke-width:1}.tx-blue{fill:#0C447C}.tx-blue-s{fill:#185FA5}
.n-purple{fill:#EEEDFE;stroke:#534AB7;stroke-width:1}.tx-purple{fill:#3C3489}.tx-purple-s{fill:#534AB7}
@media (prefers-color-scheme:dark){
.leg{fill:#B4B2A9}.arr{stroke:#B4B2A9}
.n-gray{fill:#2C2C2A;stroke:#B4B2A9}.tx-gray{fill:#F1EFE8}.tx-gray-s{fill:#D3D1C7}
.n-blue{fill:#0C447C;stroke:#85B7EB}.tx-blue{fill:#E6F1FB}.tx-blue-s{fill:#B5D4F4}
.n-purple{fill:#3C3489;stroke:#AFA9EC}.tx-purple{fill:#EEEDFE}.tx-purple-s{fill:#CECBF6}}
</style>
```

Zone strokes: use a mid stop (e.g. `stroke="#993C1D"` coral for public, `#BA7517` amber for DMZ, `#0F6E56` teal for internal) inline on the `.zone` rect — mid-ramp hex reads acceptably in both modes, so zones need no dark override. Keep zone fill `none` (or a very light tint only in light mode).

Arrow marker (put in `<defs>`, fixed gray so PNG export keeps the head):

```
<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#888780" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>
```

## 4. Text classes & CJK width calibration

- Every `<text>` carries a size class: `t` (14px) or `th` (14px medium) for labels, `ts` (12px) for subtitles/flow labels — plus a color class (`tx-blue` etc.). Two sizes only.
- Center text in a box with `text-anchor="middle" dominant-baseline="central"`, y at the vertical center of its slot.
- **Character widths** (critical for CJK):

| script | at 14px | at 12px |
|---|---|---|
| CJK 汉字 | ~15px | ~13px |
| Latin/digit | ~8px | ~7px |
| ASCII punct/space | ~4px | ~3.5px |

- SVG text never wraps. If a label needs two lines, use explicit `<tspan x=".." dy="1.2em">` — but prefer shortening. Subtitles ≤ ~14 CJK chars.
- **XML-escape text content**: `&`→`&amp;`, `<`→`&lt;`, `>`→`&gt;`. A raw `&` (e.g. in a label like "目录 & 账号") is invalid XML — it breaks `rsvg-convert` and strict parsers (and the visualize host) even though lenient browsers tolerate it. Write `&amp;`, or sidestep with `·`, `/`, `+`. Arrows `→ ⇄ ↔` and middots `·` are safe literals.

## 5. Box sizing formula

For a box, estimate label pixel width `W = cjk_chars×15 + latin_chars×8 + punct×4` (use 13/7/3.5 for a 12px subtitle). Then:

`box_width = max(title_W, subtitle_W) + 32`  (16px padding each side)

Heights: single-line node = 44px; two-line (title+subtitle) = 56–60px. Keep all same-type nodes the same height.

Spacing: ≥24px horizontal gap between sibling boxes; ≥34px vertical gap between stacked boxes (arrow lives in the gap, leave ~10px between arrowhead and box). Inside a zone: ≥20px padding to the zone edge.

Row-fit check: for boxes in a row, Σ(widths) + Σ(gaps) ≤ 600 (the safe span). If not, shrink boxes, drop subtitles, wrap to two rows, or split the diagram.

## 6. Zones (trust boundaries) & nesting

- A zone is a large rounded rect: `rx="16"`, `class="zone"`, inline `stroke="#<mid>"`, dashed. Label at top-left **inside** the zone: `<text class="th tx-...">` at (zone_x+16, zone_y+20).
- Max 2 nesting levels (zone → component). Deeper is unreadable at 680px.
- Components sit fully inside their zone with ≥20px padding; the zone rect is drawn BEFORE its children (z-order) so children paint on top.
- Order the zones by trust, conventionally left→right or top→bottom: public internet → DMZ/gateway → internal → data. Cross-zone arrows crossing a boundary are the whole point — make them obvious (they cross the dashed edge).
- A subtle light-mode-only zone tint is allowed: add `fill="#FAECE7"` (very light) but then also give it `fill-opacity="0.4"` and DO NOT rely on it in dark mode (dashed stroke + label carry the zone). Simplest robust choice: `fill="none"`.

## 7. Arrows & flow labels

- `class="arr"` line/path, `marker-end="url(#arrow)"`. Bidirectional: also `marker-start`.
- Never cross an unrelated box. If the straight path would, route an L/Z-bend: `<path d="M x1 y1 L xmid y1 L xmid y2 L x2 y2" class="arr" fill="none" marker-end="url(#arrow)"/>`.
- Flow/protocol label: a `ts` text in clear space near the arrow's midpoint, ≤3 words (e.g. "HTTPS", "302 跳转", "SAML 断言", "回写账号"). If the meaning is obvious from source+target, omit it. Never lay a label on top of the line — offset it 8–10px.
- Keep flows single-direction overall (top-down or left-right). A few back-arrows (e.g. redirect return) are fine if they don't cross forward boxes.

## 8. Pre-flight verification checklist

Before writing the file, confirm ALL:
- [ ] viewBox width = 680; all content within x=40..640; H = lowest element + ~24.
- [ ] No negative coordinates. No element past the viewBox edge.
- [ ] Every `<text>` has a size class AND a color class. No unclassed text, no `fill="inherit"`.
- [ ] Text content is XML-safe — no raw `&`/`<`/`>` (use `&amp;`/`&lt;`/`&gt;`). Validate: parse the file as XML, or run the export script (rsvg fails loudly on bad XML).
- [ ] Every color class has a `@media (prefers-color-scheme:dark)` override. Mental test: on near-black, is every label still readable?
- [ ] Each box wide enough for its longest label (apply §5 formula — recount CJK chars).
- [ ] No two unrelated elements overlap (box-on-box, label-on-label, label-on-arrow). Row-fit check passed.
- [ ] No arrow passes through a box it doesn't connect (L-bend if needed). Every connector `<path>` has `fill="none"`.
- [ ] ≤2 meaningful ramps + gray. Legend present if color/line-style encodes meaning.
- [ ] Zones drawn before their children; ≥20px inner padding; top-left label inside.
- [ ] Two font sizes only (14/12). Sentence case. No emoji/gradient/shadow.

After export: read the PNG back and confirm CJK glyphs render (not □ tofu) and nothing is clipped.
