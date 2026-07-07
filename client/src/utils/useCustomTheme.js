import { useThemeData } from "../context/ThemeContext";

export const useCustomTheme = () => {
  const { themeConfig, mode, toggleColorMode } = useThemeData();

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

  return {
    config: themeConfig,
    mode,
    toggleColorMode: toggleWithAnimation,
    isDark: mode === "dark",
    isLight: mode === "light",
    getColor: (colorKey) => themeConfig[colorKey] || themeConfig.primary,
    getGradient: (type = "primary") =>
      themeConfig[`gradient_${type}`] || themeConfig.gradient_primary,
    getSpacing: (multiplier = 1) => themeConfig.spacing_unit * multiplier,
  };
};
