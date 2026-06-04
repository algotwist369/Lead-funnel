import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import API_BASE_URL from "../utils/api";

const GOOGLE_CLIENT_ID = "437429633678-mosk9iguvlap3htfu3nd6qh50sgvq05j.apps.googleusercontent.com";

const loginRequest = async ({ id_token }) => {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id_token,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Login failed");
  }

  return data;
};

const Login = () => {
  const navigate = useNavigate();
  const [configError, setConfigError] = useState("");
  const { mutate: login, isError, error } = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/admin");
    },
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        if (!GOOGLE_CLIENT_ID) {
          setConfigError("Google login is not configured. Set VITE_GOOGLE_CLIENT_ID in your frontend environment and redeploy.");
          return;
        }

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            const id_token = response.credential;
            login({ id_token });
          },
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-login-button"),
          {
            type: "standard",
            shape: "pill",
            theme: "outline",
            text: "continue_with",
            size: "large",
            width: 320,
          }
        );
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [login]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f8fafc",
        px: { xs: 2, sm: 3 },
        py: 4,
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: "100%",
          borderRadius: 3,
          boxShadow: "0 18px 45px rgba(15,23,42,0.1)",
          bgcolor: "#fff",
          border: "1px solid rgba(15,23,42,0.06)",
        }}
      >
        <CardContent
          sx={{
            p: { xs: 3, sm: 4 },
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Login
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Continue to access your projects and leads dashboard.
            </Typography>
          </Box>

          {configError && (
            <Typography variant="body2" color="error">
              {configError}
            </Typography>
          )}

          {isError && (
            <Typography variant="body2" color="error">
              {error?.message || "Something went wrong"}
            </Typography>
          )}

          <Box
            id="google-login-button"
            sx={{
              display: "flex",
              justifyContent: "center",
              overflow: "hidden",
              width: "100%",
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
