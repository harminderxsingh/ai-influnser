import React from "react";
import { Box, Typography, Button, alpha, useTheme } from "@mui/material";
import {
  HomeOutlined,
  ArrowBack,
  SearchOffOutlined,
} from "@mui/icons-material";
import { useHistory } from "react-router-dom";

const NotFoundPage = () => {
  const theme = useTheme();
  const history = useHistory();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Background glows ── */}
      <Box
        sx={{
          position: "absolute",
          top: "-15%",
          left: "-10%",
          width: "50%",
          height: "60%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-15%",
          right: "-10%",
          width: "45%",
          height: "55%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* ── Grid pattern ── */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
          linear-gradient(${alpha(theme.palette.divider, 0.6)} 1px, transparent 1px),
          linear-gradient(90deg, ${alpha(theme.palette.divider, 0.6)} 1px, transparent 1px)
        `,
          backgroundSize: "40px 40px",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />

      {/* ── Main card ── */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          px: { xs: 3, sm: 6 },
          py: { xs: 5, sm: 7 },
          mx: 2,
          maxWidth: 560,
          width: "100%",
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(16px)",
          boxShadow: `0 24px 80px ${alpha("#000", 0.08)}`,
        }}
      >
        {/* Icon circle */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            border: "1.5px solid",
            borderColor: alpha(theme.palette.primary.main, 0.2),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 3,
          }}
        >
          <SearchOffOutlined sx={{ fontSize: 36, color: "primary.main" }} />
        </Box>

        {/* 404 big number */}
        <Box sx={{ position: "relative", mb: 1 }}>
          <Typography
            sx={{
              fontSize: { xs: "7rem", sm: "9rem" },
              fontWeight: 900,
              lineHeight: 1,
              background: `linear-gradient(135deg,
                ${theme.palette.primary.main} 0%,
                ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-4px",
              userSelect: "none",
            }}
          >
            404
          </Typography>

          {/* Reflection / shadow text */}
          <Typography
            sx={{
              fontSize: { xs: "7rem", sm: "9rem" },
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-4px",
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: `linear-gradient(to bottom,
                ${alpha(theme.palette.primary.main, 0.15)} 0%,
                transparent 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              transform: "scaleY(-1)",
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            404
          </Typography>
        </Box>

        {/* Spacer for reflection */}
        <Box sx={{ height: { xs: "3rem", sm: "4rem" } }} />

        {/* Divider line */}
        <Box
          sx={{
            width: 60,
            height: 3,
            borderRadius: 99,
            background: `linear-gradient(90deg,
              ${theme.palette.primary.main},
              ${theme.palette.secondary.main})`,
            mb: 3,
          }}
        />

        {/* Title */}
        <Typography
          variant="h5"
          fontWeight={800}
          color="text.primary"
          sx={{ mb: 1.5, fontSize: { xs: "1.2rem", sm: "1.5rem" } }}
        >
          Page Not Found
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 4,
            lineHeight: 1.7,
            maxWidth: 380,
            fontSize: { xs: "0.85rem", sm: "0.95rem" },
          }}
        >
          Oops! The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </Typography>

        {/* Buttons */}
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Button
            variant="contained"
            startIcon={<HomeOutlined />}
            onClick={() => history.push("/")}
            sx={{
              borderRadius: 99,
              px: 3,
              py: 1.1,
              fontWeight: 700,
              textTransform: "none",
              fontSize: "0.9rem",
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            Go Home
          </Button>

          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => history.goBack()}
            sx={{
              borderRadius: 99,
              px: 3,
              py: 1.1,
              fontWeight: 700,
              textTransform: "none",
              fontSize: "0.9rem",
              borderColor: alpha(theme.palette.primary.main, 0.35),
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
            }}
          >
            Go Back
          </Button>
        </Box>

        {/* Bottom hint */}
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ mt: 4, fontSize: "0.72rem" }}
        >
          Error code: 404 · Page not found
        </Typography>
      </Box>
    </Box>
  );
};

export default NotFoundPage;
