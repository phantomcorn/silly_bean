import type { CSSProperties } from "react";

export const BEAN_POINTS =
  "0,-32 36,-39 65,-20 65,16 36,39 0,44 -36,39 -65,16 -65,-20 -36,-39";

const BEAN_COLORS = ["#2f5d50", "#e0a526", "#3a3f8f", "#c4532f", "#c75b8a"];

interface BeanProps {
  fill?: string;
  rotate?: number;
  className?: string;
}

export function Bean({ fill = "var(--tomato)", rotate = 0, className }: BeanProps) {
  return (
    <svg className={className} viewBox="-70 -45 140 92" aria-hidden="true">
      <polygon points={BEAN_POINTS} fill={fill} transform={`rotate(${rotate})`} />
    </svg>
  );
}

// Deterministic PRNG so the field looks the same on every render.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE = BEAN_POINTS.split(" ").map((p) => p.split(",").map(Number));
const ROTATIONS = [0, 15, -15, 30, -30, 45, 90, 180];

const ROWS = 5;
const COLS = 7;

// One distinct spin duration per bean, spread evenly from 4s to 30s and
// shuffled across the grid. Uses its own PRNG so shapes and colours stay put.
const DURATIONS = (() => {
  const count = ROWS * COLS;
  const durations = Array.from({ length: count }, (_, i) => 4 + (26 * i) / (count - 1));
  const rand = mulberry32(42);
  for (let i = durations.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [durations[i], durations[j]] = [durations[j], durations[i]];
  }
  return durations;
})();

const FIELD_BEANS = (() => {
  const rand = mulberry32(7);
  const beans = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      // Jitter each vertex a little so no two beans are identical.
      const points = BASE.map(
        ([x, y]) => `${(x + (rand() - 0.5) * 12).toFixed(1)},${(y + (rand() - 0.5) * 12).toFixed(1)}`,
      ).join(" ");
      beans.push({
        key: `${row}-${col}`,
        points,
        fill: BEAN_COLORS[Math.floor(rand() * BEAN_COLORS.length)],
        x: 90 + col * 120,
        y: 90 + row * 120,
        rotate: ROTATIONS[Math.floor(rand() * ROTATIONS.length)],
        sx: (0.58 + rand() * 0.22).toFixed(2),
        sy: (0.45 + rand() * 0.5).toFixed(2),
        dur: `${DURATIONS[row * COLS + col].toFixed(2)}s`,
        delay: `${(-rand() * 28).toFixed(1)}s`,
        dir: rand() < 0.35 ? "reverse" : "normal",
      });
    }
  }
  return beans;
})();

export function BeanField() {
  return (
    <svg
      className="field"
      viewBox="0 0 900 660"
      role="img"
      aria-label="Thirty-five colourful geometric beans, each slowly spinning"
    >
      {FIELD_BEANS.map((b) => (
        <g
          key={b.key}
          className="bean"
          style={
            {
              "--dur": b.dur,
              "--delay": b.delay,
              "--dir": b.dir,
            } as CSSProperties
          }
        >
          <polygon
            points={b.points}
            fill={b.fill}
            transform={`translate(${b.x} ${b.y}) rotate(${b.rotate}) scale(${b.sx} ${b.sy})`}
          />
        </g>
      ))}
    </svg>
  );
}
