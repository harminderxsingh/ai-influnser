import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import LicenseRequired from "./LicenseRequired"; // adjust path as needed

export const ThemeDataContext = createContext(null);

const defaultThemeConfig = {
  // Brand Colors
  primary: "#6366F1",
  secondary: "#8B5CF6",
  accent: "#06B6D4",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  background_default_light: "#F9FAFB",
  background_paper_light: "#FFFFFF",
  background_default_dark: "#0F172A",
  background_paper_dark: "#1E293B",

  text_primary_light: "#1F2937",
  text_secondary_light: "#6B7280",
  text_disabled_light: "#9CA3AF",
  text_primary_dark: "#F9FAFB",
  text_secondary_dark: "#CBD5E1",
  text_disabled_dark: "#64748B",

  divider_light: "#E5E7EB",
  divider_dark: "#334155",
  border_light: "#D1D5DB",
  border_dark: "#475569",

  button: {
    contained: {
      borderRadius: 12,
      padding: "10px 24px",
      fontSize: "0.9375rem",
      fontWeight: 600,
      textTransform: "none",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      hoverBoxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      hoverTransform: "translateY(-2px)",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    outlined: {
      borderRadius: 12,
      padding: "10px 24px",
      fontSize: "0.9375rem",
      fontWeight: 600,
      textTransform: "none",
      borderWidth: "1.5px",
      hoverBorderWidth: "2px",
      hoverBgOpacity: 0.08,
    },
    text: {
      borderRadius: 12,
      padding: "10px 16px",
      fontSize: "0.9375rem",
      fontWeight: 600,
      textTransform: "none",
      hoverBgOpacity: 0.08,
    },
    small: { padding: "6px 16px", fontSize: "0.8125rem" },
    medium: { padding: "10px 24px", fontSize: "0.9375rem" },
    large: { padding: "14px 32px", fontSize: "1rem" },
  },

  card: {
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    hoverBoxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    hoverTransform: "translateY(-4px)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "none",
    borderColor_light: "#E5E7EB",
    borderColor_dark: "#334155",
  },

  box: { defaultBorderRadius: 12, defaultPadding: 16, defaultMargin: 0 },

  paper: {
    borderRadius: 16,
    elevation0: "none",
    elevation1: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    elevation2: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    elevation3: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    elevation4: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },

  textField: {
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: "1rem",
    borderColor_light: "#D1D5DB",
    borderColor_dark: "#475569",
    focusBorderColor: "#6366F1",
    focusBorderWidth: "2px",
    hoverBorderColor: "#6366F1",
    errorBorderColor: "#EF4444",
    backgroundColor_light: "#FFFFFF",
    backgroundColor_dark: "#1E293B",
  },

  chip: {
    borderRadius: 8,
    padding: "4px 12px",
    fontSize: "0.875rem",
    fontWeight: 500,
    height: 32,
    deleteIconSize: 18,
  },

  dialog: {
    borderRadius: 20,
    padding: 24,
    maxWidth: "sm",
    backdropBlur: "8px",
    backdropOpacity: 0.5,
  },

  appBar: {
    height: 88,
    padding: "0 24px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    backgroundColor_light: "#FFFFFF",
    backgroundColor_dark: "#1E293B",
    borderBottom: "none",
    // Frontend header / footer logo (admin: Web Theme → Components → AppBar)
    logoHeightXs: 56,
    logoHeightSm: 64,
    logoHeightMd: 72,
    logoMaxWidthXs: 200,
    logoMaxWidthSm: 240,
    logoMaxWidthMd: 280,
    logoMinWidthXs: 120,
    logoMinWidthMd: 140,
    footerLogoHeight: 80,
    footerLogoMaxWidth: 280,
  },

  drawer: {
    width: 280,
    borderRadius: 0,
    backgroundColor_light: "#FFFFFF",
    backgroundColor_dark: "#1E293B",
    itemPadding: "12px 16px",
    itemBorderRadius: 8,
    itemHoverBg_light: "#F3F4F6",
    itemHoverBg_dark: "#334155",
    itemActiveBg_light: "#EEF2FF",
    itemActiveBg_dark: "#312E81",
    itemActiveColor: "#6366F1",
  },

  tooltip: {
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: "0.875rem",
    backgroundColor_light: "#1F2937",
    backgroundColor_dark: "#F9FAFB",
    color_light: "#FFFFFF",
    color_dark: "#1F2937",
    maxWidth: 300,
    arrow: true,
  },

  alert: {
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: "0.9375rem",
    fontWeight: 500,
    iconSize: 22,
  },

  snackbar: {
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: "0.9375rem",
    maxWidth: 600,
    autoHideDuration: 6000,
  },

  table: {
    headerBg_light: "#F9FAFB",
    headerBg_dark: "#1E293B",
    headerFontWeight: 600,
    headerFontSize: "0.875rem",
    rowHoverBg_light: "#F9FAFB",
    rowHoverBg_dark: "#334155",
    cellPadding: "16px",
    borderColor_light: "#E5E7EB",
    borderColor_dark: "#334155",
  },

  tabs: {
    indicatorColor: "#6366F1",
    indicatorHeight: 3,
    tabPadding: "12px 24px",
    tabFontSize: "0.9375rem",
    tabFontWeight: 600,
    tabMinHeight: 48,
  },

  accordion: {
    borderRadius: 12,
    padding: "16px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    expandIconColor: "#6B7280",
  },

  menu: {
    borderRadius: 12,
    padding: "8px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    itemPadding: "10px 16px",
    itemBorderRadius: 8,
    itemFontSize: "0.9375rem",
  },

  switch: {
    width: 42,
    height: 24,
    thumbSize: 18,
    trackBorderRadius: 12,
    checkedColor: "#6366F1",
    uncheckedColor: "#D1D5DB",
  },

  checkbox: {
    size: 20,
    borderRadius: 4,
    checkedColor: "#6366F1",
    borderWidth: 2,
  },

  radio: { size: 20, checkedColor: "#6366F1", borderWidth: 2 },

  slider: {
    height: 4,
    thumbSize: 16,
    trackColor: "#6366F1",
    railColor: "#E5E7EB",
    borderRadius: 4,
  },

  avatar: {
    small: 32,
    medium: 40,
    large: 56,
    borderRadius: "50%",
    border: "none",
  },

  badge: {
    fontSize: "0.75rem",
    fontWeight: 600,
    height: 20,
    minWidth: 20,
    padding: "0 6px",
    borderRadius: 10,
  },

  breadcrumbs: {
    fontSize: "0.875rem",
    separator: "/",
    separatorColor: "#9CA3AF",
  },

  stepper: {
    connectorHeight: 2,
    connectorColor: "#E5E7EB",
    activeColor: "#6366F1",
    completedColor: "#10B981",
    iconSize: 24,
  },

  pagination: {
    borderRadius: 8,
    itemSize: 32,
    fontSize: "0.875rem",
    selectedBg: "#6366F1",
    selectedColor: "#FFFFFF",
    hoverBg: "#F3F4F6",
  },

  divider: {
    thickness: 1,
    color_light: "#E5E7EB",
    color_dark: "#334155",
    margin: "16px 0",
  },

  list: {
    itemPadding: "12px 16px",
    itemBorderRadius: 8,
    itemHoverBg_light: "#F9FAFB",
    itemHoverBg_dark: "#334155",
    itemSelectedBg_light: "#EEF2FF",
    itemSelectedBg_dark: "#312E81",
  },

  font_family:
    '"Inter", "Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
  font_size_base: 16,
  font_weight_light: 300,
  font_weight_regular: 400,
  font_weight_medium: 500,
  font_weight_semibold: 600,
  font_weight_bold: 700,

  spacing_unit: 8,
  transition_duration: "0.2s",
  transition_easing: "cubic-bezier(0.4, 0, 0.2, 1)",

  gradient_primary: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
  gradient_secondary: "linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)",
  gradient_success: "linear-gradient(135deg, #10B981 0%, #059669 100%)",

  glass_bg_light: "rgba(255, 255, 255, 0.7)",
  glass_bg_dark: "rgba(30, 41, 59, 0.7)",
  glass_blur: "10px",

  ai_accent_1: "#A78BFA",
  ai_accent_2: "#34D399",
  ai_accent_3: "#60A5FA",
  ai_glow: "0 0 20px rgba(99, 102, 241, 0.3)",
};

export const ThemeDataProvider = ({ children }) => {
  const [themeConfig, setThemeConfig] = useState(defaultThemeConfig);
  const [themeId, setThemeId] = useState("default");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("dark");
  const [licenseRequired, setLicenseRequired] = useState(false); // 🆕

  const resetThemeToDefault = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_BASE_URL}/api/theme/reset-theme-config`,
      );
      window.location.reload();
    } catch (error) {
      setThemeConfig(defaultThemeConfig);
    }
  };

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/api/theme/get-theme-config`,
        );

        // 🆕 License gate check
        if (response.data.licenseRequired === true) {
          setLicenseRequired(true);
          return;
        }

        if (response.data.success && response.data.data) {
          try {
            if (response.data.themeId) {
              setThemeId(response.data.themeId);
            }
            const mergedConfig = deepMerge(
              defaultThemeConfig,
              response.data.data,
            );
            setThemeConfig(mergedConfig);
          } catch (mergeError) {
            await resetThemeToDefault();
          }
        }
      } catch (error) {
        // Also handle licenseRequired inside error responses (non-2xx)
        if (error.response?.data?.licenseRequired === true) {
          setLicenseRequired(true);
          return;
        }
        console.log("Failed to fetch theme, using defaults:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTheme();

    const savedMode = localStorage.getItem("theme_mode");
    if (savedMode === "dark" || savedMode === "light") {
      setMode(savedMode);
    }
  }, []);

  const toggleColorMode = (originX, originY) => {
    const newMode = mode === "light" ? "dark" : "light";

    if (!document.startViewTransition) {
      setMode(newMode);
      localStorage.setItem("theme_mode", newMode);
      return;
    }

    const maxRadius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY),
    );

    document
      .startViewTransition(() => {
        setMode(newMode);
        localStorage.setItem("theme_mode", newMode);
      })
      .ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${originX}px ${originY}px)`,
              `circle(${maxRadius}px at ${originX}px ${originY}px)`,
            ],
          },
          {
            duration: 500,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      });
  };

  // 🆕 Render license wall before anything else
  if (licenseRequired) {
    return <LicenseRequired />;
  }

  const value = {
    themeConfig,
    setThemeConfig,
    themeId,
    loading,
    mode,
    toggleColorMode,
    defaultThemeConfig,
    resetThemeToDefault,
  };

  return (
    <ThemeDataContext.Provider value={value}>
      {children}
    </ThemeDataContext.Provider>
  );
};

function deepMerge(target, source) {
  try {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    return output;
  } catch (error) {
    console.error("Deep merge error:", error);
    throw error;
  }
}

function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

export const useThemeData = () => {
  const context = useContext(ThemeDataContext);
  if (!context) {
    throw new Error("useThemeData must be used within ThemeDataProvider");
  }
  return context;
};
