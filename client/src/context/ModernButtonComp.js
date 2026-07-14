import { Button, Box } from "@mui/material";
import React from "react";
import { useThemeData } from "./ThemeContext";

const ModernButtonComp = ({
  title,
  startIcon,
  endIcon,
  onClick,
  fullWidth,
  disabled,
  variant = "contained", // 'contained', 'outlined', 'text', 'gradient'
  color = "primary",
  size = "medium", // 'small', 'medium', 'large'
  loading = false,
  sx = {},
}) => {
  const { themeConfig, mode } = useThemeData();

  const getGradientStyle = () => {
    if (variant !== "gradient") return {};

    const gradient =
      mode === "light"
        ? themeConfig.gradient_primary_light ||
          themeConfig.gradient_primary ||
          themeConfig.gradient_secondary
        : themeConfig.gradient_primary_dark ||
          themeConfig.gradient_primary ||
          themeConfig.gradient_secondary;

    return {
      background: gradient,
      color: "#FFFFFF",
      border: "none",
      "&:hover": {
        background: gradient,
        opacity: 0.92,
        transform: "translateY(-2px)",
        filter: "saturate(1.1)",
        boxShadow: `${themeConfig.button_shadow_hover || "0 8px 24px rgba(0,0,0,0.15)"}, ${themeConfig.ai_glow || ""}`,
      },
      "&:disabled": {
        background:
          mode === "light"
            ? themeConfig.divider_light
            : themeConfig.divider_dark,
        color:
          mode === "light"
            ? themeConfig.text_disabled_light
            : themeConfig.text_disabled_dark,
      },
    };
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return { padding: "6px 16px", fontSize: "0.8125rem" };
      case "large":
        return { padding: "12px 32px", fontSize: "1rem" };
      default:
        return { padding: "10px 24px", fontSize: "0.9375rem" };
    }
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      variant={variant === "gradient" ? "contained" : variant}
      color={color}
      fullWidth={fullWidth}
      startIcon={!loading && startIcon}
      endIcon={!loading && endIcon}
      sx={{
        position: "relative",
        overflow: "hidden",
        ...getSizeStyles(),
        ...getGradientStyle(),
        "&::before":
          variant === "gradient"
            ? {
                content: '""',
                position: "absolute",
                top: 0,
                left: "-100%",
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                transition: "left 0.5s",
              }
            : {},
        "&:hover::before":
          variant === "gradient"
            ? {
                left: "100%",
              }
            : {},
        ...sx,
      }}
    >
      {loading ? (
        <Box
          component="span"
          sx={{
            display: "inline-block",
            width: 16,
            height: 16,
            border: "2px solid",
            borderColor: "currentColor",
            borderRightColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
            "@keyframes spin": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" },
            },
          }}
        />
      ) : (
        title || "Button"
      )}
    </Button>
  );
};

export default ModernButtonComp;
