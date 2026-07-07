import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Slide,
  useTheme,
  alpha,
  useMediaQuery,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CommonDialog = ({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  fullScreen = false,
  maxWidth = "md",
  fullWidth = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDark = theme.palette.mode === "dark";

  // ✅ Resolve the actual paper bg color — never trust alpha alone in dark mode
  const paperBg = theme.palette.background.default;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen || isMobile}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      TransitionComponent={Transition}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(12px) saturate(180%)",
            WebkitBackdropFilter: "blur(12px) saturate(180%)",
            backgroundColor: isDark
              ? alpha("#000000", 0.7)
              : alpha("#000000", 0.4),
          },
        },
      }}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: fullScreen || isMobile ? 0 : 3,

          // ✅ THE FIX: dark mode uses a solid dark color, not a transparent one
          background: isDark
            ? `linear-gradient(135deg, ${alpha(paperBg, 0.92)} 0%, ${alpha(paperBg, 0.97)} 100%)`
            : theme.palette.background.paper,

          // ✅ Force a minimum dark background so glass never bleeds white
          backgroundColor: isDark ? paperBg : theme.palette.background.paper,

          backdropFilter: isDark ? "blur(24px) saturate(180%)" : "none",
          WebkitBackdropFilter: isDark ? "blur(24px) saturate(180%)" : "none",

          border: `1px solid ${
            isDark ? alpha("#ffffff", 0.1) : alpha("#000000", 0.08)
          }`,

          overflow: "hidden",
          boxShadow: isDark
            ? `0 8px 40px ${alpha("#000000", 0.6)}, 0 0 0 1px ${alpha("#ffffff", 0.06)}`
            : `0 8px 32px ${alpha("#000000", 0.12)}`,
        },
      }}
    >
      {/* ── Header ── */}
      <DialogTitle
        sx={{
          p: 0,
          // ✅ Dark mode header uses a very subtle tint, not a light gradient
          background: isDark
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,

          // ✅ Explicit background color fallback so it never goes transparent-white
          backgroundColor: isDark
            ? alpha(paperBg, 1)
            : theme.palette.background.paper,

          borderBottom: `1px solid ${
            isDark ? alpha("#ffffff", 0.08) : alpha("#000000", 0.06)
          }`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {Icon && (
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: theme.palette.primary.contrastText,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
                  flexShrink: 0,
                }}
              >
                <Icon sx={{ fontSize: 22 }} />
              </Box>
            )}
            <Box>
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{
                  color: theme.palette.text.primary,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    display: "block",
                    mt: 0.5,
                    lineHeight: 1.4,
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              ml: 1,
              flexShrink: 0,
              color: theme.palette.text.secondary,
              bgcolor: isDark ? alpha("#ffffff", 0.06) : alpha("#000000", 0.04),
              "&:hover": {
                bgcolor: alpha(theme.palette.error.main, 0.15),
                color: theme.palette.error.main,
                transform: "rotate(90deg)",
              },
              transition: "all 0.3s ease",
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ── Content ── */}
      <DialogContent
        sx={{
          p: 3,

          // ✅ Explicit content area bg — prevents MUI default white bleed
          backgroundColor: isDark ? paperBg : theme.palette.background.paper,

          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": {
            background: isDark
              ? alpha("#ffffff", 0.04)
              : alpha("#000000", 0.04),
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: isDark
              ? alpha("#ffffff", 0.15)
              : alpha("#000000", 0.15),
            borderRadius: "3px",
            "&:hover": {
              background: isDark
                ? alpha("#ffffff", 0.25)
                : alpha("#000000", 0.25),
            },
          },
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default CommonDialog;
