// WebTheme.js
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Stack,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Snackbar,
  Skeleton,
  Autocomplete,
} from "@mui/material";
import {
  ColorLens,
  Save,
  Refresh,
  Download,
  Upload,
  Add,
  Delete,
  ContentCopy,
  Check,
  Edit,
  MoreVert,
  Star,
  StarBorder,
  Palette,
  TextFields,
  Widgets,
  ViewInAr,
  Tune,
  Close,
  FileCopy,
  ArrowBack,
  Shield,
} from "@mui/icons-material";
import { GlobalContext } from "../../context/GlobalContext";
import { TranslateContext } from "../../context/TranslateContext";
import ModernButtonComp from "../../context/ModernButtonComp";
import PageHeader from "../../common/PageHeader";
import ThemeTabContent from "./ThemeTabContent";

// ─── Small helper: theme initial letter avatar ─────────────────────────────
const ThemeAvatar = ({ name, isActive, isProtected: prot }) => (
  <Avatar
    sx={{
      width: 44,
      height: 44,
      bgcolor: isActive ? "primary.main" : "action.selected",
      color: isActive ? "primary.contrastText" : "text.primary",
      fontSize: "1rem",
      fontWeight: 700,
    }}
  >
    {prot ? <Shield fontSize="small" /> : name?.[0]?.toUpperCase() || "T"}
  </Avatar>
);

