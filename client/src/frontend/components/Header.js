import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useScrollTrigger,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { useCustomTheme } from "../../utils/useCustomTheme";
import { GlobalContext } from "../../context/GlobalContext";
import { TranslateContext } from "../../context/TranslateContext";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = 70;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

const Header = () => {
  const history = useHistory();
  const { hitAxios } = React.useContext(GlobalContext);
  const { lang } = React.useContext(TranslateContext);
  const [web, setWeb] = React.useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { config, isDark, toggleColorMode } = useCustomTheme();

  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 20 });

  // ── nav links built from lang ──
  const NAV_LINKS = [
    { label: lang?.overview || "Overview", id: "overview" },
    { label: lang?.features || "Features", id: "features" },
    { label: lang?.pricing || "Pricing", id: "pricing" },
    { label: lang?.faq || "FAQ", id: "faq" },
  ];

  async function getWebPublic() {
    const res = await hitAxios({
      path: "/api/web/get_web_public",
      post: false,
      admin: false,
    });
    if (res.data.success) {
      setWeb(res.data.data);
    }
  }

  React.useEffect(() => {
    getWebPublic();
  }, []);

  const appBarBg = isDark
    ? config.appBar.backgroundColor_dark
    : config.appBar.backgroundColor_light;
  const textPrimary = isDark
    ? config.text_primary_dark
    : config.text_primary_light;
  const textSecondary = isDark
    ? config.text_secondary_dark
    : config.text_secondary_light;
  const borderColor = isDark ? config.border_dark : config.border_light;
  const drawerBg = isDark
    ? config.drawer.backgroundColor_dark
    : config.drawer.backgroundColor_light;
  const itemHoverBg = isDark
    ? config.drawer.itemHoverBg_dark
    : config.drawer.itemHoverBg_light;
  const btnBg = isDark
    ? config.button.contained.backgroundColor_dark
    : config.button.contained.backgroundColor_light;
  const btnColor = isDark
    ? config.button.contained.color_dark
    : config.button.contained.color_light;

  const siteName = web?.site_name || "ReelAI";
  const logoUrl = web?.site_logo ? `/media/${web.site_logo}` : null;

  const ThemeToggleButton = () => (
    <IconButton
      onClick={toggleColorMode}
      sx={{
        color: textSecondary,
        border: `1px solid ${borderColor}`,
        borderRadius: `${config.button.contained.borderRadius}px`,
        width: 34,
        height: 34,
        transition: `all ${config.transition_duration} ${config.transition_easing}`,
        "&:hover": {
          color: textPrimary,
          background: isDark
            ? config.action_hover_dark
            : config.action_hover_light,
        },
      }}
    >
      {isDark ? (
        <LightModeRoundedIcon sx={{ fontSize: 17 }} />
      ) : (
        <DarkModeRoundedIcon sx={{ fontSize: 17 }} />
      )}
    </IconButton>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: trigger ? appBarBg : "transparent",
          backdropFilter: trigger ? `blur(${config.glass_blur})` : "none",
          borderBottom: trigger ? `1px solid ${borderColor}` : "none",
          transition: `all ${config.transition_duration} ${config.transition_easing}`,
          height: config.appBar.height,
          justifyContent: "center",
        }}
      >
        <Toolbar
          sx={{
            maxWidth: "1200px",
            width: "100%",
            mx: "auto",
            px: { xs: 2, md: 3 },
            minHeight: `${config.appBar.height}px !important`,
            justifyContent: "space-between",
          }}
        >
          {/* ── Logo ── */}
          <Box
            component="a"
            href="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              textDecoration: "none",
            }}
          >
            {logoUrl ? (
              <Box
                component="img"
                src={logoUrl}
                alt={siteName}
                sx={{
                  height: 40,
                  maxWidth: 120,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            ) : (
              <>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: `${config.box.defaultBorderRadius}px`,
                    background: isDark
                      ? config.gradient_primary_dark
                      : config.gradient_primary_light,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: isDark ? "#000" : "#fff",
                      fontFamily: config.font_family,
                      lineHeight: 1,
                    }}
                  >
                    {siteName?.charAt(0)}
                  </Typography>
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: config.font_weight_semibold,
                    color: textPrimary,
                    fontFamily: config.font_family,
                    letterSpacing: "-0.3px",
                    fontSize: "0.9375rem",
                  }}
                >
                  {siteName}
                </Typography>
              </>
            )}
          </Box>

          {/* ── Desktop Nav ── */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 0.5,
            }}
          >
            {NAV_LINKS.map((link) => (
              <Button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                sx={{
                  color: textSecondary,
                  fontSize: config.button.text.fontSize,
                  fontWeight: config.button.text.fontWeight,
                  fontFamily: config.font_family,
                  textTransform: config.button.text.textTransform,
                  borderRadius: `${config.button.text.borderRadius}px`,
                  px: 1.5,
                  py: 0.75,
                  "&:hover": {
                    color: textPrimary,
                    background: isDark
                      ? config.action_hover_dark
                      : config.action_hover_light,
                  },
                  transition: `all ${config.transition_duration} ${config.transition_easing}`,
                }}
              >
                {link.label}
              </Button>
            ))}
          </Box>

          {/* ── Desktop CTA ── */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1,
            }}
          >
            <ThemeToggleButton />

            <Button
              onClick={() => history.push("/user")}
              sx={{
                color: textSecondary,
                fontSize: config.button.text.fontSize,
                fontWeight: config.button.text.fontWeight,
                fontFamily: config.font_family,
                textTransform: "none",
                borderRadius: `${config.button.text.borderRadius}px`,
                "&:hover": {
                  color: textPrimary,
                  background: isDark
                    ? config.action_hover_dark
                    : config.action_hover_light,
                },
              }}
            >
              {lang?.login || "Login"}
            </Button>

            <Button
              onClick={() => history.push("/user")}
              variant="contained"
              disableElevation
              sx={{
                background: btnBg,
                color: btnColor,
                fontSize: config.button.contained.fontSize,
                fontWeight: config.button.contained.fontWeight,
                fontFamily: config.font_family,
                textTransform: config.button.contained.textTransform,
                borderRadius: `${config.button.contained.borderRadius}px`,
                padding: config.button.contained.padding,
                boxShadow: config.button.contained.boxShadow,
                transition: config.button.contained.transition,
                "&:hover": {
                  background: btnBg,
                  boxShadow: config.button.contained.hoverBoxShadow,
                  transform: config.button.contained.hoverTransform,
                  opacity: 0.88,
                },
              }}
            >
              {lang?.getStarted || "Get Started"}
            </Button>
          </Box>

          {/* ── Mobile Right Side ── */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              gap: 1,
            }}
          >
            <ThemeToggleButton />
            <IconButton
              sx={{ color: textPrimary }}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Mobile Drawer ── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: config.drawer.width,
            background: drawerBg,
            borderLeft: `1px solid ${borderColor}`,
            px: 1.5,
            py: 2,
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
          <IconButton
            onClick={() => setDrawerOpen(false)}
            sx={{ color: textPrimary }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <List disablePadding>
          {NAV_LINKS.map((link) => (
            <ListItem
              button
              key={link.id}
              onClick={() => {
                scrollToSection(link.id);
                setDrawerOpen(false);
              }}
              sx={{
                borderRadius: `${config.drawer.itemBorderRadius}px`,
                mb: 0.5,
                padding: config.drawer.itemPadding,
                "&:hover": { background: itemHoverBg },
              }}
            >
              <ListItemText
                primary={link.label}
                primaryTypographyProps={{
                  sx: {
                    color: textSecondary,
                    fontWeight: config.font_weight_medium,
                    fontFamily: config.font_family,
                    fontSize: "0.875rem",
                  },
                }}
              />
            </ListItem>
          ))}
        </List>

        <Box
          sx={{
            mt: 2,
            px: 0.5,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Button
            fullWidth
            onClick={() => history.push("/user")}
            sx={{
              color: textSecondary,
              fontFamily: config.font_family,
              textTransform: "none",
              fontSize: config.button.text.fontSize,
              fontWeight: config.font_weight_medium,
              borderRadius: `${config.button.contained.borderRadius}px`,
              border: `1px solid ${borderColor}`,
              "&:hover": {
                background: isDark
                  ? config.action_hover_dark
                  : config.action_hover_light,
              },
            }}
          >
            {lang?.login || "Login"}
          </Button>

          <Button
            fullWidth
            onClick={() => history.push("/user")}
            variant="contained"
            disableElevation
            sx={{
              background: btnBg,
              color: btnColor,
              borderRadius: `${config.button.contained.borderRadius}px`,
              padding: config.button.contained.padding,
              fontWeight: config.button.contained.fontWeight,
              fontFamily: config.font_family,
              textTransform: "none",
              fontSize: config.button.contained.fontSize,
            }}
          >
            {lang?.getStarted || "Get Started"}
          </Button>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
