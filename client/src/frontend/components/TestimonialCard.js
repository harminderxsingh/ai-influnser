import React from "react";
import { Box, Typography, Avatar } from "@mui/material";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import StarIcon from "@mui/icons-material/Star";
import { useCustomTheme } from "../../utils/useCustomTheme";
import { TranslateContext } from "../../context/TranslateContext";

// ─────────────────────────────────────────────
const TestimonialCard = ({ testimonial }) => {
  const { config, isDark } = useCustomTheme();

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
  const btnColor = isDark
    ? config.button.contained.color_dark
    : config.button.contained.color_light;

  return (
    <Box
      sx={{
        borderRadius: `${config.card.borderRadius}px`,
        border: `1px solid ${borderColor}`,
        background: bgPaper,
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        boxShadow: isDark
          ? "0 8px 32px rgba(0,0,0,0.35)"
          : "0 8px 32px rgba(0,0,0,0.06)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: isDark
            ? "0 20px 60px rgba(0,0,0,0.6)"
            : "0 20px 60px rgba(0,0,0,0.12)",
        },
        breakInside: "avoid",
      }}
    >
      {/* Quote icon + Stars */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <FormatQuoteIcon
          sx={{ fontSize: "2rem", color: accentColor || btnBg, opacity: 0.7 }}
        />
        <Box sx={{ display: "flex", gap: 0.3 }}>
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <StarIcon key={i} sx={{ fontSize: "0.85rem", color: "#F59E0B" }} />
          ))}
        </Box>
      </Box>

      {/* Text */}
      <Typography
        sx={{
          fontSize: "0.88rem",
          color: textSecondary,
          fontFamily: config.font_family,
          lineHeight: 1.75,
          flex: 1,
        }}
      >
        {testimonial.text}
      </Typography>

      {/* Author */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar
          sx={{
            width: 38,
            height: 38,
            fontSize: "0.75rem",
            fontWeight: 700,
            background: accentColor || btnBg,
            color: btnColor,
            fontFamily: config.font_family,
          }}
        >
          {testimonial.avatar}
        </Avatar>
        <Box>
          <Typography
            sx={{
              fontSize: "0.85rem",
              fontWeight: config.font_weight_bold,
              color: textPrimary,
              fontFamily: config.font_family,
              lineHeight: 1.3,
            }}
          >
            {testimonial.name}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.72rem",
              color: textSecondary,
              fontFamily: config.font_family,
              opacity: 0.65,
            }}
          >
            {testimonial.role}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────
const Testimonials = () => {
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

  // ── Testimonials built from lang ──
  const TESTIMONIALS = [
    {
      id: 1,
      name: lang?.test_t1Name || "Sarah Johnson",
      role: lang?.test_t1Role || "Content Creator",
      avatar: lang?.test_t1Avatar || "SJ",
      rating: 5,
      text:
        lang?.test_t1Text ||
        "This platform completely changed how I create content. The AI models are incredibly realistic and save me hours every week.",
    },
    {
      id: 2,
      name: lang?.test_t2Name || "Marcus Lee",
      role: lang?.test_t2Role || "Brand Strategist",
      avatar: lang?.test_t2Avatar || "ML",
      rating: 5,
      text:
        lang?.test_t2Text ||
        "We scaled our brand content 10x without hiring a single extra person. The quality blew our entire team away on day one.",
    },
    {
      id: 3,
      name: lang?.test_t3Name || "Priya Sharma",
      role: lang?.test_t3Role || "Digital Marketer",
      avatar: lang?.test_t3Avatar || "PS",
      rating: 5,
      text:
        lang?.test_t3Text ||
        "I was skeptical at first but the results speak for themselves. Our engagement went up 3x within the first month of using it.",
    },
    {
      id: 4,
      name: lang?.test_t4Name || "James Carter",
      role: lang?.test_t4Role || "Agency Owner",
      avatar: lang?.test_t4Avatar || "JC",
      rating: 5,
      text:
        lang?.test_t4Text ||
        "Running a creative agency means tight deadlines. This tool lets us deliver premium AI content at a pace we never thought possible.",
    },
    {
      id: 5,
      name: lang?.test_t5Name || "Aiko Tanaka",
      role: lang?.test_t5Role || "E-commerce Founder",
      avatar: lang?.test_t5Avatar || "AT",
      rating: 5,
      text:
        lang?.test_t5Text ||
        "Product shoots used to cost us thousands. Now we generate stunning visuals in minutes. It pays for itself every single month.",
    },
    {
      id: 6,
      name: lang?.test_t6Name || "Lena Fischer",
      role: lang?.test_t6Role || "Influencer Manager",
      avatar: lang?.test_t6Avatar || "LF",
      rating: 5,
      text:
        lang?.test_t6Text ||
        "Managing multiple talent accounts is complex. This platform simplified everything — content, scheduling, and AI persona creation.",
    },
  ];

  return (
    <Box
      sx={{
        background: bgDefault,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: { xs: 3, md: 8, lg: 12 },
        py: { xs: 8, md: 10 },
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <Box sx={{ textAlign: "center", mb: 7, maxWidth: 560 }}>
        {/* Badge */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            border: `1px solid ${borderColor}`,
            borderRadius: "50px",
            px: 1.5,
            py: 0.5,
            mb: 2.5,
          }}
        >
          <StarIcon
            sx={{
              fontSize: "0.65rem",
              color: accentColor || btnBg,
              filter: `drop-shadow(0 0 4px ${accentColor || btnBg})`,
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
            {lang?.test_badge || "Testimonials"}
          </Typography>
        </Box>

        {/* Headline */}
        <Typography
          component="h2"
          sx={{
            fontSize: { xs: "2rem", md: "2.8rem" },
            fontWeight: config.font_weight_bold,
            color: textPrimary,
            fontFamily: config.font_family,
            lineHeight: 1.15,
            letterSpacing: "-1px",
            mb: 1.5,
          }}
        >
          {lang?.test_headline1 || "Loved by"}{" "}
          <Box component="span" sx={{ color: accentColor || textSecondary }}>
            {lang?.test_headlineAccent || "creators."}
          </Box>
        </Typography>

        {/* Subheadline */}
        <Typography
          sx={{
            fontSize: "1rem",
            color: textSecondary,
            fontFamily: config.font_family,
            lineHeight: 1.7,
          }}
        >
          {lang?.test_subheadline ||
            "Real people, real results. See what creators and brands are saying about their experience."}
        </Typography>
      </Box>

      {/* ── Masonry grid ── */}
      <Box
        sx={{
          columns: { xs: 1, sm: 2, lg: 3 },
          gap: "20px",
          width: "100%",
          maxWidth: "1100px",
          "& > *": { mb: "20px" },
        }}
      >
        {TESTIMONIALS.map((t) => (
          <TestimonialCard key={t.id} testimonial={t} />
        ))}
      </Box>
    </Box>
  );
};

export default Testimonials;
