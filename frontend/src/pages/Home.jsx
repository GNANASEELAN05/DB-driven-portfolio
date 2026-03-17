import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import emailjs from "@emailjs/browser";
import http from "../api/http";
import SkillsBucketSection from "../components/SkillsBucket";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MdArrowOutward,
  MdDarkMode,
  MdDownload,
  MdEmail,
  MdLightMode,
  MdLink,
  MdPhone,
  MdRefresh,
  MdSchool,
  MdAdminPanelSettings,
  MdVisibility,
  MdClose,
  MdHome,
  MdPerson,
  MdCode,
  MdWork,
  MdTimeline,
  MdEmojiEvents,
  MdContacts,
  MdTerminal,
  MdLocationOn,
} from "react-icons/md";
import { FaGithub, FaLinkedin } from "react-icons/fa";

import {
  getProfile,
  getSkills,
  getFeaturedProjects,
  getExperience,
  getEducation,
  getSocials,
  getAchievements,
  getLanguageExperience,
  downloadResumeUrl,
  viewResumeUrl,
} from "../api/portfolio";

import AnimatedPhoto from "../assets/Animated_Prof_Photo.png";
import OriginalPhoto from "../assets/Proffessional_Gnanaseelan_V_Photo.png";

// ── NEW: API base + cert URL helper ──────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || "";
const certFileUrl = (achId) =>
  `${API_BASE}/api/portfolio/achievements/${achId}/certificate`;
// ─────────────────────────────────────────────────────────────────────────────

const MotionBox = motion.create(Box);
const MotionPaper = motion.create(Paper);

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.25, 0.25, 0.75] },
  },
};

const pageVariants = {
  enter: (direction) => ({
    opacity: 0,
    x: direction >= 0 ? 90 : -90,
    scale: 0.985,
    filter: "blur(10px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction >= 0 ? -70 : 70,
    scale: 0.985,
    filter: "blur(8px)",
    transition: { duration: 0.44, ease: [0.16, 1, 0.3, 1] },
  }),
};

function safeString(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function splitCSV(s) {
  if (!s) return [];
  if (Array.isArray(s)) return s.filter(Boolean).map((x) => String(x).trim()).filter(Boolean);
  return String(s).split(",").map((x) => x.trim()).filter(Boolean);
}

async function blobDownload(url) {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  let filename = "Resume.pdf";
  const cd = res.headers.get("content-disposition") || "";
  const match =
    cd.match(/filename\*=UTF-8''([^;]+)/i) ||
    cd.match(/filename="([^"]+)"/i) ||
    cd.match(/filename=([^;]+)/i);
  if (match?.[1]) {
    try { filename = decodeURIComponent(match[1]).replace(/["']/g, "").trim(); }
    catch { filename = String(match[1]).replace(/["']/g, "").trim(); }
    if (!filename.toLowerCase().endsWith(".pdf")) filename += ".pdf";
  }
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(objUrl);
  return filename;
}

// =============================================
// LANGUAGE LOGO CARD — CYBERPUNK HOLOGRAM PANEL
// =============================================
function LanguageLogoCard({ lang, index }) {
  const language   = safeString(lang?.language) || "—";
  const level      = safeString(lang?.level).trim().toLowerCase();
  const rawYears   = typeof lang?.years === "number"
    ? lang.years
    : Number.parseFloat(String(lang?.years ?? "0").replace(/[^\d.]/g, "") || "0");
  const years      = Number.isFinite(rawYears) ? Math.max(0, Math.min(5, rawYears)) : 0;

  const levelMap   = { beginner: 1, intermediate: 2, advanced: 3 };
  const levelNum   = levelMap[level] ?? 0;
  const levelPct   = { beginner: 33, intermediate: 66, advanced: 100 }[level] ?? 0;
  const yearsPct   = (years / 5) * 100;
  const levelLabel = level ? level.charAt(0).toUpperCase() + level.slice(1) : "Unknown";

  // Per-card color palette cycling
  const PALETTES = [
    { a: "#f13024", b: "#f97316", glow: "rgba(241,48,36,0.45)", dim: "rgba(241,48,36,0.12)", hue: "15" },
    { a: "#06b6d4", b: "#6366f1", glow: "rgba(6,182,212,0.40)", dim: "rgba(6,182,212,0.12)", hue: "195" },
    { a: "#a855f7", b: "#ec4899", glow: "rgba(168,85,247,0.40)", dim: "rgba(168,85,247,0.12)", hue: "270" },
    { a: "#10b981", b: "#06b6d4", glow: "rgba(16,185,129,0.38)", dim: "rgba(16,185,129,0.12)", hue: "160" },
    { a: "#f59e0b", b: "#f97316", glow: "rgba(245,158,11,0.38)", dim: "rgba(245,158,11,0.12)", hue: "38" },
    { a: "#3b82f6", b: "#06b6d4", glow: "rgba(59,130,246,0.38)", dim: "rgba(59,130,246,0.12)", hue: "215" },
  ];
  const pal = PALETTES[index % PALETTES.length];

  const logoInfo = resolveSkillLogo(language);
  const initials = language.slice(0, 3).toUpperCase();
  const [urlIndex, setUrlIndex] = React.useState(0);
  const urls = logoInfo
    ? [logoInfo.primary, logoInfo.fallback1, logoInfo.fallback2, logoInfo.fallback3]
    : [];
  const currentUrl = urls[urlIndex] || null;

  // Arc gauge math
  const R = 26, SWEEP = 220, GAP = (360 - SWEEP) / 2;
  const toXY = (deg, r) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: 36 + r * Math.cos(rad), y: 36 + r * Math.sin(rad) };
  };
  const startAngle = 90 + GAP;
  const s = toXY(startAngle, R);
  const e = toXY(startAngle + SWEEP, R);
  const arcTrack = `M ${s.x} ${s.y} A ${R} ${R} 0 1 1 ${e.x} ${e.y}`;
  const fillAngle = startAngle + (levelPct / 100) * SWEEP;
  const fe = toXY(fillAngle, R);
  const largeArc = (levelPct / 100) * SWEEP > 180 ? 1 : 0;
  const arcFill = levelPct > 0
    ? `M ${s.x} ${s.y} A ${R} ${R} 0 ${largeArc} 1 ${fe.x} ${fe.y}`
    : "";

  // Level to bar segments
  const barSegs = 12;
  const filledSegs = Math.round((levelPct / 100) * barSegs);

  return (
    <Box
      className="lholo-card"
      style={{
        "--lha": pal.a,
        "--lhb": pal.b,
        "--lhg": pal.glow,
        "--lhd": pal.dim,
        "--lhi": index,
        animationDelay: `${index * 0.08}s`,
      }}
    >
      {/* Spinning conic border */}
      <Box className="lholo-prism" style={{ background: `conic-gradient(from 0deg, transparent 40%, ${pal.a}, ${pal.b}, transparent)` }} />

      {/* Scan line sweep */}
      <Box className="lholo-scan" style={{ background: `linear-gradient(180deg, transparent, ${pal.a}18, ${pal.a}2a, ${pal.a}18, transparent)` }} />

      {/* Corner brackets */}
      <Box className="lholo-corner lholo-corner--tl" style={{ borderColor: `${pal.a}99` }} />
      <Box className="lholo-corner lholo-corner--br" style={{ borderColor: `${pal.b}77` }} />

      {/* Index stamp */}
      <Box className="lholo-idx-stamp" style={{ background: `linear-gradient(135deg, ${pal.a}, ${pal.b})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
        {String(index + 1).padStart(2, "0")}
      </Box>


{/* LEFT: Logo orb — matches exp-v4-hex-wrap style */}
<Box className="lholo-orb-wrap" style={{ position: "relative", zIndex: 2 }}>
  <Box className="lholo-hex-wrap" style={{ position: "relative", width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Box className="lholo-orb-ring lholo-ring-1" style={{ borderTopColor: pal.a, borderColor: `${pal.a}55`, position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid", animation: "lholoSpin1 4.5s linear infinite" }} />
    <Box className="lholo-orb-ring lholo-ring-2" style={{ borderRightColor: pal.b, borderColor: `${pal.b}33`, position: "absolute", inset: -8, borderRadius: "50%", border: "1px dashed", animation: "lholoSpin1 7.5s linear infinite reverse" }} />
    <Box className="lholo-orb-core" style={{
      position: "relative", zIndex: 4,
      background: `radial-gradient(circle at 35% 35%, ${pal.a}28, ${pal.b}14, transparent)`,
      borderColor: `${pal.a}44`,
      boxShadow: `0 0 24px ${pal.glow}, inset 0 0 16px ${pal.a}0d`,
    }}>
      {currentUrl ? (
        <img key={currentUrl} src={currentUrl} alt={language} className="lholo-logo-img"
          onError={() => setUrlIndex((p) => p + 1)} loading="lazy" />
      ) : (
        <Box className="lholo-logo-fallback" style={{ background: `linear-gradient(135deg, ${pal.a}, ${pal.b})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          {initials}
        </Box>
      )}
    </Box>
    <Box style={{ position: "absolute", inset: -10, borderRadius: "50%", background: `radial-gradient(circle, ${pal.a}44, transparent 70%)`, zIndex: 0, opacity: 0, transition: "opacity 0.35s ease", pointerEvents: "none" }} />
  </Box>
</Box>

      {/* CENTER: Name + metadata */}
      <Box className="lholo-info">
        {/* Language name */}
        <Typography className="lholo-name">{language}</Typography>

        {/* Level badge */}
        <Box className="lholo-level-badge" style={{ background: `${pal.a}18`, borderColor: `${pal.a}44`, color: pal.a, WebkitTextFillColor: pal.a }}>
          <span className="lholo-badge-dot" style={{ background: pal.a, boxShadow: `0 0 6px ${pal.a}` }} />
          {levelLabel}
        </Box>

        {/* Segmented bar */}
        <Box className="lholo-segbar-wrap">
          <Box className="lholo-segbar-label">PROFICIENCY</Box>
          <Box className="lholo-segbar">
            {Array.from({ length: barSegs }, (_, i) => (
              <Box
                key={i}
                className="lholo-seg"
                style={i < filledSegs ? {
                  background: `linear-gradient(135deg, ${pal.a}, ${pal.b})`,
                  boxShadow: `0 0 6px ${pal.a}66`,
                  opacity: 1 - (i / barSegs) * 0.25,
                } : undefined}
              />
            ))}
          </Box>
        </Box>

        {/* Exp track */}
        <Box className="lholo-exp-wrap">
          <Box className="lholo-exp-label-row">
            <Typography className="lholo-exp-lbl">EXP</Typography>
            <Typography className="lholo-exp-val" style={{ color: pal.a, WebkitTextFillColor: pal.a }}>{years}yr / 5yr</Typography>
          </Box>
          <Box className="lholo-track">
            <Box className="lholo-track-fill" style={{
              width: `${yearsPct}%`,
              background: `linear-gradient(90deg, ${pal.a}, ${pal.b})`,
              boxShadow: `0 0 10px ${pal.a}77`,
            }}>
              <Box className="lholo-shimmer" />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* RIGHT: Arc gauge */}
      <Box className="lholo-gauge-wrap">
        <svg viewBox="0 0 72 72" fill="none" className="lholo-gauge-svg">
          <defs>
            <linearGradient id={`lhg-${index}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={pal.a} stopOpacity="1" />
              <stop offset="100%" stopColor={pal.b} stopOpacity="1" />
            </linearGradient>
            <filter id={`lhf-${index}`}>
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Outer decorative ring */}
          <circle cx="36" cy="36" r="34" stroke={`${pal.a}18`} strokeWidth="1" fill="none" />
          {/* Track */}
          <path d={arcTrack} stroke="rgba(255,255,255,0.06)" strokeWidth="5" strokeLinecap="round" fill="none" />
          {/* Fill */}
          {arcFill && (
            <path
              d={arcFill}
              stroke={`url(#lhg-${index})`}
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              filter={`url(#lhf-${index})`}
            />
          )}
          {/* Center label */}
          <text x="36" y="32" textAnchor="middle" dominantBaseline="middle"
            fill={pal.a} fontSize="11" fontWeight="900" fontFamily="Inter, sans-serif"
            letterSpacing="-0.5">{levelPct}</text>
          <text x="36" y="43" textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.22)" fontSize="6" fontWeight="700" fontFamily="Inter, sans-serif"
            letterSpacing="0.8">PCT</text>
          {/* Tick marks around gauge */}
          {Array.from({ length: 12 }, (_, i) => {
            const tickAngle = startAngle + (i / 11) * SWEEP;
            const tInner = toXY(tickAngle, 30);
            const tOuter = toXY(tickAngle, 33);
            return (
              <line key={i} x1={tInner.x} y1={tInner.y} x2={tOuter.x} y2={tOuter.y}
                stroke={i <= Math.round((levelPct / 100) * 11) ? pal.a : "rgba(255,255,255,0.08)"}
                strokeWidth="1.5" strokeLinecap="round" />
            );
          })}
        </svg>

        {/* XP stars */}
        <Box className="lholo-stars">
          {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className={`lholo-star ${s <= Math.ceil((years / 5) * 5) ? "lholo-star-on" : "lholo-star-off"}`}
              style={s <= Math.ceil((years / 5) * 5) ? { color: pal.a, textShadow: `0 0 8px ${pal.a}` } : undefined}>
              ★
            </span>
          ))}
        </Box>
      </Box>

      {/* Bottom terminal strip */}
      <Box className="lholo-terminal" style={{ borderTopColor: `${pal.a}18`, background: `${pal.a}06` }}>
        <Box className="lholo-term-item">
          <Typography className="lholo-term-val" style={{ background: `linear-gradient(135deg, ${pal.a}, ${pal.b})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {String(levelNum)}/3
          </Typography>
          <Typography className="lholo-term-lbl">RANK</Typography>
        </Box>
        <Box className="lholo-term-sep" />
        <Box className="lholo-term-item">
          <Typography className="lholo-term-val" style={{ background: `linear-gradient(135deg, ${pal.b}, ${pal.a})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {years.toFixed(1)}
          </Typography>
          <Typography className="lholo-term-lbl">YEARS</Typography>
        </Box>
        <Box className="lholo-term-sep" />
        <Box className="lholo-term-item">
          <Typography className="lholo-term-val" style={{ background: `linear-gradient(135deg, ${pal.a}, ${pal.b})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {levelPct}%
          </Typography>
          <Typography className="lholo-term-lbl">MASTERY</Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Box className="lholo-active-chip" style={{ background: `${pal.a}14`, borderColor: `${pal.a}44`, color: pal.a, WebkitTextFillColor: pal.a }}>
          ✦ ACTIVE
        </Box>
      </Box>

      {/* Watermark */}
      <Box className="lholo-watermark" style={{ WebkitTextFillColor: `${pal.a}07` }}>⬡</Box>
    </Box>
  );
}
// =============================================
// DYNAMIC SKILL LOGO RESOLVER
// Converts any skill name → devicon CDN slug
// and tries 4 URL patterns before fallback
// =============================================
function toDeviconSlug(name) {
  const raw = safeString(name).trim().toLowerCase();

  const overrides = {
    "html":           "html5",
    "html5":          "html5",
    "css":            "css3",
    "css3":           "css3",
    "js":             "javascript",
    "javascript (js)":"javascript",
    "node":           "nodejs",
    "node.js":        "nodejs",
    "nodejs":         "nodejs",
    "react":          "react",
    "react.js":       "react",
    "reactjs":        "react",
    "next.js":        "nextjs",
    "nextjs":         "nextjs",
    "vue":            "vuejs",
    "vue.js":         "vuejs",
    "tailwind":       "tailwindcss",
    "tailwindcss":    "tailwindcss",
    "express":        "express",
    "express.js":     "express",
    "postgres":       "postgresql",
    "sql":            "mysql",
    "c++":            "cplusplus",
    "c#":             "csharp",
    "android studio": "androidstudio",
    "vs":             "vscode",
    "vs code":        "vscode",
    "google cloud":   "googlecloud",
    "gcp":            "googlecloud",
    "aws":            "amazonwebservices",
    "solidity":       "solidity",
    "spring boot":    "spring",
    "three.js":       "threejs",
    "nuxt.js":        "nuxtjs",
    "nuxt":           "nuxtjs",
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
  return {
    primary:   `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original.svg`,
    fallback1: `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-plain.svg`,
    fallback2: `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original-wordmark.svg`,
    fallback3: `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-plain-wordmark.svg`,
  };
}

// =============================================
// SKILL LOGO CARD
// Tries 4 URL patterns before showing initials
// =============================================
function SkillLogoCard({ name, index }) {
  const logoInfo = resolveSkillLogo(name);
  const initials = safeString(name).slice(0, 3).toUpperCase();
  const [urlIndex, setUrlIndex] = useState(0);

  const urls = logoInfo
    ? [logoInfo.primary, logoInfo.fallback1, logoInfo.fallback2, logoInfo.fallback3]
    : [];

  const currentUrl = urls[urlIndex] || null;

  return (
    <Box
      className="skill-logo-card"
      style={{ animationDelay: `${index * 0.04}s` }}
      title={name}
    >
      <Box className="skill-logo-card-inner">
        <Box className="skill-logo-glow-ring" />
        <Box className="skill-logo-icon-wrap">
          {currentUrl ? (
            <img
              key={currentUrl}
              src={currentUrl}
              alt={name}
              className="skill-logo-img"
              onError={() => setUrlIndex((prev) => prev + 1)}
              loading="lazy"
            />
          ) : (
            <Box className="skill-logo-fallback">{initials}</Box>
          )}
        </Box>
        <Typography className="skill-logo-name">{name}</Typography>
      </Box>
    </Box>
  );
}

// =============================================
// SKILL CATEGORY GROUP
// =============================================
function SkillCategoryGroup({ category, skills: skillList }) {
  if (!skillList?.length) return null;

  const categoryMeta = {
    Frontend: { icon: MdCode,     color: "#f13024" },
    Backend:  { icon: MdTerminal, color: "#f97316" },
    Database: { icon: MdWork,     color: "#3b82f6" },
    Tools:    { icon: MdTimeline, color: "#a855f7" },
  };
  const meta = categoryMeta[category] || { icon: MdCode, color: "#f13024" };
  const CategoryIcon = meta.icon;

  return (
    <Box className="skill-category-group">
      <Box className="skill-category-header">
        <Box
          className="skill-category-badge"
          style={{ background: `${meta.color}22`, borderColor: `${meta.color}44` }}
        >
          <CategoryIcon style={{ fontSize: "1rem", color: meta.color, flexShrink: 0 }} />
          <Typography
            className="skill-category-title"
            style={{ color: meta.color }}
          >
            {category}
          </Typography>
        </Box>
        <Box className="skill-category-line" style={{ background: `linear-gradient(90deg, ${meta.color}55, transparent)` }} />
        <Typography className="skill-category-count">{skillList.length} skills</Typography>
      </Box>
      <Box className="skill-logo-grid">
        {skillList.map((skill, i) => (
          <SkillLogoCard key={`${skill}-${i}`} name={skill} index={i} />
        ))}
      </Box>
    </Box>
  );
}

// =============================================
// TYPEWRITER HOOK
// =============================================
function useTypewriter(text, speed = 45, startDelay = 600) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) return;
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);
  return { displayed, done };
}

// =============================================
// CURSOR SPOTLIGHT
// =============================================
function CursorSpotlight() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e) => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      el.style.opacity = "1";
    };
    const leave = () => { el.style.opacity = "0"; };
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", leave);
    };
  }, []);
  return <div ref={ref} className="cursor-spotlight" aria-hidden="true" />;
}

function ResumePreviewDialog({ open, title, onClose, url, blobUrl, loading }) {
  const src = blobUrl || url;
  return (
<Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
  <DialogTitle sx={{ fontWeight: 900, fontSize: { xs: "1rem", md: "1.25rem" }, py: 1.5 }}>{title}</DialogTitle>
  <DialogContent sx={{ height: { xs: 480, md: 580 }, p: 0, overflow: "hidden", bgcolor: "black" }}>
        {loading ? (
          <Box sx={{ p: 3 }}><Typography sx={{ opacity: 0.75 }}>Loading preview…</Typography></Box>
        ) : src ? (
          <Box sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
            <iframe
              title="Resume Preview"
              src={
                /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
                  ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
                  : `${src}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`
              }
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            />
          </Box>
        ) : (
          <Box sx={{ p: 3 }}><Typography sx={{ opacity: 0.75 }}>Preview not available.</Typography></Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          startIcon={<MdClose />}
          sx={{
            background: "linear-gradient(135deg, #f13024, #f97316)",
            color: "white",
            borderRadius: 999,
            fontWeight: 800,
            textTransform: "none",
            px: 3,
            boxShadow: "0 6px 20px rgba(241,48,36,0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #d42a1e, #e8650a)",
              boxShadow: "0 10px 28px rgba(241,48,36,0.45)",
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function VerticalNav({ items, activeId, onJump }) {
  const [hoveredId, setHoveredId] = useState(null);
  return (
    <Box className="portfolio-side-nav">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;
        const isHovered = hoveredId === item.id;
        return (
          <Tooltip key={item.id} title={item.label} placement="left" arrow>
            <button
              type="button"
              className={`portfolio-side-nav-item ${isActive ? "active" : ""} ${isHovered && !isActive ? "hovered" : ""}`}
              onClick={() => onJump(item.id)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              aria-label={item.label}
            >
              <span className="icon-inner"><Icon /></span>
            </button>
          </Tooltip>
        );
      })}
    </Box>
  );
}

function HeroActionButton({ children, ...props }) {
  return (
    <Button {...props} sx={{
      borderRadius: 999, px: 2.3, py: 1.2,
      fontWeight: 800, textTransform: "none", letterSpacing: 0.2,
      ...(props.sx || {}),
    }}>
      {children}
    </Button>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <Stack spacing={1.1} sx={{ mb: 3 }}>
      <Typography className="section-title gradient-text">{title}</Typography>
      {subtitle ? <Typography className="section-subtitle">{subtitle}</Typography> : null}
    </Stack>
  );
}

function GlassPanel({ children, sx, className = "" }) {
  return (
    <Paper className={`glass-panel shimmer-panel ${className}`.trim()} sx={sx}>{children}</Paper>
  );
}

// =============================================
// 3D TILT CARD WRAPPER
// =============================================
function TiltCard({ children, className = "", sx }) {
  const ref = useRef(null);
  const handleMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -10;
    const rotY = ((x - cx) / cx) * 10;
    el.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(8px)`;
  }, []);
  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
  }, []);
  return (
    <Paper
      ref={ref}
      className={`glass-panel shimmer-panel tilt-card ${className}`.trim()}
      sx={sx}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </Paper>
  );
}

// =============================================
// PROFILE PHOTO
// Now accepts animatedSrc + originalSrc props.
// Falls back to bundled assets when not provided.
// =============================================
function ProfilePhotoCard({ animatedSrc, originalSrc }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef(null);

  const handleClick = () => {
    if (showOriginal) {
      setShowOriginal(false);
      clearTimeout(timerRef.current);
      return;
    }
    setShowOriginal(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowOriginal(false), 20000);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <Box
      className="profile-photo-wrap"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Animated layer — shown by default */}
      <Box
        className="profile-photo-layer"
        style={{ opacity: showOriginal ? 0 : 1, transition: "opacity 0.75s ease" }}
      >
        <img
          src={animatedSrc}          // ← uses prop, falls back to default asset
          alt="Animated profile"
          className="profile-photo-img"
        />
      </Box>

      {/* Original layer — shown on click */}
      <Box
        className="profile-photo-layer"
        style={{ opacity: showOriginal ? 1 : 0, transition: "opacity 0.75s ease" }}
      >
        <img
          src={originalSrc}          // ← uses prop, falls back to default asset
          alt="Original profile"
          className="profile-photo-img profile-photo-original"
        />
      </Box>

      <Box
        className="profile-photo-btn-wrap"
        style={{
          opacity: (hovered && !showOriginal) ? 1 : 0,
          pointerEvents: (hovered && !showOriginal) ? "auto" : "none",
          transition: "opacity 0.22s ease",
        }}
      >
        <Box className="profile-photo-reveal-btn">
          <MdVisibility style={{ fontSize: "0.85rem", flexShrink: 0 }} />
          See Original
        </Box>
      </Box>
    </Box>
  );
}

