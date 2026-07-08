import React from "react";
import { Box, Typography } from "@mui/material";
import { Twitter } from "@mui/icons-material/";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { useCustomTheme } from "../../utils/useCustomTheme";
import { TranslateContext } from "../../context/TranslateContext";
import { GlobalContext } from "../../context/GlobalContext";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

// ─────────────────────────────────────────────
const FooterComp = ({ web: webProp }) => {
  const history = useHistory();
  const { config, isDark } = useCustomTheme();
  const { hitAxios } = React.useContext(GlobalContext);
  const [web, setWeb] = React.useState(webProp || {});
  const { lang } = React.useContext(TranslateContext);

  // ── Moved INSIDE component so lang is available ──
  const FOOTER_LINKS = [
    {
      label: lang?.footer_privacyPolicy || "Privacy Policy",
      href: "/privacy-policy",
    },
    {
      label: lang?.footer_termsConditions || "Terms & Conditions",
      href: "/terms-and-conditions",
    },
    { label: lang?.footer_contactUs || "Contact Us", href: "/contact" },
    { label: lang?.footer_aboutUs || "About Us", href: "/about" },
    { label: lang?.footer_faq || "FAQ", href: "/#faq" },
  ];

  const SOCIAL_LINKS = [
    { icon: <Twitter sx={{ fontSize: "1rem" }} />, href: lang?.twitterLInk },
    {
      icon: <LinkedInIcon sx={{ fontSize: "1rem" }} />,
      href: lang?.linkedInLink,
    },
    {
      icon: <InstagramIcon sx={{ fontSize: "1rem" }} />,
      href: lang?.instagramLink,
    },
    {
      icon: <YouTubeIcon sx={{ fontSize: "1rem" }} />,
      href: lang?.youtubeLInk,
    },
  ];

  async function getWebPublic() {
    const res = await hitAxios({
      path: "/api/web/get_web_public",
      post: false,
      admin: false,
    });
    if (res?.data?.success) {
      setWeb(res.data.data);
    }
  }

  React.useEffect(() => {
    if (webProp) {
      setWeb(webProp);
      return;
    }
    getWebPublic();
  }, [webProp]);

  const bgPaper = isDark
    ? config.background_paper_dark
    : config.background_paper_light;
  const textPrimary = isDark
    ? config.text_primary_dark
    : config.text_primary_light;
  const textSecondary = isDark
    ? config.text_secondary_dark
    : config.text_secondary_light;
  const borderColor = isDark ? config.border_dark : config.border_light;
  const accentColor = isDark
    ? config.text_accent_dark
    : config.text_accent_light;
  const btnBg = isDark
    ? config.button.contained.backgroundColor_dark
    : config.button.contained.backgroundColor_light;

  const currentYear = new Date().getFullYear();
  const siteName = web?.site_name || lang?.appName || "YourBrand";
  const logoUrl = web?.site_logo ? `/media/${web.site_logo}` : null;

  return (
    <Box
      component="footer"
      sx={{
        background: bgPaper,
        borderTop: `1px solid ${borderColor}`,
        px: { xs: 3, md: 8, lg: 12 },
        py: { xs: 5, md: 6 },
      }}
    >
      <Box
        sx={{
          maxWidth: "1100px",
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {/* ── Top row: Brand + Social ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 3,
          }}
        >
          {/* Brand */}
          <Box>
            {logoUrl ? (
              <Box
                component="img"
                src={logoUrl}
                alt={siteName}
                sx={{
                  height: 80,
                  maxWidth: 160,
                  objectFit: "contain",
                  display: "block",
                  mb: 0.8,
                  filter: isDark ? "brightness(1)" : "none",
                }}
              />
            ) : (
              <Typography
                sx={{
                  fontSize: "1.3rem",
                  fontWeight: config.font_weight_bold,
                  color: textPrimary,
                  fontFamily: config.font_family,
                  letterSpacing: "-0.5px",
                  lineHeight: 1,
                  mb: 0.6,
                }}
              >
                {siteName}
              </Typography>
            )}

            <Typography
              sx={{
                fontSize: "0.78rem",
                color: textSecondary,
                fontFamily: config.font_family,
                opacity: 0.6,
                maxWidth: 260,
                lineHeight: 1.6,
              }}
            >
              {lang?.footerTagline ||
                "Empowering creators with AI-powered content tools."}
            </Typography>
          </Box>

          {/* Social icons */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {SOCIAL_LINKS.map((s, i) => (
              <Box
                key={i}
                component="a"
                onClick={() => window.open(s.href)}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: `1px solid ${borderColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: textSecondary,
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    background: accentColor || btnBg,
                    borderColor: "transparent",
                    color: "#fff",
                    transform: "translateY(-2px)",
                  },
                  cursor: "pointer",
                }}
              >
                {s.icon}
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Divider ── */}
        <Box sx={{ height: "1px", background: borderColor, opacity: 0.5 }} />

        {/* ── Links row ── */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: { xs: 2, md: 3 },
            alignItems: "center",
            justifyContent: { xs: "flex-start", sm: "center" },
          }}
        >
          {FOOTER_LINKS.map((link) => (
            <Typography
              key={link.href}
              component="a"
              onClick={() => history.push(link.href)}
              sx={{
                fontSize: "0.8rem",
                color: textSecondary,
                fontFamily: config.font_family,
                textDecoration: "none",
                opacity: 0.7,
                transition: "color 0.2s ease, opacity 0.2s ease",
                "&:hover": {
                  color: accentColor || btnBg,
                  opacity: 1,
                },
                cursor: "pointer",
              }}
            >
              {link.label}
            </Typography>
          ))}
        </Box>

        {/* ── Divider ── */}
        <Box sx={{ height: "1px", background: borderColor, opacity: 0.5 }} />

        {/* ── Bottom row: copyright ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              color: textSecondary,
              fontFamily: config.font_family,
              opacity: 0.5,
            }}
          >
            © {currentYear} {siteName}.{" "}
            {lang?.copyrightText || "All rights reserved."}
          </Typography>

          <Typography
            sx={{
              fontSize: "0.75rem",
              color: textSecondary,
              fontFamily: config.font_family,
              opacity: 0.5,
            }}
          >
            {lang?.footerMadeWith || "Made with ❤️ for creators"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default FooterComp;
