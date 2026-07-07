import React, { useRef, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useCustomTheme } from "../../utils/useCustomTheme";
import { TranslateContext } from "../../context/TranslateContext";

// ─────────────────────────────────────────────
const FloatingBadge = ({ label, icon, sx }) => {
  const { config, isDark } = useCustomTheme();
  const borderColor = isDark ? config.border_dark : config.border_light;
  const textPrimary = isDark
    ? config.text_primary_dark
    : config.text_primary_light;

  return (
    <Box
      sx={{
        position: "absolute",
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        background: isDark ? config.glass_bg_dark : config.glass_bg_light,
        backdropFilter: `blur(${config.glass_blur})`,
        border: `1px solid ${borderColor}`,
        borderRadius: "50px",
        px: 1.4,
        py: 0.6,
        boxShadow: isDark
          ? "0 4px 20px rgba(0,0,0,0.5)"
          : "0 4px 20px rgba(0,0,0,0.1)",
        zIndex: 10,
        ...sx,
      }}
    >
      <Typography sx={{ fontSize: "0.75rem", lineHeight: 1 }}>
        {icon}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.68rem",
          fontWeight: config.font_weight_semibold,
          color: textPrimary,
          fontFamily: config.font_family,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

// ─────────────────────────────────────────────
const LiveBadge = () => {
  const { lang } = React.useContext(TranslateContext);
  const { config } = useCustomTheme();

  return (
    <Box
      sx={{
        position: "absolute",
        top: 16,
        left: 16,
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        background: "rgba(255, 40, 40, 0.85)",
        backdropFilter: `blur(${config.glass_blur})`,
        border: "1px solid rgba(255,80,80,0.4)",
        borderRadius: "50px",
        px: 1.2,
        py: 0.5,
        zIndex: 10,
      }}
    >
      <Box
        sx={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "#fff",
          animation: "livePulse 1.2s ease-in-out infinite",
          "@keyframes livePulse": {
            "0%, 100%": { opacity: 1, transform: "scale(1)" },
            "50%": { opacity: 0.4, transform: "scale(1.5)" },
          },
        }}
      />
      <Typography
        sx={{
          fontSize: "0.62rem",
          fontWeight: 700,
          color: "#fff",
          fontFamily: config.font_family,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {lang?.rc_live || "Live"}
      </Typography>
    </Box>
  );
};

// ─────────────────────────────────────────────
const StatsBar = () => {
  const { lang } = React.useContext(TranslateContext);
  const { config, isDark } = useCustomTheme();

  const borderColor = isDark ? config.border_dark : config.border_light;
  const textPrimary = isDark
    ? config.text_primary_dark
    : config.text_primary_light;
  const textSecondary = isDark
    ? config.text_secondary_dark
    : config.text_secondary_light;

  const stats = [
    {
      value: lang?.rc_stat1Value || "2.4M",
      label: lang?.rc_stat1Label || "Views",
    },
    {
      value: lang?.rc_stat2Value || "180K",
      label: lang?.rc_stat2Label || "Likes",
    },
    {
      value: lang?.rc_stat3Value || "12K",
      label: lang?.rc_stat3Label || "Shares",
    },
  ];

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        background: isDark ? config.glass_bg_dark : config.glass_bg_light,
        backdropFilter: `blur(${config.glass_blur})`,
        border: `1px solid ${borderColor}`,
        borderRadius: `${config.card.borderRadius}px`,
        overflow: "hidden",
        zIndex: 10,
        whiteSpace: "nowrap",
        animation: "pillFloat 3.5s ease-in-out infinite",
        "@keyframes pillFloat": {
          "0%, 100%": { transform: "translateX(-50%) translateY(0px)" },
          "50%": { transform: "translateX(-50%) translateY(-5px)" },
        },
        boxShadow: isDark
          ? "0 4px 24px rgba(0,0,0,0.5)"
          : "0 4px 24px rgba(0,0,0,0.1)",
      }}
    >
      {stats.map((s, i) => (
        <Box
          key={s.label}
          sx={{
            px: 2,
            py: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRight:
              i < stats.length - 1 ? `1px solid ${borderColor}` : "none",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.78rem",
              fontWeight: config.font_weight_bold,
              color: textPrimary,
              fontFamily: config.font_family,
              lineHeight: 1.2,
            }}
          >
            {s.value}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.6rem",
              color: textSecondary,
              fontFamily: config.font_family,
              fontWeight: config.font_weight_medium,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {s.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// ─────────────────────────────────────────────
const ReelCreator = () => {
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

  const PLATFORMS = [
    { label: lang?.rc_platform1 || "Instagram", icon: "📸" },
    { label: lang?.rc_platform2 || "TikTok", icon: "🎵" },
    { label: lang?.rc_platform3 || "YouTube Shorts", icon: "▶️" },
  ];

  const FEATURES = [
    lang?.rc_feature1 || "🕺  Dance & trend reels on demand",
    lang?.rc_feature2 || "🤖  Your own AI influencer persona",
    lang?.rc_feature3 || "🎯  Auto-optimized for each platform",
    lang?.rc_feature4 || "⚡  From prompt to post in seconds",
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
          flexDirection: { xs: "column", md: "row-reverse" },
          alignItems: "center",
          gap: { xs: 6, md: 10 },
        }}
      >
        {/* ── Text side ── */}
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
              {lang?.rc_badge || "AI Influencer Studio"}
            </Typography>
          </Box>

          {/* Heading */}
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
            {lang?.rc_headline1 || "Create an influencer"}{" "}
            <Box component="span" sx={{ color: accentColor || textSecondary }}>
              {lang?.rc_headlineAccent || "that works for you."}
            </Box>
          </Typography>

          {/* Body */}
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
            {lang?.rc_description ||
              "Generate viral dance reels, trending content, and social-ready videos — powered by your own AI influencer. Built for Instagram, TikTok, and YouTube Shorts."}
          </Typography>

          {/* Platform pills */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            {PLATFORMS.map((p) => (
              <Box
                key={p.label}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.6,
                  px: 1.4,
                  py: 0.55,
                  borderRadius: "50px",
                  border: `1px solid ${borderColor}`,
                  background: isDark
                    ? config.glass_bg_dark
                    : config.glass_bg_light,
                }}
              >
                <Typography sx={{ fontSize: "0.75rem", lineHeight: 1 }}>
                  {p.icon}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    color: textSecondary,
                    fontFamily: config.font_family,
                    fontWeight: config.font_weight_medium,
                  }}
                >
                  {p.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Feature list */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            {FEATURES.map((item) => (
              <Box
                key={item}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Typography
                  sx={{
                    fontSize: "0.875rem",
                    color: textSecondary,
                    fontFamily: config.font_family,
                    fontWeight: config.font_weight_regular,
                    lineHeight: 1.5,
                  }}
                >
                  {item}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Video side ── */}
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
            {/* Rotating ring */}
            <Box
              sx={{
                position: "absolute",
                inset: -3,
                borderRadius: `${config.card.borderRadius + 4}px`,
                background: isDark
                  ? `conic-gradient(from 0deg, transparent 0%, ${accentColor || btnBg} 20%, transparent 40%, transparent 60%, ${accentColor || btnBg} 80%, transparent 100%)`
                  : `conic-gradient(from 0deg, transparent 0%, rgba(0,0,0,0.25) 20%, transparent 40%, transparent 60%, rgba(0,0,0,0.25) 80%, transparent 100%)`,
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
                top: "-18%",
                left: "-22%",
                width: "65%",
                height: "65%",
                borderRadius: "50%",
                background: isDark
                  ? `radial-gradient(circle, ${accentColor || btnBg}28 0%, transparent 70%)`
                  : `radial-gradient(circle, rgba(0,0,0,0.06) 0%, transparent 70%)`,
                animation: "orbFloat1 6s ease-in-out infinite",
                "@keyframes orbFloat1": {
                  "0%, 100%": { transform: "translate(0,0) scale(1)" },
                  "50%": { transform: "translate(10px,-15px) scale(1.1)" },
                },
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {/* Glow orb bottom-right */}
            <Box
              sx={{
                position: "absolute",
                bottom: "-12%",
                right: "-22%",
                width: "60%",
                height: "60%",
                borderRadius: "50%",
                background: isDark
                  ? `radial-gradient(circle, ${accentColor || btnBg}20 0%, transparent 70%)`
                  : `radial-gradient(circle, rgba(0,0,0,0.05) 0%, transparent 70%)`,
                animation: "orbFloat2 7s ease-in-out infinite",
                "@keyframes orbFloat2": {
                  "0%, 100%": { transform: "translate(0,0) scale(1)" },
                  "50%": { transform: "translate(-10px,15px) scale(1.15)" },
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
                src="/assets/danceDemo.mp4"
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

              {/* Top fade */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "30%",
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 100%)",
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
                  height: "50%",
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />

              <LiveBadge />
              <StatsBar />
            </Box>

            {/* Floating platform badges */}
            <FloatingBadge
              label={lang?.rc_platform1 || "Instagram"}
              icon="📸"
              sx={{
                top: "12%",
                right: "-38%",
                animation: "badgeFloat1 4s ease-in-out infinite",
                "@keyframes badgeFloat1": {
                  "0%, 100%": { transform: "translateY(0px)" },
                  "50%": { transform: "translateY(-7px)" },
                },
              }}
            />
            <FloatingBadge
              label={lang?.rc_platform2 || "TikTok"}
              icon="🎵"
              sx={{
                top: "38%",
                left: "-38%",
                animation: "badgeFloat2 5s ease-in-out infinite",
                "@keyframes badgeFloat2": {
                  "0%, 100%": { transform: "translateY(0px)" },
                  "50%": { transform: "translateY(-6px)" },
                },
              }}
            />
            <FloatingBadge
              label={lang?.rc_platform3 || "Shorts"}
              icon="▶️"
              sx={{
                bottom: "18%",
                right: "-34%",
                animation: "badgeFloat3 4.5s ease-in-out infinite",
                "@keyframes badgeFloat3": {
                  "0%, 100%": { transform: "translateY(0px)" },
                  "50%": { transform: "translateY(-8px)" },
                },
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ReelCreator;
