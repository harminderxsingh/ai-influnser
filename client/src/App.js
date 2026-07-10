import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import HomeMainPage from "./HomeMainPage";
import { GlobalProvider } from "./context/GlobalContext";
import CurrencyProvider from "./context/CurrencyContext";
import { TranslateProvider } from "./context/TranslateContext";
import { FlowProvider } from "./context/FlowContext";
import { ThemeDataProvider, useThemeData } from "./context/ThemeContext";
import { Box, CircularProgress } from "@mui/material";

const typography = {
  fontFamily:
    '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  h1: {
    fontWeight: 700,
    fontSize: "2.5rem",
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
  },
  h2: {
    fontWeight: 700,
    fontSize: "2rem",
    lineHeight: 1.3,
    letterSpacing: "-0.01em",
  },
  h3: {
    fontWeight: 600,
    fontSize: "1.75rem",
    lineHeight: 1.4,
  },
  h4: {
    fontWeight: 600,
    fontSize: "1.5rem",
    lineHeight: 1.4,
  },
  h5: {
    fontWeight: 600,
    fontSize: "1.25rem",
    lineHeight: 1.5,
  },
  h6: {
    fontWeight: 600,
    fontSize: "1rem",
    lineHeight: 1.5,
  },
  button: {
    fontWeight: 500,
    textTransform: "none",
    fontSize: "0.875rem",
  },
  body1: {
    fontSize: "0.875rem",
    fontWeight: 400,
    lineHeight: 1.5,
  },
  body2: {
    fontSize: "0.8125rem",
    fontWeight: 400,
    lineHeight: 1.43,
  },
  subtitle1: {
    fontSize: "0.875rem",
    fontWeight: 500,
    lineHeight: 1.57,
  },
  subtitle2: {
    fontSize: "0.8125rem",
    fontWeight: 500,
    lineHeight: 1.57,
  },
};

const shadows = [
  "none",
  "0px 1px 2px rgba(0,0,0,0.05)",
  "0px 1px 3px rgba(0,0,0,0.08)",
  "0px 2px 4px rgba(0,0,0,0.08)",
  "0px 2px 6px rgba(0,0,0,0.08)",
  "0px 3px 8px rgba(0,0,0,0.1)",
  "0px 4px 10px rgba(0,0,0,0.1)",
  "0px 6px 12px rgba(0,0,0,0.12)",
  "0px 8px 16px rgba(0,0,0,0.12)",
  "0px 10px 20px rgba(0,0,0,0.14)",
  "0px 12px 24px rgba(0,0,0,0.14)",
  "0px 14px 28px rgba(0,0,0,0.16)",
  "0px 16px 32px rgba(0,0,0,0.16)",
  "0px 18px 36px rgba(0,0,0,0.18)",
  "0px 20px 40px rgba(0,0,0,0.18)",
  "0px 22px 44px rgba(0,0,0,0.2)",
  "0px 24px 48px rgba(0,0,0,0.2)",
  "0px 26px 52px rgba(0,0,0,0.22)",
  "0px 28px 56px rgba(0,0,0,0.22)",
  "0px 30px 60px rgba(0,0,0,0.24)",
  "0px 32px 64px rgba(0,0,0,0.24)",
  "0px 34px 68px rgba(0,0,0,0.26)",
  "0px 36px 72px rgba(0,0,0,0.26)",
  "0px 38px 76px rgba(0,0,0,0.28)",
  "0px 40px 80px rgba(0,0,0,0.28)",
];

