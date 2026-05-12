import React, { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import axios from "axios";
import { useFormik } from "formik";
import { useLocation, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import "react-toastify/dist/ReactToastify.css";
import {
  Card,
  Stack,
  TextField,
  Button,
  Typography,
  Box,
  Divider,
  IconButton,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import PhoneInput from "react-phone-input-2";
import { toast } from "react-toastify";

const baseURL = process.env.REACT_APP_BASE_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "ngrok-skip-browser-warning": "69420",
});

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#FFFFFF",
    borderRadius: "7px",
    fontSize: "0.83rem",
    "& fieldset": { borderColor: "#E5E7EB" },
    "&:hover fieldset": { borderColor: "#9CA3AF" },
    "&.Mui-focused fieldset": { borderColor: "#3B82F6", borderWidth: "2px" },
  },
  "& .MuiInputBase-input": { padding: "8px 12px", fontSize: "0.83rem" },
};

const selectSx = {
  borderRadius: "7px",
  backgroundColor: "#FFFFFF",
  fontSize: "0.83rem",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9CA3AF" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#3B82F6", borderWidth: "2px" },
  "& .MuiSelect-select": { padding: "8px 12px" },
};

const ghostBtnSx = {
  borderColor: "#E5E7EB",
  color: "#374151",
  textTransform: "none",
  fontWeight: 500,
  borderRadius: "7px",
  fontSize: "0.8rem",
  px: 1.75,
  "&:hover": { borderColor: "#D1D5DB", backgroundColor: "#F9FAFB" },
};

const primaryBtnSx = {
  backgroundColor: "#3B82F6",
  textTransform: "none",
  fontWeight: 600,
  borderRadius: "7px",
  px: 2.5,
  py: 0.85,
  fontSize: "0.83rem",
  boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
  "&:hover": { backgroundColor: "#2563EB", boxShadow: "0 6px 16px rgba(59,130,246,0.4)" },
};

const step0ValidationSchema = Yup.object().shape({
  name: Yup.string().required("Event Name is required"),
  eventCategoryId: Yup.string().required("Event Category is required"),
  timeSlots: Yup.array().of(
    Yup.object().shape({
      date: Yup.string().required("Date is required"),
      eventSubCategory: Yup.string().required("Occasion Type is required"),
      slotTime: Yup.string().required("Occasion Time is required"),
    }),
  ),
});

const step1ValidationSchema = Yup.object().shape({
  hostName: Yup.string().required("Host Name is required"),
  hostMobile: Yup.string()
    .required("Host Mobile is required")
    .min(10, "Phone number must be at least 10 digits"),
});

const EMPTY_SLOT = { date: "", eventSubCategory: "", description: "", slotTime: "" };

/* ── Private helpers ───────────────────────────────────────────────── */

function StepItem({ number, label, active }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          backgroundColor: active ? "#3B82F6" : "#FFFFFF",
          border: active ? "none" : "2px solid #D1D5DB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: active ? "0 3px 10px rgba(59,130,246,0.35)" : "none",
        }}
      >
        <Typography fontWeight={700} fontSize="0.78rem" color={active ? "#FFFFFF" : "#9CA3AF"}>
          {number}
        </Typography>
      </Box>
      <Typography fontWeight={active ? 700 : 500} fontSize="0.82rem" color={active ? "#111827" : "#9CA3AF"}>
        {label}
      </Typography>
    </Stack>
  );
}