const WebTheme = () => {
  const { themeAPI } = React.useContext(GlobalContext);
  const { lang } = React.useContext(TranslateContext);

  // ── State ──────────────────────────────────────────────────────────────────
  const [themes, setThemes] = useState([]);
  const [activeThemeId, setActiveThemeId] = useState(null);
  const [selectedThemeId, setSelectedThemeId] = useState(null); // theme open in editor
  const [themeData, setThemeData] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedColor, setCopiedColor] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    msg: "",
    severity: "success",
  });

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [targetThemeId, setTargetThemeId] = useState(null);

  // Create / import form
  const [newThemeName, setNewThemeName] = useState("");
  const [newThemeDesc, setNewThemeDesc] = useState("");
  const [cloneFromId, setCloneFromId] = useState("");
  const [importJSON, setImportJSON] = useState("");
  const [importName, setImportName] = useState("");

  // Card menu anchor
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuThemeId, setMenuThemeId] = useState(null);

  // ── Data loaders ───────────────────────────────────────────────────────────
  const loadThemeList = useCallback(async () => {
    const resp = await themeAPI.listThemes();
    if (resp?.data?.success) {
      const list = resp.data.data;
      setThemes(list);
      const active = list.find((t) => t.isActive);
      if (active) setActiveThemeId(active.id);
    }
  }, [themeAPI]);

  const loadThemeData = useCallback(
    async (id) => {
      const resp = await themeAPI.getThemeById(id);
      if (resp?.data?.success) {
        setThemeData(resp.data.data);
        setUnsavedChanges(false);
      }
    },
    [themeAPI],
  );

  // ✅ CORRECT — runs once on mount only
  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadThemeList();
      setLoading(false);
    })();
  }, []);

  // Open a theme in the editor
  const openEditor = async (id) => {
    setSelectedThemeId(id);
    setTabValue(0);
    await loadThemeData(id);
  };

  const closeEditor = () => {
    if (
      unsavedChanges &&
      !window.confirm("You have unsaved changes. Discard them?")
    )
      return;
    setSelectedThemeId(null);
    setThemeData(null);
    setUnsavedChanges(false);
  };

  // ── Theme data change handlers ─────────────────────────────────────────────
  const handleDirectChange = (key, value) => {
    if (key === "__full__") {
      setThemeData(value);
    } else {
      setThemeData((prev) => ({ ...prev, [key]: value }));
    }
    setUnsavedChanges(true);
  };

  const handleNestedChange = (section, key, value) => {
    setThemeData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
    setUnsavedChanges(true);
  };

  const handleDeepNestedChange = (section, subsection, key, value) => {
    setThemeData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: { ...prev[section][subsection], [key]: value },
      },
    }));
    setUnsavedChanges(true);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSaveTheme = async () => {
    const resp = await themeAPI.updateTheme(selectedThemeId, themeData);
    if (resp?.data?.success) {
      setUnsavedChanges(false);
      toast("Theme saved successfully!");
      await loadThemeList();
      // If we just saved the active theme, reload styles
      if (selectedThemeId === activeThemeId) {
        setTimeout(() => window.location.reload(), 1200);
      }
    }
  };

  // ── Set active ─────────────────────────────────────────────────────────────
  const handleSetActive = async (id) => {
    const resp = await themeAPI.setActiveTheme(id);
    if (resp?.data?.success) {
      setActiveThemeId(id);
      await loadThemeList();
      toast("Active theme updated — reloading…");
      setTimeout(() => window.location.reload(), 1400);
    }
  };

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreateTheme = async () => {
    if (!newThemeName.trim()) return;
    const resp = await themeAPI.createTheme({
      name: newThemeName,
      description: newThemeDesc,
      cloneFromId: cloneFromId || undefined,
    });
    if (resp?.data?.success) {
      setCreateDialogOpen(false);
      setNewThemeName("");
      setNewThemeDesc("");
      setCloneFromId("");
      await loadThemeList();
      toast("Theme created!");
      openEditor(resp.data.data.id);
    }
  };

  // ── Duplicate ──────────────────────────────────────────────────────────────
  const handleDuplicate = async (id) => {
    closeMenu();
    const source = themes.find((t) => t.id === id);
    const resp = await themeAPI.duplicateTheme(id, {
      name: `${source?.name} (Copy)`,
    });
    if (resp?.data?.success) {
      await loadThemeList();
      toast("Theme duplicated!");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    const resp = await themeAPI.deleteTheme(targetThemeId);
    if (resp?.data?.success) {
      setDeleteConfirmOpen(false);
      setTargetThemeId(null);
      if (selectedThemeId === targetThemeId) {
        setSelectedThemeId(null);
        setThemeData(null);
      }
      await loadThemeList();
      toast("Theme deleted.");
    } else {
      toast(resp?.data?.msg || "Cannot delete theme", "error");
    }
  };

  // ── Rename ─────────────────────────────────────────────────────────────────
  const handleRename = async () => {
    const resp = await themeAPI.renameTheme(targetThemeId, {
      name: newThemeName,
      description: newThemeDesc,
    });
    if (resp?.data?.success) {
      setRenameDialogOpen(false);
      setNewThemeName("");
      setNewThemeDesc("");
      await loadThemeList();
      toast("Theme renamed!");
    }
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = (id) => {
    closeMenu();
    themeAPI.exportTheme(id);
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importJSON);
      const { _meta, ...themeData } = parsed;
      const resp = await themeAPI.importTheme({
        name: importName || _meta?.name || "Imported Theme",
        description: _meta?.description || "",
        themeData,
      });
      if (resp?.data?.success) {
        setImportDialogOpen(false);
        setImportJSON("");
        setImportName("");
        await loadThemeList();
        toast("Theme imported!");
      }
    } catch {
      toast("Invalid JSON format", "error");
    }
  };

  // ── Reset active to default ────────────────────────────────────────────────
  const handleResetToDefault = async () => {
    if (!window.confirm("Set the Default Theme as active?")) return;
    const resp = await themeAPI.resetToDefault();
    if (resp?.data?.success) {
      await loadThemeList();
      toast("Reset to default theme — reloading…");
      setTimeout(() => window.location.reload(), 1400);
    }
  };

  // ── Clipboard ──────────────────────────────────────────────────────────────
  const copyToClipboard = (color) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(""), 2000);
  };

  // ── Snackbar helper ────────────────────────────────────────────────────────
  const toast = (msg, severity = "success") =>
    setSnackbar({ open: true, msg, severity });

  // ── Card menu helpers ──────────────────────────────────────────────────────
  const openMenu = (e, id) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuThemeId(id);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuThemeId(null);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedMeta = themes.find((t) => t.id === selectedThemeId);

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER — Theme List (no theme selected)
  // ══════════════════════════════════════════════════════════════════════════
  if (!selectedThemeId) {
    return (
      <Box>
        <PageHeader
          title={lang.themeManager || "Theme Manager"}
          subtitle={
            lang.themeManagerDesc ||
            "Create, manage and apply themes across your application"
          }
          icon={ColorLens}
          primaryAction={
            <Button
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
              variant="contained"
              size="large"
            >
              {lang.createTheme || "Create Theme"}
            </Button>
          }
          secondaryActions={
            <Stack direction="row" spacing={1}>
              <Tooltip title={lang.importTheme || "Import Theme"}>
                <IconButton
                  onClick={() => setImportDialogOpen(true)}
                  color="primary"
                >
                  <Upload />
                </IconButton>
              </Tooltip>
              <Tooltip title={lang.resetToDefault || "Reset to Default"}>
                <IconButton onClick={handleResetToDefault} color="error">
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Stack>
          }
        />

        {/* Theme Grid */}
        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                  <Skeleton
                    variant="rectangular"
                    height={200}
                    sx={{ borderRadius: 3 }}
                  />
                </Grid>
              ))
            : themes.map((theme) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={theme.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border: "2px solid",
                      borderColor: theme.isActive ? "primary.main" : "divider",
                      transition: "all 0.2s",
                      cursor: "pointer",
                      "&:hover": {
                        boxShadow: 6,
                        transform: "translateY(-2px)",
                      },
                    }}
                    onClick={() => openEditor(theme.id)}
                  >
                    <CardContent sx={{ flex: 1 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                      >
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >
                          <Badge
                            overlap="circular"
                            anchorOrigin={{
                              vertical: "bottom",
                              horizontal: "right",
                            }}
                            badgeContent={
                              theme.isActive ? (
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: "success.main",
                                    border: "2px solid white",
                                  }}
                                />
                              ) : null
                            }
                          >
                            <ThemeAvatar
                              name={theme.name}
                              isActive={theme.isActive}
                              isProtected={theme.isProtected}
                            />
                          </Badge>
                          <Box>
                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              noWrap
                            >
                              {theme.name}
                            </Typography>
                            {theme.isActive && (
                              <Chip
                                label="Active"
                                color="success"
                                size="small"
                                sx={{ height: 18, fontSize: "0.6rem" }}
                              />
                            )}
                            {theme.isProtected && (
                              <Chip
                                label="Protected"
                                color="default"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: "0.6rem",
                                  ml: theme.isActive ? 0.5 : 0,
                                }}
                              />
                            )}
                          </Box>
                        </Stack>

                        <IconButton
                          size="small"
                          onClick={(e) => openMenu(e, theme.id)}
                          sx={{ mt: -0.5 }}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Stack>

                      {theme.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1.5 }}
                          noWrap
                        >
                          {theme.description}
                        </Typography>
                      )}

                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ mt: 1, display: "block" }}
                      >
                        Updated:{" "}
                        {theme.updatedAt
                          ? new Date(theme.updatedAt).toLocaleDateString()
                          : "—"}
                      </Typography>
                    </CardContent>

                    <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditor(theme.id);
                        }}
                        sx={{ flex: 1 }}
                      >
                        {lang.edit || "Edit"}
                      </Button>
                      {!theme.isActive && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Check />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetActive(theme.id);
                          }}
                          sx={{ flex: 1 }}
                        >
                          {lang.setActive || "Set Active"}
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
        </Grid>

        {/* Card Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
        >
          <MenuItem
            onClick={() => {
              closeMenu();
              openEditor(menuThemeId);
            }}
          >
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>{lang.edit || "Edit"}</ListItemText>
          </MenuItem>
          {!themes.find((t) => t.id === menuThemeId)?.isActive && (
            <MenuItem
              onClick={() => {
                closeMenu();
                handleSetActive(menuThemeId);
              }}
            >
              <ListItemIcon>
                <Star fontSize="small" />
              </ListItemIcon>
              <ListItemText>{lang.setActive || "Set Active"}</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={() => handleDuplicate(menuThemeId)}>
            <ListItemIcon>
              <FileCopy fontSize="small" />
            </ListItemIcon>
            <ListItemText>{lang.duplicate || "Duplicate"}</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              const m = themes.find((t) => t.id === menuThemeId);
              setTargetThemeId(menuThemeId);
              setNewThemeName(m?.name || "");
              setNewThemeDesc(m?.description || "");
              setRenameDialogOpen(true);
            }}
            disabled={themes.find((t) => t.id === menuThemeId)?.isProtected}
          >
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>{lang.rename || "Rename"}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExport(menuThemeId)}>
            <ListItemIcon>
              <Download fontSize="small" />
            </ListItemIcon>
            <ListItemText>{lang.export || "Export"}</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              closeMenu();
              setTargetThemeId(menuThemeId);
              setDeleteConfirmOpen(true);
            }}
            disabled={themes.find((t) => t.id === menuThemeId)?.isProtected}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>{lang.delete || "Delete"}</ListItemText>
          </MenuItem>
        </Menu>

        {/* ── Create Theme Dialog ── */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6">
                {lang.createTheme || "Create New Theme"}
              </Typography>
              <IconButton onClick={() => setCreateDialogOpen(false)}>
                <Close />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField
                label={lang.themeName || "Theme Name"}
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                fullWidth
                autoFocus
              />
              <TextField
                label={lang.themeDescription || "Description (optional)"}
                value={newThemeDesc}
                onChange={(e) => setNewThemeDesc(e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
              <Autocomplete
                sx={{ borderRadius: 2 }}
                size="small"
                fullWidth
                options={[{ id: "", name: "— Start blank —" }, ...themes]}
                getOptionLabel={(option) => option.name || ""}
                value={
                  cloneFromId
                    ? themes.find((t) => t.id === cloneFromId) || null
                    : { id: "", name: "— Start blank —" }
                }
                onChange={(_, selected) => setCloneFromId(selected?.id || "")}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={lang.cloneFrom || "Clone from (optional)"}
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>
              {lang.cancel || "Cancel"}
            </Button>
            <ModernButtonComp
              title={lang.create || "Create"}
              variant="gradient"
              onClick={handleCreateTheme}
              disabled={!newThemeName.trim()}
            />
          </DialogActions>
        </Dialog>

        {/* ── Import Dialog ── */}
        <Dialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6">
                {lang.importTheme || "Import Theme"}
              </Typography>
              <IconButton onClick={() => setImportDialogOpen(false)}>
                <Close />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField
                label={lang.themeName || "Theme Name"}
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                fullWidth
                helperText="Leave blank to use name from JSON _meta"
              />
              <TextField
                fullWidth
                multiline
                rows={14}
                label={lang.pasteThemeJson || "Paste Theme JSON"}
                value={importJSON}
                onChange={(e) => setImportJSON(e.target.value)}
                sx={{ fontFamily: "monospace" }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setImportDialogOpen(false)}>
              {lang.cancel || "Cancel"}
            </Button>
            <ModernButtonComp
              title={lang.import || "Import"}
              variant="gradient"
              onClick={handleImport}
              disabled={!importJSON.trim()}
            />
          </DialogActions>
        </Dialog>

        {/* ── Rename Dialog ── */}
        <Dialog
          open={renameDialogOpen}
          onClose={() => setRenameDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6">
                {lang.rename || "Rename Theme"}
              </Typography>
              <IconButton onClick={() => setRenameDialogOpen(false)}>
                <Close />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField
                label={lang.themeName || "Theme Name"}
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                fullWidth
                autoFocus
              />
              <TextField
                label={lang.themeDescription || "Description"}
                value={newThemeDesc}
                onChange={(e) => setNewThemeDesc(e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRenameDialogOpen(false)}>
              {lang.cancel || "Cancel"}
            </Button>
            <ModernButtonComp
              title={lang.save || "Save"}
              variant="gradient"
              onClick={handleRename}
              disabled={!newThemeName.trim()}
            />
          </DialogActions>
        </Dialog>

        {/* ── Delete Confirm ── */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>{lang.deleteTheme || "Delete Theme"}</DialogTitle>
          <DialogContent>
            <Alert severity="warning">
              {lang.deleteThemeWarning ||
                "This action cannot be undone. The theme will be permanently deleted."}
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>
              {lang.cancel || "Cancel"}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteConfirm}
            >
              {lang.delete || "Delete"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER — Editor (theme selected)
  // ══════════════════════════════════════════════════════════════════════════
  if (!themeData) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Typography>
          {lang.loadingThemeEditor || "Loading theme editor…"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton onClick={closeEditor} size="small">
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" fontWeight={700}>
              {selectedMeta?.name || "Theme Editor"}
            </Typography>
            {selectedMeta?.isProtected && (
              <Chip
                icon={<Shield />}
                label="Protected"
                size="small"
                color="default"
              />
            )}
            {selectedThemeId === activeThemeId && (
              <Chip label="Active" size="small" color="success" />
            )}
          </Stack>
        }
        subtitle={
          selectedMeta?.description ||
          lang.themeEditorDesc ||
          "Customize appearance and styling"
        }
        icon={ColorLens}
        primaryAction={
          <ModernButtonComp
            title={lang.saveChanges || "Save Changes"}
            variant="gradient"
            startIcon={<Save />}
            onClick={handleSaveTheme}
            disabled={!unsavedChanges}
          />
        }
        secondaryActions={
          <Stack direction="row" spacing={1} alignItems="center">
            {unsavedChanges && (
              <Chip
                label={lang.unsavedChanges || "Unsaved"}
                color="warning"
                size="small"
              />
            )}
            {selectedThemeId !== activeThemeId && (
              <Tooltip title={lang.setActive || "Set as Active Theme"}>
                <IconButton
                  onClick={() => handleSetActive(selectedThemeId)}
                  color="success"
                >
                  <Star />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={lang.exportTheme || "Export Theme"}>
              <IconButton
                onClick={() => handleExport(selectedThemeId)}
                color="primary"
              >
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip title={lang.duplicate || "Duplicate Theme"}>
              <IconButton
                onClick={() => handleDuplicate(selectedThemeId)}
                color="primary"
              >
                <FileCopy />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      />

      {/* Editor Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Palette />} label={lang.colors || "Colors"} />
          <Tab icon={<TextFields />} label={lang.typography || "Typography"} />
          <Tab icon={<Widgets />} label={lang.button || "Button"} />
          <Tab icon={<Widgets />} label={lang.card || "Card"} />
          <Tab icon={<Widgets />} label={lang.input || "Input"} />
          <Tab icon={<ViewInAr />} label={lang.components || "Components"} />
          <Tab icon={<Tune />} label={lang.advanced || "Advanced"} />
        </Tabs>
      </Paper>

      <ThemeTabContent
        tabValue={tabValue}
        themeData={themeData}
        handleDirectChange={handleDirectChange}
        handleNestedChange={handleNestedChange}
        handleDeepNestedChange={handleDeepNestedChange}
        copiedColor={copiedColor}
        copyToClipboard={copyToClipboard}
        lang={lang}
      />
    </Box>
  );
};

export default WebTheme;
