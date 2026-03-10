import React, { useMemo, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const makeTheme = (mode, flavor = "viewer") => {
  const viewerPrimary = "#7C3AED";
  const viewerSecondary = "#06B6D4";

  const adminPrimary = "#F59E0B";
  const adminSecondary = "#3B82F6";

  const primary = flavor === "admin" ? adminPrimary : viewerPrimary;
  const secondary = flavor === "admin" ? adminSecondary : viewerSecondary;

  return createTheme({
    palette: {
      mode,
      primary: { main: primary },
      secondary: { main: secondary },
      background: {
        default: mode === "dark" ? "#0B1220" : "#F6F7FB",
        paper: mode === "dark" ? "#0F1A2B" : "#FFFFFF",
      },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: `"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial`,
    },
  });
};

export default function App() {
  // viewer theme
  const [viewerDark, setViewerDark] = useState(
    localStorage.getItem("viewer_theme")
      ? localStorage.getItem("viewer_theme") === "dark"
      : true
  );

  // admin theme
  const [adminDark, setAdminDark] = useState(
    localStorage.getItem("admin_theme")
      ? localStorage.getItem("admin_theme") === "dark"
      : true
  );

  // 🔥 IMPORTANT: reactive login state
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  // 🔥 watch token changes live
  useEffect(() => {
    const checkToken = () => {
      setLoggedIn(!!localStorage.getItem("token"));
    };

    window.addEventListener("storage", checkToken);
    window.addEventListener("focus", checkToken);

    return () => {
      window.removeEventListener("storage", checkToken);
      window.removeEventListener("focus", checkToken);
    };
  }, []);
  

  const viewerTheme = useMemo(
    () => makeTheme(viewerDark ? "dark" : "light", "viewer"),
    [viewerDark]
  );

  const adminTheme = useMemo(
    () => makeTheme(adminDark ? "dark" : "light", "admin"),
    [adminDark]
  );

  const toggleViewerTheme = () => {
    setViewerDark((prev) => {
      const next = !prev;
      localStorage.setItem("viewer_theme", next ? "dark" : "light");
      return next;
    });
  };

  const toggleAdminTheme = () => {
    setAdminDark((prev) => {
      const next = !prev;
      localStorage.setItem("admin_theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <BrowserRouter>
      <Routes>

        {/* VIEWER */}
        <Route
          path="/"
          element={
            <ThemeProvider theme={viewerTheme}>
              <CssBaseline />
              <Home toggleTheme={toggleViewerTheme} />
            </ThemeProvider>
          }
        />

        {/* ADMIN LOGIN */}
        <Route
          path="/admin/login"
          element={
            <ThemeProvider theme={adminTheme}>
              <CssBaseline />
              <AdminLogin />
            </ThemeProvider>
          }
        />

        {/* ADMIN DASHBOARD */}
        <Route
          path="/admin"
          element={
            loggedIn ? (
              <ThemeProvider theme={adminTheme}>
                <CssBaseline />
                <AdminDashboard setDarkMode={toggleAdminTheme} />
              </ThemeProvider>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
