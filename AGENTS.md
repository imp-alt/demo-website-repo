# AGENTS.md

Rules for automated contributors working in this repository.

## What this repo is

A static website — no framework, no build step, no server. The files in the
repository are the files that get served, and the site lives at the repository
root because that is what GitHub Pages deploys.

## Map

| Path                       | Purpose                                               |
| -------------------------- | ----------------------------------------------------- |
| `index.html`               | Entry page; inline `<style>`, loads the orbit module  |
| `assets/js/main.js`        | The only script: emoji orbit, progressive enhancement |
| `.github/workflows/ci.yml` | Checks job + Pages deploy job                         |
| `package.json`             | Dev-only tooling and the `check` script               |
| `package-lock.json`        | npm-generated; never hand-edit                        |
| `eslint.config.js`         | Flat ESLint config                                    |
| `.htmlvalidate.json`       | html-validate config                                  |
| `.prettierrc.json`         | Prettier config                                       |
| `.prettierignore`          | Paths Prettier skips                                  |
| `README.md`                | Human-facing overview                                 |
| `CONTRIBUTING.md`          | Conventions and how to add a page                     |
| `CHANGELOG.md`             | Keep a Changelog + SemVer                             |

## Commands

```sh
npm ci              # install pinned dev tooling
npm run check       # everything CI checks, in order
npm run format      # let Prettier fix formatting
npx prettier --check .
npx html-validate .
npx eslint .
python3 -m http.server 8000   # preview; see the note below
```

`file://` does not run the animation. `index.html` loads `assets/js/main.js` as
an ES module, and from a `file://` page the module's origin is `null`, so the
browser blocks it for CORS reasons and only the no-JavaScript fallback renders.
Always preview over a local static server.

## Style and accessibility

- Progressive enhancement first. Anything visual must render acceptably with
  JavaScript disabled; build it up in a script rather than depending on one.
- Decorative layers get `aria-hidden="true"` and must never alter the accessible
  name or text of real content.
- Respect `prefers-reduced-motion: reduce`: offer a static equivalent and do not
  start an animation loop. Handle the query changing at runtime, not just at load.
- Never introduce horizontal scroll. Position fixed/absolute elements with
  clamped coordinates derived from measured boxes, and check the result at a
  narrow viewport such as 390x700.
- Keep the heading and paragraph box model stable so a script-free render is
  pixel-identical to the enhanced one.
- Animate with CSS `transform` under `requestAnimationFrame`, not layout
  properties.

## Never add

- Frameworks, libraries or bundlers — of any kind.
- Runtime npm dependencies. `node_modules` is dev-only and gitignored.
- A build step, transpiler or CSS preprocessor.
- Server code, APIs, or anything needing a process other than a static file
  server.
- Generated output committed to the repo, including `dist/` or `_site/`.
- Anything referenced by `index.html` that points into `node_modules` or a build
  directory.
- A new file at a path the Pages collect step does not copy, unless you add it
  there too.

## Keeping CI green

- Fix the code, not the rules. Do not add rule exceptions, ignore entries or
  disable comments to make a check pass.
- The two entries in `.htmlvalidate.json` are the single exception, and they are
  not relaxations of what gets checked: Prettier and html-validate disagree on
  syntax style, so `void-style` is off (Prettier emits `<meta />`, which
  html-validate's default rejects) and `doctype-style` is pinned to `lowercase`
  (Prettier lowercases the doctype). Keep them as they are; do not add more.
- Every pull request adds an entry under **Unreleased** in `CHANGELOG.md`.
- Branch from `main`, open a pull request, use Conventional Commit messages, and
  do not push to `main` directly.
