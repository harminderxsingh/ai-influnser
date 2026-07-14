import React from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Home as HomeIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import ProfileDialog from "./ProfileDialog";
import { usePanelChrome } from "../../utils/usePanelChrome";

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
  const pageLabel = selectedMenu
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const history = useHistory();
  const chrome = usePanelChrome(260);

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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {web?.site_logo ? (
                <Box
                  onClick={() => history.push("/")}
                  component="img"
                  src={`/media/${web?.site_logo}`}
                  alt={web?.site_name || "Logo"}
                  sx={{ height: 100, objectFit: "contain", cursor: "pointer" }}
                />
              ) : (
                <Typography variant="subtitle1" fontWeight={700}>
                  {web?.site_name || "Admin"}
                </Typography>
              )}
            </Box>

            <IconButton onClick={toggleColorMode} size="small">
              {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
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
            px: 3,
            pt: 3,
            pb: 0,
            ...chrome.topBarSx,
          }}
        >
          {/* Breadcrumb */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <HomeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <ChevronRightIcon sx={{ fontSize: 16, color: "text.disabled" }} />
            <Typography
              variant="body2"
              sx={{ color: "text.primary", fontWeight: 600 }}
            >
              {pageLabel}
            </Typography>
          </Box>

          {/* Right side */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {/* Dark mode toggle */}
            <IconButton
              onClick={toggleColorMode}
              size="small"
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: "background.paper",
              }}
            >
              {isDark ? (
                <Brightness7Icon fontSize="small" />
              ) : (
                <Brightness4Icon fontSize="small" />
              )}
            </IconButton>

            <ProfileDialog lang={lang} />
          </Box>
        </Box>
      )}
    </>
  );
};

export default TopBar;
