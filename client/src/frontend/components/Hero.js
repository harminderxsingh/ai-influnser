import React from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Container,
  Dialog,
  IconButton,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useCustomTheme } from "../../utils/useCustomTheme";
import { TranslateContext } from "../../context/TranslateContext";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const Hero = ({ web }) => {
  const history = useHistory();
  const { config, isDark } = useCustomTheme();
  const { lang } = React.useContext(TranslateContext);
  const [videoOpen, setVideoOpen] = React.useState(false);

  // ── theme shortcuts ──
  const bgDefault = isDark
    ? config.background_default_dark
    : config.background_default_light;
  const textPrimary = isDark
    ? config.text_primary_dark
    : config.text_primary_light;
  const textSecondary = isDark
    ? config.text_secondary_dark
    : config.text_secondary_light;
  const borderColor = isDark ? config.border_dark : config.border_light;
  const chipBg = isDark
    ? config.chip.backgroundColor_dark
    : config.chip.backgroundColor_light;
  const chipColor = isDark ? config.chip.color_dark : config.chip.color_light;
  const btnBg = isDark
    ? config.button.contained.backgroundColor_dark
    : config.button.contained.backgroundColor_light;
  const btnColor = isDark
    ? config.button.contained.color_dark
    : config.button.contained.color_light;
  const outlinedBorderColor = isDark
    ? config.button.outlined.borderColor_dark
    : config.button.outlined.borderColor_light;
  const outlinedColor = isDark
    ? config.button.outlined.color_dark
    : config.button.outlined.color_light;
  const glassBg = isDark ? config.glass_bg_dark : config.glass_bg_light;

  // youtube tutorial url from web settings
  const tutorialUrl = web?.youtube_tutorial_url || "";

  // convert any youtube URL to embed format
  function getEmbedUrl(url) {
    if (!url) return "";
    // already embed
    if (url.includes("embed")) return url;
    // youtu.be/ID
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch)
      return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1`;
    // youtube.com/watch?v=ID
    const longMatch = url.match(/[?&]v=([^&]+)/);
    if (longMatch)
      return `https://www.youtube.com/embed/${longMatch[1]}?autoplay=1`;
    return url;
  }

  const embedUrl = getEmbedUrl(tutorialUrl);

  const STATS = [
    {
      value: lang?.heroStat1Value || "10M+",
      label: lang?.heroStat1Label || "Reels Created",
    },
    {
      value: lang?.heroStat2Value || "4.9★",
      label: lang?.heroStat2Label || "Globally",
    },
    {
      value: lang?.heroStat3Value || "Free",
      label: lang?.heroStat3Label || "To Start",
    },
  ];

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          background: bgDefault,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pt: `${config.appBar.height + 32}px`,
          pb: 8,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── Background glow (dark only) ── */}
        {isDark && (
          <>
            <Box
              sx={{
                position: "absolute",
                width: 600,
                height: 600,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
                top: "-100px",
                left: "50%",
                transform: "translateX(-50%)",
                pointerEvents: "none",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                width: 1,
                height: "60%",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                pointerEvents: "none",
              }}
            />
          </>
        )}

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <Stack alignItems="center" spacing={3} textAlign="center">
            {/* ── Badge ── */}
            <Chip
              icon={
                <AutoAwesomeIcon
                  sx={{
                    fontSize: "14px !important",
                    color: `${chipColor} !important`,
                  }}
                />
              }
              label={lang?.heroBadge || "AI-Powered Reel Creation"}
              sx={{
                background: chipBg,
                border: `1px solid ${borderColor}`,
                color: chipColor,
                fontWeight: config.chip.fontWeight,
                fontSize: config.chip.fontSize,
                fontFamily: config.font_family,
                borderRadius: `${config.chip.borderRadius}px`,
                height: config.chip.height,
                px: 0.5,
              }}
            />

            {/* ── Headline ── */}
            <Box>
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: "2.4rem", sm: "3.5rem", md: "4.5rem" },
                  fontWeight: config.font_weight_bold,
                  lineHeight: 1.08,
                  letterSpacing: "-2px",
                  color: textPrimary,
                  fontFamily: config.font_family,
                }}
              >
                {lang?.heroHeadline1 || "Turn Ideas Into"}
              </Typography>

              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: "2.4rem", sm: "3.5rem", md: "4.5rem" },
                  fontWeight: config.font_weight_bold,
                  lineHeight: 1.08,
                  letterSpacing: "-2px",
                  fontFamily: config.font_family,
                  background: isDark
                    ? config.gradient_primary_dark
                    : config.gradient_primary_light,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {lang?.heroHeadlineAccent || "Viral Reels"}
              </Typography>

              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: "2.4rem", sm: "3.5rem", md: "4.5rem" },
                  fontWeight: config.font_weight_bold,
                  lineHeight: 1.08,
                  letterSpacing: "-2px",
                  color: textPrimary,
                  fontFamily: config.font_family,
                }}
              >
                {lang?.heroHeadline3 || "in Seconds."}
              </Typography>
            </Box>

            {/* ── Subheadline ── */}
            <Typography
              sx={{
                fontSize: { xs: "1rem", md: "1.125rem" },
                color: textSecondary,
                fontFamily: config.font_family,
                fontWeight: config.font_weight_regular,
                maxWidth: 520,
                lineHeight: 1.7,
              }}
            >
              {lang?.heroSubheadline ||
                "Generate hyperreal motion, sound, and captions from a single prompt. No editing skills needed — just your idea."}
            </Typography>

            {/* ── CTA Buttons ── */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems="center"
            >
              {/* Primary — Start Creating */}
              <Button
                onClick={() => history.push("/user")}
                variant="contained"
                disableElevation
                startIcon={<PlayArrowRoundedIcon />}
                sx={{
                  background: btnBg,
                  color: btnColor,
                  fontSize: config.button.large.fontSize,
                  fontWeight: config.button.contained.fontWeight,
                  fontFamily: config.font_family,
                  textTransform: "none",
                  borderRadius: `${config.button.contained.borderRadius}px`,
                  padding: config.button.large.padding,
                  boxShadow: config.button.contained.boxShadow,
                  transition: config.button.contained.transition,
                  minWidth: 160,
                  "&:hover": {
                    background: btnBg,
                    opacity: 0.85,
                    boxShadow: config.button.contained.hoverBoxShadow,
                    transform: config.button.contained.hoverTransform,
                  },
                }}
              >
                {lang?.heroCtaStart || "Start Creating"}
              </Button>

              {/* Secondary — Watch Demo (only if youtube url exists) */}
              {tutorialUrl && (
                <Button
                  variant="outlined"
                  disableElevation
                  startIcon={<PlayCircleOutlineRoundedIcon />}
                  onClick={() => setVideoOpen(true)}
                  sx={{
                    color: outlinedColor,
                    borderColor: outlinedBorderColor,
                    fontSize: config.button.large.fontSize,
                    fontWeight: config.button.contained.fontWeight,
                    fontFamily: config.font_family,
                    textTransform: "none",
                    borderRadius: `${config.button.contained.borderRadius}px`,
                    padding: config.button.large.padding,
                    minWidth: 160,
                    transition: config.button.contained.transition,
                    "&:hover": {
                      borderColor: outlinedBorderColor,
                      background: isDark
                        ? config.action_hover_dark
                        : config.action_hover_light,
                      transform: config.button.contained.hoverTransform,
                    },
                  }}
                >
                  {lang?.heroCtaWatch || "Watch Demo"}
                </Button>
              )}
            </Stack>

            {/* ── Social Proof ── */}
            <Stack
              direction="row"
              spacing={3}
              alignItems="center"
              sx={{ pt: 1 }}
            >
              {STATS.map((stat, i) => (
                <Box key={i} textAlign="center">
                  <Typography
                    sx={{
                      fontWeight: config.font_weight_bold,
                      fontSize: "1rem",
                      color: textPrimary,
                      fontFamily: config.font_family,
                      lineHeight: 1.2,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.6875rem",
                      color: textSecondary,
                      fontFamily: config.font_family,
                      fontWeight: config.font_weight_medium,
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Stack>

            {/* ── Preview Card ── */}
            <Box
              sx={{
                mt: 2,
                width: "100%",
                maxWidth: 680,
                borderRadius: `${config.card.borderRadius}px`,
                border: `1px solid ${borderColor}`,
                background: glassBg,
                backdropFilter: `blur(${config.glass_blur})`,
                overflow: "hidden",
                boxShadow: config.card.boxShadow,
              }}
            >
              {/* Fake browser bar */}
              <Box
                sx={{
                  px: 2,
                  py: 1.2,
                  borderBottom: `1px solid ${borderColor}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {["#EF4444", "#F59E0B", "#10B981"].map((c) => (
                  <Box
                    key={c}
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: c,
                    }}
                  />
                ))}
                <Box
                  sx={{
                    ml: 1,
                    flex: 1,
                    height: 22,
                    borderRadius: `${config.textField.borderRadius}px`,
                    background: isDark
                      ? config.action_hover_dark
                      : config.action_hover_light,
                    border: `1px solid ${borderColor}`,
                    display: "flex",
                    alignItems: "center",
                    px: 1.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.6875rem",
                      color: textSecondary,
                      fontFamily: config.font_family,
                    }}
                  >
                    {lang?.heroPreviewUrl || "yourdomain.com/create"}
                  </Typography>
                </Box>
              </Box>

              {/* Fake content area */}
              <Box
                sx={{
                  height: 220,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isDark
                    ? config.background_paper_dark
                    : config.background_paper_light,
                  position: "relative",
                }}
              >
                <Stack alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: isDark
                        ? config.gradient_primary_dark
                        : config.gradient_primary_light,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: isDark
                        ? "0 0 30px rgba(255,255,255,0.1)"
                        : "0 0 30px rgba(0,0,0,0.1)",
                    }}
                  >
                    <PlayArrowRoundedIcon
                      sx={{ color: isDark ? "#000" : "#fff", fontSize: 28 }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.8125rem",
                      color: textSecondary,
                      fontFamily: config.font_family,
                    }}
                  >
                    {lang?.heroGenerating || "Your reel is generating..."}
                  </Typography>

                  {/* Progress bar */}
                  <Box
                    sx={{
                      width: 200,
                      height: 3,
                      borderRadius: 2,
                      background: borderColor,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        width: "65%",
                        height: "100%",
                        background: isDark
                          ? config.gradient_primary_dark
                          : config.gradient_primary_light,
                        borderRadius: 2,
                      }}
                    />
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* ── Video Modal ── */}
      <Dialog
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: "transparent",
            boxShadow: "none",
            overflow: "visible",
          },
        }}
        BackdropProps={{
          sx: { backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.75)" },
        }}
      >
        {/* Close button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
          <IconButton
            onClick={() => setVideoOpen(false)}
            sx={{
              color: "#fff",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              "&:hover": { background: "rgba(255,255,255,0.2)" },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* iframe */}
        <Box
          sx={{
            position: "relative",
            paddingTop: "56.25%", // 16:9
            borderRadius: `${config.card.borderRadius}px`,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Box
            component="iframe"
            src={embedUrl}
            title={lang?.heroCtaWatch || "Watch Demo"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        </Box>
      </Dialog>
    </>
  );
};

export default Hero;
