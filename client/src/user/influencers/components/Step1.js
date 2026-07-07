import React from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Grid,
  Fade,
  alpha,
  useTheme,
} from "@mui/material";
import { CloudUploadOutlined, AutoAwesomeOutlined } from "@mui/icons-material";

const Step1 = ({ lang, creationType, onCreationTypeChange }) => {
  const theme = useTheme();

  return (
    <Fade in timeout={500}>
      <Box>
        <Typography
          variant="h6"
          fontWeight={700}
          gutterBottom
          sx={{ mb: 3, textAlign: "center" }}
        >
          {lang.howToCreate ||
            "How would you like to create your AI character?"}
        </Typography>

        <Grid container spacing={3}>
          {/* Upload Option */}
          <Grid item xs={12} md={6}>
            <Paper
              onClick={() => onCreationTypeChange("upload")}
              sx={{
                p: 4,
                borderRadius: 3,
                cursor: "pointer",
                border: `3px solid ${
                  creationType === "upload"
                    ? theme.palette.primary.main
                    : theme.palette.divider
                }`,
                bgcolor:
                  creationType === "upload"
                    ? alpha(theme.palette.primary.main, 0.05)
                    : "transparent",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: `0 12px 24px ${alpha(
                    theme.palette.primary.main,
                    0.15,
                  )}`,
                },
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 3,
                  mx: "auto",
                }}
              >
                <CloudUploadOutlined
                  sx={{ fontSize: 40, color: theme.palette.primary.main }}
                />
              </Box>
              <Typography
                variant="h6"
                fontWeight={700}
                textAlign="center"
                gutterBottom
              >
                {lang.uploadPhoto || "Upload Photo"}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                {lang.uploadPhotoDesc ||
                  "Use your own image to create a character. Best for real people or existing photos."}
              </Typography>
              <Box sx={{ mt: 3, textAlign: "center" }}>
                <Chip
                  label={lang.quickAndEasy || "Quick & Easy"}
                  size="small"
                  color="primary"
                />
              </Box>
            </Paper>
          </Grid>

          {/* AI Generate Option */}
          <Grid item xs={12} md={6}>
            <Paper
              onClick={() => onCreationTypeChange("prompt")}
              sx={{
                p: 4,
                borderRadius: 3,
                cursor: "pointer",
                border: `3px solid ${
                  creationType === "prompt"
                    ? theme.palette.primary.main
                    : theme.palette.divider
                }`,
                bgcolor:
                  creationType === "prompt"
                    ? alpha(theme.palette.primary.main, 0.05)
                    : "transparent",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: `0 12px 24px ${alpha(
                    theme.palette.secondary.main,
                    0.15,
                  )}`,
                },
              }}
            >
              {/* Sparkle effect */}
              <Box
                sx={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  animation: "sparkle 2s infinite",
                  "@keyframes sparkle": {
                    "0%, 100%": { opacity: 0.3 },
                    "50%": { opacity: 1 },
                  },
                }}
              >
                <AutoAwesomeOutlined
                  sx={{
                    fontSize: 24,
                  }}
                />
              </Box>

              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 3,
                  mx: "auto",
                }}
              >
                <AutoAwesomeOutlined
                  sx={{
                    fontSize: 40,
                  }}
                />
              </Box>
              <Typography
                variant="h6"
                fontWeight={700}
                textAlign="center"
                gutterBottom
              >
                {lang.aiGenerate || "AI Generate"}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                {lang.aiGenerateDesc ||
                  "Create a unique character using AI. Describe what you want and let AI bring it to life."}
              </Typography>
              <Box sx={{ mt: 3, textAlign: "center" }}>
                <Chip
                  label={lang.poweredByAI || "✨ Powered by AI"}
                  size="small"
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};

export default Step1;
