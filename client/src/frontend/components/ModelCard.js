import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { useCustomTheme } from "../../utils/useCustomTheme";
import { TranslateContext } from "../../context/TranslateContext";

// ─────────────────────────────────────────────
const ModelCard = ({ model, index, isActive, onClick }) => {
  const { config, isDark } = useCustomTheme();

  const borderColor = isDark ? config.border_dark : config.border_light;
  const accentColor = isDark
    ? config.text_accent_dark
    : config.text_accent_light;
  const btnBg = isDark
    ? config.button.contained.backgroundColor_dark
    : config.button.contained.backgroundColor_light;

  const floatDelays = ["0s", "0.8s", "1.6s", "2.4s"];

  return (
    <Box
      onClick={onClick}
      sx={{
        position: "relative",
        borderRadius: `${config.card.borderRadius}px`,
        overflow: "hidden",
        border: `1.5px solid ${isActive ? accentColor || btnBg : borderColor}`,
        aspectRatio: "3 / 4",
        cursor: "pointer",
        boxShadow: isActive
          ? isDark
            ? `0 0 0 3px ${accentColor || btnBg}44, 0 24px 60px rgba(0,0,0,0.7)`
            : `0 0 0 3px ${accentColor || btnBg}33, 0 24px 60px rgba(0,0,0,0.15)`
          : isDark
            ? "0 8px 32px rgba(59, 51, 51, 0.5)"
            : "0 8px 32px rgba(0,0,0,0.1)",
        animation: `cardFloat${index} 4s ease-in-out infinite`,
        animationDelay: floatDelays[index],
        [`@keyframes cardFloat${index}`]: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-7px)" },
        },
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          animationPlayState: "paused",
          transform: "scale(1.03)",
          transition: "transform 0.3s ease",
        },
        flexShrink: 0,
      }}
    >
      {/* Image */}
      <Box
        component="img"
        src={model.src}
        alt={model.name}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top",
          display: "block",
          transition: "transform 0.5s ease",
          "&:hover": { transform: "scale(1.05)" },
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
            "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)",
          pointerEvents: "none",
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
            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Tag pill top-right */}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          background: isActive ? "gray" || btnBg : "rgba(0,0,0,0.55)",
          backdropFilter: "blur(8px)",
          borderRadius: "50px",
          px: 1,
          py: 0.3,
          transition: "background 0.3s ease",
        }}
      >
        <Typography
          sx={{
            fontSize: "0.58rem",
            fontWeight: 700,
            color: "#fff",
            fontFamily: config.font_family,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {model.tag}
        </Typography>
      </Box>

      {/* Name + type bottom */}
      <Box sx={{ position: "absolute", bottom: 10, left: 10, right: 10 }}>
        <Typography
          sx={{
            fontSize: "0.82rem",
            fontWeight: config.font_weight_bold,
            color: "#fff",
            fontFamily: config.font_family,
            lineHeight: 1.2,
          }}
        >
          {model.name}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.62rem",
            color: "rgba(255,255,255,0.7)",
            fontFamily: config.font_family,
            fontWeight: config.font_weight_medium,
          }}
        >
          {model.type}
        </Typography>
      </Box>

      {/* Active checkmark */}
      {isActive && (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            left: 10,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: accentColor || btnBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
            "@keyframes popIn": {
              "0%": { transform: "scale(0)", opacity: 0 },
              "100%": { transform: "scale(1)", opacity: 1 },
            },
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill={!isActive ? "#fff" : "#000"}
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </Box>
      )}
    </Box>
  );
};

