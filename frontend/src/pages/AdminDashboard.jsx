// src/pages/AdminDashboard.jsx
import React, { useState } from "react";
import TextareaAutosize from "@mui/material/TextareaAutosize";

import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Alert,
  FormControl,
  InputLabel,
} from "@mui/material";

import {
  MdMenu,
  MdDashboard,
  MdWork,
  MdDescription,
  MdLightMode,
  MdDarkMode,
  MdAdd,
  MdEdit,
  MdDelete,
  MdLogout,
  MdSave,
  MdUpload,
  MdEmojiEvents,
  MdCode,
  MdLink,
  MdPerson,
  MdBuild,
  MdRefresh,
  MdVisibility,
  MdArrowUpward,
  MdMoreHoriz,
  MdStar,
  MdClose,
  MdSchool,
  MdBadge,
} from "react-icons/md";

import {
  getAllProjectsAdmin,
  createProject,
  updateProject,
  deleteProject,
  getProfile,
  updateProfile,
  getSkills,
  updateSkills,
  getSocials,
  updateSocials,
  getAchievements,
  saveAchievements,
  getLanguageExperience,
  saveLanguageExperience,
  uploadResume,
  viewResumeUrl,
  listResumesAdmin,
  deleteResumeById,
  setPrimaryResume,
  viewResumeByIdUrl,
  getEducation,
  updateEducation,
  getExperience,
  updateExperience,
} from "../api/portfolio";

import http from "../api/http";

const drawerWidth = 280;

const BRAND_PRIMARY = "#c680f2";
const BRAND_DARK = "#7A3F91";

const bumpContentVersion = () => {
  localStorage.setItem("content_version", String(Date.now()));
};

const formatDate = (iso) => {
  try {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
};

const tfSx = {
  "& .MuiInputLabel-root": { transformOrigin: "top left" },
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.2,
    minHeight: 44,
    alignItems: "center",
    background: (t) =>
      t.palette.mode === "dark"
        ? "rgba(255,255,255,0.04)"
        : "rgba(198,128,242,0.06)",
    "& .MuiOutlinedInput-input": {
      boxSizing: "border-box",
      padding: "12px 14px",
      lineHeight: 1.35,
      fontSize: "14px",
    },
    "& .MuiOutlinedInput-inputMultiline": {
      boxSizing: "border-box",
      padding: "12px 14px",
      lineHeight: 1.45,
      fontSize: "14px",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: (t) =>
        t.palette.mode === "dark"
          ? "rgba(255,255,255,0.12)"
          : "rgba(0,0,0,0.14)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_PRIMARY },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: BRAND_PRIMARY,
      borderWidth: 2,
    },
  },
};

function SmallTextField(props) {
  const { value, label, multiline, minRows, ...rest } = props;
  const v = value ?? "";
  const shrink = Boolean(String(v).length);

  return (
    <TextField
      {...rest}
      label={label}
      value={v}
      fullWidth
      size="small"
      variant="outlined"
      multiline={multiline}
      minRows={minRows}
      InputLabelProps={{ shrink, ...(props.InputLabelProps || {}) }}
      sx={{
        ...tfSx,
        ...(multiline ? { "& .MuiOutlinedInput-root": { alignItems: "flex-start" } } : null),
        ...(props.sx || {}),
      }}
    />
  );
}

function StatCard({ title, value, subtitle, icon, trendLabel }) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: (t) => `1px solid ${t.palette.divider}`,
        position: "relative",
        overflow: "hidden",
        background: (t) =>
          t.palette.mode === "dark"
            ? "rgba(255,255,255,0.02)"
            : "linear-gradient(135deg, rgba(198,128,242,0.10), rgba(122,63,145,0.05))",
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.4,
              display: "grid",
              placeItems: "center",
              background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
              color: "#fff",
              flex: "0 0 auto",
            }}
          >
            {icon}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
              {trendLabel ? (
                <Chip
                  size="small"
                  label={trendLabel}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 950,
                    bgcolor: "rgba(122,63,145,0.14)",
                  }}
                />
              ) : null}
            </Stack>

            <Typography sx={{ fontSize: 22, fontWeight: 950, lineHeight: 1.1 }}>
              {value}
            </Typography>
            {subtitle ? (
              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, subtitle, right }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.2}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", sm: "center" }}
      sx={{ mb: 2 }}
    >
      <Box>
        <Typography sx={{ fontWeight: 950, fontSize: 20 }}>{title}</Typography>
        {subtitle ? (
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {right ? <Box sx={{ display: "flex", justifyContent: "flex-end" }}>{right}</Box> : null}
    </Stack>
  );
}

