// src/pages/AdminDashboard.jsx
import "./AdminDashboard.css";           // ← NEW: portfolio-matching styles
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

// ── constants (unchanged) ──────────────────────────────────────────────────
const drawerWidth = 280;

const BRAND_PRIMARY = "#c680f2";
const BRAND_DARK    = "#7A3F91";

const bumpContentVersion = () => {
  localStorage.setItem("content_version", String(Date.now()));
};

const formatDate = (iso) => {
  try {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch { return iso; }
};

// ── TextField sx (unchanged logic, updated radius token) ──────────────────
const tfSx = {
  "& .MuiInputLabel-root": { transformOrigin: "top left" },
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    minHeight: 44,
    alignItems: "center",
    background: (t) => t.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(241,48,36,0.04)",
    "& .MuiOutlinedInput-input": { boxSizing: "border-box", padding: "12px 14px", lineHeight: 1.35, fontSize: "14px" },
    "& .MuiOutlinedInput-inputMultiline": { boxSizing: "border-box", padding: "12px 14px", lineHeight: 1.45, fontSize: "14px" },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: (t) => t.palette.mode === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.12)",
      transition: "border-color 0.22s ease",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#f13024" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#f13024", borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#f97316" },
};

// ── SmallTextField (unchanged) ─────────────────────────────────────────────
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

// ── StatCard ───────────────────────────────────────────────────────────────
function StatCard({ title, value, subtitle, icon, trendLabel }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box
      className={`adm-stat adm-neon-top ${isDark ? "" : "adm-stat-light"}`}
      sx={{ p: { xs: 2, md: 2.5 } }}
    >
      <Stack direction="row" alignItems="center" spacing={1.8}>
        <Box className="adm-stat-icon">{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.3 }}>
            <Typography className="adm-stat-label">{title}</Typography>
            {trendLabel && <Chip label={trendLabel} size="small" className="adm-stat-chip" />}
          </Stack>
          <Typography className="adm-stat-value">{value}</Typography>
          {subtitle && <Typography className="adm-stat-sub">{subtitle}</Typography>}
        </Box>
      </Stack>
    </Box>
  );
}

// ── SectionHeader ──────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, right }) {
  return (
    <Box className="adm-sec-header">
      <Box>
        <Typography className="adm-sec-title">{title}</Typography>
        {subtitle && <Typography className="adm-sec-sub">{subtitle}</Typography>}
      </Box>
      {right && <Box sx={{ display: "flex", justifyContent: "flex-end" }}>{right}</Box>}
    </Box>
  );
}

// ── SimpleItemDialog ───────────────────────────────────────────────────────
function SimpleItemDialog({ open, title, children, onClose, onSave, saveText = "Save" }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Dialog
      open={open} onClose={onClose} fullWidth maxWidth="md"
      className={isDark ? "adm-dialog" : "adm-dialog adm-dialog-light"}
    >
      <DialogTitle className="adm-dialog-title" sx={{ pb: 1 }}>{title}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>{children}</DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} size="small" className="adm-btn-outlined" startIcon={<MdClose />}>Cancel</Button>
        <Button onClick={onSave}  size="small" className="adm-btn-primary"  startIcon={<MdSave  />}>{saveText}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── ConfirmDialog ──────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, description, confirmText, onClose, onConfirm }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Dialog
      open={open} onClose={onClose} fullWidth maxWidth="xs"
      className={isDark ? "adm-dialog" : "adm-dialog adm-dialog-light"}
    >
      <DialogTitle className="adm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ opacity: 0.82 }}>{description}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose}   size="small" className="adm-btn-outlined">Cancel</Button>
        <Button onClick={onConfirm} size="small" className="adm-btn-error">{confirmText}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── ProjectEditorDialog (logic unchanged) ──────────────────────────────────
