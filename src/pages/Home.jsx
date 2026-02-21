import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SendIcon from "@mui/icons-material/Send";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../utils/api";

const Home = () => {
  const { slug } = useParams();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    q1: "",
    q2: "",
    q3: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    preferred_contact: "call",
  });

  const {
    data: funnel,
    isLoading: isFunnelLoading,
    isError: isFunnelError,
    error: funnelError,
  } = useQuery({
    queryKey: ["public-funnel", slug],
    enabled: !!slug,
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/funnels/public/${slug}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load project");
      }

      return data.funnel;
    },
  });

  useEffect(() => {
    if (funnel) {
      document.title = funnel.title || "Lead Funnel Dashboard";

      // Preload critical images
      if (funnel.branding?.logo_url) {
        const logoImg = new Image();
        logoImg.src = funnel.branding.logo_url;
      }
      if (funnel.branding?.background_image_url) {
        const bgImg = new Image();
        bgImg.src = funnel.branding.background_image_url;
      }

      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = funnel.branding?.logo_url || "";
    } else {
      document.title = "Lead Funnel Dashboard";
      const link = document.querySelector("link[rel~='icon']");
      if (link) {
        link.href = "";
      }
    }

    return () => {
      document.title = "Lead Funnel Dashboard";
      const link = document.querySelector("link[rel~='icon']");
      if (link) {
        link.href = "";
      }
    };
  }, [funnel]);

  const baseQuestions = [
    {
      id: 1,
      label: "Q1. What type of property are you interested in?",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
    },
    {
      id: 2,
      label: "Q2. What is your approximate budget range?",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
    },
    {
      id: 3,
      label: "Q3. How soon are you planning to move forward?",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
    },
  ];

  const handleNext = () => {
    const maxStep = questionCount + 2;
    if (!started) {
      handleStart();
      return;
    }
    setStep((prev) => (prev < maxStep ? prev + 1 : prev));
  };

  const handlePrevious = () => {
    if (!started) {
      return;
    }
    setStep((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleStart = () => {
    setStarted(true);
    setStep(1);
  };

  const handleOptionSelect = (value) => {
    const key = `q${step}`;
    const currentQuestion = questions[step - 1];

    if (currentQuestion.type === "multi") {
      const currentAnswers = answers[key] ? answers[key].split(", ") : [];
      let newAnswers;
      if (currentAnswers.includes(value)) {
        newAnswers = currentAnswers.filter((a) => a !== value);
      } else {
        newAnswers = [...currentAnswers, value];
      }
      setAnswers((prev) => ({
        ...prev,
        [key]: newAnswers.join(", "),
      }));
    } else {
      // single choice - auto advance
      setAnswers((prev) => ({
        ...prev,
        [key]: value,
      }));
      setStep((prev) => (prev < questionCount ? prev + 1 : questionCount + 1));
    }
  };

  const handleInputChange = (field, value) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submitLead = async () => {
    const payload = {
      name: answers.name,
      phone: answers.phone,
      email: answers.email,
      address: answers.address,
      preferred_contact: answers.preferred_contact || "call",
    };

    if (slug && funnel?._id) {
      payload.funnel_id = funnel._id;

      const sortedQuestions = (funnel.questions || [])
        .slice()
        .sort((a, b) => (a.step_number || 0) - (b.step_number || 0));

      const leadAnswers = sortedQuestions.map((q, index) => {
        const key = `q${index + 1}`;
        return {
          question_id: q._id,
          question_text: q.question_text,
          answer: answers[key],
        };
      });

      payload.answers = leadAnswers;
    }

    const response = await fetch(`${API_BASE_URL}/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to submit details");
    }

    return data;
  };

  const {
    mutate: submitLeadMutation,
    isPending: isSubmitting,
    isError: isSubmitError,
    error: submitError,
  } = useMutation({
    mutationFn: submitLead,
    onSuccess: () => {
      setStep(questionCount + 2);
    },
  });

  const handleSubmitDetails = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    submitLeadMutation();
  };

  const questions =
    funnel && funnel.questions && funnel.questions.length
      ? funnel.questions
        .slice()
        .sort((a, b) => (a.step_number || 0) - (b.step_number || 0))
        .map((q, index) => ({
          id: q._id || index + 1,
          label: q.question_text,
          type: q.type,
          options: (q.options || []).map((o) => o.label || o.value),
        }))
      : baseQuestions;

  const questionCount = questions.length;

  const selectedForStep =
    step >= 1 && step <= questionCount ? answers[`q${step}`] : "";

  const origin =
    typeof window !== "undefined" && window.location
      ? window.location.origin
      : "";
  const projectIdSuffix =
    slug && funnel?._id ? funnel._id.toString().slice(-3) : "";
  const shareUrl =
    slug && projectIdSuffix ? `${origin}/${slug}/${projectIdSuffix}` : "";

  const backgroundImageUrl =
    funnel?.branding?.background_image_url ||
    "https://media.istockphoto.com/id/517188688/photo/mountain-landscape.jpg?s=612x612&w=0&k=20&c=A63koPKaCyIwQWOTFBRWXj_PwCrR4cEoOw2S9Q7yVl8=";
  const logoUrl =
    funnel?.branding?.logo_url ||
    "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg";
  const primaryColor = funnel?.branding?.primary_color || "#6366f1";
  const fontFamily = funnel?.branding?.font_family || "inherit";

  const capture = funnel?.capture_step || {};
  const askName = capture.ask_name !== false;
  const askPhone = capture.ask_phone !== false;
  const askEmail = capture.ask_email === true;
  const askAddress = capture.ask_address === true;

  if (slug && isFunnelLoading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          color: "#e5e7eb",
        }}
      >
        <Typography variant="h6">Loading project...</Typography>
      </Box>
    );
  }

  if (slug && isFunnelError) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          color: "#f87171",
          textAlign: "center",
          px: 2,
        }}
      >
        <Typography variant="h6">
          {funnelError?.message || "Failed to load project"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100dvh",
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        color: "#e5e7eb",
        bgcolor: "#0f172a",
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        overflow: "hidden",
        fontFamily,
      }}
    >
      {/* Overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(15, 23, 42, 0.29)",
          zIndex: 1,
        }}
      />

      {/* Header / Logo */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          p: { xs: 2, sm: 4, lg: 2 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box
          component="img"
          src={logoUrl}
          alt="Logo"
          sx={{
            display: "block",
            height: { xs: 80, sm: 105, lg: 80 },
            maxWidth: { xs: 220, sm: 450 }, // Constrained width instead of 85%
            objectFit: "contain",
          }}
        />
        {started && step <= questionCount + 1 && (
          <Typography
            variant="body2"
            sx={{
              bgcolor: "rgba(255,255,255,0.15)",
              color: "#fff",
              px: { xs: 2, sm: 4, lg: 2 },
              py: 1.2,
              borderRadius: "20px",
              backdropFilter: "blur(8px)",
              fontSize: { xs: "1rem", sm: "1.1rem" }, // Scaled down for safe mobile view
              fontWeight: "600",
              whiteSpace: "nowrap",
            }}
          >
            {step > questionCount ? "Last step" : `${step} of ${questionCount}`}
          </Typography>
        )}
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
          px: { xs: 1.5, sm: 4 }, // Reduced side margins on mobile
          pb: { xs: 12, sm: 14 }, // More space for bottom buttons
          overflowY: "auto",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: { xs: "880px", sm: "720px", md: "890px" },
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: { xs: "24px", sm: "32px" },
            border: "1px solid rgba(255, 255, 255, 0.2)",
            p: { xs: 2.5, sm: 4 },
            textAlign: "center",
            boxShadow: "none",
          }}
        >
          {!started ? (
            <Box>
              <Typography
                fontWeight="800"
                sx={{
                  fontSize: { xs: "2.2rem", sm: "3.5rem", lg: "2.5rem" }, // Larger font for welcome
                  lineHeight: 1.1,
                  mb: 2.5,
                  background: `linear-gradient(to right, #fff, ${primaryColor})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {funnel?.title || "Welcome"}
              </Typography>
              <Typography
                className="text-start"
                sx={{
                  fontWeight: "500",
                  opacity: 0.9,
                  fontSize: { xs: "1.4rem", sm: "2rem", lg: "1.2rem" }, // Increased for mobile
                  mb: 5,
                  maxWidth: "800px",
                  mx: "auto",
                  lineHeight: 1.5,
                }}
              >
                {funnel?.description || "Take a moment to share your preferences."}
              </Typography>

              <Button
                variant="contained"
                onClick={handleStart}
                sx={{
                  display: "block",
                  mx: "auto",
                  width: { xs: "200px", sm: "240px" },
                  py: { xs: 2, sm: 2, lg: 1.2 },
                  borderRadius: "18px",
                  fontSize: { xs: "1.6rem", sm: "1.7rem" },
                  fontWeight: "bold",
                  textTransform: "none",
                  bgcolor: primaryColor,
                  boxShadow: "none",
                  "&:hover": { bgcolor: primaryColor, opacity: 0.95, boxShadow: "none" },
                }}
              >
                Start
              </Button>

              <Box
                sx={{
                  mt: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.2,
                  opacity: 0.7,
                }}
              >
                <AccessTimeIcon sx={{ fontSize: 25 }} />
                <Typography variant="body2" fontWeight="100" sx={{ fontSize: "1.5rem" }}>Takes about 30 seconds</Typography>
              </Box>
            </Box>
          ) : step <= questionCount ? (
            <Box>
              <Typography
                fontWeight="700"
                sx={{
                  fontSize: { xs: "1.7rem", sm: "2.5rem", lg: "1.8rem" }, // Significantly larger question text
                  lineHeight: 1.3,
                  mb: 5,
                  color: "#fff",
                }}
              >
                Q {questions[step - 1].label}
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {(questions[step - 1].type === "single" ||
                  questions[step - 1].type === "multi" ||
                  !questions[step - 1].type) &&
                  questions[step - 1].options.map((option, index) => {
                    const isSelected =
                      questions[step - 1].type === "multi"
                        ? answers[`q${step}`]?.split(", ").includes(option)
                        : selectedForStep === option;

                    return (
                      <Box
                        key={option}
                        onClick={() => handleOptionSelect(option)}
                        sx={{
                          p: { xs: 2.5, sm: 2.3, lg: 1.2 }, // Increased padding for mobile cards
                          borderRadius: "20px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 2.5,
                          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                          background: isSelected
                            ? `${primaryColor}33`
                            : "rgba(255,255,255,0.04)",
                          border: "2px solid", // Slightly thicker border
                          borderColor: isSelected
                            ? primaryColor
                            : "rgba(255,255,255,0.12)",
                          "&:hover": {
                            background: isSelected
                              ? `${primaryColor}44`
                              : "rgba(255,255,255,0.08)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 28, // Larger radio/checkbox indicators
                            height: 28,
                            borderRadius: questions[step - 1].type === "multi" ? "8px" : "50%",
                            border: "2.5px solid",
                            borderColor: isSelected ? primaryColor : "rgba(255,255,255,0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            bgcolor: isSelected ? primaryColor : "transparent",
                          }}
                        >
                          {isSelected && (
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: questions[step - 1].type === "multi" ? "2px" : "50%",
                                bgcolor: "#fff",
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          sx={{
                            fontSize: { xs: "1.25rem", sm: "1.8rem" }, // Significantly larger for mobile
                            fontWeight: isSelected ? "700" : "500",
                            color: isSelected ? "#fff" : "rgba(255,255,255,0.9)",
                            textAlign: "left",
                          }}
                        >
                          {option}
                        </Typography>
                      </Box>
                    );
                  })}

                {(questions[step - 1].type === "input" ||
                  questions[step - 1].type === "textarea") && (
                    <TextField
                      variant="outlined"
                      placeholder="Type your answer here..."
                      multiline={questions[step - 1].type === "textarea"}
                      rows={questions[step - 1].type === "textarea" ? 4 : 1}
                      value={answers[`q${step}`] || ""}
                      onChange={(e) => handleInputChange(`q${step}`, e.target.value)}
                      fullWidth
                      autoFocus
                      sx={inputStyle(primaryColor)}
                    />
                  )}
              </Box>
            </Box>
          ) : step === questionCount + 1 ? (
            <Box component="form" onSubmit={handleSubmitDetails}>
              <Typography sx={{ opacity: 0.85, fontSize: {sm: "1.9rem",lg:"1.5rem"}, mb: 4 }}>
                Please provide your details to receive the information.
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.9 }}>
                {askName && (
                  <TextField
                    variant="outlined"
                    label="Full Name"
                    value={answers.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    fullWidth
                    required
                    sx={inputStyle(primaryColor)}
                  />
                )}
                {askPhone && (
                  <TextField
                    variant="outlined"
                    label="Phone Number"
                    value={answers.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    fullWidth
                    required
                    sx={inputStyle(primaryColor)}
                  />
                )}
                {askEmail && (
                  <TextField
                    variant="outlined"
                    label="Email Address"
                    type="email"
                    value={answers.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    fullWidth
                    sx={inputStyle(primaryColor)}
                  />
                )}
                {askAddress && (
                  <TextField
                    variant="outlined"
                    label="Address"
                    multiline
                    rows={2}
                    value={answers.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    fullWidth
                    sx={inputStyle(primaryColor)}
                  />
                )}

                <Box sx={{ mt: 2 }}>
                  <Typography
                    sx={{
                      textAlign: "left",
                      mb: 2,
                      opacity: 0.9,
                      fontSize: { xs: "1.2rem", sm: "1.4rem" },
                      fontWeight: "500"
                    }}
                  >
                    How would you like us to connect you?
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    {["call", "whatsapp"].map((method) => (
                      <Button
                        key={method}
                        variant={answers.preferred_contact === method ? "contained" : "outlined"}
                        onClick={() => handleInputChange("preferred_contact", method)}
                        sx={{
                          flex: 1,
                          borderRadius: "16px",
                          textTransform: "capitalize",
                          py: { xs: 2, sm: 1, lg: 1 },
                          fontSize: { xs: "1.1rem", sm: "1.2rem" },
                          fontWeight: "700",
                          bgcolor: answers.preferred_contact === method ? primaryColor : "transparent",
                          borderColor: primaryColor,
                          color: "#fff",
                          "&:hover": { borderColor: primaryColor, bgcolor: answers.preferred_contact === method ? primaryColor : "rgba(255,255,255,0.05)" },
                        }}
                      >
                        {method}
                      </Button>
                    ))}
                  </Box>
                </Box>

                {/* Mobile-only Send Button within the form card */}
                <Button
                  variant="contained"
                  onClick={handleSubmitDetails}
                  disabled={isSubmitting || !answers.name}
                  sx={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                    mt: 3,
                    py: { lg: 1, xs: 1 },
                    borderRadius: "18px",
                    fontWeight: "bold",
                    fontSize: "1.2rem",
                    bgcolor: primaryColor,
                    boxShadow: "none",
                    "&:hover": { bgcolor: primaryColor, opacity: 0.9, boxShadow: "none" },
                    gap: 1.5,
                  }}
                >
                  Send <SendIcon sx={{ fontSize: 24 }} />
                </Button>
              </Box>

              {isSubmitError && (
                <Typography color="error" variant="caption" sx={{ mt: 2, display: "block" }}>
                  {submitError?.message || "Something went wrong. Please try again."}
                </Typography>
              )}
            </Box>
          ) : (
            <Box sx={{ py: { xs: 2, sm: 4 } }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  bgcolor: `${primaryColor}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 3,
                  border: `2px solid ${primaryColor}`,
                }}
              >
                <Typography sx={{ fontSize: 40 }}>✔</Typography>
              </Box>
              <Typography variant="h4" fontWeight="800" gutterBottom sx={{ fontSize: { xs: "2rem", sm: "2.5rem" } }}>
                Thank You!
              </Typography>
              <Typography sx={{ opacity: 0.9, mb: 4, fontSize: { xs: "1.1rem", sm: "1.2rem" }, px: 2 }}>
                Our team will connect you soon, or you can also contact us immediately:
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: "300px", mx: "auto" }}>
                {funnel?.contact?.phone_number && (
                  <Button
                    variant="contained"
                    component="a"
                    href={`tel:${funnel.contact.phone_number}`}
                    fullWidth
                    sx={{
                      py: 1.5,
                      borderRadius: "16px",
                      bgcolor: primaryColor,
                      fontWeight: "700",
                      fontSize: "1.1rem",
                      textTransform: "none",
                      boxShadow: "none",
                      "&:hover": { bgcolor: primaryColor, opacity: 0.9, boxShadow: "none" },
                    }}
                  >
                    Call Us Now
                  </Button>
                )}
                {funnel?.contact?.whatsapp_number && (
                  <Button
                    variant="contained"
                    component="a"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://wa.me/${funnel.contact.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Hi! I'm ${answers.name}. I just completed your funnel and I'm interested.\n\n` +
                      (questions || []).map((q, i) => `${q.label}: ${answers[`q${i + 1}`] || "N/A"}`).join("\n") +
                      `\n\nPhone: ${answers.phone}\nEmail: ${answers.email}`
                    )}`}
                    fullWidth
                    sx={{
                      py: 1.5,
                      borderRadius: "16px",
                      bgcolor: "#25D366",
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: "1.1rem",
                      textTransform: "none",
                      boxShadow: "none",
                      "&:hover": { bgcolor: "#25D366", opacity: 0.9, boxShadow: "none" },
                    }}
                  >
                    WhatsApp Us
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Minimal Bottom Navigation (No Shadow/Blur) */}
      {started && step <= questionCount + 1 && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            p: { xs: 3, sm: 4 },
            bgcolor: "rgba(15, 23, 42, 0.18)", // Solid flat background
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "600px",
              display: "flex",
              justifyContent: "center",
              gap: 4,
            }}
          >
            {/* Circular Back Button */}
            <IconButton
              onClick={handlePrevious}
              disabled={step === 1}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                width: 65,
                height: 65,
                borderRadius: "50%",
                boxShadow: "none",
                "&.Mui-disabled": { opacity: 0.1, color: "#fff" },
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
              }}
            >
              <KeyboardArrowUpIcon sx={{ transform: "rotate(-90deg)", fontSize: 32 }} />
            </IconButton>

            {/* Circular Next / Submit Button */}
            <IconButton
              variant="contained"
              onClick={step === questionCount + 1 ? handleSubmitDetails : handleNext}
              disabled={
                isSubmitting ||
                (step <= questionCount &&
                  questions[step - 1].type !== "single" &&
                  !answers[`q${step}`]) ||
                (step > questionCount && !answers.name)
              }
              sx={{
                bgcolor: primaryColor,
                color: "#fff",
                width: 65,
                height: 65,
                borderRadius: "50%",
                boxShadow: "none",
                "&.Mui-disabled": { bgcolor: primaryColor, opacity: 0.4 },
                "&:hover": { bgcolor: primaryColor, opacity: 0.9, boxShadow: "none" },
              }}
            >
              {step === questionCount + 1 ? (
                <SendIcon sx={{ fontSize: 32, ml: 0.5 }} />
              ) : (
                <KeyboardArrowDownIcon
                  sx={{
                    transform: "rotate(-90deg)",
                    fontSize: 32,
                  }}
                />
              )}
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
};

const inputStyle = (primaryColor) => ({
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    bgcolor: "rgba(255,255,255,0.05)",
    borderRadius: "16px",
    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
    "&.Mui-focused fieldset": { borderColor: primaryColor },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
  },
  "& .MuiOutlinedInput-input": {
    fontSize: { xs: "1.7rem", sm: "1.8rem", lg: "1rem" },
    padding: { xs: "14px 16px", sm: "16px 20px", lg: "10px 16px" },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.5)",
    fontSize: { xs: "1rem", sm: "1.1rem", lg: "0.9rem" },
    top: { lg: -2 },
    "&.Mui-focused": { color: primaryColor },
  },
});

export default Home;
