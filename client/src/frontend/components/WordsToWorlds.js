import React, { useRef, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useCustomTheme } from "../../utils/useCustomTheme";
import { TranslateContext } from "../../context/TranslateContext";

// ─────────────────────────────────────────────
const PromptPill = () => {
  const { lang } = React.useContext(TranslateContext);
  const { config, isDark } = useCustomTheme();

  const borderColor = isDark ? config.border_dark : config.border_light;
  const textPrimary = isDark
    ? config.text_primary_dark
    : config.text_primary_light;
  const btnBg = isDark
    ? config.button.contained.backgroundColor_dark
    : config.button.contained.backgroundColor_light;
  const btnColor = isDark
    ? config.button.contained.color_dark
    : config.button.contained.color_light;

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 1,
        background: isDark ? config.glass_bg_dark : config.glass_bg_light,
        backdropFilter: `blur(${config.glass_blur})`,
        border: `1px solid ${borderColor}`,
        borderRadius: "50px",
        px: 2,
        py: 0.8,
        whiteSpace: "nowrap",
        zIndex: 10,
        boxShadow: isDark
          ? "0 4px 20px rgba(0,0,0,0.5)"
          : "0 4px 20px rgba(0,0,0,0.1)",
        animation: "pillFloat 3s ease-in-out infinite",
        "@keyframes pillFloat": {
          "0%, 100%": { transform: "translateX(-50%) translateY(0px)" },
          "50%": { transform: "translateX(-50%) translateY(-5px)" },
        },
      }}
    >
      <Typography
        sx={{
          fontSize: "0.72rem",
          color: textPrimary,
          fontFamily: config.font_family,
          fontWeight: config.font_weight_medium,
        }}
      >
        {lang?.wtw_promptPill || "Show my product in a luxury setting"}
      </Typography>

      {/* Cursor blink */}
      <Box
        sx={{
          width: 1.5,
          height: 13,
          background: textPrimary,
          borderRadius: 1,
          animation: "blink 1s step-end infinite",
          "@keyframes blink": {
            "0%, 100%": { opacity: 1 },
            "50%": { opacity: 0 },
          },
        }}
      />

      {/* Send button */}
      <Box
        sx={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: btnBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill={btnColor}>
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────
const WordsToWorlds = () => {
  const videoRef = useRef(null);
  const { config, isDark } = useCustomTheme();
  const { lang } = React.useContext(TranslateContext);

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
  const accentColor = isDark
    ? config.text_accent_dark
    : config.text_accent_light;
  const btnBg = isDark
    ? config.button.contained.backgroundColor_dark
    : config.button.contained.backgroundColor_light;

  const PILLS = [
    lang?.wtw_pill1 || "Custom AI Model",
    lang?.wtw_pill2 || "Any Scene",
    lang?.wtw_pill3 || "Any Style",
    lang?.wtw_pill4 || "Instant Output",
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play();
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.3 },
    );
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      sx={{
        background: bgDefault,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        px: { xs: 3, md: 8, lg: 12 },
        py: { xs: 8, md: 6 },
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          maxWidth: "1200px",
          width: "100%",
          mx: "auto",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          gap: { xs: 6, md: 10 },
        }}
      >
        {/* ── Left: Text ── */}
        <Box
          sx={{
            flex: "0 0 auto",
            maxWidth: { xs: "100%", md: 340 },
            zIndex: 2,
          }}
        >
          {/* Badge */}
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              background: isDark ? config.glass_bg_dark : config.glass_bg_light,
              border: `1px solid ${borderColor}`,
              borderRadius: "50px",
              px: 1.5,
              py: 0.5,
              mb: 2.5,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: accentColor || btnBg,
                boxShadow: `0 0 8px ${accentColor || btnBg}`,
                animation: "pulse 2s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1, transform: "scale(1)" },
                  "50%": { opacity: 0.5, transform: "scale(1.4)" },
                },
              }}
            />
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: config.font_weight_semibold,
                color: textSecondary,
                fontFamily: config.font_family,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {lang?.wtw_badge || "AI Product Models"}
            </Typography>
          </Box>

          {/* Headline */}
          <Typography
            component="h2"
            sx={{
              fontSize: { xs: "2rem", md: "2.5rem" },
              fontWeight: config.font_weight_bold,
              color: textPrimary,
              fontFamily: config.font_family,
              lineHeight: 1.15,
              letterSpacing: "-1px",
              mb: 2,
            }}
          >
            {lang?.wtw_headline1 || "Your product."}{" "}
            <Box component="span" sx={{ color: accentColor || textSecondary }}>
              {lang?.wtw_headlineAccent || "Your model."}
            </Box>{" "}
            {lang?.wtw_headline2 || "Your story."}
          </Typography>

          {/* Description */}
          <Typography
            sx={{
              fontSize: { xs: "0.9375rem", md: "1rem" },
              color: textSecondary,
              fontFamily: config.font_family,
              fontWeight: config.font_weight_regular,
              lineHeight: 1.75,
              maxWidth: 300,
              mb: 3,
            }}
          >
            {lang?.wtw_description ||
              "Train a custom AI model on your brand. Then let it wear, hold, and showcase your products — in any scene, any style, any world you imagine."}
          </Typography>

          {/* Feature pills */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {PILLS.map((tag) => (
              <Box
                key={tag}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "50px",
                  border: `1px solid ${borderColor}`,
                  background: isDark
                    ? config.glass_bg_dark
                    : config.glass_bg_light,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    color: textSecondary,
                    fontFamily: config.font_family,
                    fontWeight: config.font_weight_medium,
                  }}
                >
                  {tag}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Right: Portrait Video Card ── */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: { xs: "70%", sm: 280, md: 300 },
              maxWidth: 320,
            }}
          >
            {/* Rotating border ring */}
            <Box
              sx={{
                position: "absolute",
                inset: -3,
                borderRadius: `${config.card.borderRadius + 4}px`,
                background: isDark
                  ? `conic-gradient(from 0deg, transparent 0%, ${accentColor || btnBg} 20%, transparent 40%, transparent 60%, ${accentColor || btnBg} 80%, transparent 100%)`
                  : `conic-gradient(from 0deg, transparent 0%, rgba(0,0,0,0.3) 20%, transparent 40%, transparent 60%, rgba(0,0,0,0.3) 80%, transparent 100%)`,
                animation: "spinRing 4s linear infinite",
                "@keyframes spinRing": {
                  from: { transform: "rotate(0deg)" },
                  to: { transform: "rotate(360deg)" },
                },
                zIndex: 0,
              }}
            />

            {/* Glow orb top-left */}
            <Box
              sx={{
                position: "absolute",
                top: "-15%",
                left: "-20%",
                width: "60%",
                height: "60%",
                borderRadius: "50%",
                background: isDark
                  ? `radial-gradient(circle, ${accentColor || btnBg}22 0%, transparent 70%)`
                  : `radial-gradient(circle, rgba(0,0,0,0.06) 0%, transparent 70%)`,
                animation: "orbFloat1 6s ease-in-out infinite",
                "@keyframes orbFloat1": {
                  "0%, 100%": { transform: "translate(0, 0) scale(1)" },
                  "50%": { transform: "translate(10px, -15px) scale(1.1)" },
                },
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {/* Glow orb bottom-right */}
            <Box
              sx={{
                position: "absolute",
                bottom: "-10%",
                right: "-20%",
                width: "55%",
                height: "55%",
                borderRadius: "50%",
                background: isDark
                  ? `radial-gradient(circle, ${accentColor || btnBg}18 0%, transparent 70%)`
                  : `radial-gradient(circle, rgba(0,0,0,0.05) 0%, transparent 70%)`,
                animation: "orbFloat2 7s ease-in-out infinite",
                "@keyframes orbFloat2": {
                  "0%, 100%": { transform: "translate(0, 0) scale(1)" },
                  "50%": { transform: "translate(-10px, 15px) scale(1.15)" },
                },
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {/* Card */}
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                borderRadius: `${config.card.borderRadius}px`,
                overflow: "hidden",
                border: `1px solid ${borderColor}`,
                aspectRatio: "9 / 16",
                boxShadow: isDark
                  ? "0 32px 80px rgba(0,0,0,0.75)"
                  : "0 32px 80px rgba(0,0,0,0.18)",
                animation: "cardFloat 5s ease-in-out infinite",
                "@keyframes cardFloat": {
                  "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
                  "33%": { transform: "translateY(-8px) rotate(0.4deg)" },
                  "66%": { transform: "translateY(-4px) rotate(-0.3deg)" },
                },
                transition: `box-shadow ${config.transition_duration} ${config.transition_easing}`,
                "&:hover": {
                  boxShadow: isDark
                    ? "0 48px 100px rgba(0,0,0,0.9)"
                    : "0 48px 100px rgba(0,0,0,0.25)",
                  animationPlayState: "paused",
                },
              }}
            >
              <video
                ref={videoRef}
                src="/assets/productShowcase.mp4"
                muted
                loop
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top",
                  display: "block",
                }}
              />

              {/* Top shimmer */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "35%",
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 100%)",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />

              {/* Bottom fade */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "45%",
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />

              <PromptPill />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default WordsToWorlds;