function ProjectEditorDialog({ open, mode, initial, onClose, onSave }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [form, setForm] = useState(
    initial || { title: "", description: "", tech: "", liveUrl: "", repoUrl: "", featured: true }
  );

  React.useEffect(() => {
    setForm(initial || { title: "", description: "", tech: "", liveUrl: "", repoUrl: "", featured: true });
  }, [initial, open]);

  const handleChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const canSave = form.title.trim().length >= 2;

  return (
    <Dialog
      open={open} onClose={onClose} fullWidth maxWidth="sm"
      className={isDark ? "adm-dialog" : "adm-dialog adm-dialog-light"}
    >
      <DialogTitle className="adm-dialog-title">
        {mode === "edit" ? "Edit Project" : "Add Project"}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><SmallTextField label="Project Title" value={form.title} onChange={handleChange("title")} /></Grid>
          <Grid item xs={12} md={6}><SmallTextField label="Tech Stack (comma separated)" value={form.tech} onChange={handleChange("tech")} /></Grid>
          <Grid item xs={12} md={6}><SmallTextField label="Repo URL" value={form.repoUrl} onChange={handleChange("repoUrl")} /></Grid>
          <Grid item xs={12} md={6}><SmallTextField label="Live URL" value={form.liveUrl} onChange={handleChange("liveUrl")} /></Grid>

          <Grid item xs={12} sx={{ width: "100%" }}>
            <SmallTextField
              label="Description" value={form.description || ""} onChange={handleChange("description")}
              fullWidth multiline
              InputProps={{ inputComponent: TextareaAutosize, inputProps: { minRows: 2 } }}
              sx={{ width:"100%","& .MuiInputBase-root":{width:"100%",alignItems:"flex-start"},"& textarea":{width:"100%",boxSizing:"border-box",resize:"none",overflow:"hidden",whiteSpace:"pre-wrap",overflowWrap:"break-word"} }}
            />
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Chip
                label={form.featured ? "Featured: YES" : "Featured: NO"}
                className={form.featured ? "adm-chip-yes" : "adm-chip-no"}
              />
              <Button size="small" className="adm-btn-outlined"
                onClick={() => setForm((p) => ({ ...p, featured: !p.featured }))}>
                Toggle Featured
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} size="small" className="adm-btn-outlined" startIcon={<MdClose />}>Cancel</Button>
        <Button disabled={!canSave} onClick={() => onSave(form)} size="small" className="adm-btn-primary" startIcon={<MdSave />}>
          {mode === "edit" ? "Save Changes" : "Add Project"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── ResumePreviewDialog (logic unchanged) ──────────────────────────────────
function ResumePreviewDialog({ open, title, onClose, url, blobUrl, loading }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const src    = blobUrl || url;
  return (
    <Dialog
      open={open} onClose={onClose} fullWidth maxWidth="md"
      className={isDark ? "adm-dialog" : "adm-dialog adm-dialog-light"}
    >
      <DialogTitle className="adm-dialog-title">{title}</DialogTitle>
      <DialogContent sx={{ height:650, p:0, overflow:"hidden", background: isDark ? "#000":"#fff" }}>
        {loading ? (
          <Box sx={{ p:2 }}><Typography sx={{ opacity:0.7 }}>Loading preview…</Typography></Box>
        ) : src ? (
          <Box sx={{ width:"100%",height:"100%",overflowY:"scroll",overflowX:"hidden",position:"relative",scrollbarWidth:"none",msOverflowStyle:"none","&::-webkit-scrollbar":{width:"0px",background:"transparent"} }}>
            <Box sx={{ position:"absolute",right:0,top:0,width:"16px",height:"100%",background:isDark?"#000":"#fff",zIndex:5,pointerEvents:"none" }} />
            <iframe title="Resume Preview" src={src} style={{ width:"100%",height:"200%",border:"none",display:"block",overflow:"hidden" }} />
          </Box>
        ) : (
          <Box sx={{ p:2 }}><Typography sx={{ opacity:0.7 }}>Preview not available.</Typography></Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p:2 }}>
        <Button onClick={onClose} size="small" className="adm-btn-outlined" startIcon={<MdClose />}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — AdminDashboard
// ALL state, hooks, handlers, API calls: 100 % UNCHANGED
// Only JSX markup gets new className props
// ═══════════════════════════════════════════════════════════════════════════
export default function AdminDashboard(props) {
  React.useEffect(() => { document.title = "Gnanaseelan Admin Panel"; }, []);

  const theme   = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDark  = theme.palette.mode === "dark";

  // ── ALL STATE (unchanged) ────────────────────────────────────────────────
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [ok,  setOk]  = useState("");
  const [err, setErr] = useState("");

  const [profile, setProfile] = useState({ name:"",title:"",tagline:"",location:"",emailPublic:"",initials:"",about:"" });
  const [skills,  setSkills]  = useState({ frontend:"",backend:"",database:"",tools:"" });

  const [skillCategory, setSkillCategory] = useState("frontend");
  const [skillInput,    setSkillInput]    = useState("");
  const [skillTable,    setSkillTable]    = useState([]);
  const [editIndex,     setEditIndex]     = useState(null);
  const [editValue,     setEditValue]     = useState("");

  const [projects,     setProjects]     = useState([]);
  const [socials,      setSocials]      = useState({ github:"",linkedin:"",email:"",phone:"",website:"" });
  const [achievements, setAchievements] = useState([]);
  const [languages,    setLanguages]    = useState([]);
  const [education,    setEducation]    = useState([]);
  const [experience,   setExperience]   = useState([]);

  const [projDlgOpen,    setProjDlgOpen]    = useState(false);
  const [projDlgMode,    setProjDlgMode]    = useState("add");
  const [projDlgInitial, setProjDlgInitial] = useState(null);

  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [confirmPayload,setConfirmPayload] = useState({ title:"",description:"",confirmText:"",onConfirm:null });

  const [achDlgOpen,   setAchDlgOpen]   = useState(false);
  const [achEditingId, setAchEditingId] = useState(null);
  const [achForm,      setAchForm]      = useState({ title:"",issuer:"",year:"",link:"" });

  const [langDlgOpen,   setLangDlgOpen]   = useState(false);
  const [langEditingId, setLangEditingId] = useState(null);
  const [langForm,      setLangForm]      = useState({ language:"",level:"Beginner",years:1,notes:"" });

  const [eduDlgOpen,   setEduDlgOpen]   = useState(false);
  const [eduEditingId, setEduEditingId] = useState(null);
  const [eduForm,      setEduForm]      = useState({ degree:"",institution:"",year:"",details:"" });

  const [expDlgOpen,   setExpDlgOpen]   = useState(false);
  const [expEditingId, setExpEditingId] = useState(null);
  const [expForm,      setExpForm]      = useState({ company:"",role:"",start:"",end:"",description:"" });

  const [resumes,              setResumes]              = useState([]);
  const [resumeMenuAnchor,     setResumeMenuAnchor]     = useState(null);
  const [resumeMenuItem,       setResumeMenuItem]       = useState(null);
  const [resumePreviewOpen,    setResumePreviewOpen]    = useState(false);
  const [resumePreviewTitle,   setResumePreviewTitle]   = useState("");
  const [resumePreviewBlobUrl, setResumePreviewBlobUrl] = useState("");
  const [resumePreviewLoading, setResumePreviewLoading] = useState(false);

  const handleDrawerToggle = () => setMobileOpen((p) => !p);

  // ── ALL HANDLERS (100 % unchanged) ──────────────────────────────────────

  const fetchAllAdmin = async () => {
    try {
      setErr(""); setOk(""); setLoading(true);
      const [p,s,pr,so,a,l,edu,exp] = await Promise.all([
        getProfile(),getSkills(),getAllProjectsAdmin(),getSocials(),
        getAchievements(),getLanguageExperience(),getEducation(),getExperience(),
      ]);
      setProfile(p?.data || {});
      setSkills(s?.data  || {});
      const table = [];
      const data  = s?.data || {};
      ["frontend","backend","database","tools"].forEach(cat=>{
        if(data[cat]) data[cat].split(",").forEach(sk=>{ if(sk.trim()) table.push({category:cat,name:sk.trim()}); });
      });
      setSkillTable(table);
      setProjects(pr?.data || []);
      setSocials(so?.data  || {});
      setAchievements(Array.isArray(a?.data)   ? a.data   : []);
      setLanguages(   Array.isArray(l?.data)   ? l.data   : []);
      setEducation(   Array.isArray(edu?.data) ? edu.data : []);
      setExperience(  Array.isArray(exp?.data) ? exp.data : []);
      try { const r = await listResumesAdmin(); if(r?.data && Array.isArray(r.data)) setResumes(r.data); } catch{}
      setOk("Admin data loaded from DB.");
    } catch { setErr("Failed to load Admin data. Check backend is running + token + CORS."); }
    finally  { setLoading(false); }
  };

  React.useEffect(() => { fetchAllAdmin(); }, []); // eslint-disable-line

  const toggleTheme = () => {
    if(typeof props?.setDarkMode==="function"){ props.setDarkMode((p)=>!p); return; }
    const next = theme.palette.mode !== "dark";
    localStorage.setItem("admin_pref_dark", next?"1":"0");
    setOk("Theme toggle clicked. (Wire setDarkMode from App.jsx to apply instantly)");
  };

  const [pushDialog, setPushDialog] = useState({ open:false, name:"" });
  const handlePushResume = async (r) => { await pushResumeToViewer(r); setPushDialog({ open:true, name:r.fileName||"Resume.pdf" }); };

  const saveProfileNow = async () => {
    try { setErr(""); setOk(""); setLoading(true); await updateProfile(profile); setOk("Profile saved to DB."); bumpContentVersion(); }
    catch { setErr("Saving profile failed."); } finally { setLoading(false); }
  };

  const saveSkillsNow = async () => {
    try {
      setErr(""); setOk(""); setLoading(true);
      const payload = {
        frontend: skillTable.filter(s=>s.category==="frontend").map(s=>s.name).join(","),
        backend:  skillTable.filter(s=>s.category==="backend").map(s=>s.name).join(","),
        database: skillTable.filter(s=>s.category==="database").map(s=>s.name).join(","),
        tools:    skillTable.filter(s=>s.category==="tools").map(s=>s.name).join(","),
      };
      await updateSkills(payload);
      setOk("Skills saved to database successfully"); bumpContentVersion();
    } catch(e){ console.error(e); setErr("Skills save failed"); } finally{ setLoading(false); }
  };

  const addSkill    = () => { if(!skillInput.trim()) return; setSkillTable(p=>[...p,{category:skillCategory,name:skillInput.trim()}]); setSkillInput(""); };
  const deleteSkill = (index) => setSkillTable(p=>p.filter((_,i)=>i!==index));
  const startEditSkill = (i) => { setEditIndex(i); setEditValue(skillTable[i].name); };
  const saveEditSkill  = (i) => { setSkillTable(p=>p.map((x,idx)=>(idx===i?{...x,name:editValue}:x))); setEditIndex(null); };

  const saveSocialsNow = async () => {
    try { setErr(""); setOk(""); setLoading(true); await updateSocials(socials); setOk("Contact / Links saved to DB."); bumpContentVersion(); }
    catch { setErr("Saving socials failed."); } finally { setLoading(false); }
  };

  const openAddProject  = () => { setProjDlgMode("add");  setProjDlgInitial(null);  setProjDlgOpen(true); };
  const openEditProject = (proj) => { setProjDlgMode("edit"); setProjDlgInitial(proj); setProjDlgOpen(true); };

  const onSaveProjectDialog = async (form) => {
    try {
      setErr(""); setOk(""); setLoading(true);
      if(projDlgMode==="edit" && projDlgInitial?.id){ await updateProject(projDlgInitial.id,form); setOk("Project updated."); }
      else { await createProject(form); setOk("Project added."); }
      setProjDlgOpen(false); await fetchAllAdmin(); bumpContentVersion();
    } catch { setErr("Project save failed."); } finally { setLoading(false); }
  };

  const askDeleteProject = (proj) => {
    setConfirmPayload({
      title:"Delete Project?",
      description:`This will permanently delete "${proj.title}".`,
      confirmText:"Delete",
      onConfirm: async()=>{
        try{ setConfirmOpen(false); setErr(""); setOk(""); setLoading(true); await deleteProject(proj.id); setOk("Project deleted."); await fetchAllAdmin(); bumpContentVersion(); }
        catch{ setErr("Delete failed."); } finally{ setLoading(false); }
      },
    });
    setConfirmOpen(true);
  };

  const openAchAdd  = () => { setAchEditingId(null); setAchForm({title:"",issuer:"",year:"",link:""}); setAchDlgOpen(true); };
  const openAchEdit = (a)  => { setAchEditingId(a.id); setAchForm({title:a.title||"",issuer:a.issuer||"",year:a.year||"",link:a.link||""}); setAchDlgOpen(true); };
  const deleteAchLocal = (id)=> setAchievements((p)=>p.filter((x)=>x.id!==id));
  const saveAchLocal = () => {
    if(achEditingId) setAchievements((p)=>p.map((x)=>(x.id===achEditingId?{...x,...achForm}:x)));
    else setAchievements((p)=>[{...achForm,id:Date.now()},...p]);
    setAchDlgOpen(false);
  };
  const persistAchievements = async () => {
    try{ setErr(""); setOk(""); setLoading(true); await saveAchievements(achievements.map(({id,...rest})=>rest)); setOk("Achievements saved to DB."); await fetchAllAdmin(); bumpContentVersion(); }
    catch{ setErr("Saving achievements failed."); } finally{ setLoading(false); }
  };

  const openLangAdd  = () => { setLangEditingId(null); setLangForm({language:"",level:"Beginner",years:1,notes:""}); setLangDlgOpen(true); };
  const openLangEdit = (l)  => { setLangEditingId(l.id); setLangForm({language:l.language||l.name||"",level:l.level||"Beginner",years:Number(l.years||1),notes:l.notes||""}); setLangDlgOpen(true); };
  const deleteLangLocal = (id)=> setLanguages((p)=>p.filter((x)=>x.id!==id));
  const saveLangLocal = () => {
    if(langEditingId) setLanguages((p)=>p.map((x)=>(x.id===langEditingId?{...x,...langForm}:x)));
    else setLanguages((p)=>[{...langForm,id:Date.now()},...p]);
    setLangDlgOpen(false);
  };
  const persistLanguages = async () => {
    try{
      setErr(""); setOk(""); setLoading(true);
      const payload = languages.map((l)=>({language:l.language||l.name||"",level:l.level||"Beginner",years:String(l.years??1),notes:l.notes||""}));
      await saveLanguageExperience(payload); setOk("Languages experience saved to DB."); await fetchAllAdmin(); bumpContentVersion();
    } catch{ setErr("Saving language experience failed."); } finally{ setLoading(false); }
  };

  const openEduAdd  = () => { setEduEditingId(null); setEduForm({degree:"",institution:"",year:"",details:""}); setEduDlgOpen(true); };
  const openEduEdit = (e)  => { setEduEditingId(e.id); setEduForm({degree:e.degree||"",institution:e.institution||"",year:e.year||"",details:e.details||""}); setEduDlgOpen(true); };

  const deleteEduLocal = async (id) => {
    const prev = education; const next = prev.filter((x)=>x.id!==id); setEducation(next);
    try{
      setErr(""); setOk(""); setLoading(true);
      let deleted = false;
      try{ await http.delete(`/api/portfolio/education/${id}`); deleted=true; } catch{}
      if(!deleted){ const payload = next.map(({id:_id,...rest})=>rest); await updateEducation(payload); }
      setOk("Education deleted."); await fetchAllAdmin(); bumpContentVersion();
    } catch{ setErr("Deleting education failed."); setEducation(prev); } finally{ setLoading(false); }
  };

  const saveEduLocal = () => {
    if(eduEditingId) setEducation((p)=>p.map((x)=>(x.id===eduEditingId?{...x,...eduForm}:x)));
    else setEducation((p)=>[{...eduForm,id:Date.now()},...p]);
    setEduDlgOpen(false);
  };
  const persistEducation = async () => {
    try{ setErr(""); setOk(""); setLoading(true); const payload=education.map(({id,...rest})=>rest); await updateEducation(payload); setOk("Education saved to DB."); await fetchAllAdmin(); bumpContentVersion(); }
    catch{ setErr("Saving education failed."); } finally{ setLoading(false); }
  };

  const openExpAdd  = () => { setExpEditingId(null); setExpForm({company:"",role:"",start:"",end:"",description:""}); setExpDlgOpen(true); };
  const openExpEdit = (e)  => { setExpEditingId(e.id); setExpForm({company:e.company||"",role:e.role||"",start:e.start||"",end:e.end||"",description:e.description||""}); setExpDlgOpen(true); };

  const deleteExpLocal = async (id) => {
    const prev = experience; const next = prev.filter((x)=>x.id!==id); setExperience(next);
    try{
      setErr(""); setOk(""); setLoading(true);
      let deleted = false;
      try{ await http.delete(`/api/portfolio/experience/${id}`); deleted=true; } catch{}
      if(!deleted){ const payload=next.map(({id:_id,...rest})=>rest); await updateExperience(payload); }
      setOk("Experience deleted."); await fetchAllAdmin(); bumpContentVersion();
    } catch{ setErr("Deleting experience failed."); setExperience(prev); } finally{ setLoading(false); }
  };

  const saveExpLocal = () => {
    if(expEditingId) setExperience((p)=>p.map((x)=>(x.id===expEditingId?{...x,...expForm}:x)));
    else setExperience((p)=>[{...expForm,id:Date.now()},...p]);
    setExpDlgOpen(false);
  };
  const persistExperience = async () => {
    try{ setErr(""); setOk(""); setLoading(true); const payload=experience.map(({id,...rest})=>rest); await updateExperience(payload); setOk("Experience saved to DB."); await fetchAllAdmin(); bumpContentVersion(); }
    catch{ setErr("Saving experience failed."); } finally{ setLoading(false); }
  };

  const onUploadResume = async (file) => {
    try{ setErr(""); setOk(""); setLoading(true); await uploadResume(file); const r=await listResumesAdmin(); if(r?.data && Array.isArray(r.data)) setResumes(r.data); setOk("Resume uploaded."); bumpContentVersion(); }
    catch{ setErr("Resume upload failed."); } finally{ setLoading(false); }
  };

  const openResumePreviewInline = async (title, directUrl) => {
    try{
      setResumePreviewTitle(title||"Resume Preview"); setResumePreviewLoading(true); setResumePreviewOpen(true);
      const res = await http.get(directUrl,{responseType:"blob"});
      const blob = new Blob([res.data],{type:"application/pdf"});
      setResumePreviewBlobUrl(URL.createObjectURL(blob));
    } catch{ setResumePreviewBlobUrl(""); } finally{ setResumePreviewLoading(false); }
  };

  const closeResumePreview = () => {
    setResumePreviewOpen(false);
    if(resumePreviewBlobUrl){ try{ URL.revokeObjectURL(resumePreviewBlobUrl); }catch{} }
    setResumePreviewBlobUrl("");
  };

  const previewCurrentResumeInline  = async () => openResumePreviewInline("Current Resume", viewResumeUrl());
  const pushResumeToViewer = async (item) => {
    try{ if(!item?.id) return; setErr(""); setOk(""); setLoading(true); await setPrimaryResume(item.id); setOk(`Pushed to Viewer: ${item.fileName||"Resume"}`); await fetchAllAdmin(); bumpContentVersion(); }
    catch{ setErr("Failed to push resume to Viewer."); } finally{ setLoading(false); }
  };

  const openResumeMenu = (e, item) => { setResumeMenuAnchor(e.currentTarget); setResumeMenuItem(item); };
  const closeResumeMenu = () => { setResumeMenuAnchor(null); setResumeMenuItem(null); };

  const previewSelectedResumeInline = async () => { const item=resumeMenuItem; closeResumeMenu(); if(!item?.id) return; await openResumePreviewInline(item.fileName||"Resume",viewResumeByIdUrl(item.id)); };
  const makePrimaryResume = async () => {
    const item=resumeMenuItem; closeResumeMenu(); if(!item?.id) return;
    try{ setErr(""); setOk(""); setLoading(true); await setPrimaryResume(item.id); setOk("Primary resume set."); await fetchAllAdmin(); bumpContentVersion(); }
    catch{ setErr("Failed to set primary."); } finally{ setLoading(false); }
  };
  const deleteResume = async () => {
    const item=resumeMenuItem; closeResumeMenu(); if(!item?.id) return;
    try{ setErr(""); setOk(""); setLoading(true); await deleteResumeById(item.id); setOk("Resume deleted."); await fetchAllAdmin(); bumpContentVersion(); }
    catch{ setErr("Failed to delete resume."); } finally{ setLoading(false); }
  };

  // ── pageLabel map ─────────────────────────────────────────────────────────
  const pageLabel = {
    dashboard:"Dashboard",about:"About Me",skills:"Skills",projects:"Projects",
    achievements:"Achievements",languages:"Languages Experience",education:"Education",
    experience:"Experience",contact:"Contact / Links",resume:"Resume",
  };

  // ── nav items ─────────────────────────────────────────────────────────────
  const navItems = [
    { id:"dashboard",    label:"Dashboard",       icon:<MdDashboard /> },
    { id:"about",        label:"About Me",        icon:<MdPerson /> },
    { id:"skills",       label:"Skills",          icon:<MdBuild /> },
    { id:"projects",     label:"Projects",        icon:<MdWork /> },
    { id:"achievements", label:"Achievements",    icon:<MdEmojiEvents /> },
    { id:"languages",    label:"Languages Exp",   icon:<MdCode /> },
    { id:"education",    label:"Education",       icon:<MdSchool /> },
    { id:"experience",   label:"Experience",      icon:<MdBadge /> },
    { id:"contact",      label:"Contact / Links", icon:<MdLink /> },
    { id:"resume",       label:"Resume",          icon:<MdDescription /> },
  ];

  // ── helper shortcuts ──────────────────────────────────────────────────────
  const PBtn = ({ children, ...p }) => <Button size="small" className="adm-btn-primary"  fullWidth={isMobile} {...p}>{children}</Button>;
  const OBtn = ({ children, ...p }) => <Button size="small" className="adm-btn-outlined" fullWidth={isMobile} {...p}>{children}</Button>;

  const IconEdit = ({ onClick }) => (
    <IconButton size="small" className={`adm-icon-btn ${isDark ? "" : "adm-icon-btn-light"}`} onClick={onClick}><MdEdit /></IconButton>
  );
  const IconDel = ({ onClick }) => (
    <IconButton size="small" className="adm-icon-btn-err" onClick={onClick}><MdDelete /></IconButton>
  );

  // ── table helpers ─────────────────────────────────────────────────────────
  const TableWrap = ({ children }) => (
    <Paper elevation={0} className={`adm-table-wrap ${isDark ? "" : "adm-table-wrap-light"}`}>
      <TableContainer>{children}</TableContainer>
    </Paper>
  );

  const THead = ({ cols }) => (
    <TableHead>
      <TableRow>
        {cols.map((c, i) => (
          <TableCell key={i} sx={c.sx} className={`adm-th ${isDark ? "" : "adm-th-light"}`}>{c.label}</TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

  const TRow = ({ children }) => (
    <TableRow className={`adm-tr`}>{children}</TableRow>
  );

  const TC = ({ children, bold, sx }) => (
    <TableCell
      className={`adm-td ${isDark ? "" : "adm-td-light"}`}
      sx={{ fontWeight: bold ? 800 : undefined, ...sx }}
    >
      {children}
    </TableCell>
  );

  // ── DRAWER CONTENT ────────────────────────────────────────────────────────
  const drawer = (
    <Box sx={{ height:"100%", display:"flex", flexDirection:"column" }}>

      {/* Brand header */}
      <Box className={`adm-drawer-header ${isDark ? "" : "adm-drawer-header-light"}`}>
        <Avatar className="adm-drawer-avatar">G</Avatar>
        <Box className="adm-drawer-brand-text">
          <Typography className="adm-drawer-brand-name">Admin Panel</Typography>
          <Typography className="adm-drawer-brand-sub">Portfolio Manager</Typography>
        </Box>
      </Box>

      {/* Nav list */}
      <Box sx={{ flex:1, overflowY:"auto", py:1 }} className="adm-scroll">
        <Typography className="adm-nav-section">Navigation</Typography>
        <List disablePadding>
          {navItems.map((it) => (
            <ListItemButton
              key={it.id}
              onClick={() => { setActive(it.id); setMobileOpen(false); }}
              className={`adm-nav-item ${active===it.id ? "adm-nav-item-active" : ""}`}
            >
              <ListItemIcon className={`adm-nav-icon ${isDark ? "" : "adm-nav-icon-light"}`}>
                {it.icon}
              </ListItemIcon>
              <ListItemText
                primary={it.label}
                className={`adm-nav-label ${isDark ? "" : "adm-nav-label-light"}`}
                primaryTypographyProps={{ fontSize:"0.875rem", fontWeight: active===it.id ? 800 : 600 }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* Logout */}
      <Box sx={{ p:1.5, borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(17,24,39,0.07)" }}>
        <Button
          fullWidth
          className="adm-logout"
          startIcon={<MdLogout />}
          onClick={() => { localStorage.removeItem("token"); window.location.href="/admin-login"; }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <Box
      sx={{ display:"flex", minHeight:"100vh" }}
      className={`adm-root ${isDark ? "adm-root-dark" : "adm-root-light"}`}
    >
      <CssBaseline />

      {/* ── Animated background (dark only) ── */}
      {isDark && (
        <Box className="adm-bg" aria-hidden="true">
          <Box className="adm-orb adm-orb-1" />
          <Box className="adm-orb adm-orb-2" />
          <Box className="adm-orb adm-orb-3" />
          <Box className="adm-grid" />
        </Box>
      )}

      {/* ── APP BAR ── */}
      <AppBar
        position="fixed"
        elevation={0}
        className={isDark ? "adm-appbar" : "adm-appbar adm-appbar-light"}
        sx={{ zIndex:(t)=>t.zIndex.drawer+1, color:"text.primary" }}
      >
        <Toolbar sx={{ gap:1 }}>
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            className={`adm-bar-btn ${isDark ? "" : "adm-bar-btn-light"}`}
            sx={{ mr:0.5, display:{ md:"none" } }}
          >
            <MdMenu />
          </IconButton>

          <Typography className="adm-bar-title" sx={{ flexGrow:1 }}>
            {pageLabel[active] || "Admin"}
          </Typography>

          <Tooltip title="View Portfolio">
            <IconButton onClick={()=>window.open("/","_blank")} className={`adm-bar-btn ${isDark?"":"adm-bar-btn-light"}`}>
              <MdVisibility />
            </IconButton>
          </Tooltip>

          <Tooltip title={isDark ? "Light Mode" : "Dark Mode"}>
            <IconButton onClick={toggleTheme} className={`adm-bar-btn ${isDark?"":"adm-bar-btn-light"}`}>
              {isDark ? <MdLightMode /> : <MdDarkMode />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Reload">
            <IconButton onClick={fetchAllAdmin} className={`adm-bar-btn ${isDark?"":"adm-bar-btn-light"}`}>
              <MdRefresh />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* ── DRAWER ── */}
      <Box component="nav" sx={{ width:{ md:drawerWidth }, flexShrink:{ md:0 }, zIndex:2 }}>
        <Drawer
          variant="temporary" open={mobileOpen} onClose={handleDrawerToggle}
          ModalProps={{ keepMounted:true }}
          sx={{ display:{ xs:"block", md:"none" }, "& .MuiDrawer-paper":{ width:drawerWidth, borderRight:"none" } }}
          PaperProps={{ className:`adm-drawer ${isDark?"":"adm-drawer-light"}` }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent" open
          sx={{ display:{ xs:"none", md:"block" }, "& .MuiDrawer-paper":{ width:drawerWidth } }}
          PaperProps={{ className:`adm-drawer ${isDark?"":"adm-drawer-light"}` }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* ── MAIN CONTENT ── */}
      <Box
        component="main"
        className="adm-main"
        sx={{
          flexGrow:1, minWidth:0, pb:6,
          width:{ md:`calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />

        <Container maxWidth="xl" sx={{ py:3 }}>

          {/* Alerts */}
          {ok  && <Alert severity="success" className="adm-alert-ok">{ok}</Alert>}
          {err && <Alert severity="error"   className="adm-alert-err">{err}</Alert>}

          {/* ── PAGE HEADER ── */}
          <Box className="adm-page-header adm-page-enter">
            <Typography className={isDark ? "adm-page-title" : "adm-page-title adm-page-title-light"}>
              {pageLabel[active] || "Admin"}
            </Typography>
            <Typography className="adm-page-subtitle">
              {active==="dashboard"    && "Portfolio overview — all data synced from DB"}
              {active==="about"        && "Edit your public profile — saved directly to the database"}
              {active==="skills"       && "Manage your tech stack with add / edit / delete"}
              {active==="projects"     && "Add or edit featured projects shown on the viewer"}
              {active==="achievements" && "Certifications, awards and recognitions"}
              {active==="languages"    && "Programming language proficiency and years of experience"}
              {active==="education"    && "Academic background and qualifications"}
              {active==="experience"   && "Career and internship timeline"}
              {active==="contact"      && "Social links and contact information shown in viewer"}
              {active==="resume"       && "Upload, preview, and set the primary resume for download"}
            </Typography>
          </Box>

          {/* ══════════════════════════════════════════════════════ DASHBOARD */}
          {active==="dashboard" && (
            <Box className="adm-page-enter">
              <SectionHeader
                title="Overview" subtitle="Quick counts — DB-backed"
                right={<OBtn startIcon={<MdRefresh />} onClick={fetchAllAdmin}>Reload</OBtn>}
              />
              <Grid container spacing={2.5}>
                {[
                  { title:"Projects",     value:projects.length,                                                                                        subtitle:"Featured + all",  icon:<MdWork />,        trendLabel:"DB" },
                  { title:"Skills",       value:String(skills.frontend||"").split(",").filter(Boolean).length, subtitle:"Frontend tags",                 icon:<MdBuild />,       trendLabel:"DB" },
                  { title:"Achievements", value:achievements.length,                                                                                    subtitle:"Awards + certs", icon:<MdEmojiEvents />, trendLabel:"DB" },
                  { title:"Resumes",      value:resumes.length,                                                                                         subtitle:"Uploaded",       icon:<MdDescription />, trendLabel:"DB" },
                ].map((s,i)=>(
                  <Grid key={i} item xs={12} sm={6} md={3}><StatCard {...s} /></Grid>
                ))}
              </Grid>

              {projects.length > 0 && (
                <Box sx={{ mt:3.5 }}>
                  <Typography sx={{ fontWeight:800, mb:1.5, opacity:0.45, fontSize:"0.72rem", letterSpacing:"0.1em", textTransform:"uppercase" }}>
                    Recent Projects
                  </Typography>
                  <TableWrap>
                    <Table size="small">
                      <THead cols={[{label:"Title"},{label:"Tech"},{label:"Featured",sx:{width:100}}]} />
                      <TableBody>
                        {projects.slice(0,5).map((p)=>(
                          <TRow key={p.id}>
                            <TC bold>{p.title}</TC>
                            <TC>{p.tech}</TC>
                            <TC><Chip size="small" label={p.featured?"YES":"NO"} className={p.featured?"adm-chip-yes":"adm-chip-no"} /></TC>
                          </TRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableWrap>
                </Box>
              )}
            </Box>
          )}

          {/* ══════════════════════════════════════════════════════ ABOUT */}
          {active==="about" && (
            <Box className="adm-page-enter">
              <SectionHeader
                title="Profile Details" subtitle="Shown publicly on the portfolio viewer"
                right={<PBtn startIcon={<MdSave />} onClick={saveProfileNow}>Save Profile</PBtn>}
              />
              <Paper
                elevation={0}
                className={`adm-glass adm-neon-top ${isDark?"":"adm-glass-light"}`}
                sx={{ p:{xs:2,md:3}, width:"100%", boxSizing:"border-box" }}
              >
                {/* Desktop: side-by-side | Mobile: stacked */}
                <Box sx={{
                  display:"flex",
                  flexDirection:{ xs:"column", md:"row" },
                  gap:2.5,
                  width:"100%",
                  minHeight:{ md:360 },
                }}>

                  {/* LEFT — 6 small fields, fixed width on desktop */}
                  <Box sx={{
                    width:{ xs:"100%", md:"320px" },
                    flexShrink:0,
                    display:"flex",
                    flexDirection:"column",
                    gap:2,
                  }}>
                    {[["Name","name"],["Title","title"],["Tagline","tagline"],["Location","location"],["Public Email","emailPublic"],["Initials","initials"]].map(([label,key])=>(
                      <SmallTextField
                        key={key}
                        label={label}
                        value={profile[key]||""}
                        onChange={(e)=>setProfile((p)=>({...p,[key]:e.target.value}))}
                      />
                    ))}
                  </Box>

                  {/* RIGHT — About textarea: fills height on desktop, auto on mobile */}
                  <Box sx={{
                    flex:{ xs:"unset", md:1 },
                    minWidth:0,
                    display:"flex",
                    flexDirection:"column",
                  }}>
                    <TextField
                      label="About"
                      value={profile.about||""}
                      onChange={(e)=>setProfile((p)=>({...p,about:e.target.value}))}
                      fullWidth
                      multiline
                      variant="outlined"
                      size="small"
                      /* On mobile: grow with content (minRows). On desktop: fill column height */
                      minRows={isMobile ? 6 : undefined}
                      InputLabelProps={{ shrink: Boolean((profile.about||"").length) }}
                      sx={{
                        flex:{ xs:"unset", md:1 },
                        display:"flex",
                        flexDirection:"column",
                        height:{ xs:"auto", md:"100%" },
                        "& .MuiOutlinedInput-root":{
                          flex:{ xs:"unset", md:1 },
                          height:{ xs:"auto", md:"100%" },
                          alignItems:"flex-start",
                          borderRadius:"14px",
                          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(241,48,36,0.04)",
                          "& .MuiOutlinedInput-notchedOutline":{
                            borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.12)",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline":{ borderColor:"#f13024" },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline":{ borderColor:"#f13024", borderWidth:"1.5px" },
                        },
                        "& .MuiInputBase-root":{ flex:{ xs:"unset", md:1 }, height:{ xs:"auto", md:"100%" }, alignItems:"flex-start" },
                        "& .MuiInputBase-inputMultiline":{
                          height:{ xs:"auto !important", md:"100% !important" },
                          overflowY:{ xs:"visible", md:"auto !important" },
                          resize:"none",
                          padding:"12px 14px",
                          fontSize:"14px",
                          lineHeight:1.75,
                          boxSizing:"border-box",
                          whiteSpace:"pre-wrap",
                          overflowWrap:"break-word",
                          /* hide scrollbar but keep scrolling */
                          scrollbarWidth:"none",
                          msOverflowStyle:"none",
                          "&::-webkit-scrollbar":{ display:"none" },
                        },
                        "& .MuiInputLabel-root.Mui-focused":{ color:"#f97316" },
                      }}
                    />
                  </Box>

                </Box>
              </Paper>
            </Box>
          )}

          {/* ══════════════════════════════════════════════════════ SKILLS */}
          {active==="skills" && (
            <Box className="adm-page-enter">
              <SectionHeader
                title="Skills Manager" subtitle="Add → Edit → Delete → Save to DB"
                right={<PBtn startIcon={<MdSave />} onClick={saveSkillsNow}>Save Skills</PBtn>}
              />
              {/* Add row */}
              <Paper elevation={0} className={`adm-glass ${isDark?"":"adm-glass-light"}`} sx={{ p:{xs:2,md:2.5}, mb:2.5 }}>
                <Grid container spacing={2} alignItems="flex-end">
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small" sx={tfSx}>
                      <InputLabel>Category</InputLabel>
                      <Select value={skillCategory} label="Category" onChange={(e)=>setSkillCategory(e.target.value)}>
                        <MenuItem value="frontend">Frontend</MenuItem>
                        <MenuItem value="backend">Backend</MenuItem>
                        <MenuItem value="database">Database</MenuItem>
                        <MenuItem value="tools">Tools</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SmallTextField label="Skill name" value={skillInput} onChange={(e)=>setSkillInput(e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button fullWidth className="adm-btn-primary" startIcon={<MdAdd />} onClick={addSkill} sx={{ height:42 }}>Add</Button>
                  </Grid>
                </Grid>
              </Paper>
              {/* Table */}
              <TableWrap>
                <Table>
                  <THead cols={[{label:"Category"},{label:"Skill"},{label:"Action",sx:{width:120}}]} />
                  <TableBody>
                    {skillTable.length===0 && <TRow><TC colSpan={3} sx={{opacity:0.5}}>No skills added</TC></TRow>}
                    {skillTable.map((s,i)=>(
                      <TRow key={i}>
                        <TC bold sx={{textTransform:"capitalize"}}>{s.category}</TC>
                        <TC>
                          {editIndex===i
                            ? <SmallTextField value={editValue} onChange={(e)=>setEditValue(e.target.value)} />
                            : s.name}
                        </TC>
                        <TC>
                          <Stack direction="row" spacing={0.8}>
                            {editIndex===i
                              ? <IconButton size="small" sx={{color:"#4ade80"}} onClick={()=>saveEditSkill(i)}><MdSave /></IconButton>
                              : <IconEdit onClick={()=>startEditSkill(i)} />}
                            <IconDel onClick={()=>deleteSkill(i)} />
                          </Stack>
                        </TC>
                      </TRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrap>
            </Box>
          )}

          {/* ══════════════════════════════════════════════════════ PROJECTS */}
          {active==="projects" && (
            <Box className="adm-page-enter">
              <SectionHeader
                title="Projects Manager" subtitle="Add / edit / delete projects shown on Viewer"
                right={<OBtn startIcon={<MdAdd />} onClick={openAddProject}>Add Project</OBtn>}
              />
              <TableWrap>
                <Table>
                  <THead cols={[{label:"Title"},{label:"Tech"},{label:"Featured",sx:{width:100}},{label:"Actions",sx:{width:130}}]} />
                  <TableBody>
                    {projects.map((p)=>(
                      <TRow key={p.id}>
                        <TC bold>{p.title}</TC>
                        <TC sx={{opacity:0.80}}>{p.tech}</TC>
                        <TC><Chip size="small" label={p.featured?"YES":"NO"} className={p.featured?"adm-chip-yes":"adm-chip-no"} /></TC>
                        <TC>
                          <Stack direction="row" spacing={0.8}>
                            <IconEdit onClick={()=>openEditProject(p)} />
                            <IconDel  onClick={()=>askDeleteProject(p)} />
                          </Stack>
                        </TC>
                      </TRow>
                    ))}
                    {projects.length===0 && <TRow><TC colSpan={4} sx={{opacity:0.55}}>No projects yet.</TC></TRow>}
                  </TableBody>
                </Table>
              </TableWrap>
              <ProjectEditorDialog open={projDlgOpen} mode={projDlgMode} initial={projDlgInitial} onClose={()=>setProjDlgOpen(false)} onSave={onSaveProjectDialog} />
            </Box>
          )}

          {/* ══════════════════════════════════════════════════════ ACHIEVEMENTS */}
          {active==="achievements" && (
            <Box className="adm-page-enter">
              <SectionHeader
                title="Achievements" subtitle="Add / edit / delete then Save to DB"
                right={<Stack direction="row" spacing={1}><OBtn startIcon={<MdAdd />} onClick={openAchAdd}>Add</OBtn><PBtn startIcon={<MdSave />} onClick={persistAchievements}>Save to DB</PBtn></Stack>}
              />
              <TableWrap>
                <Table>
                  <THead cols={[{label:"Title"},{label:"Issuer"},{label:"Year"},{label:"Link"},{label:"Actions",sx:{width:110}}]} />
                  <TableBody>
                    {achievements.map((a)=>(
                      <TRow key={a.id||a.title}>
                        <TC bold>{a.title}</TC>
                        <TC sx={{opacity:0.80}}>{a.issuer}</TC>
                        <TC sx={{opacity:0.80}}>{a.year}</TC>
                        <TC sx={{opacity:0.80}}>{a.link}</TC>
                        <TC><Stack direction="row" spacing={0.8}><IconEdit onClick={()=>openAchEdit(a)} /><IconDel onClick={()=>deleteAchLocal(a.id)} /></Stack></TC>
                      </TRow>
                    ))}
                    {achievements.length===0 && <TRow><TC colSpan={5} sx={{opacity:0.55}}>No achievements yet.</TC></TRow>}
                  </TableBody>
                </Table>
              </TableWrap>
              <SimpleItemDialog open={achDlgOpen} title={achEditingId?"Edit Achievement":"Add Achievement"} onClose={()=>setAchDlgOpen(false)} onSave={saveAchLocal}>
                <Grid container spacing={2}>
                  {[["Title","title"],["Issuer","issuer"],["Year","year"],["Link","link"]].map(([label,key])=>(
                    <Grid key={key} item xs={12} md={6}><SmallTextField label={label} value={achForm[key]} onChange={(e)=>setAchForm((p)=>({...p,[key]:e.target.value}))} /></Grid>
                  ))}
                </Grid>
              </SimpleItemDialog>
            </Box>
          )}

          {/* ══════════════════════════════════════════════════════ LANGUAGES */}
          {active==="languages" && (
            <Box className="adm-page-enter">
              <SectionHeader
                title="Programming Languages" subtitle="Language proficiency and experience"
                right={<Stack direction="row" spacing={1}><OBtn startIcon={<MdAdd />} onClick={openLangAdd}>Add</OBtn><PBtn startIcon={<MdSave />} onClick={persistLanguages}>Save to DB</PBtn></Stack>}
              />
              <TableWrap>
                <Table>
                  <THead cols={[{label:"Language"},{label:"Level"},{label:"Years"},{label:"Notes"},{label:"Actions",sx:{width:110}}]} />
                  <TableBody>
                    {languages.map((l)=>(
                      <TRow key={l.id||l.language}>
                        <TC bold>{l.language||l.name}</TC>
                        <TC sx={{opacity:0.80}}>{l.level}</TC>
                        <TC sx={{opacity:0.80}}>{l.years}</TC>
                        <TC sx={{opacity:0.80}}>{l.notes}</TC>
                        <TC><Stack direction="row" spacing={0.8}><IconEdit onClick={()=>openLangEdit(l)} /><IconDel onClick={()=>deleteLangLocal(l.id)} /></Stack></TC>
                      </TRow>
                    ))}
                    {languages.length===0 && <TRow><TC colSpan={5} sx={{opacity:0.55}}>No languages yet.</TC></TRow>}
                  </TableBody>
                </Table>
              </TableWrap>
              <SimpleItemDialog open={langDlgOpen} title={langEditingId?"Edit Language":"Add Language"} onClose={()=>setLangDlgOpen(false)} onSave={saveLangLocal}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}><SmallTextField label="Language" value={langForm.language} onChange={(e)=>setLangForm((p)=>({...p,language:e.target.value}))} /></Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small" sx={tfSx}>
                      <InputLabel shrink>Level</InputLabel>
                      <Select value={langForm.level} label="Level" onChange={(e)=>setLangForm((p)=>({...p,level:e.target.value}))} notched>
                        {["Beginner","Intermediate","Advanced"].map(v=><MenuItem key={v} value={v}>{v}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small" sx={tfSx}>
                      <InputLabel shrink>Years</InputLabel>
                      <Select value={langForm.years} label="Years" onChange={(e)=>setLangForm((p)=>({...p,years:Number(e.target.value)}))} notched>
                        {Array.from({length:10}).map((_,i)=><MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}><SmallTextField label="Notes (optional)" value={langForm.notes} onChange={(e)=>setLangForm((p)=>({...p,notes:e.target.value}))} /></Grid>
                </Grid>
              </SimpleItemDialog>
            </Box>
          )}

          {/* ══════════════════════════════════════════════════════ EDUCATION */}
          {active==="education" && (
            <Box className="adm-page-enter">
              <SectionHeader
                title="Education" subtitle="Academic background and qualifications"
                right={<Stack direction="row" spacing={1}><OBtn startIcon={<MdAdd />} onClick={openEduAdd}>Add</OBtn><PBtn startIcon={<MdSave />} onClick={persistEducation}>Save to DB</PBtn></Stack>}
              />
              <TableWrap>
                <Table>
                  <THead cols={[{label:"Degree"},{label:"Institution"},{label:"Year"},{label:"Actions",sx:{width:110}}]} />
                  <TableBody>
                    {education.map((e)=>(
                      <TRow key={e.id||e.degree}>
                        <TC bold>{e.degree}</TC>
                        <TC sx={{opacity:0.80}}>{e.institution}</TC>
                        <TC sx={{opacity:0.80}}>{e.year}</TC>
                        <TC><Stack direction="row" spacing={0.8}><IconEdit onClick={()=>openEduEdit(e)} /><IconDel onClick={()=>deleteEduLocal(e.id)} /></Stack></TC>
                      </TRow>
                    ))}
                    {education.length===0 && <TRow><TC colSpan={4} sx={{opacity:0.55}}>No education yet.</TC></TRow>}
                  </TableBody>
                </Table>
              </TableWrap>
              <SimpleItemDialog open={eduDlgOpen} title={eduEditingId?"Edit Education":"Add Education"} onClose={()=>setEduDlgOpen(false)} onSave={saveEduLocal}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}><SmallTextField label="Degree" value={eduForm.degree} onChange={(e)=>setEduForm((p)=>({...p,degree:e.target.value}))} /></Grid>
                  <Grid item xs={12} md={6}><SmallTextField label="Institution" value={eduForm.institution} onChange={(e)=>setEduForm((p)=>({...p,institution:e.target.value}))} /></Grid>
                  <Grid item xs={12} md={6}><SmallTextField label="Year" value={eduForm.year} onChange={(e)=>setEduForm((p)=>({...p,year:e.target.value}))} /></Grid>
                  <Grid item xs={12}><SmallTextField label="Details (optional)" value={eduForm.details} onChange={(e)=>setEduForm((p)=>({...p,details:e.target.value}))} multiline minRows={3} /></Grid>
                </Grid>
              </SimpleItemDialog>
            </Box>
          )}

          {/* ══════════════════════════════════════════════════════ EXPERIENCE */}
          {active==="experience" && (
            <Box className="adm-page-enter">
              <SectionHeader
                title="Experience" subtitle="Career and internship timeline"
                right={<Stack direction="row" spacing={1}><OBtn startIcon={<MdAdd />} onClick={openExpAdd}>Add</OBtn><PBtn startIcon={<MdSave />} onClick={persistExperience}>Save to DB</PBtn></Stack>}
              />
              <TableWrap>
                <Table>
                  <THead cols={[{label:"Company"},{label:"Role"},{label:"Start"},{label:"End"},{label:"Actions",sx:{width:110}}]} />
                  <TableBody>
                    {experience.map((e)=>(
                      <TRow key={e.id||e.company}>
                        <TC bold>{e.company}</TC>
                        <TC sx={{opacity:0.80}}>{e.role}</TC>
                        <TC sx={{opacity:0.80}}>{e.start}</TC>
                        <TC sx={{opacity:0.80}}>{e.end}</TC>
                        <TC><Stack direction="row" spacing={0.8}><IconEdit onClick={()=>openExpEdit(e)} /><IconDel onClick={()=>deleteExpLocal(e.id)} /></Stack></TC>
                      </TRow>
                    ))}
                    {experience.length===0 && <TRow><TC colSpan={5} sx={{opacity:0.55}}>No experience yet.</TC></TRow>}
                  </TableBody>
                </Table>
              </TableWrap>
              <SimpleItemDialog open={expDlgOpen} title={expEditingId?"Edit Experience":"Add Experience"} onClose={()=>setExpDlgOpen(false)} onSave={saveExpLocal}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}><SmallTextField label="Company" value={expForm.company} onChange={(e)=>setExpForm((p)=>({...p,company:e.target.value}))} /></Grid>
                  <Grid item xs={12} md={6}><SmallTextField label="Role" value={expForm.role} onChange={(e)=>setExpForm((p)=>({...p,role:e.target.value}))} /></Grid>
                  <Grid item xs={12} md={6}><SmallTextField label="Start" value={expForm.start} onChange={(e)=>setExpForm((p)=>({...p,start:e.target.value}))} /></Grid>
                  <Grid item xs={12} md={6}><SmallTextField label="End" value={expForm.end} onChange={(e)=>setExpForm((p)=>({...p,end:e.target.value}))} /></Grid>
                  <Grid item xs={12} sx={{width:"100%"}}>
                    <SmallTextField
                      label="Description" value={expForm.description||""} onChange={(e)=>setExpForm((p)=>({...p,description:e.target.value}))}
                      fullWidth multiline InputProps={{inputComponent:TextareaAutosize,inputProps:{minRows:2}}}
                      sx={{ width:"100%","& .MuiInputBase-root":{width:"100%",alignItems:"flex-start"},"& textarea":{width:"100%",boxSizing:"border-box",resize:"none",overflow:"hidden",whiteSpace:"pre-wrap",overflowWrap:"break-word"} }}
                    />
                  </Grid>
                </Grid>
              </SimpleItemDialog>
            </Box>
          )}

          {/* ══════════════════════════════════════════════════════ CONTACT */}
          {active==="contact" && (
            <Box className="adm-page-enter">
              <SectionHeader
                title="Contact / Links" subtitle="Shown in the Viewer footer and contact section"
                right={<PBtn startIcon={<MdSave />} onClick={saveSocialsNow}>Save</PBtn>}
              />
              <Paper elevation={0} className={`adm-glass adm-neon-top ${isDark?"":"adm-glass-light"}`} sx={{ p:{xs:2,md:3} }}>
                <Grid container spacing={2.5}>
                  {[["GitHub","github"],["LinkedIn","linkedin"],["Email","email"],["Phone","phone"]].map(([label,key])=>(
                    <Grid key={key} item xs={12} md={6}><SmallTextField label={label} value={socials[key]||""} onChange={(e)=>setSocials((p)=>({...p,[key]:e.target.value}))} /></Grid>
                  ))}
                  <Grid item xs={12}><SmallTextField label="Website" value={socials.website||""} onChange={(e)=>setSocials((p)=>({...p,website:e.target.value}))} /></Grid>
                </Grid>
              </Paper>
            </Box>
          )}

          {/* ══════════════════════════════════════════════════════ RESUME */}
          {active==="resume" && (
            <Box className="adm-page-enter">
              <SectionHeader
                title="Resume Manager" subtitle="Upload, preview and set primary"
                right={
                  <Button component="label" className="adm-btn-primary" size="small" startIcon={<MdUpload />} fullWidth={isMobile}>
                    Upload Resume
                    <input hidden type="file" accept="application/pdf" onChange={(e)=>e.target.files?.[0]&&onUploadResume(e.target.files[0])} />
                  </Button>
                }
              />

              {/* Current resume panel */}
              <Paper elevation={0} className={`adm-glass adm-neon-top ${isDark?"":"adm-glass-light"}`} sx={{ p:{xs:2,md:2.5}, mb:2.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
                  <Typography sx={{ fontWeight:700, opacity:0.60, fontSize:"0.875rem" }}>Current Active Resume</Typography>
                  <OBtn startIcon={<MdVisibility />} onClick={previewCurrentResumeInline}>Preview Current</OBtn>
                </Stack>
              </Paper>

              {/* Resumes table */}
              <TableWrap>
                <Table size="small">
                  <THead cols={[{label:"#",sx:{width:50}},{label:"File"},{label:"Status",sx:{width:120}},{label:"Uploaded",sx:{width:140}},{label:"Actions",sx:{width:130,textAlign:"right"}}]} />
                  <TableBody>
                    {[...resumes].sort((a,b)=>(b.primary===true?1:0)-(a.primary===true?1:0)).map((r,idx)=>{
                      const isPrimary = Boolean(r.primary);
                      return (
                        <TRow key={r.id||idx}>
                          <TC sx={{opacity:0.55, fontWeight:600}}>{idx+1}</TC>
                          <TC bold sx={{maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.fileName||"Resume.pdf"}</TC>
                          <TC>
                            {isPrimary
                              ? <Chip size="small" label="PRIMARY" icon={<MdStar style={{color:"#ff9800",fontSize:"0.85rem"}} />} className="adm-chip-primary" />
                              : <Typography variant="caption" sx={{opacity:0.4}}>—</Typography>}
                          </TC>
                          <TC sx={{opacity:0.65, fontSize:"0.8rem"}}>{formatDate(r.uploadedAt)}</TC>
                          <TC sx={{textAlign:"right"}}>
                            <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                              <Tooltip title="Push to Viewer">
                                <IconButton size="small" className={`adm-icon-btn ${isDark?"":"adm-icon-btn-light"}`} onClick={()=>handlePushResume(r)}><MdUpload /></IconButton>
                              </Tooltip>
                              <Tooltip title="More">
                                <IconButton size="small" className={`adm-icon-btn ${isDark?"":"adm-icon-btn-light"}`} onClick={(e)=>openResumeMenu(e,r)}><MdMoreHoriz /></IconButton>
                              </Tooltip>
                            </Stack>
                          </TC>
                        </TRow>
                      );
                    })}
                    {resumes.length===0 && <TRow><TC colSpan={5} sx={{opacity:0.55}}>No resumes uploaded.</TC></TRow>}
                  </TableBody>
                </Table>
              </TableWrap>

              {/* Resume context menu */}
              <Menu anchorEl={resumeMenuAnchor} open={Boolean(resumeMenuAnchor)} onClose={closeResumeMenu} className="adm-menu">
                <MenuItem onClick={previewSelectedResumeInline}><ListItemIcon sx={{minWidth:34}}><MdVisibility /></ListItemIcon>Preview</MenuItem>
                <MenuItem onClick={makePrimaryResume}><ListItemIcon sx={{minWidth:34}}><MdStar /></ListItemIcon>Make Primary</MenuItem>
                <Divider className={isDark?"adm-divider":"adm-divider-light"} />
                <MenuItem onClick={deleteResume} sx={{color:"error.main"}}><ListItemIcon sx={{minWidth:34,color:"error.main"}}><MdDelete /></ListItemIcon>Delete</MenuItem>
              </Menu>

              <ResumePreviewDialog open={resumePreviewOpen} title={resumePreviewTitle} onClose={closeResumePreview} url={viewResumeUrl()} blobUrl={resumePreviewBlobUrl} loading={resumePreviewLoading} />

              {/* Push success dialog */}
              <Dialog open={pushDialog.open} onClose={()=>setPushDialog({open:false,name:""})} className={isDark?"adm-dialog":"adm-dialog adm-dialog-light"}>
                <DialogTitle className="adm-dialog-title">Resume Pushed ✓</DialogTitle>
                <DialogContent>
                  <Typography sx={{fontWeight:600,opacity:0.85}}>
                    "{pushDialog.name}" is now the active resume on the viewer page.
                  </Typography>
                </DialogContent>
                <DialogActions sx={{p:2}}>
                  <Button className="adm-btn-primary" onClick={()=>setPushDialog({open:false,name:""})}>OK</Button>
                </DialogActions>
              </Dialog>
            </Box>
          )}

          {/* Shared confirm dialog */}
          <ConfirmDialog
            open={confirmOpen}
            title={confirmPayload.title}
            description={confirmPayload.description}
            confirmText={confirmPayload.confirmText}
            onClose={()=>setConfirmOpen(false)}
            onConfirm={confirmPayload.onConfirm||(() =>setConfirmOpen(false))}
          />

        </Container>
      </Box>
    </Box>
  );
}