import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from "@mui/material";
import {
  Add as AddIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Layout as LayoutIcon,
  Preview as PreviewIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import AlbumTemplates from "./AlbumTemplates";
import PhotoSelector from "./PhotoSelector";
import FlipbookBuilder from "./FlipbookBuilder";
import AlbumPreview from "./AlbumPreview";

const baseURL = process.env.REACT_APP_BASE_URL;

const steps = ["Choose Template", "Select Photos", "Design Flipbook", "Customize", "Preview"];

const AlbumCreation = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // State Management
  const [activeStep, setActiveStep] = useState(0);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [albumName, setAlbumName] = useState("");
  const [albumDescription, setAlbumDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [flipbookPages, setFlipbookPages] = useState([]);
  const [layoutConfig, setLayoutConfig] = useState(null);
  const [customizations, setCustomizations] = useState({
    coverImage: null,
    title: "",
    subtitle: "",
    theme: "classic",
    pageSize: "A4",
  });
  const [loading, setLoading] = useState(true);
  const [eventPhotosLoading, setEventPhotosLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openEventDialog, setOpenEventDialog] = useState(false);

  // Fetch Events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${baseURL}/events/all-events`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "69420",
          },
        });
        setEvents(response.data.events || []);
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load events");
        setLoading(false);
      }
    };

    fetchEvents();
  }, [token]);

  // Handle Step Navigation
  const handleNext = () => {
    // Validation
    if (activeStep === 0 && !selectedTemplate) {
      toast.error("Please select a template");
      return;
    }
    if (activeStep === 1 && selectedPhotos.length === 0) {
      toast.error("Please select at least one photo");
      return;
    }
    if (activeStep === 2 && flipbookPages.length === 0) {
      toast.error("Please design your flipbook pages");
      return;
    }

    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  // Handle Create Album - Display Album Instead
  const handleCreateAlbum = async () => {
    if (!albumName.trim()) {
      toast.error("Album name is required");
      return;
    }

    // Just navigate to the album viewer with the album data
    // Pass album data through state
    const albumData = {
      title: albumName,
      description: albumDescription,
      eventId: selectedEvent?._id,
      template: selectedTemplate,
      photos: selectedPhotos,
      flipbookPages: flipbookPages,
      customizations,
      status: "draft",
    };

    navigate("/photographer/album/preview", { 
      state: { albumData, eventName: selectedEvent?.name } 
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Create Professional Album
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Design stunning photo albums like professional photographers
        </p>
      </Box>

      {/* Event Selection */}
      {!selectedEvent ? (
        <Card sx={{ p: 4, mb: 4 }}>
          <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-white">
            Select Event
          </h2>
          {events.length === 0 ? (
            <Box textAlign="center" py={4}>
              <PhotoLibraryIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                No events found. Create an event first to start building albums.
              </p>
              <Button
                variant="contained"
                onClick={() => navigate("/photographer/events")}
              >
                Create Event
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {events.map((event) => (
                <Grid item xs={12} sm={6} md={4} key={event._id}>
                  <Card
                    onClick={() => setSelectedEvent(event)}
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.3s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        height: 200,
                        backgroundImage: `url(${
                          event.firstPhotoSignedUrl || "/demo.jpg"
                        })`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <Box p={2}>
                      <h3 className="font-semibold text-slate-800 dark:text-white">
                        {event.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {event.totalPhotos || 0} photos
                      </p>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Card>
      ) : (
        <Card sx={{ p: 3, mb: 4, bgcolor: "#e3f2fd", border: "2px solid #2196f3" }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <h3 className="font-semibold text-slate-800">Selected Event:</h3>
              <p className="text-lg font-bold text-blue-600">{selectedEvent.name}</p>
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSelectedEvent(null)}
            >
              Change
            </Button>
          </Box>
        </Card>
      )}

      {/* Stepper */}
      {selectedEvent && (
        <>
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 4 }}>
            {steps.map((label, index) => (
              <Step key={label} active={activeStep === index}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  <Box sx={{ mb: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
                    {/* Step 0: Choose Template */}
                    {index === 0 && (
                      <AlbumTemplates
                        selected={selectedTemplate}
                        onSelect={setSelectedTemplate}
                      />
                    )}

                    {/* Step 1: Select Photos */}
                    {index === 1 && (
                      <PhotoSelector
                        eventId={selectedEvent._id}
                        selectedPhotos={selectedPhotos}
                        onPhotosChange={setSelectedPhotos}
                        token={token}
                      />
                    )}

                    {/* Step 2: Design Flipbook */}
                    {index === 2 && (
                      <FlipbookBuilder
                        selectedPhotos={selectedPhotos}
                        onFlipbookChange={setFlipbookPages}
                      />
                    )}

                    {/* Step 3: Customize */}
                    {index === 3 && (
                      <Box>
                        <TextField
                          fullWidth
                          label="Album Name"
                          value={albumName}
                          onChange={(e) => setAlbumName(e.target.value)}
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Description"
                          value={albumDescription}
                          onChange={(e) => setAlbumDescription(e.target.value)}
                          sx={{ mb: 2 }}
                        />
                        <Box>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Theme
                          </label>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            {["classic", "modern", "vintage", "elegant"].map(
                              (theme) => (
                                <Chip
                                  key={theme}
                                  label={theme.charAt(0).toUpperCase() + theme.slice(1)}
                                  onClick={() =>
                                    setCustomizations({
                                      ...customizations,
                                      theme,
                                    })
                                  }
                                  variant={
                                    customizations.theme === theme
                                      ? "filled"
                                      : "outlined"
                                  }
                                  color={
                                    customizations.theme === theme
                                      ? "primary"
                                      : "default"
                                  }
                                />
                              )
                            )}
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {/* Step 4: Preview */}
                    {index === 4 && (
                      <AlbumPreview
                        albumName={albumName}
                        flipbookPages={flipbookPages}
                        photos={selectedPhotos}
                      />
                    )}
                  </Box>

                  {/* Navigation Buttons */}
                  <Box display="flex" gap={1}>
                    <Button
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      variant="outlined"
                    >
                      Back
                    </Button>
                    {activeStep === steps.length - 1 ? (
                      <Button
                        onClick={handleCreateAlbum}
                        variant="contained"
                        color="success"
                        disabled={submitting || !albumName.trim()}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        {submitting ? (
                          <CircularProgress size={20} />
                        ) : (
                          <DownloadIcon />
                        )}
                        Create Album
                      </Button>
                    ) : (
                      <Button onClick={handleNext} variant="contained">
                        Next
                      </Button>
                    )}
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </>
      )}
    </Box>
  );
};

export default AlbumCreation;
