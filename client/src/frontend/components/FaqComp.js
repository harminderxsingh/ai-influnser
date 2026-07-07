import React from "react";
import { Box, Typography, Collapse } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { TranslateContext } from "../../context/TranslateContext";
import { useCustomTheme } from "../../utils/useCustomTheme";

const FaqItem = ({ item, index, isOpen, onToggle }) => {
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

  if (!item.question) return null;

  return (
    <Box
      sx={{
        borderRadius: `${config.card.borderRadius}px`,
        border: `1px solid ${isOpen ? accentColor || btnBg : borderColor}`,
        background: bgPaper,
        overflow: "hidden",
        transition: "border-color 0.25s ease, box-shadow 0.25s ease",
        boxShadow: isOpen
          ? isDark
            ? `0 0 0 1px ${accentColor || btnBg}22, 0 8px 32px rgba(0,0,0,0.4)`
            : `0 0 0 1px ${accentColor || btnBg}15, 0 8px 32px rgba(0,0,0,0.08)`
          : "none",
      }}
    >
      {/* ── Question row ── */}
      <Box
        onClick={() => onToggle(index)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 2.2,
          cursor: "pointer",
          gap: 2,
          userSelect: "none",
        }}
      >
        <Typography
          sx={{
            fontSize: "0.95rem",
            fontWeight: config.font_weight_semibold,
            color: isOpen ? accentColor || btnBg : textPrimary,
            fontFamily: config.font_family,
            lineHeight: 1.5,
            transition: "color 0.25s ease",
            flex: 1,
          }}
        >
          {item.question}
        </Typography>

        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isOpen
              ? accentColor || btnBg
              : isDark
                ? `${borderColor}55`
                : `${borderColor}88`,
            transition: "background 0.25s ease",
          }}
        >
          {isOpen ? (
            <RemoveIcon
              sx={{
                fontSize: "0.9rem",
                color: isOpen ? btnColor : textSecondary,
              }}
            />
          ) : (
            <AddIcon sx={{ fontSize: "0.9rem", color: textSecondary }} />
          )}
        </Box>
      </Box>

      {/* ── Answer ── */}
      <Collapse in={isOpen} timeout={300}>
        <Box
          sx={{
            px: 3,
            pb: 2.5,
            borderTop: `1px solid ${borderColor}`,
            pt: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.87rem",
              color: textSecondary,
              fontFamily: config.font_family,
              lineHeight: 1.8,
            }}
          >
            {item.answer}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
};

// ─────────────────────────────────────────────
const FaqComp = () => {
  const { lang } = React.useContext(TranslateContext);
  const { config, isDark } = useCustomTheme();
  const [openIndex, setOpenIndex] = React.useState(0);

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

  const faqItems = [
    { question: lang?.faq1Question || "", answer: lang?.faq1Answer || "" },
    { question: lang?.faq2Question || "", answer: lang?.faq2Answer || "" },
    { question: lang?.faq3Question || "", answer: lang?.faq3Answer || "" },
    { question: lang?.faq4Question || "", answer: lang?.faq4Answer || "" },
    { question: lang?.faq5Question || "", answer: lang?.faq5Answer || "" },
    { question: lang?.faq6Question || "", answer: lang?.faq6Answer || "" },
  ].filter((item) => item.question);

  const handleToggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

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
          <HelpOutlineIcon
            sx={{
              fontSize: "0.75rem",
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
            {lang?.faqBadge || "FAQ"}
          </Typography>
        </Box>

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
          {lang?.faqTitle || "Got"}{" "}
          <Box component="span" sx={{ color: accentColor || textSecondary }}>
            {lang?.faqTitleAccent || "questions?"}
          </Box>
        </Typography>

        <Typography
          sx={{
            fontSize: "1rem",
            color: textSecondary,
            fontFamily: config.font_family,
            lineHeight: 1.7,
          }}
        >
          {lang?.faqSubtitle ||
            "Everything you need to know. Can't find the answer? Reach out to our support team."}
        </Typography>
      </Box>

      {/* ── FAQ list ── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          width: "100%",
          maxWidth: "780px",
        }}
      >
        {faqItems.map((item, index) => (
          <FaqItem
            key={index}
            item={item}
            index={index}
            isOpen={openIndex === index}
            onToggle={handleToggle}
          />
        ))}
      </Box>
    </Box>
  );
};

export default FaqComp;
