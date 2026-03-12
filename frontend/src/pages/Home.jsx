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
// LANGUAGE LOGO CARD — Advanced Horizontal Bento Row
// =============================================
function LanguageLogoCard({ lang, index }) {
  const language   = safeString(lang?.language) || "—";
  const level      = safeString(lang?.level).trim().toLowerCase();
  const rawYears   = typeof lang?.years === "number"
    ? lang.years
    : Number.parseFloat(String(lang?.years ?? "0").replace(/[^\d.]/g, "") || "0");
  const years      = Number.isFinite(rawYears) ? Math.max(0, Math.min(5, rawYears)) : 0;

  const levelMap   = { beginner: 1, intermediate: 2, advanced: 3 };
  const levelSteps = levelMap[level] ?? 0;
  const levelPct   = { beginner: 33, intermediate: 66, advanced: 100 }[level] ?? 0;
  const yearsPct   = (years / 5) * 100;
  const levelLabel = level ? level.charAt(0).toUpperCase() + level.slice(1) : "—";

  const levelColor = { beginner: "#f13024", intermediate: "#f97316", advanced: "#fbbf24" }[level] || "#f97316";
  const levelBg    = { beginner: "rgba(241,48,36,0.12)", intermediate: "rgba(249,115,22,0.12)", advanced: "rgba(251,191,36,0.12)" }[level] || "rgba(249,115,22,0.12)";

  const logoInfo = resolveSkillLogo(language);
  const initials = language.slice(0, 3).toUpperCase();
  const [urlIndex, setUrlIndex] = React.useState(0);
  const urls = logoInfo
    ? [logoInfo.primary, logoInfo.fallback1, logoInfo.fallback2, logoInfo.fallback3]
    : [];
  const currentUrl = urls[urlIndex] || null;

  // Gauge arc math (compact 200° sweep)
  const R = 18;
  const SWEEP = 200;
  const GAP = (360 - SWEEP) / 2;
  const toXY = (angleDeg, r) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: 24 + r * Math.cos(rad), y: 24 + r * Math.sin(rad) };
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

  return (
    <Box
      className="langrow-card"
      style={{ animationDelay: `${index * 0.07}s`, "--lc": levelColor, "--lb": levelBg }}
    >
      {/* Diagonal accent stripe */}
      <Box className="langrow-stripe" style={{ background: `linear-gradient(135deg, ${levelColor}22 0%, transparent 60%)` }} />

      {/* Index badge */}
      <Box className="langrow-index">
        {String(index + 1).padStart(2, "0")}
      </Box>

      {/* LEFT: Logo block */}
      <Box className="langrow-left">
        <Box className="langrow-logo-ring" style={{ boxShadow: `0 0 0 1px ${levelColor}33, 0 0 20px ${levelColor}22` }}>
          <Box className="langrow-logo-halo" style={{ background: `radial-gradient(circle, ${levelColor}30, transparent 70%)` }} />
          {currentUrl ? (
            <img
              key={currentUrl}
              src={currentUrl}
              alt={language}
              className="langrow-logo-img"
              onError={() => setUrlIndex((p) => p + 1)}
              loading="lazy"
            />
          ) : (
            <Box className="langrow-logo-fallback" style={{ color: levelColor, WebkitTextFillColor: levelColor }}>{initials}</Box>
          )}
        </Box>
        <Box className="langrow-name-block">
          <Typography className="langrow-name">{language}</Typography>
          <Box className="langrow-level-chip" style={{ background: levelBg, borderColor: `${levelColor}44`, color: levelColor, WebkitTextFillColor: levelColor }}>
            <span className="langrow-dot" style={{ background: levelColor, boxShadow: `0 0 5px ${levelColor}` }} />
            {levelLabel}
          </Box>
        </Box>
      </Box>

      {/* CENTER: Skill dots + exp bar */}
      <Box className="langrow-center">
        {/* 3 skill dots */}
        <Box className="langrow-dots-row">
          {[1, 2, 3].map((step) => (
            <Box
              key={step}
              className="langrow-dot-seg"
              style={{
                background: step <= levelSteps
                  ? `linear-gradient(135deg, ${levelColor}, ${levelColor}bb)`
                  : undefined,
                boxShadow: step <= levelSteps ? `0 0 8px ${levelColor}66` : undefined,
                borderColor: step <= levelSteps ? levelColor : undefined,
              }}
            />
          ))}
          <Typography className="langrow-level-text" style={{ color: levelColor, WebkitTextFillColor: levelColor }}>
            {levelLabel}
          </Typography>
        </Box>

        {/* Exp track */}
        <Box className="langrow-exp-section">
          <Box className="langrow-exp-label-row">
            <Typography className="langrow-exp-label">EXP TRACK</Typography>
            <Typography className="langrow-exp-value" style={{ color: levelColor, WebkitTextFillColor: levelColor }}>
              {years} / 5 yrs
            </Typography>
          </Box>
          <Box className="langrow-exp-track">
            <Box
              className="langrow-exp-fill"
              style={{
                width: `${yearsPct}%`,
                background: `linear-gradient(90deg, ${levelColor}dd, ${levelColor}88)`,
                boxShadow: `0 0 10px ${levelColor}55`,
              }}
            >
              <Box className="langrow-exp-shimmer" />
            </Box>
            {/* Tick marks */}
            {[0, 1, 2, 3, 4, 5].map((t) => (
              <Box
                key={t}
                className="langrow-tick"
                style={{ left: `${(t / 5) * 100}%`, background: t <= years ? levelColor : undefined }}
              />
            ))}
          </Box>
          <Box className="langrow-exp-scale">
            {[0, 1, 2, 3, 4, 5].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </Box>
        </Box>
      </Box>

      {/* RIGHT: Compact gauge */}
      <Box className="langrow-right">
        <svg viewBox="0 0 48 48" fill="none" className="langrow-gauge-svg">
          <defs>
            <linearGradient id={`lg-${index}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={levelColor} stopOpacity="0.95" />
              <stop offset="100%" stopColor={level === "beginner" ? "#f97316" : level === "intermediate" ? "#fbbf24" : "#ffe066"} stopOpacity="1" />
            </linearGradient>
          </defs>
          <path d={arcTrack} stroke="rgba(255,255,255,0.07)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          {arcFill && (
            <path
              d={arcFill}
              stroke={`url(#lg-${index})`}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              style={{ filter: `drop-shadow(0 0 3px ${levelColor}88)` }}
            />
          )}
          <text x="24" y="22" textAnchor="middle" dominantBaseline="middle"
            fill={levelColor} fontSize="8" fontWeight="900" fontFamily="Inter, sans-serif"
            letterSpacing="-0.3">{levelPct}%</text>
          <text x="24" y="31" textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.28)" fontSize="4.5" fontWeight="700" fontFamily="Inter, sans-serif"
            letterSpacing="0.5">LEVEL</text>
        </svg>
      </Box>
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ fontWeight: 900 }}>{title}</DialogTitle>
      <DialogContent sx={{ height: 700, p: 0, overflow: "hidden", bgcolor: "black" }}>
        {loading ? (
          <Box sx={{ p: 3 }}><Typography sx={{ opacity: 0.75 }}>Loading preview…</Typography></Box>
        ) : src ? (
          <Box sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
            <iframe title="Resume Preview" src={src}
              style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
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
// PROJECT CARD — with neon border + 3D tilt
// =============================================
function ProjectCard({ project }) {
  const title = safeString(project?.title) || "Untitled Project";
  const description = safeString(project?.description);
  const techList = splitCSV(project?.tech);
  const repoUrl = safeString(project?.repoUrl);
  const liveUrl = safeString(project?.liveUrl);
  const ref = useRef(null);

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
    el.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(10px) translateY(-4px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px) translateY(0px)";
  }, []);

  return (
    <MotionPaper
      ref={ref}
      variants={fadeUp}
      className="project-card neon-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Typography className="project-title">{title}</Typography>
      <Typography className="project-description">{description || "No description added yet."}</Typography>
      {techList.length ? (
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
          {techList.map((tech, i) => <Chip key={`${tech}-${i}`} label={tech} size="small" className="project-chip" />)}
        </Stack>
      ) : null}
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ mt: 3, gap: 1.2 }}>
        {repoUrl ? (
          <Button variant="outlined" startIcon={<MdLink />}
            onClick={() => window.open(repoUrl, "_blank", "noopener,noreferrer")}
            sx={{
              borderRadius: 999, fontWeight: 700,
              borderColor: "rgba(241,48,36,0.5) !important",
              color: "#f13024 !important",
              "&:hover": { borderColor: "#f13024 !important", background: "rgba(241,48,36,0.08) !important" },
            }}>Repository</Button>
        ) : null}
        {liveUrl ? (
          <Button variant="contained" startIcon={<MdArrowOutward />}
            onClick={() => window.open(liveUrl, "_blank", "noopener,noreferrer")}
            sx={{
              borderRadius: 999, fontWeight: 700,
              background: "linear-gradient(135deg, #f13024, #f97316) !important",
              color: "white !important",
              boxShadow: "0 6px 20px rgba(241,48,36,0.3)",
              "&:hover": { background: "linear-gradient(135deg, #d42a1e, #e8650a) !important" },
            }}>Live Preview</Button>
        ) : null}
      </Stack>
    </MotionPaper>
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
      const res = await fetch(`${API_BASE}/api/profile-image/list`);
      if (res.ok) {
        const data = await res.json();
        setProfileImages(Array.isArray(data) ? data : []);
        setImageBust(Date.now());
      }
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
const resolvedAnimatedSrc = useMemo(() => {
  const found = profileImages.find((i) => i.imageType === "animated" && i.primary === true);
  if (found) return `${API_BASE}/api/profile-image/animated?t=${imageBust}`;
  const anyAnimated = profileImages.find((i) => i.imageType === "animated");
  if (anyAnimated) return `${API_BASE}/api/profile-image/animated?t=${imageBust}`;
  return AnimatedPhoto;
}, [profileImages, imageBust]);

