// SkillsBucket.jsx — Full rewrite with 3D bucket, 3D balls with logos, spill animation
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
    html:"html5",html5:"html5",css:"css3",css3:"css3",
    js:"javascript","javascript (js)":"javascript",
    node:"nodejs","node.js":"nodejs",nodejs:"nodejs",
    react:"react","react.js":"react",reactjs:"react",
    "next.js":"nextjs",nextjs:"nextjs",vue:"vuejs","vue.js":"vuejs",
    tailwind:"tailwindcss",tailwindcss:"tailwindcss",
    express:"express","express.js":"express",
    postgres:"postgresql",sql:"mysql","c++":"cplusplus","c#":"csharp",
    "android studio":"androidstudio","vs":"vscode","vs code":"vscode",
    "google cloud":"googlecloud",gcp:"googlecloud",aws:"amazonwebservices",
    solidity:"solidity","spring boot":"spring","three.js":"threejs",
    "nuxt.js":"nuxtjs",nuxt:"nuxtjs",
  };
  if (overrides[raw]) return overrides[raw];
  return raw.replace(/\.js$/i,"js").replace(/\./g,"").replace(/\s+/g,"").replace(/[^a-z0-9]/g,"");
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

const CATEGORY_META = {
  Frontend: { color: "#f13024" },
  Backend:  { color: "#f97316" },
  Database: { color: "#3b82f6" },
  Tools:    { color: "#a855f7" },
};

const GRAVITY  = 0.45;
const DAMPING  = 0.68;
const FRICTION = 0.86;
const BALL_R   = 30;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Pre-load image for a skill name, tries fallbacks
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
  img.onload  = () => onLoad(img);
  img.onerror = () => { idx++; tryNext(); };
  tryNext();
  return img;
}

function makeBall(name, category, x, y) {
  const angle = Math.random() * Math.PI * 2;
  return {
    id:   `${category}-${name}-${Math.random()}`,
    name, category,
    x, y,
    vx: Math.cos(angle) * (Math.random() * 2 + 0.5),
    vy: Math.sin(angle) * (Math.random() * 2 + 0.5),
    r:  BALL_R,
    img: null,
    imgLoaded: false,
    // 3D effect rotation angle
    rotAngle: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.04,
  };
}

function reflectOffSegment(ball, seg) {
  const dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len < 1) return;
  const t = clamp(((ball.x-seg.x1)*dx + (ball.y-seg.y1)*dy) / (len*len), 0, 1);
  const cx = seg.x1 + t*dx, cy = seg.y1 + t*dy;
  const edx = ball.x - cx, edy = ball.y - cy;
  const d = Math.sqrt(edx*edx + edy*edy);
  if (d < ball.r && d > 0.01) {
    const enx = edx/d, eny = edy/d;
    ball.x += enx*(ball.r - d);
    ball.y += eny*(ball.r - d);
    const dot = ball.vx*enx + ball.vy*eny;
    if (dot < 0) {
      ball.vx -= (1+DAMPING)*dot*enx;
      ball.vy -= (1+DAMPING)*dot*eny;
      ball.vx *= FRICTION;
      ball.vy *= FRICTION;
    }
  }
}

