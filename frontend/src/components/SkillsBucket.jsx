// SkillsBucket.jsx — Full rewrite with ultra-realistic 3D bucket, drag-only balls, fallen draggable bucket
import React, {
  useEffect, useRef, useState, useCallback, useMemo
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Typography, Skeleton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { MdGridView, MdOutlineShoppingBasket } from "react-icons/md";

// ── helpers ──────────────────────────────────────────────────────────────────
function safeString(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function splitCSV(s) {
  if (!s) return [];
  if (Array.isArray(s)) return s.filter(Boolean).map((x) => String(x).trim()).filter(Boolean);
  return String(s).split(",").map((x) => x.trim()).filter(Boolean);
}
function toDeviconSlug(name) {
  const raw = safeString(name).trim().toLowerCase();
  const overrides = {
    html: "html5", html5: "html5", css: "css3", css3: "css3",
    js: "javascript", "javascript (js)": "javascript",
    node: "nodejs", "node.js": "nodejs", nodejs: "nodejs",
    react: "react", "react.js": "react", reactjs: "react",
    "next.js": "nextjs", nextjs: "nextjs", vue: "vuejs", "vue.js": "vuejs",
    tailwind: "tailwindcss", tailwindcss: "tailwindcss",
    express: "express", "express.js": "express",
    postgres: "postgresql", sql: "mysql", "c++": "cplusplus", "c#": "csharp",
    "android studio": "androidstudio", vs: "vscode", "vs code": "vscode",
    "google cloud": "googlecloud", gcp: "googlecloud", aws: "amazonwebservices",
    solidity: "solidity", "spring boot": "spring", "three.js": "threejs",
    "nuxt.js": "nuxtjs", nuxt: "nuxtjs",
  };
  if (overrides[raw]) return overrides[raw];
  return raw
    .replace(/\.js$/i, "js")
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}
function resolveSkillLogo(name) {
  const slug = toDeviconSlug(name);
  if (!slug) return null;
  return [
    `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original.svg`,
    `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-plain.svg`,
    `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original-wordmark.svg`,
    `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-plain-wordmark.svg`,
  ];
}
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function dist(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function loadSkillImage(name, onLoad) {
  const urls = resolveSkillLogo(name);
  if (!urls) return null;
  const img = new Image();
  img.crossOrigin = "anonymous";
  let idx = 0;
  const tryNext = () => {
    if (idx >= urls.length) return;
    img.src = urls[idx];
  };
  img.onload = () => onLoad(img);
  img.onerror = () => { idx += 1; tryNext(); };
  tryNext();
  return img;
}

// ── constants ────────────────────────────────────────────────────────────────
// Category colors used for UI elements (dots, chips, headers)
const CATEGORY_META = {
  Frontend: { color: "#f13024" },
  Backend:  { color: "#f97316" },
  Database: { color: "#3b82f6" },
  Tools:    { color: "#a855f7" },
};

// All physics balls rendered in metallic gray regardless of category
const GRAVITY      = 0.42;
const DAMPING      = 0.70;
const FRICTION     = 0.985;
const AIR_FRICTION = 0.998;
const BALL_R       = 30;
const MINI_BALL_R  = 32;

function makeBall(name, category, x, y, r = BALL_R) {
  const angle = Math.random() * Math.PI * 2;
  return {
    id: `${category}-${name}-${Math.random()}`,
    name, category,
    x, y,
    vx: Math.cos(angle) * (Math.random() * 1.3 + 0.25),
    vy: Math.sin(angle) * (Math.random() * 1.3 + 0.25),
    r,
    img: null,
    imgLoaded: false,
    rotAngle: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.02,
    dragging:   false,
    dragOffX:   0,
    dragOffY:   0,
    prevDragX:  x,
    prevDragY:  y,
  };
}

// ── Reflect ball off a world-space line segment ───────────────────────────────
function reflectOffSegment(ball, seg) {
  const dx  = seg.x2 - seg.x1;
  const dy  = seg.y2 - seg.y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return;
  const t  = clamp(((ball.x - seg.x1) * dx + (ball.y - seg.y1) * dy) / (len * len), 0, 1);
  const cx = seg.x1 + t * dx;
  const cy = seg.y1 + t * dy;
  const edx = ball.x - cx;
  const edy = ball.y - cy;
  const d   = Math.sqrt(edx * edx + edy * edy);
  if (d < ball.r && d > 0.01) {
    const enx = edx / d;
    const eny = edy / d;
    ball.x += enx * (ball.r - d);
    ball.y += eny * (ball.r - d);
    const dot = ball.vx * enx + ball.vy * eny;
    if (dot < 0) {
      ball.vx -= (1 + DAMPING) * dot * enx;
      ball.vy -= (1 + DAMPING) * dot * eny;
      ball.vx *= 0.95;
      ball.vy *= 0.95;
    }
  }
}

// ── Ultra-realistic 3D metallic gray ball ─────────────────────────────────────
function drawUltraBall(ctx, ball, isDark) {
  const { x, y, r } = ball;
  ctx.save();

  // Ground shadow ellipse
  ctx.beginPath();
  ctx.ellipse(x + r * 0.16, y + r * 1.08, r * 1.0, r * 0.30, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fill();

  // Metallic sphere base gradient
  const main = ctx.createRadialGradient(
    x - r * 0.42, y - r * 0.52, r * 0.06,
    x + r * 0.12, y + r * 0.18, r * 1.15
  );
  main.addColorStop(0.00, "rgba(252,254,255,1)");
  main.addColorStop(0.12, "rgba(232,236,241,1)");
  main.addColorStop(0.28, "rgba(198,205,213,1)");
  main.addColorStop(0.52, "rgba(163,171,181,1)");
  main.addColorStop(0.74, "rgba(133,141,151,1)");
  main.addColorStop(0.90, "rgba(99,106,115,1)");
  main.addColorStop(1.00, "rgba(66,71,78,1)");

  ctx.shadowColor = "rgba(255,255,255,0.18)";
  ctx.shadowBlur  = 14;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = main;
  ctx.fill();

  // Dark rim fresnel
  const rim = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  rim.addColorStop(0,    "rgba(255,255,255,0.25)");
  rim.addColorStop(0.25, "rgba(255,255,255,0.06)");
  rim.addColorStop(0.6,  "rgba(0,0,0,0.10)");
  rim.addColorStop(1,    "rgba(0,0,0,0.32)");
  ctx.lineWidth   = 1.4;
  ctx.strokeStyle = rim;
  ctx.beginPath();
  ctx.arc(x, y, r - 0.7, 0, Math.PI * 2);
  ctx.stroke();

  // Strong glossy reflection
  const gloss = ctx.createRadialGradient(
    x - r * 0.38, y - r * 0.42, 0,
    x - r * 0.18, y - r * 0.14, r * 0.78
  );
  gloss.addColorStop(0,    "rgba(255,255,255,0.96)");
  gloss.addColorStop(0.22, "rgba(255,255,255,0.45)");
  gloss.addColorStop(0.55, "rgba(255,255,255,0.10)");
  gloss.addColorStop(1,    "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.arc(x, y, r * 0.96, 0, Math.PI * 2);
  ctx.fillStyle = gloss;
  ctx.fill();

  // Lower dark body contour
  const lowerShade = ctx.createRadialGradient(
    x + r * 0.18, y + r * 0.48, 0,
    x + r * 0.18, y + r * 0.48, r * 0.85
  );
  lowerShade.addColorStop(0, "rgba(0,0,0,0.26)");
  lowerShade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = lowerShade;
  ctx.fill();

  // Inner logo plate
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.63, 0, Math.PI * 2);
  ctx.clip();

  const plate = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  plate.addColorStop(0, "rgba(255,255,255,0.22)");
  plate.addColorStop(1, "rgba(0,0,0,0.08)");
  ctx.beginPath();
  ctx.arc(x, y, r * 0.63, 0, Math.PI * 2);
  ctx.fillStyle = plate;
  ctx.fill();

  if (ball.img && ball.imgLoaded) {
    const s = r * 1.10;
    ctx.drawImage(ball.img, x - s / 2, y - s / 2, s, s);
  } else {
    ctx.fillStyle    = "rgba(255,255,255,0.96)";
    ctx.font         = `900 ${Math.floor(r * 0.42)}px Inter,sans-serif`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ball.name.slice(0, 3).toUpperCase(), x, y);
  }
  ctx.restore();

  // Tiny specular dot
  ctx.beginPath();
  ctx.arc(x - r * 0.26, y - r * 0.30, r * 0.10, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.70)";
  ctx.fill();

  ctx.restore();
}

// ── Bucket state / geometry ───────────────────────────────────────────────────
function getBucketStateDefault() {
  return {
    spilling:     false,
    tiltAngle:    0,
    tiltVel:      0,
    tiltTarget:   0,
    fallen:       false,
    fallenAngle:  0,
    rotVel:       0,     // angular momentum for fallen spinning
    dragging:     false,
    dragOffX:     0,
    dragOffY:     0,
    prevDragX:    0,
    prevDragY:    0,
    baseYVel:     0,
    floorY:       null,
    fallenFloorY: null,
    centerX:      null,
    baseY:        null,
  };
}

function getBucketGeometry(W, H, bucketState) {
  const cx    = bucketState.centerX ?? (W / 2);
  const baseY = bucketState.baseY   ?? (H - 18);
  const BW    = 170;
  const BTW   = 200;
  const BH    = 150;
  const topY  = baseY - BH;
  return {
    cx, baseY, BW, BTW, BH, topY,
    leftTop:  cx - BTW / 2,
    rightTop: cx + BTW / 2,
    leftBot:  cx - BW / 2,
    rightBot: cx + BW / 2,
  };
}

function pointInBucketHitArea(px, py, W, H, bucketState) {
  const g     = getBucketGeometry(W, H, bucketState);
  const angle = bucketState.tiltAngle || 0;
  // Transform click into bucket-local space (undo the rotation)
  const dx  = px - g.cx;
  const dy  = py - g.baseY;
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const rx  = dx * cos - dy * sin + g.cx;
  const ry  = dx * sin + dy * cos + g.baseY;
  const pad = 28;
  return (
    rx >= g.leftTop  - pad &&
    rx <= g.rightTop + pad &&
    ry >= g.topY - 48 &&
    ry <= g.baseY + 28
  );
}

// ── Ultra-realistic 3D bucket draw ────────────────────────────────────────────
function drawUltraBucket(ctx, W, H, isDark, bucketState) {
  const g = getBucketGeometry(W, H, bucketState);
  const { cx, baseY, BW, BTW, BH, topY, leftTop, rightTop, leftBot, rightBot } = g;
  const angle = bucketState.tiltAngle || 0;

  ctx.save();
  // Pivot rotation at the base centre
  ctx.translate(cx, baseY);
  ctx.rotate(angle);
  ctx.translate(-cx, -baseY);

  const metalMain = ctx.createLinearGradient(leftTop, topY, rightBot, baseY);
  metalMain.addColorStop(0.00, "rgba(250,252,255,0.96)");
  metalMain.addColorStop(0.12, "rgba(221,226,232,0.96)");
  metalMain.addColorStop(0.30, "rgba(180,186,194,0.96)");
  metalMain.addColorStop(0.52, "rgba(143,150,160,0.96)");
  metalMain.addColorStop(0.75, "rgba(108,115,124,0.96)");
  metalMain.addColorStop(1.00, "rgba(77,82,90,0.98)");

  const sideShade = ctx.createLinearGradient(leftBot, baseY, rightBot, baseY);
  sideShade.addColorStop(0,    "rgba(255,255,255,0.18)");
  sideShade.addColorStop(0.48, "rgba(255,255,255,0.02)");
  sideShade.addColorStop(1,    "rgba(0,0,0,0.22)");

  // Floor shadow
  ctx.beginPath();
  ctx.ellipse(cx + 12, baseY + 9, BTW * 0.42, 16, angle * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.moveTo(leftBot, baseY);
  ctx.lineTo(leftTop, topY);
  ctx.lineTo(rightTop, topY);
  ctx.lineTo(rightBot, baseY);
  ctx.closePath();
  ctx.fillStyle = metalMain;
  ctx.fill();

  // Satin overlay
  ctx.beginPath();
  ctx.moveTo(leftBot, baseY);
  ctx.lineTo(leftTop, topY);
  ctx.lineTo(rightTop, topY);
  ctx.lineTo(rightBot, baseY);
  ctx.closePath();
  ctx.fillStyle = sideShade;
  ctx.fill();

  // Left highlight strip
  const strip = ctx.createLinearGradient(leftBot, baseY, leftTop, topY);
  strip.addColorStop(0, "rgba(255,255,255,0.14)");
  strip.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.moveTo(leftBot + 10, baseY);
  ctx.lineTo(leftTop + 14, topY);
  ctx.lineTo(leftTop + 42, topY);
  ctx.lineTo(leftBot + 26, baseY);
  ctx.closePath();
  ctx.fillStyle = strip;
  ctx.fill();

  // Mesh lines
  ctx.save();
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.10)" : "rgba(30,34,40,0.16)";
  ctx.lineWidth   = 1;
  for (let row = 1; row <= 7; row++) {
    const t  = row / 8;
    const lx = leftBot  + (leftTop  - leftBot)  * t;
    const rx = rightBot + (rightTop - rightBot) * t;
    const ry = baseY - BH * t;
    ctx.beginPath(); ctx.moveTo(lx, ry); ctx.lineTo(rx, ry); ctx.stroke();
  }
  for (let col = 1; col <= 8; col++) {
    const t = col / 9;
    ctx.beginPath();
    ctx.moveTo(leftBot  + (rightBot  - leftBot)  * t, baseY);
    ctx.lineTo(leftTop  + (rightTop  - leftTop)  * t, topY);
    ctx.stroke();
  }
  ctx.restore();

  // Outer edge
  ctx.beginPath();
  ctx.moveTo(leftBot, baseY);
  ctx.lineTo(leftTop, topY);
  ctx.lineTo(rightTop, topY);
  ctx.lineTo(rightBot, baseY);
  ctx.closePath();
  ctx.lineWidth   = 2.8;
  ctx.strokeStyle = isDark ? "rgba(250,252,255,0.72)" : "rgba(70,76,84,0.76)";
  ctx.stroke();

  // Bottom lip
  ctx.beginPath();
  ctx.ellipse(cx, baseY, BW / 2, 8.2, 0, 0, Math.PI * 2);
  ctx.fillStyle   = "rgba(108,115,124,0.34)";
  ctx.fill();
  ctx.lineWidth   = 2.2;
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.42)" : "rgba(40,45,52,0.42)";
  ctx.stroke();

  // Top rim outer
  ctx.beginPath();
  ctx.ellipse(cx, topY, BTW / 2, 11, 0, 0, Math.PI * 2);
  ctx.lineWidth   = 5.2;
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.82)" : "rgba(70,76,84,0.88)";
  ctx.stroke();

  // Top rim inner
  ctx.beginPath();
  ctx.ellipse(cx, topY, BTW / 2 - 6, 7.8, 0, 0, Math.PI * 2);
  ctx.lineWidth   = 2;
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.stroke();

  // Interior mouth shadow
  const mouth = ctx.createRadialGradient(cx, topY + 2, 0, cx, topY + 2, BTW / 2);
  mouth.addColorStop(0,    "rgba(40,44,50,0.40)");
  mouth.addColorStop(0.55, "rgba(60,64,72,0.16)");
  mouth.addColorStop(1,    "rgba(0,0,0,0)");
  ctx.beginPath();
  ctx.ellipse(cx, topY + 1, BTW / 2 - 8, 6.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = mouth;
  ctx.fill();


  ctx.restore();
}

// ── Bucket collision walls in WORLD space ─────────────────────────────────────
// Rotates the bucket's three containment walls (bottom, left, right) into world
// coordinates, then selectively removes walls on the "pour" side when tilted
// so balls ONLY leave through the top opening — never through the sides.
function getBucketWalls(W, H, bucketState) {
  const g     = getBucketGeometry(W, H, bucketState);
  const angle = bucketState.tiltAngle || 0;
  const cos   = Math.cos(angle);
  const sin   = Math.sin(angle);

  // Rotate a local point around pivot (cx, baseY)
  const rot = (lx, ly) => ({
    x: g.cx    + (lx - g.cx)    * cos - (ly - g.baseY) * sin,
    y: g.baseY + (lx - g.cx)    * sin + (ly - g.baseY) * cos,
  });

  const pLB = rot(g.leftBot,  g.baseY);
  const pRB = rot(g.rightBot, g.baseY);
  const pLT = rot(g.leftTop,  g.topY);
  const pRT = rot(g.rightTop, g.topY);

  // Threshold at which the opening side's wall dissolves
  // so balls naturally pour out from the tilted-open top corner.
  const tiltThresh = 0.42;

  const segs = [
    // Bottom — always solid
    { x1: pLB.x, y1: pLB.y, x2: pRB.x, y2: pRB.y },
  ];

  // Left wall: keep unless tilted right past threshold (opening on left-top side)
  if (angle <= tiltThresh) {
    segs.push({ x1: pLB.x, y1: pLB.y, x2: pLT.x, y2: pLT.y });
  }

  // Right wall: keep unless tilted left past threshold
  if (angle >= -tiltThresh) {
    segs.push({ x1: pRB.x, y1: pRB.y, x2: pRT.x, y2: pRT.y });
  }

  return segs;
}

// ── Main BucketCanvas ─────────────────────────────────────────────────────────
function BucketCanvas({ allBalls, isDark }) {
  const canvasRef   = useRef(null);
  const wrapRef     = useRef(null);
  const animRef     = useRef(null);
  const ballsRef    = useRef([]);
  const sizeRef     = useRef({ W: 0, H: 0 });
  const initDoneRef = useRef(false);
  const dragRef     = useRef({ type: null, id: null });
  const pointerRef  = useRef({ x: -9999, y: -9999, down: false });
  const bucketRef   = useRef(getBucketStateDefault());

  const initBalls = useCallback((W, H, balls) => {
    ballsRef.current = balls.map(({ name, category }) => {
      const b = makeBall(
        name, category,
        W / 2 + (Math.random() - 0.5) * 60,
        H / 2 - Math.random() * 100 - 30,
        BALL_R
      );
      loadSkillImage(name, (img) => { b.img = img; b.imgLoaded = true; });
      return b;
    });
    bucketRef.current = {
      ...getBucketStateDefault(),
      centerX:      W / 2,
      baseY:        H - 18,
      floorY:       H - 18,   // upright resting floor
      fallenFloorY: H - 110,  // fallen resting floor (accounts for rotated height)
      prevDragX:    W / 2,
      prevDragY:    H - 18,
    };
  }, []);

  useEffect(() => {
    const wrap   = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const W = Math.floor(entry.contentRect.width);
        const H = Math.floor(entry.contentRect.height);
        if (!W || !H) return;
        canvas.width  = W;
        canvas.height = H;
        sizeRef.current = { W, H };
        if (!initDoneRef.current) {
          initDoneRef.current = true;
          initBalls(W, H, allBalls);
        } else {
          if (bucketRef.current.centerX == null) bucketRef.current.centerX = W / 2;
          if (bucketRef.current.baseY   == null) bucketRef.current.baseY   = H - 18;
        }
      }
    });
    ro.observe(wrap);

    const draw = () => {
      const { W, H } = sizeRef.current;
      if (!W || !H) { animRef.current = requestAnimationFrame(draw); return; }

      const ctx    = canvas.getContext("2d");
      const bucket = bucketRef.current;

      ctx.clearRect(0, 0, W, H);

// ── Bucket tilt + gravity physics ──────────────────────────────────
      const uprightFloorY = bucket.floorY       ?? (H - 18);
      const fallenFloorY  = bucket.fallenFloorY ?? (H - 110);

      if (bucket.spilling && !bucket.fallen) {
        // Auto-spill: accelerate tilt rightward
        bucket.tiltVel   += 0.006;
        bucket.tiltAngle += bucket.tiltVel;
        if (bucket.tiltAngle >= Math.PI * 0.52) {
          bucket.tiltAngle   = Math.PI * 0.52;
          bucket.fallenAngle = Math.PI * 0.52;
          bucket.spilling    = false;
          bucket.fallen      = true;
          // Move baseY up so fallen bucket is fully visible
          bucket.baseY       = Math.min(bucket.baseY, H - 110);
          ballsRef.current.forEach((ball) => {
            ball.vx += Math.random() * 10 + 3;
            ball.vy  = -(Math.random() * 9 + 4);
          });
        }
} else if (bucket.fallen) {
        if (!bucket.dragging) {
          // Gravity pulls fallen bucket down to fallenFloorY
          bucket.baseYVel = (bucket.baseYVel || 0) + 0.55;
          bucket.baseY   += bucket.baseYVel;
          if (bucket.baseY >= fallenFloorY) {
            bucket.baseY    = fallenFloorY;
            bucket.baseYVel = 0;
          }
          // Coast with angular momentum, apply rotational friction
          bucket.rotVel        = (bucket.rotVel || 0) * 0.92;
          bucket.fallenAngle  += bucket.rotVel;

          // Settle to nearest stable resting angle:
          // 0° = upright, ±π/2 = on side, π = upside down
          // Find nearest multiple of π/2 and spring toward it softly
          const snapAngles = [
            -Math.PI * 2, -Math.PI * 1.5, -Math.PI, -Math.PI * 0.5,
             0,
             Math.PI * 0.5, Math.PI, Math.PI * 1.5, Math.PI * 2,
          ];
          let nearest = snapAngles[0];
          let minDist  = Math.abs(bucket.fallenAngle - snapAngles[0]);
          for (const a of snapAngles) {
            const d = Math.abs(bucket.fallenAngle - a);
            if (d < minDist) { minDist = d; nearest = a; }
          }
          // Only snap when spinning has slowed
          if (Math.abs(bucket.rotVel) < 0.04) {
            const springForce = (nearest - bucket.fallenAngle) * 0.06;
            bucket.rotVel    += springForce;
          }

          bucket.tiltAngle = bucket.fallenAngle;
        }
        // While dragging fallen bucket: allow free rotation based on drag direction
        // fallenAngle updates live so it sticks when released
      } else if (bucket.dragging) {
        // Upright + dragging: lean toward drag direction
        bucket.tiltVel   += (bucket.tiltTarget - bucket.tiltAngle) * 0.14;
        bucket.tiltVel   *= 0.68;
        bucket.tiltAngle += bucket.tiltVel;
        bucket.tiltAngle  = clamp(bucket.tiltAngle, -0.60, 0.60);
        // No gravity while actively dragging upright bucket
      } else {
        // Upright + released: spring tilt back to 0
        bucket.tiltVel   += (0 - bucket.tiltAngle) * 0.10;
        bucket.tiltVel   *= 0.78;
        bucket.tiltAngle += bucket.tiltVel;
        if (Math.abs(bucket.tiltAngle) < 0.001 && Math.abs(bucket.tiltVel) < 0.001) {
          bucket.tiltAngle = 0;
          bucket.tiltVel   = 0;
        }
// Gravity: pull upright bucket down to its floor
        if (bucket.baseY < uprightFloorY) {
          bucket.baseYVel = (bucket.baseYVel || 0) + 0.55;
          bucket.baseY   += bucket.baseYVel;
          if (bucket.baseY >= uprightFloorY) {
            bucket.baseY    = uprightFloorY;
            bucket.baseYVel = 0;
          }
        } else {
          // Already at floor — kill any residual velocity
          bucket.baseY    = uprightFloorY;
          bucket.baseYVel = 0;
        }
      }

      bucket.centerX = clamp(bucket.centerX, 110, W - 110);
      // Only clamp top; let gravity handle bottom
      bucket.baseY   = Math.max(bucket.baseY, 80);

      const walls = bucket.fallen ? [] : getBucketWalls(W, H, bucket);

      // Draw bucket below balls when upright
      if (!bucket.fallen) {
        drawUltraBucket(ctx, W, H, isDark, bucket);
      }

      // ── Ball physics ─────────────────────────────────────────────────────
      for (let i = 0; i < ballsRef.current.length; i += 1) {
        const ball = ballsRef.current[i];

        if (!ball.dragging) {
          ball.vy += GRAVITY;
          ball.vx *= AIR_FRICTION;
          ball.vy *= AIR_FRICTION;
          ball.x  += ball.vx;
          ball.y  += ball.vy;
          ball.rotAngle += ball.rotSpeed;

          if (ball.y + ball.r > H) { ball.y = H - ball.r; ball.vy *= -DAMPING; ball.vx *= FRICTION; }
          if (ball.y - ball.r < 0) { ball.y = ball.r;     ball.vy *= -DAMPING; }
          if (ball.x - ball.r < 0) { ball.x = ball.r;     ball.vx *= -DAMPING; }
          if (ball.x + ball.r > W) { ball.x = W - ball.r; ball.vx *= -DAMPING; }

          if (!bucket.fallen) {
            walls.forEach((seg) => reflectOffSegment(ball, seg));
          }
        } else {
          const newX    = clamp(pointerRef.current.x - ball.dragOffX, ball.r, W - ball.r);
          const newY    = clamp(pointerRef.current.y - ball.dragOffY, ball.r, H - ball.r);
          ball.vx        = (newX - ball.prevDragX) * 0.9;
          ball.vy        = (newY - ball.prevDragY) * 0.9;
          ball.x         = newX;
          ball.y         = newY;
          ball.prevDragX = newX;
          ball.prevDragY = newY;
        }
      }

      // ── Ball-ball collisions ─────────────────────────────────────────────
      for (let i = 0; i < ballsRef.current.length; i += 1) {
        for (let j = i + 1; j < ballsRef.current.length; j += 1) {
          const a  = ballsRef.current[i];
          const b  = ballsRef.current[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          const md = a.r + b.r;
          if (d < md && d > 0.01) {
            const nx = dx / d, ny = dy / d, ov = (md - d) / 2;
            if (!a.dragging) { a.x += nx * ov; a.y += ny * ov; }
            if (!b.dragging) { b.x -= nx * ov; b.y -= ny * ov; }
            const dot = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (dot < 0) {
              if (!a.dragging) { a.vx -= dot * nx; a.vy -= dot * ny; }
              if (!b.dragging) { b.vx += dot * nx; b.vy += dot * ny; }
            }
          }
        }
      }

      // Draw balls
      ballsRef.current.forEach((ball) => drawUltraBall(ctx, ball, isDark));

      // Draw fallen bucket above balls so it stays visible
      if (bucket.fallen) {
        drawUltraBucket(ctx, W, H, isDark, bucket);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      initDoneRef.current = false;
    };
  }, [allBalls, isDark, initBalls]);

  // ── Pointer helpers ──────────────────────────────────────────────────────
  const updatePointer = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    pointerRef.current.x = pt.x;
    pointerRef.current.y = pt.y;
    return pt;
  }, []);

  const handlePointerDown = useCallback((e) => {
    const pt = updatePointer(e);
    if (!pt) return;
    pointerRef.current.down = true;

    // Topmost ball first
    for (let i = ballsRef.current.length - 1; i >= 0; i -= 1) {
      const ball = ballsRef.current[i];
      if (dist(pt.x, pt.y, ball.x, ball.y) <= ball.r) {
        ball.dragging  = true;
        ball.dragOffX  = pt.x - ball.x;
        ball.dragOffY  = pt.y - ball.y;
        ball.prevDragX = ball.x;
        ball.prevDragY = ball.y;
        dragRef.current = { type: "ball", id: ball.id };
        ballsRef.current.splice(i, 1);
        ballsRef.current.push(ball);
        return;
      }
    }

    // Then bucket
    const { W, H } = sizeRef.current;
    if (pointInBucketHitArea(pt.x, pt.y, W, H, bucketRef.current)) {
      const bucket     = bucketRef.current;
      bucket.dragging  = true;
      bucket.dragOffX  = pt.x - bucket.centerX;
      bucket.dragOffY  = pt.y - bucket.baseY;
      bucket.prevDragX = pt.x;
      bucket.prevDragY = pt.y;
      bucket.baseYVel  = 0;
      dragRef.current  = { type: "bucket", id: "bucket" };
    }
  }, [updatePointer]);

  const handlePointerMove = useCallback((e) => {
    const pt = updatePointer(e);
    if (!pt) return;

const bucket = bucketRef.current;
    if (bucket.dragging) {
      const { W, H } = sizeRef.current;

      const newCX = clamp(pt.x - bucket.dragOffX, 110, W - 110);
      const newBY = pt.y - bucket.dragOffY; // free vertical drag

      const dragDX = pt.x - (bucket.prevDragX || pt.x);
      const dragDY = pt.y - (bucket.prevDragY || pt.y);

      if (!bucket.fallen) {
        // Upright: lean toward horizontal drag direction
        bucket.tiltTarget = clamp(dragDX * 0.055, -0.60, 0.60);
      } else {
        // Fallen: full free rotation with momentum
        // Accumulate angular velocity from drag speed
        const rotDelta = dragDX * 0.030 - dragDY * 0.010;
        bucket.rotVel  = (bucket.rotVel || 0) * 0.75 + rotDelta * 0.25;
        bucket.fallenAngle += bucket.rotVel;
        // Full 360 — no clamping, let it spin freely
        bucket.tiltAngle = bucket.fallenAngle;
      }

      bucket.prevDragX = pt.x;
      bucket.prevDragY = pt.y;
      bucket.baseYVel  = 0; // cancel gravity while dragging

      bucket.centerX = newCX;
      bucket.baseY   = newBY;
    }
  }, [updatePointer]);

