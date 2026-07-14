import { useMemo } from "react";
import { useTheme } from "@mui/material";
import { useThemeData } from "../context/ThemeContext";
import { buildPanelChrome, ensureThemeFontLoaded } from "./panelTheme";

/**
 * Panel shell chrome driven by active Web Theme.
 * @param {number} fallbackDrawerWidth
 */
export function usePanelChrome(fallbackDrawerWidth = 240) {
  const muiTheme = useTheme();
  const { themeConfig, themeId, mode } = useThemeData();

  const chrome = useMemo(() => {
    ensureThemeFontLoaded(themeConfig?.font_family);
    return buildPanelChrome({
      themeId: themeId || "default",
      config: themeConfig || {},
      muiTheme,
      mode,
      fallbackDrawerWidth,
    });
  }, [themeId, themeConfig, muiTheme, mode, fallbackDrawerWidth]);

  return chrome;
}
