import React from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import { TranslateContext } from "../../context/TranslateContext";
import { useCustomTheme } from "../../utils/useCustomTheme";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Content from "./Content";
import {
  ColorLens as ColorLensIcon,
  Paid,
  PermMedia,
  PriceCheck,
  AutoFixHigh,
  AutoAwesome,
  ContactMail,
  AddCard,
  Language,
  BarChart as BarChartIcon,
  TuneOutlined,
} from "@mui/icons-material";
import { GlobalContext } from "../../context/GlobalContext";
import { useMenuItems } from "./useMenuItems";
import { usePanelChrome } from "../../utils/usePanelChrome";

const AdminDashboard = () => {
  const { lang } = React.useContext(TranslateContext);
  const [web, setWeb] = React.useState({});
  const { hitAxios } = React.useContext(GlobalContext);
  const theme = useTheme();
  const { toggleColorMode, isDark } = useCustomTheme();
  const chrome = usePanelChrome(260);
  const drawerWidth = chrome.drawerWidth;
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const menuItems = useMenuItems();

  async function handleGetWeb() {
    const res = await hitAxios({
      path: "/api/web/get_web_public",
      post: false,
      admin: false,
    });
    if (res.data.success) setWeb(res.data.data);
  }

  // ── URL sync helpers ───────────────────────────────────────────────────────
  const getInitialMenu = () => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get("page");
    if (pageParam) {
      const isValid = menuItems.some(
        (item) =>
          item.id === pageParam ||
          item.submenu?.some((sub) => sub.id === pageParam),
      );
      if (isValid) return pageParam;
    }
    return menuItems[0]?.submenu?.[0]?.id || menuItems[0]?.id || "dashboards";
  };

  const [selectedMenu, setSelectedMenu] = React.useState(getInitialMenu);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openSubmenus, setOpenSubmenus] = React.useState(() => {
    const openMenus = {};
    menuItems.forEach((item) => {
      if (item.submenu) {
        openMenus[item.id] = true; // expand ALL parents by default
      }
    });
    return openMenus;
  });

  const updateURL = (menuId) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", menuId);
    window.history.pushState(
      { path: `${window.location.pathname}?${params}` },
      "",
      `${window.location.pathname}?${params}`,
    );
  };

  const handleDrawerToggle = () => setMobileOpen((p) => !p);

  const handleMenuClick = (menuId, hasSubmenu) => {
    if (hasSubmenu) {
      setOpenSubmenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
    } else {
      setSelectedMenu(menuId);
      updateURL(menuId);
      if (isMobile) setMobileOpen(false);
    }
  };

  const handleSubmenuClick = (submenuId) => {
    setSelectedMenu(submenuId);
    updateURL(submenuId);
    if (isMobile) setMobileOpen(false);
  };

  React.useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get("page");
      if (pageParam) {
        setSelectedMenu(pageParam);
        menuItems.forEach((item) => {
          if (item.submenu?.some((sub) => sub.id === pageParam)) {
            setOpenSubmenus((prev) => ({ ...prev, [item.id]: true }));
          }
        });
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  React.useEffect(() => {
    handleGetWeb();
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        ...chrome.shellSx,
      }}
    >
      <Sidebar
        lang={lang}
        theme={theme}
        isMobile={isMobile}
        selectedMenu={selectedMenu}
        openSubmenus={openSubmenus}
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        handleMenuClick={handleMenuClick}
        handleSubmenuClick={handleSubmenuClick}
        menuItems={menuItems}
        web={web}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, md: 0 },
          ...chrome.mainSx,
        }}
      >
        <TopBar
          lang={lang}
          theme={theme}
          isMobile={isMobile}
          isDark={isDark}
          selectedMenu={selectedMenu}
          toggleColorMode={toggleColorMode}
          handleDrawerToggle={handleDrawerToggle}
          web={web}
        />

        <Box sx={{ p: { xs: 2, sm: 3 }, ...chrome.contentSx }}>
          <Content selectedMenu={selectedMenu} web={web} />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
