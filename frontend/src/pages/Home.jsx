import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  MdArrowDownward,
  MdAdminPanelSettings,
  MdRefresh,
  MdEmail,
  MdLightMode,
  MdDarkMode,
  MdDownload,
  MdLink,
  MdWork,
  MdSchool,
  MdTimeline,
  MdEmojiEvents,
  MdCode,
  MdVisibility,
  MdPhone,
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

const BRAND_PRIMARY = "#915EFF";
const BRAND_SECONDARY = "#00CEA8";
const BRAND_TEXT = "#DFD9FF";
const BRAND_CARD = "#151030";
const BRAND_CARD_2 = "#100D25";

const revealUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const staggerWrap = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clampArray(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  return [];
}

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

function blobSafeWindowOpen(url) {
  try {
    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    window.open(url, "_blank");
  }
}

function SectionIntro({ subText, heading }) {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 2.25 }}>
      <Typography
        sx={{
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          fontSize: { xs: 11, md: 12 },
          fontWeight: 800,
          color: theme.palette.mode === "dark" ? "rgba(223,217,255,0.72)" : "rgba(77,51,130,0.70)",
        }}
      >
        {subText}
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          fontSize: { xs: 26, md: 38 },
          lineHeight: 1.08,
          fontWeight: 900,
          color: "text.primary",
        }}
      >
        {heading}
      </Typography>
    </Box>
  );
}

function GlassPanel({ children, sx }) {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        position: "relative",
        borderRadius: 4,
        overflow: "hidden",
        borderColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.08)"
            : "rgba(73,56,126,0.12)",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(21,16,48,0.92), rgba(16,13,37,0.94))"
            : "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(245,242,255,0.88))",
        backdropFilter: "blur(12px)",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 20px 60px rgba(0,0,0,0.28)"
            : "0 20px 60px rgba(73,56,126,0.10)",
        transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 24px 70px rgba(0,0,0,0.34)"
              : "0 24px 70px rgba(73,56,126,0.14)",
          borderColor:
            theme.palette.mode === "dark"
              ? "rgba(145,94,255,0.22)"
              : "rgba(145,94,255,0.20)",
        },
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

function TechBadge({ label }) {
  const theme = useTheme();

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        fontWeight: 800,
        borderRadius: 999,
        color: theme.palette.mode === "dark" ? BRAND_TEXT : "#4f3a87",
        background:
          theme.palette.mode === "dark"
            ? "rgba(145,94,255,0.14)"
            : "rgba(145,94,255,0.10)",
        border: "1px solid",
        borderColor:
          theme.palette.mode === "dark"
            ? "rgba(145,94,255,0.22)"
            : "rgba(145,94,255,0.18)",
        "& .MuiChip-label": {
          px: 1.25,
        },
      }}
    />
  );
}

function FloatingStars() {
  const dots = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        id: i,
        size: (i % 3) + 2,
        left: `${(i * 17) % 100}%`,
        top: `${(i * 29) % 100}%`,
        delay: `${(i % 8) * 0.4}s`,
        duration: `${4 + (i % 5)}s`,
        opacity: 0.25 + (i % 4) * 0.12,
      })),
    []
  );

  return (
    <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {dots.map((d) => (
        <Box
          key={d.id}
          sx={{
            position: "absolute",
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.95)",
            opacity: d.opacity,
            boxShadow: "0 0 16px rgba(255,255,255,0.55)",
            animation: `twinkle ${d.duration} ease-in-out ${d.delay} infinite`,
          }}
        />
      ))}
    </Box>
  );
}

function VerticalAccent() {
  const theme = useTheme();

  return (
    <Stack alignItems="center" spacing={1.25} sx={{ pt: 1, mr: { xs: 0.8, md: 1.6 } }}>
      <Box
        sx={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
          boxShadow: "0 0 24px rgba(145,94,255,0.45)",
        }}
      />
      <Box
        sx={{
          width: 4,
          height: { xs: 110, md: 180 },
          borderRadius: 999,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(180deg, #915EFF, rgba(145,94,255,0.08))"
              : "linear-gradient(180deg, #915EFF, rgba(145,94,255,0.10))",
        }}
      />
    </Stack>
  );
}

function InfoStat({ label, value }) {
  const theme = useTheme();

  return (
    <GlassPanel
      sx={{
        p: 1.6,
        minHeight: 92,
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(145,94,255,0.10), rgba(16,13,37,0.92))"
            : "linear-gradient(180deg, rgba(145,94,255,0.08), rgba(255,255,255,0.94))",
      }}
    >
      <Typography sx={{ fontSize: 22, fontWeight: 950, lineHeight: 1.1 }}>{value}</Typography>
      <Typography variant="body2" sx={{ opacity: 0.78, mt: 0.45 }}>
        {label}
      </Typography>
    </GlassPanel>
  );
}