const handlePointerUp = useCallback(() => {
    pointerRef.current.down = false;
    ballsRef.current.forEach((ball) => { if (ball.dragging) ball.dragging = false; });
    const bucket = bucketRef.current;
    if (bucket.dragging) {
      bucket.dragging = false;
      if (!bucket.fallen) {
        bucket.tiltTarget = 0; // upright: spring back
      }
      // fallen: keep rotVel so it coasts to a stop naturally
    }
    dragRef.current = { type: null, id: null };
  }, []);

  const handleDoubleClick = useCallback(() => {
    const bucket = bucketRef.current;
    if (bucket.fallen || bucket.spilling) {
      const { W, H } = sizeRef.current;
      initBalls(W, H, allBalls);
      return;
    }
    bucket.spilling = true;
    bucket.tiltVel  = 0;
  }, [allBalls, initBalls]);

  return (
    <div ref={wrapRef} className="skillsbucket-canvas-wrap">
      <canvas
        ref={canvasRef}
        className="skillsbucket-canvas"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      />
    </div>
  );
}

// ── Mini physics canvas (inside arranged category box) ───────────────────────
function MiniPhysicsCanvas({ items }) {
  const canvasRef  = useRef(null);
  const animRef    = useRef(null);
  const ballsRef   = useRef([]);
  const initRef    = useRef(false);
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const dragRef    = useRef({ id: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const W = Math.floor(entry.contentRect.width);
        const H = Math.floor(entry.contentRect.height);
        if (!W || !H) return;
        canvas.width  = W;
        canvas.height = H;
        if (!initRef.current) {
          initRef.current = true;
          ballsRef.current = items.map((name) => {
            const b = makeBall(
              name, "mini",
              W / 2 + (Math.random() - 0.5) * 60,
              H / 2 + (Math.random() - 0.5) * 30,
              MINI_BALL_R
            );
            loadSkillImage(name, (img) => { b.img = img; b.imgLoaded = true; });
            return b;
          });
        }
      }
    });
    ro.observe(canvas);

    const draw = () => {
      if (!canvas.width || !canvas.height) { animRef.current = requestAnimationFrame(draw); return; }
      const CW = canvas.width, CH = canvas.height;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, CW, CH);

      for (let i = 0; i < ballsRef.current.length; i += 1) {
        const ball = ballsRef.current[i];
        if (!ball.dragging) {
          ball.vy += 0.28;
          ball.vx *= 0.996;
          ball.vy *= 0.996;
          ball.x  += ball.vx;
          ball.y  += ball.vy;
          if (ball.y + ball.r > CH) { ball.y = CH - ball.r; ball.vy *= -0.62; ball.vx *= 0.90; }
          if (ball.y - ball.r < 0)  { ball.y = ball.r;      ball.vy *= -0.62; }
          if (ball.x - ball.r < 0)  { ball.x = ball.r;      ball.vx *= -0.62; }
          if (ball.x + ball.r > CW) { ball.x = CW - ball.r; ball.vx *= -0.62; }
        } else {
          const nx = clamp(pointerRef.current.x - ball.dragOffX, ball.r, CW - ball.r);
          const ny = clamp(pointerRef.current.y - ball.dragOffY, ball.r, CH - ball.r);
          ball.vx        = (nx - ball.prevDragX) * 0.92;
          ball.vy        = (ny - ball.prevDragY) * 0.92;
          ball.x         = nx;
          ball.y         = ny;
          ball.prevDragX = nx;
          ball.prevDragY = ny;
        }
      }

      for (let i = 0; i < ballsRef.current.length; i += 1) {
        for (let j = i + 1; j < ballsRef.current.length; j += 1) {
          const a = ballsRef.current[i], b = ballsRef.current[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          const md = a.r + b.r;
          if (d < md && d > 0.01) {
            const nx = dx / d, ny = dy / d, ov = (md - d) / 2;
            if (!a.dragging) { a.x += nx * ov; a.y += ny * ov; }
            if (!b.dragging) { b.x -= nx * ov; b.y -= ny * ov; }
            const dot = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (dot < 0) {
              if (!a.dragging) { a.vx -= dot * nx; a.vy -= dot * ny; }
              if (!b.dragging) { b.vx += dot * nx; b.vy += dot * ny; }
            }
          }
        }
      }

      ballsRef.current.forEach((ball) => drawUltraBall(ctx, ball, true));
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); initRef.current = false; };
  }, [items]);

  const getLocalPoint = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleDown = useCallback((e) => {
    const pt = getLocalPoint(e);
    if (!pt) return;
    pointerRef.current = pt;
    for (let i = ballsRef.current.length - 1; i >= 0; i -= 1) {
      const ball = ballsRef.current[i];
      if (dist(pt.x, pt.y, ball.x, ball.y) <= ball.r) {
        ball.dragging  = true;
        ball.dragOffX  = pt.x - ball.x;
        ball.dragOffY  = pt.y - ball.y;
        ball.prevDragX = ball.x;
        ball.prevDragY = ball.y;
        dragRef.current.id = ball.id;
        ballsRef.current.splice(i, 1);
        ballsRef.current.push(ball);
        return;
      }
    }
  }, [getLocalPoint]);

  const handleMove = useCallback((e) => {
    const pt = getLocalPoint(e);
    if (!pt) return;
    pointerRef.current = pt;
  }, [getLocalPoint]);

  const handleUp = useCallback(() => {
    ballsRef.current.forEach((ball) => { if (ball.dragging) ball.dragging = false; });
    dragRef.current.id = null;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="skillbox-canvas"
      onMouseDown={handleDown}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
    />
  );
}

