import React, { useContext, useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { toast } from "react-toastify";
import axios from "axios";
import { useFormik } from "formik";
import { useLocation, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import {
  Card,
  Stack,
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  Chip,
  Divider,
  IconButton,
  CircularProgress,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  LinearProgress,
} from "@mui/material";
import { OrganizationEventContext } from "../Context/OrganizationEventContext";
import PhoneInput from "react-phone-input-2";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";

const baseURL = process.env.REACT_APP_BASE_URL;
const steps = ["Event Details & Time Slots", "Client Details"];
function CreateEvents() {
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState([]);
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const id = useLocation().pathname.split("/")[3];
  const [eventname, setEventname] = useState();
  const [selectedCategory, setSelectedCategory] = useState(id);
  const [category, setCategory] = useState([]);
  const { categoryname, setCategoryname } = useContext(
    OrganizationEventContext
  );

  useEffect(() => {
    fetchSubCategory();
  }, [selectedCategory]);

  const fetchSubCategory = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/event-categories/sub-category?eventCategoryId=${selectedCategory}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        }
      );
      setEvent(response.data.categories);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEventsCategory();
  }, []);

  const fetchEventsCategory = async () => {
    setLoading(true);
    axios
      .get(`${baseURL}/event-categories`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      })
      .then((response) => {
        setLoading(false);
        setCategory(response.data.categories);
        // console.log(response.data.categories);
      })
      .catch((error) => {
        setLoading(false);
        // console.log(error);
      });
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Event Name is required"),
    eventCategoryId: Yup.string().required("Event Category is required"),
    timeSlots: Yup.array().of(
      Yup.object().shape({
        date: Yup.string().required("Date is required"),
        eventSubCategory: Yup.string().required("Occasion Type is required"),
        slottime: Yup.string().required("Occasion Time is required"),
      })
    ),
    hostName: Yup.string().required("Host Name is required"),
    hostMobile: Yup.string().required("Host Mobile is required"),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      timeSlots: [
        {
          date: "",
          eventSubCategory: "",
          description: "",
          slottime: "",
        },
      ],
      hostName: "",
      hostMobile: "",
      hostEmail: "",
      countryCode: "",
      eventCategoryId: selectedCategory || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await axios.post(`${baseURL}/events`, values, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "69420",
          },
        });
        // toast.success("Event created successfully", { autoClose: 1000 });
        setLoading(false);
        formik.resetForm();
        setCategoryname("");
        setEventname("");
       setTimeout(() => {
          navigate(-1);
        }, 1000);
      } catch (error) {
        setLoading(false);
        // console.error(error);
        const errorMessage = error?.response?.data?.message;
        if (errorMessage === "Event creation limit reached for your plan.") {
          Swal.fire({
            title: "You need to upgrade your plan to perform this action.",
            showCancelButton: true,
            confirmButtonText: `Upgrade Plan`,
          }).then((result) => {
            if (result.isConfirmed) {
              navigate("/organization/upgrade_plan");
            }
          });
        } else {
          toast.error(error?.response?.data?.message, { autoClose: 1000 });
        }
      }
    },
  });

  const handleAddSlot = () => {
    formik.setFieldValue("timeSlots", [
      ...formik.values.timeSlots,
      {
        date: "",
        eventSubCategory: "",
        description: "",
        slottime: "",
      },
    ]);
  };

  const handleRemoveSlot = (index) => {
    const updatedSlots = [...formik.values.timeSlots];
    updatedSlots.splice(index, 1);
    formik.setFieldValue("timeSlots", updatedSlots);
  };

  const handleNext = async () => {
    // Run validation
    const errors = await formik.validateForm();

    if (activeStep === 0) {
      // Mark all fields as touched so errors display
      const touchedSlots = formik.values.timeSlots.map(() => ({
        date: true,
        eventSubCategory: true,
        description: true,
        slottime: true,
      }));

      formik.setTouched({
        name: true,
        eventCategoryId: true,
        timeSlots: touchedSlots,
      });

      if (formik.values.name) {
        setEventname(formik.values.name);
      }

      // Check for errors in name and timeSlots
      let hasTimeSlotErrors = false;
      if (errors.timeSlots) {
        formik.values.timeSlots.forEach((_, index) => {
          if (errors.timeSlots[index]) {
            hasTimeSlotErrors = true;
          }
        });
      }

      // Allow moving to step 2 only if name is filled and no time slot errors
      if (!errors.name && !hasTimeSlotErrors) {
        setActiveStep((prev) => prev + 1);
      }
    }

    if (activeStep === 1) {
      // Mark client detail fields as touched
      formik.setTouched({
        hostName: true,
        hostMobile: true,
      });

      // Allow form submission if no errors in client details
      if (!errors.hostName && !errors.hostMobile) {
        // Form will submit via onSubmit handler
      }
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleBackpage = () => {
    navigate(-1);
  };

  const handleChange = (e) => {
    const selectedId = e.target.value;
    setSelectedCategory(selectedId);

    // Find the selected category object
    const selectedObj = category.find((cate) => cate._id === selectedId);

    if (selectedObj) {
      const selectedName = selectedObj.name;
      formik.setFieldValue("eventCategoryId", selectedId);
      setCategoryname(selectedName);
    } else {
      formik.setFieldValue("eventCategoryId", selectedId);
    }
  };

  return (
    <>
      <Box
        sx={{
          backgroundColor: "#F8FAFC",
          minHeight: "100vh",
          py: 2,
          display: "flex",
          flexDirection: "column",
          textAlign: "start"
        }}
      >
        {/* Header with Back Button */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{ px: 2, mb: 2 }}
        >
          <IconButton
            onClick={handleBackpage}
            size="small"
            sx={{
              backgroundColor: "#E5E7EB",
              color: "#374151",
              "&:hover": { backgroundColor: "#D1D5DB" },
              width: 36,
              height: 36,
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="h6" fontWeight={700} color="#111827">
            Create Event
          </Typography>
        </Stack>

        {/* Main Card */}
        <Card
          sx={{
            width: "100%",
            px: 4,
            py: 4,
            borderRadius: 2,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            border: "1px solid #F1F5F9",
            backgroundColor: "#FFFFFF",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
          }}
        >
          {/* Modern Progress Indicator */}
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Chip
                label="1"
                color={activeStep >= 0 ? "primary" : "default"}
                variant={activeStep === 0 ? "filled" : "outlined"}
                size="small"
                sx={{
                  fontWeight: 700,
                  width: 28,
                  height: 28,
                  fontSize: "0.7rem",
                }}
              />
              <Typography
                fontWeight={activeStep === 0 ? 700 : 500}
                fontSize="0.75rem"
                color={activeStep === 0 ? "#1F2937" : "#9CA3AF"}
                sx={{ flex: 1, ml: 0.5 }}
              >
                Event Details
              </Typography>

              <Typography
                variant="caption"
                color="#9CA3AF"
                sx={{ flex: 0.5, textAlign: "right", fontSize: "0.65rem" }}
              >
                {activeStep === 0 ? "Current" : "Next"}
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={activeStep === 0 ? 50 : 100}
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: "#E5E7EB",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: "#3B82F6",
                  borderRadius: 2,
                },
              }}
            />

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Chip
                label="2"
                color={activeStep >= 1 ? "primary" : "default"}
                variant={activeStep === 1 ? "filled" : "outlined"}
                size="small"
                sx={{
                  fontWeight: 700,
                  width: 28,
                  height: 28,
                  fontSize: "0.7rem",
                }}
              />
              <Typography
                fontWeight={activeStep === 1 ? 700 : 500}
                fontSize="0.75rem"
                color={activeStep === 1 ? "#1F2937" : "#9CA3AF"}
                sx={{ flex: 1, ml: 0.5 }}
              >
                Client Info
              </Typography>

              <Typography
                variant="caption"
                color="#9CA3AF"
                sx={{ flex: 0.5, textAlign: "right", fontSize: "0.65rem" }}
              >
                {activeStep === 1 ? "Current" : "Later"}
              </Typography>
            </Stack>
          </Stack>

          {/* Step Titles */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="body2" fontWeight={700} color="#111827">
              {activeStep === 0 && "Event Details & Time Slots"}
              {activeStep === 1 && "Client Information"}
            </Typography>
            <Typography variant="caption" color="#9CA3AF" fontSize="0.7rem">
              Step {activeStep + 1} of 2
            </Typography>
          </Stack>

          <form onSubmit={formik.handleSubmit}>
            {/* Step 1: Event Details & Time Slots */}
            {activeStep === 0 && (
              <Stack spacing={1.5}>
                {/* Event Name and Category Grid */}
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                  <Stack flex={1} spacing={0.5}>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="#374151"
                      sx={{ fontSize: "0.75rem" }}
                    >
                      Event Name <span style={{ color: "#EF4444" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      type="text"
                      name="name"
                      placeholder="Wedding, Birthday"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.name && Boolean(formik.errors.name)}
                      helperText={formik.touched.name && formik.errors.name}
                      size="small"
                      sx={{
                        "& .MuiFilledInput-root": {
                          backgroundColor: "#FFFFFF",
                        },
                        "& .MuiFilledInput-input": {
                          padding: "0.75rem",
                        },
                      }}
                    />
                  </Stack>

                  <Stack flex={1} spacing={0.5}>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="#374151"
                      sx={{ fontSize: "0.7rem" }}
                    >
                      Event Category <span style={{ color: "#EF4444" }}>*</span>
                    </Typography>
                    <FormControl fullWidth size="small" variant="filled">
                      <Select
                        name="eventCategoryId"
                        value={formik.values.eventCategoryId}
                        onChange={handleChange}
                        onBlur={formik.handleBlur}
                        sx={{
                          "& .MuiFilledInput-root": {
                            backgroundColor: "#FFFFFF",
                          },
                          "& .MuiFilledInput-input": {
                            padding: "0.75rem",
                          },
                        }}
                      >
                        <MenuItem value="">Select Category</MenuItem>
                        {category &&
                          category.map((cate) => (
                            <MenuItem key={cate._id} value={cate._id}>
                              {cate.name}
                            </MenuItem>
                          ))}
                      </Select>
                      {formik.touched.eventCategoryId &&
                        formik.errors.eventCategoryId && (
                          <Typography
                            variant="caption"
                            color="#EF4444"
                            sx={{ fontSize: "0.65rem" }}
                          >
                            {formik.errors.eventCategoryId}
                          </Typography>
                        )}
                    </FormControl>
                  </Stack>
                </Stack>

                {/* Time Slots Section */}
                <Stack spacing={1}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="#111827"
                    sx={{ fontSize: "0.75rem" }}
                  >
                    Time Slots
                  </Typography>

                  <Stack spacing={1}>
                    {formik.values.timeSlots.map((slot, index) => (
                      <Paper
                        key={index}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          background:
                            "linear-gradient(135deg, #FBFDFF 0%, #F8FAFC 100%)",
                          border: "1px solid #E5E7EB",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#D1D5DB",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                          },
                        }}
                      >
                        {/* Delete Button */}
                        <Stack
                          direction="row"
                          justifyContent="flex-end"
                          sx={{ mb: 1 }}
                        >
                          {formik.values.timeSlots.length > 1 && (
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveSlot(index)}
                              sx={{
                                color: "#EF4444",
                                "&:hover": { backgroundColor: "#FEE2E2" },
                                width: 24,
                                height: 24,
                              }}
                            >
                              <DeleteIcon
                                fontSize="small"
                                sx={{ fontSize: "1rem" }}
                              />
                            </IconButton>
                          )}
                        </Stack>

                        {/* Time Slot Fields Grid */}
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={1}
                        >
                          <Stack flex={1} spacing={0.3}>
                            <Typography
                              variant="caption"
                              fontWeight={600}
                              color="#374151"
                              sx={{ fontSize: "0.65rem" }}
                            >
                              Date<span style={{ color: "#EF4444" }}>*</span>
                            </Typography>
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
                              sx={{
                                "& .MuiFilledInput-root": {
                                  backgroundColor: "#FFFFFF",
                                },
                              }}
                            />
                          </Stack>

                          <Stack flex={1} spacing={0.3}>
                            <Typography
                              variant="caption"
                              fontWeight={600}
                              color="#374151"
                              sx={{ fontSize: "0.65rem" }}
                            >
                              Occasion Type
                              <span style={{ color: "#EF4444" }}>*</span>
                            </Typography>
                            <FormControl
                              fullWidth
                              size="small"
                              variant="filled"
                            >
                              <Select
                                name={`timeSlots[${index}].eventSubCategory`}
                                value={slot.eventSubCategory}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                sx={{
                                  "& .MuiFilledInput-root": {
                                    backgroundColor: "#FFFFFF",
                                  },
                                }}
                              >
                                <MenuItem value="">Select Occasion</MenuItem>
                                {event &&
                                  event.map((subcate) => (
                                    <MenuItem
                                      key={subcate._id}
                                      value={subcate._id}
                                    >
                                      {subcate.name}
                                    </MenuItem>
                                  ))}
                              </Select>
                              {formik.touched.timeSlots?.[index]
                                ?.eventSubCategory &&
                                formik.errors.timeSlots?.[index]
                                  ?.eventSubCategory && (
                                  <Typography
                                    variant="caption"
                                    color="#EF4444"
                                    sx={{ fontSize: "0.65rem" }}
                                  >
                                    {
                                      formik.errors.timeSlots[index]
                                        .eventSubCategory
                                    }
                                  </Typography>
                                )}
                            </FormControl>
                          </Stack>

                          <Stack flex={1} spacing={0.3}>
                            <Typography
                              variant="caption"
                              fontWeight={600}
                              color="#374151"
                              sx={{ fontSize: "0.65rem" }}
                            >
                              Occasion Time
                              <span style={{ color: "#EF4444" }}>*</span>
                            </Typography>
                            <FormControl
                              fullWidth
                              size="small"
                              variant="filled"
                            >
                              <Select
                                name={`timeSlots[${index}].slottime`}
                                value={slot.slottime}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                sx={{
                                  "& .MuiFilledInput-root": {
                                    backgroundColor: "#FFFFFF",
                                  },
                                  "& .MuiFilledInput-input": {
                                    padding: "0.75rem",
                                  },
                                }}
                              >
                                <MenuItem value="">Select Time</MenuItem>
                                <MenuItem value="morning">Morning</MenuItem>
                                <MenuItem value="noon">Afternoon</MenuItem>
                                <MenuItem value="evening">Evening</MenuItem>
                              </Select>
                              {formik.touched.timeSlots?.[index]
                                ?.slottime &&
                                formik.errors.timeSlots?.[index]
                                ?.slottime && (
                                  <Typography
                                    variant="caption"
                                    color="#EF4444"
                                    sx={{ fontSize: "0.65rem" }}
                                  >
                                    {
                                      formik.errors.timeSlots[index]
                                        .slottime
                                    }
                                  </Typography>
                                )}
                            </FormControl>
                           
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>

                  {/* Add More Time Slot Button */}
                  <Button
                    type="button"
                    onClick={handleAddSlot}
                    variant="text"
                    startIcon={<AddIcon sx={{ fontSize: "1rem" }} />}
                    size="small"
                    sx={{
                      alignSelf: "flex-start",
                      color: "#2563EB",
                      fontWeight: 500,
                      fontSize: "0.75rem",
                      textTransform: "none",
                      mt: 0.5,
                      px: 0.5,
                      "&:hover": {
                        backgroundColor: "#EFF6FF",
                      },
                    }}
                  >
                    Add time slot
                  </Button>
                </Stack>
              </Stack>
            )}

            {/* Step 2: Client Details */}
            {activeStep === 1 && (
              <Stack spacing={1.5}>
                {/* Client Name */}
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="#374151"
                    sx={{ fontSize: "0.7rem" }}
                  >
                    Client Name <span style={{ color: "#EF4444" }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    type="text"
                    name="hostName"
                    value={formik.values.hostName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter name"
                    error={
                      formik.touched.hostName && Boolean(formik.errors.hostName)
                    }
                    helperText={
                      formik.touched.hostName && formik.errors.hostName
                    }
                    size="small"
                    sx={{
                      "& .MuiFilledInput-root": {
                        backgroundColor: "#FFFFFF",
                      },
                    }}
                  />
                </Stack>

                {/* Client Mobile */}
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="#374151"
                    sx={{ fontSize: "0.7rem" }}
                  >
                    Client Mobile <span style={{ color: "#EF4444" }}>*</span>
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: "2px 6px",
                      borderRadius: 1,
                      borderColor: "#E5E7EB",
                      backgroundColor: "#FFFFFF",
                      "&:hover": {
                        backgroundColor: "#FFFFFF",
                      },
                      "&:focus-within": {
                        backgroundColor: "#FFFFFF",
                        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                        borderColor: "#3B82F6",
                      },
                    }}
                  >
                    <PhoneInput
                      country={"in"}
                      enableSearch={true}
                      countryCodeEditable={false}
                      value={
                        (formik.values.countryCode || "").replace("+", "") +
                        (formik.values.hostMobile || "")
                      }
                      onChange={(value, country) => {
                        const cleanValue = value.replace(/\D/g, "");
                        const phoneWithoutCode = cleanValue.slice(
                          country.dialCode.length
                        );
                        formik.setFieldValue("hostMobile", phoneWithoutCode);
                        formik.setFieldValue(
                          "countryCode",
                          "+" + country.dialCode
                        );
                      }}
                      inputStyle={{
                        border: "none",
                        outline: "none",
                        width: "100%",
                        background: "transparent",
                        fontSize: "13px",
                        fontFamily: "inherit",
                      }}
                      buttonStyle={{
                        border: "none",
                        backgroundColor: "transparent",
                        fontSize: "13px",
                      }}
                      onBlur={formik.handleBlur}
                    />
                  </Paper>
                  {formik.errors.hostMobile && formik.touched.hostMobile && (
                    <Typography
                      variant="caption"
                      color="#EF4444"
                      sx={{ fontSize: "0.65rem" }}
                    >
                      {formik.errors.hostMobile}
                    </Typography>
                  )}
                </Stack>

                {/* Client Email */}
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="#374151"
                    sx={{ fontSize: "0.7rem" }}
                  >
                    Client Email (Optional)
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    name="hostEmail"
                    value={formik.values.hostEmail}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter email"
                    size="small"
                    sx={{
                      "& .MuiFilledInput-root": {
                        backgroundColor: "#FFFFFF",
                      },
                    }}
                  />
                </Stack>
              </Stack>
            )}

            {/* Step Navigation Buttons */}
            <Divider sx={{ my: 2 }} />
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={1}
            >
              <Box>
                {activeStep > 0 && (
                  <Button
                    variant="outlined"
                    startIcon={
                      <KeyboardArrowLeftIcon sx={{ fontSize: "1rem" }} />
                    }
                    onClick={handleBack}
                    size="small"
                    sx={{
                      borderColor: "#E5E7EB",
                      color: "#374151",
                      fontWeight: 500,
                      textTransform: "none",
                      borderRadius: 1,
                      fontSize: "0.75rem",
                      "&:hover": {
                        borderColor: "#D1D5DB",
                        backgroundColor: "#F9FAFB",
                      },
                    }}
                  >
                    Back
                  </Button>
                )}
              </Box>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  variant="caption"
                  color="#9CA3AF"
                  fontSize="0.65rem"
                >
                  Step {activeStep + 1} of 2
                </Typography>

                {activeStep < 1 ? (
                  <Button
                    variant="contained"
                    endIcon={
                      <KeyboardArrowRightIcon sx={{ fontSize: "1rem" }} />
                    }
                    onClick={handleNext}
                    size="small"
                    sx={{
                      backgroundColor: "#3B82F6",
                      color: "white",
                      fontWeight: 600,
                      textTransform: "none",
                      borderRadius: 1,
                      px: 2,
                      py: 0.5,
                      fontSize: "0.75rem",
                      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: "#2563EB",
                        transform: "translateY(-1px)",
                        boxShadow: "0 6px 16px rgba(59, 130, 246, 0.35)",
                      },
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    size="small"
                    sx={{
                      backgroundColor: loading ? "#10B981" : "#3B82F6",
                      color: "white",
                      fontWeight: 600,
                      textTransform: "none",
                      borderRadius: 1,
                      px: 2,
                      py: 0.5,
                      fontSize: "0.75rem",
                      boxShadow: loading
                        ? "0 4px 12px rgba(16, 185, 129, 0.25)"
                        : "0 4px 12px rgba(59, 130, 246, 0.25)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: loading ? "#059669" : "#2563EB",
                        transform: loading ? "none" : "translateY(-1px)",
                        boxShadow: loading
                          ? "0 6px 16px rgba(16, 185, 129, 0.35)"
                          : "0 6px 16px rgba(59, 130, 246, 0.35)",
                      },
                      "&:disabled": {
                        backgroundColor: "#10B981",
                        color: "white",
                        transform: "none",
                      },
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={14} color="inherit" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      "Create"
                    )}
                  </Button>
                )}
              </Stack>
            </Stack>
          </form>
        </Card>
      </Box>
    </>
  );
}

export default CreateEvents;

