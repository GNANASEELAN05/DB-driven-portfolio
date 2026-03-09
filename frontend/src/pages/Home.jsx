import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
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

const floatIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease: [0.25, 0.25, 0.25, 0.75] },
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
    transition: {
      duration: 0.62,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction >= 0 ? -70 : 70,
    scale: 0.985,
    filter: "blur(8px)",
    transition: {
      duration: 0.44,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

function safeString(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function splitCSV(s) {
  if (!s) return [];
  if (Array.isArray(s)) return s.filter(Boolean).map((x) => String(x).trim()).filter(Boolean);
  return String(s)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
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
    try {
      filename = decodeURIComponent(match[1]).replace(/["']/g, "").trim();
    } catch {
      filename = String(match[1]).replace(/["']/g, "").trim();
    }
    if (!filename.toLowerCase().endsWith(".pdf")) filename += ".pdf";
  }

  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objUrl);

  return filename;
}

function ResumePreviewDialog({ open, title, onClose, url, blobUrl, loading }) {
  const src = blobUrl || url;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ fontWeight: 900 }}>{title}</DialogTitle>
      <DialogContent
        sx={{
          height: 700,
          p: 0,
          overflow: "hidden",
          bgcolor: "black",
        }}
      >
        {loading ? (
          <Box sx={{ p: 3 }}>
            <Typography sx={{ opacity: 0.75 }}>Loading preview…</Typography>
          </Box>
        ) : src ? (
          <Box sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
            <iframe
              title="Resume Preview"
              src={src}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
              }}
            />
          </Box>
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography sx={{ opacity: 0.75 }}>Preview not available.</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" startIcon={<MdClose />}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// FIXED: VerticalNav — bare icon only (no bubble wrapper), active fills icon color with gradient,
// hover shows name tooltip and fills icon with accent color, stays filled after hover when active
function VerticalNav({ items, activeId, onJump }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <Box className="portfolio-side-nav">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;
        const isHovered = hoveredId === item.id;
        return (
          <Tooltip
            key={item.id}
            title={item.label}
            placement="left"
            arrow
          >
            <button
              type="button"
              className={`portfolio-side-nav-item ${isActive ? "active" : ""} ${isHovered && !isActive ? "hovered" : ""}`}
              onClick={() => onJump(item.id)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              aria-label={item.label}
            >
              <span className="icon-inner">
                <Icon />
              </span>
            </button>
          </Tooltip>
        );
      })}
    </Box>
  );
}

function HeroActionButton({ children, ...props }) {
  return (
    <Button
      {...props}
      sx={{
        borderRadius: 999,
        px: 2.3,
        py: 1.2,
        fontWeight: 800,
        textTransform: "none",
        letterSpacing: 0.2,
        ...(props.sx || {}),
      }}
    >
      {children}
    </Button>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <Stack spacing={1.1} sx={{ mb: 3 }}>
      <Typography className="section-title">{title}</Typography>
      {subtitle ? <Typography className="section-subtitle">{subtitle}</Typography> : null}
    </Stack>
  );
}

function GlassPanel({ children, sx, className = "" }) {
  return (
    <Paper className={`glass-panel ${className}`.trim()} sx={sx}>
      {children}
    </Paper>
  );
}

// FIXED: Luxury unique spinner with dual rings, diamond markers, and gold/gradient accents
function MiniOrbitBadge({ initials, name }) {
  const resolvedInitials =
    safeString(initials).trim() ||
    safeString(name)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");

  const spinText = resolvedInitials
    ? `${resolvedInitials} • ${resolvedInitials} • ${resolvedInitials} • ${resolvedInitials} •`
    : "• • • • • • • • • •";

  return (
    <Box className="hero-name-spinner-badge" aria-hidden="true">
      <svg viewBox="0 0 120 120" className="hero-name-spinner-svg">
        <defs>
          <path
            id="miniOrbitPath"
            d="M60,60
               m-43,0
               a43,43 0 1,1 86,0
               a43,43 0 1,1 -86,0"
          />
          <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f13024" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="spinnerGoldRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(251,191,36,0.7)" />
            <stop offset="100%" stopColor="rgba(241,48,36,0.5)" />
          </linearGradient>
          <filter id="spinnerGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(241,48,36,0.18)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Outermost subtle ring */}
        <circle cx="60" cy="60" r="56" fill="none" stroke="url(#spinnerGoldRing)" strokeWidth="0.5" strokeDasharray="2 6" />

        {/* Outer dashed ring */}
        <circle className="hero-name-spinner-ring" cx="60" cy="60" r="49" />

        {/* Spinning text path */}
        <text className="hero-name-spinner-text">
          <textPath href="#miniOrbitPath" startOffset="0%">
            {spinText}
          </textPath>
        </text>

        {/* Inner glow circle */}
        <circle cx="60" cy="60" r="34" fill="url(#centerGlow)" />

        {/* Inner solid ring */}
        <circle className="hero-name-spinner-ring-inner" cx="60" cy="60" r="30" />

        {/* Diamond markers at 4 corners */}
        {[0, 90, 180, 270].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const mx = 60 + 43 * Math.cos(rad);
          const my = 60 + 43 * Math.sin(rad);
          return (
            <rect
              key={i}
              x={mx - 3}
              y={my - 3}
              width="6"
              height="6"
              fill="url(#spinnerGradient)"
              transform={`rotate(45 ${mx} ${my})`}
              filter="url(#spinnerGlow)"
              opacity="0.9"
            />
          );
        })}

        {/* Center initials with gradient */}
        <text x="60" y="65" textAnchor="middle" className="hero-name-spinner-center-initials" fill="url(#spinnerGradient)">
          {resolvedInitials || "?"}
        </text>

        {/* Tiny accent dots on inner ring */}
        {[45, 135, 225, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const dx = 60 + 30 * Math.cos(rad);
          const dy = 60 + 30 * Math.sin(rad);
          return (
            <circle key={i} cx={dx} cy={dy} r="1.5" fill="rgba(251,191,36,0.8)" />
          );
        })}
      </svg>
    </Box>
  );
}

