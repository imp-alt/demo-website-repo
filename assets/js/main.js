/**
 * Emoji orbit — a dependency-free progressive enhancement for index.html.
 *
 * With JavaScript disabled — or when the module cannot load, which is what
 * happens over file:// because a CORS-blocked ES module never runs — the page
 * renders exactly as the HTML describes it. The emoji exist only here.
 *
 * How it works:
 *   - one aria-hidden, position:fixed layer appended to <body> (never inside
 *     <main>), so the document's own layout boxes are untouched and the layer
 *     cannot add horizontal scroll;
 *   - 6 emoji placed with CSS transforms only, driven by requestAnimationFrame;
 *   - the path is a superellipse (exponent 6) centred on the h1. A plain
 *     ellipse cannot work: the heading is centred in the viewport and spans
 *     nearly all of it on a phone, so an emoji crossing the heading's vertical
 *     centre would always cut through the text. A squarer path keeps every
 *     emoji either clear of the heading sideways or clear of it vertically;
 *   - both radii are clamped per axis from each emoji's measured box, so no
 *     emoji can ever extend past a viewport edge;
 *   - prefers-reduced-motion: reduce places the emoji once, marks the layer
 *     "static", and never starts a rAF loop.
 */

const EMOJI = ["🚀", "✨", "🌙", "⭐", "🪐", "🌍"];
const TAU = Math.PI * 2;

/** How far the ring sits outside the heading, as a multiple of its height. */
const PADDING = 1.35;
/** Ring height as a multiple of the heading height (a plain ellipse would need ~2.7). */
const RISE = 1.6;
/** Path exponent: 2 is a plain ellipse, larger is squarer. */
const EXPONENT = 6;
/** Radians per second travelled around the ring; the spin is 3x this. */
const SPEED = 0.34;
/** How many times faster an emoji spins on its own axis than it orbits. */
const SPIN_RATIO = 3;
/** Pixels of clearance demanded from the heading box and the viewport edge. */
const MARGIN = 2;

/**
 * Upper bound on how much bigger a spinning emoji's box can get than its
 * upright box: |cos|*w + |sin|*h peaks at sqrt(w^2 + h^2), which for these
 * near-square glyphs is at most SQRT2 times the larger side.
 */
const ROTATION_INFLATION = Math.SQRT2;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const heading = document.querySelector("h1");

const layer = document.createElement("div");
layer.className = "orbit";
layer.setAttribute("aria-hidden", "true");

const nodes = EMOJI.map((character) => {
  const node = document.createElement("span");
  node.className = "orbit__emoji";
  node.textContent = character;
  layer.appendChild(node);
  return node;
});

document.body.appendChild(layer);

let frame = 0;
let running = false;

/** Math.pow cannot take a negative base to a fractional power. */
function signedPower(value, exponent) {
  return Math.sign(value) * Math.pow(Math.abs(value), exponent);
}

/** Point on the unit superellipse for an angle. */
function unit(angle) {
  return {
    x: signedPower(Math.cos(angle), 2 / EXPONENT),
    y: signedPower(Math.sin(angle), 2 / EXPONENT),
  };
}

/**
 * Centre of the ring plus its radii.
 *
 * roomX/roomY are hard ceilings: an emoji box may never cross a viewport edge.
 * clearX/clearY are the floors: how far off centre an emoji must be to sit
 * beside (or above) the heading rather than on top of it.
 */
function geometry() {
  const rect = heading.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const sizes = nodes.map((node) => {
    const box = node.getBoundingClientRect();
    return { width: box.width, height: box.height };
  });

  // getBoundingClientRect() is measured with the emoji upright, but it is drawn
  // spinning, and a box of w x h turned by theta measures (|cos theta|*w +
  // |sin theta|*h). The spin angle is derived from the orbit angle, so the
  // inflation is computed per slot below rather than as one global worst case:
  // using sqrt(2) everywhere is what pushed an emoji past the viewport edge on
  // a 390px-wide phone.
  const widths = sizes.map((size) => size.width);
  const heights = sizes.map((size) => size.height);
  const widest = Math.max(...widths);
  const tallest = Math.max(...heights);

  const halfWidth = widest / 2;
  const halfHeight = tallest / 2;

  // A transform-origin of 50% 50% means the centre of an emoji travels exactly
  // radiusX/radiusY, so the centre must stay halfSize + MARGIN away from an
  // edge. (The rotation-inflated halfSize is only needed for the heading test,
  // where the emoji's own extent matters on both axes at once.)
  const roomX = Math.max(
    0,
    Math.min(cx, window.innerWidth - cx) -
      (widest * ROTATION_INFLATION) / 2 -
      MARGIN
  );
  const roomY = Math.max(
    0,
    Math.min(cy, window.innerHeight - cy) -
      (tallest * ROTATION_INFLATION) / 2 -
      MARGIN
  );

  const clearX = rect.width / 2 + halfWidth + MARGIN;
  const clearY = rect.height / 2 + halfHeight + MARGIN;

  // Clearance from the heading. Every emoji passes through every angle as the
  // ring rotates, so this must hold for all angles, not just the six slots. A
  // superellipse point always has |x| >= radiusX * CORNER_REACH or
  // |y| >= radiusY * CORNER_REACH (worst at the 45-degree corners), and closing
  // it through the y term needs radiusY >= clearY / CORNER_REACH ~ 1.12*clearY,
  // which is taller than the room available on a phone. So the sideways term
  // carries it: radiusX is floored at clearX. That floor always fits, because
  // the heading itself fits in the viewport with padding, so the room on either
  // side is at least half the heading's width.
  const desiredX = Math.max(
    rect.width / 2 + rect.height * PADDING,
    clearX,
    clearY / CORNER_REACH
  );
  const radiusX = Math.min(desiredX, roomX);

  // If the sideways room could not reach clearX, the corners must carry the
  // emoji past the heading instead: that needs radiusY * CORNER_REACH >= clearY.
  // Otherwise the plain rise applies, with clearY as a floor so the top and
  // bottom of the ring never graze the text.
  const radiusY = Math.min(
    radiusX < clearX
      ? Math.max(rect.height * RISE, clearY, clearY / CORNER_REACH)
      : Math.max(rect.height * RISE, clearY),
    roomY
  );

  return {
    cx,
    cy,
    radiusX,
    radiusY,
    widths,
    heights,
    widest,
    tallest,
    clearX,
    clearY,
  };
}

