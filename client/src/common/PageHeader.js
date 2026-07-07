import React from "react";
import { Box, Typography, useTheme, alpha, useMediaQuery } from "@mui/material";

const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  primaryAction,
  secondaryActions,
  backgroundColor,
  gradientIcon = false,
  gradientBorder = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        mb: 3,
        p: { xs: 2, sm: 3 },
        backgroundColor: backgroundColor || theme.palette.background.paper,
        borderRadius: 2,
        border: gradientBorder
          ? "0.5px solid transparent"
          : `1px solid ${theme.palette.divider}`,
        backgroundImage: gradientBorder
          ? `linear-gradient(${backgroundColor || theme.palette.background.paper}, ${backgroundColor || theme.palette.background.paper}), linear-gradient(90deg, #A78BFA, #EC4899, #F97316)`
          : "none",
        backgroundOrigin: "border-box",
        backgroundClip: gradientBorder
          ? "padding-box, border-box"
          : "padding-box",
      }}
    >
      {/* Header Content */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        {/* Left Side - Title & Subtitle */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {Icon && (
            <Box
              sx={{
                width: { xs: 40, sm: 50 },
                height: { xs: 40, sm: 50 },
                borderRadius: 2,
                background: gradientIcon
                  ? "linear-gradient(135deg, #A78BFA 0%, #EC4899 50%, #F97316 100%)"
                  : alpha(theme.palette.primary.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: gradientIcon ? "white" : theme.palette.primary.main,
              }}
            >
              <Icon sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </Box>
          )}
          <Box>
            <Typography variant="h5">{title}</Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: "0.813rem", sm: "0.875rem" },
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Right Side - Action Buttons */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          {/* Render secondary actions (can be Button, Stack, or any component) */}
          {secondaryActions}

          {/* Render primary action (can be Button or any component) */}
          {primaryAction}
        </Box>
      </Box>
    </Box>
  );
};

export default PageHeader;