const AppContent = () => {
  const { themeConfig, mode, loading } = useThemeData();
  const c = themeConfig;

  const theme = React.useMemo(() => {
    // Ensure we have valid color values with fallbacks
    const primaryColor =
      mode === "light"
        ? c.primary_light || c.primary || "#1F2937"
        : c.primary_dark || c.primary || "#FFFFFF";

    const secondaryColor =
      mode === "light"
        ? c.secondary_light || c.secondary || "#374151"
        : c.secondary_dark || c.secondary || "#E5E7EB";

    return createTheme({
      palette: {
        mode,
        primary: {
          main: primaryColor,
          light: primaryColor + "20",
          dark: primaryColor,
          contrastText: mode === "light" ? "#FFFFFF" : "#000000",
        },
        secondary: {
          main: secondaryColor,
          light: secondaryColor + "20",
          dark: secondaryColor,
          contrastText: mode === "light" ? "#FFFFFF" : "#000000",
        },
        success: { main: c.success || "#10B981" },
        warning: { main: c.warning || "#F59E0B" },
        error: { main: c.error || "#EF4444" },
        info: { main: c.info || "#3B82F6" },
        background: {
          default:
            mode === "light"
              ? c.background_default_light || "#FFFFFF"
              : c.background_default_dark || "#000000",
          paper:
            mode === "light"
              ? c.background_paper_light || "#F9FAFB"
              : c.background_paper_dark || "#0A0A0A",
        },
        text: {
          primary:
            mode === "light"
              ? c.text_primary_light || "#111827"
              : c.text_primary_dark || "#FFFFFF",
          secondary:
            mode === "light"
              ? c.text_secondary_light || "#6B7280"
              : c.text_secondary_dark || "#9CA3AF",
          disabled:
            mode === "light"
              ? c.text_disabled_light || "#9CA3AF"
              : c.text_disabled_dark || "#6B7280",
        },
        divider:
          mode === "light"
            ? c.divider_light || "#E5E7EB"
            : c.divider_dark || "#1F1F1F",
        action: {
          hover:
            mode === "light"
              ? c.action_hover_light || "rgba(0, 0, 0, 0.04)"
              : c.action_hover_dark || "rgba(255, 255, 255, 0.05)",
          selected:
            mode === "light"
              ? c.action_selected_light || "rgba(0, 0, 0, 0.08)"
              : c.action_selected_dark || "rgba(255, 255, 255, 0.08)",
        },
      },
      typography,
      shape: {
        borderRadius: c.button?.contained?.borderRadius || 8,
      },
      spacing: c.spacing_unit || 8,
      shadows,
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": {
                width: "8px",
                height: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: mode === "light" ? "#f1f1f1" : "#2a2a2a",
              },
              "&::-webkit-scrollbar-thumb": {
                background: mode === "light" ? "#c1c1c1" : "#555",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: mode === "light" ? "#a8a8a8" : "#777",
              },
            },
          },
        },
        MuiButton: {
          defaultProps: {
            disableElevation: true,
          },
          styleOverrides: {
            root: {
              borderRadius: c.button?.contained?.borderRadius || 8,
              fontWeight: c.button?.contained?.fontWeight || 500,
              textTransform: c.button?.contained?.textTransform || "none",
              transition: c.button?.contained?.transition || "all 0.2s ease",
            },
            sizeSmall: {
              padding: c.button?.small?.padding || "4px 10px",
              fontSize: c.button?.small?.fontSize || "0.6875rem",
            },
            sizeMedium: {
              padding: c.button?.medium?.padding || "6px 14px",
              fontSize: c.button?.medium?.fontSize || "0.75rem",
            },
            sizeLarge: {
              padding: c.button?.large?.padding || "8px 18px",
              fontSize: c.button?.large?.fontSize || "0.8125rem",
            },
            contained: {
              backgroundColor:
                mode === "light"
                  ? c.button?.contained?.backgroundColor_light || primaryColor
                  : c.button?.contained?.backgroundColor_dark || primaryColor,
              color:
                mode === "light"
                  ? c.button?.contained?.color_light || "#FFFFFF"
                  : c.button?.contained?.color_dark || "#000000",
              boxShadow:
                c.button?.contained?.boxShadow ||
                "0 1px 4px 0 rgba(0, 0, 0, 0.1)",
              "&:hover": {
                backgroundColor:
                  mode === "light"
                    ? c.button?.contained?.backgroundColor_light || primaryColor
                    : c.button?.contained?.backgroundColor_dark || primaryColor,
                boxShadow:
                  c.button?.contained?.hoverBoxShadow ||
                  "0 2px 6px 0 rgba(0, 0, 0, 0.15)",
                transform:
                  c.button?.contained?.hoverTransform || "translateY(-1px)",
                opacity: 0.9,
              },
            },
            outlined: {
              borderRadius: c.button?.outlined?.borderRadius || 6,
              padding: c.button?.outlined?.padding || "5px 14px",
              fontSize: c.button?.outlined?.fontSize || "0.75rem",
              fontWeight: c.button?.outlined?.fontWeight || 500,
              borderWidth: c.button?.outlined?.borderWidth || "1px",
              borderColor:
                mode === "light"
                  ? c.button?.outlined?.borderColor_light || primaryColor
                  : c.button?.outlined?.borderColor_dark || primaryColor,
              color:
                mode === "light"
                  ? c.button?.outlined?.color_light || primaryColor
                  : c.button?.outlined?.color_dark || primaryColor,
              "&:hover": {
                borderWidth: c.button?.outlined?.hoverBorderWidth || "1px",
                borderColor:
                  mode === "light"
                    ? c.button?.outlined?.borderColor_light || primaryColor
                    : c.button?.outlined?.borderColor_dark || primaryColor,
                backgroundColor:
                  mode === "light"
                    ? `rgba(0, 0, 0, ${c.button?.outlined?.hoverBgOpacity || 0.05})`
                    : `rgba(255, 255, 255, ${c.button?.outlined?.hoverBgOpacity || 0.05})`,
              },
            },
            text: {
              borderRadius: c.button?.text?.borderRadius || 6,
              padding: c.button?.text?.padding || "6px 12px",
              fontSize: c.button?.text?.fontSize || "0.75rem",
              fontWeight: c.button?.text?.fontWeight || 500,
              color:
                mode === "light"
                  ? c.button?.text?.color_light || primaryColor
                  : c.button?.text?.color_dark || primaryColor,
              "&:hover": {
                backgroundColor:
                  mode === "light"
                    ? `rgba(0, 0, 0, ${c.button?.text?.hoverBgOpacity || 0.05})`
                    : `rgba(255, 255, 255, ${c.button?.text?.hoverBgOpacity || 0.05})`,
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: c.card?.borderRadius || 10,
              boxShadow: c.card?.boxShadow || "0 1px 6px 0 rgba(0, 0, 0, 0.04)",
              border:
                c.card?.border ||
                `1px solid ${mode === "light" ? c.card?.borderColor_light || "transparent" : c.card?.borderColor_dark || "transparent"}`,
              transition:
                c.card?.transition || "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                boxShadow:
                  c.card?.hoverBoxShadow || "0 2px 12px 0 rgba(0, 0, 0, 0.08)",
                transform: c.card?.hoverTransform || "translateY(-1px)",
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: c.paper?.borderRadius || 10,
              backgroundImage: "none",
            },
            elevation0: { boxShadow: c.paper?.elevation0 || "none" },
            elevation1: {
              boxShadow:
                c.paper?.elevation1 || "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
            },
            elevation2: {
              boxShadow:
                c.paper?.elevation2 || "0 1px 4px 0 rgba(0, 0, 0, 0.06)",
            },
            elevation3: {
              boxShadow:
                c.paper?.elevation3 || "0 2px 8px 0 rgba(0, 0, 0, 0.08)",
            },
          },
        },
        MuiTextField: {
          defaultProps: {
            variant: "outlined",
          },
          styleOverrides: {
            root: {
              "& .MuiOutlinedInput-root": {
                borderRadius: c.textField?.borderRadius || 8,
                backgroundColor:
                  mode === "light"
                    ? c.textField?.backgroundColor_light || "#FFFFFF"
                    : c.textField?.backgroundColor_dark || "#0A0A0A",
                transition: "all 0.2s ease",
                "& fieldset": {
                  borderColor:
                    mode === "light"
                      ? c.textField?.borderColor_light || "#E5E7EB"
                      : c.textField?.borderColor_dark || "#1F1F1F",
                  borderWidth: "1px",
                },
                "&:hover fieldset": {
                  borderColor:
                    mode === "light"
                      ? c.textField?.hoverBorderColor_light || "#9CA3AF"
                      : c.textField?.hoverBorderColor_dark ||
                        "rgba(255, 255, 255, 0.2)",
                },
                "&.Mui-focused fieldset": {
                  borderColor:
                    mode === "light"
                      ? c.textField?.focusBorderColor_light || primaryColor
                      : c.textField?.focusBorderColor_dark || primaryColor,
                  borderWidth: c.textField?.focusBorderWidth || "2px",
                },
                "&.Mui-error fieldset": {
                  borderColor:
                    c.textField?.errorBorderColor || c.error || "#EF4444",
                },
              },
              "& .MuiInputBase-input": {
                padding: c.textField?.padding || "10px 14px",
                fontSize: c.textField?.fontSize || "0.875rem",
                color:
                  mode === "light"
                    ? c.text_primary_light || "#111827"
                    : c.text_primary_dark || "#FFFFFF",
              },
              "& .MuiInputLabel-root": {
                color:
                  mode === "light"
                    ? c.text_secondary_light || "#6B7280"
                    : c.text_secondary_dark || "#9CA3AF",
                fontSize: c.textField?.fontSize || "0.875rem",
              },
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: c.textField?.borderRadius || 8,
              backgroundColor:
                mode === "light"
                  ? c.textField?.backgroundColor_light || "#FFFFFF"
                  : c.textField?.backgroundColor_dark || "#0A0A0A",
              "& fieldset": {
                borderColor:
                  mode === "light"
                    ? c.textField?.borderColor_light || "#E5E7EB"
                    : c.textField?.borderColor_dark || "#1F1F1F",
              },
              "&:hover fieldset": {
                borderColor:
                  mode === "light"
                    ? c.textField?.hoverBorderColor_light || "#9CA3AF"
                    : c.textField?.hoverBorderColor_dark ||
                      "rgba(255, 255, 255, 0.2)",
              },
              "&.Mui-focused fieldset": {
                borderColor:
                  mode === "light"
                    ? c.textField?.focusBorderColor_light || primaryColor
                    : c.textField?.focusBorderColor_dark || primaryColor,
                borderWidth: c.textField?.focusBorderWidth || "2px",
              },
            },
            input: {
              padding: c.textField?.padding || "10px 14px",
              fontSize: c.textField?.fontSize || "0.875rem",
              color:
                mode === "light"
                  ? c.text_primary_light || "#111827"
                  : c.text_primary_dark || "#FFFFFF",
            },
            sizeSmall: {
              "& .MuiInputBase-input": {
                padding: "8px 12px",
                fontSize: "0.875rem",
              },
            },
          },
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              color:
                mode === "light"
                  ? c.text_primary_light || "#111827"
                  : c.text_primary_dark || "#FFFFFF",
            },
            input: {
              color:
                mode === "light"
                  ? c.text_primary_light || "#111827"
                  : c.text_primary_dark || "#FFFFFF",
              "&::placeholder": {
                color:
                  mode === "light"
                    ? c.text_secondary_light || "#6B7280"
                    : c.text_secondary_dark || "#9CA3AF",
                opacity: 0.7,
              },
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: c.chip?.borderRadius || 6,
              height: c.chip?.height || 22,
              fontSize: c.chip?.fontSize || "0.6875rem",
              fontWeight: c.chip?.fontWeight || 500,
              backgroundColor:
                mode === "light"
                  ? c.chip?.backgroundColor_light || "#F3F4F6"
                  : c.chip?.backgroundColor_dark || "#1F1F1F",
              color:
                mode === "light"
                  ? c.chip?.color_light || "#1F2937"
                  : c.chip?.color_dark || "#E5E7EB",
            },
          },
        },
        MuiSwitch: {
          styleOverrides: {
            switchBase: {
              "&.Mui-checked": {
                color:
                  mode === "light"
                    ? c.switch?.checkedColor_light || primaryColor
                    : c.switch?.checkedColor_dark || primaryColor,
                "& + .MuiSwitch-track": {
                  backgroundColor:
                    mode === "light"
                      ? c.switch?.checkedColor_light || primaryColor
                      : c.switch?.checkedColor_dark || primaryColor,
                },
              },
            },
            track: {
              backgroundColor:
                mode === "light"
                  ? c.switch?.uncheckedColor_light || "#D1D5DB"
                  : c.switch?.uncheckedColor_dark || "#374151",
            },
          },
        },
        MuiCheckbox: {
          styleOverrides: {
            root: {
              color:
                mode === "light"
                  ? c.checkbox?.checkedColor_light || primaryColor
                  : c.checkbox?.checkedColor_dark || primaryColor,
              "&.Mui-checked": {
                color:
                  mode === "light"
                    ? c.checkbox?.checkedColor_light || primaryColor
                    : c.checkbox?.checkedColor_dark || primaryColor,
              },
            },
          },
        },
        MuiRadio: {
          styleOverrides: {
            root: {
              color:
                mode === "light"
                  ? c.radio?.checkedColor_light || primaryColor
                  : c.radio?.checkedColor_dark || primaryColor,
              "&.Mui-checked": {
                color:
                  mode === "light"
                    ? c.radio?.checkedColor_light || primaryColor
                    : c.radio?.checkedColor_dark || primaryColor,
              },
            },
          },
        },
        MuiSlider: {
          styleOverrides: {
            root: {
              color:
                mode === "light"
                  ? c.slider?.trackColor_light || primaryColor
                  : c.slider?.trackColor_dark || primaryColor,
            },
            rail: {
              backgroundColor:
                mode === "light"
                  ? c.slider?.railColor_light || "#E5E7EB"
                  : c.slider?.railColor_dark || "#374151",
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              padding: c.table?.cellPadding || "8px 12px",
              fontSize: "0.875rem",
              borderColor:
                mode === "light"
                  ? c.table?.borderColor_light || "#F3F4F6"
                  : c.table?.borderColor_dark || "#1F1F1F",
            },
            head: {
              fontWeight: c.table?.headerFontWeight || 600,
              fontSize: c.table?.headerFontSize || "0.6875rem",
              backgroundColor:
                mode === "light"
                  ? c.table?.headerBg_light || "#F9FAFB"
                  : c.table?.headerBg_dark || "#0A0A0A",
            },
          },
        },
        MuiTableRow: {
          styleOverrides: {
            root: {
              "&:hover": {
                backgroundColor:
                  mode === "light"
                    ? c.table?.rowHoverBg_light || "rgba(0, 0, 0, 0.02)"
                    : c.table?.rowHoverBg_dark || "rgba(255, 255, 255, 0.03)",
              },
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              width: c.drawer?.width || 220,
              borderRight: `1px solid ${mode === "light" ? c.border_light || "#E5E7EB" : c.border_dark || "#1F1F1F"}`,
              backgroundColor:
                mode === "light"
                  ? c.drawer?.backgroundColor_light || "#FFFFFF"
                  : c.drawer?.backgroundColor_dark || "#0A0A0A",
            },
          },
        },
        MuiListItemButton: {
          styleOverrides: {
            root: {
              borderRadius: c.drawer?.itemBorderRadius || 6,
              margin: "2px 8px",
              padding: c.drawer?.itemPadding || "6px 12px",
              "&:hover": {
                backgroundColor:
                  mode === "light"
                    ? c.drawer?.itemHoverBg_light || "rgba(0, 0, 0, 0.04)"
                    : c.drawer?.itemHoverBg_dark || "rgba(255, 255, 255, 0.05)",
              },
              "&.Mui-selected": {
                backgroundColor:
                  mode === "light"
                    ? c.drawer?.itemActiveBg_light || "rgba(0, 0, 0, 0.08)"
                    : c.drawer?.itemActiveBg_dark ||
                      "rgba(255, 255, 255, 0.08)",
                color:
                  mode === "light"
                    ? c.drawer?.itemActiveColor_light || primaryColor
                    : c.drawer?.itemActiveColor_dark || primaryColor,
                "&:hover": {
                  backgroundColor:
                    mode === "light"
                      ? c.drawer?.itemActiveBg_light || "rgba(0, 0, 0, 0.08)"
                      : c.drawer?.itemActiveBg_dark ||
                        "rgba(255, 255, 255, 0.08)",
                },
              },
            },
          },
        },
        MuiAvatar: {
          styleOverrides: {
            root: {
              fontSize: "0.875rem",
              fontWeight: 600,
              border:
                mode === "light"
                  ? c.avatar?.border_light || "2px solid rgba(0, 0, 0, 0.1)"
                  : c.avatar?.border_dark ||
                    "2px solid rgba(255, 255, 255, 0.1)",
            },
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              backgroundColor:
                mode === "light"
                  ? c.tooltip?.backgroundColor_light || "#111827"
                  : c.tooltip?.backgroundColor_dark || "#F9FAFB",
              color:
                mode === "light"
                  ? c.tooltip?.color_light || "#FFFFFF"
                  : c.tooltip?.color_dark || "#111827",
              fontSize: c.tooltip?.fontSize || "0.6875rem",
              padding: c.tooltip?.padding || "4px 8px",
              borderRadius: c.tooltip?.borderRadius || 6,
            },
          },
        },
        MuiTabs: {
          styleOverrides: {
            indicator: {
              backgroundColor:
                mode === "light"
                  ? c.tabs?.indicatorColor_light || primaryColor
                  : c.tabs?.indicatorColor_dark || primaryColor,
              height: c.tabs?.indicatorHeight || 2,
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: "none",
              fontSize: c.tabs?.tabFontSize || "0.75rem",
              fontWeight: c.tabs?.tabFontWeight || 500,
              minHeight: c.tabs?.tabMinHeight || 40,
              padding: c.tabs?.tabPadding || "8px 14px",
            },
          },
        },
        MuiAccordion: {
          styleOverrides: {
            root: {
              "& .MuiAccordionSummary-expandIconWrapper": {
                color:
                  mode === "light"
                    ? c.accordion?.expandIconColor_light || "#6B7280"
                    : c.accordion?.expandIconColor_dark || "#9CA3AF",
              },
            },
          },
        },
        MuiPagination: {
          styleOverrides: {
            root: {
              "& .MuiPaginationItem-root": {
                "&.Mui-selected": {
                  backgroundColor:
                    mode === "light"
                      ? c.pagination?.selectedBg_light || primaryColor
                      : c.pagination?.selectedBg_dark || primaryColor,
                  color:
                    mode === "light"
                      ? c.pagination?.selectedColor_light || "#FFFFFF"
                      : c.pagination?.selectedColor_dark || "#000000",
                },
              },
            },
          },
        },
        MuiDivider: {
          styleOverrides: {
            root: {
              borderColor:
                mode === "light"
                  ? c.divider_light || "#E5E7EB"
                  : c.divider_dark || "#1F1F1F",
            },
          },
        },
      },
    });
  }, [mode, themeConfig]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor={
          mode === "light"
            ? c.background_default_light || "#FFFFFF"
            : c.background_default_dark || "#000000"
        }
      >
        <CircularProgress sx={{ color: "text.primary" }} />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalProvider>
        <CurrencyProvider>
          <TranslateProvider>
            <FlowProvider>
              <HomeMainPage />
            </FlowProvider>
          </TranslateProvider>
        </CurrencyProvider>
      </GlobalProvider>
    </ThemeProvider>
  );
};

export default function App() {
  return (
    <ThemeDataProvider>
      <AppContent />
    </ThemeDataProvider>
  );
}