const summaryLabelSx = { textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.6rem" };

function SummaryLabel({ children }) {
  return (
    <Typography variant="caption" color="#9CA3AF" fontWeight={600} sx={summaryLabelSx}>
      {children}
    </Typography>
  );
}

function AppDialog({ open, onClose, iconBg, icon, title, body, cancelLabel, confirmLabel, onConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1, pt: 2.5, px: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: iconBg,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" fontWeight={600} color="#111827">
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 2 }}>
        <DialogContentText sx={{ color: "#6B7280", fontSize: "0.875rem", lineHeight: 1.6 }}>
          {body}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={ghostBtnSx}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            backgroundColor: "#3B82F6",
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "8px",
            px: 2.5,
            boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
            "&:hover": { backgroundColor: "#2563EB" },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── Main component ────────────────────────────────────────────────── */

function CreateEventForm({
  setCategoryname,
  upgradePath,
  successPath,
  showSubscriptionGuard = false,
}) {
  const [loading, setLoading] = useState(false);
  const [load, setLoad] = useState(false);
  const [clientSubmitAttempted, setClientSubmitAttempted] = useState(false);
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [canCreateEvent, setCanCreateEvent] = useState(true);
  const [permission, setPermission] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [verificationDialog, setVerificationDialog] = useState({
    open: false,
    status: "",
    title: "",
    text: "",
  });
  const [upgradeDialog, setUpgradeDialog] = useState({ open: false });
  const [activeStep, setActiveStep] = useState(0);

  const navigate = useNavigate();
  const id = useLocation().pathname.split("/")[3];
  const [selectedCategory, setSelectedCategory] = useState(id);

  useEffect(() => {
    if (showSubscriptionGuard) fetchGuard();
    fetchEventsCategory();
  }, []);

  useEffect(() => {
    if (selectedCategory) fetchSubCategory();
  }, [selectedCategory]);

  useEffect(() => {
    setClientSubmitAttempted(false);
  }, [activeStep]);

  const fetchGuard = async () => {
    setLoad(true);
    try {
      const res = await axios.get(`${baseURL}/v1/subscription/guard/event`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCanCreateEvent(!!res.data.canCreate);
    } catch (error) {
      const statusCode = error?.response?.status;
      const msg = error?.response?.data?.message || "";
      if (statusCode === 403 || msg.includes("trial period")) {
        setPermission(true);
      }
    } finally {
      setLoad(false);
    }
  };

  const fetchEventsCategory = async () => {
    try {
      const res = await axios.get(`${baseURL}/event-categories`, { headers: authHeaders() });
      setCategories(res.data.categories);
    } catch (_) {}
  };

  const fetchSubCategory = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/event-categories/sub-category?eventCategoryId=${selectedCategory}`,
        { headers: authHeaders() },
      );
      setSubCategories(res.data.categories);
    } catch (error) {
      console.error(error);
    }
  };

  // Verification popup helpers — activation is intentionally commented out
  const showVerificationPopup = (status) => {
    const map = {
      pending: {
        title: "Verification Pending",
        text: "Your ID verification is currently under review. You cannot create events until your verification is approved.",
      },
      rejected: {
        title: "Verification Rejected",
        text: "Your ID verification was rejected. Please submit valid documents to create events.",
      },
    };
    const { title, text } = map[status] || {
      title: "Verification Required",
      text: "You need to verify your ID before creating events. Please complete your verification first.",
    };
    setVerificationDialog({ open: true, status, title, text });
  };

  const handleVerificationDialogClose = (confirmed) => {
    setVerificationDialog({ open: false, status: "", title: "", text: "" });
    if (confirmed) {
      navigate("/photographer/settings", { state: { activeTab: "verification" } });
    } else {
      navigate(-1);
    }
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      timeSlots: [EMPTY_SLOT],
      hostName: "",
      hostMobile: "",
      hostEmail: "",
      countryCode: "",
      eventCategoryId: selectedCategory || "",
    },
    validationSchema: activeStep === 0 ? step0ValidationSchema : step1ValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await axios.post(`${baseURL}/events`, values, {
          headers: { ...authHeaders(), "Content-Type": "application/json" },
        });
        toast.success("Event created successfully", { autoClose: 1000 });
        setLoading(false);
        formik.resetForm();
        setClientSubmitAttempted(false);
        setCategoryname("");
        setTimeout(() => {
          if (successPath) navigate(successPath);
          else navigate(-1);
        }, 1000);
      } catch (error) {
        setLoading(false);
        const errorMessage = error?.response?.data?.message;
        if (errorMessage === "Event creation limit reached for your plan.") {
          setUpgradeDialog({ open: true });
        } else {
          toast.error(errorMessage, { autoClose: 1000 });
        }
      }
    },
  });

  const showStep2Errors = activeStep === 1 && clientSubmitAttempted;

  const handleAddSlot = () => {
    formik.setFieldValue("timeSlots", [...formik.values.timeSlots, EMPTY_SLOT]);
  };

  const handleRemoveSlot = (index) => {
    const slots = [...formik.values.timeSlots];
    slots.splice(index, 1);
    formik.setFieldValue("timeSlots", slots);
  };

  const handleNext = async () => {
    if (!canCreateEvent) {
      toast.error("Cannot create events. Please upgrade your plan.");
      return;
    }
    const errors = await formik.validateForm();
    const touchedSlots = formik.values.timeSlots.map(() => ({
      date: true,
      eventSubCategory: true,
      description: true,
      slotTime: true,
    }));
    formik.setTouched({ name: true, eventCategoryId: true, timeSlots: touchedSlots });
    const hasTimeSlotErrors = errors.timeSlots?.some?.((e) => !!e);
    if (!errors.name && !hasTimeSlotErrors) {
      setClientSubmitAttempted(false);
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setClientSubmitAttempted(false);
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleCreate = async () => {
    if (!canCreateEvent) {
      toast.error("Cannot create events. Please upgrade your plan.");
      return;
    }
    setClientSubmitAttempted(true);
    const errors = await formik.validateForm();
    formik.setTouched({ ...formik.touched, hostName: true, hostMobile: true });
    if (!errors.hostName && !errors.hostMobile) formik.submitForm();
  };

  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    setSelectedCategory(selectedId);
    formik.setFieldValue("eventCategoryId", selectedId);
    const selectedObj = categories.find((c) => c._id === selectedId);
    if (selectedObj) setCategoryname(selectedObj.name);
  };

  const fieldLabel = (text, optional = false) => (
    <Typography
      variant="caption"
      fontWeight={600}
      color="#374151"
      sx={{ display: "block", mb: 0.5, fontSize: "0.76rem" }}
    >
      {text}
      {!optional && <span style={{ color: "#EF4444", marginLeft: 2 }}>*</span>}
      {optional && (
        <span style={{ color: "#9CA3AF", fontWeight: 400, marginLeft: 4 }}>(Optional)</span>
      )}
    </Typography>
  );

  if ((showSubscriptionGuard && load) || isCheckingVerification) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={36} sx={{ color: "#3B82F6" }} />
          {isCheckingVerification && (
            <Typography variant="body2" color="text.secondary">Checking verification status…</Typography>
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <>
      {showSubscriptionGuard && permission ? (
        <Box sx={{ backgroundColor: "#F8FAFC", p: 4, borderRadius: 2, textAlign: "center", mt: 4 }}>
          <ErrorOutlineIcon sx={{ fontSize: 44, color: "#EF4444", mb: 1 }} />
          <Typography variant="h6" color="#374151" fontWeight={600} mb={0.75}>
            You do not have access to this page
          </Typography>
          <Typography variant="body2" color="#6B7280" mb={2.5}>
            Your plan does not have permission to access this page.
          </Typography>
          <Button
            variant="contained"
            startIcon={<BoltIcon />}
            onClick={() => navigate(upgradePath)}
            sx={{ backgroundColor: "#3B82F6", textTransform: "none", fontWeight: 600, borderRadius: "8px" }}
          >
            Upgrade Plan
          </Button>
        </Box>
      ) : (
        /* Outer shell: exactly 100vh, flex column, inner content scrolls */
        <Box
          sx={{
            backgroundColor: "#F1F5F9",
            height: { md: "100vh" },
            minHeight: { xs: "100vh" },
            display: "flex",
            flexDirection: "column",
            overflow: { md: "hidden" },
            py: 1.5,
            px: { xs: 1.5, md: 2.5 },
          }}
        >
          {/* ── Page Header ── */}
          <Box sx={{ mb: 1.5, flexShrink: 0 }}>
            <Typography variant="h6" fontWeight={700} color="#111827" fontSize="1.05rem">
              Create New Event
            </Typography>
          </Box>

          {/* ── Stepper Strip ── */}
          <Card
            sx={{
              borderRadius: "10px",
              mb: 1.5,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              border: "1px solid #E9ECF0",
              flexShrink: 0,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ px: 3, pt: 1.5, pb: 1.25 }}
            >
              <StepItem number={1} label="Event Details" active={true} />

              {/* Connector line */}
              <Box sx={{ flex: 1, mx: 2, height: 1, backgroundColor: activeStep >= 1 ? "#3B82F6" : "#E5E7EB", transition: "background-color 0.4s ease" }} />

              <StepItem number={2} label="Client Information" active={activeStep >= 1} />
            </Stack>

            {/* Progress bar */}
            <Box sx={{ height: 3, backgroundColor: "#E5E7EB", position: "relative" }}>
              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: activeStep === 0 ? "50%" : "100%",
                  backgroundColor: "#3B82F6",
                  transition: "width 0.4s ease",
                }}
              />
            </Box>
          </Card>

          {/* ── Main Content: fills remaining height, form scrolls internally ── */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "flex-start" }}
            sx={{ flex: 1, minHeight: 0, overflow: { md: "hidden" } }}
          >
            {/* Form column */}
            <Box sx={{ flex: 1, minWidth: 0, height: { md: "100%" }, overflowY: { md: "auto" } }}>
              <Card
                sx={{
                  borderRadius: "10px",
                  p: 2,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  border: "1px solid #E9ECF0",
                  mb: { xs: 0, lg: 0 },
                }}
              >
                {/* Section Header */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                  <Box
                    sx={{
                      p: 0.9,
                      backgroundColor: "#EEF2FF",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {activeStep === 0 ? (
                      <CalendarTodayIcon sx={{ color: "#6366F1", fontSize: 18 }} />
                    ) : (
                      <PersonOutlineIcon sx={{ color: "#6366F1", fontSize: 18 }} />
                    )}
                  </Box>
                  <Box>
                    <Typography fontWeight={700} fontSize="0.9rem" color="#111827">
                      {activeStep === 0 ? "Event Details" : "Client Information"}
                    </Typography>
                    <Typography variant="caption" color="#6B7280" fontSize="0.74rem">
                      {activeStep === 0
                        ? "Basic information about your event"
                        : "Client's contact details"}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 2, borderColor: "#F3F4F6" }} />

                {showSubscriptionGuard && !canCreateEvent ? (
                  <Box
                    sx={{
                      p: 2.5,
                      backgroundColor: "#FEF2F2",
                      border: "1px solid #FECACA",
                      borderRadius: "8px",
                      textAlign: "center",
                    }}
                  >
                    <WarningAmberIcon sx={{ fontSize: 36, color: "#EF4444", mb: 1 }} />
                    <Typography variant="h6" color="#DC2626" fontWeight={600} mb={0.75}>
                      Event Creation Limited
                    </Typography>
                    <Typography variant="body2" color="#7F1D1D" mb={1.75}>
                      You have reached the maximum number of events allowed on your current plan.
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate(upgradePath)}
                      sx={{ backgroundColor: "#EF4444", borderRadius: "7px", textTransform: "none", "&:hover": { backgroundColor: "#DC2626" } }}
                    >
                      Upgrade Plan
                    </Button>
                  </Box>
                ) : (
                  <form onSubmit={(e) => e.preventDefault()}>
                    {/* ── Step 0: Event Details ── */}
                    {activeStep === 0 && (
                      <Stack spacing={2}>
                        {/* Event Name + Category */}
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                          <Box flex={1}>
                            {fieldLabel("Event Name")}
                            <TextField
                              fullWidth
                              name="name"
                              placeholder="Wedding, Birthday…"
                              value={formik.values.name}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              error={formik.touched.name && Boolean(formik.errors.name)}
                              helperText={formik.touched.name && formik.errors.name}
                              size="small"
                              sx={inputSx}
                            />
                          </Box>
                          <Box flex={1}>
                            {fieldLabel("Event Category")}
                            <FormControl fullWidth size="small">
                              <Select
                                name="eventCategoryId"
                                value={formik.values.eventCategoryId}
                                onChange={handleCategoryChange}
                                onBlur={formik.handleBlur}
                                displayEmpty
                                sx={selectSx}
                              >
                                <MenuItem value="" disabled>
                                  <Typography color="#9CA3AF" fontSize="0.83rem">Select category</Typography>
                                </MenuItem>
                                {categories.map((c) => (
                                  <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                ))}
                              </Select>
                              {formik.touched.eventCategoryId && formik.errors.eventCategoryId && (
                                <Typography variant="caption" color="#EF4444" sx={{ mt: 0.4, display: "block" }}>
                                  {formik.errors.eventCategoryId}
                                </Typography>
                              )}
                            </FormControl>
                          </Box>
                        </Stack>

                        {/* Time Slots */}
                        <Box>
                          <Stack direction="row" alignItems="baseline" spacing={1} mb={1.25}>
                            <Typography fontWeight={700} fontSize="0.85rem" color="#111827">
                              Time Slots
                            </Typography>
                            <Typography variant="caption" color="#6B7280" fontSize="0.74rem">
                              Add one or more slots
                            </Typography>
                          </Stack>

                          <Stack spacing={1.5}>
                            {formik.values.timeSlots.map((slot, index) => (
                              <Stack
                                key={index}
                                direction={{ xs: "column", md: "row" }}
                                spacing={1}
                                alignItems="flex-start"
                              >
                                {/* Date */}
                                <Box flex={1}>
                                  {fieldLabel("Date")}
                                  <TextField
                                    fullWidth
                                    type="date"
                                    name={`timeSlots[${index}].date`}
                                    value={slot.date}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={
                                      formik.touched.timeSlots?.[index]?.date &&
                                      Boolean(formik.errors.timeSlots?.[index]?.date)
                                    }
                                    helperText={
                                      formik.touched.timeSlots?.[index]?.date &&
                                      formik.errors.timeSlots?.[index]?.date
                                    }
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    sx={inputSx}
                                  />
                                </Box>

                                {/* Occasion Type */}
                                <Box flex={1}>
                                  {fieldLabel("Occasion Type")}
                                  <FormControl fullWidth size="small">
                                    <Select
                                      name={`timeSlots[${index}].eventSubCategory`}
                                      value={slot.eventSubCategory}
                                      onChange={formik.handleChange}
                                      onBlur={formik.handleBlur}
                                      displayEmpty
                                      sx={selectSx}
                                    >
                                      <MenuItem value="" disabled>
                                        <Typography color="#9CA3AF" fontSize="0.83rem">Select type</Typography>
                                      </MenuItem>
                                      {subCategories.map((s) => (
                                        <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                                      ))}
                                    </Select>
                                    {formik.touched.timeSlots?.[index]?.eventSubCategory &&
                                      formik.errors.timeSlots?.[index]?.eventSubCategory && (
                                        <Typography variant="caption" color="#EF4444" sx={{ mt: 0.4, display: "block" }}>
                                          {formik.errors.timeSlots[index].eventSubCategory}
                                        </Typography>
                                      )}
                                  </FormControl>
                                </Box>

                                {/* Occasion Time + Delete */}
                                <Box flex={1}>
                                  {fieldLabel("Occasion Time")}
                                  <Stack direction="row" spacing={0.75} alignItems="flex-start">
                                    <FormControl fullWidth size="small">
                                      <Select
                                        name={`timeSlots[${index}].slotTime`}
                                        value={slot.slotTime}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        displayEmpty
                                        sx={selectSx}
                                      >
                                        <MenuItem value="" disabled>
                                          <Typography color="#9CA3AF" fontSize="0.83rem">Select time</Typography>
                                        </MenuItem>
                                        <MenuItem value="morning">Morning</MenuItem>
                                        <MenuItem value="noon">Afternoon</MenuItem>
                                        <MenuItem value="evening">Evening</MenuItem>
                                      </Select>
                                      {formik.touched.timeSlots?.[index]?.slotTime &&
                                        formik.errors.timeSlots?.[index]?.slotTime && (
                                          <Typography variant="caption" color="#EF4444" sx={{ mt: 0.4, display: "block" }}>
                                            {formik.errors.timeSlots[index].slotTime}
                                          </Typography>
                                        )}
                                    </FormControl>
                                    <IconButton
                                      onClick={() => formik.values.timeSlots.length > 1 && handleRemoveSlot(index)}
                                      size="small"
                                      disabled={formik.values.timeSlots.length === 1}
                                      sx={{
                                        color: "#EF4444",
                                        backgroundColor: "#FEF2F2",
                                        border: "1px solid #FECACA",
                                        borderRadius: "7px",
                                        width: 34,
                                        height: 34,
                                        flexShrink: 0,
                                        "&:hover": { backgroundColor: "#FEE2E2" },
                                        "&.Mui-disabled": { backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", color: "#D1D5DB" },
                                      }}
                                    >
                                      <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                                    </IconButton>
                                  </Stack>
                                </Box>
                              </Stack>
                            ))}
                          </Stack>

                          <Button
                            type="button"
                            onClick={handleAddSlot}
                            fullWidth
                            variant="outlined"
                            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                            sx={{
                              mt: 1.5,
                              borderStyle: "dashed",
                              borderColor: "#93C5FD",
                              color: "#3B82F6",
                              backgroundColor: "#F0F9FF",
                              textTransform: "none",
                              fontWeight: 500,
                              fontSize: "0.8rem",
                              borderRadius: "7px",
                              py: 0.75,
                              "&:hover": { borderStyle: "dashed", borderColor: "#3B82F6", backgroundColor: "#E0F2FE" },
                            }}
                          >
                            Add Another Time Slot
                          </Button>
                        </Box>
                      </Stack>
                    )}

                    {/* ── Step 1: Client Info ── */}
                    {activeStep === 1 && (
                      <Stack spacing={2}>
                        <Box>
                          {fieldLabel("Client Name")}
                          <TextField
                            fullWidth
                            name="hostName"
                            placeholder="Enter client's full name"
                            value={formik.values.hostName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={showStep2Errors && Boolean(formik.errors.hostName)}
                            helperText={showStep2Errors ? formik.errors.hostName : ""}
                            size="small"
                            sx={inputSx}
                          />
                        </Box>

                        <Box>
                          {fieldLabel("Client Mobile")}
                          <Box
                            sx={{
                              border: "1px solid #E5E7EB",
                              borderRadius: "7px",
                              backgroundColor: "#FFFFFF",
                              px: 1.25,
                              py: 0.25,
                              transition: "border-color 0.2s",
                              "&:focus-within": { borderColor: "#3B82F6", boxShadow: "0 0 0 2px rgba(59,130,246,0.1)" },
                            }}
                          >
                            <PhoneInput
                              country="in"
                              enableSearch
                              countryCodeEditable={false}
                              value={
                                (formik.values.countryCode || "").replace("+", "") +
                                (formik.values.hostMobile || "")
                              }
                              onChange={(value, country) => {
                                const clean = value.replace(/\D/g, "");
                                formik.setFieldValue("hostMobile", clean.slice(country.dialCode.length));
                                formik.setFieldValue("countryCode", "+" + country.dialCode);
                              }}
                              inputStyle={{ border: "none", outline: "none", width: "100%", background: "transparent", fontSize: "13px", fontFamily: "inherit" }}
                              buttonStyle={{ border: "none", backgroundColor: "transparent" }}
                              onBlur={formik.handleBlur}
                            />
                          </Box>
                          {showStep2Errors && formik.errors.hostMobile && (
                            <Typography variant="caption" color="#EF4444" sx={{ mt: 0.4, display: "block" }}>
                              {formik.errors.hostMobile}
                            </Typography>
                          )}
                        </Box>

                        <Box>
                          {fieldLabel("Client Email", true)}
                          <TextField
                            fullWidth
                            type="email"
                            name="hostEmail"
                            placeholder="Enter email address"
                            value={formik.values.hostEmail}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            size="small"
                            sx={inputSx}
                          />
                        </Box>
                      </Stack>
                    )}

                    {/* ── Navigation ── */}
                    <Stack
                      direction="row"
                      justifyContent={activeStep > 0 ? "space-between" : "flex-end"}
                      alignItems="center"
                      sx={{ mt: 2.5 }}
                    >
                      {activeStep > 0 && (
                        <Button
                          type="button"
                          variant="outlined"
                          startIcon={<ArrowBackIcon sx={{ fontSize: 15 }} />}
                          onClick={handleBack}
                          sx={ghostBtnSx}
                        >
                          Back
                        </Button>
                      )}

                      {activeStep < 1 ? (
                        <Button
                          type="button"
                          variant="contained"
                          disabled={!canCreateEvent}
                          endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                          onClick={handleNext}
                          sx={primaryBtnSx}
                        >
                          Next Step
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={handleCreate}
                          variant="contained"
                          disabled={!canCreateEvent || loading}
                          sx={{
                            ...primaryBtnSx,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            "&.Mui-disabled": { backgroundColor: "#93C5FD", color: "#fff" },
                          }}
                        >
                          {loading ? (
                            <>
                              <CircularProgress size={14} color="inherit" />
                              <span>Creating…</span>
                            </>
                          ) : (
                            "Create Event"
                          )}
                        </Button>
                      )}
                    </Stack>
                  </form>
                )}
              </Card>
            </Box>

            {/* ── Event Summary Sidebar ── */}
            <Box sx={{ width: { xs: "100%", md: 240 }, flexShrink: 0, height: { md: "100%" }, overflowY: { md: "auto" } }}>
              <Card
                sx={{
                  borderRadius: "10px",
                  p: 2,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  border: "1px solid #E9ECF0",
                }}
              >
                {/* Icon + title row */}
                <Stack direction="row" alignItems="center" spacing={1.25} mb={1.25}>
                  <Box
                    sx={{
                      p: 1,
                      backgroundColor: "#F5F3FF",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AssignmentOutlinedIcon sx={{ fontSize: 20, color: "#7C3AED" }} />
                  </Box>
                  <Box>
                    <Typography fontWeight={700} fontSize="0.88rem" color="#111827">
                      Event Summary
                    </Typography>
                    <Typography variant="caption" color="#6B7280" fontSize="0.72rem">
                      Fills in as you type
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 1.5, borderColor: "#F3F4F6" }} />

                {formik.values.name || formik.values.eventCategoryId || formik.values.timeSlots.some((s) => s.date) || formik.values.hostName || formik.values.hostMobile || formik.values.hostEmail ? (
                  <Stack spacing={1.25}>
                    {formik.values.name && (
                      <Box>
                        <SummaryLabel>Event Name</SummaryLabel>
                        <Typography fontSize="0.83rem" color="#111827" fontWeight={600} mt={0.2}>
                          {formik.values.name}
                        </Typography>
                      </Box>
                    )}
                    {formik.values.eventCategoryId && (
                      <Box>
                        <SummaryLabel>Category</SummaryLabel>
                        <Typography fontSize="0.83rem" color="#111827" fontWeight={600} mt={0.2}>
                          {categories.find((c) => c._id === formik.values.eventCategoryId)?.name || "—"}
                        </Typography>
                      </Box>
                    )}
                    {formik.values.timeSlots.some((s) => s.date) && (
                      <Box>
                        <SummaryLabel>Time Slots</SummaryLabel>
                        <Stack spacing={0.5} mt={0.4}>
                          {formik.values.timeSlots
                            .filter((s) => s.date)
                            .map((slot, i) => {
                              const subCatName = subCategories.find((s) => s._id === slot.eventSubCategory)?.name;
                              return (
                                <Stack key={i} direction="row" alignItems="flex-start" spacing={0.75}>
                                  <CheckCircleOutlineIcon sx={{ fontSize: 12, color: "#10B981", flexShrink: 0, mt: 0.25 }} />
                                  <Box>
                                    <Typography fontSize="0.76rem" color="#374151">
                                      {slot.date}{slot.slotTime && ` — ${slot.slotTime}`}
                                    </Typography>
                                    {subCatName && (
                                      <Typography fontSize="0.72rem" color="#6B7280">{subCatName}</Typography>
                                    )}
                                  </Box>
                                </Stack>
                              );
                            })}
                        </Stack>
                      </Box>
                    )}
                    {formik.values.hostName && (
                      <Box>
                        <SummaryLabel>Client</SummaryLabel>
                        <Typography fontSize="0.83rem" color="#111827" fontWeight={600} mt={0.2}>
                          {formik.values.hostName}
                        </Typography>
                      </Box>
                    )}
                    {formik.values.hostMobile && (
                      <Box>
                        <SummaryLabel>Mobile</SummaryLabel>
                        <Typography fontSize="0.83rem" color="#111827" fontWeight={600} mt={0.2}>
                          {formik.values.countryCode} {formik.values.hostMobile}
                        </Typography>
                      </Box>
                    )}
                    {formik.values.hostEmail && (
                      <Box>
                        <SummaryLabel>Email</SummaryLabel>
                        <Typography fontSize="0.83rem" color="#111827" fontWeight={600} mt={0.2}>
                          {formik.values.hostEmail}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                ) : (
                  /* Placeholder */
                  <Box sx={{ textAlign: "center", py: 1.5 }}>
                    <Box sx={{ position: "relative", display: "inline-block", mb: 1.5 }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 78,
                          backgroundColor: "#EEF2FF",
                          border: "2px solid #C7D2FE",
                          borderRadius: "8px",
                          mx: "auto",
                          pt: 1.5,
                          px: 1,
                          position: "relative",
                        }}
                      >
                        <Box
                          sx={{
                            position: "absolute",
                            top: -8,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 20,
                            height: 10,
                            backgroundColor: "#A5B4FC",
                            borderRadius: "3px 3px 0 0",
                          }}
                        />
                        {[1, 2, 3].map((i) => (
                          <Stack key={i} direction="row" alignItems="center" spacing={0.5} mb={0.5}>
                            <Box sx={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: i === 1 ? "#6366F1" : "#C7D2FE", flexShrink: 0 }} />
                            <Box sx={{ flex: 1, height: 4, backgroundColor: i === 1 ? "#A5B4FC" : "#E0E7FF", borderRadius: 2, opacity: 0.4 + i * 0.2 }} />
                          </Stack>
                        ))}
                      </Box>
                      <Box sx={{ position: "absolute", top: -3, right: -6, width: 12, height: 12, backgroundColor: "#FDE68A", borderRadius: "50%" }} />
                      <Box sx={{ position: "absolute", bottom: 6, left: -7, width: 9, height: 9, backgroundColor: "#C4B5FD", borderRadius: "50%" }} />
                    </Box>
                    <Typography variant="caption" color="#9CA3AF" sx={{ display: "block", px: 0.5, lineHeight: 1.5, fontSize: "0.72rem" }}>
                      Your event summary will appear here as you fill in the details.
                    </Typography>
                  </Box>
                )}
              </Card>
            </Box>
          </Stack>
        </Box>
      )}

      {/* ── Verification Dialog ── */}
      <AppDialog
        open={verificationDialog.open}
        onClose={() => handleVerificationDialogClose(false)}
        iconBg={
          verificationDialog.status === "rejected"
            ? "#FEE2E2"
            : verificationDialog.status === "pending"
              ? "#FEF3C7"
              : "#DBEAFE"
        }
        icon={
          verificationDialog.status === "rejected" ? (
            <ErrorOutlineIcon sx={{ color: "#EF4444", fontSize: 22 }} />
          ) : (
            <WarningAmberIcon
              sx={{ color: verificationDialog.status === "pending" ? "#F59E0B" : "#3B82F6", fontSize: 22 }}
            />
          )
        }
        title={verificationDialog.title}
        body={verificationDialog.text}
        cancelLabel="Go Back"
        confirmLabel="Verify Document"
        onConfirm={() => handleVerificationDialogClose(true)}
      />

      {/* ── Upgrade Plan Dialog ── */}
      <AppDialog
        open={upgradeDialog.open}
        onClose={() => setUpgradeDialog({ open: false })}
        iconBg="#DBEAFE"
        icon={<WarningAmberIcon sx={{ color: "#3B82F6", fontSize: 22 }} />}
        title="Upgrade Your Plan"
        body="You need to upgrade your plan to perform this action. Upgrade now to unlock more features and create unlimited events."
        cancelLabel="Cancel"
        confirmLabel="Upgrade Plan"
        onConfirm={() => {
          setUpgradeDialog({ open: false });
          navigate(upgradePath);
        }}
      />
    </>
  );
}

export default CreateEventForm;
