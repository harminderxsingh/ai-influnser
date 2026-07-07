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
  SupportAgent,
  HistoryToggleOff,
  NotificationsActive,
  Logout,
  Instagram,
  Campaign,
  VideoCameraFront,
  TokenOutlined,
  GroupAddOutlined,
} from "@mui/icons-material";
import { UserProvider } from "../../context/UserContext";
import { GlobalContext } from "../../context/GlobalContext";
import TikTokIcon from "../../common/TikTokIcon";

const drawerWidth = 240;

const UserDashboard = () => {
  const { lang } = React.useContext(TranslateContext);
  const [web, setWeb] = React.useState({});
  const { hitAxios } = React.useContext(GlobalContext);
  const theme = useTheme();
  const { toggleColorMode, isDark } = useCustomTheme();
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
      id: "link-tiktok",
      text: lang?.linkTiktok || "Link TIktok",
      icon: <TikTokIcon />,
    },
    {
      id: "social-publishing",
      text: lang?.socialPublishing || "Social Publishing",
      icon: <Campaign />,
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
      id: "talking-video",
      text: lang?.talkingVideo || "Talking Video",
      icon: <VideoCameraFront />,
    },
    {
      id: "script-to-video",
      text: lang?.scriptToVideo || "Script to Video",
      icon: <EmergencyRecording />,
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

  React.useEffect(() => {
    const onPop = () => {
      const page = new URLSearchParams(window.location.search).get("page");
      if (page) {
        setSelectedMenu(page);
        menuItems.forEach((item) => {
          if (item.submenu?.some((s) => s.id === page))
            setOpenSubmenus((prev) => ({ ...prev, [item.id]: true }));
        });
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  React.useEffect(() => {
    handleGetWeb();
  }, []);

  return (
    <UserProvider>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: "background.default",
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

          <Box sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1 }}>
            <Content selectedMenu={selectedMenu} web={web} />
          </Box>
        </Box>
      </Box>
    </UserProvider>
  );
};

export default UserDashboard;
