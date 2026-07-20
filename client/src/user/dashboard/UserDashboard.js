import React from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import { TranslateContext } from "../../context/TranslateContext";
import { useCustomTheme } from "../../utils/useCustomTheme";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Content from "./Content";
import {
  Dashboard as DashboardIcon,
  Face2,
  Collections,
  SlowMotionVideo,
  EmergencyRecording,
  ChatBubbleOutline,
  SupportAgent,
  HistoryToggleOff,
  NotificationsActive,
  Logout,
  TokenOutlined,
  GroupAddOutlined,
  AutoAwesome,
  AutoStories,
  Instagram,
} from "@mui/icons-material";
import { UserProvider } from "../../context/UserContext";
import { GlobalContext } from "../../context/GlobalContext";
import { usePanelChrome } from "../../utils/usePanelChrome";
import { useLocation } from "react-router-dom";

const UserDashboard = () => {
  const { lang } = React.useContext(TranslateContext);
  const [web, setWeb] = React.useState({});
  const { hitAxios } = React.useContext(GlobalContext);
  const theme = useTheme();
  const { toggleColorMode, isDark } = useCustomTheme();
  const chrome = usePanelChrome(240);
  const drawerWidth = chrome.drawerWidth;
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  async function handleGetWeb() {
    const res = await hitAxios({
      path: "/api/web/get_web_public",
      post: false,
      admin: false,
    });
    if (res.data.success) setWeb(res.data.data);
  }

  const menuItems = [
    {
      id: "dashboards",
      text: lang?.dashboards || "Dashboards",
      icon: <DashboardIcon />,
      // submenu: [{ id: "dashboard", text: lang?.dashboard || "Dashboard" }],
    },
    {
      id: "influencers",
      text: lang?.influencers || "Influencers",
      icon: <Face2 />,
    },
    {
      id: "link-instagram",
      text: lang?.linkInsta || "Link Instagram",
      icon: <Instagram />,
    },
    {
      id: "social-publishing-history",
      text: lang?.socialPublishingHistory || "Publishing History",
      icon: <HistoryToggleOff />,
    },
    {
      id: "gallery",
      text: lang?.gallery || "Gallery",
      icon: <Collections />,
    },
    {
      id: "content",
      text: lang?.content || "Content",
      icon: <SlowMotionVideo />,
    },
    {
      id: "text-content",
      text: lang?.textContentWriter || "Content Writer",
      icon: <AutoAwesome />,
    },
    {
      id: "books",
      text: lang?.bookWriter || "Book Writer",
      icon: <AutoStories />,
    },
    {
      id: "script-to-video",
      text: lang?.scriptToVideo || "Script to Video",
      icon: <EmergencyRecording />,
    },
    {
      id: "talking-video",
      text: lang?.influencerChat || "Chat",
      icon: <ChatBubbleOutline />,
    },
    {
      id: "usage",
      text: lang?.usage || "Usage",
      icon: <HistoryToggleOff />,
    },
    {
      id: "buy-credits",
      text: lang?.buyCredits || "Buy Credits",
      icon: <TokenOutlined />,
    },
    {
      id: "referrals",
      text: lang?.referrals || "Referrals",
      icon: <GroupAddOutlined />,
    },
    {
      id: "notification",
      text: lang?.notification || "Notification",
      icon: <NotificationsActive />,
    },
    {
      id: "help",
      text: lang?.help || "Help",
      icon: <SupportAgent />,
    },
    {
      id: "logout",
      text: lang?.logout || "Logout",
      icon: <Logout />,
    },
  ];

  const getInitialMenu = () => {
    const page = new URLSearchParams(window.location.search).get("page");
    if (
      page &&
      menuItems.some(
        (i) => i.id === page || i.submenu?.some((s) => s.id === page),
      )
    )
      return page;
    return menuItems[0]?.submenu?.[0]?.id || menuItems[0]?.id || "dashboard";
  };

  const [selectedMenu, setSelectedMenu] = React.useState(getInitialMenu);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openSubmenus, setOpenSubmenus] = React.useState(() => {
    const open = {};
    menuItems.forEach((item) => {
      if (item.submenu) open[item.id] = true; // all parents open by default
    });
    return open;
  });
  const location = useLocation();

  const isValidPage = React.useCallback(
    (page) =>
      Boolean(
        page &&
          menuItems.some(
            (i) => i.id === page || i.submenu?.some((s) => s.id === page),
          ),
      ),
    // menu item ids are static; lang labels change but ids do not
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const goToPage = React.useCallback(
    (id) => {
      if (!isValidPage(id)) return;
      setSelectedMenu(id);
      const params = new URLSearchParams(window.location.search);
      params.set("page", id);
      window.history.pushState({}, "", `${window.location.pathname}?${params}`);
      menuItems.forEach((item) => {
        if (item.submenu?.some((s) => s.id === id)) {
          setOpenSubmenus((prev) => ({ ...prev, [item.id]: true }));
        }
      });
      if (isMobile) setMobileOpen(false);
    },
    [isMobile, isValidPage],
  );

  const updateURL = (id) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", id);
    window.history.pushState({}, "", `${window.location.pathname}?${params}`);
  };

  const handleMenuClick = (id, hasSubmenu) => {
    if (hasSubmenu) {
      setOpenSubmenus((prev) => ({ ...prev, [id]: !prev[id] }));
    } else {
      setSelectedMenu(id);
      updateURL(id);
      if (isMobile) setMobileOpen(false);
    }
  };

  const handleSubmenuClick = (id) => {
    setSelectedMenu(id);
    updateURL(id);
    if (isMobile) setMobileOpen(false);
  };

  // Sync when URL changes via react-router (e.g. Buy Credits / Upgrade links)
  React.useEffect(() => {
    const page = new URLSearchParams(location.search).get("page");
    if (isValidPage(page) && page !== selectedMenu) {
      setSelectedMenu(page);
      menuItems.forEach((item) => {
        if (item.submenu?.some((s) => s.id === page)) {
          setOpenSubmenus((prev) => ({ ...prev, [item.id]: true }));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  React.useEffect(() => {
    const onPop = () => {
      const page = new URLSearchParams(window.location.search).get("page");
      if (isValidPage(page)) {
        setSelectedMenu(page);
        menuItems.forEach((item) => {
          if (item.submenu?.some((s) => s.id === page))
            setOpenSubmenus((prev) => ({ ...prev, [item.id]: true }));
        });
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isValidPage]);

  React.useEffect(() => {
    handleGetWeb();
  }, []);

  return (
    <UserProvider navigateToPage={goToPage}>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: "background.default",
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
          handleDrawerToggle={() => setMobileOpen((p) => !p)}
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
            display: "flex",
            flexDirection: "column",
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
            handleDrawerToggle={() => setMobileOpen((p) => !p)}
            web={web}
          />

          {isMobile && <Box sx={{ ...theme.mixins.toolbar }} />}

          <Box sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1, ...chrome.contentSx }}>
            <Content selectedMenu={selectedMenu} web={web} />
          </Box>
        </Box>
      </Box>
    </UserProvider>
  );
};

export default UserDashboard;
