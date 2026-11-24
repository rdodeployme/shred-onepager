# SHRED — Industrial Shredding & Material Processing

One-page site for SHRED, Recycle Group's specialist brand for customised commercial
shredding and material-processing projects.

## Files

- `index.html` — the full one-pager. Self-contained: all CSS/JS inline, the hero
  machine video base64-embedded. Open it directly in a browser; no build step.
- `specsheet.html` — alternative light "capability statement" version of the same content.
- `machine-explode-pilot.webm` — the source hero video (also embedded in index.html;
  kept here so it can be swapped or re-encoded without unpacking the base64).

## v3 — Next.js + real-time 3D (`/v3/`)

- `v3/` — static export, live at rdodeployme.github.io/shred-onepager/v3/. Leaves `index.html` and `v2.html` untouched.
- `v3-source/` — the Next.js source. `npm install`, then `NEXT_PUBLIC_BASE_PATH=/shred-onepager/v3 npx next build` and copy `out/` to `v3/`.
- `v3-source/blender/build_line.py` — procedural Blender (bpy) model of the shredding line; exports `public/model/shred-line.glb` and the Cycles stills.
- The 3D line is an illustrative model, badged as such on the page. Accent colour is one CSS variable (`--accent` in `app/globals.css`).
- New in v3 and needing confirmation: the "Mixed metal streams" capability row (eddy current separation, paid separation service).

## Status — live draft

The site is live at rdodeployme.github.io/shred-onepager. Proposed/sourced figures are marked
with green dotted underlines (`class="tbc"`, hover for details). Outstanding before this is final:

- Add verified annual tonnage and diversion stats when available (deliberately omitted for now —
  do not add unverified environmental figures to the public page).
- Confirm the 5 processing sites can run SHRED projects (list sourced from TMRC public site list).
- Confirm the 2-business-day assessment SLA and 2–6 week trial window internally.
- Add phone, email, ABN and EPA licence details.
- Confirm certificate-of-destruction and witnessed-destruction offerings.
- Confirm pocket-coil separation capability (capability table row + FIG. 02).
- Wire the submission form to the CRM (currently a front-end stub).

The hero animation is an illustrative AI-generated render, badged as such on the page.