const resolvedOriginalSrc = useMemo(() => {
  const found = profileImages.find((i) => i.imageType === "original" && i.primary === true);
  if (found) return `${API_BASE}/api/profile-image/original?t=${imageBust}`;
  const anyOriginal = profileImages.find((i) => i.imageType === "original");
  if (anyOriginal) return `${API_BASE}/api/profile-image/original?t=${imageBust}`;
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
                <Box className="hero-layout hero-layout-two-col">
                  <Box className="hero-left hero-left-expanded">
                    <MotionBox variants={fadeUp}>
                      <Box className="hero-name-row">
                        <BlackholeBadge initials={profileInitials} name={name} />
                        <Box className="hero-name-text-block">
                          <Typography className="hero-name hero-name-display">{name}</Typography>
                          <Stack spacing={0.8} className="hero-meta-stack">
                            <Typography className="hero-role-line">{title}</Typography>
                            {location ? (
                              <Typography className="hero-detail-line">
                                <MdLocationOn style={{ marginRight: 5, flexShrink: 0 }} />{location}
                              </Typography>
                            ) : null}
                            {contactEmail ? (
                              <Typography className="hero-detail-line">
                                <MdEmail style={{ marginRight: 5, flexShrink: 0 }} />{contactEmail}
                              </Typography>
                            ) : null}
                          </Stack>
                        </Box>
                      </Box>
                      <Typography className="hero-title">
                        {typewriterText}
                        <span className={`typewriter-cursor ${typewriterDone ? "cursor-blink" : ""}`}>|</span>
                      </Typography>
                      <Typography className="hero-description">{about}</Typography>
                      <Stack className="hero-action-buttons" direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
                        <HeroActionButton variant="contained" startIcon={<MdArrowOutward />} onClick={() => jumpTo("projects")}
                          sx={{ background: "linear-gradient(135deg, #f13024, #f97316) !important", color: "white !important", border: "none !important", boxShadow: "0 8px 24px rgba(241,48,36,0.35) !important", "&:hover": { background: "linear-gradient(135deg, #d42a1e, #e8650a) !important", boxShadow: "0 12px 32px rgba(241,48,36,0.5) !important", transform: "translateY(-2px)" } }}>
                          View Work
                        </HeroActionButton>
                        <HeroActionButton variant="outlined" startIcon={<MdDownload />} onClick={onDownloadResume} disabled={downloading}
                          sx={{ borderColor: "rgba(241,48,36,0.5) !important", color: "#f13024 !important", "&:hover": { borderColor: "#f13024 !important", background: "rgba(241,48,36,0.08) !important" } }}>
                          {downloading ? "Downloading..." : "Download Resume"}
                        </HeroActionButton>
                        <HeroActionButton variant="outlined" startIcon={<MdVisibility />} onClick={onPreviewResume}
                          sx={{ borderColor: "rgba(241,48,36,0.5) !important", color: "#f13024 !important", "&:hover": { borderColor: "#f13024 !important", background: "rgba(241,48,36,0.08) !important" } }}>
                          Preview Resume
                        </HeroActionButton>
                      </Stack>
                      <Stack className="hero-social-row" direction="row" spacing={1.2} sx={{ mt: 3, flexWrap: "wrap" }}>
                        {socials?.github   && <IconButton className="hero-social-btn" onClick={() => window.open(socials.github, "_blank", "noopener,noreferrer")}><FaGithub /></IconButton>}
                        {socials?.linkedin && <IconButton className="hero-social-btn" onClick={() => window.open(socials.linkedin, "_blank", "noopener,noreferrer")}><FaLinkedin /></IconButton>}
                        {contactEmail     && <IconButton className="hero-social-btn" onClick={() => window.open(`mailto:${contactEmail}`, "_blank", "noopener,noreferrer")}><MdEmail /></IconButton>}
                        {socials?.phone   && <IconButton className="hero-social-btn" onClick={() => window.open(`tel:${safeString(socials.phone)}`, "_blank", "noopener,noreferrer")}><MdPhone /></IconButton>}
                        {socials?.website && <IconButton className="hero-social-btn" onClick={() => window.open(safeString(socials.website), "_blank", "noopener,noreferrer")}><MdLink /></IconButton>}
                      </Stack>
                    </MotionBox>
                  </Box>
                  {/* ── CHANGED: pass resolved src props ── */}
<Box className="hero-right">
  <ProfilePhotoCard
    key={`photo-${imageBust}`}
    animatedSrc={resolvedAnimatedSrc}
    originalSrc={resolvedOriginalSrc}
  />
</Box>
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
              <MotionBox className="portfolio-section section-static about-section-plain" variants={fadeUp} initial="hidden" animate="show">
                <SectionHeading title="About" subtitle="A short introduction and profile summary." />
                {loading ? <Skeleton height={180} /> : <Typography className="body-copy about-body-copy">{about}</Typography>}
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
                <SectionHeading title="Work" subtitle="Featured projects in a modern portfolio card layout." />
                {loading ? (
                  <Stack spacing={2}><Skeleton height={220} /><Skeleton height={220} /></Stack>
                ) : projects.length ? (
                  <Box className="project-grid">
                    {projects.map((project, idx) => <ProjectCard key={project?.id ?? idx} project={project} />)}
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
                <SectionHeading title="Experience" subtitle="Career and internship timeline." />
                <Stack spacing={2}>
                  {loading ? <Skeleton height={220} /> : experience.length ? (
                    experience.map((item, idx) => (
                      <GlassPanel key={item?.id ?? idx} sx={{ p: { xs: 2.5, md: 3 } }}>
                        <Typography className="timeline-title">{safeString(item?.role) || "Role"}</Typography>
                        <Typography className="timeline-subtitle">{safeString(item?.company) || "Company"}</Typography>
                        <Typography className="timeline-meta">
                          {safeString(item?.start)}{safeString(item?.end) ? ` - ${safeString(item?.end)}` : ""}
                        </Typography>
                        {safeString(item?.description) ? (
                          <Typography className="body-copy" sx={{ mt: 1.5 }}>{safeString(item?.description)}</Typography>
                        ) : null}
                      </GlassPanel>
                    ))
                  ) : <GlassPanel sx={{ p: 3 }}><Typography>No experience added yet.</Typography></GlassPanel>}
                </Stack>
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
                <SectionHeading title="Education" subtitle="Academic background and qualifications." />
                <Stack spacing={2}>
                  {loading ? <Skeleton height={220} /> : education.length ? (
                    education.map((item, idx) => (
                      <GlassPanel key={item?.id ?? idx} sx={{ p: { xs: 2.5, md: 3 } }}>
                        <Typography className="timeline-title">{safeString(item?.degree) || "Degree"}</Typography>
                        <Typography className="timeline-subtitle">{safeString(item?.institution) || "Institution"}</Typography>
                        <Typography className="timeline-meta">{safeString(item?.year) || ""}</Typography>
                        {safeString(item?.details) ? (
                          <Typography className="body-copy" sx={{ mt: 1.5 }}>{safeString(item?.details)}</Typography>
                        ) : null}
                      </GlassPanel>
                    ))
                  ) : <GlassPanel sx={{ p: 3 }}><Typography>No education added yet.</Typography></GlassPanel>}
                </Stack>
              </MotionBox>
            </Box>
          </MotionBox>
        );

      // ── CHANGED: achievements case — adds "View Certificate" button ──────
      case "achievements":
        return (
          <MotionBox key="achievements" custom={navDirection} variants={pageVariants}
            initial="enter" animate="center" exit="exit" className="portfolio-page-frame">
            <Box className="section-scroll-area">
              <MotionBox className="portfolio-section section-static" variants={fadeUp} initial="hidden" animate="show">
                <SectionHeading title="Achievements" subtitle="Certifications, awards, and recognitions." />
                <Box className="achievement-grid">
                  {loading ? <Skeleton height={220} /> : achievements.length ? (
                    achievements.map((item, idx) => (
                      <GlassPanel key={item?.id ?? idx} sx={{ p: { xs: 2.5, md: 3 } }}>
                        <Typography className="timeline-title">{safeString(item?.title) || "Achievement"}</Typography>
                        <Typography className="timeline-subtitle">{safeString(item?.issuer) || ""}</Typography>
                        <Typography className="timeline-meta">{safeString(item?.year) || ""}</Typography>
                        <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: 2 }}>
                          {safeString(item?.link) ? (
                            <Button variant="outlined" startIcon={<MdLink />}
                              sx={{
                                borderRadius: 999, fontWeight: 700,
                                borderColor: "rgba(241,48,36,0.5) !important",
                                color: "#f13024 !important",
                                "&:hover": { borderColor: "#f13024 !important", background: "rgba(241,48,36,0.08) !important" },
                              }}
                              onClick={() => window.open(safeString(item?.link), "_blank", "noopener,noreferrer")}>
                              View
                            </Button>
                          ) : null}
                          {item?.certificateFileName ? (
                            <Button variant="contained" startIcon={<MdVisibility />}
                              sx={{
                                borderRadius: 999, fontWeight: 700,
                                background: "linear-gradient(135deg, #f13024, #f97316) !important",
                                color: "white !important",
                                boxShadow: "0 6px 20px rgba(241,48,36,0.3)",
                                "&:hover": { background: "linear-gradient(135deg, #d42a1e, #e8650a) !important" },
                              }}
                              onClick={() => onPreviewCertificate(item.id, safeString(item?.title))}>
                              View Certificate
                            </Button>
                          ) : null}
                        </Stack>
                      </GlassPanel>
                    ))
                  ) : <GlassPanel sx={{ p: 3 }}><Typography>No achievements yet.</Typography></GlassPanel>}
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
          <SectionHeading title="Programming Languages" subtitle="Language proficiency and years of experience." />
          {loading ? (
            <Box className="langrow-grid">
              {[...Array(6)].map((_, i) => (
  <Skeleton key={i} height={90} sx={{ borderRadius: 3 }} />
))}
            </Box>
          ) : languages.length ? (
            <Box className="langrow-grid">
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
                <GlassPanel sx={{ p: { xs: 2.5, md: 3.5 }, mb: 3 }}>
                  <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 3, md: 4 } }}>
                    <Box sx={{ flex: "0 0 auto", minWidth: 0, width: { xs: "100%", md: "38%" } }}>
                      <Typography className="timeline-title" sx={{ mb: 2 }}>Get in touch</Typography>
                      <Stack spacing={1.6}>
                        {contactEmail && <Typography className="contact-line"><MdEmail style={{ marginRight: 10 }} />{contactEmail}</Typography>}
                        {socials?.phone && <Typography className="contact-line"><MdPhone style={{ marginRight: 10 }} />{safeString(socials.phone)}</Typography>}
                        {location && <Typography className="contact-line"><MdLocationOn style={{ marginRight: 10 }} />{location}</Typography>}
                      </Stack>
                      <Stack direction="row" flexWrap="wrap" sx={{ mt: 3, gap: 1.2 }}>
                        {socials?.github && (
                          <Button variant="outlined" startIcon={<FaGithub />}
                            sx={{ borderRadius: 999, fontWeight: 700, borderColor: "rgba(241,48,36,0.5) !important", color: "#f13024 !important", "&:hover": { borderColor: "#f13024 !important", background: "rgba(241,48,36,0.08) !important" } }}
                            onClick={() => window.open(socials.github, "_blank", "noopener,noreferrer")}>GitHub</Button>
                        )}
                        {socials?.linkedin && (
                          <Button variant="outlined" startIcon={<FaLinkedin />}
                            sx={{ borderRadius: 999, fontWeight: 700, borderColor: "rgba(241,48,36,0.5) !important", color: "#f13024 !important", "&:hover": { borderColor: "#f13024 !important", background: "rgba(241,48,36,0.08) !important" } }}
                            onClick={() => window.open(socials.linkedin, "_blank", "noopener,noreferrer")}>LinkedIn</Button>
                        )}
                        {socials?.website && (
                          <Button variant="outlined" startIcon={<MdLink />}
                            sx={{ borderRadius: 999, fontWeight: 700, borderColor: "rgba(241,48,36,0.5) !important", color: "#f13024 !important", "&:hover": { borderColor: "#f13024 !important", background: "rgba(241,48,36,0.08) !important" } }}
                            onClick={() => window.open(safeString(socials.website), "_blank", "noopener,noreferrer")}>Website</Button>
                        )}
                      </Stack>
                    </Box>
                    <Box sx={{ display: { xs: "none", md: "block" }, width: "1px", background: "rgba(241,48,36,0.18)", borderRadius: 4, flexShrink: 0 }} />
                    <Box sx={{ display: { xs: "block", md: "none" }, height: "1px", background: "rgba(241,48,36,0.18)", borderRadius: 4 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <ContactMessageCard contactEmail={contactEmail} name={name} />
                    </Box>
                  </Box>
                </GlassPanel>
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
<Dialog open={certPreviewOpen} onClose={closeCertPreview} fullWidth maxWidth="lg">
  <DialogTitle sx={{ fontWeight: 900 }}>{certPreviewTitle}</DialogTitle>
  <DialogContent sx={{ height: 700, p: 0, overflow: "hidden", bgcolor: "black" }}>
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
      <embed
        key={certPreviewBlobUrl}
        src={certPreviewBlobUrl}
        type="application/pdf"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
      />
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