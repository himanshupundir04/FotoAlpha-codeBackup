import React from "react";
import {
  Box,
  Card,
  Grid,
  Typography,
  Button,
  Container,
  Stepper,
  Step,
  StepLabel,
  Alert,
} from "@mui/material";
import {
  Collections as CollectionsIcon,
  Dashboard as DashboardIcon,
  GridView as GridViewIcon,
  Settings as SettingsIcon,
  Preview as PreviewIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";

/**
 * AlbumCreationShowcase - Visual guide for the new album creation system
 * This component demonstrates all the features of the professional album creator
 */
const AlbumCreationShowcase = () => {
  const steps = [
    {
      number: 1,
      title: "Choose Template",
      description: "Select from 6 professional album templates",
      icon: <CollectionsIcon sx={{ fontSize: 40, color: "#2196f3" }} />,
      features: [
        "Classic - Timeless designs",
        "Modern - Contemporary style",
        "Premium Wedding - Luxurious layouts",
        "Story - Narrative-driven",
        "Festival - Vibrant celebrations",
        "Minimal - Focus on photos",
      ],
    },
    {
      number: 2,
      title: "Select & Arrange Photos",
      description: "Choose and order your photos with drag & drop",
      icon: <DashboardIcon sx={{ fontSize: 40, color: "#4caf50" }} />,
      features: [
        "Browse all event photos",
        "Filter by tags",
        "Multi-select checkbox",
        "Drag-to-reorder",
        "Visual numbering",
        "Quick remove option",
      ],
    },
    {
      number: 3,
      title: "Arrange Layout",
      description: "Choose layout presets and preview your album",
      icon: <GridViewIcon sx={{ fontSize: 40, color: "#ff9800" }} />,
      features: [
        "Multiple grid options (1×1, 2×2, etc)",
        "Live photo preview",
        "Layout capacity info",
        "Template-specific layouts",
        "Professional spacing",
        "Responsive design",
      ],
    },
    {
      number: 4,
      title: "Customize",
      description: "Add album details and select your theme",
      icon: <SettingsIcon sx={{ fontSize: 40, color: "#9c27b0" }} />,
      features: [
        "Album name & description",
        "Theme selection (4 styles)",
        "Cover image setup",
        "Subtitle customization",
        "Page size options",
        "Metadata configuration",
      ],
    },
    {
      number: 5,
      title: "Preview & Create",
      description: "Final review before creating your album",
      icon: <PreviewIcon sx={{ fontSize: 40, color: "#f44336" }} />,
      features: [
        "Full album cover preview",
        "Sample page layouts",
        "Print specifications",
        "Final adjustments",
        "Error validation",
        "One-click creation",
      ],
    },
  ];

  const templates = [
    { name: "Classic", emoji: "🎞️", color: "#8B7355" },
    { name: "Modern", emoji: "✨", color: "#FF6B6B" },
    { name: "Premium", emoji: "💎", color: "#D4AF37" },
    { name: "Story", emoji: "📖", color: "#2196F3" },
    { name: "Festival", emoji: "🎉", color: "#FF9800" },
    { name: "Minimal", emoji: "⬜", color: "#333333" },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 6, textAlign: "center" }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          📸 Professional Album Creation System
        </Typography>
        <Typography variant="h6" color="textSecondary" sx={{ mb: 3 }}>
          Create stunning photo albums with professional layouts like marriage
          photographers
        </Typography>
        <Alert severity="success" icon="✨" sx={{ display: "inline-block" }}>
          Complete step-by-step wizard for building beautiful albums
        </Alert>
      </Box>

      {/* Feature Overview */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          ✨ Key Features
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                🎨 6 Professional Templates
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Designed specifically for photographers
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                🎯 Smart Layout Builder
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Live preview with customizable grids
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                🖼️ Drag-and-Drop Photos
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Reorder photos with intuitive interface
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                🎭 4 Theme Styles
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Classic, Modern, Vintage, Elegant
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                👁️ Professional Preview
              </Typography>
              <Typography variant="body2" color="textSecondary">
                See before you create
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                📱 Fully Responsive
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Works on mobile, tablet, desktop
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Templates Gallery */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          🎨 Available Templates
        </Typography>
        <Grid container spacing={2}>
          {templates.map((template) => (
            <Grid item xs={6} sm={4} md={2} key={template.name}>
              <Card
                sx={{
                  p: 2,
                  textAlign: "center",
                  backgroundColor: template.color,
                  color: "white",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: 4,
                  },
                }}
              >
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {template.emoji}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {template.name}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 5-Step Wizard */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 4 }}>
          🚀 5-Step Album Creation Wizard
        </Typography>

        <Stepper orientation="vertical">
          {steps.map((step, index) => (
            <Step key={index} active={true}>
              <StepLabel>
                <Box display="flex" alignItems="center" gap={2}>
                  {step.icon}
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Step {step.number}: {step.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {step.description}
                    </Typography>
                  </Box>
                </Box>
              </StepLabel>
              <Box sx={{ ml: 4, mt: 2, mb: 3 }}>
                <Grid container spacing={1}>
                  {step.features.map((feature, idx) => (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                      <Card sx={{ p: 1.5, bgcolor: "#f5f5f5" }}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          ✓ {feature}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* User Benefits */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          💡 Benefits for Photographers
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                ⚡ Time-Saving
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Create professional albums in minutes instead of hours with
                pre-designed templates and intuitive workflow.
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                🎯 Professional Results
              </Typography>
              <Typography variant="body2" color="textSecondary">
                No design experience needed. Templates are created by
                professionals for perfect results every time.
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                💼 Client Impression
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Impress clients with stunning album designs. Increase perceived
                value of photography services.
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                💰 Additional Revenue
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Offer albums as premium add-ons to increase average order value
                and client satisfaction.
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                📲 Mobile Friendly
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Create albums on the go with fully responsive design that works
                perfectly on all devices.
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                🔄 Easy Revisions
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Make changes anytime with the draft system. No need to start
                from scratch.
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Technical Specs */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          🔧 Technical Specifications
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#2196f3" }}>
                Page Quality
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                300 DPI
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Print-ready professional quality
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#4caf50" }}>
                Supported Sizes
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                A4, A3, etc.
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Multiple page size options
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#ff9800" }}>
                Export Formats
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                PDF + Digital
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Print or share digitally
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* CTA Button */}
      <Box sx={{ textAlign: "center" }}>
        <Button
          variant="contained"
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            fontSize: "1.1rem",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #5568d3 0%, #653a95 100%)",
            },
          }}
        >
          <DownloadIcon sx={{ mr: 1 }} />
          Start Creating Your Album Now
        </Button>
        <Typography variant="caption" color="textSecondary" sx={{ display: "block", mt: 2 }}>
          No design skills required • Takes 5-10 minutes • Professional results
        </Typography>
      </Box>
    </Container>
  );
};

export default AlbumCreationShowcase;
