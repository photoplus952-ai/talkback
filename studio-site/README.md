# The Flying Idea: scroll story for the studio site

A working prototype of the four frames (THE IDEA → THE PROCESS → THE PRODUCT →
THE RESULT) as one continuous, scroll-scrubbed 3D story. A procedural paper
plane links the scenes.

No build step. Serve the folder with any static server:

```bash
cd studio-site && python3 -m http.server 8080
# open http://localhost:8080
```

| URL flag | What it does |
| --- | --- |
| `?ref=1` (or **Alt+R**) | overlays the original frame on each scene so you can check the locked composition |
| `?static` | forces the no-animation version (same as `prefers-reduced-motion`) |

## Structure

```
index.html                 page shell, real HTML text, scene nav
css/main.css               layers, typography styles, reduced-motion layout
js/config.js               ALL copy + every position (in frame pixels) + scroll timing
js/main.js                 boot, master scroll timeline, plane render loop, nav
js/core/stage.js           fits each composition to the screen (desktop / mobile crops)
js/core/typography.js      headline fitting, stretched E, Hebrew blocks, taglines, badge
js/scenes/idea.js          01: letter-stretch intro; title recedes into depth
js/scenes/process.js       02: mask text reveal; camera tilts into the desk
js/scenes/product.js       03: depth typography; lid opens; plane passes behind devices
js/scenes/result.js        04: stroke→fill title; band unrolls; iris reveal
js/objects/paperPlane.js   Three.js folded-paper dart, lights, soft page shadow
js/objects/flight.js       the plane's keyframed path across all scenes (+ opening shot)
js/layers.generated.js     positions of the photo layers (written by the tool below)
assets/layers/*.webp       photo layers cut from the frames
tools/extract_layers.py    re-cuts the photo layers from tools/ref/*.png
tools/ref/                 the four approved frames (source of truth)
```

### Editing
* **Text / positions:** `js/config.js`. Units are pixels of the original frame,
  so a value can be read straight off the design file.
* **Pace:** `TIMING` in `js/config.js` (one timeline, 0–100) and `scrollLength`.
* **Plane path:** `PATH` / `INTRO` in `js/objects/flight.js`.
* **Images:** replace a file in `assets/layers/` with the same name (same size),
  or re-run `python3 tools/extract_layers.py` after updating `tools/ref/`.

## Libraries (CDN, pinned)
Three.js 0.170.0 · GSAP 3.12.5 + ScrollTrigger · Lenis 1.1.13 · Google Fonts.

## Assets that still need finishing
* **Stretch Pro** font file (licensed); see `fonts/README.md`.
* **Photo layers** were cut automatically from the flattened frames. For final
  quality, supply the original layered files (or clean PNG cut-outs) of: desk
  scene, swatch fan, notebook, laptop (lid + base separately), phone, glass
  star, the two people. Same file names in `assets/layers/`.
* **Paper plane:** procedural model. A modelled GLB (with real paper texture
  and the DIA DOS print) can replace `buildDart()` in `paperPlane.js`.
