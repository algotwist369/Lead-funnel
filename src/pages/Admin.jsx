import React, { useState } from "react";
import { Box, Tabs, Tab, Typography, AppBar, Toolbar } from "@mui/material";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import ProjectsTab from "../admin/components/ProjectsTab";
import LeadsTab from "../admin/components/LeadsTab";
import SettingsTab from "../admin/components/SettingsTab";

const adminTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#020617",
      paper: "#0f172a",
    },
    primary: {
      main: "#38bdf8",
    },
    success: {
      main: "#22c55e",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
    },
    divider: "rgba(148,163,184,0.18)",
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
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
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
  },
});

const Admin = () => {
  const [tab, setTab] = useState(0);

  const handleChange = (event, newValue) => {
    setTab(newValue);
  };

  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(2,6,23,0.9)",
          color: "text.primary",
          borderBottom: "1px solid rgba(148,163,184,0.18)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Toolbar sx={{ maxWidth: 1200, mx: "auto", width: "100%", px: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800, fontSize: { xs: 18, sm: 20 } }}>
            Lead Funnel Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          width: "100%",
          px: { xs: 1.5, sm: 2.5, md: 3 },
          pb: { xs: 4, sm: 6 },
          pt: { xs: 2, sm: 3 },
        }}
      >
        <Box
          sx={{
            borderRadius: { xs: 2, sm: 3 },
            bgcolor: "background.paper",
            boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
            border: "1px solid rgba(148,163,184,0.16)",
            px: { xs: 1.5, sm: 3 },
            pt: { xs: 1, sm: 2 },
            pb: { xs: 2, sm: 3 },
            overflow: "hidden",
          }}
        >
          <Tabs
            value={tab}
            onChange={handleChange}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{
              borderBottom: "1px solid rgba(148,163,184,0.18)",
              minHeight: 48,
              "& .MuiTab-root": {
                minHeight: 48,
                fontWeight: 700,
                textTransform: "none",
                color: "text.secondary",
                "&.Mui-selected": {
                  color: "primary.main",
                },
              },
            }}
          >
            <Tab label="Projects" />
            <Tab label="Leads" />
            <Tab label="Settings" />
          </Tabs>

          {tab === 0 && <ProjectsTab />}
          {tab === 1 && <LeadsTab />}
          {tab === 2 && <SettingsTab />}
        </Box>
      </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Admin;