// =============================================
// GRAND LUXURY WHEEL BADGE
// =============================================
function BlackholeBadge({ initials, name }) {
  const resolvedInitials =
    safeString(initials).trim() ||
    safeString(name)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");

  return (
    <Box className="hero-blackhole-badge" aria-hidden="true">
      <Box className="gw-halo" />
      <svg className="gw-bezel-svg" viewBox="0 0 148 148" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#8b6914" />
            <stop offset="25%"  stopColor="#d4af37" />
            <stop offset="50%"  stopColor="#ffd700" />
            <stop offset="75%"  stopColor="#d4af37" />
            <stop offset="100%" stopColor="#8b6914" />
          </linearGradient>
          <filter id="goldGlow">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="74" cy="74" r="71" stroke="url(#goldGrad)" strokeWidth="1.5" opacity="0.7" />
        <circle cx="74" cy="74" r="68" stroke="url(#goldGrad)" strokeWidth="0.6" opacity="0.4" />
        <g filter="url(#goldGlow)">
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg) => (
            <line key={deg} x1="74" y1="4" x2="74" y2="16" stroke="#ffd700" strokeWidth="2.2"
              transform={`rotate(${deg} 74 74)`} opacity="0.95" />
          ))}
          {[6,12,18,24,36,42,48,54,66,72,78,84,96,102,108,114,126,132,138,144,
            156,162,168,174,186,192,198,204,216,222,228,234,246,252,258,264,
            276,282,288,294,306,312,318,324,336,342,348,354].map((deg) => (
            <line key={deg} x1="74" y1="5" x2="74" y2="11" stroke="#c9a227" strokeWidth="1"
              transform={`rotate(${deg} 74 74)`} opacity="0.6" />
          ))}
        </g>
        {[0,90,180,270].map((deg) => (
          <polygon key={deg} points="74,2 76.5,7 74,12 71.5,7" fill="#ffd700" opacity="0.9"
            transform={`rotate(${deg} 74 74)`} filter="url(#goldGlow)" />
        ))}
      </svg>
      <Box className="gw-outer-ring" />
      <svg className="gw-gear-svg" viewBox="0 0 148 148" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="gearGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g filter="url(#gearGlow)" opacity="0.75">
          <circle cx="74" cy="74" r="60" stroke="#c9a227" strokeWidth="0.8" fill="none" strokeDasharray="2 2" opacity="0.5" />
          <circle cx="74" cy="74" r="55" stroke="#d4af37" strokeWidth="1.2" fill="none" opacity="0.4" />
          {[0,22.5,45,67.5,90,112.5,135,157.5,180,202.5,225,247.5,270,292.5,315,337.5].map((deg) => (
            <rect key={deg} x="71" y="13" width="6" height="9" rx="1.5" fill="#c9a227"
              transform={`rotate(${deg} 74 74)`} opacity="0.8" />
          ))}
        </g>
      </svg>
      <Box className="gw-mid-band" />
      <svg className="gw-compass-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="spireGold" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%"   stopColor="#ffd700" />
            <stop offset="50%"  stopColor="#ffe066" />
            <stop offset="100%" stopColor="#c9a227" />
          </linearGradient>
          <filter id="spireGlow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g filter="url(#spireGlow)">
          <polygon points="50,8 53,42 50,48 47,42"  fill="url(#spireGold)" opacity="0.9" />
          <polygon points="50,92 53,58 50,52 47,58" fill="url(#spireGold)" opacity="0.7" />
          <polygon points="92,50 58,47 52,50 58,53" fill="url(#spireGold)" opacity="0.7" />
          <polygon points="8,50 42,47 48,50 42,53"  fill="url(#spireGold)" opacity="0.7" />
          <polygon points="78,22 55,44 50,50 48,44" fill="#d4af37" opacity="0.55" />
          <polygon points="22,78 45,56 50,50 56,45" fill="#d4af37" opacity="0.55" />
          <polygon points="22,22 45,44 50,50 44,45" fill="#d4af37" opacity="0.55" />
          <polygon points="78,78 55,56 50,50 56,55" fill="#d4af37" opacity="0.55" />
        </g>
        <circle cx="50" cy="50" r="5"   fill="#ffd700" opacity="0.9" filter="url(#spireGlow)" />
        <circle cx="50" cy="50" r="2.5" fill="#fff8dc" opacity="0.95" />
      </svg>
      <Box className="gw-medallion" />
      <Box className="gw-cardinal" />
      <Box className="gw-cardinal-2" />
      <Box className="gw-initials">{resolvedInitials || "?"}</Box>
    </Box>
  );
}

