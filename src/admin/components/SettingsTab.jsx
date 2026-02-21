import React from "react";
import { Box, Typography, Stack, Chip } from "@mui/material";

const SettingsTab = () => {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  return (
    <Box sx={{ mt: 3 }}>
      <Stack spacing={2}>
        <Box
          sx={{
            borderRadius: 2,
            border: "1px solid rgba(0,0,0,0.08)",
            p: 3,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Account
          </Typography>
          {user ? (
            <>
              <Typography variant="body2">{user.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              You are not logged in.
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            borderRadius: 2,
            border: "1px solid rgba(0,0,0,0.08)",
            p: 3,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Plan
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Current plan
          </Typography>
          <Chip label={user?.plan || "free"} size="small" />
        </Box>
      </Stack>
    </Box>
  );
};

export default SettingsTab;

