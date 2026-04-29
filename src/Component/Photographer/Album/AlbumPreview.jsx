import React, { useState } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  Alert,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import InfoIcon from "@mui/icons-material/Info";

const BACKGROUND_COLORS = {
  white: "#ffffff",
  cream: "#FFF8E7",
  "light-gray": "#F5F5F5",
  gold: "#FAE5B8",
  blush: "#FFE4E1",
  sage: "#E8F5E3",
};

const renderImageShape = (shape, imageIndex) => {
  const baseStyle = {
    width: "100%",
    height: "100%",
    backgroundSize: "cover",
    backgroundPosition: "center",
    overflow: "hidden",
  };

  switch (shape) {
    case "circle":
      return { ...baseStyle, borderRadius: "50%" };
    case "polaroid":
      return { ...baseStyle, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" };
    case "rounded":
      return { ...baseStyle, borderRadius: "12px" };
    case "hexagon":
      return { ...baseStyle, clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" };
    default:
      return baseStyle;
  }
};

const AlbumPreview = ({ albumName, flipbookPages, photos }) => {
  const [currentPage, setCurrentPage] = useState(0);

  // Debug logging
  console.log("AlbumPreview received:", { albumName, flipbookPagesCount: flipbookPages?.length, photosCount: photos?.length, photos });

  if (!flipbookPages || flipbookPages.length === 0) {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Step 4: Preview Your Album
        </Typography>
        <Alert severity="info" icon={<InfoIcon />}>
          Design your flipbook in the previous step to preview it here.
        </Alert>
      </Box>
    );
  }

  const currentPageData = flipbookPages[currentPage];
  const bgColor = BACKGROUND_COLORS[currentPageData.background] || BACKGROUND_COLORS.white;

  // Distribute photos across this page
  const photosPerPage = currentPageData.imageCount || 1;
  const photosForThisPage = photos && photos.length > 0 
    ? photos.slice(
        currentPage * photosPerPage,
        (currentPage + 1) * photosPerPage
      )
    : [];

  // Fill empty slots with placeholders
  const filledPhotos = Array.from({ length: currentPageData.imageCount }, (_, idx) => 
    photosForThisPage[idx] || { placeholder: true, id: `placeholder-${idx}` }
  );

  const canGoNext = currentPage < flipbookPages.length - 1;
  const canGoPrev = currentPage > 0;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Step 4: Preview Your Album
      </Typography>

      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        Navigate through your album to see how it will look. Use the arrows to flip pages.
      </Alert>

      {/* Main Flipbook Display */}
      <Card sx={{ mb: 4, overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.15)" }}>
        <Box
          sx={{
            width: "600px",
            height: "1000px",
            backgroundColor: bgColor,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            mx: "auto",
            border: "1px solid #e0e0e0",
          }}
        >
          {/* Page Content Grid - No Padding */}
          <Box
            sx={{
              flex: 1,
              display: "grid",
              gridTemplateColumns:
                currentPageData.imageCount === 4
                  ? "1fr 1fr"
                  : currentPageData.imageCount === 6
                  ? "1fr 1fr 1fr"
                  : currentPageData.imageCount === 3
                  ? "repeat(3, 1fr)"
                  : currentPageData.imageCount === 2
                  ? "1fr 1fr"
                  : "1fr",
              gridAutoRows: currentPageData.imageCount <= 3 ? "auto" : "1fr",
              gap: currentPageData.imageCount === 1 ? 0 : 12,
              padding: currentPageData.imageCount === 1 ? 0 : "20px",
              alignContent: "center",
              justifyContent: "center",
            }}
          >
            {filledPhotos.map((photo, idx) => {
              const photoUrl = photo?.placeholder 
                ? null 
                : (photo?.signedUrl || photo?.url || photo?.photoUrl);
              
              return (
                <Box
                  key={photo?.id || idx}
                  sx={{
                    ...renderImageShape(
                      currentPageData.imageShapes?.[idx] || "rectangle",
                      idx
                    ),
                    backgroundImage: photoUrl ? `url(${photoUrl})` : "none",
                    backgroundColor: photoUrl ? "transparent" : "#e8e8e8",
                    border: "2px solid #ddd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    color: "#999",
                    fontWeight: 500,
                    position: "relative",
                  }}
                >
                  {!photoUrl && (
                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: "center" }}>
                      📷<br/>Empty Slot {idx + 1}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Page Number Footer */}
          <Box
            sx={{
              py: 1.5,
              px: 2,
              textAlign: "center",
              backgroundColor: "rgba(0,0,0,0.02)",
              borderTop: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "#999",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              Page {currentPage + 1} of {flipbookPages.length}
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Navigation Controls */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          disabled={!canGoPrev}
        >
          Previous
        </Button>

        {/* Page Dots */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {flipbookPages.map((_, idx) => (
            <Box
              key={idx}
              onClick={() => setCurrentPage(idx)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: idx === currentPage ? "#1976d2" : "#ddd",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </Box>

        <Button
          variant="outlined"
          endIcon={<ArrowForwardIcon />}
          onClick={() => setCurrentPage((p) => Math.min(flipbookPages.length - 1, p + 1))}
          disabled={!canGoNext}
        >
          Next
        </Button>
      </Box>

      {/* Page Details */}
      <Card sx={{ p: 3, backgroundColor: "#f9f9f9", mb: 4 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          📄 Page {currentPage + 1} Details
        </Typography>

        {photos && photos.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            ⚠️ No photos selected. Go back to Step 2 to select photos for your album.
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Number of Images on This Page
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {currentPageData.imageCount} image{currentPageData.imageCount > 1 ? "s" : ""}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Background Color
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {currentPageData.background?.charAt(0).toUpperCase() +
                  currentPageData.background?.slice(1)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Image Shapes
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {Array.isArray(currentPageData.imageShapes)
                  ? currentPageData.imageShapes
                      .slice(0, currentPageData.imageCount)
                      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                      .join(", ")
                  : "Rectangle"}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Filled / Total Slots
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: photosForThisPage.length === currentPageData.imageCount ? "#4caf50" : "#ff9800" }}>
                {photosForThisPage.length} / {currentPageData.imageCount}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Album Summary */}
      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          📋 Album Summary
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Total Pages
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {flipbookPages.length}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Total Photos
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {photos.length}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Album Name
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {albumName || "Untitled"}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Status
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#4caf50" }}>
                Ready
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default AlbumPreview;
