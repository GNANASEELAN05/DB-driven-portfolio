import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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

const MotionBox = motion(Box);
const MotionPaper = motion(Paper);

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
// =============================================
function ProfilePhotoCard() {
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
      <Box
        className="profile-photo-layer"
        style={{ opacity: showOriginal ? 0 : 1, transition: "opacity 0.75s ease" }}
      >
        <img src={AnimatedPhoto} alt="Animated profile" className="profile-photo-img" />
      </Box>

      <Box
        className="profile-photo-layer"
        style={{ opacity: showOriginal ? 1 : 0, transition: "opacity 0.75s ease" }}
      >
        <img src={OriginalPhoto} alt="Original profile" className="profile-photo-img profile-photo-original" />
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

  const name          = safeString(profile?.name)       || "Your Name";
  const profileInitials = safeString(profile?.initials) || "";
  const title         = safeString(profile?.title)      || "Full Stack Developer";
  const tagline       = safeString(profile?.tagline)    || "Transforming Ideas Into Digital Reality";
  const about         = safeString(profile?.about)      || "Add your about content from admin.";
  const location      = safeString(profile?.location)   || "";
  const emailPublic   = safeString(profile?.emailPublic)|| "";

  // Typewriter for tagline (only on hero)
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

  const skillRows = useMemo(() => {
    const s = skills || {};
    return [
      { category: "Frontend", value: splitCSV(s.frontend).join(", ") || "—" },
      { category: "Backend",  value: splitCSV(s.backend).join(", ")  || "—" },
      { category: "Database", value: splitCSV(s.database).join(", ") || "—" },
      { category: "Tools",    value: splitCSV(s.tools).join(", ")    || "—" },
    ];
  }, [skills]);

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
    const sync = () => reload();
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

  const renderSection = () => {
    switch (activeSection) {

      case "home":
        return (
          <MotionBox key="home" custom={navDirection} variants={pageVariants}
            initial="enter" animate="center" exit="exit" className="portfolio-page-frame">
            <Box className="section-scroll-area home-scroll-area">
              <MotionBox className="portfolio-section hero-section" initial="hidden" animate="show" variants={fadeUp}>
                <Box className="hero-layout hero-layout-two-col">

                  {/* LEFT COLUMN */}
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

                      {/* TYPEWRITER TAGLINE */}
                      <Typography className="hero-title">
                        {typewriterText}
                        <span className={`typewriter-cursor ${typewriterDone ? "cursor-blink" : ""}`}>|</span>
                      </Typography>
                      <Typography className="hero-description">{about}</Typography>

                      <Stack className="hero-action-buttons" direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
                        <HeroActionButton
                          variant="contained"
                          startIcon={<MdArrowOutward />}
                          onClick={() => jumpTo("projects")}
                          sx={{
                            background: "linear-gradient(135deg, #f13024, #f97316) !important",
                            color: "white !important",
                            border: "none !important",
                            boxShadow: "0 8px 24px rgba(241,48,36,0.35) !important",
                            "&:hover": {
                              background: "linear-gradient(135deg, #d42a1e, #e8650a) !important",
                              boxShadow: "0 12px 32px rgba(241,48,36,0.5) !important",
                              transform: "translateY(-2px)",
                            },
                          }}
                        >
                          View Work
                        </HeroActionButton>
                        <HeroActionButton
                          variant="outlined"
                          startIcon={<MdDownload />}
                          onClick={onDownloadResume}
                          disabled={downloading}
                          sx={{
                            borderColor: "rgba(241,48,36,0.5) !important",
                            color: "#f13024 !important",
                            "&:hover": {
                              borderColor: "#f13024 !important",
                              background: "rgba(241,48,36,0.08) !important",
                            },
                          }}
                        >
                          {downloading ? "Downloading..." : "Download Resume"}
                        </HeroActionButton>
                        <HeroActionButton
                          variant="outlined"
                          startIcon={<MdVisibility />}
                          onClick={onPreviewResume}
                          sx={{
                            borderColor: "rgba(241,48,36,0.5) !important",
                            color: "#f13024 !important",
                            "&:hover": {
                              borderColor: "#f13024 !important",
                              background: "rgba(241,48,36,0.08) !important",
                            },
                          }}
                        >
                          Preview Resume
                        </HeroActionButton>
                      </Stack>

                      <Stack className="hero-social-row" direction="row" spacing={1.2} sx={{ mt: 3, flexWrap: "wrap" }}>
                        {socials?.github ? (
                          <IconButton className="hero-social-btn"
                            onClick={() => window.open(socials.github, "_blank", "noopener,noreferrer")}>
                            <FaGithub />
                          </IconButton>
                        ) : null}
                        {socials?.linkedin ? (
                          <IconButton className="hero-social-btn"
                            onClick={() => window.open(socials.linkedin, "_blank", "noopener,noreferrer")}>
                            <FaLinkedin />
                          </IconButton>
                        ) : null}
                        {contactEmail ? (
                          <IconButton className="hero-social-btn"
                            onClick={() => window.open(`mailto:${contactEmail}`, "_blank", "noopener,noreferrer")}>
                            <MdEmail />
                          </IconButton>
                        ) : null}
                        {socials?.phone ? (
                          <IconButton className="hero-social-btn"
                            onClick={() => window.open(`tel:${safeString(socials.phone)}`, "_blank", "noopener,noreferrer")}>
                            <MdPhone />
                          </IconButton>
                        ) : null}
                        {socials?.website ? (
                          <IconButton className="hero-social-btn"
                            onClick={() => window.open(safeString(socials.website), "_blank", "noopener,noreferrer")}>
                            <MdLink />
                          </IconButton>
                        ) : null}
                      </Stack>
                    </MotionBox>
                  </Box>

                  {/* RIGHT COLUMN */}
                  <Box className="hero-right">
                    <ProfilePhotoCard />
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
                <SectionHeading title="Skills" subtitle="Tech stack grouped the same way your backend already returns it." />
                <GlassPanel sx={{ p: { xs: 2, md: 3 } }}>
                  {loading ? <Skeleton height={220} /> : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Skills</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {skillRows.map((row, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontWeight: 700 }}>{row.category}</TableCell>
                              <TableCell>{row.value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </GlassPanel>
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
                        {safeString(item?.link) ? (
                          <Button variant="outlined" startIcon={<MdLink />}
                            sx={{ mt: 2, borderRadius: 999, fontWeight: 700 }}
                            onClick={() => window.open(safeString(item?.link), "_blank", "noopener,noreferrer")}>
                            View
                          </Button>
                        ) : null}
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
                <GlassPanel sx={{ p: { xs: 2.5, md: 3.5 } }}>
                  {loading ? <Skeleton height={220} sx={{ mt: 2 }} /> : languages.length ? (
                    <Box className="lang-grid">
                      {languages.map((lang, idx) => (
                        <Box key={lang?.id ?? idx} className="language-card">
                          <Box className="language-card-head">
                            <Typography className="language-name">{safeString(lang?.language) || "—"}</Typography>
                          </Box>
                          <Stack spacing={1.4} sx={{ mt: 1.25 }}>
                            <LanguageLevelBar level={lang?.level} />
                            <LanguageYearsBar years={lang?.years} />
                          </Stack>
                        </Box>
                      ))}
                    </Box>
                  ) : <Typography sx={{ mt: 2 }}>No language experience added yet.</Typography>}
                </GlassPanel>
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
                  <Typography className="timeline-title">Get in touch</Typography>
                  <Stack spacing={1.6} sx={{ mt: 2 }}>
                    {contactEmail ? <Typography className="contact-line"><MdEmail style={{ marginRight: 10 }} />{contactEmail}</Typography> : null}
                    {socials?.phone ? <Typography className="contact-line"><MdPhone style={{ marginRight: 10 }} />{safeString(socials.phone)}</Typography> : null}
                    {location ? <Typography className="contact-line"><MdLocationOn style={{ marginRight: 10 }} />{location}</Typography> : null}
                  </Stack>
                  <Stack direction="row" spacing={1.2} sx={{ mt: 3, flexWrap: "wrap", rowGap: "10px" }}>
{socials?.github ? (
  <Button variant="outlined" startIcon={<FaGithub />}
    sx={{ borderRadius: 999, fontWeight: 700, width: { xs: "100%", sm: "auto" }, borderColor: "rgba(241,48,36,0.5) !important", color: "#f13024 !important", "&:hover": { borderColor: "#f13024 !important", background: "rgba(241,48,36,0.08) !important" } }}
    onClick={() => window.open(socials.github, "_blank", "noopener,noreferrer")}>GitHub</Button>
) : null}
{socials?.linkedin ? (
  <Button variant="outlined" startIcon={<FaLinkedin />}
    sx={{ borderRadius: 999, fontWeight: 700, width: { xs: "100%", sm: "auto" }, borderColor: "rgba(241,48,36,0.5) !important", color: "#f13024 !important", "&:hover": { borderColor: "#f13024 !important", background: "rgba(241,48,36,0.08) !important" } }}
    onClick={() => window.open(socials.linkedin, "_blank", "noopener,noreferrer")}>LinkedIn</Button>
) : null}
{socials?.website ? (
  <Button variant="outlined" startIcon={<MdLink />}
    sx={{ borderRadius: 999, fontWeight: 700, width: { xs: "100%", sm: "auto" }, borderColor: "rgba(241,48,36,0.5) !important", color: "#f13024 !important", "&:hover": { borderColor: "#f13024 !important", background: "rgba(241,48,36,0.08) !important" } }}
    onClick={() => window.open(safeString(socials.website), "_blank", "noopener,noreferrer")}>Website</Button>
) : null}
                  </Stack>
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
      {/* CURSOR SPOTLIGHT */}
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

      <ResumePreviewDialog
        open={resumePreviewOpen}
        title={resumePreviewTitle}
        onClose={closeResumePreview}
        url={resumeViewUrlBusted}
        blobUrl={resumePreviewBlobUrl}
        loading={resumePreviewLoading}
      />
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
    const nodeColor      = isDark ? "rgba(255,255,255,0.55)"    : "rgba(17,24,39,0.45)";
    const lineColor      = isDark ? "rgba(255,255,255,0.09)"    : "rgba(17,24,39,0.08)";
    const accentNodeColor = "rgba(241,48,36,0.7)";
    const accentLineColor = isDark ? "rgba(241,48,36,0.18)"     : "rgba(241,48,36,0.12)";
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