// ── Skill logo for grid mode ──────────────────────────────────────────────────
function SkillImg({ name, size = 26 }) {
  const urls     = resolveSkillLogo(name) || [];
  const [idx, setIdx] = useState(0);
  const initials = safeString(name).slice(0, 3).toUpperCase();

  if (!urls[idx]) {
    return (
      <span style={{ fontSize: size * 0.38, fontWeight: 900, color: "#f13024", WebkitTextFillColor: "#f13024", lineHeight: 1 }}>
        {initials}
      </span>
    );
  }
  return (
    <img src={urls[idx]} alt={name} width={size} height={size}
      style={{ objectFit: "contain", display: "block", userSelect: "none", pointerEvents: "none" }}
      onError={() => setIdx((p) => p + 1)} loading="lazy" />
  );
}

// ── Category box ──────────────────────────────────────────────────────────────
function CategoryBox({ category, items }) {
  const col = CATEGORY_META[category]?.color || "#f13024";
  const [gridMode, setGridMode] = useState(false);

  return (
    <Box className="skillbox-card">
      <Box className="skillbox-header">
        <Box className="skillbox-dot" style={{ background: col, boxShadow: `0 0 8px ${col}` }} />
        <Typography className="skillbox-title" style={{ color: col, WebkitTextFillColor: col }}>
          {category}
        </Typography>
        <Typography className="skillbox-count">{items.length} skills</Typography>
        <button
          className="skillbox-arrange-btn"
          style={{ borderColor: `${col}66`, color: col }}
          title={gridMode ? "Physics mode" : "Arrange in grid"}
          onClick={() => setGridMode((p) => !p)}
        >
          {gridMode ? "🌀" : "⊞"}
        </button>
      </Box>

      <Box className="skillbox-body">
        {gridMode ? (
          <Box className="skillbox-grid">
            {items.map((name, i) => (
              <Box key={i} className="skillbox-item" style={{ animationDelay: `${i * 0.04}s` }}>
                <Box className="skillbox-item-logo" style={{ borderColor: `${col}44`, background: `${col}11` }}>
                  <SkillImg name={name} size={26} />
                </Box>
                <Typography className="skillbox-item-name">{name}</Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <MiniPhysicsCanvas items={items} />
        )}
      </Box>

      {!gridMode && (
        <Box className="skillbox-names">
          {items.map((name, i) => (
            <Box key={i} className="skillbox-name-chip"
              style={{ borderColor: `${col}44`, background: `${col}11`, color: col, WebkitTextFillColor: col }}>
              {name}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function SkillsBucketSection({ skills, loading }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";

  const skillGroups = useMemo(() => {
    const s = skills || {};
    return [
      { category: "Frontend", items: splitCSV(s.frontend) },
      { category: "Backend",  items: splitCSV(s.backend)  },
      { category: "Database", items: splitCSV(s.database) },
      { category: "Tools",    items: splitCSV(s.tools)    },
    ].filter((g) => g.items.length > 0);
  }, [skills]);

  const allBalls = useMemo(
    () => skillGroups.flatMap((g) => g.items.map((name) => ({ name, category: g.category }))),
    [skillGroups]
  );

  const [mode, setMode] = useState("bucket");

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
        {[...Array(3)].map((_, i) => <Skeleton key={i} height={80} sx={{ borderRadius: 3 }} />)}
      </Box>
    );
  }

  if (!allBalls.length) {
    return (
      <Box sx={{ p: 3, opacity: 0.6 }}>
        <Typography>No skills added yet.</Typography>
      </Box>
    );
  }

  return (
    <Box className="skillsbucket-root">
      <Box className="skillsbucket-topbar">
        <button
          className={`sbb-btn ${mode === "bucket" ? "sbb-btn-active" : ""}`}
          onClick={() => setMode("bucket")}
        >
          <MdOutlineShoppingBasket style={{ fontSize: "1rem" }} />
          Put in Bucket
        </button>

        <button
          className={`sbb-btn ${mode === "arranged" ? "sbb-btn-active" : ""}`}
          onClick={() => setMode("arranged")}
        >
          <MdGridView style={{ fontSize: "1rem" }} />
          Arrange in Order
        </button>

        {mode === "bucket" && (
          <Typography className="sbb-hint">
            Drag balls or bucket • Double-click bucket to spill • Double-click again to reset
          </Typography>
        )}
      </Box>

      <AnimatePresence mode="wait">
        {mode === "bucket" ? (
          <motion.div
            key="bucket"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35 }}
            style={{ width: "100%", position: "relative" }}
          >
            <BucketCanvas allBalls={allBalls} isDark={isDark} />
          </motion.div>
        ) : (
          <motion.div
            key="arranged"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            style={{ width: "100%" }}
          >
            <Box className="skillsbucket-arranged">
              {skillGroups.map((g) => (
                <CategoryBox key={g.category} category={g.category} items={g.items} />
              ))}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}