// ─────────────────────────────────────────────
const CreateYourAI = () => {
  const [activeModel, setActiveModel] = useState(1);
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
  const btnColor = isDark
    ? config.button.contained.color_dark
    : config.button.contained.color_light;

  // ── Models built from lang with image paths kept static ──
  const aiModels = [
    {
      id: 1,
      src: "/assets/model1.jpg",
      name: lang?.cya_model1Name || "Luna",
      type: lang?.cya_model1Type || "Fashion Model",
      tag: lang?.cya_model1Tag || "Lifestyle",
    },
    {
      id: 2,
      src: "/assets/model2.jpg",
      name: lang?.cya_model2Name || "Kai",
      type: lang?.cya_model2Type || "Dance Influencer",
      tag: lang?.cya_model2Tag || "Trending",
    },
    {
      id: 3,
      src: "/assets/model3.jpg",
      name: lang?.cya_model3Name || "Zara",
      type: lang?.cya_model3Type || "Brand Ambassador",
      tag: lang?.cya_model3Tag || "Commerce",
    },
    {
      id: 4,
      src: "/assets/model4.jpg",
      name: lang?.cya_model4Name || "Rex",
      type: lang?.cya_model4Type || "Fitness Creator",
      tag: lang?.cya_model4Tag || "Health",
    },
  ];

  const FEATURES = [
    lang?.cya_feature1 || "🎨  Any appearance, ethnicity, style",
    lang?.cya_feature2 || "🧬  Trained on your unique identity",
    lang?.cya_feature3 || "🎬  Ready for reels, ads & shoots",
    lang?.cya_feature4 || "♾️  Unlimited content, zero reshoots",
  ];

  const selected = aiModels.find((m) => m.id === activeModel);

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
              {lang?.cya_badge || "AI Model Builder"}
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
            {lang?.cya_headline1 || "Build your own"}{" "}
            <Box component="span" sx={{ color: accentColor || textSecondary }}>
              {lang?.cya_headlineAccent || "AI model."}
            </Box>{" "}
            {lang?.cya_headline2 || "Any look. Any vibe."}
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
            {lang?.cya_description ||
              "Design a fully custom AI persona — your face, your style, your identity. Then deploy it across videos, reels, campaigns, and product shoots. No camera. No crew."}
          </Typography>

          {/* Feature list */}
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 1.2, mb: 3.5 }}
          >
            {FEATURES.map((item) => (
              <Typography
                key={item}
                sx={{
                  fontSize: "0.875rem",
                  color: textSecondary,
                  fontFamily: config.font_family,
                  lineHeight: 1.5,
                }}
              >
                {item}
              </Typography>
            ))}
          </Box>

          {/* Selected model info + CTA */}
          <Box
            key={activeModel}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1.5,
              borderRadius: `${config.card.borderRadius}px`,
              border: `1px solid ${borderColor}`,
              background: isDark ? config.glass_bg_dark : config.glass_bg_light,
              backdropFilter: `blur(${config.glass_blur})`,
              mb: 2,
              animation: "fadeSlide 0.3s ease",
              "@keyframes fadeSlide": {
                "0%": { opacity: 0, transform: "translateY(6px)" },
                "100%": { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            <Box
              component="img"
              src={selected?.src}
              alt={selected?.name}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
                objectPosition: "top",
                border: `2px solid ${accentColor || btnBg}`,
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: config.font_weight_bold,
                  color: textPrimary,
                  fontFamily: config.font_family,
                  lineHeight: 1.2,
                }}
              >
                {selected?.name}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.68rem",
                  color: textSecondary,
                  fontFamily: config.font_family,
                }}
              >
                {selected?.type}
              </Typography>
            </Box>
            <Box
              sx={{
                px: 1.5,
                py: 0.6,
                borderRadius: "50px",
                background: btnBg,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.68rem",
                  fontWeight: config.font_weight_semibold,
                  color: btnColor,
                  fontFamily: config.font_family,
                  whiteSpace: "nowrap",
                }}
              >
                {lang?.cya_useModel || "Use Model →"}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ── Right: Image Grid ── */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
          }}
        >
          {/* Background glow */}
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "70%",
              height: "70%",
              borderRadius: "50%",
              background: isDark
                ? `radial-gradient(circle, ${accentColor || btnBg}18 0%, transparent 70%)`
                : `radial-gradient(circle, rgba(0,0,0,0.05) 0%, transparent 70%)`,
              pointerEvents: "none",
              animation: "glowPulse 4s ease-in-out infinite",
              "@keyframes glowPulse": {
                "0%, 100%": {
                  opacity: 0.6,
                  transform: "translate(-50%, -50%) scale(1)",
                },
                "50%": {
                  opacity: 1,
                  transform: "translate(-50%, -50%) scale(1.15)",
                },
              },
            }}
          />

          {/* 2×2 Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: { xs: 1.5, md: 2 },
              width: { xs: "100%", sm: 380, md: 420 },
              maxWidth: 460,
              position: "relative",
              zIndex: 1,
            }}
          >
            {aiModels.map((model, index) => (
              <ModelCard
                key={model.id}
                model={model}
                index={index}
                isActive={activeModel === model.id}
                onClick={() => setActiveModel(model.id)}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateYourAI;
