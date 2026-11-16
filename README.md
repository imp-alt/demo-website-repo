# demo-website-repo

This repository holds the demo website; `index.html` is the entry page.

The site is one static HTML page with a small dependency-free JavaScript module
that orbits six emoji around the "Hello, world!" heading. There is no
framework, no bundler and no build step: the files in this repository are the
files that get served, which is why the site lives at the repo root — that is
what GitHub Pages deploys.

## Preview it locally

Serve the repository over HTTP with any static server:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

Opening `index.html` directly with `file://` does **not** run the animation. The
script is loaded as an ES module, and a module fetched from a `file://` page has
a `null` origin, which the browser blocks for CORS reasons. You will see the
page exactly as it renders without JavaScript — heading and paragraph, no emoji.
This is expected, and it is the same fallback a visitor with JavaScript disabled
gets.

## Run the checks

```sh
npm ci
npm run check
```

That runs all three checks the CI job runs:

```sh
npx prettier --check .
npx html-validate .
npx eslint .
```

Node and npm exist here only to run these checks. Nothing in `node_modules` is
referenced by the site.

## Deployment

`.github/workflows/ci.yml` runs the checks on every push and pull request. On a
push to `main` it then runs a `pages` job that copies `index.html` and `assets/`
into `_site` and deploys that as the Pages artifact, so documentation, configs
and `node_modules` are never served. The deploy needs the repository's Pages
setting pointed at **GitHub Actions** (Settings → Pages → Build and deployment);
that is a repository setting, not a file in this repo.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the layout, the conventions and how to
add a page, and [AGENTS.md](AGENTS.md) if you are an automated contributor.
Changes are recorded in [CHANGELOG.md](CHANGELOG.md).
