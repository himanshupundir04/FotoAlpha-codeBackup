import React, { useState } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  IconButton,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PreviewIcon from "@mui/icons-material/Preview";

const IMAGE_SHAPES = [
  { id: "rectangle", label: "Rectangle", icon: "▭" },
  { id: "circle", label: "Circle", icon: "●" },
  { id: "polaroid", label: "Polaroid", icon: "📷" },
  { id: "rounded", label: "Rounded", icon: "⬜" },
  { id: "hexagon", label: "Hexagon", icon: "⬡" },
];

const BACKGROUND_OPTIONS = [
  { id: "white", label: "White", color: "#FFFFFF" },
  { id: "cream", label: "Cream", color: "#F5E6D3" },
  { id: "light-gray", label: "Light Gray", color: "#F5F5F5" },
  { id: "gold", label: "Gold", color: "#D4AF37" },
  { id: "blush", label: "Blush Pink", color: "#FFD7E8" },
  { id: "sage", label: "Sage Green", color: "#B2AC88" },
];

const FlipbookBuilder = ({ selectedPhotos, onFlipbookChange }) => {
  const [pageCount, setPageCount] = useState(1);
  const [pages, setPages] = useState([
    {
      id: 1,
      imageCount: 1,
      background: "white",
      imageShapes: ["rectangle"],
    },
  ]);
  const [activePageTab, setActivePageTab] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const currentPage = pages[activePageTab];

  const handlePageCountChange = (e) => {
    const count = parseInt(e.target.value) || 1;
    setPageCount(count);

    // Create or adjust pages
    const newPages = [...pages];
    if (count > newPages.length) {
      for (let i = newPages.length; i < count; i++) {
        newPages.push({
          id: i + 1,
          imageCount: 1,
          background: "white",
          imageShapes: ["rectangle"],
        });
      }
    } else {
      newPages.splice(count);
    }
    setPages(newPages);
  };

  const handleImageCountChange = (e) => {
    const count = parseInt(e.target.value) || 1;
    const newPages = [...pages];
    newPages[activePageTab].imageCount = Math.min(count, 6);

    // Adjust image shapes array
    const currentShapes = newPages[activePageTab].imageShapes;
    if (count > currentShapes.length) {
      for (let i = currentShapes.length; i < count; i++) {
        currentShapes.push("rectangle");
      }
    } else {
      currentShapes.splice(count);
    }

    setPages(newPages);
    onFlipbookChange(newPages);
  };

  const handleBackgroundChange = (e) => {
    const newPages = [...pages];
    newPages[activePageTab].background = e.target.value;
    setPages(newPages);
    onFlipbookChange(newPages);
  };

  const handleImageShapeChange = (index, shape) => {
    const newPages = [...pages];
    newPages[activePageTab].imageShapes[index] = shape;
    setPages(newPages);
    onFlipbookChange(newPages);
  };

  const handlePageDelete = () => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((_, idx) => idx !== activePageTab);
    setPages(newPages);
    setPageCount(newPages.length);
    setActivePageTab(Math.max(0, activePageTab - 1));
    onFlipbookChange(newPages);
  };

  const getBackgroundColor = (bgId) => {
    return BACKGROUND_OPTIONS.find((bg) => bg.id === bgId)?.color || "#FFFFFF";
  };

  const getImageShapeStyle = (shape) => {
    switch (shape) {
      case "circle":
        return { borderRadius: "50%" };
      case "polaroid":
        return { boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "8px" };
      case "rounded":
        return { borderRadius: "16px" };
      case "hexagon":
        return { clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" };
      default:
        return {};
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Step 2: Design Your Flipbook Pages
      </Typography>

      {/* Page Count Selection */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="How many pages for your flipbook?"
              type="number"
              value={pageCount}
              onChange={handlePageCountChange}
              inputProps={{ min: 1, max: 50 }}
              helperText="You can have up to 50 pages (6 images per page max)"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Total Photos Available: {selectedPhotos.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Estimated Photos Needed: {pages.reduce((sum, p) => sum + p.imageCount, 0)}
            </Typography>
          </Grid>
        </Grid>
      </Card>

      {/* Page Editor Tabs */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={activePageTab} onChange={(e, newValue) => setActivePageTab(newValue)}>
            {pages.map((page, idx) => (
              <Tab key={idx} label={`Page ${idx + 1}`} />
            ))}
          </Tabs>
        </Box>

        {/* Page Settings */}
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Number of Images on this Page"
                type="number"
                value={currentPage.imageCount}
                onChange={handleImageCountChange}
                inputProps={{ min: 1, max: 6 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Page Background</InputLabel>
                <Select
                  value={currentPage.background}
                  onChange={handleBackgroundChange}
                  label="Page Background"
                >
                  {BACKGROUND_OPTIONS.map((bg) => (
                    <MenuItem key={bg.id} value={bg.id}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            backgroundColor: bg.color,
                            border: "1px solid #ddd",
                            borderRadius: 1,
                          }}
                        />
                        {bg.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Image Shape Selection */}
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Choose Shape for Each Image:
          </Typography>
          <Grid container spacing={2}>
            {currentPage.imageShapes.map((shape, idx) => (
              <Grid item xs={12} sm={6} key={idx}>
                <FormControl fullWidth>
                  <InputLabel>Image {idx + 1} Shape</InputLabel>
                  <Select
                    value={shape}
                    onChange={(e) => handleImageShapeChange(idx, e.target.value)}
                    label={`Image ${idx + 1} Shape`}
                  >
                    {IMAGE_SHAPES.map((shapeOpt) => (
                      <MenuItem key={shapeOpt.id} value={shapeOpt.id}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <span>{shapeOpt.icon}</span>
                          {shapeOpt.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Page Delete Button */}
        {pages.length > 1 && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: "divider", display: "flex", justifyContent: "flex-end" }}>
            <Button
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handlePageDelete}
              variant="outlined"
            >
              Delete This Page
            </Button>
          </Box>
        )}
      </Card>

      {/* Live Preview of Current Page */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            📖 Live Preview - Page {activePageTab + 1}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Hover over image to resize
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: getBackgroundColor(currentPage.background),
            aspectRatio: "1/1.4",
            p: 3,
            borderRadius: 2,
            display: "grid",
            gridTemplateColumns:
              currentPage.imageCount === 1
                ? "1fr"
                : currentPage.imageCount === 2
                ? "1fr 1fr"
                : "1fr 1fr 1fr",
            gap: 2,
            alignContent: "center",
            justifyContent: "center",
            minHeight: 400,
            border: "2px solid #ddd",
            position: "relative",
          }}
        >
          {currentPage.imageShapes.map((shape, idx) => {
            const photoIndex = activePageTab * currentPage.imageCount + idx;
            const photo = selectedPhotos[photoIndex];
            const photoUrl = photo?.signedUrl || photo?.url || photo?.photoUrl;

            return (
              <Box
                key={idx}
                sx={{
                  backgroundColor: "#e0e0e0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  color: "#999",
                  fontWeight: 600,
                  aspectRatio: shape === "polaroid" ? "1/1.3" : "1/1",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "grab",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    transform: "scale(1.02)",
                  },
                  backgroundImage: photoUrl ? `url(${photoUrl})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  ...getImageShapeStyle(shape),
                }}
              >
                {!photoUrl && (
                  <Box sx={{ textAlign: "center" }}>
                    <div>No Image</div>
                    <div style={{ fontSize: "10px", marginTop: "4px" }}>Slot {idx + 1}</div>
                  </Box>
                )}
                {/* Resize Indicator */}
                {photoUrl && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 4,
                      right: 4,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      opacity: 0,
                      transition: "opacity 0.3s ease",
                      pointerEvents: "none",
                      ".parent:hover &": {
                        opacity: 1,
                      },
                    }}
                  >
                    ↔️ Resizable
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
        <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: "block" }}>
          📌 Background: {BACKGROUND_OPTIONS.find((bg) => bg.id === currentPage.background)?.label} | 
          {" "}Images: {currentPage.imageCount} | Photos Available: {selectedPhotos.length}
        </Typography>
      </Card>

      {/* Summary Card */}
      <Card sx={{ p: 3, backgroundColor: "#f5f5f5" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          📊 Flipbook Summary:
        </Typography>
        <Grid container spacing={2}>
          {pages.map((page, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Box
                sx={{
                  backgroundColor: "white",
                  p: 2,
                  borderRadius: 1,
                  border: "1px solid #ddd",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Page {idx + 1}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {page.imageCount} image{page.imageCount > 1 ? "s" : ""} • {BACKGROUND_OPTIONS.find((bg) => bg.id === page.background)?.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Card>
    </Box>
  );
};

export default FlipbookBuilder;