function ProjectCardOneByOne({ index, p }) {
  const theme = useTheme();
  const title = safeString(p?.title) || "Untitled Project";
  const description = safeString(p?.description) || "";
  const techList = splitCSV(p?.tech);
  const repoUrl = safeString(p?.repoUrl || "");
  const liveUrl = safeString(p?.liveUrl || "");

  return (
    <MotionPaper
      variants={revealUp}
      whileHover={{ y: -8, rotateX: 2, rotateY: -2 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      variant="outlined"
      sx={{
        p: { xs: 2, md: 2.6 },
        borderRadius: 4,
        borderColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.09)"
            : "rgba(73,56,126,0.12)",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(21,16,48,0.95), rgba(16,13,37,0.98))"
            : "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(245,242,255,0.92))",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 18px 50px rgba(0,0,0,0.24)"
            : "0 18px 50px rgba(73,56,126,0.12)",
      }}
    >
      <Stack spacing={1.4}>
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              fontWeight: 950,
              fontSize: 14,
              background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
              color: "#0b0b0e",
              boxShadow: "0 10px 25px rgba(145,94,255,0.25)",
            }}
          >
            {String(index).padStart(2, "0")}
          </Box>

          <Typography sx={{ fontWeight: 950, fontSize: { xs: 18, md: 20 } }}>
            {title}
          </Typography>
        </Stack>

        {description ? (
          <Typography
            variant="body2"
            sx={{
              opacity: 0.9,
              lineHeight: 1.75,
              textAlign: "justify",
              whiteSpace: "pre-wrap",
            }}
          >
            {description}
          </Typography>
        ) : null}

        {techList.length ? (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {techList.map((item, idx) => (
              <TechBadge key={`${item}-${idx}`} label={`#${item}`} />
            ))}
          </Stack>
        ) : null}

        {(repoUrl || liveUrl) && (
          <Stack direction="row" spacing={1.1} sx={{ pt: 0.5, flexWrap: "wrap" }}>
            {repoUrl ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<MdLink />}
                onClick={() => blobSafeWindowOpen(repoUrl)}
                sx={{
                  borderRadius: 999,
                  fontWeight: 900,
                  px: 1.8,
                  color: theme.palette.mode === "dark" ? BRAND_TEXT : "#4f3a87",
                  borderColor:
                    theme.palette.mode === "dark"
                      ? "rgba(145,94,255,0.32)"
                      : "rgba(145,94,255,0.24)",
                  "&:hover": {
                    borderColor: BRAND_PRIMARY,
                    background:
                      theme.palette.mode === "dark"
                        ? "rgba(145,94,255,0.10)"
                        : "rgba(145,94,255,0.07)",
                  },
                }}
              >
                Source Code
              </Button>
            ) : null}

            {liveUrl ? (
              <Button
                variant="contained"
                size="small"
                startIcon={<MdLink />}
                onClick={() => blobSafeWindowOpen(liveUrl)}
                sx={{
                  borderRadius: 999,
                  fontWeight: 900,
                  px: 1.8,
                  background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
                  color: "#0b0b0e",
                  boxShadow: "0 12px 30px rgba(145,94,255,0.24)",
                  "&:hover": {
                    background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
                    boxShadow: "0 16px 40px rgba(145,94,255,0.30)",
                  },
                }}
              >
                Live Demo
              </Button>
            ) : null}
          </Stack>
        )}
      </Stack>
    </MotionPaper>
  );
}

async function blobDownload(url) {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error("Download failed");

  const blob = await res.blob();

  let filename = "Resume.pdf";
  const cd = res.headers.get("content-disposition") || "";
  const match =
    cd.match(/filename\*=UTF-8''([^;]+)/i) || cd.match(/filename="([^"]+)"/i) || cd.match(/filename=([^;]+)/i);

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
  const theme = useTheme();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 950 }}>{title}</DialogTitle>

      <DialogContent
        sx={{
          height: 650,
          p: 0,
          overflow: "hidden",
          background: "#000",
        }}
      >
        {loading ? (
          <Box sx={{ p: 2 }}>
            <Typography sx={{ opacity: 0.7 }}>Loading preview…</Typography>
          </Box>
        ) : src ? (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              overflowY: "scroll",
              overflowX: "hidden",
              position: "relative",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              "&::-webkit-scrollbar": {
                width: "0px",
                background: "transparent",
              },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                right: 0,
                top: 0,
                width: "14px",
                height: "100%",
                background: theme.palette.mode === "dark" ? "#000" : "#fff",
                zIndex: 10,
                pointerEvents: "none",
              }}
            />
            <iframe
              title="Resume Preview"
              src={src}
              style={{
                width: "100%",
                height: "200%",
                border: "none",
                display: "block",
                overflow: "hidden",
              }}
            />
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography sx={{ opacity: 0.7 }}>Preview not available.</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size="small"
          sx={{
            borderRadius: 999,
            fontWeight: 950,
            borderColor: "rgba(145,94,255,0.45)",
            color: BRAND_PRIMARY,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TimelineCard({ title, subtitle, description }) {
  const theme = useTheme();

  return (
    <MotionPaper
      variants={revealUp}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 4,
        borderColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.08)"
            : "rgba(73,56,126,0.12)",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(21,16,48,0.95), rgba(16,13,37,0.98))"
            : "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(245,242,255,0.91))",
      }}
    >
      <Typography sx={{ fontWeight: 900, fontSize: { xs: 16, md: 18 } }}>{title}</Typography>
      {subtitle ? (
        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.35 }}>
          {subtitle}
        </Typography>
      ) : null}
      {description ? (
        <Typography
          variant="body2"
          sx={{ mt: 1.1, opacity: 0.92, lineHeight: 1.7, whiteSpace: "pre-wrap", textAlign: "justify" }}
        >
          {description}
        </Typography>
      ) : null}
    </MotionPaper>
  );
}

