import { useThemeData } from "../context/ThemeContext";

export const useCustomTheme = () => {
  const { themeConfig, themeId, mode, toggleColorMode } = useThemeData();

  const toggleWithAnimation = (event) => {
    // Get click position for the ripple origin
    const x =
      event?.currentTarget?.getBoundingClientRect().left + 20 ||
      window.innerWidth / 2;
    const y =
      event?.currentTarget?.getBoundingClientRect().top + 20 ||
      window.innerHeight / 2;
    toggleColorMode(x, y);
  };

  const getGradient = (type = "primary") => {
    if (type === "primary") {
      return mode === "light"
        ? themeConfig.gradient_primary_light ||
            themeConfig.gradient_primary ||
            themeConfig.gradient_secondary
        : themeConfig.gradient_primary_dark ||
            themeConfig.gradient_primary ||
            themeConfig.gradient_secondary;
    }
    return (
      themeConfig[`gradient_${type}`] ||
      themeConfig.gradient_primary_light ||
      themeConfig.gradient_primary
    );
  };

  return {
    config: themeConfig,
    themeId: themeId || "default",
    mode,
    toggleColorMode: toggleWithAnimation,
    isDark: mode === "dark",
    isLight: mode === "light",
    getColor: (colorKey) => themeConfig[colorKey] || themeConfig.primary,
    getGradient,
    getSpacing: (multiplier = 1) => themeConfig.spacing_unit * multiplier,
  };
};
