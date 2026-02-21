import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API_BASE_URL from "../../utils/api";

const fetchLeads = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/leads/my`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to load leads");
  }

  return data.leads || [];
};

const LeadsTab = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [preferredFilter, setPreferredFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [selectedLead, setSelectedLead] = useState(null);
  const [answersOpen, setAnswersOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: leads = [],
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
  });

  const updateStatus = async ({ id, status }) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}/leads/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to update status");
    }

    return data.lead;
  };

  const {
    mutate: changeStatus,
    isLoading: isUpdatingStatus,
  } = useMutation({
    mutationFn: updateStatus,
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["leads"] });

      const previousLeads = queryClient.getQueryData(["leads"]);

      queryClient.setQueryData(["leads"], (old) =>
        (old || []).map((lead) =>
          lead._id === id ? { ...lead, status } : lead
        )
      );

      return { previousLeads };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(["leads"], context.previousLeads);
      }
    },
    onSuccess: (updatedLead) => {
      if (!updatedLead) return;
      queryClient.setQueryData(["leads"], (old) =>
        (old || []).map((lead) =>
          lead._id === updatedLead._id ? { ...lead, ...updatedLead } : lead
        )
      );
    },
  });

  const processed = useMemo(() => {
    const term = search.toLowerCase().trim();

    let result = leads.filter((lead) => {
      const matchesSearch =
        !term ||
        (lead.name || "").toLowerCase().includes(term) ||
        (lead.phone || "").toLowerCase().includes(term) ||
        (lead.email || "").toLowerCase().includes(term) ||
        (lead.funnel_id?.title || "").toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;

      const matchesPreferred =
        preferredFilter === "all" ||
        lead.preferred_contact === preferredFilter;

      return matchesSearch && matchesStatus && matchesPreferred;
    });

    result = result.slice().sort((a, b) => {
      if (sortOrder === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortOrder === "name_asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return result;
  }, [leads, search, statusFilter, preferredFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paginated = processed.slice(start, start + pageSize);

  const handlePageChange = (_, value) => {
    setPage(value);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handlePreferredChange = (e) => {
    setPreferredFilter(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  const handleOpenAnswers = (lead) => {
    setSelectedLead(lead);
    setAnswersOpen(true);
  };

  const handleCloseAnswers = () => {
    setAnswersOpen(false);
    setSelectedLead(null);
  };

  const deleteLeadRequest = async (id) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/leads/${id}/delete`, {
      method: "PATCH",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to delete lead");
    }

    return data.lead;
  };

  const { mutate: softDeleteLead, isLoading: isDeleting } = useMutation({
    mutationFn: deleteLeadRequest,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["leads"] });

      const previousLeads = queryClient.getQueryData(["leads"]);

      queryClient.setQueryData(["leads"], (old) =>
        (old || []).filter((lead) => lead._id !== id)
      );

      return { previousLeads };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(["leads"], context.previousLeads);
      }
    },
  });

  const handleExportPdf = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsExporting(true);

    const url = `${API_BASE_URL}/leads/export/pdf?token=${encodeURIComponent(
      token
    )}`;

    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => setIsExporting(false), 1500);
  };

  if (isLoading || isFetching) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
 
  if (isError) {
    return (
      <Typography color="error" variant="body2" sx={{ mt: 3 }}>
        {error?.message || "Something went wrong"}
      </Typography>
    );
  }
 
  return (
    <Box sx={{ mt: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 2 }}
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <TextField
          size="small"
          label="Search leads"
          placeholder="Search by name, phone, email or funnel"
          value={search}
          onChange={handleSearchChange}
          sx={{ flex: 2 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="new">New</MenuItem>
            <MenuItem value="contacted">Contacted</MenuItem>
            <MenuItem value="converted">Converted</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Preferred</InputLabel>
          <Select
            label="Preferred"
            value={preferredFilter}
            onChange={handlePreferredChange}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="call">Call</MenuItem>
            <MenuItem value="whatsapp">WhatsApp</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sort</InputLabel>
          <Select
            label="Sort"
            value={sortOrder}
            onChange={handleSortChange}
          >
            <MenuItem value="newest">Newest first</MenuItem>
            <MenuItem value="oldest">Oldest first</MenuItem>
            <MenuItem value="name_asc">Name A–Z</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          size="small"
          variant="outlined"
          onClick={handleExportPdf}
          disabled={isExporting}
        >
          {isExporting ? "Exporting..." : "Export PDF"}
        </Button>
      </Stack>
 
      {!processed.length ? (
        <Typography variant="body2" color="text.secondary">
          No leads match your search and filters.
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Lead details</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Preferred</TableCell>
                <TableCell>UTM source</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Answers</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((lead) => {
                const funnelTitle =
                  lead.funnel_title || lead.funnel_id?.title || "-";
                const funnelSlug =
                  lead.funnel_slug || lead.funnel_id?.slug || null;
                const utmSource = lead.utm?.source || "-";

                return (
                  <TableRow key={lead._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {funnelTitle}
                      </Typography>
                      {funnelSlug && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          {funnelSlug}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {lead.name || "-"}
                      </Typography>
                      <Typography variant="body2">{lead.phone}</Typography>
                      {lead.email && (
                        <Typography variant="caption" color="text.secondary">
                          {lead.email}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                          label="Status"
                          value={lead.status}
                          disabled={isUpdatingStatus}
                          onChange={(e) =>
                            changeStatus({
                              id: lead._id,
                              status: e.target.value,
                            })
                          }
                          sx={{
                            textTransform: "capitalize",
                            "& .MuiSelect-select": {
                              color:
                                lead.status === "converted"
                                  ? "#22c55e"
                                  : lead.status === "contacted"
                                  ? "#60a5fa"
                                  : "#e5e7eb",
                            },
                          }}
                        >
                          <MenuItem value="new">New</MenuItem>
                          <MenuItem value="contacted">Contacted</MenuItem>
                          <MenuItem value="converted">Converted</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          lead.preferred_contact === "whatsapp"
                            ? "WhatsApp"
                            : "Call"
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{utmSource}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {lead.createdAt
                          ? new Date(lead.createdAt).toLocaleString()
                          : "-"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenAnswers(lead)}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={isDeleting}
                          onClick={() => softDeleteLead(lead._id)}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {processed.length > pageSize && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      <Dialog open={answersOpen} onClose={handleCloseAnswers} fullWidth maxWidth="sm">
        <DialogTitle>Lead details</DialogTitle>
        <DialogContent dividers>
          {selectedLead && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography variant="subtitle2">Project</Typography>
                <Typography variant="body2">
                  {selectedLead.funnel_title ||
                    selectedLead.funnel_id?.title ||
                    "-"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2">Answers</Typography>
                {selectedLead.answers && selectedLead.answers.length ? (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}
                  >
                    {selectedLead.answers.map((item) => (
                      <Typography
                        key={item._id}
                        variant="body2"
                        sx={{ display: "block" }}
                      >
                        <strong className="bg-gray-500 p-1">Q. {item.question_text} :</strong>{" "}
                        <strong className="bg-green-500 p-1">{item.answer}</strong>
                      </Typography>
                    ))}
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    No answers captured.
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2">UTM</Typography>
                {selectedLead.utm &&
                (selectedLead.utm.source ||
                  selectedLead.utm.medium ||
                  selectedLead.utm.campaign ||
                  selectedLead.utm.content) ? (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}
                  >
                    {selectedLead.utm.source && (
                      <Typography variant="body2">
                        source: <strong>{selectedLead.utm.source}</strong>
                      </Typography>
                    )}
                    {selectedLead.utm.medium && (
                      <Typography variant="body2">
                        medium: <strong>{selectedLead.utm.medium}</strong>
                      </Typography>
                    )}
                    {selectedLead.utm.campaign && (
                      <Typography variant="body2">
                        campaign: <strong>{selectedLead.utm.campaign}</strong>
                      </Typography>
                    )}
                    {selectedLead.utm.content && (
                      <Typography variant="body2">
                        content: <strong>{selectedLead.utm.content}</strong>
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    No UTM data.
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAnswers}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeadsTab;