export default function Home({ toggleTheme }) {
  useEffect(() => {
    document.title = "Gnanaseelan Portfolio";
  }, []);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

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

  const mode = theme.palette.mode;

  const name = safeString(profile?.name) || "Your Name";
  const title = safeString(profile?.title) || "Full Stack Developer";
  const tagline = safeString(profile?.tagline) || "I build modern, scalable, and user-focused digital experiences.";
  const about = safeString(profile?.about) || "";
  const location = safeString(profile?.location) || "";
  const emailPublic = safeString(profile?.emailPublic) || "";

  const frontendList = splitCSV(skills?.frontend);
  const backendList = splitCSV(skills?.backend);
  const databaseList = splitCSV(skills?.database);
  const toolsList = splitCSV(skills?.tools);

  const contactEmail = useMemo(() => {
    const ep = safeString(emailPublic).trim();
    if (ep) return ep;
    const se = safeString(socials?.email).trim();
    if (se) return se;
    return "";
  }, [emailPublic, socials?.email]);

  const reload = () => setReloadTick((x) => x + 1);

  const contentVersion = useMemo(() => localStorage.getItem("content_version") || "0", [reloadTick]);
  const resumeDownloadBase = useMemo(() => downloadResumeUrl(), []);
  const resumeDownloadUrlBusted = useMemo(() => {
    const joiner = resumeDownloadBase.includes("?") ? "&" : "?";
    return `${resumeDownloadBase}${joiner}v=${encodeURIComponent(contentVersion)}&t=${Date.now()}`;
  }, [resumeDownloadBase, contentVersion]);

  const resumeViewBase = useMemo(() => viewResumeUrl(), []);
  const resumeViewUrlBusted = useMemo(() => {
    const joiner = resumeViewBase.includes("?") ? "&" : "?";
    return `${resumeViewBase}${joiner}v=${encodeURIComponent(contentVersion)}&t=${Date.now()}`;
  }, [resumeViewBase, contentVersion]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);

        const [profRes, skillsRes, projRes, expRes, eduRes, socRes, achRes, langRes] = await Promise.all([
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

        setProfile(profRes?.data || {});
        setSkills(skillsRes?.data || {});
        setProjects(Array.isArray(projRes?.data) ? projRes.data : []);
        setExperience(Array.isArray(expRes?.data) ? expRes.data : []);
        setEducation(Array.isArray(eduRes?.data) ? eduRes.data : []);
        setSocials(socRes?.data || {});
        setAchievements(Array.isArray(achRes?.data) ? achRes.data : []);
        setLanguages(Array.isArray(langRes?.data) ? langRes.data : []);

        const localName =
          localStorage.getItem("active_resume_file_name") || localStorage.getItem("resume_file_name") || "";
        if (localName) setResumeName(localName);
        else setResumeName(`${name.replace(/\s+/g, "_")}_Resume.pdf`);
      } catch {
        // keep UI clean
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [reloadTick, name]);

  useEffect(() => {
    const sync = () => {
      reload();
    };

    const onStorage = (e) => {
      if (!e) return;
      if (e.key === "content_version" || e.key === "active_resume_file_name" || e.key === "resume_file_name") {
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

  const skillCategoryRows = useMemo(() => {
    const s = skills || {};
    const frontend = splitCSV(s.frontend).join(", ");
    const backend = splitCSV(s.backend).join(", ");
    const database = splitCSV(s.database).join(", ");
    const tools = splitCSV(s.tools).join(", ");

    return [
      { category: "Frontend", value: frontend || "—" },
      { category: "Backend", value: backend || "—" },
      { category: "Database", value: database || "—" },
      { category: "Tools", value: tools || "—" },
    ];
  }, [skills]);

  const onDownloadResume = async () => {
    try {
      setDownloading(true);
      const fname = await blobDownload(resumeDownloadUrlBusted);
      localStorage.setItem("active_resume_file_name", fname);
      setResumeName(fname);
    } catch {
      try {
        blobSafeWindowOpen(resumeDownloadUrlBusted);
      } catch {
        // ignore
      }
    } finally {
      setDownloading(false);
    }
  };

  const closeResumePreview = () => {
    setResumePreviewOpen(false);
    if (resumePreviewBlobUrl) {
      try {
        URL.revokeObjectURL(resumePreviewBlobUrl);
      } catch {
        // ignore
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

  const pageBg = useMemo(() => {
    return mode === "dark"
      ? `
        radial-gradient(circle at 12% 12%, rgba(145,94,255,0.18), transparent 28%),
        radial-gradient(circle at 88% 18%, rgba(0,206,168,0.12), transparent 24%),
        radial-gradient(circle at 50% 80%, rgba(145,94,255,0.10), transparent 26%),
        linear-gradient(180deg, #050816 0%, #0b1026 45%, #050816 100%)
      `
      : `
        radial-gradient(circle at 12% 12%, rgba(145,94,255,0.12), transparent 28%),
        radial-gradient(circle at 88% 18%, rgba(0,206,168,0.10), transparent 24%),
        radial-gradient(circle at 50% 82%, rgba(145,94,255,0.08), transparent 26%),
        linear-gradient(180deg, #f6f4ff 0%, #f3f7ff 48%, #f8f6ff 100%)
      `;
  }, [mode]);

  const heroRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const mxSpring = useSpring(mx, { stiffness: 180, damping: 20, mass: 0.4 });
  const mySpring = useSpring(my, { stiffness: 180, damping: 20, mass: 0.4 });
  const rotateY = useTransform(mxSpring, [-0.5, 0.5], [-5, 5]);
  const rotateX = useTransform(mySpring, [-0.5, 0.5], [5, -5]);

  const onHeroMove = (e) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    mx.set(Math.max(-0.5, Math.min(0.5, dx)));
    my.set(Math.max(-0.5, Math.min(0.5, dy)));
  };

  const onHeroLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const socialsButtons = [
    {
      show: !!socials?.github,
      label: "GitHub",
      icon: <FaGithub />,
      action: () => blobSafeWindowOpen(socials.github),
    },
    {
      show: !!socials?.linkedin,
      label: "LinkedIn",
      icon: <FaLinkedin />,
      action: () => blobSafeWindowOpen(socials.linkedin),
    },
    {
      show: !!contactEmail,
      label: "Email",
      icon: <MdEmail />,
      action: () => blobSafeWindowOpen(`mailto:${contactEmail}`),
    },
    {
      show: !!socials?.website,
      label: "Website",
      icon: <MdLink />,
      action: () => blobSafeWindowOpen(socials.website),
    },
    {
      show: !!socials?.phone,
      label: "Phone",
      icon: <MdPhone />,
      action: () => blobSafeWindowOpen(`tel:${safeString(socials.phone)}`),
    },
  ];

  const summaryStats = [
    { label: "Projects", value: projects.length || "00" },
    { label: "Skills Groups", value: skillCategoryRows.filter((x) => x.value !== "—").length || "00" },
    { label: "Achievements", value: achievements.length || "00" },
    { label: "Experience Entries", value: experience.length || "00" },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        overflowX: "hidden",
        background: pageBg,
        position: "relative",
      }}
    >
      <FloatingStars />

      <Box
        sx={{
          position: "absolute",
          top: -120,
          left: -120,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "rgba(145,94,255,0.18)",
          filter: "blur(90px)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          right: -120,
          top: 80,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "rgba(0,206,168,0.12)",
          filter: "blur(90px)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", py: { xs: 3, md: 4.5 } }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: { xs: 2.5, md: 3.5 } }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Avatar
              sx={{
                width: 48,
                height: 48,
                fontWeight: 950,
                background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
                color: "#0b0b0e",
                boxShadow: "0 10px 30px rgba(145,94,255,0.26)",
              }}
            >
              {(safeString(profile?.initials) || name || "Y").slice(0, 2).toUpperCase()}
            </Avatar>

            <Box>
              <Typography sx={{ fontWeight: 950, fontSize: 16 }}>{name}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {title}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Reload Data">
              <IconButton
                onClick={reload}
                size="small"
                sx={{
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor:
                    mode === "dark" ? "rgba(255,255,255,0.10)" : "rgba(73,56,126,0.12)",
                  background:
                    mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.80)",
                  "&:hover": {
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <MdRefresh />
              </IconButton>
            </Tooltip>

            <Tooltip title={mode === "dark" ? "Light Theme" : "Dark Theme"}>
              <IconButton
                onClick={toggleTheme}
                size="small"
                sx={{
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor:
                    mode === "dark" ? "rgba(255,255,255,0.10)" : "rgba(73,56,126,0.12)",
                  background:
                    mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.80)",
                  "&:hover": {
                    transform: "translateY(-2px)",
                  },
                }}
              >
                {mode === "dark" ? <MdLightMode /> : <MdDarkMode />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Go to Admin">
              <IconButton
                onClick={() => navigate("/admin")}
                size="small"
                sx={{
                  borderRadius: 3,
                  color: BRAND_PRIMARY,
                  border: "1px solid rgba(145,94,255,0.24)",
                  background: "rgba(145,94,255,0.08)",
                  "&:hover": {
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <MdAdminPanelSettings />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Grid container spacing={{ xs: 2.5, md: 3.5 }} alignItems="stretch">
          <Grid item xs={12}>
            <MotionPaper
              ref={heroRef}
              onMouseMove={onHeroMove}
              onMouseLeave={onHeroLeave}
              initial="hidden"
              animate="visible"
              variants={staggerWrap}
              style={{
                transformStyle: "preserve-3d",
                rotateX,
                rotateY,
              }}
              sx={{
                borderRadius: 5,
                position: "relative",
                overflow: "hidden",
                border: "1px solid",
                borderColor:
                  mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(73,56,126,0.12)",
                background:
                  mode === "dark"
                    ? "linear-gradient(180deg, rgba(21,16,48,0.96), rgba(10,12,32,0.96))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(243,239,255,0.90))",
                boxShadow:
                  mode === "dark"
                    ? "0 28px 80px rgba(0,0,0,0.30)"
                    : "0 28px 80px rgba(73,56,126,0.12)",
                p: { xs: 2.2, md: 3.4 },
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background:
                    mode === "dark"
                      ? "radial-gradient(circle at 80% 20%, rgba(145,94,255,0.20), transparent 30%), radial-gradient(circle at 15% 18%, rgba(0,206,168,0.12), transparent 24%)"
                      : "radial-gradient(circle at 80% 20%, rgba(145,94,255,0.14), transparent 30%), radial-gradient(circle at 15% 18%, rgba(0,206,168,0.10), transparent 24%)",
                }}
              />

              <Grid container spacing={{ xs: 2.2, md: 3.2 }} alignItems="center">
                <Grid item xs={12} md={7}>
                  <Stack direction="row" alignItems="flex-start">
                    <VerticalAccent />
                    <Box sx={{ pt: 0.15 }}>
                      <MotionBox variants={revealUp}>
                        <Typography
                          sx={{
                            textTransform: "uppercase",
                            letterSpacing: "0.18em",
                            fontSize: { xs: 11, md: 12 },
                            fontWeight: 800,
                            color:
                              mode === "dark"
                                ? "rgba(223,217,255,0.74)"
                                : "rgba(79,58,135,0.74)",
                          }}
                        >
                          Introduction
                        </Typography>
                      </MotionBox>

                      <MotionBox variants={revealUp}>
                        <Typography
                          sx={{
                            mt: 0.5,
                            fontWeight: 950,
                            lineHeight: 1.08,
                            fontSize: { xs: 30, sm: 40, md: 58 },
                          }}
                        >
                          Hi, I’m{" "}
                          <Box component="span" sx={{ color: BRAND_PRIMARY }}>
                            {name}
                          </Box>
                        </Typography>
                      </MotionBox>

                      <MotionBox variants={revealUp}>
                        <Typography
                          sx={{
                            mt: 1.2,
                            fontSize: { xs: 15, md: 18 },
                            lineHeight: 1.8,
                            maxWidth: 760,
                            opacity: 0.92,
                          }}
                        >
                          {tagline}
                        </Typography>
                      </MotionBox>

                      <MotionBox variants={revealUp}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          sx={{ mt: 2.1, opacity: 0.88 }}
                        >
                          {location ? (
                            <Chip
                              label={`📍 ${location}`}
                              sx={{ borderRadius: 999, fontWeight: 800, width: "fit-content" }}
                            />
                          ) : null}
                          {contactEmail ? (
                            <Chip
                              label={`✉️ ${contactEmail}`}
                              sx={{ borderRadius: 999, fontWeight: 800, width: "fit-content" }}
                            />
                          ) : null}
                        </Stack>
                      </MotionBox>

                      <MotionBox variants={revealUp}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1.2}
                          sx={{ mt: 2.4 }}
                        >
                          <Button
                            onClick={() => scrollToId("about")}
                            variant="contained"
                            startIcon={<MdArrowDownward />}
                            fullWidth={isMobile}
                            sx={{
                              borderRadius: 999,
                              fontWeight: 950,
                              px: 2.4,
                              py: 1.2,
                              background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
                              color: "#0b0b0e",
                              boxShadow: "0 14px 34px rgba(145,94,255,0.24)",
                              "&:hover": {
                                background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
                                boxShadow: "0 18px 40px rgba(145,94,255,0.30)",
                              },
                            }}
                          >
                            Explore Portfolio
                          </Button>

                          <Button
                            onClick={onPreviewResume}
                            variant="outlined"
                            startIcon={<MdVisibility />}
                            fullWidth={isMobile}
                            sx={{
                              borderRadius: 999,
                              fontWeight: 950,
                              px: 2.4,
                              py: 1.2,
                              color: mode === "dark" ? BRAND_TEXT : "#4f3a87",
                              borderColor:
                                mode === "dark"
                                  ? "rgba(145,94,255,0.30)"
                                  : "rgba(145,94,255,0.24)",
                              "&:hover": {
                                borderColor: BRAND_PRIMARY,
                                background:
                                  mode === "dark"
                                    ? "rgba(145,94,255,0.10)"
                                    : "rgba(145,94,255,0.06)",
                              },
                            }}
                          >
                            Preview Resume
                          </Button>

                          <Button
                            onClick={onDownloadResume}
                            variant="outlined"
                            startIcon={<MdDownload />}
                            disabled={downloading}
                            fullWidth={isMobile}
                            sx={{
                              borderRadius: 999,
                              fontWeight: 950,
                              px: 2.4,
                              py: 1.2,
                              color: mode === "dark" ? BRAND_TEXT : "#4f3a87",
                              borderColor:
                                mode === "dark"
                                  ? "rgba(145,94,255,0.30)"
                                  : "rgba(145,94,255,0.24)",
                              "&:hover": {
                                borderColor: BRAND_PRIMARY,
                                background:
                                  mode === "dark"
                                    ? "rgba(145,94,255,0.10)"
                                    : "rgba(145,94,255,0.06)",
                              },
                            }}
                          >
                            {downloading ? "Downloading…" : `Download Resume`}
                          </Button>
                        </Stack>
                      </MotionBox>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={5}>
                  <MotionBox variants={revealUp}>
                    <GlassPanel
                      sx={{
                        p: { xs: 2, md: 2.25 },
                        minHeight: { xs: "auto", md: 320 },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 13,
                          textTransform: "uppercase",
                          letterSpacing: "0.16em",
                          fontWeight: 800,
                          opacity: 0.74,
                        }}
                      >
                        Connect
                      </Typography>

                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.4 }}>
                        {socialsButtons
                          .filter((item) => item.show)
                          .map((item, idx) => (
                            <Tooltip key={`${item.label}-${idx}`} title={item.label}>
                              <IconButton
                                onClick={item.action}
                                sx={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 3,
                                  background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
                                  color: "#0b0b0e",
                                  boxShadow: "0 10px 25px rgba(145,94,255,0.22)",
                                  "&:hover": {
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 16px 34px rgba(145,94,255,0.28)",
                                  },
                                }}
                              >
                                {item.icon}
                              </IconButton>
                            </Tooltip>
                          ))}
                      </Stack>

                      <Grid container spacing={1.2} sx={{ mt: 1.2 }}>
                        {summaryStats.map((item, idx) => (
                          <Grid item xs={6} key={`${item.label}-${idx}`}>
                            <InfoStat label={item.label} value={item.value} />
                          </Grid>
                        ))}
                      </Grid>

                      <Box
                        sx={{
                          mt: 1.8,
                          borderRadius: 4,
                          p: 1.6,
                          border: "1px solid",
                          borderColor:
                            mode === "dark"
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(73,56,126,0.12)",
                          background:
                            mode === "dark"
                              ? "rgba(255,255,255,0.02)"
                              : "rgba(255,255,255,0.60)",
                        }}
                      >
                        <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                          Current Role Focus
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.65, opacity: 0.86, lineHeight: 1.7 }}>
                          {title}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.55, opacity: 0.8, lineHeight: 1.7 }}>
                          {safeString(profile?.tagline) || "Building polished user experiences with scalable logic and clean engineering."}
                        </Typography>
                      </Box>
                    </GlassPanel>
                  </MotionBox>
                </Grid>
              </Grid>
            </MotionPaper>
          </Grid>
        </Grid>

        <Box sx={{ mt: { xs: 4, md: 6 } }}>
          <MotionBox
            id="about"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.18 }}
            variants={revealUp}
            transition={{ duration: 0.45 }}
          >
            <SectionIntro subText="Introduction" heading="Overview." />
            <GlassPanel sx={{ p: { xs: 2, md: 3 } }}>
              {loading ? (
                <Skeleton height={160} />
              ) : (
                <Typography
                  sx={{
                    lineHeight: 1.9,
                    textAlign: "justify",
                    opacity: 0.92,
                    whiteSpace: "pre-wrap",
                    fontSize: { xs: 14.5, md: 16 },
                  }}
                >
                  {about || "—"}
                </Typography>
              )}
            </GlassPanel>
          </MotionBox>

          <MotionBox
            id="skills"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.16 }}
            variants={revealUp}
            transition={{ duration: 0.45 }}
            sx={{ mt: { xs: 4, md: 6 } }}
          >
            <SectionIntro subText="What I work with" heading="Tech Stack." />
            <Grid container spacing={2}>
              <Grid item xs={12} md={7}>
                <GlassPanel sx={{ p: { xs: 2, md: 3 }, height: "100%" }}>
                  {loading ? (
                    <Skeleton height={200} />
                  ) : (
                    <>
                      <TableContainer sx={{ overflowX: "hidden" }}>
                        <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 950, width: "30%" }}>Category</TableCell>
                              <TableCell sx={{ fontWeight: 950, width: "70%" }}>Skills</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {skillCategoryRows.map((r, idx) => (
                              <TableRow
                                key={idx}
                                hover
                                sx={{
                                  transition: "transform 140ms ease",
                                  "&:hover": { transform: "translateX(2px)" },
                                }}
                              >
                                <TableCell sx={{ fontWeight: 900, opacity: 0.9 }}>{r.category}</TableCell>
                                <TableCell sx={{ opacity: 0.9 }}>{r.value}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                </GlassPanel>
              </Grid>

              <Grid item xs={12} md={5}>
                <GlassPanel sx={{ p: { xs: 2, md: 3 }, height: "100%" }}>
                  {loading ? (
                    <Skeleton height={200} />
                  ) : (
                    <Stack spacing={2}>
                      <Box>
                        <Typography sx={{ fontWeight: 900, mb: 1 }}>Frontend</Typography>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          {frontendList.length ? frontendList.map((x, i) => <TechBadge key={`${x}-${i}`} label={x} />) : <Typography variant="body2">—</Typography>}
                        </Stack>
                      </Box>

                      <Box>
                        <Typography sx={{ fontWeight: 900, mb: 1 }}>Backend</Typography>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          {backendList.length ? backendList.map((x, i) => <TechBadge key={`${x}-${i}`} label={x} />) : <Typography variant="body2">—</Typography>}
                        </Stack>
                      </Box>

                      <Box>
                        <Typography sx={{ fontWeight: 900, mb: 1 }}>Database & Tools</Typography>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          {[...databaseList, ...toolsList].length ? [...databaseList, ...toolsList].map((x, i) => <TechBadge key={`${x}-${i}`} label={x} />) : <Typography variant="body2">—</Typography>}
                        </Stack>
                      </Box>
                    </Stack>
                  )}
                </GlassPanel>
              </Grid>
            </Grid>
          </MotionBox>

          <MotionBox
            id="projects"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={staggerWrap}
            sx={{ mt: { xs: 4, md: 6 } }}
          >
            <SectionIntro subText="My work" heading="Projects." />
            <GlassPanel sx={{ p: { xs: 2, md: 3 } }}>
              {loading ? (
                <Stack spacing={2}>
                  <Skeleton height={140} />
                  <Skeleton height={140} />
                </Stack>
              ) : projects.length ? (
                <Stack spacing={2}>
                  {projects.map((p, idx) => (
                    <ProjectCardOneByOne key={p?.id ?? idx} index={idx + 1} p={p} />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  No projects yet. Add them in Admin → Projects.
                </Typography>
              )}
            </GlassPanel>
          </MotionBox>

          <MotionBox
            id="achievements"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={staggerWrap}
            sx={{ mt: { xs: 4, md: 6 } }}
          >
            <SectionIntro subText="Recognition" heading="Achievements." />
            <GlassPanel sx={{ p: { xs: 2, md: 3 } }}>
              {loading ? (
                <Skeleton height={160} />
              ) : achievements.length ? (
                <Stack spacing={1.4}>
                  {achievements.map((a, idx) => (
                    <TimelineCard
                      key={a?.id ?? idx}
                      title={safeString(a?.title) || "Achievement"}
                      subtitle={`${safeString(a?.issuer) ? `${safeString(a?.issuer)}${safeString(a?.year) ? " • " : ""}` : ""}${safeString(a?.year) || ""}`}
                      description={
                        safeString(a?.link)
                          ? `Verification / reference link available below.`
                          : ""
                      }
                    />
                  ))}
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {achievements.map((a, idx) =>
                      safeString(a?.link) ? (
                        <Button
                          key={`ach-link-${idx}`}
                          onClick={() => blobSafeWindowOpen(safeString(a?.link))}
                          size="small"
                          variant="outlined"
                          startIcon={<MdLink />}
                          sx={{
                            borderRadius: 999,
                            fontWeight: 900,
                            borderColor: "rgba(145,94,255,0.30)",
                            color: mode === "dark" ? BRAND_TEXT : "#4f3a87",
                          }}
                        >
                          {safeString(a?.title) || `Achievement ${idx + 1}`}
                        </Button>
                      ) : null
                    )}
                  </Stack>
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  No achievements yet.
                </Typography>
              )}
            </GlassPanel>
          </MotionBox>

          <MotionBox
            id="experience"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={staggerWrap}
            sx={{ mt: { xs: 4, md: 6 } }}
          >
            <SectionIntro subText="Where I’ve worked" heading="Experience." />
            <GlassPanel sx={{ p: { xs: 2, md: 3 } }}>
              {loading ? (
                <Skeleton height={180} />
              ) : experience.length ? (
                <Stack spacing={1.4}>
                  {experience.map((e, idx) => (
                    <TimelineCard
                      key={e?.id ?? idx}
                      title={`${safeString(e?.role) || "Role"}${safeString(e?.company) ? ` • ${safeString(e?.company)}` : ""}`}
                      subtitle={`${safeString(e?.start)}${safeString(e?.end) ? ` – ${safeString(e?.end)}` : ""}`}
                      description={safeString(e?.description)}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  No experience added yet.
                </Typography>
              )}
            </GlassPanel>
          </MotionBox>

          <MotionBox
            id="education"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={staggerWrap}
            sx={{ mt: { xs: 4, md: 6 } }}
          >
            <SectionIntro subText="Learning path" heading="Education." />
            <GlassPanel sx={{ p: { xs: 2, md: 3 } }}>
              {loading ? (
                <Skeleton height={160} />
              ) : education.length ? (
                <Stack spacing={1.4}>
                  {education.map((e, idx) => (
                    <TimelineCard
                      key={e?.id ?? idx}
                      title={safeString(e?.degree) || "Degree"}
                      subtitle={`${safeString(e?.institution) ? `${safeString(e?.institution)}${safeString(e?.year) ? " • " : ""}` : ""}${safeString(e?.year) || ""}`}
                      description={safeString(e?.details)}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  No education added yet.
                </Typography>
              )}
            </GlassPanel>
          </MotionBox>

          <MotionBox
            id="languages"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={revealUp}
            transition={{ duration: 0.45 }}
            sx={{ mt: { xs: 4, md: 6 } }}
          >
            <SectionIntro subText="Language proficiency" heading="Programming Languages Experience." />
            <GlassPanel sx={{ p: { xs: 2, md: 3 } }}>
              {loading ? (
                <Skeleton height={140} />
              ) : languages.length ? (
                <TableContainer sx={{ overflowX: "hidden" }}>
                  <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 950, width: "34%" }}>Language</TableCell>
                        <TableCell sx={{ fontWeight: 950, width: "33%" }}>Level</TableCell>
                        <TableCell sx={{ fontWeight: 950, width: "33%" }}>Experience</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {languages.map((l, idx) => (
                        <TableRow
                          key={l?.id ?? idx}
                          hover
                          sx={{
                            transition: "transform 140ms ease",
                            "&:hover": { transform: "translateX(2px)" },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 900, opacity: 0.9 }}>
                            {safeString(l?.language) || "—"}
                          </TableCell>
                          <TableCell sx={{ opacity: 0.88 }}>{safeString(l?.level) || "—"}</TableCell>
                          <TableCell sx={{ opacity: 0.88 }}>
                            {typeof l?.years === "number" ? `${l.years} yr` : safeString(l?.years) || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  No language experience added yet.
                </Typography>
              )}
            </GlassPanel>
          </MotionBox>

          <MotionBox
            id="contact"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={revealUp}
            transition={{ duration: 0.45 }}
            sx={{ mt: { xs: 4, md: 6 }, pb: 6 }}
          >
            <SectionIntro subText="Get in touch" heading="Contact." />
            <GlassPanel sx={{ p: { xs: 2, md: 3 } }}>
              {loading ? (
                <Skeleton height={140} />
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={7}>
                    <Stack spacing={1.35}>
                      {contactEmail ? (
                        <Typography
                          sx={{
                            opacity: 0.92,
                            cursor: "pointer",
                            lineHeight: 1.8,
                            "&:hover": { color: BRAND_PRIMARY },
                          }}
                          onClick={() => blobSafeWindowOpen(`mailto:${contactEmail}`)}
                        >
                          <MdEmail style={{ marginRight: 8, verticalAlign: "middle" }} />
                          {contactEmail}
                        </Typography>
                      ) : null}

                      {socials?.phone ? (
                        <Typography
                          sx={{
                            opacity: 0.92,
                            cursor: "pointer",
                            lineHeight: 1.8,
                            "&:hover": { color: BRAND_PRIMARY },
                          }}
                          onClick={() => blobSafeWindowOpen(`tel:${safeString(socials.phone)}`)}
                        >
                          <MdPhone style={{ marginRight: 8, verticalAlign: "middle" }} />
                          {safeString(socials.phone)}
                        </Typography>
                      ) : null}

                      {location ? (
                        <Typography sx={{ opacity: 0.86, lineHeight: 1.8 }}>
                          📍 {location}
                        </Typography>
                      ) : null}

                      <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.3, lineHeight: 1.8 }}>
                        I’m open to software engineering, full-stack, backend, frontend, and product-focused development opportunities.
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} md={5}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                      {socials?.github ? (
                        <Button
                          onClick={() => blobSafeWindowOpen(socials.github)}
                          variant="contained"
                          startIcon={<FaGithub />}
                          sx={{
                            borderRadius: 999,
                            fontWeight: 950,
                            background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
                            color: "#0b0b0e",
                          }}
                        >
                          GitHub
                        </Button>
                      ) : null}

                      {socials?.linkedin ? (
                        <Button
                          onClick={() => blobSafeWindowOpen(socials.linkedin)}
                          variant="outlined"
                          startIcon={<FaLinkedin />}
                          sx={{
                            borderRadius: 999,
                            fontWeight: 950,
                            color: mode === "dark" ? BRAND_TEXT : "#4f3a87",
                            borderColor: "rgba(145,94,255,0.30)",
                          }}
                        >
                          LinkedIn
                        </Button>
                      ) : null}

                      {socials?.website ? (
                        <Button
                          onClick={() => blobSafeWindowOpen(socials.website)}
                          variant="outlined"
                          startIcon={<MdLink />}
                          sx={{
                            borderRadius: 999,
                            fontWeight: 950,
                            color: mode === "dark" ? BRAND_TEXT : "#4f3a87",
                            borderColor: "rgba(145,94,255,0.30)",
                          }}
                        >
                          Website
                        </Button>
                      ) : null}
                    </Stack>
                  </Grid>
                </Grid>
              )}
            </GlassPanel>
          </MotionBox>
        </Box>

        <ResumePreviewDialog
          open={resumePreviewOpen}
          title={resumePreviewTitle}
          onClose={closeResumePreview}
          url={resumeViewUrlBusted}
          blobUrl={resumePreviewBlobUrl}
          loading={resumePreviewLoading}
        />
      </Container>
    </Box>
  );
}