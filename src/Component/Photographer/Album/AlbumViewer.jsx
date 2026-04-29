import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Grid,
  Card,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import EditIcon from "@mui/icons-material/Edit";

const THEME_COLORS = {
  classic: { primary: "#2C3E50", accent: "#8B7355", bg: "#F5E6D3" },
  modern: { primary: "#222222", accent: "#FF6B6B", bg: "#FFFFFF" },
  elegant: { primary: "#1A1A1A", accent: "#C0A080", bg: "#F9F7F4" },
  minimal: { primary: "#333333", accent: "#999999", bg: "#FAFAFA" },
};

const AlbumViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);

  const albumData = location.state?.albumData;
  const eventName = location.state?.eventName;

  if (!albumData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const { title, description, template, photos, layout, customizations } = albumData;
  const theme = THEME_COLORS[customizations.theme] || THEME_COLORS.classic;

  // Create pages based on layout
  const generatePages = () => {
    const pages = [];

    // Page 1: Cover Page
    pages.push({
      type: "cover",
      title,
      subtitle: customizations.subtitle || "A Beautiful Collection of Memories",
      event: eventName,
    });

    // Photo Pages: Distribute photos based on layout
    let photoIndex = 0;
    if (layout.grid === "1fr") {
      // Single photo per page
      while (photoIndex < photos.length) {
        pages.push({
          type: "single",
          photo: photos[photoIndex],
        });
        photoIndex++;
      }
    } else if (layout.grid === "1fr 1fr") {
      // Two photos per page
      while (photoIndex < photos.length) {
        pages.push({
          type: "double",
          photos: [
            photos[photoIndex],
            photos[photoIndex + 1] || null,
          ],
        });
        photoIndex += 2;
      }
    } else if (layout.grid === "1fr 1fr 1fr") {
      // Three photos per page
      while (photoIndex < photos.length) {
        pages.push({
          type: "triple",
          photos: [
            photos[photoIndex],
            photos[photoIndex + 1] || null,
            photos[photoIndex + 2] || null,
          ],
        });
        photoIndex += 3;
      }
    } else {
      // Default: One photo per page
      while (photoIndex < photos.length) {
        pages.push({
          type: "single",
          photo: photos[photoIndex],
        });
        photoIndex++;
      }
    }

    return pages;
  };

  const pages = generatePages();
  const currentPageData = pages[currentPage];

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, pages.length - 1));
  };

  const renderPage = () => {
    if (currentPageData.type === "cover") {
      return (
        <Box
          sx={{
            width: "100%",
            height: "600px",
            backgroundColor: theme.primary,
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            p: 4,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background decoration */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: `url(${customizations.coverImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* Content */}
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: "2rem", md: "3.5rem" },
              }}
            >
              {currentPageData.title}
            </Typography>

            <Box
              sx={{
                width: 80,
                height: 3,
                backgroundColor: theme.accent,
                mx: "auto",
                mb: 3,
              }}
            />

            <Typography
              variant="h6"
              sx={{
                fontWeight: 300,
                letterSpacing: 3,
                mb: 3,
              }}
            >
              {currentPageData.subtitle}
            </Typography>

            <Typography variant="body1" sx={{ opacity: 0.8, fontStyle: "italic" }}>
              {currentPageData.event}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 4,
                opacity: 0.7,
              }}
            >
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Typography>
          </Box>
        </Box>
      );
    }

    if (currentPageData.type === "single") {
      const photo = currentPageData.photo;
      return (
        <Box
          sx={{
            width: "100%",
            height: "600px",
            backgroundColor: theme.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
          }}
        >
          <Box
            sx={{
              width: "90%",
              height: "90%",
              backgroundColor: "white",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={photo.url || photo.signedUrl}
              alt="Album"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </Box>
        </Box>
      );
    }

    if (currentPageData.type === "double") {
      return (
        <Box
          sx={{
            width: "100%",
            height: "600px",
            backgroundColor: theme.bg,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
            p: 4,
          }}
        >
          {currentPageData.photos.map((photo, idx) => (
            <Box
              key={idx}
              sx={{
                backgroundColor: "white",
                boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {photo && (
                <img
                  src={photo.url || photo.signedUrl}
                  alt="Album"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "cover",
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      );
    }

    if (currentPageData.type === "triple") {
      return (
        <Box
          sx={{
            width: "100%",
            height: "600px",
            backgroundColor: theme.bg,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 2,
            p: 4,
          }}
        >
          {currentPageData.photos.map((photo, idx) => (
            <Box
              key={idx}
              sx={{
                backgroundColor: "white",
                boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {photo && (
                <img
                  src={photo.url || photo.signedUrl}
                  alt="Album"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "cover",
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      );
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f5f5", py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 4,
          mb: 4,
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>

        <Box>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            sx={{ mr: 2 }}
            onClick={() => navigate(-1)}
          >
            Edit Album
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            sx={{ mr: 2 }}
          >
            Print
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
          >
            Download PDF
          </Button>
        </Box>
      </Box>

      {/* Album Container */}
      <Box
        sx={{
          maxWidth: "1200px",
          mx: "auto",
          backgroundColor: "white",
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {/* Page Display */}
        {renderPage()}

        {/* Navigation Bar */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 3,
            backgroundColor: "#f9f9f9",
            borderTop: `1px solid #ddd`,
          }}
        >
          <IconButton
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            size="large"
          >
            <ArrowBackIcon />
          </IconButton>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Page {currentPage + 1} of {pages.length}
            </Typography>
            <Box sx={{ mt: 1 }}>
              {pages.map((_, idx) => (
                <Box
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor:
                      idx === currentPage ? theme.accent : "#ddd",
                    display: "inline-block",
                    mx: 0.5,
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                />
              ))}
            </Box>
          </Box>

          <IconButton
            onClick={handleNextPage}
            disabled={currentPage === pages.length - 1}
            size="large"
          >
            <ArrowForwardIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Album Info */}
      <Box sx={{ maxWidth: "1200px", mx: "auto", mt: 4, px: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Typography color="textSecondary" variant="caption">
                Album Name
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, mt: 1 }}>
                {title}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Typography color="textSecondary" variant="caption">
                Total Photos
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, mt: 1 }}>
                {photos.length}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Typography color="textSecondary" variant="caption">
                Template
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, mt: 1 }}>
                {template?.name || "Classic"}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Typography color="textSecondary" variant="caption">
                Total Pages
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, mt: 1 }}>
                {pages.length}
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AlbumViewer;
