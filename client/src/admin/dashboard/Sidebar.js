import React from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Collapse,
  Avatar,
  InputBase,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const drawerWidth = 260;

const Sidebar = ({
  lang,
  theme,
  isMobile,
  selectedMenu,
  openSubmenus,
  mobileOpen,
  handleDrawerToggle,
  handleMenuClick,
  handleSubmenuClick,
  menuItems,
  web,
}) => {
  const history = useHistory();
  const [search, setSearch] = React.useState("");

  // ── Filter logic ────────────────────────────────────────────────────────
  const filteredMenuItems = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return menuItems;

    return menuItems
      .map((item) => {
        const parentMatch = item.text.toLowerCase().includes(q);

        if (item.submenu) {
          const matchedSubs = item.submenu.filter((sub) =>
            sub.text.toLowerCase().includes(q),
          );
          // show parent if parent name matches (show all subs) OR some subs match
          if (parentMatch) return item; // show full item
          if (matchedSubs.length > 0) return { ...item, submenu: matchedSubs }; // show filtered subs
          return null;
        }

        return parentMatch ? item : null;
      })
      .filter(Boolean);
  }, [search, menuItems]);

  // When searching, force all filtered parents open
  const effectiveOpenSubmenus = React.useMemo(() => {
    if (!search.trim()) return openSubmenus;
    const forced = {};
    filteredMenuItems.forEach((item) => {
      if (item.submenu) forced[item.id] = true;
    });
    return forced;
  }, [search, filteredMenuItems, openSubmenus]);

  // ── Highlight matched text ───────────────────────────────────────────────
  const Highlight = ({ text }) => {
    const q = search.trim().toLowerCase();
    if (!q) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return <span>{text}</span>;
    return (
      <span>
        {text.slice(0, idx)}
        <span
          style={{
            backgroundColor: theme.palette.primary.main + "33",
            color: theme.palette.primary.main,
            borderRadius: 3,
            padding: "0 2px",
            fontWeight: 700,
          }}
        >
          {text.slice(idx, idx + q.length)}
        </span>
        {text.slice(idx + q.length)}
      </span>
    );
  };

  const drawer = (
    <Box
      sx={{
        height: "100%",
        backgroundColor: theme.palette.background.default,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Logo Section ── */}
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {web?.site_logo ? (
            <Box
              onClick={() => history.push("/")}
              component="img"
              src={`/media/${web.site_logo}`}
              alt={web?.site_name || "Logo"}
              sx={{
                height: 40,
                maxWidth: 120,
                objectFit: "contain",
                cursor: "pointer",
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "primary.main",
                fontSize: "0.85rem",
                fontWeight: 700,
              }}
            >
              {web?.site_name?.charAt(0) || "A"}
            </Avatar>
          )}
          <Typography
            variant="subtitle2"
            fontWeight={700}
            noWrap
            sx={{ maxWidth: 130 }}
          >
            {web?.site_name || "Admin"}
          </Typography>
        </Box>

        {isMobile && (
          <IconButton onClick={handleDrawerToggle} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* ── Search Bar ── */}
      <Box
        sx={{
          px: 1.5,
          pt: 1.5,
          pb: 0.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 0.8,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.action.hover,
            transition: "border-color 0.2s, box-shadow 0.2s",
            "&:focus-within": {
              borderColor: theme.palette.primary.main,
              boxShadow: `0 0 0 3px ${theme.palette.primary.main}18`,
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          <SearchIcon
            sx={{ fontSize: 16, color: "text.disabled", flexShrink: 0 }}
          />
          <InputBase
            fullWidth
            placeholder={lang?.searchMenu || "Search menu..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              fontSize: 13,
              "& input": { p: 0 },
            }}
          />
          {search && (
            <IconButton
              size="small"
              onClick={() => setSearch("")}
              sx={{ p: 0.2, ml: 0.5 }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* ── Navigation ── */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        {filteredMenuItems.length === 0 ? (
          <Box sx={{ px: 3, py: 4, textAlign: "center" }}>
            <Typography variant="caption" color="text.disabled">
              {lang?.noMenuFound || "No menu found"}
            </Typography>
          </Box>
        ) : (
          <List sx={{ px: 1, py: 0 }}>
            {filteredMenuItems.map((item) => {
              const isParentActive =
                selectedMenu === item.id ||
                item.submenu?.some((sub) => sub.id === selectedMenu);

              return (
                <React.Fragment key={item.id}>
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      selected={isParentActive}
                      onClick={() => handleMenuClick(item.id, !!item.submenu)}
                      sx={{
                        borderRadius: 1.5,
                        py: 1.2,
                        px: 2,
                        minHeight: 44,
                        "&.Mui-selected": {
                          backgroundColor: `${theme.palette.primary.main}18`,
                          color: theme.palette.primary.main,
                          "& .MuiListItemIcon-root": {
                            color: theme.palette.primary.main,
                          },
                        },
                        "&:hover": {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isParentActive
                            ? theme.palette.primary.main
                            : theme.palette.text.secondary,
                          minWidth: 36,
                          "& svg": { fontSize: 20 },
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={<Highlight text={item.text} />}
                        primaryTypographyProps={{
                          fontSize: 14,
                          fontWeight: isParentActive ? 600 : 500,
                        }}
                      />
                      {item.submenu &&
                        (effectiveOpenSubmenus[item.id] ? (
                          <ExpandLessIcon
                            sx={{
                              fontSize: 18,
                              color: theme.palette.text.secondary,
                            }}
                          />
                        ) : (
                          <ExpandMoreIcon
                            sx={{
                              fontSize: 18,
                              color: theme.palette.text.secondary,
                            }}
                          />
                        ))}
                    </ListItemButton>
                  </ListItem>

                  {/* Submenu */}
                  {item.submenu && (
                    <Collapse
                      in={effectiveOpenSubmenus[item.id]}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box
                        sx={{
                          ml: 3.5,
                          pl: 1.5,
                          borderLeft: `2px solid ${theme.palette.divider}`,
                          mb: 0.5,
                        }}
                      >
                        <List component="div" disablePadding>
                          {item.submenu.map((subItem) => {
                            const isActive = selectedMenu === subItem.id;
                            return (
                              <ListItem
                                key={subItem.id}
                                disablePadding
                                sx={{ mb: 0.3 }}
                              >
                                <ListItemButton
                                  selected={isActive}
                                  onClick={() => {
                                    handleSubmenuClick(subItem.id);
                                    setSearch(""); // clear search on select
                                  }}
                                  sx={{
                                    borderRadius: 1.5,
                                    py: 0.9,
                                    px: 1.5,
                                    minHeight: 38,
                                    "&.Mui-selected": {
                                      backgroundColor: `${theme.palette.primary.main}14`,
                                      color: theme.palette.primary.main,
                                    },
                                    "&:hover": {
                                      backgroundColor:
                                        theme.palette.action.hover,
                                    },
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      mr: 1.5,
                                      flexShrink: 0,
                                      bgcolor: isActive
                                        ? "primary.main"
                                        : "text.disabled",
                                      transition: "background-color 0.2s",
                                    }}
                                  />
                                  <ListItemText
                                    primary={<Highlight text={subItem.text} />}
                                    primaryTypographyProps={{
                                      fontSize: 13,
                                      fontWeight: isActive ? 600 : 400,
                                      color: isActive
                                        ? "primary.main"
                                        : "text.secondary",
                                    }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                        </List>
                      </Box>
                    </Collapse>
                  )}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            border: "none",
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            border: "none",
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
