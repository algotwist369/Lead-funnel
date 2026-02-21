import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  TextField,
} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
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
  const phone = funnel?.contact?.phone_number || "1234567890";
  const whatsapp = funnel?.contact?.whatsapp_number || "1234567890";

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
        height: "100vh",
        width: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "#e5e7eb",
        bgcolor: "background.default",
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(15, 23, 42, 0.45)",
        }}
      />
      <Box
        component="img"
        src={logoUrl}
        alt="Logo"
        sx={{
          position: "absolute",
          top: 20,
          right: 50,
          width: 130,
          zIndex: 2,
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1000,
          width: "90%",
          fontFamily,
        }}
      >
        {!started ? (
          <Box
            className="border-2 border-amber-600 py-2 px-1"
            sx={{
              width: "100%",
              maxWidth: { xs: "95%", sm: "85%", md: "700px", lg: "800px" },
              mx: "auto",
              textAlign: "center",
              borderRadius: "24px",
              px: { xs: 3, sm: 6, md: 8 },
              py: { xs: 4, sm: 5, md: 6 },
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            {/* Title */}
            <Typography
              fontWeight="bold"
              gutterBottom
              sx={{
                fontSize: {
                  xs: "1.6rem",
                  sm: "2rem",
                  md: "2.4rem",
                  lg: "2.8rem",
                },
                lineHeight: 1.2,
              }}
            >
              {funnel?.title || "Welcome to Our Project"}
            </Typography>

            {/* Description */}
            <Typography
              sx={{
                opacity: 0.85,
                fontSize: {
                  xs: "0.95rem",
                  sm: "1.05rem",
                  md: "1.15rem",
                  lg: "1.2rem",
                },
                maxWidth: "600px",
                mx: "auto",
              }}
            >
              {funnel?.description ||
                "Discover your future home and schedule your visit easily."}
            </Typography>

            {/* Button */}
            <Button
              variant="contained"
              onClick={handleStart}
              sx={{
                mt: { xs: 3, sm: 4 },
                px: { xs: 4, sm: 6 },
                py: { xs: 1.2, sm: 1.5 },
                fontSize: { xs: "0.9rem", sm: "1rem" },
                borderRadius: "40px",
                textTransform: "none",
                bgcolor: primaryColor,
                boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
                },
              }}
            >
              Start
            </Button>

            {/* Time Info */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                mt: 2,
                opacity: 0.75,
              }}
            >
              <AccessTimeIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
              <Typography
                sx={{
                  fontSize: { xs: "0.8rem", sm: "0.9rem" },
                }}
              >
                It takes about 30–40 seconds max.
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            {step >= 1 && step <= questionCount && (
              <Box className="border-2 py-12 px-12 rounded-2xl bg-white/10 backdrop-blur-[2px] border-white/20">
                <Typography variant="h5" sx={{ mb: 1, opacity: 0.8 }}>
                  {step} / {questionCount}
                </Typography>

                <Typography
                  fontWeight="bold"
                  sx={{
                    mb: { xs: 2, sm: 3, md: 4 },
                    fontSize: {
                      xs: "1.3rem",
                      sm: "1.6rem",
                      md: "1.9rem",
                      lg: "2.2rem",
                      xl: "2.5rem",
                    },
                    lineHeight: 1.3,
                  }}
                >
                  Q{step} {questions[step - 1].label}
                </Typography>

                {(questions[step - 1].type === "single" ||
                  questions[step - 1].type === "multi" ||
                  !questions[step - 1].type) && (
                    <RadioGroup
                      value={selectedForStep}
                      onChange={(e) => handleOptionSelect(e.target.value)}
                    >
                      {questions[step - 1].options.map((option, index) => {
                        const letter = String.fromCharCode(65 + index);
                        const isSelected =
                          questions[step - 1].type === "multi"
                            ? answers[`q${step}`]?.split(", ").includes(option)
                            : selectedForStep === option;

                        return (
                          <FormControlLabel
                            key={option}
                            value={option}
                            control={<Radio sx={{ display: "none" }} />}
                            label={
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: { xs: 1.5, sm: 2 },
                                  width: "100%",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: { xs: 24, sm: 28, md: 32 },
                                    height: { xs: 24, sm: 28, md: 32 },
                                    borderRadius: "50%",
                                    border: "1px solid rgba(255,255,255,0.6)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: { xs: 12, sm: 14, md: 15 },
                                    fontWeight: "bold",
                                    backdropFilter: "blur(10px)",
                                    background: "rgba(17, 16, 16, 0.47)",
                                  }}
                                >
                                  {letter}
                                </Box>

                                <Typography
                                  sx={{
                                    fontSize: {
                                      xs: "0.9rem",
                                      sm: "1rem",
                                      md: "1.05rem",
                                      lg: "1.1rem",
                                    },
                                  }}
                                >
                                  {option}
                                </Typography>
                              </Box>
                            }
                            sx={{
                              mb: { xs: 1.5, sm: 2 },
                              borderRadius: "30px",
                              width: "100%",
                              padding: { xs: "10px 16px", sm: "12px 20px" },
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                              backdropFilter: "blur(16px)",
                              WebkitBackdropFilter: "blur(16px)",
                              background: isSelected
                                ? "rgba(37, 35, 35, 0.51)"
                                : "rgba(24, 22, 22, 0.2)",
                              border: isSelected
                                ? "1px solid rgba(235, 225, 225, 0.86)"
                                : "1px solid rgba(243, 238, 238, 0.45)",
                              "&:hover": {
                                background: "rgba(36, 31, 31, 0.6)",
                                transform: "scale(1.02)",
                              },
                            }}
                          />
                        );
                      })}
                    </RadioGroup>
                  )}

                {(questions[step - 1].type === "input" ||
                  questions[step - 1].type === "textarea") && (
                    <Box sx={{ mt: 2, mb: 4 }}>
                      <TextField
                        variant="filled"
                        label="Your answer"
                        multiline={questions[step - 1].type === "textarea"}
                        minRows={questions[step - 1].type === "textarea" ? 3 : 1}
                        value={answers[`q${step}`] || ""}
                        onChange={(e) =>
                          handleInputChange(`q${step}`, e.target.value)
                        }
                        fullWidth
                        autoFocus
                        sx={{
                          input: { color: "#fff" },
                          textarea: { color: "#fff" },
                          "& .MuiFilledInput-root": {
                            background: "rgba(255,255,255,0.05)",
                            backdropFilter: "blur(10px)",
                            borderRadius: "12px",
                          },
                        }}
                        InputLabelProps={{
                          style: { color: "rgba(255,255,255,0.7)" },
                        }}
                      />
                    </Box>
                  )}

                {questions[step - 1].type &&
                  questions[step - 1].type !== "single" && (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{
                        mt: 2,
                        mb: 2,
                        px: { xs: 4, sm: 6 },
                        py: { xs: 1.2, sm: 1.5 },
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        borderRadius: "40px",
                        textTransform: "none",
                        bgcolor: primaryColor,
                        boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-3px)",
                          boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
                        },
                      }}
                    >
                      Next
                    </Button>
                  )}
              </Box>
            )}

            {step === questionCount + 1 && (
              <Box
                component="form"
                onSubmit={handleSubmitDetails}
                sx={{
                  width: "100%",
                  maxWidth: { xs: "95%", sm: "85%", md: "700px", lg: "800px" },
                  mx: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 2, sm: 2.5 },
                  px: { xs: 3, sm: 6, md: 8 },
                  py: { xs: 4, sm: 5, md: 6 },
                  borderRadius: "24px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                }}
              >
                {/* Heading */}
                <Typography
                  fontWeight="bold"
                  sx={{
                    mb: 1,
                    fontSize: {
                      xs: "1.4rem",
                      sm: "1.8rem",
                      md: "2.2rem",
                    },
                  }}
                >
                  Share your contact details
                </Typography>

                {/* Input Style Shared */}
                {askName && (
                  <TextField
                    variant="filled"
                    label="Name"
                    value={answers.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    fullWidth
                    sx={{
                      input: { color: "#fff" },
                      "& .MuiFilledInput-root": {
                        background: "rgba(255,255,255,0.05)",
                        backdropFilter: "blur(10px)",
                      },
                    }}
                    InputLabelProps={{
                      style: { color: "rgba(255,255,255,0.7)" },
                    }}
                  />
                )}

                {askPhone && (
                  <TextField
                    variant="filled"
                    label="Phone number"
                    value={answers.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    fullWidth
                    sx={{
                      input: { color: "#fff" },
                      "& .MuiFilledInput-root": {
                        background: "rgba(255,255,255,0.05)",
                        backdropFilter: "blur(10px)",
                      },
                    }}
                    InputLabelProps={{
                      style: { color: "rgba(255,255,255,0.7)" },
                    }}
                  />
                )}

                {askEmail && (
                  <TextField
                    variant="filled"
                    label="Email (Optional)"
                    type="email"
                    value={answers.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    fullWidth
                    sx={{
                      input: { color: "#fff" },
                      "& .MuiFilledInput-root": {
                        background: "rgba(255,255,255,0.05)",
                        backdropFilter: "blur(10px)",
                      },
                    }}
                    InputLabelProps={{
                      style: { color: "rgba(255,255,255,0.7)" },
                    }}
                  />
                )}

                {askAddress && (
                  <TextField
                    variant="filled"
                    label="Address"
                    multiline
                    minRows={2}
                    value={answers.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    fullWidth
                    sx={{
                      textarea: { color: "#fff" },
                      "& .MuiFilledInput-root": {
                        background: "rgba(255,255,255,0.05)",
                        backdropFilter: "blur(10px)",
                      },
                    }}
                    InputLabelProps={{
                      style: { color: "rgba(255,255,255,0.7)" },
                    }}
                  />
                )}

                {/* Preferred Contact */}
                <Box>
                  <Typography
                    className="text-start"
                    sx={{
                      fontSize: { xs: "1rem", sm: "1.3rem" },
                      color: "#fff",
                      mt: 0,
                      mb: 2,
                    }}
                  >
                    {"How would you like to be contacted?"}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 2,
                      mt: 1,
                    }}>
                    <Button
                      variant={
                        answers.preferred_contact === "call"
                          ? "contained"
                          : "outlined"
                      }
                      onClick={() =>
                        handleInputChange("preferred_contact", "call")
                      }
                      sx={{
                        flex: 1,
                        borderRadius: "999px",
                        py: { xs: 1.2, sm: 1.4 },
                        backdropFilter: "blur(10px)",
                        color: "#fff",
                        borderColor: "#fff",
                      }}
                    >
                      Prefer Call
                    </Button>

                    <Button
                      variant={
                        answers.preferred_contact === "whatsapp"
                          ? "contained"
                          : "outlined"
                      }
                      onClick={() =>
                        handleInputChange("preferred_contact", "whatsapp")
                      }
                      sx={{
                        flex: 1,
                        borderRadius: "999px",
                        py: { xs: 1.2, sm: 1.4 },
                        backdropFilter: "blur(10px)",
                        color: "#fff",
                        borderColor: "#fff",
                      }}
                    >
                      Prefer WhatsApp
                    </Button>
                  </Box>


                </Box>

                {/* Error */}
                {isSubmitError && (
                  <Typography
                    sx={{
                      fontSize: { xs: "0.8rem", sm: "0.9rem" },
                      color: "#ff6b6b",
                    }}
                  >
                    {submitError?.message || "Something went wrong"}
                  </Typography>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    mt: 2,
                    borderRadius: "40px",
                    py: { xs: 1.2, sm: 1.5 },
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    textTransform: "none",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </Box>
            )}

            {step === questionCount + 2 && (
              <Box
                sx={{
                  width: "100%",
                  maxWidth: { xs: "95%", sm: "85%", md: "700px", lg: "800px" },
                  mx: "auto",
                  textAlign: "center",
                  px: { xs: 3, sm: 6, md: 8 },
                  py: { xs: 4, sm: 5, md: 6 },
                  borderRadius: "24px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                }}
              >
                {/* Heading */}
                <Typography
                  fontWeight="bold"
                  sx={{
                    mb: 2,
                    fontSize: {
                      xs: "1.4rem",
                      sm: "1.8rem",
                      md: "2.2rem",
                    },
                  }}
                >
                  Thank You for Connecting With Us
                </Typography>

                {/* Professional Message */}
                <Typography
                  sx={{
                    mb: 4,
                    opacity: 0.85,
                    fontSize: {
                      xs: "0.95rem",
                      sm: "1.05rem",
                      md: "1.15rem",
                    },
                    maxWidth: "600px",
                    mx: "auto",
                    lineHeight: 1.6,
                  }}
                >
                  We appreciate your interest. Our team will review your details and get in touch with you shortly.
                  If you prefer immediate assistance, feel free to call or message us on WhatsApp.
                </Typography>

                {/* CTA Buttons */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    component="a"
                    href={`tel:${phone}`}
                    sx={{
                      px: { xs: 4, sm: 5 },
                      py: { xs: 1.2, sm: 1.5 },
                      borderRadius: "40px",
                      textTransform: "none",
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    Call Us
                  </Button>

                  <Button
                    variant="outlined"
                    component="a"
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                      (() => {
                        let msg = `*Lead Submission - ${funnel?.title || "Project"}*\n\n`;
                        msg += `*Name:* ${answers.name}\n`;
                        msg += `*Phone:* ${answers.phone}\n`;
                        if (answers.email) msg += `*Email:* ${answers.email}\n`;
                        msg += `\n*Questions & Answers:*\n`;
                        questions.forEach((q, idx) => {
                          const ansForQ = answers[`q${idx + 1}`];
                          msg += `Q${idx + 1}: ${q.label}\nA: ${ansForQ || "N/A"}\n\n`;
                        });
                        return msg;
                      })()
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      px: { xs: 4, sm: 5 },
                      py: { xs: 1.2, sm: 1.5 },
                      borderRadius: "40px",
                      textTransform: "none",
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      borderColor: "rgba(255,255,255,0.7)",
                      color: "#fff",
                      backdropFilter: "blur(10px)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        background: "rgba(255,255,255,0.1)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    WhatsApp Us
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* 🔹 Bottom Right Arrows (UNCHANGED) */}
      <Box
        sx={{
          position: "absolute",
          bottom: { xs: 20, sm: 30 },   // slightly closer on mobile
          right: { xs: 20, sm: 30 },
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <IconButton
          sx={{
            backgroundColor: "rgba(30,64,175,0.7)",
            color: "#e5e7eb",
            width: { xs: 86, sm: 84 },     // bigger on mobile
            height: { xs: 86, sm: 84 },
          }}
          onClick={handlePrevious}
        >
          <KeyboardArrowUpIcon
            sx={{
              fontSize: { xs: 66, sm: 68 }, // larger icon on mobile
            }}
          />
        </IconButton>

        <IconButton
          sx={{
            backgroundColor: "rgba(30,64,175,0.7)",
            color: "#e5e7eb",
            width: { xs: 86, sm: 84 },     // bigger on mobile
            height: { xs: 86, sm: 84 },
          }}
          onClick={handleNext}
        >
          <KeyboardArrowDownIcon
            sx={{
              fontSize: { xs: 66, sm: 68 },
            }}
          />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Home;
