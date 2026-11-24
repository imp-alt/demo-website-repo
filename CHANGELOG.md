# Changelog

All notable changes to this project are documented here.

The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `index.html`: a decorative grove of four hand-authored inline-SVG trees (two
  layered-triangle conifers and two broadleaf silhouettes, varied in height,
  shape and colour) in a new `aria-hidden` `role="none"` layer that sits behind
  the centred heading and paragraph. The trees are markup and CSS only, so they
  render identically with JavaScript disabled, animate nothing under
  `prefers-reduced-motion: reduce`, and cannot add horizontal scroll: the layer
  is `position: fixed`, `overflow: hidden` and `pointer-events: none`, the trees
  are placed with clamped `left`/`right`/`bottom` coordinates, and the two inner
  trees are dropped below 40rem so a narrow viewport keeps only the corner
  silhouettes clear of the text box.
- CI now runs on Node.js 22 instead of 20. `html-validate` 11 calls
  `fs.globSync`, which Node.js 20 does not have, so the `html-validate` step
  failed with `TypeError: fs.globSync is not a function` on GitHub Actions while
  passing locally. The required version is documented in `CONTRIBUTING.md` and
  `AGENTS.md`.
- The workflow actions were raised to the majors that run on Node.js 24
  (`actions/checkout@v5`, `actions/setup-node@v5`, `actions/configure-pages@v6`,
  `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`), which clears
  the "Node.js 20 is deprecated" annotations GitHub added to every run.
- `assets/js/main.js`: a dependency-free ES module that orbits six spinning
  emoji around the "Hello, world!" heading using CSS transforms and
  `requestAnimationFrame`. The layer is `aria-hidden`, is appended to `<body>`
  outside `<main>`, and clamps both orbit radii per axis so no emoji can add
  horizontal scroll or overlap the heading. The emoji are created in JavaScript
  only, so with scripting disabled the page renders exactly as before.
  `prefers-reduced-motion: reduce` places the emoji statically and never starts
  the animation loop.
- `index.html` now loads that module with
  `<script type="module" src="assets/js/main.js"></script>` and carries the
  orbit layer's CSS plus an inline data-URI favicon.
- `.github/workflows/ci.yml`: a `ci` job running `npm ci`, `prettier --check .`,
  `html-validate .` and `eslint .` on every push and pull request, and a `pages`
  job that depends on it, collects `index.html` and `assets/` into `_site`, and
  deploys the result to GitHub Pages on pushes to `main`.
- Tooling configuration: `package.json`, `package-lock.json`,
  `eslint.config.js`, `.htmlvalidate.json`, `.prettierrc.json`,
  `.prettierignore` and `.gitignore`. All are dev-only; the site itself has no
  runtime dependencies and no build step.
- `CONTRIBUTING.md`, `AGENTS.md` and this `CHANGELOG.md`.

### Changed

- `README.md` rewritten to describe the site, how to preview it over a local
  static server, how to run the checks, and how Pages deployment works.

## [0.1.0]

### Added

- Initial static site: `index.html` with an inline stylesheet, a centred
  "Hello, world!" heading and a paragraph.

[Unreleased]: https://github.com/imp-alt/demo-website-repo/compare/HEAD...HEAD
[0.1.0]: https://github.com/imp-alt/demo-website-repo
