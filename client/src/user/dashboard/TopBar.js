import React from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Stack,
  Chip,
  Tooltip,
  alpha,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Home as HomeIcon,
  ChevronRight as ChevronRightIcon,
  TokenOutlined,
  WorkspacePremiumOutlined,
} from "@mui/icons-material";
import ProfileComp from "./ProfileComp";
import { UserContext } from "../../context/UserContext";

const TopBar = ({
  lang,
  theme,
  isMobile,
  isDark,
  selectedMenu,
  toggleColorMode,
  handleDrawerToggle,
  web,
}) => {
  const { userData } = React.useContext(UserContext);

  const plan = React.useMemo(() => {
    if (!userData?.plan) return null;
    try {
      return typeof userData.plan === "string"
        ? JSON.parse(userData.plan)
        : userData.plan;
    } catch {
      return null;
    }
  }, [userData?.plan]);

  const credits = Number(userData?.credits || 0);
  const maxCredits = Number(plan?.credits || 0);
  const isLowCredits = maxCredits > 0 && (credits / maxCredits) * 100 <= 20;

  const pageLabel = selectedMenu
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      {/* ── Mobile AppBar ── */}
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary,
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <IconButton
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo */}
            {web?.site_logo ? (
              <Box
                component="img"
                src={`/media/${web.site_logo}`}
                alt={web?.site_name || "Logo"}
                sx={{ height: 26, objectFit: "contain" }}
              />
            ) : (
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, fontSize: "1rem" }}
              >
                {web?.site_name || "App"}
              </Typography>
            )}

            <Stack direction="row" alignItems="center" spacing={1}>
              {/* Credits pill — mobile */}
              {credits > 0 && (
                <Chip
                  icon={<TokenOutlined sx={{ fontSize: "12px !important" }} />}
                  label={credits.toLocaleString()}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    bgcolor: isLowCredits
                      ? alpha(theme.palette.error.main, 0.1)
                      : alpha(theme.palette.warning.main, 0.1),
                    color: isLowCredits ? "error.main" : "warning.main",
                    border: "none",
                    "& .MuiChip-icon": {
                      color: isLowCredits ? "error.main" : "warning.main",
                    },
                  }}
                />
              )}
              <IconButton onClick={toggleColorMode} size="small">
                {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>
      )}

      {/* ── Desktop Top Bar ── */}
      {!isMobile && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 3,
            pb: 0,
          }}
        >
          {/* Breadcrumb */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HomeIcon
              sx={{ fontSize: 20, color: theme.palette.text.secondary }}
            />
            <ChevronRightIcon
              sx={{ fontSize: 18, color: theme.palette.text.disabled }}
            />
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 500,
                textTransform: "capitalize",
              }}
            >
              {pageLabel}
            </Typography>
          </Box>

          {/* ── Right Side ── */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            {/* Plan badge */}
            {plan?.title && (
              <Tooltip title={`${plan.title} plan`}>
                <Chip
                  icon={
                    <WorkspacePremiumOutlined
                      sx={{ fontSize: "13px !important" }}
                    />
                  }
                  label={plan.title}
                  size="small"
                  sx={{
                    height: 26,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    cursor: "default",
                    bgcolor: alpha("#8B5CF6", 0.08),
                    color: "#8B5CF6",
                    border: `1px solid ${alpha("#8B5CF6", 0.2)}`,
                    "& .MuiChip-icon": { color: "#8B5CF6" },
                  }}
                />
              </Tooltip>
            )}

            {/* Credits pill */}
            {credits > 0 && (
              <Tooltip
                title={
                  maxCredits > 0
                    ? `${credits.toLocaleString()} / ${maxCredits.toLocaleString()} ${lang?.credits || "credits remaining"}`
                    : `${credits.toLocaleString()} ${lang?.credits || "credits"}`
                }
              >
                <Chip
                  icon={<TokenOutlined sx={{ fontSize: "13px !important" }} />}
                  label={credits.toLocaleString()}
                  size="small"
                  sx={{
                    height: 26,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    cursor: "default",
                    bgcolor: isLowCredits
                      ? alpha(theme.palette.error.main, 0.08)
                      : alpha(theme.palette.warning.main, 0.08),
                    color: isLowCredits ? "error.main" : "warning.main",
                    border: `1px solid ${
                      isLowCredits
                        ? alpha(theme.palette.error.main, 0.2)
                        : alpha(theme.palette.warning.main, 0.2)
                    }`,
                    "& .MuiChip-icon": {
                      color: isLowCredits ? "error.main" : "warning.main",
                    },
                  }}
                />
              </Tooltip>
            )}

            {/* Dark mode toggle */}
            <IconButton
              onClick={toggleColorMode}
              sx={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>

            <ProfileComp theme={theme} lang={lang} />
          </Stack>
        </Box>
      )}
    </>
  );
};

export default TopBar;