// =============================================
// TECH CHIP COLOR ENGINE
// =============================================
const TECH_COLORS = {
  // Frontend
  react: { bg: "rgba(97,218,251,0.13)", border: "rgba(97,218,251,0.40)", color: "#61dafb" },
  "react.js": { bg: "rgba(97,218,251,0.13)", border: "rgba(97,218,251,0.40)", color: "#61dafb" },
  nextjs: { bg: "rgba(255,255,255,0.10)", border: "rgba(255,255,255,0.28)", color: "#ffffff" },
  "next.js": { bg: "rgba(255,255,255,0.10)", border: "rgba(255,255,255,0.28)", color: "#ffffff" },
  vue: { bg: "rgba(66,184,131,0.13)", border: "rgba(66,184,131,0.40)", color: "#42b883" },
  "vue.js": { bg: "rgba(66,184,131,0.13)", border: "rgba(66,184,131,0.40)", color: "#42b883" },
  angular: { bg: "rgba(221,0,49,0.13)", border: "rgba(221,0,49,0.40)", color: "#dd0031" },
  svelte: { bg: "rgba(255,62,0,0.13)", border: "rgba(255,62,0,0.40)", color: "#ff3e00" },
  typescript: { bg: "rgba(49,120,198,0.13)", border: "rgba(49,120,198,0.40)", color: "#3178c6" },
  javascript: { bg: "rgba(247,223,30,0.13)", border: "rgba(247,223,30,0.40)", color: "#f7df1e" },
  js: { bg: "rgba(247,223,30,0.13)", border: "rgba(247,223,30,0.40)", color: "#f7df1e" },
  html: { bg: "rgba(227,76,38,0.13)", border: "rgba(227,76,38,0.40)", color: "#e34c26" },
  html5: { bg: "rgba(227,76,38,0.13)", border: "rgba(227,76,38,0.40)", color: "#e34c26" },
  css: { bg: "rgba(38,77,228,0.13)", border: "rgba(38,77,228,0.40)", color: "#264de4" },
  css3: { bg: "rgba(38,77,228,0.13)", border: "rgba(38,77,228,0.40)", color: "#264de4" },
  tailwind: { bg: "rgba(56,189,248,0.13)", border: "rgba(56,189,248,0.40)", color: "#38bdf8" },
  tailwindcss: { bg: "rgba(56,189,248,0.13)", border: "rgba(56,189,248,0.40)", color: "#38bdf8" },
  // Backend
  "node.js": { bg: "rgba(104,160,99,0.13)", border: "rgba(104,160,99,0.40)", color: "#68a063" },
  nodejs: { bg: "rgba(104,160,99,0.13)", border: "rgba(104,160,99,0.40)", color: "#68a063" },
  node: { bg: "rgba(104,160,99,0.13)", border: "rgba(104,160,99,0.40)", color: "#68a063" },
  express: { bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.22)", color: "#cccccc" },
  "express.js": { bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.22)", color: "#cccccc" },
  python: { bg: "rgba(55,118,171,0.13)", border: "rgba(55,118,171,0.40)", color: "#3776ab" },
  django: { bg: "rgba(9,150,100,0.13)", border: "rgba(9,150,100,0.40)", color: "#09960a" },
  flask: { bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.22)", color: "#cccccc" },
  java: { bg: "rgba(248,152,32,0.13)", border: "rgba(248,152,32,0.40)", color: "#f89820" },
  "spring boot": { bg: "rgba(109,179,63,0.13)", border: "rgba(109,179,63,0.40)", color: "#6db33f" },
  spring: { bg: "rgba(109,179,63,0.13)", border: "rgba(109,179,63,0.40)", color: "#6db33f" },
  php: { bg: "rgba(119,123,179,0.13)", border: "rgba(119,123,179,0.40)", color: "#777bb3" },
  "c#": { bg: "rgba(104,33,122,0.13)", border: "rgba(104,33,122,0.40)", color: "#68217a" },
  ".net": { bg: "rgba(104,33,122,0.13)", border: "rgba(104,33,122,0.40)", color: "#68217a" },
  rust: { bg: "rgba(222,165,132,0.13)", border: "rgba(222,165,132,0.40)", color: "#dea584" },
  go: { bg: "rgba(0,173,216,0.13)", border: "rgba(0,173,216,0.40)", color: "#00add8" },
  golang: { bg: "rgba(0,173,216,0.13)", border: "rgba(0,173,216,0.40)", color: "#00add8" },
  // Database
  mongodb: { bg: "rgba(71,162,72,0.13)", border: "rgba(71,162,72,0.40)", color: "#47a248" },
  mysql: { bg: "rgba(0,117,143,0.13)", border: "rgba(0,117,143,0.40)", color: "#00758f" },
  postgresql: { bg: "rgba(51,103,145,0.13)", border: "rgba(51,103,145,0.40)", color: "#336791" },
  postgres: { bg: "rgba(51,103,145,0.13)", border: "rgba(51,103,145,0.40)", color: "#336791" },
  redis: { bg: "rgba(220,50,47,0.13)", border: "rgba(220,50,47,0.40)", color: "#dc322f" },
  firebase: { bg: "rgba(255,196,0,0.13)", border: "rgba(255,196,0,0.40)", color: "#ffc400" },
  supabase: { bg: "rgba(62,207,142,0.13)", border: "rgba(62,207,142,0.40)", color: "#3ecf8e" },
  sqlite: { bg: "rgba(0,101,166,0.13)", border: "rgba(0,101,166,0.40)", color: "#0065a6" },
  // Tools & Cloud
  docker: { bg: "rgba(13,183,237,0.13)", border: "rgba(13,183,237,0.40)", color: "#0db7ed" },
  kubernetes: { bg: "rgba(50,108,229,0.13)", border: "rgba(50,108,229,0.40)", color: "#326ce5" },
  aws: { bg: "rgba(255,153,0,0.13)", border: "rgba(255,153,0,0.40)", color: "#ff9900" },
  gcp: { bg: "rgba(66,133,244,0.13)", border: "rgba(66,133,244,0.40)", color: "#4285f4" },
  "google cloud": { bg: "rgba(66,133,244,0.13)", border: "rgba(66,133,244,0.40)", color: "#4285f4" },
  azure: { bg: "rgba(0,120,212,0.13)", border: "rgba(0,120,212,0.40)", color: "#0078d4" },
  git: { bg: "rgba(240,80,50,0.13)", border: "rgba(240,80,50,0.40)", color: "#f05032" },
  github: { bg: "rgba(255,255,255,0.10)", border: "rgba(255,255,255,0.28)", color: "#ffffff" },
  graphql: { bg: "rgba(229,53,171,0.13)", border: "rgba(229,53,171,0.40)", color: "#e535ab" },
  "three.js": { bg: "rgba(255,255,255,0.10)", border: "rgba(255,255,255,0.25)", color: "#dddddd" },
  solidity: { bg: "rgba(155,135,255,0.13)", border: "rgba(155,135,255,0.40)", color: "#9b87ff" },
  flutter: { bg: "rgba(84,182,240,0.13)", border: "rgba(84,182,240,0.40)", color: "#54b6f0" },
  dart: { bg: "rgba(0,180,219,0.13)", border: "rgba(0,180,219,0.40)", color: "#00b4db" },
  kotlin: { bg: "rgba(127,82,255,0.13)", border: "rgba(127,82,255,0.40)", color: "#7f52ff" },
  swift: { bg: "rgba(240,81,56,0.13)", border: "rgba(240,81,56,0.40)", color: "#f05138" },
};

function getTechColor(tech) {
  const key = safeString(tech).trim().toLowerCase();
  return TECH_COLORS[key] || null;
}

