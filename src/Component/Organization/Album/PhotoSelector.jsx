import React, { useState, useEffect } from "react";
import {
  Box,
  CircularProgress,
  Checkbox,
  Button,
  TextField,
  Chip,
  Grid,
  Card,
  Typography,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import axios from "axios";
import { toast } from "react-toastify";

const baseURL = process.env.REACT_APP_BASE_URL;

const PhotoSelector = ({ eventId, selectedPhotos, onPhotosChange, token }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState("");
  const [tags, setTags] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Fetch Event Photos
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseURL}/albums/${eventId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "69420",
          },
        });

        // Extract photos from layouts structure
        let photosData = [];
        if (response.data.data?.layouts && Array.isArray(response.data.data.layouts)) {
          response.data.data.layouts.forEach((layout) => {
            if (layout.photos && Array.isArray(layout.photos)) {
              photosData = [...photosData, ...layout.photos];
            }
          });
        }

        console.log("Fetched photos:", photosData); // Debug log

        // Map the photos to ensure we have the correct structure
        const mappedPhotos = photosData.map((photo) => ({
          _id: photo.id || photo._id,
          id: photo.id || photo._id,
          url: photo.url, // API returns 'url'
          signedUrl: photo.url, // Also set as signedUrl for compatibility
          tags: photo.tags || [],
          caption: photo.caption || "",
        }));

        setPhotos(mappedPhotos);

        // Extract unique tags
        const uniqueTags = [
          ...new Set(
            mappedPhotos.flatMap((photo) => photo.tags || [])
          ),
        ];
        setTags(uniqueTags);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching photos:", error);
        toast.error("Failed to load event photos");
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [eventId, token]);

  // Filter photos
  const filteredPhotos = filterTag
    ? photos.filter((p) => (p.tags || []).includes(filterTag))
    : photos;

  // Handle Photo Selection
  const handlePhotoToggle = (photo) => {
    const isSelected = selectedPhotos.some((p) => (p._id || p) === (photo._id || photo));

    if (isSelected) {
      onPhotosChange(
        selectedPhotos.filter((p) => (p._id || p) !== (photo._id || photo))
      );
    } else {
      onPhotosChange([...selectedPhotos, photo]);
    }
  };

  // Handle Photo Reordering (Drag & Drop)
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newPhotos = [...selectedPhotos];
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(targetIndex, 0, draggedPhoto);

    onPhotosChange(newPhotos);
    setDraggedIndex(null);
  };

  // Select All
  const handleSelectAll = () => {
    if (selectedPhotos.length === filteredPhotos.length) {
      onPhotosChange([]);
    } else {
      const newSelected = filteredPhotos.filter(
        (photo) =>
          !selectedPhotos.some(
            (p) => (p._id || p) === (photo._id || photo)
          )
      );
      onPhotosChange([...selectedPhotos, ...newSelected]);
    }
  };

  // Remove Photo
  const handleRemovePhoto = (photo) => {
    onPhotosChange(
      selectedPhotos.filter((p) => (p._id || p) !== (photo._id || photo))
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Step 1: Select & Arrange Photos
      </Typography>

      {/* Filter & Actions */}
      <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search by tag..."
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <Button
          size="small"
          variant={selectedPhotos.length === filteredPhotos.length ? "contained" : "outlined"}
          onClick={handleSelectAll}
        >
          {selectedPhotos.length === filteredPhotos.length
            ? "Deselect All"
            : "Select All"}
        </Button>
        <Typography variant="caption" color="textSecondary">
          Selected: {selectedPhotos.length} / {photos.length}
        </Typography>
      </Box>

      {/* Alert if no photos */}
      {photos.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No photos found for this event. Please upload photos first.
        </Alert>
      )}

      {/* Tag Filter */}
      {tags.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ display: "block", mb: 1, fontWeight: 600 }}>
            Filter by Tag:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              label="All Photos"
              onClick={() => setFilterTag("")}
              color={filterTag === "" ? "primary" : "default"}
              variant={filterTag === "" ? "filled" : "outlined"}
            />
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onClick={() => setFilterTag(tag)}
                color={filterTag === tag ? "primary" : "default"}
                variant={filterTag === tag ? "filled" : "outlined"}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Selected Photos Order */}
      {selectedPhotos.length > 0 && (
        <Card sx={{ p: 2, mb: 3, bgcolor: "#f5f5f5" }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            📸 Selected Photos Order (Drag to Reorder)
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {selectedPhotos.map((photo, index) => (
              <Box
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                sx={{
                  position: "relative",
                  cursor: "grab",
                  opacity: draggedIndex === index ? 0.5 : 1,
                  transition: "all 0.2s",
                  "&:hover": { transform: "scale(1.05)" },
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 1,
                    overflow: "hidden",
                    border: "2px solid #2196f3",
                    position: "relative",
                  }}
                >
                  <img
                    src={
                      photo.signedUrl ||
                      photo.url ||
                      photo.photoUrl ||
                      "/demo.jpg"
                    }
                    alt={`Photo ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      bgcolor: "#2196f3",
                      color: "white",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 2,
                      right: 2,
                      bgcolor: "rgba(0,0,0,0.5)",
                      color: "white",
                      borderRadius: 0.5,
                      p: 0.5,
                      cursor: "pointer",
                      opacity: 0,
                      transition: "opacity 0.2s",
                      "&:hover": { opacity: 1 },
                    }}
                    onClick={() => handleRemovePhoto(photo)}
                  >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Card>
      )}

      {/* Available Photos Grid */}
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Available Photos ({filteredPhotos.length})
      </Typography>
      <Grid container spacing={2}>
        {filteredPhotos.map((photo) => {
          const isSelected = selectedPhotos.some(
            (p) => (p._id || p) === (photo._id || photo)
          );

          return (
            <Grid item xs={6} sm={4} md={3} key={photo._id || photo}>
              <Card
                onClick={() => handlePhotoToggle(photo)}
                sx={{
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.2s",
                  border: isSelected ? "3px solid #2196f3" : "1px solid #e0e0e0",
                  "&:hover": {
                    boxShadow: 3,
                  },
                }}
              >
                <Box
                  sx={{
                    paddingBottom: "100%",
                    position: "relative",
                    backgroundColor: "#f5f5f5",
                  }}
                >
                  <img
                    src={
                      photo.signedUrl ||
                      photo.url ||
                      photo.photoUrl ||
                      "/demo.jpg"
                    }
                    alt="Photo"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />

                  {/* Checkbox Overlay */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: isSelected
                        ? "rgba(33, 150, 243, 0.2)"
                        : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => {}}
                      sx={{
                        color: isSelected ? "#2196f3" : "#ffffff",
                        filter: "drop-shadow(0 0 2px rgba(0,0,0,0.5))",
                      }}
                    />
                  </Box>

                  {/* Tag Badge */}
                  {photo.tags && photo.tags.length > 0 && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        right: 4,
                      }}
                    >
                      <Chip
                        label={photo.tags[0]}
                        size="small"
                        sx={{
                          fontSize: "0.65rem",
                          backgroundColor: "rgba(0,0,0,0.6)",
                          color: "white",
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredPhotos.length === 0 && photos.length > 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No photos found with the selected tag. Try a different filter.
        </Alert>
      )}
    </Box>
  );
};

export default PhotoSelector;
