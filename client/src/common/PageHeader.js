import React from "react";
import { Box, Typography, useTheme, alpha, useMediaQuery } from "@mui/material";
import { usePanelChrome } from "../utils/usePanelChrome";

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
  const chrome = usePanelChrome(240);

  return (
    <Box
      sx={{
        mb: 3,
        p: { xs: 2, sm: 3 },
        backgroundColor: backgroundColor || theme.palette.background.paper,
        borderRadius: 2,
        border: gradientBorder
          ? `1px solid ${theme.palette.divider}`
          : `1px solid ${theme.palette.divider}`,
        ...chrome.pageHeaderSx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {Icon && (
            <Box
              sx={{
                width: { xs: 40, sm: 50 },
                height: { xs: 40, sm: 50 },
                borderRadius: 2,
                background: gradientIcon
                  ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                  : alpha(theme.palette.primary.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: gradientIcon ? "white" : theme.palette.primary.main,
                ...chrome.pageHeaderIconSx,
              }}
            >
              <Icon sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </Box>
          )}
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: chrome.fontFamily || undefined,
                ...(chrome.variant === "editorial"
                  ? { fontFamily: '"Playfair Display", Georgia, serif' }
                  : {}),
                ...(chrome.variant === "cyber" || chrome.variant === "sharp"
                  ? { letterSpacing: "0.04em", textTransform: "uppercase" }
                  : {}),
              }}
            >
              {title}
            </Typography>
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

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          {secondaryActions}
          {primaryAction}
        </Box>
      </Box>
    </Box>
  );
};

export default PageHeader;