// =============================================
// PROJECT CARD — ULTRA LUXURY FUTURISTIC v2
// =============================================
function ProjectCard({ project, index = 0 }) {
  const title = safeString(project?.title) || "Untitled Project";
  const description = safeString(project?.description);
  const techList = splitCSV(project?.tech);
  const repoUrl = safeString(project?.repoUrl);
  const liveUrl = safeString(project?.liveUrl);
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [revealed, setRevealed] = useState(false);

  const CARD_ACCENTS = [
    { from: "#f13024", to: "#f97316", glow: "rgba(241,48,36,0.40)", mid: "#ff6b35", hue: "15" },
    { from: "#6366f1", to: "#a855f7", glow: "rgba(139,92,246,0.40)", mid: "#8b5cf6", hue: "270" },
    { from: "#06b6d4", to: "#3b82f6", glow: "rgba(59,130,246,0.40)", mid: "#0ea5e9", hue: "210" },
    { from: "#10b981", to: "#06b6d4", glow: "rgba(16,185,129,0.40)", mid: "#14b8a6", hue: "170" },
    { from: "#f59e0b", to: "#ef4444", glow: "rgba(245,158,11,0.40)", mid: "#f97316", hue: "38" },
    { from: "#ec4899", to: "#a855f7", glow: "rgba(236,72,153,0.40)", mid: "#d946ef", hue: "300" },
  ];
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];

  const handleMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -8;
    const rotY = ((x - cx) / cx) * 8;
    el.style.transform = `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(16px)`;
    setMousePos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
    setHovered(false);
  }, []);

  const projectNumber = String(index + 1).padStart(2, "0");
  const techCount = techList.length;
  const linkCount = (repoUrl ? 1 : 0) + (liveUrl ? 1 : 0);

  return (
    <Box
      ref={ref}
      className={`proj-v2-card ${hovered ? "proj-v2-hovered" : ""}`}
      style={{
        "--pv2-from": accent.from,
        "--pv2-to": accent.to,
        "--pv2-glow": accent.glow,
        "--pv2-mid": accent.mid,
        "--pv2-hue": accent.hue,
        "--pv2-mx": `${mousePos.x}%`,
        "--pv2-my": `${mousePos.y}%`,
        "--pv2-idx": index,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setHovered(true)}
    >
      {/* ── Spinning prismatic border ── */}
      <Box className="pv2-prism" style={{ background: `conic-gradient(from 0deg, transparent 50%, ${accent.from}, ${accent.to}, transparent)` }} />

      {/* ── Holographic foil overlay ── */}
      <Box className="pv2-foil" style={{
        background: `radial-gradient(ellipse at var(--pv2-mx) var(--pv2-my), ${accent.from}22 0%, ${accent.mid}11 35%, transparent 65%)`,
        opacity: hovered ? 1 : 0,
      }} />

      {/* ── Grid scan overlay ── */}
      <Box className="pv2-grid-scan" />

      {/* ── Corner circuit brackets ── */}
      <Box className="pv2-corner pv2-corner--tl" style={{ borderColor: `${accent.from}99` }} />
      <Box className="pv2-corner pv2-corner--tr" style={{ borderColor: `${accent.from}66` }} />
      <Box className="pv2-corner pv2-corner--bl" style={{ borderColor: `${accent.to}77` }} />
      <Box className="pv2-corner pv2-corner--br" style={{ borderColor: `${accent.to}55` }} />

      {/* ── Horizontal scan beam ── */}
      <Box className="pv2-scan-beam" style={{ background: `linear-gradient(90deg, transparent, ${accent.from}44, ${accent.to}33, transparent)` }} />

      {/* ── macOS top status bar ── */}
      <Box className="pv2-status-bar">
        <Box className="pv2-status-dots">
          <span className="pv2-dot pv2-dot-red" />
          <span className="pv2-dot pv2-dot-yellow" />
          <span className={`pv2-dot ${liveUrl ? "pv2-dot-green" : "pv2-dot-grey"}`} />
        </Box>
        <Box className="pv2-status-tag" style={{ color: accent.from, WebkitTextFillColor: accent.from }}>
          PROJ_{projectNumber}
        </Box>
        <Box className="pv2-status-signal">
          {[1,2,3,4].map(b => (
            <Box key={b} className="pv2-signal-bar" style={{
              height: `${b * 3 + 2}px`,
              background: b <= 3 ? accent.from : "rgba(255,255,255,0.12)"
            }} />
          ))}
        </Box>
        {liveUrl && (
          <Box className="pv2-live-pill">
            <span className="pv2-live-pulse" style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
            <Typography sx={{ fontSize: "0.52rem", fontWeight: 900, color: "#22c55e", WebkitTextFillColor: "#22c55e", letterSpacing: "0.18em" }}>LIVE</Typography>
          </Box>
        )}
      </Box>

      {/* ── Main body ── */}
      <Box className="pv2-body">

        {/* Index orb with orbital rings */}
        <Box className="pv2-orb-wrap">
          <Box className="pv2-orb-ring pv2-orb-ring-1" style={{ borderTopColor: accent.from, borderColor: `${accent.from}22` }} />
          <Box className="pv2-orb-ring pv2-orb-ring-2" style={{ borderRightColor: accent.to, borderColor: `${accent.to}18` }} />
          <Box className="pv2-orb-core" style={{
            background: `radial-gradient(circle at 35% 35%, ${accent.from}22, ${accent.to}11, transparent)`,
            borderColor: `${accent.from}44`,
            boxShadow: `0 0 28px ${accent.glow}`,
          }}>
            <Typography className="pv2-orb-num" style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {projectNumber}
            </Typography>
          </Box>
          <Box className="pv2-orb-glow" style={{ background: `radial-gradient(circle, ${accent.from}44, transparent 70%)` }} />
        </Box>

        {/* Title + issuer-style line */}
        <Box className="pv2-title-block">
          <Box className="pv2-title-row">
            <Box className="pv2-title-beam" style={{ background: `linear-gradient(180deg, ${accent.from}, ${accent.to})`, boxShadow: `0 0 10px ${accent.from}88` }} />
            <Typography className="pv2-title">{title}</Typography>
          </Box>
          <Box className="pv2-date-row">
            <Box className="pv2-feat-pill" style={{ background: `${accent.from}18`, borderColor: `${accent.from}44`, color: accent.to, WebkitTextFillColor: accent.to }}>
              ✦ FEATURED PROJECT
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Divider beam ── */}
      <Box className="pv2-divider" style={{ background: `linear-gradient(90deg, ${accent.from}99, ${accent.to}55, transparent)` }} />

      {/* ── Description ── */}
      <Box className="pv2-desc-wrap">
        <Typography className="pv2-desc">{description || "No description provided."}</Typography>
      </Box>

      {/* ── Tech stack ── */}
      {techList.length > 0 && (
        <Box className="pv2-tech-wrap">
          <Typography className="pv2-tech-label">TECH STACK</Typography>
          <Box className="pv2-tech-row">
            {techList.map((tech, i) => {
              const tc = getTechColor(tech);
              return (
                <Box
                  key={`${tech}-${i}`}
                  className="pv2-chip"
                  style={tc ? {
                    background: tc.bg,
                    borderColor: tc.border,
                    color: tc.color,
                    WebkitTextFillColor: tc.color,
                    boxShadow: `0 0 10px ${tc.border}`,
                  } : {
                    background: `${accent.from}14`,
                    borderColor: `${accent.from}38`,
                    color: accent.from,
                    WebkitTextFillColor: accent.from,
                  }}
                >
                  <span className="pv2-chip-dot" style={{ background: tc ? tc.color : accent.from }} />
                  {tech}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* ── Action buttons ── */}
      <Box className="pv2-actions">
        {repoUrl && (
          <button type="button" className="pv2-btn pv2-btn-outline" style={{ "--bc": accent.from }}
            onClick={() => window.open(repoUrl, "_blank", "noopener,noreferrer")}>
            <MdLink style={{ fontSize: "0.95rem" }} />
            Repository
          </button>
        )}
        {liveUrl && (
          <button type="button" className="pv2-btn pv2-btn-solid" style={{ "--bf": accent.from, "--bt": accent.to, "--bg": accent.glow }}
            onClick={() => window.open(liveUrl, "_blank", "noopener,noreferrer")}>
            <MdArrowOutward style={{ fontSize: "0.95rem" }} />
            Live Preview
          </button>
        )}
      </Box>

      {/* ── Bottom terminal data strip ── */}
      <Box className="pv2-terminal">
        <Box className="pv2-terminal-inner" style={{ borderTopColor: `${accent.from}1a`, background: `${accent.from}06` }}>
          <Box className="pv2-term-item">
            <Typography className="pv2-term-val" style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {String(techCount).padStart(2, "0")}
            </Typography>
            <Typography className="pv2-term-lbl">TECH</Typography>
          </Box>
          <Box className="pv2-term-sep" />
          <Box className="pv2-term-item">
            <Typography className="pv2-term-val" style={{ background: `linear-gradient(135deg, ${accent.to}, ${accent.from})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {String(linkCount).padStart(2, "0")}
            </Typography>
            <Typography className="pv2-term-lbl">LINKS</Typography>
          </Box>
          <Box className="pv2-term-sep" />
          <Box className="pv2-term-item">
            <Typography className="pv2-term-val" style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Box className="pv2-verified-chip" style={{
            background: `${accent.from}14`,
            borderColor: `${accent.from}44`,
            color: accent.from,
            WebkitTextFillColor: accent.from,
          }}>
            ✦ SELECTED
          </Box>
        </Box>
      </Box>

      {/* ── Watermark glyph ── */}
      <Box className="pv2-watermark" style={{ WebkitTextFillColor: `${accent.from}08` }}>◈</Box>

    </Box>
  );
}

function LanguageLevelBar({ level }) {
  const normalized = safeString(level).trim().toLowerCase();
  const levelMap = { beginner: 33.33, intermediate: 66.66, advanced: 100 };
  const pct = levelMap[normalized] ?? 0;
  return (
    <Box className="meter-block">
      <Box className="meter-head">
        <Typography className="meter-label">Level</Typography>
        <Typography className="meter-value">{safeString(level) || "—"}</Typography>
      </Box>
      <Box className="segmented-meter" aria-label={`Language level ${safeString(level) || "unknown"}`}>
        <span className={`segment ${pct >= 33.33 ? "active" : ""}`}>Beginner</span>
        <span className={`segment ${pct >= 66.66 ? "active" : ""}`}>Intermediate</span>
        <span className={`segment ${pct >= 100 ? "active" : ""}`}>Advanced</span>
      </Box>
    </Box>
  );
}

function LanguageYearsBar({ years }) {
  const raw = typeof years === "number" ? years : Number.parseFloat(String(years).replace(/[^\d.]/g, "") || "0");
  const clamped = Number.isFinite(raw) ? Math.max(0, Math.min(5, raw)) : 0;
  const pct = (clamped / 5) * 100;
  return (
    <Box className="meter-block">
      <Box className="meter-head">
        <Typography className="meter-label">Experience</Typography>
        <Typography className="meter-value">{clamped} / 5 yrs</Typography>
      </Box>
      <Box className="experience-track" aria-label={`Experience ${clamped} out of 5 years`}>
        <Box className="experience-fill" sx={{ width: `${pct}%` }} />
        <Box className="experience-scale">
          {[0, 1, 2, 3, 4, 5].map((tick) => <span key={tick} className="tick">{tick}</span>)}
        </Box>
      </Box>
    </Box>
  );
}

// =============================================
// CONTACT MESSAGE CARD
// =============================================
function ContactMessageCard({ contactEmail, name: portfolioOwnerName }) {
  const [msgForm, setMsgForm] = useState({ name: "", email: "", message: "" });
  const [msgStatus, setMsgStatus] = useState(null);
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMsgForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSend = async () => {
    const senderName = msgForm.name.trim();
    const senderEmail = msgForm.email.trim();
    const senderMessage = msgForm.message.trim();
    if (!senderName || !senderEmail || !senderMessage) { setMsgStatus("error"); return; }
    try {
      setSending(true);
      setMsgStatus(null);
      const templateParams = {
        name: senderName, from_name: senderName,
        email: senderEmail, from_email: senderEmail,
        message: senderMessage,
        to_email: contactEmail || "", portfolio_name: portfolioOwnerName || "",
        title: senderName, reply_to: senderEmail,
        time: new Date().toLocaleString(),
      };
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        { publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY }
      );
      setMsgStatus("sent");
      setMsgForm({ name: "", email: "", message: "" });
      setTimeout(() => setMsgStatus(null), 4000);
    } catch (error) {
      console.error("EmailJS send failed:", error);
      setMsgStatus("failed");
    } finally { setSending(false); }
  };

  const inputSx = {
    width: "100%", padding: "10px 14px", borderRadius: "12px",
    border: "1.5px solid rgba(241,48,36,0.25)", background: "rgba(255,255,255,0.04)",
    color: "inherit", fontFamily: "inherit", fontSize: "0.93rem",
    outline: "none", transition: "border-color 0.2s", resize: "none", boxSizing: "border-box",
  };

  return (
    <Box>
      <Typography className="timeline-title" sx={{ mb: 2 }}>Send a Message</Typography>
      <Stack spacing={2}>
        <Box>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, mb: 0.6, opacity: 0.75 }}>Your Name</Typography>
          <input name="name" value={msgForm.name} onChange={handleChange} placeholder="John Doe" style={inputSx}
            onFocus={(e) => (e.target.style.borderColor = "#f13024")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(241,48,36,0.25)")} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, mb: 0.6, opacity: 0.75 }}>Your Email</Typography>
          <input name="email" type="email" value={msgForm.email} onChange={handleChange} placeholder="john@example.com" style={inputSx}
            onFocus={(e) => (e.target.style.borderColor = "#f13024")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(241,48,36,0.25)")} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, mb: 0.6, opacity: 0.75 }}>Message</Typography>
          <textarea name="message" value={msgForm.message} onChange={handleChange}
            placeholder="Write your message here…" rows={4} style={inputSx}
            onFocus={(e) => (e.target.style.borderColor = "#f13024")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(241,48,36,0.25)")} />
        </Box>
        {msgStatus === "error" && <Typography sx={{ color: "#f13024", fontSize: "0.82rem", fontWeight: 600 }}>Please fill in all fields before sending.</Typography>}
        {msgStatus === "sent"  && <Typography sx={{ color: "#22c55e", fontSize: "0.82rem", fontWeight: 600 }}>✓ Message sent successfully.</Typography>}
        {msgStatus === "failed"&& <Typography sx={{ color: "#f13024", fontSize: "0.82rem", fontWeight: 600 }}>Failed to send message. Please try again.</Typography>}
        <Button variant="contained" startIcon={<MdEmail />} onClick={handleSend} disabled={sending}
          sx={{
            alignSelf: "flex-start", borderRadius: 999, px: 3, py: 1.2,
            fontWeight: 800, textTransform: "none",
            background: "linear-gradient(135deg, #f13024, #f97316) !important",
            color: "white !important", boxShadow: "0 6px 20px rgba(241,48,36,0.3)",
            "&:hover": { background: "linear-gradient(135deg, #d42a1e, #e8650a) !important", boxShadow: "0 10px 28px rgba(241,48,36,0.45)", transform: "translateY(-1px)" },
            "&.Mui-disabled": { color: "rgba(255,255,255,0.7) !important", background: "rgba(241,48,36,0.45) !important" },
          }}
        >
          {sending ? "Sending..." : "Send Message"}
        </Button>
      </Stack>
    </Box>
  );
}

// =============================================
// MAIN HOME COMPONENT
// =============================================
export default function Home({ toggleTheme }) {
  useEffect(() => { document.title = "Gnanaseelan V Portfolio"; }, []);

  const theme = useTheme();
  const navigate = useNavigate();
  const mode = theme.palette.mode;

  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState(null);
  const [projects, setProjects] = useState([]);
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [socials, setSocials] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [languages, setLanguages] = useState([]);

  const [resumeName, setResumeName] = useState("Resume.pdf");
  const [downloading, setDownloading] = useState(false);
  const [resumePreviewOpen, setResumePreviewOpen] = useState(false);
  const [resumePreviewTitle, setResumePreviewTitle] = useState("Resume Preview");
  const [resumePreviewBlobUrl, setResumePreviewBlobUrl] = useState("");
  const [resumePreviewLoading, setResumePreviewLoading] = useState(false);

// ── NEW: certificate preview states ──────────────────────────────────────
  const [certPreviewOpen, setCertPreviewOpen] = useState(false);
  const [certPreviewTitle, setCertPreviewTitle] = useState("");
  const [certPreviewBlobUrl, setCertPreviewBlobUrl] = useState("");
  const [certPreviewLoading, setCertPreviewLoading] = useState(false);
  const [certPreviewIsImage, setCertPreviewIsImage] = useState(false);
  const [certPreviewAchId, setCertPreviewAchId] = useState(null);

  // ── NEW: profile image states ─────────────────────────────────────────────
  const [profileImages, setProfileImages] = useState([]);
  const [imageBust, setImageBust] = useState(Date.now());
  // ─────────────────────────────────────────────────────────────────────────

  const [activeSection, setActiveSection] = useState("home");
  const [navDirection, setNavDirection] = useState(1);
  const rootRef = useRef(null);

  const sectionIds = useMemo(() => [
    { id: "home",         label: "Home",                  icon: MdHome },
    { id: "about",        label: "About",                 icon: MdPerson },
    { id: "skills",       label: "Skills",                icon: MdCode },
    { id: "projects",     label: "Work",                  icon: MdWork },
    { id: "experience",   label: "Experience",            icon: MdTimeline },
    { id: "education",    label: "Education",             icon: MdSchool },
    { id: "achievements", label: "Achievements",          icon: MdEmojiEvents },
    { id: "languages",    label: "Programming Languages", icon: MdTerminal },
    { id: "contact",      label: "Contact",               icon: MdContacts },
  ], []);

  const sectionIndexMap = useMemo(() => {
    const map = {};
    sectionIds.forEach((item, idx) => { map[item.id] = idx; });
    return map;
  }, [sectionIds]);

  const name            = safeString(profile?.name)        || "Your Name";
  const profileInitials = safeString(profile?.initials)    || "";
  const title           = safeString(profile?.title)       || "Full Stack Developer";
  const tagline         = safeString(profile?.tagline)     || "Transforming Ideas Into Digital Reality";
  const about           = safeString(profile?.about)       || "Add your about content from admin.";
  const location        = safeString(profile?.location)    || "";
  const emailPublic     = safeString(profile?.emailPublic) || "";

  const { displayed: typewriterText, done: typewriterDone } = useTypewriter(
    activeSection === "home" ? tagline : "", 45, 800
  );

  const contactEmail = useMemo(() => {
    const ep = safeString(emailPublic).trim();
    if (ep) return ep;
    return safeString(socials?.email).trim();
  }, [emailPublic, socials?.email]);

  const reload = () => setReloadTick((x) => x + 1);
  const contentVersion = useMemo(() => localStorage.getItem("content_version") || "0", [reloadTick]);
  const resumeDownloadBase = useMemo(() => downloadResumeUrl(), []);
  const resumeViewBase     = useMemo(() => viewResumeUrl(), []);

  const resumeDownloadUrlBusted = useMemo(() => {
    const joiner = resumeDownloadBase.includes("?") ? "&" : "?";
    return `${resumeDownloadBase}${joiner}v=${encodeURIComponent(contentVersion)}&t=${Date.now()}`;
  }, [resumeDownloadBase, contentVersion]);

  const resumeViewUrlBusted = useMemo(() => {
    const joiner = resumeViewBase.includes("?") ? "&" : "?";
    return `${resumeViewBase}${joiner}v=${encodeURIComponent(contentVersion)}&t=${Date.now()}`;
  }, [resumeViewBase, contentVersion]);

  // Skills grouped for logo grid
  const skillGroups = useMemo(() => {
    const s = skills || {};
    return [
      { category: "Frontend", items: splitCSV(s.frontend) },
      { category: "Backend",  items: splitCSV(s.backend)  },
      { category: "Database", items: splitCSV(s.database) },
      { category: "Tools",    items: splitCSV(s.tools)    },
    ].filter((g) => g.items.length > 0);
  }, [skills]);

  // ── NEW: fetch profile images from DB ─────────────────────────────────────
useEffect(() => {
  const fetchImgs = async () => {
    try {
      const res = await http.get("/profile-image/list");
      const data = res.data;
      setProfileImages(Array.isArray(data) ? data : []);
      setImageBust(Date.now());
    } catch {
      // silently fall back to default images
    }
  };
  fetchImgs();
}, [reloadTick]);

  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const [profRes, skillsRes, projRes, expRes, eduRes, socRes, achRes, langRes] =
          await Promise.all([
            getProfile(), getSkills(), getFeaturedProjects(), getExperience(),
            getEducation(), getSocials(), getAchievements(), getLanguageExperience(),
          ]);
        if (!alive) return;
        const nextProfile = profRes?.data || {};
        setProfile(nextProfile);
        setSkills(skillsRes?.data || {});
        setProjects(Array.isArray(projRes?.data) ? projRes.data : []);
        setExperience(Array.isArray(expRes?.data) ? expRes.data : []);
        setEducation(Array.isArray(eduRes?.data) ? eduRes.data : []);
        setSocials(socRes?.data || {});
        setAchievements(Array.isArray(achRes?.data) ? achRes.data : []);
        setLanguages(Array.isArray(langRes?.data) ? langRes.data : []);
        const localName = localStorage.getItem("active_resume_file_name") || localStorage.getItem("resume_file_name") || "";
        if (localName) { setResumeName(localName); }
        else {
          const pn = safeString(nextProfile?.name) || "Resume";
          setResumeName(`${pn.replace(/\s+/g, "_")}_Resume.pdf`);
        }
      } catch {}
      finally { if (alive) setLoading(false); }
    };
    load();
    return () => { alive = false; };
  }, [reloadTick]);

useEffect(() => {
  const sync = () => {
    reload();
    setImageBust(Date.now()); // ← add this line
  };
  const onStorage = (e) => {
    if (!e) return;
    if (e.key === "content_version" || e.key === "active_resume_file_name" || e.key === "resume_file_name") sync();
  };
    const onVis = () => { if (document.visibilityState === "visible") sync(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    const target = rootRef.current;
    if (!target) return;
    const updateMouseVars = (event) => {
      const rect = target.getBoundingClientRect();
      const x  = ((event.clientX - rect.left) / rect.width)  * 100;
      const y  = ((event.clientY - rect.top)  / rect.height) * 100;
      const rx = ((event.clientY - rect.top)  / rect.height - 0.5) * 12;
      const ry = ((event.clientX - rect.left) / rect.width  - 0.5) * 12;
      target.style.setProperty("--mouse-x",  `${x}%`);
      target.style.setProperty("--mouse-y",  `${y}%`);
      target.style.setProperty("--mouse-rx", `${rx.toFixed(2)}deg`);
      target.style.setProperty("--mouse-ry", `${ry.toFixed(2)}deg`);
    };
    const resetMouseVars = () => {
      target.style.setProperty("--mouse-x",  "50%");
      target.style.setProperty("--mouse-y",  "50%");
      target.style.setProperty("--mouse-rx", "0deg");
      target.style.setProperty("--mouse-ry", "0deg");
    };
    resetMouseVars();
    window.addEventListener("mousemove",  updateMouseVars, { passive: true });
    window.addEventListener("mouseleave", resetMouseVars);
    return () => {
      window.removeEventListener("mousemove",  updateMouseVars);
      window.removeEventListener("mouseleave", resetMouseVars);
    };
  }, []);

  const jumpTo = (id) => {
    if (!sectionIndexMap[id] && sectionIndexMap[id] !== 0) return;
    const currentIndex = sectionIndexMap[activeSection] ?? 0;
    const nextIndex    = sectionIndexMap[id] ?? 0;
    setNavDirection(nextIndex >= currentIndex ? 1 : -1);
    setActiveSection(id);
  };

  const closeResumePreview = () => {
    setResumePreviewOpen(false);
    if (resumePreviewBlobUrl) { try { URL.revokeObjectURL(resumePreviewBlobUrl); } catch {} }
    setResumePreviewBlobUrl("");
  };

  // ── NEW: certificate preview handlers ────────────────────────────────────
const closeCertPreview = () => {
  setCertPreviewOpen(false);
  if (certPreviewBlobUrl) { try { URL.revokeObjectURL(certPreviewBlobUrl); } catch {} }
  setCertPreviewBlobUrl("");
  setCertPreviewIsImage(false);
  setCertPreviewAchId(null);
};

const onPreviewCertificate = async (achId, achTitle) => {
  setCertPreviewTitle(`Certificate — ${achTitle || "Achievement"}`);
  setCertPreviewBlobUrl("");
  setCertPreviewIsImage(false);
  setCertPreviewAchId(achId); // ← FIX: was missing, now set on entry
  setCertPreviewLoading(true);
  setCertPreviewOpen(true);
  try {
    const res = await http.get(
      `/portfolio/achievements/${achId}/certificate`,
      { responseType: "arraybuffer" }
    );
    const contentType = res.headers["content-type"] || "application/pdf";
    const mimeType = contentType.split(";")[0].trim();
    const isImage = mimeType.startsWith("image/");
    setCertPreviewIsImage(isImage);
    const blob = new Blob([res.data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    setCertPreviewBlobUrl(url);
  } catch (e) {
    console.error("Certificate preview failed:", e);
    setCertPreviewBlobUrl("");
    setCertPreviewAchId(null);
  } finally {
    setCertPreviewLoading(false);
  }
};
  // ─────────────────────────────────────────────────────────────────────────

  const onPreviewResume = async () => {
    try {
      setResumePreviewTitle(resumeName || "Resume Preview");
      setResumePreviewLoading(true);
      setResumePreviewOpen(true);
      const res = await fetch(resumeViewUrlBusted, { method: "GET" });
      if (!res.ok) throw new Error("Preview failed");
      const blob = await res.blob();
      setResumePreviewBlobUrl(URL.createObjectURL(new Blob([blob], { type: "application/pdf" })));
    } catch { setResumePreviewBlobUrl(""); }
    finally  { setResumePreviewLoading(false); }
  };

  const onDownloadResume = async () => {
    try {
      setDownloading(true);
      const fname = await blobDownload(resumeDownloadUrlBusted);
      localStorage.setItem("active_resume_file_name", fname);
      setResumeName(fname);
    } catch {
      try { window.open(resumeDownloadUrlBusted, "_blank", "noopener,noreferrer"); } catch {}
    } finally { setDownloading(false); }
  };

// Change /api/profile-image/animated → /api/profile-image/view/animated
const BACKEND_BASE = (
  import.meta.env.VITE_API_URL ||
  "https://db-driven-portfolio-idt9.onrender.com/api"
).replace(/\/api$/, "");

const resolvedAnimatedSrc = useMemo(() => {
  const hasPrimary = profileImages.some((i) => i.imageType === "animated" && i.primary === true);
  if (hasPrimary) return `${BACKEND_BASE}/api/profile-image/animated?t=${imageBust}`;
  return AnimatedPhoto;
}, [profileImages, imageBust]);

const resolvedOriginalSrc = useMemo(() => {
  const hasPrimary = profileImages.some((i) => i.imageType === "original" && i.primary === true);
  if (hasPrimary) return `${BACKEND_BASE}/api/profile-image/original?t=${imageBust}`;
  return OriginalPhoto;
}, [profileImages, imageBust]);
  // ─────────────────────────────────────────────────────────────────────────

  const renderSection = () => {
    switch (activeSection) {

case "home":
  return (
    <MotionBox key="home" custom={navDirection} variants={pageVariants}
      initial="enter" animate="center" exit="exit" className="portfolio-page-frame">
      <Box className="section-scroll-area home-scroll-area">
        <MotionBox className="portfolio-section hero-section" initial="hidden" animate="show" variants={fadeUp}>
          <Box className="hero-holo-root">

            {/* ── PRISMATIC BORDER ── */}
            <Box className="hero-holo-prism" />
            {/* ── SCAN LINE ── */}
            <Box className="hero-holo-scan" />
            {/* ── PARTICLE FIELD ── */}
            <Box className="hero-holo-particles" />
            {/* ── CORNER BRACKETS ── */}
            <Box className="hero-holo-corner hero-holo-corner--tl" />
            <Box className="hero-holo-corner hero-holo-corner--tr" />
            <Box className="hero-holo-corner hero-holo-corner--bl" />
            <Box className="hero-holo-corner hero-holo-corner--br" />
            {/* ── CIRCUIT TRACES (decorative) ── */}
            <Box className="hero-holo-circuit-h hero-holo-circuit-h--top" />
            <Box className="hero-holo-circuit-h hero-holo-circuit-h--bot" />

            {/* ── macOS STATUS BAR ── */}
            <Box className="hero-holo-status-bar">
              <Box className="hero-holo-dots">
                <span className="hero-holo-sd hero-holo-sd-red" />
                <span className="hero-holo-sd hero-holo-sd-yellow" />
                <span className="hero-holo-sd hero-holo-sd-green" />
              </Box>
              <Box className="hero-holo-status-label">
                <span className="hero-holo-status-pulse" />
                IDENTITY_CORE :: PROFILE_v2.sys
              </Box>
              <Box className="hero-holo-signal">
                {[1,2,3,4,5].map(b => (
                  <Box key={b} className="hero-holo-signal-bar" style={{ height: `${b*3+2}px`, opacity: b<=4?1:0.22 }} />
                ))}
              </Box>
              <Box className="hero-holo-live-pill">
                <span className="hero-holo-live-dot" />
                <Typography sx={{ fontSize:"0.52rem",fontWeight:900,color:"#22c55e",WebkitTextFillColor:"#22c55e",letterSpacing:"0.18em" }}>LIVE</Typography>
              </Box>
            </Box>

            {/* ── MAIN HERO LAYOUT ── */}
            <Box className="hero-layout hero-layout-two-col" sx={{ position:"relative",zIndex:2 }}>
              <Box className="hero-left hero-left-expanded">
                <MotionBox variants={fadeUp}>

                  {/* Identity index stamp */}
                  <Box className="hero-holo-idx-stamp">ID_001</Box>

                  <Box className="hero-name-row">
                    <BlackholeBadge initials={profileInitials} name={name} />
                    <Box className="hero-name-text-block">
                      <Typography className="hero-name hero-name-display">{name}</Typography>
                      <Stack spacing={0.8} className="hero-meta-stack">
                        <Typography className="hero-role-line">{title}</Typography>
                        {location ? (
                          <Typography className="hero-detail-line">
                            <MdLocationOn style={{ marginRight:5,flexShrink:0 }} />{location}
                          </Typography>
                        ) : null}
                        {contactEmail ? (
                          <Typography className="hero-detail-line">
                            <MdEmail style={{ marginRight:5,flexShrink:0 }} />{contactEmail}
                          </Typography>
                        ) : null}
                      </Stack>
                    </Box>
                  </Box>

                  {/* Divider beam under name row */}
                  <Box className="hero-holo-name-divider" />

                  <Typography className="hero-title">
                    {typewriterText}
                    <span className={`typewriter-cursor ${typewriterDone ? "cursor-blink" : ""}`}>|</span>
                  </Typography>
                  <Typography className="hero-description">{about}</Typography>

                  {/* ── DATA INDICATOR ROW (decorative, above buttons) ── */}
                  <Box className="hero-holo-data-row">
                    {[
                      { label:"STATUS",   val:"ACTIVE",       color:"#22c55e" },
                      { label:"MODE",     val:"FULL-STACK",   color:"#f13024" },
                      { label:"AVAIL",    val:"OPEN",         color:"#f97316" },
                      { label:"STACK",    val:"REACT+SPRING", color:"#06b6d4" },
                    ].map(item => (
                      <Box key={item.label} className="hero-holo-data-cell">
                        <Typography className="hero-holo-dc-val" style={{ color:item.color, WebkitTextFillColor:item.color }}>{item.val}</Typography>
                        <Typography className="hero-holo-dc-lbl">{item.label}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Stack className="hero-action-buttons" direction={{ xs:"column",sm:"row" }} spacing={1.5} sx={{ mt:2 }}>
                    <HeroActionButton variant="contained" startIcon={<MdArrowOutward />} onClick={() => jumpTo("projects")}
                      sx={{ background:"linear-gradient(135deg,#f13024,#f97316) !important",color:"white !important",border:"none !important",boxShadow:"0 8px 24px rgba(241,48,36,0.35) !important","&:hover":{background:"linear-gradient(135deg,#d42a1e,#e8650a) !important",boxShadow:"0 12px 32px rgba(241,48,36,0.5) !important",transform:"translateY(-2px)"} }}>
                      View Work
                    </HeroActionButton>
                    <HeroActionButton variant="outlined" startIcon={<MdDownload />} onClick={onDownloadResume} disabled={downloading}
                      sx={{ borderColor:"rgba(241,48,36,0.5) !important",color:"#f13024 !important","&:hover":{borderColor:"#f13024 !important",background:"rgba(241,48,36,0.08) !important"} }}>
                      {downloading ? "Downloading..." : "Download Resume"}
                    </HeroActionButton>
                    <HeroActionButton variant="outlined" startIcon={<MdVisibility />} onClick={onPreviewResume}
                      sx={{ borderColor:"rgba(241,48,36,0.5) !important",color:"#f13024 !important","&:hover":{borderColor:"#f13024 !important",background:"rgba(241,48,36,0.08) !important"} }}>
                      Preview Resume
                    </HeroActionButton>
                  </Stack>

                  <Stack className="hero-social-row" direction="row" spacing={1.2} sx={{ mt:2.5,flexWrap:"wrap" }}>
                    {socials?.github   && <IconButton className="hero-social-btn" onClick={() => window.open(socials.github,"_blank","noopener,noreferrer")}><FaGithub /></IconButton>}
                    {socials?.linkedin && <IconButton className="hero-social-btn" onClick={() => window.open(socials.linkedin,"_blank","noopener,noreferrer")}><FaLinkedin /></IconButton>}
                    {contactEmail     && <IconButton className="hero-social-btn" onClick={() => window.open(`mailto:${contactEmail}`,"_blank","noopener,noreferrer")}><MdEmail /></IconButton>}
                    {socials?.phone   && <IconButton className="hero-social-btn" onClick={() => window.open(`tel:${safeString(socials.phone)}`,"_blank","noopener,noreferrer")}><MdPhone /></IconButton>}
                    {socials?.website && <IconButton className="hero-social-btn" onClick={() => window.open(safeString(socials.website),"_blank","noopener,noreferrer")}><MdLink /></IconButton>}
                  </Stack>

                  {/* ── TERMINAL DATA STRIP (bottom of left col) ── */}
                  <Box className="hero-holo-terminal">
                    <Box className="hero-holo-term-item">
                      <Typography className="hero-holo-term-val">FS</Typography>
                      <Typography className="hero-holo-term-lbl">STACK</Typography>
                    </Box>
                    <Box className="hero-holo-term-sep" />
                    <Box className="hero-holo-term-item">
                      <Typography className="hero-holo-term-val">{new Date().getFullYear()}</Typography>
                      <Typography className="hero-holo-term-lbl">ACTIVE</Typography>
                    </Box>
                    <Box className="hero-holo-term-sep" />
                    <Box className="hero-holo-term-item">
                      <Typography className="hero-holo-term-val">∞</Typography>
                      <Typography className="hero-holo-term-lbl">DRIVEN</Typography>
                    </Box>
                    <Box sx={{ flex:1 }} />
                    <Box className="hero-holo-verified">✦ PORTFOLIO</Box>
                  </Box>

                </MotionBox>
              </Box>

              {/* ── PHOTO PANEL (right col) with luxury frame ── */}
              <Box className="hero-right">
                <Box className="hero-photo-frame">
                  {/* photo frame corner accents */}
                  <Box className="hpf-corner hpf-corner--tl" />
                  <Box className="hpf-corner hpf-corner--tr" />
                  <Box className="hpf-corner hpf-corner--bl" />
                  <Box className="hpf-corner hpf-corner--br" />
                  {/* photo frame prism */}
                  <Box className="hpf-prism" />
                  {/* side data strip */}
                  <Box className="hpf-side-strip">
                    {["DEV","UI","API","DB","ML"].map((t,i) => (
                      <Box key={t} className="hpf-strip-tag" style={{ animationDelay:`${i*0.15}s` }}>{t}</Box>
                    ))}
                  </Box>
                  <ProfilePhotoCard
                    key={`photo-${imageBust}`}
                    animatedSrc={resolvedAnimatedSrc}
                    originalSrc={resolvedOriginalSrc}
                  />
                </Box>
              </Box>
            </Box>

            {/* Watermark glyph */}
            <Box className="hero-holo-watermark">◈</Box>
          </Box>
        </MotionBox>
      </Box>
    </MotionBox>
  );

case "about":
  return (
    <MotionBox key="about" custom={navDirection} variants={pageVariants}
      initial="enter" animate="center" exit="exit" className="portfolio-page-frame">
      <Box className="section-scroll-area">
        <MotionBox className="portfolio-section section-static" variants={fadeUp} initial="hidden" animate="show">
          <SectionHeading title="About" subtitle="Decoding the architect behind the code." />

          {loading ? (
            <Stack spacing={2}><Skeleton height={300} sx={{ borderRadius: 4 }} /><Skeleton height={140} sx={{ borderRadius: 3 }} /></Stack>
          ) : (
            <Box className="about-neural-root">

              {/* ── MAIN PROFILE CARD ── */}
              <Box className="about-main-card">
                <Box className="about-prism" />
                <Box className="about-particles" />
                <Box className="about-scan" />
                <Box className="about-corner about-corner--tl" />
                <Box className="about-corner about-corner--br" />

                {/* Status bar */}
                <Box className="about-status-bar">
                  <Box className="about-dots">
                    <span className="about-dot about-dot-red" />
                    <span className="about-dot about-dot-yellow" />
                    <span className="about-dot about-dot-green" />
                  </Box>
                  <Box className="about-status-tag">NEURAL_ARCHIVE :: PROFILE_DATA.md</Box>
                  <Box className="about-live-badge">
                    <span className="about-live-dot" />
                    <Typography sx={{ fontSize: "0.52rem", fontWeight: 900, color: "#22c55e", WebkitTextFillColor: "#22c55e", letterSpacing: "0.18em" }}>LIVE</Typography>
                  </Box>
                </Box>

                {/* Body */}
                <Box className="about-body">
                  {/* Left orb column */}
                  <Box className="about-orb-col">
                    <Box className="about-orb-wrap">
                      <Box className="about-orb-ring about-ring-1" />
                      <Box className="about-orb-ring about-ring-2" />
                      <Box className="about-orb-ring about-ring-3" />
                      <Box className="about-orb-core">
                        <MdPerson style={{ fontSize: "1.8rem", color: "#f13024" }} />
                      </Box>
                      <Box className="about-orb-glow" />
                    </Box>
                    <Box className="about-stat-pills">
                      {[
                        { label: "DEV", color: "#f13024" },
                        { label: "BUILD", color: "#f97316" },
                        { label: "SHIP", color: "#fbbf24" },
                      ].map((t) => (
                        <Box key={t.label} className="about-stat-pill"
                          style={{ background: `${t.color}14`, borderColor: `${t.color}44`, color: t.color, WebkitTextFillColor: t.color }}>
                          {t.label}
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Right text column */}
                  <Box className="about-text-col">
                    <Box className="about-identity-row">
                      <Box className="about-identity-beam" />
                      <Typography className="about-identity-label">ABOUT.me — PERSONAL RECORD</Typography>
                    </Box>
                    <Typography className="about-text-content">{about}</Typography>
                  </Box>
                </Box>

                {/* Trait chips */}
                {(() => {
                  const traits = [
                    { label: "Full Stack", color: "#f13024" },
                    { label: "Problem Solver", color: "#f97316" },
                    { label: "Clean Code", color: "#06b6d4" },
                    { label: "Open Source", color: "#10b981" },
                    { label: "Fast Learner", color: "#a855f7" },
                    { label: "Team Player", color: "#fbbf24" },
                  ];
                  return (
                    <Box className="about-traits-row">
                      {traits.map((t) => (
                        <Box key={t.label} className="about-trait-chip"
                          style={{ background: `${t.color}14`, borderColor: `${t.color}44`, color: t.color, WebkitTextFillColor: t.color }}>
                          <span className="about-trait-dot" style={{ background: t.color, boxShadow: `0 0 6px ${t.color}` }} />
                          {t.label}
                        </Box>
                      ))}
                    </Box>
                  );
                })()}

                {/* Terminal data strip */}
                <Box className="about-terminal">
                  <Box className="about-term-item">
                    <Typography className="about-term-val">FS</Typography>
                    <Typography className="about-term-lbl">STACK</Typography>
                  </Box>
                  <Box className="about-term-sep" />
                  <Box className="about-term-item">
                    <Typography className="about-term-val">{new Date().getFullYear()}</Typography>
                    <Typography className="about-term-lbl">ACTIVE</Typography>
                  </Box>
                  <Box className="about-term-sep" />
                  <Box className="about-term-item">
                    <Typography className="about-term-val">∞</Typography>
                    <Typography className="about-term-lbl">DRIVEN</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }} />
                  <Box sx={{
                    padding: "5px 14px", borderRadius: "999px",
                    background: "rgba(241,48,36,0.12)", border: "1px solid rgba(241,48,36,0.35)",
                    color: "#f13024", WebkitTextFillColor: "#f13024",
                    fontSize: "0.60rem", fontWeight: 900, letterSpacing: "0.13em",
                    animation: "aboutGreenPulse 2.5s ease-in-out infinite",
                  }}>
                    ✦ ONLINE
                  </Box>
                </Box>

                <Box className="about-watermark">◈</Box>
              </Box>

              {/* ── STATS GRID ── */}
              <Box className="about-stats-grid">
                {[
                  { icon: "⚡", val: "100%", lbl: "COMMITMENT", a: "#f13024", g: "rgba(241,48,36,0.38)" },
                  { icon: "🚀", val: "SHIP", lbl: "MENTALITY", a: "#f97316", g: "rgba(249,115,22,0.35)" },
                  { icon: "🧠", val: "∞+1", lbl: "CURIOSITY", a: "#a855f7", g: "rgba(168,85,247,0.35)" },
                ].map((s) => (
                  <Box key={s.lbl} className="about-stat-card" style={{ "--asc-a": s.a, "--asc-g": s.g }}>
                    <Box className="about-stat-corner" style={{ borderColor: s.a }} />
                    <Box className="about-stat-card-icon"
                      style={{ background: `${s.a}18`, borderColor: `${s.a}44`, boxShadow: `0 0 18px ${s.g}` }}>
                      <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{s.icon}</span>
                    </Box>
                    <Typography className="about-stat-card-val"
                      style={{ background: `linear-gradient(135deg, ${s.a}, ${s.g.replace(/[^,]+\)/, "1)")})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                      {s.val}
                    </Typography>
                    <Typography className="about-stat-card-lbl">{s.lbl}</Typography>
                  </Box>
                ))}
              </Box>

            </Box>
          )}
        </MotionBox>
      </Box>
    </MotionBox>
  );

case "skills":
  return (
    <MotionBox key="skills" custom={navDirection} variants={pageVariants}
      initial="enter" animate="center" exit="exit" className="portfolio-page-frame">
      <Box className="section-scroll-area">
        <MotionBox className="portfolio-section section-static" variants={fadeUp} initial="hidden" animate="show">
          <SectionHeading title="Skills" subtitle="Technologies I build with — toss 'em in the bucket or arrange by category." />
          <SkillsBucketSection skills={skills} loading={loading} />
        </MotionBox>
      </Box>
    </MotionBox>
  );

      case "projects":
        return (
          <MotionBox key="projects" custom={navDirection} variants={pageVariants}
            initial="enter" animate="center" exit="exit" className="portfolio-page-frame">
            <Box className="section-scroll-area">
              <MotionBox className="portfolio-section section-static" variants={fadeUp} initial="hidden" animate="show">
                <SectionHeading title="Work" subtitle="Crafted with precision — featured projects built to ship." />
                {loading ? (
                  <Stack spacing={2}><Skeleton height={220} /><Skeleton height={220} /></Stack>
) : projects.length ? (
<Box className="pv2-ultra-grid">
  {projects.map((project, idx) => <ProjectCard key={project?.id ?? idx} project={project} index={idx} />)}
</Box>
                ) : (
                  <GlassPanel sx={{ p: 3 }}><Typography>No projects yet. Add them in Admin → Projects.</Typography></GlassPanel>
                )}
              </MotionBox>
            </Box>
          </MotionBox>
        );

case "experience":
  return (
    <MotionBox key="experience" custom={navDirection} variants={pageVariants}
      initial="enter" animate="center" exit="exit" className="portfolio-page-frame">
      <Box className="section-scroll-area">
        <MotionBox className="portfolio-section section-static" variants={fadeUp} initial="hidden" animate="show">
          <SectionHeading title="Experience" subtitle="Career timeline — each role a milestone in the journey." />
          <Box className="exp-v4-root">
            {loading ? <Skeleton height={220} /> : experience.length ? (
              experience.map((item, idx) => {
                const isCurrentRole = !safeString(item?.end).trim();
                const startYear = safeString(item?.start).match(/\d{4}/)?.[0];
                const endYear = safeString(item?.end).match(/\d{4}/)?.[0];
                const yearsCount = startYear
                  ? (endYear ? parseInt(endYear) : new Date().getFullYear()) - parseInt(startYear)
                  : null;

                const ACCENTS = [
                  { from: "#f13024", to: "#f97316", glow: "rgba(241,48,36,0.40)", hue: "0" },
                  { from: "#6366f1", to: "#a855f7", glow: "rgba(139,92,246,0.38)", hue: "260" },
                  { from: "#06b6d4", to: "#3b82f6", glow: "rgba(59,130,246,0.35)", hue: "210" },
                  { from: "#10b981", to: "#06b6d4", glow: "rgba(16,185,129,0.35)", hue: "170" },
                  { from: "#f59e0b", to: "#ef4444", glow: "rgba(245,158,11,0.35)", hue: "38" },
                ];
                const accent = isCurrentRole ? ACCENTS[0] : ACCENTS[idx % ACCENTS.length];

                return (
                  <Box
                    key={item?.id ?? idx}
                    className={`exp-v4-card ${isCurrentRole ? "exp-v4-current" : ""}`}
                    style={{
                      "--ev4-from": accent.from,
                      "--ev4-to": accent.to,
                      "--ev4-glow": accent.glow,
                      "--ev4-hue": accent.hue,
                      "--ev4-idx": idx,
                    }}
                  >
                    {/* ── DNA connector to next card ── */}
                    {idx < experience.length - 1 && (
                      <Box className="exp-v4-dna-connector">
                        <svg className="exp-v4-dna-svg" viewBox="0 0 40 60" fill="none">
                          <path d="M8 0 Q20 15 32 30 Q20 45 8 60" stroke={accent.from} strokeWidth="1.2" strokeDasharray="3 3" opacity="0.5" fill="none"/>
                          <path d="M32 0 Q20 15 8 30 Q20 45 32 60" stroke={accent.to} strokeWidth="1.2" strokeDasharray="3 3" opacity="0.35" fill="none"/>
                          {[10, 30, 50].map((y, i) => (
                            <line key={i} x1="8" y1={y} x2="32" y2={y} stroke={accent.from} strokeWidth="0.8" opacity="0.3"/>
                          ))}
                        </svg>
                      </Box>
                    )}

                    {/* ── Prismatic border (same as achievements) ── */}
                    <Box className="exp-v4-prism" style={{ background: `conic-gradient(from 0deg, transparent, ${accent.from}, ${accent.to}, transparent, transparent)` }} />

                    {/* ── Particle field ── */}
                    <Box className="exp-v4-particles" />

                    {/* ── Holo scan ── */}
                    <Box className="exp-v4-scan" style={{ background: `linear-gradient(180deg, transparent, ${accent.from}10, ${accent.from}1a, ${accent.from}10, transparent)` }} />

                    {/* ── Corner circuit traces ── */}
                    <Box className="exp-v4-corner-tl" style={{ borderColor: `${accent.from}88` }} />
                    <Box className="exp-v4-corner-br" style={{ borderColor: `${accent.to}66` }} />

                    {/* ── macOS status bar ── */}
                    <Box className="exp-v4-status-bar">
                      <Box className="exp-v4-status-dots">
                        <span className="exp-v4-sd exp-v4-sd-red" />
                        <span className="exp-v4-sd exp-v4-sd-yellow" />
                        <span className={`exp-v4-sd ${isCurrentRole ? "exp-v4-sd-green" : "exp-v4-sd-grey"}`} />
                      </Box>
                      <Box className="exp-v4-status-label" style={{ color: isCurrentRole ? "#22c55e" : "rgba(255,255,255,0.25)", WebkitTextFillColor: isCurrentRole ? "#22c55e" : "rgba(255,255,255,0.25)" }}>
                        <span className={isCurrentRole ? "exp-v4-pulse" : "exp-v4-pulse-off"} />
                        {isCurrentRole ? "ACTIVE ROLE" : "COMPLETED"}
                      </Box>
                      <Box className="exp-v4-index-stamp" style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                        {String(idx + 1).padStart(2, "0")}
                      </Box>
                    </Box>

                    {/* ── Main body ── */}
                    <Box className="exp-v4-body">

                      {/* Hex icon */}
                      <Box className="exp-v4-hex-wrap">
                        <Box className="exp-v4-hex-ring exp-v4-ring-1" style={{ borderColor: `${accent.from}55`, borderTopColor: `${accent.from}cc` }} />
                        <Box className="exp-v4-hex-ring exp-v4-ring-2" style={{ borderColor: `${accent.to}33`, borderRightColor: `${accent.to}88` }} />
                        <Box className="exp-v4-hex-core" style={{ background: `${accent.from}1a`, borderColor: `${accent.from}44`, boxShadow: `0 0 24px ${accent.glow}` }}>
                          <Typography style={{ fontSize: "1.5rem", lineHeight: 1 }}>{isCurrentRole ? "⚡" : "🏢"}</Typography>
                        </Box>
                        <Box className="exp-v4-hex-glow" style={{ background: `radial-gradient(circle, ${accent.from}44, transparent 70%)` }} />
                      </Box>

                      {/* Title block */}
                      <Box className="exp-v4-title-block">
                        <Typography className="exp-v4-role">{safeString(item?.role) || "Role"}</Typography>
                        <Box className="exp-v4-company-row">
                          <span className="exp-v4-company-beam" style={{ background: `linear-gradient(180deg, ${accent.from}, ${accent.to})`, boxShadow: `0 0 8px ${accent.from}88` }} />
                          <Typography className="exp-v4-company" style={{ color: accent.from, WebkitTextFillColor: accent.from }}>{safeString(item?.company) || "Company"}</Typography>
                        </Box>
                        <Box className="exp-v4-date-row">
                          <Box className="exp-v4-date-pill" style={{ background: `${accent.from}1a`, borderColor: `${accent.from}44`, color: accent.to, WebkitTextFillColor: accent.to }}>
                            {safeString(item?.start)}{safeString(item?.end) ? ` — ${safeString(item?.end)}` : " — Present"}
                          </Box>
                          {isCurrentRole && (
                            <Box className="exp-v4-live-badge">
                              <span className="exp-v4-live-dot" />
                              <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, color: "#22c55e", WebkitTextFillColor: "#22c55e", letterSpacing: "0.1em" }}>LIVE</Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Box>

                    {/* Divider */}
                    <Box className="exp-v4-divider" style={{ background: `linear-gradient(90deg, ${accent.from}88, ${accent.to}44, transparent)` }} />

                    {/* Description */}
                    {safeString(item?.description) && (
                      <Box className="exp-v4-desc-wrap">
                        <Typography className="exp-v4-desc">{safeString(item?.description)}</Typography>
                      </Box>
                    )}

                    {/* ── Terminal data strip ── */}
                    <Box className="exp-v4-terminal">
                      <Box className="exp-v4-terminal-inner" style={{ borderTopColor: `${accent.from}1a`, background: `${accent.from}06` }}>
                        <Box className="exp-v4-term-item">
                          <Typography className="exp-v4-term-val" style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                            {String(idx + 1).padStart(2, "0")}
                          </Typography>
                          <Typography className="exp-v4-term-lbl">POSITION</Typography>
                        </Box>
                        <Box className="exp-v4-term-sep" />
                        {yearsCount !== null && yearsCount >= 0 && (
                          <>
                            <Box className="exp-v4-term-item">
                              <Typography className="exp-v4-term-val" style={{ background: `linear-gradient(135deg, ${accent.to}, ${accent.from})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                                {yearsCount || "<1"}
                              </Typography>
                              <Typography className="exp-v4-term-lbl">{yearsCount === 1 ? "YEAR" : "YEARS"}</Typography>
                            </Box>
                            <Box className="exp-v4-term-sep" />
                          </>
                        )}
                        <Box sx={{ flex: 1 }} />
                        <Box className={`exp-v4-status-chip ${isCurrentRole ? "exp-v4-chip-active" : "exp-v4-chip-done"}`}>
                          {isCurrentRole ? "● ACTIVE" : "✓ COMPLETED"}
                        </Box>
                      </Box>
                    </Box>

                    {/* Watermark */}
                    <Box className="exp-v4-watermark">✦</Box>
                  </Box>
                );
              })
            ) : <GlassPanel sx={{ p: 3 }}><Typography>No experience added yet.</Typography></GlassPanel>}
          </Box>
        </MotionBox>
      </Box>
    </MotionBox>
  );

case "education":
  return (
    <MotionBox key="education" custom={navDirection} variants={pageVariants}
      initial="enter" animate="center" exit="exit" className="portfolio-page-frame">
      <Box className="section-scroll-area">
        <MotionBox className="portfolio-section section-static" variants={fadeUp} initial="hidden" animate="show">
          <SectionHeading title="Education" subtitle="Academic foundation — the architecture of knowledge." />
          <Box className="edu-v2-root">
            {loading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {[...Array(3)].map((_, i) => <Skeleton key={i} height={200} sx={{ borderRadius: 4 }} />)}
              </Box>
            ) : education.length ? (
              education.map((item, idx) => {
                const degree = safeString(item?.degree) || "Degree";
                const institution = safeString(item?.institution) || "Institution";
                const year = safeString(item?.year);
                const details = safeString(item?.details);

                const PALETTES = [
                  { a: "#f13024", b: "#f97316", glow: "rgba(241,48,36,0.45)", tag: "PRIMARY" },
                  { a: "#06b6d4", b: "#6366f1", glow: "rgba(99,102,241,0.40)", tag: "SECONDARY" },
                  { a: "#10b981", b: "#06b6d4", glow: "rgba(16,185,129,0.38)", tag: "TERTIARY" },
                  { a: "#f59e0b", b: "#ef4444", glow: "rgba(245,158,11,0.38)", tag: "MERIT" },
                ];
                const pal = PALETTES[idx % PALETTES.length];

                return (
                  <Box
                    key={item?.id ?? idx}
                    className="edu-v2-card"
                    style={{
                      "--ea": pal.a,
                      "--eb": pal.b,
                      "--eg": pal.glow,
                      "--ei": idx,
                    }}
                  >
                    {/* Spinning conic border beam */}
                    <Box className="edu-v2-border-beam" style={{ background: `conic-gradient(from 0deg, transparent 60%, ${pal.a}, ${pal.b}, transparent)` }} />

                    {/* Scanline sweep */}
                    <Box className="edu-v2-scan" />

                    {/* Grid texture overlay */}
                    <Box className="edu-v2-grid-overlay" />

                    {/* Corner brackets */}
                    <Box className="edu-v2-corner edu-v2-corner--tl" style={{ borderColor: `${pal.a}99` }} />
                    <Box className="edu-v2-corner edu-v2-corner--tr" style={{ borderColor: `${pal.a}99` }} />
                    <Box className="edu-v2-corner edu-v2-corner--bl" style={{ borderColor: `${pal.b}77` }} />
                    <Box className="edu-v2-corner edu-v2-corner--br" style={{ borderColor: `${pal.b}77` }} />

                    {/* Top HUD bar */}
                    <Box className="edu-v2-hud-bar">
                      <Box className="edu-v2-hud-left">
                        <Box className="edu-v2-hud-dot" style={{ background: pal.a, boxShadow: `0 0 8px ${pal.a}` }} />
                        <Box className="edu-v2-hud-dot" style={{ background: pal.b, boxShadow: `0 0 8px ${pal.b}`, opacity: 0.7 }} />
                        <Box className="edu-v2-hud-dot" style={{ background: "rgba(255,255,255,0.2)" }} />
                        <Typography className="edu-v2-hud-tag" style={{ color: pal.a, WebkitTextFillColor: pal.a }}>
                          EDU_{String(idx + 1).padStart(3, "0")}
                        </Typography>
                      </Box>
                      <Box className="edu-v2-hud-right">
                        <Box className="edu-v2-tier-badge" style={{ background: `${pal.a}18`, borderColor: `${pal.a}44`, color: pal.a, WebkitTextFillColor: pal.a }}>
                          {pal.tag}
                        </Box>
                        <Box className="edu-v2-hud-signal">
                          {[1,2,3,4].map(b => (
                            <Box key={b} className="edu-v2-signal-bar" style={{ height: `${b * 3 + 2}px`, background: b <= 3 ? pal.a : "rgba(255,255,255,0.12)" }} />
                          ))}
                        </Box>
                      </Box>
                    </Box>

                    {/* Main content area */}
                    <Box className="edu-v2-body">

                      {/* Left: Holographic index column */}
                      <Box className="edu-v2-left-col">
                        <Box className="edu-v2-index-orb" style={{ background: `radial-gradient(circle at 35% 35%, ${pal.a}33, ${pal.b}1a, transparent)`, borderColor: `${pal.a}44`, boxShadow: `0 0 32px ${pal.glow}, inset 0 0 20px ${pal.a}0d` }}>
                          <Box className="edu-v2-orb-ring edu-v2-orb-ring--1" style={{ borderTopColor: pal.a, borderColor: `${pal.a}22` }} />
                          <Box className="edu-v2-orb-ring edu-v2-orb-ring--2" style={{ borderRightColor: pal.b, borderColor: `${pal.b}18` }} />
                          <Box className="edu-v2-orb-ring edu-v2-orb-ring--3" style={{ borderBottomColor: `${pal.a}88`, borderColor: `${pal.a}0d` }} />
                          <Typography className="edu-v2-orb-num" style={{ background: `linear-gradient(135deg, ${pal.a}, ${pal.b})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                            {String(idx + 1).padStart(2, "0")}
                          </Typography>
                          <Typography className="edu-v2-orb-label">RECORD</Typography>
                        </Box>
                        {/* Vertical connector to next card */}
                        {idx < education.length - 1 && (
                          <Box className="edu-v2-connector">
                            <Box className="edu-v2-connector-line" style={{ background: `linear-gradient(180deg, ${pal.a}88, ${pal.b}22, transparent)` }} />
                            <Box className="edu-v2-connector-node" style={{ background: pal.a, boxShadow: `0 0 8px ${pal.a}` }} />
                          </Box>
                        )}
                      </Box>

                      {/* Right: Main info */}
                      <Box className="edu-v2-right-col">
                        {/* Degree title */}
                        <Box className="edu-v2-degree-wrap">
                          <Box className="edu-v2-degree-beam" style={{ background: `linear-gradient(180deg, ${pal.a}, ${pal.b})`, boxShadow: `0 0 10px ${pal.a}88` }} />
                          <Box>
                            <Typography className="edu-v2-degree">{degree}</Typography>
                            {/* Institution row */}
                            <Box className="edu-v2-institution-row">
                              <Box className="edu-v2-inst-icon" style={{ background: `${pal.a}18`, borderColor: `${pal.a}33` }}>
                                <MdSchool style={{ fontSize: "0.8rem", color: pal.a }} />
                              </Box>
                              <Typography className="edu-v2-institution" style={{ color: pal.b, WebkitTextFillColor: pal.b }}>
                                {institution}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Data grid row */}
                        <Box className="edu-v2-data-grid">
                          {year && (
                            <Box className="edu-v2-data-cell">
                              <Typography className="edu-v2-data-val" style={{ background: `linear-gradient(135deg, ${pal.a}, ${pal.b})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                                {year}
                              </Typography>
                              <Typography className="edu-v2-data-key">YEAR</Typography>
                            </Box>
                          )}
                          <Box className="edu-v2-data-cell">
                            <Box className="edu-v2-status-dot-wrap">
                              <span className="edu-v2-live-dot" style={{ background: pal.a, boxShadow: `0 0 8px ${pal.a}` }} />
                              <Typography className="edu-v2-data-val" style={{ color: pal.a, WebkitTextFillColor: pal.a }}>ACAD</Typography>
                            </Box>
                            <Typography className="edu-v2-data-key">STATUS</Typography>
                          </Box>
                        </Box>

                        {/* Details */}
                        {details && (
                          <>
                            <Box className="edu-v2-details-divider" style={{ background: `linear-gradient(90deg, ${pal.a}66, ${pal.b}33, transparent)` }} />
                            <Box className="edu-v2-details-wrap">
                              <Box className="edu-v2-details-icon" style={{ color: pal.a }}>▸</Box>
                              <Typography className="edu-v2-details">{details}</Typography>
                            </Box>
                          </>
                        )}
                      </Box>
                    </Box>

                    {/* Bottom progress rail */}
                    <Box className="edu-v2-rail">
                      <Box className="edu-v2-rail-fill" style={{ width: `${((idx + 1) / education.length) * 100}%`, background: `linear-gradient(90deg, ${pal.a}, ${pal.b})`, boxShadow: `0 0 12px ${pal.glow}` }} />
                      <Typography className="edu-v2-rail-label">
                        {idx + 1} / {education.length} ACADEMIC RECORDS
                      </Typography>
                    </Box>

                    {/* Watermark glyph */}
                    <Box className="edu-v2-watermark" style={{ WebkitTextFillColor: `${pal.a}08` }}>◈</Box>
                  </Box>
                );
              })
            ) : (
              <GlassPanel sx={{ p: 3 }}><Typography>No education added yet.</Typography></GlassPanel>
            )}
          </Box>
        </MotionBox>
      </Box>
    </MotionBox>
  );

case "achievements":
  return (
    <MotionBox key="achievements" custom={navDirection} variants={pageVariants}
      initial="enter" animate="center" exit="exit" className="portfolio-page-frame">
      <Box className="section-scroll-area">
        <MotionBox className="portfolio-section section-static" variants={fadeUp} initial="hidden" animate="show">
          <SectionHeading title="Achievements" subtitle="Certifications, awards, and recognitions." />
          <Box className="ach-ultra-grid">
            {loading ? (
              <Box className="ach-ultra-grid">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} height={280} sx={{ borderRadius: 4 }} />
                ))}
              </Box>
            ) : achievements.length ? (
              achievements.map((item, idx) => (
                <Box key={item?.id ?? idx} className="ach-ultra-card" style={{ "--ach-idx": idx }}>

                  {/* === Prismatic border beam === */}
                  <Box className="ach-prism-beam" />

                  {/* === Particle field background === */}
                  <Box className="ach-particle-field" />

                  {/* === Holographic scan === */}
                  <Box className="ach-holo-scan" />

                  {/* === Corner circuit traces === */}
                  <Box className="ach-circuit-tl" />
                  <Box className="ach-circuit-br" />

{/* === Top status bar === */}
{(() => {
  const hasProof = !!(item?.certificateFileName || safeString(item?.link));
  return (
    <Box className="ach-status-bar">
      <Box className="ach-status-dots">
        <span className="ach-sd ach-sd-red" />
        <span className="ach-sd ach-sd-yellow" />
        <span className={`ach-sd ${hasProof ? "ach-sd-green" : "ach-sd-grey"}`} />
      </Box>
      <Box className={`ach-status-label ${hasProof ? "" : "ach-status-label--unverified"}`}>
        <span className={hasProof ? "ach-status-pulse" : "ach-status-pulse-off"} />
        {hasProof ? "VERIFIED" : "UNVERIFIED"}
      </Box>
      <Box className="ach-index-stamp">
        {String(idx + 1).padStart(2, "0")}
      </Box>
    </Box>
  );
})()}

                  {/* === Main body === */}
                  <Box className="ach-ultra-body">

                    {/* Trophy + hologram effect */}
                    <Box className="ach-trophy-wrap">
                      <Box className="ach-trophy-ring ach-ring-1" />
                      <Box className="ach-trophy-ring ach-ring-2" />
                      <Box className="ach-trophy-ring ach-ring-3" />
                      <Box className="ach-trophy-core">
                        <MdEmojiEvents style={{ fontSize: "1.6rem", color: "#f13024" }} />
                      </Box>
                      <Box className="ach-trophy-glow" />
                    </Box>

                    {/* Title */}
                    <Typography className="ach-ultra-title">
                      {safeString(item?.title) || "Achievement"}
                    </Typography>

                    {/* Issuer */}
                    {safeString(item?.issuer) && (
                      <Box className="ach-ultra-issuer-row">
                        <span className="ach-issuer-beam" />
                        <Typography className="ach-ultra-issuer">
                          {safeString(item?.issuer)}
                        </Typography>
                      </Box>
                    )}

{/* Star constellation */}
{(() => {
  const hasCert = !!item?.certificateFileName;
  const hasLink = !!safeString(item?.link);
  const starCount = hasCert ? 5 : hasLink ? 5 : 3;
  const tagLabel = hasCert ? "CERTIFIED" : hasLink ? "VERIFIED" : null;
  return (
    <Box className="ach-constellation">
      {[1, 2, 3, 4, 5].map((s) => (
        <Box key={s} className="ach-star-wrap">
          <span className={`ach-star-ultra ${s <= starCount ? "ach-star-filled" : "ach-star-dim"}`}>★</span>
          {s <= starCount && <span className="ach-star-ray" />}
        </Box>
      ))}
      {tagLabel && (
        <Typography className="ach-verified-tag">{tagLabel}</Typography>
      )}
    </Box>
  );
})()}

                    {/* Year + Divider */}
                    {safeString(item?.year) && (
                      <Box className="ach-year-row">
                        <Box className="ach-year-line" />
                        <Box className="ach-year-ultra">{safeString(item?.year)}</Box>
                        <Box className="ach-year-line" />
                      </Box>
                    )}

                    {/* Action buttons */}
                    <Box className="ach-ultra-actions">
                      {safeString(item?.link) ? (
                        <button
                          type="button"
                          className="ach-action-btn ach-btn-outline"
                          onClick={() => window.open(safeString(item?.link), "_blank", "noopener,noreferrer")}
                        >
                          <MdLink style={{ fontSize: "0.9rem" }} />
                          View
                        </button>
                      ) : null}
                      {item?.certificateFileName ? (
                        <button
                          type="button"
                          className="ach-action-btn ach-btn-solid"
                          onClick={() => onPreviewCertificate(item.id, safeString(item?.title))}
                        >
                          <MdVisibility style={{ fontSize: "0.9rem" }} />
                          Certificate
                        </button>
                      ) : null}
                    </Box>
                  </Box>

{/* === Bottom data strip === */}
<Box className="ach-data-strip">
  <Box className="ach-data-item" style={{ flex: 1 }}>
    <Typography className="ach-data-val" style={{ fontSize: "0.6rem !important" }}>
      {item?.certificateFileName ? "● FILE" : safeString(item?.link) ? "● LINK" : "● NONE"}
    </Typography>
    <Typography className="ach-data-lbl">TYPE</Typography>
  </Box>
</Box>

                  {/* === Luxury corner watermark === */}
                  <Box className="ach-watermark">✦</Box>

                </Box>
              ))
            ) : (
              <GlassPanel sx={{ p: 3 }}>
                <Typography>No achievements yet.</Typography>
              </GlassPanel>
            )}
          </Box>
        </MotionBox>
      </Box>
    </MotionBox>
  );

case "languages":
  return (
    <MotionBox key="languages" custom={navDirection} variants={pageVariants}
      initial="enter" animate="center" exit="exit" className="portfolio-page-frame">
      <Box className="section-scroll-area">
        <MotionBox className="portfolio-section section-static" variants={fadeUp} initial="hidden" animate="show">
          <SectionHeading title="Programming Languages" subtitle="Mastery metrics — experience depth and proficiency levels." />
          {loading ? (
            <Box className="lholo-grid">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} height={170} sx={{ borderRadius: 4 }} />
              ))}
            </Box>
          ) : languages.length ? (
            <Box className="lholo-grid">
              {languages.map((lang, idx) => (
                <LanguageLogoCard key={lang?.id ?? idx} lang={lang} index={idx} />
              ))}
            </Box>
          ) : (
            <GlassPanel sx={{ p: 3 }}>
              <Typography>No language experience added yet.</Typography>
            </GlassPanel>
          )}
        </MotionBox>
      </Box>
    </MotionBox>
  );

case "contact":
  return (
    <MotionBox key="contact" custom={navDirection} variants={pageVariants}
      initial="enter" animate="center" exit="exit" className="portfolio-page-frame">
      <Box className="section-scroll-area">
        <MotionBox className="portfolio-section section-static" variants={fadeUp} initial="hidden" animate="show">
          <SectionHeading title="Contact" subtitle="Let's build something great together." />

          {/* ── HERO SIGNAL BANNER ── */}
          <Box className="contact-signal-banner">
            <Box className="csb-prism" />
            <Box className="csb-scan" />
            <Box className="csb-corner csb-corner--tl" />
            <Box className="csb-corner csb-corner--br" />
            <Box className="csb-grid-overlay" />

            {/* Status bar */}
            <Box className="csb-status-bar">
              <Box className="csb-dots">
                <span className="csb-sd csb-sd-red" />
                <span className="csb-sd csb-sd-yellow" />
                <span className="csb-sd csb-sd-green" />
              </Box>
              <Box className="csb-status-label">
                <span className="csb-live-dot" />
                SIGNAL ACTIVE
              </Box>
              <Box className="csb-signal-bars">
                {[1,2,3,4,5].map(b => (
                  <Box key={b} className="csb-bar" style={{ height: `${b*3+3}px`, opacity: b <= 4 ? 1 : 0.25 }} />
                ))}
              </Box>
            </Box>

            {/* Main banner content */}
            <Box className="csb-body">
              {/* Left: Avatar/Badge */}
              <Box className="csb-avatar-col">
                <Box className="csb-avatar-wrap">
                  <Box className="csb-avatar-ring csb-ring-1" />
                  <Box className="csb-avatar-ring csb-ring-2" />
                  <Box className="csb-avatar-ring csb-ring-3" />
                  <Box className="csb-avatar-core">
                    <MdContacts style={{ fontSize: "2rem", color: "#f13024" }} />
                  </Box>
                  <Box className="csb-avatar-glow" />
                </Box>
                <Box className="csb-online-badge">
                  <span className="csb-online-dot" />
                  ONLINE
                </Box>
              </Box>

              {/* Center: Contact Info */}
              <Box className="csb-info-col">
                <Typography className="csb-name">{name}</Typography>
                <Typography className="csb-role">{title}</Typography>

                <Box className="csb-divider" />

                <Box className="csb-contact-items">
                  {contactEmail && (
                    <Box className="csb-contact-item" onClick={() => window.open(`mailto:${contactEmail}`, "_blank")}>
                      <Box className="csb-contact-icon"><MdEmail style={{ fontSize: "1rem" }} /></Box>
                      <Box className="csb-contact-text">
                        <Typography className="csb-contact-label">EMAIL</Typography>
                        <Typography className="csb-contact-value">{contactEmail}</Typography>
                      </Box>
                      <MdArrowOutward className="csb-contact-arrow" />
                    </Box>
                  )}
                  {socials?.phone && (
                    <Box className="csb-contact-item" onClick={() => window.open(`tel:${safeString(socials.phone)}`, "_blank")}>
                      <Box className="csb-contact-icon"><MdPhone style={{ fontSize: "1rem" }} /></Box>
                      <Box className="csb-contact-text">
                        <Typography className="csb-contact-label">PHONE</Typography>
                        <Typography className="csb-contact-value">{safeString(socials.phone)}</Typography>
                      </Box>
                      <MdArrowOutward className="csb-contact-arrow" />
                    </Box>
                  )}
                  {location && (
                    <Box className="csb-contact-item">
                      <Box className="csb-contact-icon"><MdLocationOn style={{ fontSize: "1rem" }} /></Box>
                      <Box className="csb-contact-text">
                        <Typography className="csb-contact-label">LOCATION</Typography>
                        <Typography className="csb-contact-value">{location}</Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Right: Social Links */}
              <Box className="csb-social-col">
                <Typography className="csb-social-heading">CONNECT</Typography>
                <Box className="csb-social-grid">
                  {socials?.github && (
                    <Box className="csb-social-card" onClick={() => window.open(socials.github, "_blank", "noopener,noreferrer")}>
                      <Box className="csb-social-card-prism" />
                      <FaGithub style={{ fontSize: "1.4rem" }} />
                      <Typography className="csb-social-label">GitHub</Typography>
                      <Box className="csb-social-arrow"><MdArrowOutward /></Box>
                    </Box>
                  )}
                  {socials?.linkedin && (
                    <Box className="csb-social-card" onClick={() => window.open(socials.linkedin, "_blank", "noopener,noreferrer")}>
                      <Box className="csb-social-card-prism" />
                      <FaLinkedin style={{ fontSize: "1.4rem" }} />
                      <Typography className="csb-social-label">LinkedIn</Typography>
                      <Box className="csb-social-arrow"><MdArrowOutward /></Box>
                    </Box>
                  )}
                  {socials?.website && (
                    <Box className="csb-social-card" onClick={() => window.open(safeString(socials.website), "_blank", "noopener,noreferrer")}>
                      <Box className="csb-social-card-prism" />
                      <MdLink style={{ fontSize: "1.4rem" }} />
                      <Typography className="csb-social-label">Website</Typography>
                      <Box className="csb-social-arrow"><MdArrowOutward /></Box>
                    </Box>
                  )}
                </Box>

                {/* Terminal data strip */}
                <Box className="csb-terminal-strip">
                  <Box className="csb-ts-item">
                    <Typography className="csb-ts-val">24</Typography>
                    <Typography className="csb-ts-lbl">HR REPLY</Typography>
                  </Box>
                  <Box className="csb-ts-sep" />
                  <Box className="csb-ts-item">
                    <Typography className="csb-ts-val">100</Typography>
                    <Typography className="csb-ts-lbl">% OPEN</Typography>
                  </Box>
                  <Box className="csb-ts-sep" />
                  <Box className="csb-ts-item">
                    <Typography className="csb-ts-val">∞</Typography>
                    <Typography className="csb-ts-lbl">COLLAB</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box className="csb-watermark">✉</Box>
          </Box>

          {/* ── MESSAGE FORM CARD ── */}
          <Box className="contact-form-card">
            <Box className="cfc-prism" />
            <Box className="cfc-scan" />
            <Box className="cfc-corner cfc-corner--tl" />
            <Box className="cfc-corner cfc-corner--br" />

            {/* Status bar */}
            <Box className="cfc-status-bar">
              <Box className="cfc-dots">
                <span className="cfc-sd cfc-sd-red" />
                <span className="cfc-sd cfc-sd-yellow" />
                <span className="cfc-sd cfc-sd-green" />
              </Box>
              <Box className="cfc-status-label">
                <MdTerminal style={{ fontSize: "0.75rem" }} />
              </Box>
              <Box className="cfc-index-stamp"></Box>
            </Box>

            <Box className="cfc-body">
              {/* Left: decorative transmission panel */}
              <Box className="cfc-left-panel">
                <Box className="cfc-transmission-orb">
                  <Box className="cfc-trans-ring cfc-trans-ring-1" />
                  <Box className="cfc-trans-ring cfc-trans-ring-2" />
                  <Box className="cfc-trans-ring cfc-trans-ring-3" />
                  <Box className="cfc-trans-core">
                    <MdEmail style={{ fontSize: "1.8rem", color: "#f13024" }} />
                  </Box>
                  <Box className="cfc-trans-glow" />
                </Box>
                <Typography className="cfc-left-title">Send a<br/>Message</Typography>
                <Typography className="cfc-left-sub">Direct Email to {name}</Typography>

                {/* Decorative data lines */}
                <Box className="cfc-data-lines">
                  {["TO:", "FROM:", "SUBJECT:", "ENCRYPT:", "STATUS:"].map((label, i) => (
                    <Box key={i} className="cfc-data-line">
                      <Typography className="cfc-dl-key">{label}</Typography>
                      <Box className="cfc-dl-bar" style={{ width: `${40 + i * 12}%`, animationDelay: `${i*0.2}s` }} />
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Right: form */}
              <Box className="cfc-form-area">
                <ContactMessageCard contactEmail={contactEmail} name={name} />
              </Box>
            </Box>

            <Box className="cfc-watermark">⌨</Box>
          </Box>

          <Box className="portfolio-footer">
            <Typography>© {new Date().getFullYear()} {name}. All rights reserved.</Typography>
          </Box>
        </MotionBox>
      </Box>
    </MotionBox>
  );

      default:
        return null;
    }
  };

  return (
    <Box ref={rootRef} className={`portfolio-root ${mode === "dark" ? "mode-dark" : "mode-light"}`}>
      <CursorSpotlight />
      <Box className="portfolio-bg">
        <span className="portfolio-orb orb-one" />
        <span className="portfolio-orb orb-two" />
        <span className="portfolio-orb orb-three" />
        <span className="portfolio-grid" />
        <span className="portfolio-grid-glow" />
        <span className="portfolio-mesh-lines" />
        <NetworkCanvas mode={mode} />
      </Box>
      <VerticalNav items={sectionIds} activeId={activeSection} onJump={jumpTo} />
      <Box className="portfolio-shell">
        <Box className="portfolio-topbar">
          <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: "auto" }}>
            <Tooltip title="Reload">
              <IconButton onClick={reload} className="topbar-icon-btn"><MdRefresh /></IconButton>
            </Tooltip>
            <Tooltip title={mode === "dark" ? "Light Mode" : "Dark Mode"}>
              <IconButton onClick={toggleTheme} className="topbar-icon-btn">
                {mode === "dark" ? <MdLightMode /> : <MdDarkMode />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Admin">
              <IconButton onClick={() => navigate("/admin")} className="topbar-icon-btn accent">
                <MdAdminPanelSettings />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
        <Box className="portfolio-page-stage">
          <AnimatePresence mode="wait" custom={navDirection}>
            {renderSection()}
          </AnimatePresence>
        </Box>
      </Box>

      {/* Resume preview — unchanged */}
      <ResumePreviewDialog
        open={resumePreviewOpen}
        title={resumePreviewTitle}
        onClose={closeResumePreview}
        url={resumeViewUrlBusted}
        blobUrl={resumePreviewBlobUrl}
        loading={resumePreviewLoading}
      />

{/* ── Certificate preview dialog ── */}
<Dialog open={certPreviewOpen} onClose={closeCertPreview} fullWidth maxWidth="md">
  <DialogTitle sx={{ fontWeight: 900, fontSize: { xs: "1rem", md: "1.25rem" }, py: 1.5 }}>{certPreviewTitle}</DialogTitle>
  <DialogContent sx={{ height: { xs: 480, md: 580 }, p: 0, overflow: "hidden", bgcolor: "black" }}>
    {certPreviewLoading ? (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ opacity: 0.75 }}>Loading preview…</Typography>
      </Box>
    ) : certPreviewIsImage && certPreviewBlobUrl ? (
      // Image: blob URL works fine with <img>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <img
          src={certPreviewBlobUrl}
          alt={certPreviewTitle}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      </Box>
) : !certPreviewIsImage && certPreviewBlobUrl ? (
  /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? (
    <iframe
      key={`cert-mobile-${certPreviewAchId}`}
      src={`https://docs.google.com/viewer?url=${encodeURIComponent(
        `${(import.meta.env.VITE_API_URL || "").replace(/^\/api$/, "https://db-driven-portfolio-idt9.onrender.com/api") || "https://db-driven-portfolio-idt9.onrender.com/api"}/portfolio/achievements/${certPreviewAchId}/certificate`
      )}&embedded=true`}
      title={certPreviewTitle}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        display: "block",
      }}
    />
  ) : (
    <iframe
      key={certPreviewBlobUrl}
      src={`${certPreviewBlobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
      title={certPreviewTitle}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        display: "block",
      }}
    />
  )
    ) : (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ opacity: 0.75 }}>Preview not available.</Typography>
      </Box>
    )}
  </DialogContent>
  <DialogActions sx={{ p: 2 }}>
    <Button
      onClick={closeCertPreview}
      variant="contained"
      startIcon={<MdClose />}
      sx={{
        background: "linear-gradient(135deg, #f13024, #f97316)",
        color: "white",
        borderRadius: 999,
        fontWeight: 800,
        textTransform: "none",
        px: 3,
        boxShadow: "0 6px 20px rgba(241,48,36,0.3)",
        "&:hover": {
          background: "linear-gradient(135deg, #d42a1e, #e8650a)",
          boxShadow: "0 10px 28px rgba(241,48,36,0.45)",
        },
      }}
    >
      Close
    </Button>
  </DialogActions>
</Dialog>
    </Box>
  );
}

function NetworkCanvas({ mode }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let nodes = [];
    const NODE_COUNT = 55;
    const MAX_DIST   = 160;
    const isDark = mode === "dark";
    const nodeColor       = isDark ? "rgba(255,255,255,0.55)"  : "rgba(17,24,39,0.45)";
    const lineColor       = isDark ? "rgba(255,255,255,0.09)"  : "rgba(17,24,39,0.08)";
    const accentNodeColor = "rgba(241,48,36,0.7)";
    const accentLineColor = isDark ? "rgba(241,48,36,0.18)"    : "rgba(241,48,36,0.12)";
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    const initNodes = () => {
      nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.38,
        vy: (Math.random() - 0.5) * 0.38,
        r:  Math.random() * 2.2 + 1.2,
        accent: i < 6,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx   = nodes[i].x - nodes[j].x;
          const dy   = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha    = 1 - dist / MAX_DIST;
            const isAccent = nodes[i].accent || nodes[j].accent;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = isAccent
              ? accentLineColor.replace("0.18", `${0.18 * alpha}`).replace("0.12", `${0.12 * alpha}`)
              : lineColor.replace("0.09", `${0.09 * alpha}`).replace("0.08", `${0.08 * alpha}`);
            ctx.lineWidth = isAccent ? 1.1 : 0.8;
            ctx.stroke();
          }
        }
      }
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.accent ? accentNodeColor : nodeColor;
        ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    };
    resize(); initNodes(); draw();
    window.addEventListener("resize", () => { resize(); initNodes(); });
    return () => { cancelAnimationFrame(animationId); };
  }, [mode]);

  return (
    <canvas ref={canvasRef} style={{
      position: "absolute", inset: 0, width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 0, opacity: 0.7,
    }} />
  );
}