// ── Draw a 3D-style ball on canvas ──────────────────────────────────────────
function draw3DBall(ctx, ball, color, isDark) {
  const { x, y, r } = ball;

  // Outer glow
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur  = 18;

  // Main sphere gradient (3D illusion: light from top-left)
  const grad = ctx.createRadialGradient(
    x - r*0.35, y - r*0.38, r*0.05,
    x, y, r
  );
  grad.addColorStop(0,   color + "ff");
  grad.addColorStop(0.45, color + "cc");
  grad.addColorStop(0.8,  color + "88");
  grad.addColorStop(1,    color + "33");

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Specular highlight (white gloss top-left)
  const spec = ctx.createRadialGradient(
    x - r*0.32, y - r*0.35, 0,
    x - r*0.2,  y - r*0.2,  r*0.65
  );
  spec.addColorStop(0,   "rgba(255,255,255,0.72)");
  spec.addColorStop(0.4, "rgba(255,255,255,0.18)");
  spec.addColorStop(1,   "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.fillStyle = spec;
  ctx.fill();

  // Bottom shadow reflection
  const shadow = ctx.createRadialGradient(
    x + r*0.2, y + r*0.35, 0,
    x + r*0.1, y + r*0.3,  r*0.6
  );
  shadow.addColorStop(0,   "rgba(0,0,0,0.28)");
  shadow.addColorStop(1,   "rgba(0,0,0,0)");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.fillStyle = shadow;
  ctx.fill();

  // Border
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Logo or initials inside ball
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r*0.66, 0, Math.PI*2);
  ctx.clip();

  if (ball.img && ball.imgLoaded) {
    const s = r * 1.18;
    ctx.drawImage(ball.img, x - s/2, y - s/2, s, s);
  } else {
    ctx.fillStyle   = "rgba(255,255,255,0.92)";
    ctx.font        = `900 ${Math.floor(r*0.48)}px Inter,sans-serif`;
    ctx.textAlign   = "center";
    ctx.textBaseline= "middle";
    ctx.fillText(ball.name.slice(0,3).toUpperCase(), x, y);
  }
  ctx.restore();
  ctx.restore();
}

// ── Draw 3D bucket ───────────────────────────────────────────────────────────
function draw3DBucket(ctx, W, H, isDark, spillState) {
  const cx  = W / 2;
  const baseY = H - 18;
  const BW  = 170;  // bottom width
  const BTW = 200;  // top width
  const BH  = 150;  // height

  const topY    = baseY - BH;
  const leftTop = cx - BTW/2, rightTop = cx + BTW/2;
  const leftBot = cx - BW/2,  rightBot = cx + BW/2;

  // Spill: tilt bucket
  let tiltAngle = 0;
  let tx = 0, ty = 0;
  if (spillState.spilling) {
    tiltAngle = spillState.tiltAngle;
    tx = spillState.tx || 0;
    ty = spillState.ty || 0;
  }

  ctx.save();
  ctx.translate(cx + tx, baseY + ty);
  ctx.rotate(tiltAngle);
  ctx.translate(-cx, -baseY);

  const bucketColor  = isDark ? "rgba(220,220,230,0.92)" : "rgba(28,28,38,0.92)";
  const fillColor    = isDark ? "rgba(180,185,210,0.10)" : "rgba(20,24,48,0.08)";
  const rimColor     = isDark ? "rgba(255,255,255,0.70)" : "rgba(20,20,30,0.80)";
  const meshColor    = isDark ? "rgba(255,255,255,0.12)" : "rgba(20,20,30,0.14)";

  // Main body fill
  ctx.beginPath();
  ctx.moveTo(leftBot, baseY);
  ctx.lineTo(leftTop, topY);
  ctx.lineTo(rightTop, topY);
  ctx.lineTo(rightBot, baseY);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();

  // 3D left face shading
  const lGrad = ctx.createLinearGradient(leftBot, baseY, leftTop, topY);
  lGrad.addColorStop(0, isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)");
  lGrad.addColorStop(1, isDark ? "rgba(255,255,255,0.00)" : "rgba(0,0,0,0.00)");
  ctx.beginPath();
  ctx.moveTo(leftBot, baseY);
  ctx.lineTo(leftTop, topY);
  ctx.lineTo(cx, topY);
  ctx.lineTo(cx, baseY);
  ctx.closePath();
  ctx.fillStyle = lGrad;
  ctx.fill();

  // Grid mesh lines
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = meshColor;
  ctx.lineWidth   = 1;
  // Horizontal
  for (let row = 1; row <= 6; row++) {
    const t = row / 7;
    const lx = leftBot + (leftTop - leftBot) * t;
    const rx = rightBot + (rightTop - rightBot) * t;
    const ry = baseY - BH * t;
    ctx.beginPath();
    ctx.moveTo(lx, ry);
    ctx.lineTo(rx, ry);
    ctx.stroke();
  }
  // Vertical
  for (let col = 1; col <= 8; col++) {
    const t = col / 9;
    ctx.beginPath();
    ctx.moveTo(leftBot + (rightBot - leftBot)*t, baseY);
    ctx.lineTo(leftTop + (rightTop - leftTop)*t, topY);
    ctx.stroke();
  }
  ctx.restore();

  // Outline
  ctx.beginPath();
  ctx.moveTo(leftBot, baseY);
  ctx.lineTo(leftTop, topY);
  ctx.lineTo(rightTop, topY);
  ctx.lineTo(rightBot, baseY);
  ctx.closePath();
  ctx.strokeStyle = bucketColor;
  ctx.lineWidth   = 3;
  ctx.lineJoin    = "round";
  ctx.stroke();

  // Bottom ellipse
  ctx.beginPath();
  ctx.ellipse(cx, baseY, BW/2, 8, 0, 0, Math.PI*2);
  ctx.strokeStyle = bucketColor;
  ctx.lineWidth   = 2.5;
  ctx.stroke();
  ctx.fillStyle = isDark ? "rgba(200,205,220,0.08)" : "rgba(20,20,35,0.06)";
  ctx.fill();

  // Top rim (ellipse) — 3D rim effect
  ctx.beginPath();
  ctx.ellipse(cx, topY, BTW/2, 11, 0, 0, Math.PI*2);
  ctx.strokeStyle = rimColor;
  ctx.lineWidth   = 5;
  ctx.stroke();

  // Top rim inner fill for depth
  ctx.beginPath();
  ctx.ellipse(cx, topY, BTW/2 - 3, 8, 0, 0, Math.PI*2);
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.22)" : "rgba(20,20,40,0.22)";
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Handle (arc on top)
  ctx.beginPath();
  ctx.arc(cx, topY - 10, BTW/3.2, Math.PI, 0, false);
  ctx.strokeStyle = isDark ? "rgba(200,205,220,0.55)" : "rgba(28,28,48,0.55)";
  ctx.lineWidth   = 4;
  ctx.stroke();

  ctx.restore();
}

