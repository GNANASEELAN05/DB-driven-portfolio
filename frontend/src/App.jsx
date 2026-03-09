import React, { useMemo, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const makeTheme = (mode, flavor = "viewer") => {
  const viewerPrimary = mode === "dark" ? "#f13024" : "#e11d48";
  const viewerSecondary = mode === "dark" ? "#131424" : "#f8fafc";

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
        default: mode === "dark" ? "#0f1020" : "#f6f8fc",
        paper: mode === "dark" ? "rgba(19,20,36,0.72)" : "rgba(255,255,255,0.78)",
      },
      text: {
        primary: mode === "dark" ? "#ffffff" : "#111827",
        secondary: mode === "dark" ? "rgba(255,255,255,0.7)" : "rgba(17,24,39,0.72)",
      },
    },
    shape: { borderRadius: 18 },
    typography: {
      fontFamily: `"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollBehavior: "smooth",
          },
          body: {
            overflowX: "hidden",
          },
          "*": {
            boxSizing: "border-box",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
          },
        },
      },
    },
  });
};

export default function App() {
  const [viewerDark, setViewerDark] = useState(
    localStorage.getItem("viewer_theme")
      ? localStorage.getItem("viewer_theme") === "dark"
      : true
  );

  const [adminDark, setAdminDark] = useState(
    localStorage.getItem("admin_theme")
      ? localStorage.getItem("admin_theme") === "dark"
      : true
  );

  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

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
        <Route
          path="/"
          element={
            <ThemeProvider theme={viewerTheme}>
              <CssBaseline />
              <Home toggleTheme={toggleViewerTheme} />
            </ThemeProvider>
          }
        />

        <Route
          path="/admin/login"
          element={
            <ThemeProvider theme={adminTheme}>
              <CssBaseline />
              <AdminLogin />
            </ThemeProvider>
          }
        />

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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}