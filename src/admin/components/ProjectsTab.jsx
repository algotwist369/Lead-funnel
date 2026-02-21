import React, { useState, memo, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  MenuItem,
  IconButton,
  InputAdornment,
  DialogContentText,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API_BASE_URL from "../../utils/api";

const fetchFunnels = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/funnels/my`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to load projects");
  }

  return data.funnels || [];
};

const emptyForm = {
  title: "",
  description: "",
  branding: {
    logo_url: "",
    logo_public_id: "",
    background_image_url: "",
    background_image_public_id: "",
    primary_color: "",
    secondary_color: "",
    font_family: "",
  },
  contact: {
    phone_number: "",
    whatsapp_number: "",
  },
  capture_step: {
    ask_name: true,
    ask_phone: true,
    ask_email: false,
    ask_address: false,
    phone_otp_verify: false,
  },
  status: "active",
  questions: [
    {
      question_text: "",
      type: "single",
      optionsText: "",
      is_required: true,
    },
  ],
};

const ProjectsTab = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [currentId, setCurrentId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedFunnelData, setSelectedFunnelData] = useState(null);

  const {
    data: funnels = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["funnels"],
    queryFn: fetchFunnels,
  });

  const toPayload = (state) => {
    const questions = state.questions
      .filter((q) => q.question_text.trim())
      .map((q, index) => {
        const options =
          q.type === "single" || q.type === "multi"
            ? (q.optionsText || "")
              .split(",")
              .map((opt) => opt.trim())
              .filter(Boolean)
              .map((opt) => ({ label: opt, value: opt }))
            : [];

        return {
          step_number: index + 1,
          question_text: q.question_text.trim(),
          type: q.type,
          options,
          is_required: q.is_required,
        };
      });

    return {
      title: state.title.trim(),
      description: state.description.trim(),
      branding: state.branding,
      contact: state.contact,
      capture_step: state.capture_step,
      status: state.status,
      questions,
    };
  };

  const mapFunnelToForm = (funnel) => {
    if (!funnel) return emptyForm;
    return {
      title: funnel.title || "",
      description: funnel.description || "",
      branding: {
        logo_url: funnel.branding?.logo_url || "",
        logo_public_id: funnel.branding?.logo_public_id || "",
        background_image_url: funnel.branding?.background_image_url || "",
        background_image_public_id:
          funnel.branding?.background_image_public_id || "",
        primary_color: funnel.branding?.primary_color || "",
        secondary_color: funnel.branding?.secondary_color || "",
        font_family: funnel.branding?.font_family || "",
      },
      contact: {
        phone_number: funnel.contact?.phone_number || "",
        whatsapp_number: funnel.contact?.whatsapp_number || "",
      },
      capture_step: {
        ask_name: funnel.capture_step?.ask_name ?? true,
        ask_phone: funnel.capture_step?.ask_phone ?? true,
        ask_email: funnel.capture_step?.ask_email ?? false,
        ask_address: funnel.capture_step?.ask_address ?? false,
        phone_otp_verify: funnel.capture_step?.phone_otp_verify ?? false,
      },
      status: funnel.status || "active",
      questions:
        funnel.questions?.map((q) => ({
          question_text: q.question_text || "",
          type: q.type || "single",
          optionsText:
            q.options?.map((opt) => opt.label || opt.value).join(", ") || "",
          is_required: q.is_required ?? true,
        })) || emptyForm.questions,
    };
  };

  const FunnelCard = memo(({ funnel, copiedId, onCopy, onEdit, onDelete }) => {
    const origin =
      typeof window !== "undefined" && window.location
        ? window.location.origin
        : "";
    const suffix =
      funnel && funnel._id ? funnel._id.toString().slice(-3) : "";
    const shareLink =
      origin && funnel?.slug && suffix ? `${origin}/${funnel.slug}/${suffix}` : "";

    return (
      <Box
        sx={{
          borderRadius: 2,
          border: "1px solid rgba(148,163,184,0.25)",
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {funnel.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            /{funnel.slug}
          </Typography>
          {funnel.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {funnel.description}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" color="text.secondary">
              Visits
            </Typography>
            <Typography variant="subtitle1">
              {funnel.metrics?.total_visits ?? 0}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" color="text.secondary">
              Leads
            </Typography>
            <Typography variant="subtitle1">
              {funnel.metrics?.total_leads ?? 0}
            </Typography>
          </Box>
          <Chip
            label={funnel.status === "paused" ? "Paused" : "Active"}
            color={funnel.status === "paused" ? "default" : "success"}
            size="small"
            variant="outlined"
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => onCopy(funnel, shareLink)}
          >
            {copiedId === funnel._id ? "Link Copied" : "Share Link"}
          </Button>
          <Button variant="outlined" size="small" onClick={() => onEdit(funnel)}>
            Edit
          </Button>
          <IconButton size="small" color="error" onClick={() => onDelete(funnel)}>
            <DeleteIcon />
          </IconButton>
        </Stack>
      </Box>
    );
  });

  const ProjectFormDialog = ({
    open,
    mode,
    initialData,
    onSubmit,
    onClose,
    isSubmitting,
  }) => {
    const [form, setForm] = useState(emptyForm);
    const [dialogError, setDialogError] = useState("");
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingBg, setIsUploadingBg] = useState(false);

    useEffect(() => {
      if (open) {
        setForm(initialData || emptyForm);
        setDialogError("");
      }
    }, [open, initialData]);

    const handleChangeField = (path, value) => {
      setForm((prev) => {
        const updated = { ...prev };
        let ref = updated;
        for (let i = 0; i < path.length - 1; i += 1) {
          ref[path[i]] = { ...ref[path[i]] };
          ref = ref[path[i]];
        }
        ref[path[path.length - 1]] = value;
        return updated;
      });
    };

    const handleToggleCapture = (key) => {
      setForm((prev) => ({
        ...prev,
        capture_step: {
          ...prev.capture_step,
          [key]: !prev.capture_step[key],
        },
      }));
    };

    const handleQuestionChange = (index, field, value) => {
      setForm((prev) => {
        const questions = prev.questions.map((q, i) =>
          i === index ? { ...q, [field]: value } : q
        );
        return { ...prev, questions };
      });
    };

    const handleAddQuestion = () => {
      setForm((prev) => ({
        ...prev,
        questions: [
          ...prev.questions,
          {
            question_text: "",
            type: "single",
            optionsText: "",
            is_required: true,
          },
        ],
      }));
    };

    const handleRemoveQuestion = (index) => {
      setForm((prev) => {
        const questions = prev.questions.filter((_, i) => i !== index);
        return {
          ...prev,
          questions: questions.length ? questions : prev.questions,
        };
      });
    };

    const handleSubmit = () => {
      if (!form.title.trim()) {
        setDialogError("Project title is required");
        return;
      }
      const payload = toPayload(form);
      if (!payload.questions.length) {
        setDialogError("Add at least one question");
        return;
      }
      onSubmit(payload);
    };

    const handleImageUpload = async (e, field) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("image", file);
      formData.append("field", field);

      // Pass old public ID if it exists to clean up Cloudinary
      const oldPublicId =
        field === "logo"
          ? form.branding?.logo_public_id
          : form.branding?.background_image_public_id;
      if (oldPublicId) {
        formData.append("old_public_id", oldPublicId);
      }

      if (field === "logo") setIsUploadingLogo(true);
      else setIsUploadingBg(true);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/funnels/upload`, {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: formData,
        });

        const data = await response.json();
        if (data.success) {
          const urlField = field === "logo" ? "logo_url" : "background_image_url";
          const publicIdField =
            field === "logo" ? "logo_public_id" : "background_image_public_id";

          setForm((prev) => ({
            ...prev,
            branding: {
              ...prev.branding,
              [urlField]: data.url,
              [publicIdField]: data.public_id,
            },
          }));
        } else {
          alert(data.message || "Upload failed");
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert("Failed to upload image");
      } finally {
        if (field === "logo") setIsUploadingLogo(false);
        else setIsUploadingBg(false);
      }
    };

    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>
          {mode === "create" ? "Add New Project" : "Edit Project"}
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            mt: 1,
          }}
        >
          {dialogError && (
            <Typography variant="body2" color="error">
              {dialogError}
            </Typography>
          )}
          <TextField
            label="Project title"
            value={form.title}
            onChange={(e) => handleChangeField(["title"], e.target.value)}
            autoFocus
            fullWidth
          />
          <TextField
            label="Short description"
            value={form.description}
            onChange={(e) => handleChangeField(["description"], e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="Logo URL"
              value={form.branding.logo_url}
              onChange={(e) =>
                handleChangeField(["branding", "logo_url"], e.target.value)
              }
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {isUploadingLogo ? (
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                    ) : (
                      <>
                        <input
                          accept="image/*"
                          style={{ display: "none" }}
                          id="logo-upload"
                          type="file"
                          onChange={(e) => handleImageUpload(e, "logo")}
                        />
                        <label htmlFor="logo-upload">
                          <IconButton component="span" size="small">
                            <CloudUploadIcon />
                          </IconButton>
                        </label>
                      </>
                    )}
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Background image URL"
              value={form.branding.background_image_url}
              onChange={(e) =>
                handleChangeField(
                  ["branding", "background_image_url"],
                  e.target.value
                )
              }
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {isUploadingBg ? (
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                    ) : (
                      <>
                        <input
                          accept="image/*"
                          style={{ display: "none" }}
                          id="bg-upload"
                          type="file"
                          onChange={(e) => handleImageUpload(e, "background")}
                        />
                        <label htmlFor="bg-upload">
                          <IconButton component="span" size="small">
                            <CloudUploadIcon />
                          </IconButton>
                        </label>
                      </>
                    )}
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "nowrap",
            }}
          >
            <TextField
              type="color"
              label="Primary color"
              value={form.branding.primary_color || "#6366f1"}
              onChange={(e) =>
                handleChangeField(["branding", "primary_color"], e.target.value)
              }
              sx={{ flex: 1, minWidth: 0 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="color"
              label="Secondary color"
              value={form.branding.secondary_color || "#06b6d4"}
              onChange={(e) =>
                handleChangeField(["branding", "secondary_color"], e.target.value)
              }
              sx={{ flex: 1, minWidth: 0 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Font family"
              value={form.branding.font_family || "Inter"}
              onChange={(e) =>
                handleChangeField(["branding", "font_family"], e.target.value)
              }
              sx={{ flex: 1, minWidth: 0 }}
            >
              <MenuItem value="Inter">Inter</MenuItem>
              <MenuItem value="Roboto">Roboto</MenuItem>
              <MenuItem value="Poppins">Poppins</MenuItem>
              <MenuItem value="System">System default</MenuItem>
            </TextField>
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="Contact phone number"
              value={form.contact.phone_number}
              onChange={(e) =>
                handleChangeField(["contact", "phone_number"], e.target.value)
              }
              fullWidth
            />
            <TextField
              label="WhatsApp number"
              value={form.contact.whatsapp_number}
              onChange={(e) =>
                handleChangeField(["contact", "whatsapp_number"], e.target.value)
              }
              fullWidth
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.capture_step.ask_name}
                  onChange={() => handleToggleCapture("ask_name")}
                />
              }
              label="Ask for name"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.capture_step.ask_phone}
                  onChange={() => handleToggleCapture("ask_phone")}
                />
              }
              label="Ask for phone"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.capture_step.ask_email}
                  onChange={() => handleToggleCapture("ask_email")}
                />
              }
              label="Ask for email"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.capture_step.ask_address}
                  onChange={() => handleToggleCapture("ask_address")}
                />
              }
              label="Ask for address"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.capture_step.phone_otp_verify}
                  onChange={() => handleToggleCapture("phone_otp_verify")}
                />
              }
              label="Phone OTP verify"
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={(e) => handleChangeField(["status"], e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="paused">Paused</MenuItem>
            </TextField>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Questions
            </Typography>
            {form.questions.map((q, index) => (
              <Box
                key={index}
                sx={{
                  borderRadius: 2,
                  border: "1px solid rgba(148,163,184,0.4)",
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Step {index + 1}
                </Typography>
                <TextField
                  label="Question text"
                  value={q.question_text}
                  onChange={(e) =>
                    handleQuestionChange(index, "question_text", e.target.value)
                  }
                  fullWidth
                />
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    select
                    label="Type"
                    value={q.type}
                    onChange={(e) =>
                      handleQuestionChange(index, "type", e.target.value)
                    }
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="single">Single choice</MenuItem>
                    <MenuItem value="multi">Multi choice</MenuItem>
                    <MenuItem value="input">Input</MenuItem>
                    <MenuItem value="textarea">Textarea</MenuItem>
                  </TextField>
                  {(q.type === "single" || q.type === "multi") && (
                    <TextField
                      label="Options (comma separated)"
                      value={q.optionsText}
                      onChange={(e) =>
                        handleQuestionChange(index, "optionsText", e.target.value)
                      }
                      fullWidth
                    />
                  )}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={q.is_required}
                        onChange={() =>
                          handleQuestionChange(
                            index,
                            "is_required",
                            !q.is_required
                          )
                        }
                      />
                    }
                    label="Required"
                  />
                </Box>
                {form.questions.length > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleRemoveQuestion(index)}
                    >
                      Remove question
                    </Button>
                  </Box>
                )}
              </Box>
            ))}
            <Button
              variant="outlined"
              onClick={handleAddQuestion}
              sx={{ alignSelf: "flex-start" }}
            >
              Add Question
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            sx={{ borderRadius: "999px" }}
          >
            {mode === "create"
              ? isSubmitting
                ? "Creating..."
                : "Create Project"
              : isSubmitting
                ? "Saving..."
                : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const { mutate: createFunnel, isPending: isCreating } = useMutation({
    mutationFn: async (payload) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/funnels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create project");
      }

      return data.funnel;
    },
    onSuccess: () => {
      setOpen(false);
      setCurrentId(null);
      setSelectedFunnelData(null);
      queryClient.invalidateQueries({ queryKey: ["funnels"] });
    },
    onError: (err) => {
      alert(err.message || "Failed to create project");
    },
  });

  const { mutate: updateFunnel, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, payload }) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/funnels/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update project");
      }

      return data.funnel;
    },
    onSuccess: () => {
      setOpen(false);
      setCurrentId(null);
      setSelectedFunnelData(null);
      queryClient.invalidateQueries({ queryKey: ["funnels"] });
    },
    onError: (err) => {
      alert(err.message || "Failed to update project");
    },
  });

  const { mutate: deleteFunnel, isPending: isDeleting } = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/funnels/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete project");
      }

      return data;
    },
    onSuccess: () => {
      setDeleteConfirmOpen(false);
      setFunnelToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["funnels"] });
    },
    onError: (err) => {
      alert(err.message || "Failed to delete project");
    },
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [funnelToDelete, setFunnelToDelete] = useState(null);

  const handleDeleteClick = (funnel) => {
    setFunnelToDelete(funnel);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (funnelToDelete) {
      deleteFunnel(funnelToDelete._id);
    }
  };

  const handleOpen = () => {
    setMode("create");
    setCurrentId(null);
    setSelectedFunnelData(emptyForm);
    setOpen(true);
  };

  const handleClose = () => {
    if (isCreating || isUpdating) return;
    setOpen(false);
    setSelectedFunnelData(null);
  };

  const handleCreateSubmit = (payload) => {
    createFunnel(payload);
  };

  const handleUpdateSubmit = (payload) => {
    if (!currentId) return;
    updateFunnel({ id: currentId, payload });
  };

  const handleEditOpen = (funnel) => {
    setMode("edit");
    setCurrentId(funnel._id);
    setSelectedFunnelData({ ...mapFunnelToForm(funnel), _id: funnel._id });
    setOpen(true);
  };

  const handleCopyLink = async (funnel, link) => {
    if (!link) return;
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
      }
      setCopiedId(funnel._id);
      setTimeout(() => {
        setCopiedId((current) => (current === funnel._id ? null : current));
      }, 2000);
    } catch (e) {
      const tempInput = document.createElement("input");
      tempInput.value = link;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      setCopiedId(funnel._id);
      setTimeout(() => {
        setCopiedId((current) => (current === funnel._id ? null : current));
      }, 2000);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      {(isLoading || isFetching) && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {isError && (
        <Typography color="error" variant="body2">
          {error?.message || "Something went wrong"}
        </Typography>
      )}

      {!isLoading && !isError && funnels.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            Your projects
          </Typography>
          <Button
            variant="contained"
            onClick={handleOpen}
            sx={{ borderRadius: "999px" }}
          >
            Add Project
          </Button>
        </Box>
      )}

      {!isLoading && !isError && funnels.length === 0 && (
        <Box
          sx={{
            borderRadius: 2,
            border: "1px dashed rgba(148,163,184,0.4)",
            p: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            No projects yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first project to start collecting leads.
          </Typography>
          <Button
            variant="contained"
            sx={{ borderRadius: "999px" }}
            onClick={handleOpen}
          >
            Add Project
          </Button>
        </Box>
      )}

      {!isLoading && !isError && funnels.length > 0 && (
        <Stack spacing={2}>
          {funnels.map((funnel) => (
            <FunnelCard
              key={funnel._id}
              funnel={funnel}
              copiedId={copiedId}
              onCopy={handleCopyLink}
              onEdit={handleEditOpen}
              onDelete={handleDeleteClick}
            />
          ))}
        </Stack>
      )}

      <ProjectFormDialog
        open={open}
        mode={mode}
        initialData={selectedFunnelData}
        isSubmitting={isCreating || isUpdating}
        onClose={handleClose}
        onSubmit={mode === "create" ? handleCreateSubmit : handleUpdateSubmit}
      />


      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !isDeleting && setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Project?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{funnelToDelete?.title}"? This
            action cannot be undone. Associated images will be removed from
            Cloudinary, but existing leads will be preserved.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectsTab;