// ── Bucket walls (trapezoid) for collision ───────────────────────────────────
function getBucketWalls(W, H) {
  const cx  = W / 2, baseY = H - 18;
  const BW  = 170, BTW = 200, BH = 150;
  const topY = baseY - BH;
  return [
    { x1: cx-BW/2, y1: baseY, x2: cx+BW/2,  y2: baseY  }, // bottom
    { x1: cx-BW/2, y1: baseY, x2: cx-BTW/2, y2: topY   }, // left wall
    { x1: cx+BW/2, y1: baseY, x2: cx+BTW/2, y2: topY   }, // right wall
  ];
}

// ── Main BucketCanvas ────────────────────────────────────────────────────────
function BucketCanvas({ allBalls, isDark, getColor }) {
  const canvasRef   = useRef(null);
  const wrapRef     = useRef(null);
  const animRef     = useRef(null);
  const ballsRef    = useRef([]);
  const mouseRef    = useRef({ x: -9999, y: -9999 });
  const sizeRef     = useRef({ W: 0, H: 0 });
  const initDoneRef = useRef(false);
  // Spill state
  const spillRef    = useRef({ spilling: false, tiltAngle: 0, tiltTarget: 0, tiltSpeed: 0.04, tx: 0, ty: 0 });
  const fallenRef   = useRef(false);

  const initBalls = useCallback((W, H, balls) => {
    ballsRef.current = balls.map(({ name, category }) => {
      const b = makeBall(name, category,
        W/2 + (Math.random()-0.5)*60,
        H/2 - Math.random()*100 - 30
      );
      // Load image
      loadSkillImage(name, (img) => {
        b.img = img;
        b.imgLoaded = true;
      });
      return b;
    });
    fallenRef.current = false;
    spillRef.current  = { spilling: false, tiltAngle: 0, tiltTarget: 0, tiltSpeed: 0.04, tx: 0, ty: 0 };
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
        }
      }
    });
    ro.observe(wrap);

    const draw = () => {
      const { W, H } = sizeRef.current;
      if (!W || !H) { animRef.current = requestAnimationFrame(draw); return; }

      const ctx    = canvas.getContext("2d");
      const spill  = spillRef.current;
      const fallen = fallenRef.current;
      const walls  = fallen ? [] : getBucketWalls(W, H);

      ctx.clearRect(0, 0, W, H);

      // Animate bucket tipping
      if (spill.spilling && !fallen) {
        spill.tiltAngle += spill.tiltSpeed;
        spill.tx = spill.tiltAngle * 60;
        spill.ty = Math.abs(spill.tiltAngle) * 30;
        if (spill.tiltAngle >= Math.PI * 0.72) {
          fallenRef.current = true;
          spill.spilling = false;
          // Launch all balls with force
          ballsRef.current.forEach((ball) => {
            ball.vx += (Math.random()-0.3)*18;
            ball.vy  = -(Math.random()*16+8);
          });
        }
      }

      // Draw bucket (only if not fully fallen)
      if (!fallen) {
        draw3DBucket(ctx, W, H, isDark, spill);
      }

      // Ball shadow on floor
      ballsRef.current.forEach((ball) => {
        const shadowY = H - 6;
        if (ball.y + ball.r < shadowY) {
          const dist = (shadowY - ball.y - ball.r) / H;
          const sx   = ball.x;
          const sRad = ball.r * (0.9 - dist*0.4);
          const sAlpha = 0.22 - dist*0.18;
          if (sAlpha > 0) {
            const sg = ctx.createRadialGradient(sx, shadowY, 0, sx, shadowY, sRad*2);
            sg.addColorStop(0, `rgba(0,0,0,${sAlpha})`);
            sg.addColorStop(1, "rgba(0,0,0,0)");
            ctx.beginPath();
            ctx.ellipse(sx, shadowY, sRad*1.6, sRad*0.38, 0, 0, Math.PI*2);
            ctx.fillStyle = sg;
            ctx.fill();
          }
        }
      });

      // Physics + draw balls
      ballsRef.current.forEach((ball) => {
        ball.vy += GRAVITY;
        ball.x  += ball.vx;
        ball.y  += ball.vy;
        ball.rotAngle += ball.rotSpeed;

        // Mouse repulsion
        const mdx = ball.x - mouseRef.current.x;
        const mdy = ball.y - mouseRef.current.y;
        const md  = Math.sqrt(mdx*mdx + mdy*mdy);
        if (md < 85 && md > 0.1) {
          const f = ((85-md)/85)*3.2;
          ball.vx += (mdx/md)*f;
          ball.vy += (mdy/md)*f;
        }

        // Boundary collisions
        if (ball.y + ball.r > H) { ball.y = H - ball.r; ball.vy *= -DAMPING; ball.vx *= FRICTION; }
        if (ball.y - ball.r < 0) { ball.y = ball.r;     ball.vy *= -DAMPING; }
        if (ball.x - ball.r < 0) { ball.x = ball.r;     ball.vx *= -DAMPING; }
        if (ball.x + ball.r > W) { ball.x = W - ball.r; ball.vx *= -DAMPING; }

        // Bucket wall collisions
        if (!fallen) walls.forEach(seg => reflectOffSegment(ball, seg));

        // Ball-ball collisions
        ballsRef.current.forEach((other) => {
          if (other === ball) return;
          const dx = ball.x - other.x, dy = ball.y - other.y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          const minD = ball.r + other.r;
          if (d < minD && d > 0.01) {
            const nx = dx/d, ny = dy/d, ov = (minD-d)/2;
            ball.x  += nx*ov; ball.y  += ny*ov;
            other.x -= nx*ov; other.y -= ny*ov;
            const dot = (ball.vx-other.vx)*nx + (ball.vy-other.vy)*ny;
            if (dot < 0) {
              ball.vx  -= dot*nx; ball.vy  -= dot*ny;
              other.vx += dot*nx; other.vy += dot*ny;
            }
          }
        });

        draw3DBall(ctx, ball, getColor(ball.category), isDark);
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      initDoneRef.current = false;
    };
  }, [allBalls, isDark, getColor, initBalls]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (fallenRef.current) {
      // Reset: put balls back in bucket
      const { W, H } = sizeRef.current;
      initBalls(W, H, allBalls);
      return;
    }
    // Start tipping animation
    spillRef.current.spilling   = true;
    spillRef.current.tiltTarget = Math.PI * 0.75;
  }, [allBalls, initBalls]);

  return (
    <div ref={wrapRef} className="skillsbucket-canvas-wrap">
      <canvas
        ref={canvasRef}
        className="skillsbucket-canvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { mouseRef.current = { x: -9999, y: -9999 }; }}
        onDoubleClick={handleDoubleClick}
      />
    </div>
  );
}

