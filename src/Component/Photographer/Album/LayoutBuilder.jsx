import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Grid,
  Button,
  ButtonGroup,
  Typography,
  Divider,
  Alert,
} from "@mui/material";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";

const LAYOUT_PRESETS = {
  classic: [
    { id: "single", name: "Single Page", grid: "1fr", rows: 1 },
    { id: "double", name: "Double Page", grid: "1fr 1fr", rows: 1 },
    { id: "triple", name: "Triple Layout", grid: "1fr 1fr 1fr", rows: 1 },
    { id: "grid2x2", name: "2×2 Grid", grid: "1fr 1fr", rows: 2 },
    { id: "featured", name: "Featured Layout", grid: "2fr 1fr", rows: 2 },
  ],
  modern: [
    { id: "full", name: "Full Bleed", grid: "1fr", rows: 1 },
    { id: "split", name: "Split View", grid: "1fr 1fr", rows: 1 },
    { id: "asymmetric", name: "Asymmetric", grid: "2fr 1fr", rows: 1 },
    { id: "grid3x3", name: "3×3 Grid", grid: "1fr 1fr 1fr", rows: 3 },
    { id: "magazine", name: "Magazine Style", grid: "1fr 1fr 1fr", rows: 2 },
  ],
  premium: [
    { id: "spread", name: "Spread Layout", grid: "1fr 1fr", rows: 1 },
    { id: "featured", name: "Featured Single", grid: "1fr", rows: 1 },
    { id: "collage", name: "Collage Layout", grid: "1fr 1fr 1fr", rows: 2 },
    { id: "custom", name: "Custom Grid", grid: "1fr 1fr 1fr 1fr", rows: 2 },
  ],
};

const LayoutBuilder = ({ template, photos, onLayoutChange }) => {
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [layoutPhotos, setLayoutPhotos] = useState([]);

  // Get available layouts for selected template
  const availableLayouts = LAYOUT_PRESETS[template?.id] || LAYOUT_PRESETS.classic;

  // Initialize layout
  useEffect(() => {
    if (availableLayouts.length > 0 && !selectedLayout) {
      const defaultLayout = availableLayouts[0];
      setSelectedLayout(defaultLayout);
      onLayoutChange(defaultLayout);
    }
  }, [template, availableLayouts]);

  // Arrange photos in layout
  useEffect(() => {
    if (selectedLayout && photos.length > 0) {
      const columnsCount = selectedLayout.grid.split(" ").length;
      const totalSpots = columnsCount * selectedLayout.rows;

      // Repeat photos if needed to fill layout
      const arranged = [];
      for (let i = 0; i < totalSpots && i < photos.length; i++) {
        arranged.push(photos[i % photos.length]);
      }

      setLayoutPhotos(arranged);
    }
  }, [selectedLayout, photos]);

  const handleLayoutSelect = (layout) => {
    setSelectedLayout(layout);
    onLayoutChange(layout);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Step 2: Arrange Your Layout
      </Typography>

      {photos.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please select photos first before arranging the layout.
        </Alert>
      )}

      {/* Layout Options */}
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Choose Layout Style:
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {availableLayouts.map((layout) => (
          <Grid item xs={12} sm={6} md={4} key={layout.id}>
            <Card
              onClick={() => handleLayoutSelect(layout)}
              sx={{
                p: 2,
                cursor: "pointer",
                border:
                  selectedLayout?.id === layout.id
                    ? "3px solid #2196f3"
                    : "1px solid #e0e0e0",
                backgroundColor:
                  selectedLayout?.id === layout.id ? "#e3f2fd" : "#ffffff",
                transition: "all 0.3s",
                "&:hover": {
                  boxShadow: 3,
                  borderColor: "#2196f3",
                },
              }}
            >
              {/* Layout Preview */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: layout.grid,
                  gap: 1,
                  mb: 2,
                  p: 1,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 1,
                }}
              >
                {Array.from({ length: layout.grid.split(" ").length * layout.rows }).map(
                  (_, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        aspectRatio: "1",
                        backgroundColor: "#e0e0e0",
                        borderRadius: 0.5,
                        border: "1px dashed #999",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="caption" color="textSecondary">
                        {idx + 1}
                      </Typography>
                    </Box>
                  )
                )}
              </Box>

              {/* Layout Name */}
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {layout.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {layout.grid.split(" ").length} × {layout.rows} Layout
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Live Preview */}
      {selectedLayout && photos.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            📋 Live Preview
          </Typography>
          <Card sx={{ p: 3, backgroundColor: "#f5f5f5", overflow: "auto" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: selectedLayout.grid,
                gap: 2,
                minHeight: 300,
              }}
            >
              {layoutPhotos.map((photo, idx) => (
                <Box
                  key={idx}
                  sx={{
                    position: "relative",
                    backgroundColor: "#fff",
                    borderRadius: 1,
                    overflow: "hidden",
                    boxShadow: 1,
                  }}
                >
                  <img
                    src={
                      photo.signedUrl ||
                      photo.photoUrl ||
                      "/demo.jpg"
                    }
                    alt={`Layout position ${idx + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(0, 0, 0, 0)",
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.3)",
                      },
                      transition: "all 0.2s",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        color: "white",
                        p: 0.5,
                        borderRadius: 0.5,
                        opacity: 0,
                        transition: "opacity 0.2s",
                        ":hover": { opacity: 1 },
                      }}
                    >
                      Position {idx + 1}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Card>

          {/* Layout Info */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Layout Capacity:</strong> This layout can accommodate{" "}
              {selectedLayout.grid.split(" ").length * selectedLayout.rows} photos per page.
              You can create multiple pages by repeating this layout.
            </Typography>
          </Alert>
        </Box>
      )}

      {/* Tips */}
      <Card sx={{ mt: 3, p: 2, backgroundColor: "#fff3e0" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          💡 Pro Tips for Best Results:
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <li>
            <Typography variant="caption">
              Choose layouts that complement your photo styles
            </Typography>
          </li>
          <li>
            <Typography variant="caption">
              Mix single and multi-photo layouts for visual variety
            </Typography>
          </li>
          <li>
            <Typography variant="caption">
              Place your best photos in featured positions
            </Typography>
          </li>
          <li>
            <Typography variant="caption">
              Leave the first page for a stunning cover image
            </Typography>
          </li>
        </Box>
      </Card>
    </Box>
  );
};

export default LayoutBuilder;
