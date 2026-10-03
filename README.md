# Flat-pack Assembly · 3D Guides

Interactive 3D, step-by-step assembly guides for flat-pack furniture, built with [Three.js](https://threejs.org/), set in a generic living room:

- **Dining table**: 4-seater, built upside-down then turned over
- **Bookshelf**: 5 shelves, cam-lock construction, built face-down then stood up
- **Bed frame**: 160 × 200 double with hook-on rails, centre beam and slats
- **Coffee table**: screw-in legs and a lower shelf
- **L-shaped sofa**: 7-seater sectional of three units joined with connector brackets

**Controls:** pick a piece of furniture at the top, then use Next/Back, replay the current step, or auto-play everything. Drag to rotate, scroll to zoom, arrow keys to navigate.

**Links to a step:** the URL tracks what you're looking at, e.g. `#bookshelf/4` or `#l-sofa/0`.

It's a static site with no build step. To run it locally:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Code layout

- `app.js`: renderer, animation engine, UI
- `src/room.js`: the living room
- `src/kit.js`: shared materials, helpers and hardware (screws, cam locks, brackets…)
- `src/<furniture>.js`: one module per item, with its parts, steps, camera views and geometry

Deploy with GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.

Generic flat-pack designs for illustration. Not affiliated with any furniture retailer.