// ── Mini physics canvas (inside arranged category box) ───────────────────────
function MiniPhysicsCanvas({ items, color }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const ballsRef  = useRef([]);
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const initRef   = useRef(false);

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
            const b = makeBall(name, "mini",
              W/2 + (Math.random()-0.5)*60,
              H/2 + (Math.random()-0.5)*60
            );
            b.r = 20;
            loadSkillImage(name, (img) => {
              b.img = img;
              b.imgLoaded = true;
            });
            return b;
          });
        }
      }
    });
    ro.observe(canvas);

    const draw = () => {
      if (!canvas.width || !canvas.height) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      const CW = canvas.width, CH = canvas.height;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, CW, CH);

      ballsRef.current.forEach((ball) => {
        ball.vy += 0.28;
        ball.x  += ball.vx;
        ball.y  += ball.vy;

        if (ball.y+ball.r > CH) { ball.y=CH-ball.r; ball.vy*=-0.6; ball.vx*=0.88; }
        if (ball.y-ball.r < 0)  { ball.y=ball.r;    ball.vy*=-0.6; }
        if (ball.x-ball.r < 0)  { ball.x=ball.r;    ball.vx*=-0.6; }
        if (ball.x+ball.r > CW) { ball.x=CW-ball.r; ball.vx*=-0.6; }

        const mdx = ball.x-mouseRef.current.x, mdy = ball.y-mouseRef.current.y;
        const md  = Math.sqrt(mdx*mdx+mdy*mdy);
        if (md < 65 && md > 0.1) {
          ball.vx += (mdx/md)*((65-md)/65)*2.4;
          ball.vy += (mdy/md)*((65-md)/65)*2.4;
        }

        ballsRef.current.forEach((o) => {
          if (o === ball) return;
          const dx=ball.x-o.x, dy=ball.y-o.y;
          const d=Math.sqrt(dx*dx+dy*dy), md2=ball.r+o.r;
          if (d < md2 && d > 0.01) {
            const nx=dx/d, ny=dy/d, ov=(md2-d)/2;
            ball.x+=nx*ov; ball.y+=ny*ov; o.x-=nx*ov; o.y-=ny*ov;
            const dot=(ball.vx-o.vx)*nx+(ball.vy-o.vy)*ny;
            if (dot<0) { ball.vx-=dot*nx; ball.vy-=dot*ny; o.vx+=dot*nx; o.vy+=dot*ny; }
          }
        });

        draw3DBall(ctx, ball, color, true);
      });

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      initRef.current = false;
    };
  }, [items, color]);

  return (
    <canvas
      ref={canvasRef}
      className="skillbox-canvas"
      onMouseMove={(e) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        mouseRef.current = { x: e.clientX-rect.left, y: e.clientY-rect.top };
      }}
      onMouseLeave={() => { mouseRef.current = { x:-9999, y:-9999 }; }}
    />
  );
}