/**
 * How close to the ring's outer edge a superellipse point gets on at least one
 * axis: 2 ** (-1/EXPONENT), reached at the 45-degree corners.
 */
const CORNER_REACH = Math.pow(2, -1 / EXPONENT);

/**
 * Cross-check for the browser tests: does every emoji, at every angle it will
 * ever be drawn at and with the spin rotation it will ever have, clear the
 * heading box in at least one axis?
 */
function ringClearsHeading(geo) {
  const { radiusX, radiusY, widths, heights, clearX, clearY } = geo;
  const count = nodes.length;
  const samples = 600;

  for (let slot = 0; slot < count; slot += 1) {
    const base = (slot / count) * TAU;

    for (let step = 0; step < samples; step += 1) {
      const angle = base + (step / samples) * TAU;
      const point = unit(angle);
      const spin = angle * SPIN_RATIO;
      const halfX =
        (Math.abs(Math.cos(spin)) * widths[slot] +
          Math.abs(Math.sin(spin)) * heights[slot]) /
        2;
      const halfY =
        (Math.abs(Math.sin(spin)) * widths[slot] +
          Math.abs(Math.cos(spin)) * heights[slot]) /
        2;
      const x = Math.abs(point.x) * radiusX;
      const y = Math.abs(point.y) * radiusY;

      if (x + halfX < clearX && y + halfY < clearY) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Same question, but for the viewport edges: no emoji box may cross one. The
 * ring is centred on the heading, which is centred in the viewport, so the
 * binding case is the horizontal one at the widest point of the ring.
 */
function ringStaysInside(geo) {
  const { radiusX, radiusY, widths, heights } = geo;
  const count = nodes.length;
  const samples = 600;

  for (let slot = 0; slot < count; slot += 1) {
    const base = (slot / count) * TAU;

    for (let step = 0; step < samples; step += 1) {
      const angle = base + (step / samples) * TAU;
      const point = unit(angle);
      const spin = angle * SPIN_RATIO;
      const halfX =
        (Math.abs(Math.cos(spin)) * widths[slot] +
          Math.abs(Math.sin(spin)) * heights[slot]) /
        2;
      const halfY =
        (Math.abs(Math.sin(spin)) * widths[slot] +
          Math.abs(Math.cos(spin)) * heights[slot]) /
        2;

      if (
        Math.abs(point.x) * radiusX + halfX > window.innerWidth - MARGIN ||
        Math.abs(point.y) * radiusY + halfY > window.innerHeight - MARGIN
      ) {
        return false;
      }
    }
  }

  return true;
}

/** Position every emoji on the ring for a moment in time, in seconds. */
function place(time) {
  const geo = geometry();
  const { cx, cy, radiusX, radiusY, widths, heights } = geo;
  const count = nodes.length;

  nodes.forEach((node, index) => {
    const angle = (index / count) * TAU + time * SPEED;
    const point = unit(angle);
    const x = cx + point.x * radiusX - widths[index] / 2;
    const y = cy + point.y * radiusY - heights[index] / 2;

    node.style.transform =
      `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) ` +
      `rotate(${(angle * SPIN_RATIO).toFixed(2)}rad)`;
  });

  return geo;
}

function tick(now) {
  if (!running) {
    return;
  }
  place(now / 1000);
  frame = requestAnimationFrame(tick);
}

function start() {
  if (running) {
    return;
  }
  running = true;
  layer.dataset.orbit = "running";
  frame = requestAnimationFrame(tick);
}

function stop() {
  running = false;
  if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
}

function renderStatic() {
  stop();
  layer.dataset.orbit = "static";
  place(0);
}

/** Running, or parked: whichever the media query asks for. */
function apply() {
  if (reduceMotion.matches) {
    renderStatic();
    return;
  }
  start();
}

window.addEventListener(
  "resize",
  () => {
    // Repaint at the current moment. When parked, re-place the static ring so
    // a resize cannot leave stale positions outside the new viewport.
    place(running ? performance.now() / 1000 : 0);
  },
  { passive: true }
);

reduceMotion.addEventListener("change", apply);

apply();

// A tiny surface for the browser checks in CI-local verification: it lets a
// script read the live geometry instead of trusting a screenshot. It writes
// nothing to the DOM and holds no state of its own.
window.__orbit = {
  layer,
  nodes,
  geometry,
  place,
  ringClearsHeading,
  ringStaysInside,
  isRunning: () => running,
  state: () => layer.dataset.orbit,
};