function SimpleItemDialog({ open, title, children, onClose, onSave, saveText = "Save" }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 950 }}>{title}</DialogTitle>
      <DialogContent sx={{ pt: 1.5 }}>{children}</DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size="small"
          startIcon={<MdClose />}
          sx={{
            borderRadius: 999,
            fontWeight: 950,
            borderColor: "rgba(122,63,145,0.55)",
            color: BRAND_PRIMARY,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          size="small"
          startIcon={<MdSave />}
          sx={{
            borderRadius: 999,
            fontWeight: 950,
            background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
          }}
        >
          {saveText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ConfirmDialog({ open, title, description, confirmText, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 950 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ opacity: 0.85 }}>
          {description}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size="small"
          sx={{
            borderRadius: 999,
            fontWeight: 950,
            borderColor: "rgba(122,63,145,0.55)",
            color: BRAND_PRIMARY,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          size="small"
          sx={{ fontWeight: 950, borderRadius: 999 }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ProjectEditorDialog({ open, mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(
    initial || {
      title: "",
      description: "",
      tech: "",
      liveUrl: "",
      repoUrl: "",
      featured: true,
    }
  );

  React.useEffect(() => {
    setForm(
      initial || {
        title: "",
        description: "",
        tech: "",
        liveUrl: "",
        repoUrl: "",
        featured: true,
      }
    );
  }, [initial, open]);

  const handleChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const canSave = form.title.trim().length >= 2;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 950 }}>
        {mode === "edit" ? "Edit Project" : "Add Project"}
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <SmallTextField
              label="Project Title"
              value={form.title}
              onChange={handleChange("title")}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <SmallTextField
              label="Tech Stack (comma separated)"
              value={form.tech}
              onChange={handleChange("tech")}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <SmallTextField
              label="Repo URL"
              value={form.repoUrl}
              onChange={handleChange("repoUrl")}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <SmallTextField
              label="Live URL"
              value={form.liveUrl}
              onChange={handleChange("liveUrl")}
            />
          </Grid>

          <Grid item xs={12} sx={{ width: "100%" }}>
  <SmallTextField
    label="Description"
    value={form.description || ""}
    onChange={handleChange("description")}
    fullWidth
    multiline
    InputProps={{
      inputComponent: TextareaAutosize,
      inputProps: { minRows: 2 },
    }}
    sx={{
      width: "100%",
      "& .MuiInputBase-root": {
        width: "100%",
        alignItems: "flex-start",
      },
      "& textarea": {
        width: "100%",
        boxSizing: "border-box",
        resize: "none",
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word",
      },
    }}
  />
</Grid>


          <Grid item xs={12}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={form.featured ? "Featured: YES" : "Featured: NO"}
                sx={{
                  borderRadius: 2,
                  fontWeight: 900,
                  bgcolor: form.featured ? "rgba(122,63,145,0.14)" : undefined,
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => setForm((p) => ({ ...p, featured: !p.featured }))}
                sx={{
                  borderRadius: 999,
                  fontWeight: 950,
                  borderColor: "rgba(122,63,145,0.55)",
                  color: BRAND_PRIMARY,
                }}
              >
                Toggle Featured
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size="small"
          startIcon={<MdClose />}
          sx={{
            borderRadius: 999,
            fontWeight: 950,
            borderColor: "rgba(122,63,145,0.55)",
            color: BRAND_PRIMARY,
          }}
        >
          Cancel
        </Button>
        <Button
          disabled={!canSave}
          onClick={() => onSave(form)}
          variant="contained"
          size="small"
          startIcon={<MdSave />}
          sx={{
            borderRadius: 999,
            fontWeight: 950,
            background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
          }}
        >
          {mode === "edit" ? "Save Changes" : "Add Project"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ResumePreviewDialog({ open, title, onClose, url, blobUrl, loading }) {
  const src = blobUrl || url;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 950 }}>{title}</DialogTitle>

      {/* 🔥 COMPLETE SCROLLBAR REMOVAL */}
      <DialogContent
        sx={{
          height: 650,
          p: 0,
          overflow: "hidden",
          background: (t)=> t.palette.mode==="dark" ? "#000" : "#fff",
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

              /* 🔥 hide scrollbar */
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              "&::-webkit-scrollbar": {
                width: "0px",
                background: "transparent",
              },
            }}
          >
            {/* 🔥 mask right side → removes chrome pdf scrollbar visually */}
            <Box
              sx={{
                position: "absolute",
                right: 0,
                top: 0,
                width: "16px",
                height: "100%",
                background: (t)=> t.palette.mode==="dark" ? "#000" : "#fff",
                zIndex: 5,
                pointerEvents: "none",
              }}
            />

            <iframe
              title="Resume Preview"
              src={src}
              style={{
                width: "100%",
                height: "200%",   // important
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
          startIcon={<MdClose />}
          sx={{
            borderRadius: 999,
            fontWeight: 950,
            borderColor: "rgba(122,63,145,0.55)",
            color: "#c680f2",
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
export default function AdminDashboard(props) {
  // ⭐ change browser tab name (ADMIN DASHBOARD)
React.useEffect(() => {
  document.title = "Gnanaseelan Admin Panel";  // change name if you want
}, []);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("dashboard");

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  

  const [profile, setProfile] = useState({
    name: "",
    title: "",
    tagline: "",
    location: "",
    emailPublic: "",
    initials: "",
    about: "",
  });

  const [skills, setSkills] = useState({
    frontend: "",
    backend: "",
    database: "",
    tools: "",
  });
  // ===== SKILL TABLE SYSTEM =====
const [skillCategory, setSkillCategory] = useState("frontend");
const [skillInput, setSkillInput] = useState("");
const [skillTable, setSkillTable] = useState([]);
const [editIndex, setEditIndex] = useState(null);
const [editValue, setEditValue] = useState("");


  const [projects, setProjects] = useState([]);
  const [socials, setSocials] = useState({
    github: "",
    linkedin: "",
    email: "",
    phone: "",
    website: "",
  });

  const [achievements, setAchievements] = useState([]);
  const [languages, setLanguages] = useState([]);

  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);

  const [projDlgOpen, setProjDlgOpen] = useState(false);
  const [projDlgMode, setProjDlgMode] = useState("add");
  const [projDlgInitial, setProjDlgInitial] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState({
    title: "",
    description: "",
    confirmText: "",
    onConfirm: null,
  });

  const [achDlgOpen, setAchDlgOpen] = useState(false);
  const [achEditingId, setAchEditingId] = useState(null);
  const [achForm, setAchForm] = useState({ title: "", issuer: "", year: "", link: "" });

  const [langDlgOpen, setLangDlgOpen] = useState(false);
  const [langEditingId, setLangEditingId] = useState(null);
  const [langForm, setLangForm] = useState({ language: "", level: "Beginner", years: 1, notes: "" });

  const [eduDlgOpen, setEduDlgOpen] = useState(false);
  const [eduEditingId, setEduEditingId] = useState(null);
  const [eduForm, setEduForm] = useState({ degree: "", institution: "", year: "", details: "" });

  const [expDlgOpen, setExpDlgOpen] = useState(false);
  const [expEditingId, setExpEditingId] = useState(null);
  const [expForm, setExpForm] = useState({ company: "", role: "", start: "", end: "", description: "" });

  const [resumes, setResumes] = useState([]);
  const [resumeMenuAnchor, setResumeMenuAnchor] = useState(null);
  const [resumeMenuItem, setResumeMenuItem] = useState(null);
  const [resumePreviewOpen, setResumePreviewOpen] = useState(false);
  const [resumePreviewTitle, setResumePreviewTitle] = useState("");
  const [resumePreviewBlobUrl, setResumePreviewBlobUrl] = useState("");
  const [resumePreviewLoading, setResumePreviewLoading] = useState(false);

  const handleDrawerToggle = () => setMobileOpen((p) => !p);

  const fetchAllAdmin = async () => {
    try {
      setErr("");
      setOk("");
      setLoading(true);

      const [p, s, pr, so, a, l, edu, exp] = await Promise.all([
        getProfile(),
        getSkills(),
        getAllProjectsAdmin(),
        getSocials(),
        getAchievements(),
        getLanguageExperience(),
        getEducation(),
        getExperience(),
      ]);

      setProfile(p?.data || {});
      setSkills(s?.data || {});
      // convert DB csv → table
const table = [];
const data = s?.data || {};

["frontend","backend","database","tools"].forEach(cat=>{
  if(data[cat]){
    data[cat].split(",").forEach(sk=>{
      if(sk.trim()){
        table.push({category:cat,name:sk.trim()});
      }
    });
  }
});

setSkillTable(table);

      setProjects(pr?.data || []);
      setSocials(so?.data || {});
      setAchievements(Array.isArray(a?.data) ? a.data : []);
      setLanguages(Array.isArray(l?.data) ? l.data : []);
      setEducation(Array.isArray(edu?.data) ? edu.data : []);
      setExperience(Array.isArray(exp?.data) ? exp.data : []);

      try {
        const r = await listResumesAdmin();
        if (r?.data && Array.isArray(r.data)) setResumes(r.data);
      } catch {}

      setOk("Admin data loaded from DB.");
    } catch {
      setErr("Failed to load Admin data. Check backend is running + token + CORS.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAllAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => {
    if (typeof props?.setDarkMode === "function") {
      props.setDarkMode((p) => !p);
      return;
    }
    const next = theme.palette.mode !== "dark";
    localStorage.setItem("admin_pref_dark", next ? "1" : "0");
    setOk("Theme toggle clicked. (Wire setDarkMode from App.jsx to apply instantly)");
  };

  const [pushDialog, setPushDialog] = useState({ open: false, name: "" });

const handlePushResume = async (r) => {
  await pushResumeToViewer(r);
  setPushDialog({ open: true, name: r.fileName || "Resume.pdf" });
};

  const saveProfileNow = async () => {
    try {
      setErr("");
      setOk("");
      setLoading(true);
      await updateProfile(profile);
      setOk("Profile saved to DB.");
      bumpContentVersion();
    } catch {
      setErr("Saving profile failed.");
    } finally {
      setLoading(false);
    }
  };

  const saveSkillsNow = async () => {
  try {
    setErr("");
    setOk("");
    setLoading(true);

    const payload = {
      frontend: skillTable.filter(s=>s.category==="frontend").map(s=>s.name).join(","),
      backend: skillTable.filter(s=>s.category==="backend").map(s=>s.name).join(","),
      database: skillTable.filter(s=>s.category==="database").map(s=>s.name).join(","),
      tools: skillTable.filter(s=>s.category==="tools").map(s=>s.name).join(","),
    };

    await updateSkills(payload);

    setOk("Skills saved to database successfully");
    bumpContentVersion();
  } catch (e) {
    console.error(e);
    setErr("Skills save failed");
  } finally {
    setLoading(false);
  }
};
const addSkill = () => {
  if (!skillInput.trim()) return;
  setSkillTable(p => [...p, { category: skillCategory, name: skillInput.trim() }]);
  setSkillInput("");
};

const deleteSkill = (index) => {
  setSkillTable(p => p.filter((_, i) => i !== index));
};

const startEditSkill = (i) => {
  setEditIndex(i);
  setEditValue(skillTable[i].name);
};

const saveEditSkill = (i) => {
  setSkillTable(p =>
    p.map((x, idx) => (idx === i ? { ...x, name: editValue } : x))
  );
  setEditIndex(null);
};


  const saveSocialsNow = async () => {
    try {
      setErr("");
      setOk("");
      setLoading(true);
      await updateSocials(socials);
      setOk("Contact / Links saved to DB.");
      bumpContentVersion();
    } catch {
      setErr("Saving socials failed.");
    } finally {
      setLoading(false);
    }
  };

  const openAddProject = () => {
    setProjDlgMode("add");
    setProjDlgInitial(null);
    setProjDlgOpen(true);
  };

  const openEditProject = (proj) => {
    setProjDlgMode("edit");
    setProjDlgInitial(proj);
    setProjDlgOpen(true);
  };

  const onSaveProjectDialog = async (form) => {
    try {
      setErr("");
      setOk("");
      setLoading(true);

      if (projDlgMode === "edit" && projDlgInitial?.id) {
        await updateProject(projDlgInitial.id, form);
        setOk("Project updated.");
      } else {
        await createProject(form);
        setOk("Project added.");
      }

      setProjDlgOpen(false);
      await fetchAllAdmin();
      bumpContentVersion();
    } catch {
      setErr("Project save failed.");
    } finally {
      setLoading(false);
    }
  };

  const askDeleteProject = (proj) => {
    setConfirmPayload({
      title: "Delete Project?",
      description: `This will permanently delete "${proj.title}".`,
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          setConfirmOpen(false);
          setErr("");
          setOk("");
          setLoading(true);
          await deleteProject(proj.id);
          setOk("Project deleted.");
          await fetchAllAdmin();
          bumpContentVersion();
        } catch {
          setErr("Delete failed.");
        } finally {
          setLoading(false);
        }
      },
    });
    setConfirmOpen(true);
  };

  // ===== ACHIEVEMENTS =====
  const openAchAdd = () => {
    setAchEditingId(null);
    setAchForm({ title: "", issuer: "", year: "", link: "" });
    setAchDlgOpen(true);
  };

  const openAchEdit = (a) => {
    setAchEditingId(a.id);
    setAchForm({
      title: a.title || "",
      issuer: a.issuer || "",
      year: a.year || "",
      link: a.link || "",
    });
    setAchDlgOpen(true);
  };

  const deleteAchLocal = (id) => setAchievements((p) => p.filter((x) => x.id !== id));

  const saveAchLocal = () => {
    if (achEditingId) {
      setAchievements((p) => p.map((x) => (x.id === achEditingId ? { ...x, ...achForm } : x)));
    } else {
      setAchievements((p) => [{ ...achForm, id: Date.now() }, ...p]);
    }
    setAchDlgOpen(false);
  };

  const persistAchievements = async () => {
    try {
      setErr("");
      setOk("");
      setLoading(true);
      await saveAchievements(achievements.map(({ id, ...rest }) => rest));
      setOk("Achievements saved to DB.");
      await fetchAllAdmin();
      bumpContentVersion();
    } catch {
      setErr("Saving achievements failed.");
    } finally {
      setLoading(false);
    }
  };

  // ===== LANGUAGES =====
  const openLangAdd = () => {
    setLangEditingId(null);
    setLangForm({ language: "", level: "Beginner", years: 1, notes: "" });
    setLangDlgOpen(true);
  };

  const openLangEdit = (l) => {
    setLangEditingId(l.id);
    setLangForm({
      language: l.language || l.name || "",
      level: l.level || "Beginner",
      years: Number(l.years || 1),
      notes: l.notes || "",
    });
    setLangDlgOpen(true);
  };

  const deleteLangLocal = (id) => setLanguages((p) => p.filter((x) => x.id !== id));

  const saveLangLocal = () => {
    if (langEditingId) {
      setLanguages((p) => p.map((x) => (x.id === langEditingId ? { ...x, ...langForm } : x)));
    } else {
      setLanguages((p) => [{ ...langForm, id: Date.now() }, ...p]);
    }
    setLangDlgOpen(false);
  };

  const persistLanguages = async () => {
    try {
      setErr("");
      setOk("");
      setLoading(true);

      const payload = languages.map((l) => ({
        language: l.language || l.name || "",
        level: l.level || "Beginner",
        years: String(l.years ?? 1),
        notes: l.notes || "",
      }));

      await saveLanguageExperience(payload);
      setOk("Languages experience saved to DB.");
      await fetchAllAdmin();
      bumpContentVersion();
    } catch {
      setErr("Saving language experience failed.");
    } finally {
      setLoading(false);
    }
  };

  // ===== EDUCATION =====
  const openEduAdd = () => {
    setEduEditingId(null);
    setEduForm({ degree: "", institution: "", year: "", details: "" });
    setEduDlgOpen(true);
  };

  const openEduEdit = (e) => {
    setEduEditingId(e.id);
    setEduForm({
      degree: e.degree || "",
      institution: e.institution || "",
      year: e.year || "",
      details: e.details || "",
    });
    setEduDlgOpen(true);
  };

  // ✅ FIX: real DB delete (tries DELETE endpoint first, falls back to PUT replace)
  const deleteEduLocal = async (id) => {
    const prev = education;
    const next = prev.filter((x) => x.id !== id);
    setEducation(next);

    try {
      setErr("");
      setOk("");
      setLoading(true);

      let deleted = false;

      // 1) Try backend delete-by-id endpoint if present
      try {
        await http.delete(`/api/portfolio/education/${id}`);
        deleted = true;
      } catch {}

      // 2) Fallback: PUT full list replace
      if (!deleted) {
        const payload = next.map(({ id: _id, ...rest }) => rest);
        await updateEducation(payload);
      }

      setOk("Education deleted.");
      await fetchAllAdmin();
      bumpContentVersion();
    } catch {
      setErr("Deleting education failed. Check backend auth + endpoints.");
      setEducation(prev);
    } finally {
      setLoading(false);
    }
  };

  const saveEduLocal = () => {
    if (eduEditingId) setEducation((p) => p.map((x) => (x.id === eduEditingId ? { ...x, ...eduForm } : x)));
    else setEducation((p) => [{ ...eduForm, id: Date.now() }, ...p]);
    setEduDlgOpen(false);
  };

  const persistEducation = async () => {
    try {
      setErr("");
      setOk("");
      setLoading(true);
      const payload = education.map(({ id, ...rest }) => rest);
      await updateEducation(payload);
      setOk("Education saved to DB.");
      await fetchAllAdmin();
      bumpContentVersion();
    } catch {
      setErr("Saving education failed. Ensure backend has PUT /api/portfolio/education and ADMIN token works.");
    } finally {
      setLoading(false);
    }
  };

  // ===== EXPERIENCE =====
  const openExpAdd = () => {
    setExpEditingId(null);
    setExpForm({ company: "", role: "", start: "", end: "", description: "" });
    setExpDlgOpen(true);
  };

  const openExpEdit = (e) => {
    setExpEditingId(e.id);
    setExpForm({
      company: e.company || "",
      role: e.role || "",
      start: e.start || "",
      end: e.end || "",
      description: e.description || "",
    });
    setExpDlgOpen(true);
  };

  // ✅ FIX: real DB delete (tries DELETE endpoint first, falls back to PUT replace)
  const deleteExpLocal = async (id) => {
    const prev = experience;
    const next = prev.filter((x) => x.id !== id);
    setExperience(next);

    try {
      setErr("");
      setOk("");
      setLoading(true);

      let deleted = false;

      try {
        await http.delete(`/api/portfolio/experience/${id}`);
        deleted = true;
      } catch {}

      if (!deleted) {
        const payload = next.map(({ id: _id, ...rest }) => rest);
        await updateExperience(payload);
      }

      setOk("Experience deleted.");
      await fetchAllAdmin();
      bumpContentVersion();
    } catch {
      setErr("Deleting experience failed. Check backend auth + endpoints.");
      setExperience(prev);
    } finally {
      setLoading(false);
    }
  };

  const saveExpLocal = () => {
    if (expEditingId) setExperience((p) => p.map((x) => (x.id === expEditingId ? { ...x, ...expForm } : x)));
    else setExperience((p) => [{ ...expForm, id: Date.now() }, ...p]);
    setExpDlgOpen(false);
  };

  const persistExperience = async () => {
    try {
      setErr("");
      setOk("");
      setLoading(true);
      const payload = experience.map(({ id, ...rest }) => rest);
      await updateExperience(payload);
      setOk("Experience saved to DB.");
      await fetchAllAdmin();
      bumpContentVersion();
    } catch {
      setErr("Saving experience failed. Ensure backend has PUT /api/portfolio/experience and ADMIN token works.");
    } finally {
      setLoading(false);
    }
  };

  // ===== RESUME =====
  const onUploadResume = async (file) => {
    try {
      setErr("");
      setOk("");
      setLoading(true);

      await uploadResume(file);

      const r = await listResumesAdmin();
      if (r?.data && Array.isArray(r.data)) setResumes(r.data);

      setOk("Resume uploaded.");
      bumpContentVersion();
    } catch {
      setErr("Resume upload failed. Check multipart + ADMIN auth.");
    } finally {
      setLoading(false);
    }
  };

  const openResumePreviewInline = async (title, directUrl) => {
    try {
      setResumePreviewTitle(title || "Resume Preview");
      setResumePreviewLoading(true);
      setResumePreviewOpen(true);

      const res = await http.get(directUrl, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const objUrl = URL.createObjectURL(blob);
      setResumePreviewBlobUrl(objUrl);
    } catch {
      setResumePreviewBlobUrl("");
    } finally {
      setResumePreviewLoading(false);
    }
  };

  const closeResumePreview = () => {
    setResumePreviewOpen(false);
    if (resumePreviewBlobUrl) {
      try {
        URL.revokeObjectURL(resumePreviewBlobUrl);
      } catch {}
    }
    setResumePreviewBlobUrl("");
  };

  const previewCurrentResumeInline = async () => {
    await openResumePreviewInline("Current Resume", viewResumeUrl());
  };

  // ✅ FIX: this is the REAL “push to viewer”: set primary in DB
  const pushResumeToViewer = async (item) => {
    try {
      if (!item?.id) return;

      setErr("");
      setOk("");
      setLoading(true);

      await setPrimaryResume(item.id);

      setOk(`Pushed to Viewer: ${item.fileName || "Resume"}`);
      await fetchAllAdmin();
      bumpContentVersion();
    } catch {
      setErr("Failed to push resume to Viewer. Check PUT /api/resume/{id}/primary + token.");
    } finally {
      setLoading(false);
    }
  };

  const openResumeMenu = (e, item) => {
    setResumeMenuAnchor(e.currentTarget);
    setResumeMenuItem(item);
  };

  const closeResumeMenu = () => {
    setResumeMenuAnchor(null);
    setResumeMenuItem(null);
  };

  const previewSelectedResumeInline = async () => {
    const item = resumeMenuItem;
    closeResumeMenu();
    if (!item?.id) return;
    await openResumePreviewInline(item.fileName || "Resume", viewResumeByIdUrl(item.id));
  };

  const makePrimaryResume = async () => {
    const item = resumeMenuItem;
    closeResumeMenu();
    if (!item?.id) return;

    try {
      setErr("");
      setOk("");
      setLoading(true);
      await setPrimaryResume(item.id);
      setOk("Primary resume set.");
      await fetchAllAdmin();
      bumpContentVersion();
    } catch {
      setErr("Failed to set primary. Check backend endpoint + token.");
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = async () => {
    const item = resumeMenuItem;
    closeResumeMenu();
    if (!item?.id) return;

    try {
      setErr("");
      setOk("");
      setLoading(true);

      await deleteResumeById(item.id);

      setOk("Resume deleted.");
      await fetchAllAdmin();
      bumpContentVersion();
    } catch {
      setErr("Failed to delete resume. Check DELETE /api/resume/{id} + token.");
    } finally {
      setLoading(false);
    }
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ gap: 1 }}>
        <Avatar sx={{ bgcolor: BRAND_DARK, fontWeight: 950 }}>A</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>Admin</Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Portfolio Manager
          </Typography>
        </Box>
      </Toolbar>

      <Divider />

      <List sx={{ px: 1.2, py: 1 }}>
        {[
          { id: "dashboard", label: "Dashboard", icon: <MdDashboard /> },
          { id: "about", label: "About Me", icon: <MdPerson /> },
          { id: "skills", label: "Skills", icon: <MdBuild /> },
          { id: "projects", label: "Projects", icon: <MdWork /> },
          { id: "achievements", label: "Achievements", icon: <MdEmojiEvents /> },
          { id: "languages", label: "Languages Exp", icon: <MdCode /> },
          { id: "education", label: "Education", icon: <MdSchool /> },
          { id: "experience", label: "Experience", icon: <MdBadge /> },
          { id: "contact", label: "Contact / Links", icon: <MdLink /> },
          { id: "resume", label: "Resume", icon: <MdDescription /> },
        ].map((it) => (
          <ListItemButton
            key={it.id}
            selected={active === it.id}
            onClick={() => {
              setActive(it.id);
              setMobileOpen(false);
            }}
            sx={{
              mb: 0.7,
              borderRadius: 3,
              "&.Mui-selected": {
                background: `linear-gradient(135deg, rgba(198,128,242,0.16), rgba(122,63,145,0.10))`,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38 }}>{it.icon}</ListItemIcon>
            <ListItemText primary={it.label} primaryTypographyProps={{ fontWeight: 900 }} />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ mt: "auto", p: 1.2 }}>
        <Button
          fullWidth
          variant="contained"
          color="error"
          startIcon={<MdLogout />}
          sx={{ borderRadius: 999, fontWeight: 950 }}
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/admin-login";
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
          bgcolor: (t) => (t.palette.mode === "dark" ? "background.paper" : "rgba(255,255,255,0.85)"),
          backdropFilter: (t) => (t.palette.mode === "dark" ? "none" : "blur(10px)"),
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 0.5, display: { md: "none" } }}
          >
            <MdMenu />
          </IconButton>

          <Typography sx={{ fontWeight: 950, flexGrow: 1 }}>
            {active === "dashboard"
              ? "Dashboard"
              : active === "about"
              ? "About Me"
              : active === "skills"
              ? "Skills"
              : active === "projects"
              ? "Projects"
              : active === "achievements"
              ? "Achievements"
              : active === "languages"
              ? "Languages Experience"
              : active === "education"
              ? "Education"
              : active === "experience"
              ? "Experience"
              : active === "contact"
              ? "Contact / Links"
              : active === "resume"
              ? "Resume"
              : "Admin"}
          </Typography>

          {/* ✅ NEW: Eye icon to open Viewer page */}
          <Tooltip title="View Portfolio">
            <IconButton
              onClick={() => window.open("/", "_blank")}
              color="inherit"
            >
              <MdVisibility />
            </IconButton>
          </Tooltip>

          <Tooltip title={theme.palette.mode === "dark" ? "Switch to Light" : "Switch to Dark"}>
            <IconButton onClick={toggleTheme} color="inherit">
              {theme.palette.mode === "dark" ? <MdLightMode /> : <MdDarkMode />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Reload">
            <IconButton onClick={fetchAllAdmin} color="inherit">
              <MdRefresh />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: drawerWidth, borderRight: 0 },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: (t) => `1px solid ${t.palette.divider}`,
              background: (t) =>
                t.palette.mode === "dark"
                  ? "rgba(255,255,255,0.01)"
                  : "linear-gradient(180deg, rgba(198,128,242,0.10), rgba(255,255,255,0) 60%)",
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          pb: 6,
          background: (t) =>
            t.palette.mode === "dark"
              ? "transparent"
              : "linear-gradient(180deg, rgba(198,128,242,0.10), rgba(255,255,255,0) 65%)",
        }}
      >
        <Toolbar />

        <Container maxWidth="xl" sx={{ py: 3 }}>
          {ok ? <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert> : null}
          {err ? <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert> : null}

          {/* DASHBOARD */}
          {active === "dashboard" ? (
            <Box>
              <SectionHeader
                title="Overview"
                subtitle="Quick counts (DB-backed)"
                right={
                  <Button
                    variant="outlined"
                    startIcon={<MdRefresh />}
                    onClick={fetchAllAdmin}
                    size="small"
                    sx={{
                      borderRadius: 999,
                      fontWeight: 950,
                      borderColor: "rgba(122,63,145,0.55)",
                      color: BRAND_PRIMARY,
                    }}
                    fullWidth={isMobile}
                  >
                    Reload
                  </Button>
                }
              />

              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <StatCard title="Projects" value={projects.length} subtitle="Featured + all" trendLabel="DB" icon={<MdWork />} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <StatCard
                    title="Skills"
                    value={
                      Array.isArray(skills.frontend)
                        ? skills.frontend.length
                        : String(skills.frontend || "").split(",").filter(Boolean).length
                    }
                    subtitle="Frontend tags"
                    trendLabel="DB"
                    icon={<MdBuild />}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <StatCard title="Achievements" value={achievements.length} subtitle="Awards + certs" trendLabel="DB" icon={<MdEmojiEvents />} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <StatCard title="Resumes" value={resumes.length} subtitle="Uploaded" trendLabel="DB" icon={<MdDescription />} />
                </Grid>
              </Grid>
            </Box>
          ) : null}

          {/* ABOUT */}
          {active === "about" ? (
            <Box>
              <SectionHeader
                title="About Me (Profile)"
                subtitle="Edit here → updates DB → shows in Viewer"
                right={
                  <Button
                    variant="contained"
                    startIcon={<MdSave />}
                    onClick={saveProfileNow}
                    size="small"
                    sx={{
                      borderRadius: 999,
                      fontWeight: 950,
                      background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
                    }}
                    fullWidth={isMobile}
                  >
                    Save Profile
                  </Button>
                }
              />

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, width: "100%" }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <SmallTextField
                      label="Name"
                      value={profile.name || ""}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField
                      label="Title"
                      value={profile.title || ""}
                      onChange={(e) => setProfile((p) => ({ ...p, title: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField
                      label="Tagline"
                      value={profile.tagline || ""}
                      onChange={(e) => setProfile((p) => ({ ...p, tagline: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField
                      label="Location"
                      value={profile.location || ""}
                      onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField
                      label="Public Email"
                      value={profile.emailPublic || ""}
                      onChange={(e) => setProfile((p) => ({ ...p, emailPublic: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField
                      label="Initials"
                      value={profile.initials || ""}
                      onChange={(e) => setProfile((p) => ({ ...p, initials: e.target.value }))}
                    />
                  </Grid>

                  <Grid item xs={12} sx={{ width: "100%" }}>
  <SmallTextField
    label="About"
    value={profile.about || ""}
    onChange={(e) =>
      setProfile((p) => ({ ...p, about: e.target.value }))
    }
    fullWidth
    multiline
    InputProps={{
      inputComponent: TextareaAutosize,
      inputProps: { minRows: 2 }, // 🔥 start small
    }}
    sx={{
      width: "100%",

      "& .MuiInputBase-root": {
        width: "100%",
        alignItems: "flex-start",
      },

      "& textarea": {
        width: "100%",
        boxSizing: "border-box",
        resize: "none",
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word",
      },
    }}
  />
</Grid>

                </Grid>
              </Paper>
            </Box>
          ) : null}

          {/* SKILLS */}
{active === "skills" ? (
  <Box>
    <SectionHeader
      title="Skills Manager"
      subtitle="Add → Edit → Delete → Save to DB"
      right={
        <Button
          variant="contained"
          startIcon={<MdSave />}
          onClick={saveSkillsNow}
          size="small"
          sx={{
            borderRadius: 999,
            fontWeight: 950,
            background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
          }}
          fullWidth={isMobile}
        >
          Save Skills
        </Button>
      }
    />

    {/* ADD */}
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={skillCategory}
              label="Category"
              onChange={(e)=>setSkillCategory(e.target.value)}
            >
              <MenuItem value="frontend">Frontend</MenuItem>
              <MenuItem value="backend">Backend</MenuItem>
              <MenuItem value="database">Database</MenuItem>
              <MenuItem value="tools">Tools</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <SmallTextField
            label="Skill name"
            value={skillInput}
            onChange={(e)=>setSkillInput(e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<MdAdd />}
            onClick={addSkill}
            sx={{
              height:"100%",
              borderRadius:999,
              fontWeight:900,
              background:`linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
            }}
          >
            Add
          </Button>
        </Grid>
      </Grid>
    </Paper>

    {/* TABLE */}
    <Paper variant="outlined" sx={{ borderRadius:3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{fontWeight:900}}>Category</TableCell>
            <TableCell sx={{fontWeight:900}}>Skill</TableCell>
            <TableCell sx={{fontWeight:900}} width={120}>Action</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {skillTable.length===0 && (
            <TableRow>
              <TableCell colSpan={3}>
                <Typography sx={{opacity:.6}}>No skills added</Typography>
              </TableCell>
            </TableRow>
          )}

          {skillTable.map((s,i)=>(
  <TableRow
    key={i}
    sx={{
      "& td": { borderBottom: "none" }
    }}
  >
    <TableCell sx={{fontWeight:900,textTransform:"capitalize"}}>
      {s.category}
    </TableCell>

    <TableCell>
      {editIndex===i ? (
        <SmallTextField
          value={editValue}
          onChange={(e)=>setEditValue(e.target.value)}
        />
      ) : s.name}
    </TableCell>

    <TableCell>
      {editIndex===i ? (
        <IconButton color="success" onClick={()=>saveEditSkill(i)}>
          <MdSave/>
        </IconButton>
      ) : (
        <IconButton onClick={()=>startEditSkill(i)}>
          <MdEdit/>
        </IconButton>
      )}

      <IconButton color="error" onClick={()=>deleteSkill(i)}>
        <MdDelete/>
      </IconButton>
    </TableCell>
  </TableRow>
))}

        </TableBody>
      </Table>
    </Paper>
  </Box>
) : null}


          {/* PROJECTS */}
          {active === "projects" ? (
            <Box>
              <SectionHeader
                title="Projects Manager"
                subtitle="Add / edit / delete projects shown on Viewer"
                right={
                  <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
                    <Button
                      variant="outlined"
                      startIcon={<MdAdd />}
                      onClick={openAddProject}
                      size="small"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 950,
                        borderColor: "rgba(122,63,145,0.55)",
                        color: BRAND_PRIMARY,
                      }}
                      fullWidth={isMobile}
                    >
                      Add
                    </Button>
                  </Stack>
                }
              />

              <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 950 }}>Title</TableCell>
                        <TableCell sx={{ fontWeight: 950 }}>Tech</TableCell>
                        <TableCell sx={{ fontWeight: 950 }}>Featured</TableCell>
                        <TableCell sx={{ fontWeight: 950, width: 140 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {projects.map((p) => (
                        <TableRow key={p.id} hover>
                          <TableCell sx={{ fontWeight: 950 }}>{p.title}</TableCell>
                          <TableCell sx={{ opacity: 0.85 }}>{p.tech}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={p.featured ? "YES" : "NO"}
                              sx={{
                                borderRadius: 2,
                                fontWeight: 900,
                                bgcolor: p.featured ? "rgba(122,63,145,0.14)" : undefined,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.8}>
                              <IconButton size="small" onClick={() => openEditProject(p)}>
                                <MdEdit />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => askDeleteProject(p)}>
                                <MdDelete />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {projects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <Typography sx={{ opacity: 0.7 }}>No projects yet.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <ProjectEditorDialog
                open={projDlgOpen}
                mode={projDlgMode}
                initial={projDlgInitial}
                onClose={() => setProjDlgOpen(false)}
                onSave={onSaveProjectDialog}
              />
            </Box>
          ) : null}

          {/* ACHIEVEMENTS */}
          {active === "achievements" ? (
            <Box>
              <SectionHeader
                title="Achievements"
                subtitle="Add / edit / delete then Save to DB"
                right={
                  <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
                    <Button
                      variant="outlined"
                      startIcon={<MdAdd />}
                      onClick={openAchAdd}
                      size="small"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 950,
                        borderColor: "rgba(122,63,145,0.55)",
                        color: BRAND_PRIMARY,
                      }}
                      fullWidth={isMobile}
                    >
                      Add
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<MdSave />}
                      onClick={persistAchievements}
                      size="small"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 950,
                        background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
                      }}
                      fullWidth={isMobile}
                    >
                      Save to DB
                    </Button>
                  </Stack>
                }
              />

              <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 950 }}>Title</TableCell>
                        <TableCell sx={{ fontWeight: 950 }}>Issuer</TableCell>
                        <TableCell sx={{ fontWeight: 950 }}>Year</TableCell>
                        <TableCell sx={{ fontWeight: 950 }}>Link</TableCell>
                        <TableCell sx={{ fontWeight: 950, width: 120 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {achievements.map((a) => (
                        <TableRow key={a.id || a.title} hover>
                          <TableCell sx={{ fontWeight: 900 }}>{a.title}</TableCell>
                          <TableCell sx={{ opacity: 0.85 }}>{a.issuer}</TableCell>
                          <TableCell sx={{ opacity: 0.85 }}>{a.year}</TableCell>
                          <TableCell sx={{ opacity: 0.85 }}>{a.link}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.8}>
                              <IconButton size="small" onClick={() => openAchEdit(a)}>
                                <MdEdit />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => deleteAchLocal(a.id)}>
                                <MdDelete />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {achievements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <Typography sx={{ opacity: 0.7 }}>No achievements yet.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <SimpleItemDialog
                open={achDlgOpen}
                title={achEditingId ? "Edit Achievement" : "Add Achievement"}
                onClose={() => setAchDlgOpen(false)}
                onSave={saveAchLocal}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="Title" value={achForm.title} onChange={(e) => setAchForm((p) => ({ ...p, title: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="Issuer" value={achForm.issuer} onChange={(e) => setAchForm((p) => ({ ...p, issuer: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="Year" value={achForm.year} onChange={(e) => setAchForm((p) => ({ ...p, year: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="Link" value={achForm.link} onChange={(e) => setAchForm((p) => ({ ...p, link: e.target.value }))} />
                  </Grid>
                </Grid>
              </SimpleItemDialog>
            </Box>
          ) : null}

          {/* LANGUAGES */}
          {active === "languages" ? (
            <Box>
              <SectionHeader
                title="Programming Languages Experience"
                subtitle="✅ Saved to DB"
                right={
                  <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
                    <Button
                      variant="outlined"
                      startIcon={<MdAdd />}
                      onClick={openLangAdd}
                      size="small"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 950,
                        borderColor: "rgba(122,63,145,0.55)",
                        color: BRAND_PRIMARY,
                      }}
                      fullWidth={isMobile}
                    >
                      Add
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<MdSave />}
                      onClick={persistLanguages}
                      size="small"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 950,
                        background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
                      }}
                      fullWidth={isMobile}
                    >
                      Save to DB
                    </Button>
                  </Stack>
                }
              />

              <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 950 }}>Language</TableCell>
                        <TableCell sx={{ fontWeight: 950 }}>Level</TableCell>
                        <TableCell sx={{ fontWeight: 950 }}>Years</TableCell>
                        <TableCell sx={{ fontWeight: 950 }}>Notes</TableCell>
                        <TableCell sx={{ fontWeight: 950, width: 120 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {languages.map((l) => (
                        <TableRow key={l.id || l.language} hover>
                          <TableCell sx={{ fontWeight: 900 }}>{l.language || l.name}</TableCell>
                          <TableCell sx={{ opacity: 0.85 }}>{l.level}</TableCell>
                          <TableCell sx={{ opacity: 0.85 }}>{l.years}</TableCell>
                          <TableCell sx={{ opacity: 0.85 }}>{l.notes}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.8}>
                              <IconButton size="small" onClick={() => openLangEdit(l)}>
                                <MdEdit />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => deleteLangLocal(l.id)}>
                                <MdDelete />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {languages.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <Typography sx={{ opacity: 0.7 }}>No languages yet.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <SimpleItemDialog
                open={langDlgOpen}
                title={langEditingId ? "Edit Language" : "Add Language"}
                onClose={() => setLangDlgOpen(false)}
                onSave={saveLangLocal}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="Language" value={langForm.language} onChange={(e) => setLangForm((p) => ({ ...p, language: e.target.value }))} />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small" sx={tfSx}>
                      <InputLabel shrink={true}>Level</InputLabel>
                      <Select value={langForm.level} label="Level" onChange={(e) => setLangForm((p) => ({ ...p, level: e.target.value }))} notched>
                        <MenuItem value="Beginner">Beginner</MenuItem>
                        <MenuItem value="Intermediate">Intermediate</MenuItem>
                        <MenuItem value="Advanced">Advanced</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small" sx={tfSx}>
                      <InputLabel shrink={true}>Years</InputLabel>
                      <Select value={langForm.years} label="Years" onChange={(e) => setLangForm((p) => ({ ...p, years: Number(e.target.value) }))} notched>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <MenuItem key={i + 1} value={i + 1}>
                            {i + 1}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <SmallTextField label="Notes (optional)" value={langForm.notes} onChange={(e) => setLangForm((p) => ({ ...p, notes: e.target.value }))} />
                  </Grid>
                </Grid>
              </SimpleItemDialog>
            </Box>
          ) : null}

          {/* EDUCATION */}
          {active === "education" ? (
            <Box>
              <SectionHeader
                title="Education"
                subtitle="✅ Added (CRUD + Save to DB)"
                right={
                  <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
                    <Button
                      variant="outlined"
                      startIcon={<MdAdd />}
                      onClick={openEduAdd}
                      size="small"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 950,
                        borderColor: "rgba(122,63,145,0.55)",
                        color: BRAND_PRIMARY,
                      }}
                      fullWidth={isMobile}
                    >
                      Add
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<MdSave />}
                      onClick={persistEducation}
                      size="small"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 950,
                        background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
                      }}
                      fullWidth={isMobile}
                    >
                      Save to DB
                    </Button>
                  </Stack>
                }
              />

              <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 950 }}>Degree</TableCell>
                        <TableCell sx={{ fontWeight: 950 }}>Institution</TableCell>
                        <TableCell sx={{ fontWeight: 950 }}>Year</TableCell>
                        <TableCell sx={{ fontWeight: 950, width: 120 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {education.map((e) => (
                        <TableRow key={e.id || e.degree} hover>
                          <TableCell sx={{ fontWeight: 900 }}>{e.degree}</TableCell>
                          <TableCell sx={{ opacity: 0.85 }}>{e.institution}</TableCell>
                          <TableCell sx={{ opacity: 0.85 }}>{e.year}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.8}>
                              <IconButton size="small" onClick={() => openEduEdit(e)}>
                                <MdEdit />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => deleteEduLocal(e.id)}>
                                <MdDelete />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {education.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <Typography sx={{ opacity: 0.7 }}>No education yet.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <SimpleItemDialog
                open={eduDlgOpen}
                title={eduEditingId ? "Edit Education" : "Add Education"}
                onClose={() => setEduDlgOpen(false)}
                onSave={saveEduLocal}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="Degree" value={eduForm.degree} onChange={(e) => setEduForm((p) => ({ ...p, degree: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="Institution" value={eduForm.institution} onChange={(e) => setEduForm((p) => ({ ...p, institution: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="Year" value={eduForm.year} onChange={(e) => setEduForm((p) => ({ ...p, year: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12}>
                    <SmallTextField label="Details (optional)" value={eduForm.details} onChange={(e) => setEduForm((p) => ({ ...p, details: e.target.value }))} multiline minRows={3} />
                  </Grid>
                </Grid>
              </SimpleItemDialog>
            </Box>
          ) : null}

          {/* EXPERIENCE */}
          {active === "experience" ? (
            <Box>
              <SectionHeader
                title="Experience"
                subtitle="✅ Added (CRUD + Save to DB)"
                right={
                  <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
                    <Button
                      variant="outlined"
                      startIcon={<MdAdd />}
                      onClick={openExpAdd}
                      size="small"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 950,
                        borderColor: "rgba(122,63,145,0.55)",
                        color: BRAND_PRIMARY,
                      }}
                      fullWidth={isMobile}
                    >
                      Add
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<MdSave />}
                      onClick={persistExperience}
                      size="small"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 950,
                        background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
                      }}
                      fullWidth={isMobile}
                    >
                      Save to DB
                    </Button>
                  </Stack>
                }
              />

              <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 950 }}>Company</TableCell>
                        <TableCell sx={{ fontWeight: 950 }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 950 }}>Start</TableCell>
                        <TableCell sx={{ fontWeight: 950 }}>End</TableCell>
                        <TableCell sx={{ fontWeight: 950, width: 120 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {experience.map((e) => (
                        <TableRow key={e.id || e.company} hover>
                          <TableCell sx={{ fontWeight: 900 }}>{e.company}</TableCell>
                          <TableCell sx={{ opacity: 0.85 }}>{e.role}</TableCell>
                          <TableCell sx={{ opacity: 0.85 }}>{e.start}</TableCell>
                          <TableCell sx={{ opacity: 0.85 }}>{e.end}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.8}>
                              <IconButton size="small" onClick={() => openExpEdit(e)}>
                                <MdEdit />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => deleteExpLocal(e.id)}>
                                <MdDelete />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {experience.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <Typography sx={{ opacity: 0.7 }}>No experience yet.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <SimpleItemDialog
                open={expDlgOpen}
                title={expEditingId ? "Edit Experience" : "Add Experience"}
                onClose={() => setExpDlgOpen(false)}
                onSave={saveExpLocal}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="Company" value={expForm.company} onChange={(e) => setExpForm((p) => ({ ...p, company: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="Role" value={expForm.role} onChange={(e) => setExpForm((p) => ({ ...p, role: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="Start" value={expForm.start} onChange={(e) => setExpForm((p) => ({ ...p, start: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="End" value={expForm.end} onChange={(e) => setExpForm((p) => ({ ...p, end: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} sx={{ width: "100%" }}>
  <SmallTextField
    label="Description"
    value={expForm.description || ""}
    onChange={(e) =>
      setExpForm((p) => ({ ...p, description: e.target.value }))
    }
    fullWidth
    multiline
    InputProps={{
      inputComponent: TextareaAutosize,
      inputProps: { minRows: 2 }, // small initially
    }}
    sx={{
      width: "100%",

      "& .MuiInputBase-root": {
        width: "100%",
        alignItems: "flex-start",
      },

      "& textarea": {
        width: "100%",
        boxSizing: "border-box",
        resize: "none",
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word",
      },
    }}
  />
</Grid>

                </Grid>
              </SimpleItemDialog>
            </Box>
          ) : null}

          {/* CONTACT */}
          {active === "contact" ? (
            <Box>
              <SectionHeader
                title="Contact / Links"
                subtitle="These show in the Viewer footer"
                right={
                  <Button
                    variant="contained"
                    startIcon={<MdSave />}
                    onClick={saveSocialsNow}
                    size="small"
                    sx={{
                      borderRadius: 999,
                      fontWeight: 950,
                      background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
                    }}
                    fullWidth={isMobile}
                  >
                    Save
                  </Button>
                }
              />

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="GitHub" value={socials.github || ""} onChange={(e) => setSocials((p) => ({ ...p, github: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="LinkedIn" value={socials.linkedin || ""} onChange={(e) => setSocials((p) => ({ ...p, linkedin: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="Email" value={socials.email || ""} onChange={(e) => setSocials((p) => ({ ...p, email: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="Phone" value={socials.phone || ""} onChange={(e) => setSocials((p) => ({ ...p, phone: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12}>
                    <SmallTextField label="Website" value={socials.website || ""} onChange={(e) => setSocials((p) => ({ ...p, website: e.target.value }))} />
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          ) : null}

          {/* RESUME */}
{active === "resume" ? (
  <Box>
    <SectionHeader
      title="Resume"
      subtitle="Upload + set primary + preview"
      right={
        <Button
          variant="contained"
          component="label"
          startIcon={<MdUpload />}
          size="small"
          sx={{
            borderRadius: 999,
            fontWeight: 950,
            background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
          }}
          fullWidth={isMobile}
        >
          Upload Resume
          <input
            hidden
            type="file"
            accept="application/pdf"
            onChange={(e) => e.target.files?.[0] && onUploadResume(e.target.files[0])}
          />
        </Button>
      }
    />

    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <Stack spacing={1.2}>
        <Button
          variant="outlined"
          startIcon={<MdVisibility />}
          onClick={previewCurrentResumeInline}
          size="small"
          sx={{
            borderRadius: 999,
            fontWeight: 950,
            borderColor: "rgba(122,63,145,0.55)",
            color: BRAND_PRIMARY,
          }}
        >
          Preview Current Resume
        </Button>

        <Divider />

        <Typography sx={{ fontWeight: 950 }}>Uploaded Resumes</Typography>
        {resumes.length === 0 ? (
          <Typography sx={{ opacity: 0.7 }}>No resumes uploaded.</Typography>
        ) : null}

        {/* ✅ SORT PRIMARY FIRST */}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 950, width: 64 }}>S.No</TableCell>
                  <TableCell sx={{ fontWeight: 950 }}>File</TableCell>
                  <TableCell sx={{ fontWeight: 950, width: 130 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 950, width: 140 }}>Uploaded</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 950, width: 160 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {[...resumes]
                  .sort((a, b) => (b.primary === true ? 1 : 0) - (a.primary === true ? 1 : 0))
                  .map((r, idx) => {
                    const isPrimary = Boolean(r.primary);
                    return (
                      <TableRow key={r.id || idx} hover>
                        <TableCell sx={{ opacity: 0.8 }}>{idx + 1}</TableCell>

                        <TableCell sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 950,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {r.fileName || "Resume.pdf"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {isPrimary ? (
                            <Chip
  size="small"
  label="PRIMARY"
  icon={<MdStar style={{ color: "#ff9800" }} />}
  sx={{
    borderRadius: 2,
    fontWeight: 950,
    bgcolor: "rgba(255,152,0,0.15)",   // light orange bg
    color: "#ff9800",                  // text orange
    border: "1px solid rgba(255,152,0,0.5)",

    "& .MuiChip-icon": {
      color: "#ff9800",                // star orange
    },
  }}
/>

                          ) : (
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              —
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ opacity: 0.85 }}>
                          {formatDate(r.uploadedAt)}
                        </TableCell>

                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {/* ✅ PUSH → CHANGED ICON + SUCCESS POPUP */}
                            <Tooltip title="Push to Viewer">
                              <IconButton
                                onClick={() => handlePushResume(r)}
                                aria-label="push"
                              >
                                <MdUpload />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="More">
                              <IconButton
                                onClick={(e) => openResumeMenu(e, r)}
                                aria-label="more"
                              >
                                <MdMoreHoriz />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                {resumes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography sx={{ opacity: 0.7 }}>
                        No resumes uploaded.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Menu anchorEl={resumeMenuAnchor} open={Boolean(resumeMenuAnchor)} onClose={closeResumeMenu}>
          <MenuItem onClick={previewSelectedResumeInline}>
            <ListItemIcon sx={{ minWidth: 34 }}>
              <MdVisibility />
            </ListItemIcon>
            Preview
          </MenuItem>

          <MenuItem onClick={makePrimaryResume}>
            <ListItemIcon sx={{ minWidth: 34 }}>
              <MdStar />
            </ListItemIcon>
            Make Primary
          </MenuItem>

          <Divider />

          <MenuItem onClick={deleteResume} sx={{ color: "error.main" }}>
            <ListItemIcon sx={{ minWidth: 34, color: "error.main" }}>
              <MdDelete />
            </ListItemIcon>
            Delete
          </MenuItem>
        </Menu>

        <ResumePreviewDialog
          open={resumePreviewOpen}
          title={resumePreviewTitle}
          onClose={closeResumePreview}
          url={viewResumeUrl()}
          blobUrl={resumePreviewBlobUrl}
          loading={resumePreviewLoading}
        />
      </Stack>
    </Paper>

    {/* ✅ PUSH SUCCESS POPUP */}
    <Dialog open={pushDialog.open} onClose={() => setPushDialog({ open: false, name: "" })}>
      <DialogTitle sx={{ fontWeight: 900 }}>Resume Pushed</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontWeight: 600 }}>
          "{pushDialog.name}" successfully uploaded to view page.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
  variant="contained"
  onClick={() => setPushDialog({ open: false, name: "" })}
  sx={{
    borderRadius: 999,
    fontWeight: 900,
    background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
  }}
>
  OK
</Button>
      </DialogActions>
    </Dialog>
  </Box>
) : null}


          <ConfirmDialog
            open={confirmOpen}
            title={confirmPayload.title}
            description={confirmPayload.description}
            confirmText={confirmPayload.confirmText}
            onClose={() => setConfirmOpen(false)}
            onConfirm={confirmPayload.onConfirm || (() => setConfirmOpen(false))}
          />
        </Container>
      </Box>
    </Box>
  );
}
