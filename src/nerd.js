import React from "react";

const { sqrt, exp, sin, cos } = Math;

export function useProgress(frame, totalFrames, totalStars, fps) {
  const table = useTable(totalFrames, totalStars, fps);
  return table[frame][2];
}

function useTable(totalFrames, totalStars, fps) {
  return React.useMemo(() => {
    console.log("calc");
    const table = [];
    let px = 0;
    let pv = 0;
    for (let frame = 0; frame < totalFrames; frame++) {
      const target = Math.ceil(
        easeInOutSine(frame / (totalFrames - 1)) * totalStars
      );
      const { x, v } = spring({
        x0: px,
        v0: pv,
        t0: 0,
        t: 1000 / fps,
        k: 170, // stiffness
        c: 26, // damping
        m: 1, // mass
        X: target,
      });
      px = x;
      pv = v;
      table.push([frame, target, x]);
    }
    // console.table(table);
    return table;
  }, [totalFrames, totalStars, fps]);
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeInOutSine(x) {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

// from  https://github.com/pomber/use-spring/blob/master/src/spring.ts
function spring({ x0, v0, t0, t, k, c, m, X }) {
  const dx = x0 - X;
  const dt = (t - t0) / 1000;
  const radicand = c * c - 4 * k * m;
  if (radicand > 0) {
    const rp = (-c + sqrt(radicand)) / (2 * m);
    const rn = (-c - sqrt(radicand)) / (2 * m);
    const a = (dx * rp - v0) / (rp - rn);
    const b = (v0 - dx * rn) / (rp - rn);
    return {
      x: X + a * exp(rn * dt) + b * exp(rp * dt),
      v: a * rn * exp(rn * dt) + b * rp * exp(rp * dt),
    };
  } else if (radicand < 0) {
    const r = -c / (2 * m);
    const s = sqrt(-radicand) / (2 * m);
    const a = dx;
    const b = (v0 - r * dx) / s;
    return {
      x: X + exp(r * dt) * (a * cos(s * dt) + b * sin(s * dt)),
      v:
        exp(r * dt) *
        ((b * s + a * r) * cos(s * dt) - (a * s - b * r) * sin(s * dt)),
    };
  } else {
    const r = -c / (2 * m);
    const a = dx;
    const b = v0 - r * dx;
    return {
      x: X + (a + b * dt) * exp(r * dt),
      v: (b + a * r + b * r * dt) * exp(r * dt),
    };
  }
}
