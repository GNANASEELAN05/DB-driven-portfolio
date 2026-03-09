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

function VerticalNav({ items, activeId, onJump }) {
  return (
    <Box className="portfolio-side-nav">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            className={`portfolio-side-nav-item ${activeId === item.id ? "active" : ""}`}
            onClick={() => onJump(item.id)}
            aria-label={item.label}
            title={item.label}
          >
            <span className="icon-wrap">
              <Icon />
            </span>
            <span className="label">{item.label}</span>
          </button>
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
      <Typography className="section-kicker">{title}</Typography>
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

function MiniOrbitBadge({ name }) {

  const initial = name ? name.charAt(0).toUpperCase() : "P";

  return (
    <Box className="hero-name-spinner-badge">
      <svg viewBox="0 0 120 120">

        <circle cx="60" cy="60" r="42"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2"
          fill="transparent"
        />

        <text
          x="60"
          y="70"
          textAnchor="middle"
          fontSize="32"
          fill="#f13024"
          fontWeight="700"
        >
          {initial}
        </text>

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

  const sectionIds = useMemo(
    () => [
      { id: "home", label: "Home", icon: MdHome },
      { id: "about", label: "About", icon: MdPerson },
      { id: "skills", label: "Skills", icon: MdCode },
      { id: "projects", label: "Work", icon: MdWork },
      { id: "experience", label: "Experience", icon: MdTimeline },
      { id: "education", label: "Education", icon: MdSchool },
      { id: "achievements", label: "Achievements", icon: MdEmojiEvents },
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
            <Box className="section-scroll-area home-scroll-area">
              <MotionBox className="portfolio-section hero-section" initial="hidden" animate="show" variants={fadeUp}>
                <Box className="hero-layout hero-layout-single">
                  <Box className="hero-left hero-left-expanded">
                    <MotionBox variants={fadeUp}>
                      <Box className="hero-name-row">
                        <MiniOrbitBadge />
                        <Typography className="hero-name">{name}</Typography>
                      </Box>

                      <Stack spacing={0.8} className="hero-meta-stack">
                        <Typography className="hero-role-line">{title}</Typography>
                        {location ? <Typography className="hero-detail-line">📍 {location}</Typography> : null}
                        {contactEmail ? (
                          <Typography className="hero-detail-line">✉️ {contactEmail}</Typography>
                        ) : null}
                      </Stack>

                      <Typography className="hero-title">{tagline}</Typography>

                      <Typography className="hero-description">{about}</Typography>

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
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

                      <Stack direction="row" spacing={1.2} sx={{ mt: 4, flexWrap: "wrap" }}>
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
                <SectionHeading title="Contact" subtitle="Let’s build something great together." />

                <Box className="contact-grid">
                  <GlassPanel sx={{ p: { xs: 2.5, md: 3.5 } }}>
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

                  <GlassPanel sx={{ p: { xs: 2.5, md: 3.5 } }}>
                    <Typography className="timeline-title">Programming Languages</Typography>

                    {loading ? (
                      <Skeleton height={220} sx={{ mt: 2 }} />
                    ) : languages.length ? (
                      <Stack spacing={2} sx={{ mt: 2 }}>
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
                      </Stack>
                    ) : (
                      <Typography sx={{ mt: 2 }}>No language experience added yet.</Typography>
                    )}
                  </GlassPanel>
                </Box>

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