function ProjectCard({ project }) {
  const title = safeString(project?.title) || "Untitled Project";
  const description = safeString(project?.description);
  const techList = splitCSV(project?.tech);
  const repoUrl = safeString(project?.repoUrl);
  const liveUrl = safeString(project?.liveUrl);

  return (
    <MotionPaper variants={fadeUp} className="project-card" whileHover={{ y: -8 }}>
      <Typography className="project-title">{title}</Typography>

      <Typography className="project-description">
        {description || "No description added yet."}
      </Typography>

      {techList.length ? (
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
          {techList.map((tech, i) => (
            <Chip key={`${tech}-${i}`} label={tech} size="small" className="project-chip" />
          ))}
        </Stack>
      ) : null}

      <Stack direction="row" spacing={1.2} sx={{ mt: 3, flexWrap: "wrap" }}>
        {repoUrl ? (
          <Button
            variant="outlined"
            startIcon={<MdLink />}
            onClick={() => window.open(repoUrl, "_blank", "noopener,noreferrer")}
            sx={{ borderRadius: 999, fontWeight: 700 }}
          >
            Repository
          </Button>
        ) : null}

        {liveUrl ? (
          <Button
            variant="contained"
            startIcon={<MdArrowOutward />}
            onClick={() => window.open(liveUrl, "_blank", "noopener,noreferrer")}
            sx={{ borderRadius: 999, fontWeight: 700 }}
          >
            Live Preview
          </Button>
        ) : null}
      </Stack>
    </MotionPaper>
  );
}

