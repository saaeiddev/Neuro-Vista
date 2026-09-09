# NeuroVista Atlas

Independent React / TypeScript / Three.js educational website. Published under
`neurovista-atlas/` without replacing the original NeuroVista homepage.

## Build from the saved source

In `neurovista-atlas-source`:

1. `npm ci --ignore-scripts`
2. Copy `models/`, `draco/`, `neural.webp`, `brain-poster.webp`, and `MODEL-CREDITS.txt`
   from `../neurovista-atlas/` into `public/`.
3. `npx vite build --config vite.pages.config.ts`
4. Publish `pages-dist/` as a static directory.

The website uses hash routes so refreshes work on GitHub Pages. All WebGL assets
are local. The full anatomical model is loaded only on routes displaying it.

## Validation

- Production Vite build and scoped TypeScript check passed.
- Browser checks: anatomy information selection, global search dialog, research
  filters and empty state, quiz feedback, mobile navigation at 390px.
- The QA browser disabled WebGL at the browser level. Live GPU rendering and
  3D pointer picking could not be verified there. The Draco model was separately
  decoded: 317 cortex/cerebellum/brainstem meshes, 320,665 surface triangles.
- A software-rendered preview of the same model appears if WebGL is unavailable.

## Explicit limitations

- Sign-in has no authentication service; a local display name is optional.
- Contact uses a mailto draft, not server-side delivery.
- Guided tour is an interactive reading tour, not a video.
- Anatomy models are educational, not diagnostic. See MODEL-CREDITS.txt.
