import React, { useState } from "react";
import { Box, Tabs, Tab, Typography, AppBar, Toolbar } from "@mui/material";
import ProjectsTab from "../admin/components/ProjectsTab";
import LeadsTab from "../admin/components/LeadsTab";
import SettingsTab from "../admin/components/SettingsTab";

const Admin = () => {
  const [tab, setTab] = useState(0);

  const handleChange = (event, newValue) => {
    setTab(newValue);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" elevation={0} color="transparent">
        <Toolbar sx={{ maxWidth: 1200, mx: "auto", width: "100%" }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Lead Funnel Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          width: "100%",
          px: 2,
          pb: 6,
          pt: 3,
        }}
      >
        <Box
          sx={{
            borderRadius: 3,
            bgcolor: "background.paper",
            boxShadow: "none",
            px: 3,
            pt: 2,
            pb: 3,
          }}
        >
          <Tabs
            value={tab}
            onChange={handleChange}
            textColor="primary"
            indicatorColor="primary"
            sx={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
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
  );
};

export default Admin;