function LanguageLevelBar({ level }) {
  const normalized = safeString(level).trim().toLowerCase();
  const levelMap = {
    beginner: 33.33,
    intermediate: 66.66,
    advanced: 100,
  };

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
  const raw =
    typeof years === "number"
      ? years
      : Number.parseFloat(String(years).replace(/[^\d.]/g, "") || "0");

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
          {[0, 1, 2, 3, 4, 5].map((tick) => (
            <span key={tick} className="tick">
              {tick}
            </span>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function Home({ toggleTheme }) {
  useEffect(() => {
    document.title = "Gnanaseelan V Portfolio";
  }, []);

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

  // FIXED: Added "languages" as a separate section with MdTerminal icon
  const sectionIds = useMemo(
    () => [
      { id: "home", label: "Home", icon: MdHome },
      { id: "about", label: "About", icon: MdPerson },
      { id: "skills", label: "Skills", icon: MdCode },
      { id: "projects", label: "Work", icon: MdWork },
      { id: "experience", label: "Experience", icon: MdTimeline },
      { id: "education", label: "Education", icon: MdSchool },
      { id: "achievements", label: "Achievements", icon: MdEmojiEvents },
      { id: "languages", label: "Programming Languages", icon: MdTerminal },
      { id: "contact", label: "Contact", icon: MdContacts },
    ],
    []
  );

  const sectionIndexMap = useMemo(() => {
    const map = {};
    sectionIds.forEach((item, idx) => {
      map[item.id] = idx;
    });
    return map;
  }, [sectionIds]);

  const name = safeString(profile?.name) || "Your Name";
  const profileInitials = safeString(profile?.initials) || "";
  const title = safeString(profile?.title) || "Full Stack Developer";
  const tagline = safeString(profile?.tagline) || "Transforming Ideas Into Digital Reality";
  const about = safeString(profile?.about) || "Add your about content from admin.";
  const location = safeString(profile?.location) || "";
  const emailPublic = safeString(profile?.emailPublic) || "";

  const contactEmail = useMemo(() => {
    const ep = safeString(emailPublic).trim();
    if (ep) return ep;
    const se = safeString(socials?.email).trim();
    if (se) return se;
    return "";
  }, [emailPublic, socials?.email]);

  const reload = () => setReloadTick((x) => x + 1);

  const contentVersion = useMemo(
    () => localStorage.getItem("content_version") || "0",
    [reloadTick]
  );

  const resumeDownloadBase = useMemo(() => downloadResumeUrl(), []);
  const resumeViewBase = useMemo(() => viewResumeUrl(), []);

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
      { category: "Backend", value: splitCSV(s.backend).join(", ") || "—" },
      { category: "Database", value: splitCSV(s.database).join(", ") || "—" },
      { category: "Tools", value: splitCSV(s.tools).join(", ") || "—" },
    ];
  }, [skills]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);

        const [profRes, skillsRes, projRes, expRes, eduRes, socRes, achRes, langRes] =
          await Promise.all([
            getProfile(),
            getSkills(),
            getFeaturedProjects(),
            getExperience(),
            getEducation(),
            getSocials(),
            getAchievements(),
            getLanguageExperience(),
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

        const localName =
          localStorage.getItem("active_resume_file_name") ||
          localStorage.getItem("resume_file_name") ||
          "";

        if (localName) {
          setResumeName(localName);
        } else {
          const profileName = safeString(nextProfile?.name) || "Resume";
          setResumeName(`${profileName.replace(/\s+/g, "_")}_Resume.pdf`);
        }
      } catch {
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [reloadTick]);

  useEffect(() => {
    const sync = () => reload();

    const onStorage = (e) => {
      if (!e) return;
      if (
        e.key === "content_version" ||
        e.key === "active_resume_file_name" ||
        e.key === "resume_file_name"
      ) {
        sync();
      }
    };

    const onVis = () => {
      if (document.visibilityState === "visible") sync();
    };

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
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      const rx = ((event.clientY - rect.top) / rect.height - 0.5) * 12;
      const ry = ((event.clientX - rect.left) / rect.width - 0.5) * 12;

      target.style.setProperty("--mouse-x", `${x}%`);
      target.style.setProperty("--mouse-y", `${y}%`);
      target.style.setProperty("--mouse-rx", `${rx.toFixed(2)}deg`);
      target.style.setProperty("--mouse-ry", `${ry.toFixed(2)}deg`);
    };

    const resetMouseVars = () => {
      target.style.setProperty("--mouse-x", "50%");
      target.style.setProperty("--mouse-y", "50%");
      target.style.setProperty("--mouse-rx", "0deg");
      target.style.setProperty("--mouse-ry", "0deg");
    };

    resetMouseVars();
    window.addEventListener("mousemove", updateMouseVars, { passive: true });
    window.addEventListener("mouseleave", resetMouseVars);

    return () => {
      window.removeEventListener("mousemove", updateMouseVars);
      window.removeEventListener("mouseleave", resetMouseVars);
    };
  }, []);

  const jumpTo = (id) => {
    if (!sectionIndexMap[id] && sectionIndexMap[id] !== 0) return;
    const currentIndex = sectionIndexMap[activeSection] ?? 0;
    const nextIndex = sectionIndexMap[id] ?? 0;
    setNavDirection(nextIndex >= currentIndex ? 1 : -1);
    setActiveSection(id);
  };

  const closeResumePreview = () => {
    setResumePreviewOpen(false);
    if (resumePreviewBlobUrl) {
      try {
        URL.revokeObjectURL(resumePreviewBlobUrl);
      } catch {
      }
    }
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
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const objUrl = URL.createObjectURL(pdfBlob);
      setResumePreviewBlobUrl(objUrl);
    } catch {
      setResumePreviewBlobUrl("");
    } finally {
      setResumePreviewLoading(false);
    }
  };

  const onDownloadResume = async () => {
    try {
      setDownloading(true);
      const fname = await blobDownload(resumeDownloadUrlBusted);
      localStorage.setItem("active_resume_file_name", fname);
      setResumeName(fname);
    } catch {
      try {
        window.open(resumeDownloadUrlBusted, "_blank", "noopener,noreferrer");
      } catch {
      }
    } finally {
      setDownloading(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "home":
        return (
          <MotionBox
            key="home"
            custom={navDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="portfolio-page-frame"
          >
            {/* FIXED: home-scroll-area now allows overflow-y scroll on mobile so all buttons are reachable */}
            <Box className="section-scroll-area home-scroll-area">
              <MotionBox className="portfolio-section hero-section" initial="hidden" animate="show" variants={fadeUp}>
                <Box className="hero-layout hero-layout-single">
                  <Box className="hero-left hero-left-expanded">
                    <MotionBox variants={fadeUp}>
                      <Box className="hero-name-row">
                        <MiniOrbitBadge initials={profileInitials} name={name} />
                        <Box className="hero-name-text-block">
                          <Typography className="hero-name hero-name-display">{name}</Typography>
                          <Stack spacing={0.8} className="hero-meta-stack">
                            <Typography className="hero-role-line">{title}</Typography>
                            {location ? <Typography className="hero-detail-line">📍 {location}</Typography> : null}
                            {contactEmail ? (
                              <Typography className="hero-detail-line">✉️ {contactEmail}</Typography>
                            ) : null}
                          </Stack>
                        </Box>
                      </Box>

                      <Typography className="hero-title">{tagline}</Typography>

                      <Typography className="hero-description">{about}</Typography>

                      {/* FIXED: hero action buttons — always visible, scrollable on mobile */}
                      <Stack className="hero-action-buttons" direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
                        <HeroActionButton
                          variant="contained"
                          startIcon={<MdArrowOutward />}
                          onClick={() => jumpTo("projects")}
                        >
                          View Work
                        </HeroActionButton>

                        <HeroActionButton
                          variant="outlined"
                          startIcon={<MdDownload />}
                          onClick={onDownloadResume}
                          disabled={downloading}
                        >
                          {downloading ? "Downloading..." : "Download Resume"}
                        </HeroActionButton>

                        <HeroActionButton
                          variant="outlined"
                          startIcon={<MdVisibility />}
                          onClick={onPreviewResume}
                        >
                          Preview Resume
                        </HeroActionButton>
                      </Stack>

                      {/* FIXED: social icons — always visible on mobile via scroll */}
                      <Stack className="hero-social-row" direction="row" spacing={1.2} sx={{ mt: 4, flexWrap: "wrap" }}>
                        {socials?.github ? (
                          <IconButton
                            className="hero-social-btn"
                            onClick={() =>
                              window.open(socials.github, "_blank", "noopener,noreferrer")
                            }
                          >
                            <FaGithub />
                          </IconButton>
                        ) : null}

                        {socials?.linkedin ? (
                          <IconButton
                            className="hero-social-btn"
                            onClick={() =>
                              window.open(socials.linkedin, "_blank", "noopener,noreferrer")
                            }
                          >
                            <FaLinkedin />
                          </IconButton>
                        ) : null}

                        {contactEmail ? (
                          <IconButton
                            className="hero-social-btn"
                            onClick={() =>
                              window.open(`mailto:${contactEmail}`, "_blank", "noopener,noreferrer")
                            }
                          >
                            <MdEmail />
                          </IconButton>
                        ) : null}

                        {socials?.phone ? (
                          <IconButton
                            className="hero-social-btn"
                            onClick={() =>
                              window.open(`tel:${safeString(socials.phone)}`, "_blank", "noopener,noreferrer")
                            }
                          >
                            <MdPhone />
                          </IconButton>
                        ) : null}

                        {socials?.website ? (
                          <IconButton
                            className="hero-social-btn"
                            onClick={() =>
                              window.open(safeString(socials.website), "_blank", "noopener,noreferrer")
                            }
                          >
                            <MdLink />
                          </IconButton>
                        ) : null}
                      </Stack>
                    </MotionBox>
                  </Box>
                </Box>
              </MotionBox>
            </Box>
          </MotionBox>
        );

      case "about":
        return (
          <MotionBox
            key="about"
            custom={navDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="portfolio-page-frame"
          >
            <Box className="section-scroll-area">
              <MotionBox
                className="portfolio-section section-static about-section-plain"
                variants={fadeUp}
                initial="hidden"
                animate="show"
              >
                <SectionHeading title="About" subtitle="A short introduction and profile summary." />
                {loading ? (
                  <Skeleton height={180} />
                ) : (
                  <Typography className="body-copy about-body-copy">{about}</Typography>
                )}
              </MotionBox>
            </Box>
          </MotionBox>
        );

      case "skills":
        return (
          <MotionBox
            key="skills"
            custom={navDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="portfolio-page-frame"
          >
            <Box className="section-scroll-area">
              <MotionBox className="portfolio-section section-static" variants={fadeUp} initial="hidden" animate="show">
                <SectionHeading
                  title="Skills"
                  subtitle="Tech stack grouped the same way your backend already returns it."
                />
                <GlassPanel sx={{ p: { xs: 2, md: 3 } }}>
                  {loading ? (
                    <Skeleton height={220} />
                  ) : (
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
          <MotionBox
            key="projects"
            custom={navDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="portfolio-page-frame"
          >
            <Box className="section-scroll-area">
              <MotionBox className="portfolio-section section-static" variants={fadeUp} initial="hidden" animate="show">
                <SectionHeading title="Work" subtitle="Featured projects in a modern portfolio card layout." />
                {loading ? (
                  <Stack spacing={2}>
                    <Skeleton height={220} />
                    <Skeleton height={220} />
                  </Stack>
                ) : projects.length ? (
                  <Box className="project-grid">
                    {projects.map((project, idx) => (
                      <ProjectCard key={project?.id ?? idx} project={project} />
                    ))}
                  </Box>
                ) : (
                  <GlassPanel sx={{ p: 3 }}>
                    <Typography>No projects yet. Add them in Admin → Projects.</Typography>
                  </GlassPanel>
                )}
              </MotionBox>
            </Box>
          </MotionBox>
        );

      case "experience":
        return (
          <MotionBox
            key="experience"
            custom={navDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="portfolio-page-frame"
          >
            <Box className="section-scroll-area">
              <MotionBox className="portfolio-section section-static" variants={fadeUp} initial="hidden" animate="show">
                <SectionHeading title="Experience" subtitle="Career and internship timeline." />
                <Stack spacing={2}>
                  {loading ? (
                    <Skeleton height={220} />
                  ) : experience.length ? (
                    experience.map((item, idx) => (
                      <GlassPanel key={item?.id ?? idx} sx={{ p: { xs: 2.5, md: 3 } }}>
                        <Typography className="timeline-title">
                          {safeString(item?.role) || "Role"}
                        </Typography>
                        <Typography className="timeline-subtitle">
                          {safeString(item?.company) || "Company"}
                        </Typography>
                        <Typography className="timeline-meta">
                          {safeString(item?.start)}
                          {safeString(item?.end) ? ` - ${safeString(item?.end)}` : ""}
                        </Typography>
                        {safeString(item?.description) ? (
                          <Typography className="body-copy" sx={{ mt: 1.5 }}>
                            {safeString(item?.description)}
                          </Typography>
                        ) : null}
                      </GlassPanel>
                    ))
                  ) : (
                    <GlassPanel sx={{ p: 3 }}>
                      <Typography>No experience added yet.</Typography>
                    </GlassPanel>
                  )}
                </Stack>
              </MotionBox>
            </Box>
          </MotionBox>
        );

      case "education":
        return (
          <MotionBox
            key="education"
            custom={navDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="portfolio-page-frame"
          >
            <Box className="section-scroll-area">
              <MotionBox className="portfolio-section section-static" variants={fadeUp} initial="hidden" animate="show">
                <SectionHeading title="Education" subtitle="Academic background and qualifications." />
                <Stack spacing={2}>
                  {loading ? (
                    <Skeleton height={220} />
                  ) : education.length ? (
                    education.map((item, idx) => (
                      <GlassPanel key={item?.id ?? idx} sx={{ p: { xs: 2.5, md: 3 } }}>
                        <Typography className="timeline-title">
                          {safeString(item?.degree) || "Degree"}
                        </Typography>
                        <Typography className="timeline-subtitle">
                          {safeString(item?.institution) || "Institution"}
                        </Typography>
                        <Typography className="timeline-meta">{safeString(item?.year) || ""}</Typography>
                        {safeString(item?.details) ? (
                          <Typography className="body-copy" sx={{ mt: 1.5 }}>
                            {safeString(item?.details)}
                          </Typography>
                        ) : null}
                      </GlassPanel>
                    ))
                  ) : (
                    <GlassPanel sx={{ p: 3 }}>
                      <Typography>No education added yet.</Typography>
                    </GlassPanel>
                  )}
                </Stack>
              </MotionBox>
            </Box>
          </MotionBox>
        );

      case "achievements":
        return (
          <MotionBox
            key="achievements"
            custom={navDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="portfolio-page-frame"
          >
            <Box className="section-scroll-area">
              <MotionBox className="portfolio-section section-static" variants={fadeUp} initial="hidden" animate="show">
                <SectionHeading title="Achievements" subtitle="Certifications, awards, and recognitions." />
                <Box className="achievement-grid">
                  {loading ? (
                    <Skeleton height={220} />
                  ) : achievements.length ? (
                    achievements.map((item, idx) => (
                      <GlassPanel key={item?.id ?? idx} sx={{ p: { xs: 2.5, md: 3 } }}>
                        <Typography className="timeline-title">
                          {safeString(item?.title) || "Achievement"}
                        </Typography>
                        <Typography className="timeline-subtitle">
                          {safeString(item?.issuer) || ""}
                        </Typography>
                        <Typography className="timeline-meta">
                          {safeString(item?.year) || ""}
                        </Typography>

                        {safeString(item?.link) ? (
                          <Button
                            variant="outlined"
                            startIcon={<MdLink />}
                            sx={{ mt: 2, borderRadius: 999, fontWeight: 700 }}
                            onClick={() =>
                              window.open(safeString(item?.link), "_blank", "noopener,noreferrer")
                            }
                          >
                            View
                          </Button>
                        ) : null}
                      </GlassPanel>
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

      // FIXED: Programming Languages is now its own separate page/section
      case "languages":
        return (
          <MotionBox
            key="languages"
            custom={navDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="portfolio-page-frame"
          >
            <Box className="section-scroll-area">
              <MotionBox className="portfolio-section section-static" variants={fadeUp} initial="hidden" animate="show">
                <SectionHeading title="Programming Languages" subtitle="Language proficiency and years of experience." />
                <GlassPanel sx={{ p: { xs: 2.5, md: 3.5 } }}>
                  {loading ? (
                    <Skeleton height={220} sx={{ mt: 2 }} />
                  ) : languages.length ? (
                    <Box className="lang-grid">
                      {languages.map((lang, idx) => (
                        <Box key={lang?.id ?? idx} className="language-card">
                          <Box className="language-card-head">
                            <Typography className="language-name">
                              {safeString(lang?.language) || "—"}
                            </Typography>
                          </Box>

                          <Stack spacing={1.4} sx={{ mt: 1.25 }}>
                            <LanguageLevelBar level={lang?.level} />
                            <LanguageYearsBar years={lang?.years} />
                          </Stack>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography sx={{ mt: 2 }}>No language experience added yet.</Typography>
                  )}
                </GlassPanel>
              </MotionBox>
            </Box>
          </MotionBox>
        );

      case "contact":
        return (
          <MotionBox
            key="contact"
            custom={navDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="portfolio-page-frame"
          >
            <Box className="section-scroll-area">
              <MotionBox className="portfolio-section section-static" variants={fadeUp} initial="hidden" animate="show">
                <SectionHeading title="Contact" subtitle="Let's build something great together." />

                {/* Contact details — separate full-width card */}
                <GlassPanel sx={{ p: { xs: 2.5, md: 3.5 }, mb: 3 }}>
                  <Typography className="timeline-title">Get in touch</Typography>

                  <Stack spacing={1.6} sx={{ mt: 2 }}>
                    {contactEmail ? (
                      <Typography className="contact-line">
                        <MdEmail style={{ marginRight: 10 }} />
                        {contactEmail}
                      </Typography>
                    ) : null}

                    {socials?.phone ? (
                      <Typography className="contact-line">
                        <MdPhone style={{ marginRight: 10 }} />
                        {safeString(socials.phone)}
                      </Typography>
                    ) : null}

                    {location ? (
                      <Typography className="contact-line">
                        <MdSchool style={{ marginRight: 10 }} />
                        {location}
                      </Typography>
                    ) : null}
                  </Stack>

                  <Stack direction="row" spacing={1.2} sx={{ mt: 3, flexWrap: "wrap" }}>
                    {socials?.github ? (
                      <Button
                        variant="outlined"
                        startIcon={<FaGithub />}
                        sx={{ borderRadius: 999, fontWeight: 700 }}
                        onClick={() =>
                          window.open(socials.github, "_blank", "noopener,noreferrer")
                        }
                      >
                        GitHub
                      </Button>
                    ) : null}

                    {socials?.linkedin ? (
                      <Button
                        variant="outlined"
                        startIcon={<FaLinkedin />}
                        sx={{ borderRadius: 999, fontWeight: 700 }}
                        onClick={() =>
                          window.open(socials.linkedin, "_blank", "noopener,noreferrer")
                        }
                      >
                        LinkedIn
                      </Button>
                    ) : null}

                    {socials?.website ? (
                      <Button
                        variant="outlined"
                        startIcon={<MdLink />}
                        sx={{ borderRadius: 999, fontWeight: 700 }}
                        onClick={() =>
                          window.open(safeString(socials.website), "_blank", "noopener,noreferrer")
                        }
                      >
                        Website
                      </Button>
                    ) : null}
                  </Stack>
                </GlassPanel>

                <Box className="portfolio-footer">
                  <Typography>
                    © {new Date().getFullYear()} {name}. All rights reserved.
                  </Typography>
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
    <Box
      ref={rootRef}
      className={`portfolio-root ${mode === "dark" ? "mode-dark" : "mode-light"}`}
    >
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

      <Container maxWidth="xl" className="portfolio-shell">
        <Box className="portfolio-topbar">
          <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: "auto" }}>
            <Tooltip title="Reload">
              <IconButton onClick={reload} className="topbar-icon-btn">
                <MdRefresh />
              </IconButton>
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
      </Container>

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

// Canvas-based animated network/web structure background
function NetworkCanvas({ mode }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationId;
    let nodes = [];
    const NODE_COUNT = 55;
    const MAX_DIST = 160;

    const isDark = mode === "dark";
    const nodeColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(17,24,39,0.45)";
    const lineColor = isDark ? "rgba(255,255,255,0.09)" : "rgba(17,24,39,0.08)";
    const accentNodeColor = "rgba(241,48,36,0.7)";
    const accentLineColor = isDark ? "rgba(241,48,36,0.18)" : "rgba(241,48,36,0.12)";

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initNodes = () => {
      nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.38,
        vy: (Math.random() - 0.5) * 0.38,
        r: Math.random() * 2.2 + 1.2,
        accent: i < 6,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = 1 - dist / MAX_DIST;
            const isAccent = nodes[i].accent || nodes[j].accent;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            if (isAccent) {
              ctx.strokeStyle = accentLineColor.replace("0.18", `${0.18 * alpha}`).replace("0.12", `${0.12 * alpha}`);
            } else {
              ctx.strokeStyle = lineColor.replace("0.09", `${0.09 * alpha}`).replace("0.08", `${0.08 * alpha}`);
            }
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

    resize();
    initNodes();
    draw();

    window.addEventListener("resize", () => {
      resize();
      initNodes();
    });

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.7,
      }}
    />
  );
}