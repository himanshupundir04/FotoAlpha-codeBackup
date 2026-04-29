import React from "react";
import { Box, Card, Grid, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const ALBUM_TEMPLATES = [
  {
    id: "classic",
    name: "Classic Album",
    description: "Timeless design with elegant layouts",
    thumbnail: "🎞️",
    layouts: [
      { type: "single", pages: 20 },
      { type: "double", pages: 15 },
      { type: "grid", cols: 2 },
    ],
  },
  {
    id: "modern",
    name: "Modern Album",
    description: "Contemporary style with clean aesthetics",
    thumbnail: "✨",
    layouts: [
      { type: "full-bleed", pages: 25 },
      { type: "grid", cols: 3 },
      { type: "asymmetric", pages: 20 },
    ],
  },
  {
    id: "premium",
    name: "Premium Wedding Album",
    description: "Luxurious design for wedding photography",
    thumbnail: "💎",
    layouts: [
      { type: "spread", pages: 30 },
      { type: "single", pages: 25 },
      { type: "custom", pages: 20 },
    ],
  },
  {
    id: "story",
    name: "Story Album",
    description: "Narrative-driven layout with captions",
    thumbnail: "📖",
    layouts: [
      { type: "story", pages: 24 },
      { type: "single", pages: 20 },
      { type: "timeline", pages: 16 },
    ],
  },
  {
    id: "festival",
    name: "Festival Album",
    description: "Vibrant design for events & celebrations",
    thumbnail: "🎉",
    layouts: [
      { type: "grid", cols: 4 },
      { type: "collage", pages: 18 },
      { type: "highlights", pages: 20 },
    ],
  },
  {
    id: "minimal",
    name: "Minimal Album",
    description: "Simple and focused on the photographs",
    thumbnail: "⬜",
    layouts: [
      { type: "single", pages: 28 },
      { type: "duo", pages: 24 },
      { type: "canvas", pages: 20 },
    ],
  },
];

const AlbumTemplates = ({ selected, onSelect }) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Choose Your Album Template
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
        Select a professional template designed for photographers. Each template includes
        multiple layout options to arrange your photos beautifully.
      </Typography>

      <Grid container spacing={3}>
        {ALBUM_TEMPLATES.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card
              onClick={() => onSelect(template)}
              sx={{
                cursor: "pointer",
                height: "100%",
                transition: "all 0.3s ease",
                border: selected?.id === template.id ? "3px solid #2196f3" : "1px solid #e0e0e0",
                backgroundColor:
                  selected?.id === template.id ? "#e3f2fd" : "#ffffff",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: 6,
                  borderColor: "#2196f3",
                },
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Selected Indicator */}
              {selected?.id === template.id && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 10,
                  }}
                >
                  <CheckCircleIcon sx={{ color: "#2196f3", fontSize: 28 }} />
                </Box>
              )}

              <Box
                sx={{
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                {/* Template Icon */}
                <Box sx={{ fontSize: 48, mb: 2, textAlign: "center" }}>
                  {template.thumbnail}
                </Box>

                {/* Template Name */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: "text.primary",
                  }}
                >
                  {template.name}
                </Typography>

                {/* Description */}
                <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                  {template.description}
                </Typography>

                {/* Layout Options */}
                <Box sx={{ mt: "auto" }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      fontWeight: 600,
                      color: "text.secondary",
                      mb: 1,
                    }}
                  >
                    Available Layouts:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {template.layouts.map((layout, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          fontSize: "0.75rem",
                          bgcolor: "#f5f5f5",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        {layout.type.replace("-", " ")}
                        {layout.pages && ` (${layout.pages}p)`}
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Selection Badge */}
                {selected?.id === template.id && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1,
                      bgcolor: "#c8e6c9",
                      borderRadius: 1,
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#2e7d32",
                        fontWeight: 600,
                      }}
                    >
                      ✓ Selected
                    </Typography>
                  </Box>
                )}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Template Features */}
      <Card sx={{ mt: 4, p: 3, bgcolor: "#f5f5f5" }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          ✨ What's Included in Every Template
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <li>
            <Typography variant="body2">
              Multiple layout options to arrange photos creatively
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Professional color schemes and design elements
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Customizable cover pages with event details
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              High-quality print preparation (300 DPI)
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Digital preview before finalizing
            </Typography>
          </li>
        </Box>
      </Card>
    </Box>
  );
};

export default AlbumTemplates;