// ── Skill logo for grid mode ──────────────────────────────────────────────────
function SkillImg({ name, size = 26 }) {
  const urls = resolveSkillLogo(name) || [];
  const [idx, setIdx] = useState(0);
  const initials = safeString(name).slice(0,3).toUpperCase();
  if (!urls[idx]) return (
    <span style={{ fontSize:size*0.38, fontWeight:900, color:"#f13024",
      WebkitTextFillColor:"#f13024", lineHeight:1 }}>{initials}</span>
  );
  return (
    <img src={urls[idx]} alt={name} width={size} height={size}
      style={{ objectFit:"contain", display:"block", userSelect:"none", pointerEvents:"none" }}
      onError={() => setIdx(p => p+1)} loading="lazy" />
  );
}

// ── Category box ──────────────────────────────────────────────────────────────
function CategoryBox({ category, items }) {
  const col = CATEGORY_META[category]?.color || "#f13024";
  const [gridMode, setGridMode] = useState(false);

  return (
    <Box className="skillbox-card">
      <Box className="skillbox-header">
        <Box className="skillbox-dot" style={{ background:col, boxShadow:`0 0 8px ${col}` }} />
        <Typography className="skillbox-title" style={{ color:col, WebkitTextFillColor:col }}>
          {category}
        </Typography>
        <Typography className="skillbox-count">{items.length} skills</Typography>
        <button
          className="skillbox-arrange-btn"
          style={{ borderColor:col+"66", color:col }}
          title={gridMode ? "Physics mode" : "Arrange in grid"}
          onClick={() => setGridMode(p => !p)}
        >
          {gridMode ? "🌀" : "⊞"}
        </button>
      </Box>

      <Box className="skillbox-body">
        {gridMode ? (
          <Box className="skillbox-grid">
            {items.map((name, i) => (
              <Box key={i} className="skillbox-item" style={{ animationDelay:`${i*0.04}s` }}>
                <Box className="skillbox-item-logo"
                  style={{ borderColor:col+"44", background:col+"11" }}>
                  <SkillImg name={name} size={26} />
                </Box>
                <Typography className="skillbox-item-name">{name}</Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <MiniPhysicsCanvas items={items} color={col} />
        )}
      </Box>

      {!gridMode && (
        <Box className="skillbox-names">
          {items.map((name, i) => (
            <Box key={i} className="skillbox-name-chip"
              style={{ borderColor:col+"44", background:col+"11",
                color:col, WebkitTextFillColor:col }}>
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
    ].filter(g => g.items.length > 0);
  }, [skills]);

  const allBalls = useMemo(() =>
    skillGroups.flatMap(g => g.items.map(name => ({ name, category: g.category }))),
    [skillGroups]
  );

  const getColor = useCallback((category) =>
    CATEGORY_META[category]?.color || "#f13024", []);

  const [mode, setMode] = useState("bucket");

  if (loading) return (
    <Box sx={{ display:"flex", flexDirection:"column", gap:2, mt:2 }}>
      {[...Array(3)].map((_,i) => <Skeleton key={i} height={80} sx={{ borderRadius:3 }} />)}
    </Box>
  );

  if (!allBalls.length) return (
    <Box sx={{ p:3, opacity:0.6 }}><Typography>No skills added yet.</Typography></Box>
  );

  return (
    <Box className="skillsbucket-root">
      <Box className="skillsbucket-topbar">
        <button
          className={`sbb-btn ${mode==="bucket" ? "sbb-btn-active" : ""}`}
          onClick={() => setMode("bucket")}
        >
          <MdOutlineShoppingBasket style={{ fontSize:"1rem" }} />
          Put in Bucket
        </button>
        <button
          className={`sbb-btn ${mode==="arranged" ? "sbb-btn-active" : ""}`}
          onClick={() => setMode("arranged")}
        >
          <MdGridView style={{ fontSize:"1rem" }} />
          Arrange in Order
        </button>
        {mode === "bucket" && (
          <Typography className="sbb-hint">
            Move cursor to push • Double-click to spill • Double-click again to reset
          </Typography>
        )}
      </Box>

      <AnimatePresence mode="wait">
        {mode === "bucket" ? (
          <motion.div key="bucket"
            initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0, scale:0.97 }} transition={{ duration:0.35 }}
            style={{ width:"100%", position:"relative" }}
          >
            <BucketCanvas allBalls={allBalls} isDark={isDark} getColor={getColor} />
            <Box className="skillsbucket-legend">
              {skillGroups.map(g => (
                <Box key={g.category} className="sbb-legend-item">
                  <span className="sbb-legend-dot" style={{ background:CATEGORY_META[g.category]?.color }} />
                  <span className="sbb-legend-label">{g.category}</span>
                </Box>
              ))}
            </Box>
          </motion.div>
        ) : (
          <motion.div key="arranged"
            initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-12 }} transition={{ duration:0.4 }}
            style={{ width:"100%" }}
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