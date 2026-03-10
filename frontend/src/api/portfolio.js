// src/api/portfolio.js
import http from "./http";

/* =========================================================
   🔐 FORCE ADMIN TOKEN FOR ALL ADMIN CALLS
========================================================= */
const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

/* =========================
   VIEWER (PUBLIC GETs)
========================= */
export const getProfile = () => http.get("/portfolio/profile");
export const getSkills = () => http.get("/portfolio/skills");
export const getFeaturedProjects = () => http.get("/projects/featured");
export const getExperience = () => http.get("/portfolio/experience");
export const getEducation = () => http.get("/portfolio/education");
export const getSocials = () => http.get("/portfolio/socials");
export const getAchievements = () => http.get("/portfolio/achievements");
export const getLanguageExperience = () => http.get("/portfolio/languages");

/* =========================
   ADMIN (Portfolio PUTs)
========================= */
export const updateProfile = (payload) =>
  http.put("/portfolio/profile", payload, authHeader());

export const updateSkills = (payload) =>
  http.put("/portfolio/skills", payload, authHeader());

export const updateSocials = (payload) =>
  http.put("/portfolio/socials", payload, authHeader());

export const saveAchievements = (payload) =>
  http.put("/portfolio/achievements", payload, authHeader());

export const saveLanguageExperience = (payload) =>
  http.put("/portfolio/languages", payload, authHeader());

export const updateEducation = (payload) =>
  http.put("/portfolio/education", payload, authHeader());

export const updateExperience = (payload) =>
  http.put("/portfolio/experience", payload, authHeader());

/* =========================
   ADMIN (Projects)
========================= */
export const getAllProjectsAdmin = () =>
  http.get("/projects", authHeader());

export const createProject = (payload) =>
  http.post("/projects", payload, authHeader());

export const updateProject = (id, payload) =>
  http.put(`/projects/${id}`, payload, authHeader());

export const deleteProject = (id) =>
  http.delete(`/projects/${id}`, authHeader());

/* =========================
   RESUME SECTION
========================= */

// upload resume
export const uploadResume = (file) => {
  const form = new FormData();
  form.append("file", file);

  return http.post("/resume/upload", form, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

// viewer download
export const downloadResumeUrl = () =>
  `${http.defaults.baseURL}/resume/download`;

export const viewResumeUrl = () =>
  `${http.defaults.baseURL}/resume/download`;

// admin list
export const listResumesAdmin = () =>
  http.get("/resume/list", authHeader());

// preview by id
export const viewResumeByIdUrl = (id) =>
  `${http.defaults.baseURL}/resume/${id}/view`;

// set primary resume
export const setPrimaryResume = (id) =>
  http.put(`/resume/${id}/primary`, {}, authHeader());

// delete resume
export const deleteResumeById = (id) =>
  http.delete(`/resume/${id}`, authHeader());

/* =========================
   AUTH
========================= */
export const adminLogin = (username, password) =>
  http.post("/auth/login", { username, password });
