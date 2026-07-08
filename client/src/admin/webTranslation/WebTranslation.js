import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Button,
  Container,
} from "@mui/material";
import {
  Translate,
  Add,
  Edit,
  Delete,
  Save,
  Search,
  Language,
  CheckCircleOutline,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from "@mui/icons-material";
import PageHeader from "../../common/PageHeader";
import CommonDialog from "../../common/CommonDialog";
import { GlobalContext } from "../../context/GlobalContext";
import { TranslateContext } from "../../context/TranslateContext";
import { useCustomTheme } from "../../utils/useCustomTheme";
import debounce from "lodash/debounce";

// ─────────────────────────────────────────────
const WebTranslation = ({ lang }) => {
  const { hitAxios } = useContext(GlobalContext);
  const { config, isDark } = useCustomTheme();

  // ── State ──
  const [langs, setLangs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [langCode, setLangCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [editLang, setEditLang] = useState([]);
  const [filteredLang, setFilteredLang] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [unsaved, setUnsaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: "", type: "success" });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  // ── Helpers ──
  const showToast = (msg, type = "success") =>
    setToast({ open: true, msg, type });

  const parseJson = (obj) =>
    Object.keys(obj).map((key) => ({ var: key, name: obj[key] }));

  // ── API ──
  async function getLangs() {
    setLoading(true);
    try {
      const res = await hitAxios({
        path: "/api/web/get-all-translation-name",
        post: false,
        admin: false,
        showLoading: false,
      });
      if (res.data.success) setLangs(res.data.data);
    } catch {
      showToast(lang?.wt_errorLoadLangs || "Failed to load languages", "error");
    } finally {
      setLoading(false);
    }
  }

  async function getOneLang(code) {
    setLoading(true);
    try {
      const res = await hitAxios({
        path: `/api/web/get-one-translation?code=${code}`,
        post: false,
        admin: false,
        showLoading: false,
      });
      if (res.data.success) {
        const parsed = parseJson(res.data.data);
        setEditLang(parsed);
        setFilteredLang(parsed);
        setPagination((p) => ({
          ...p,
          page: 1,
          total: parsed.length,
          pages: Math.ceil(parsed.length / p.limit),
        }));
        setLangCode(code);
        setUnsaved(false);
        setEditOpen(true);
      }
    } catch {
      showToast(
        lang?.wt_errorLoadData || "Failed to load language data",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  async function addLang() {
    if (!newCode.trim()) {
      showToast(
        lang?.wt_enterCode || "Please enter a language code",
        "warning",
      );
      return;
    }
    setLoading(true);
    try {
      const res = await hitAxios({
        path: "/api/web/add-new-translation",
        post: true,
        admin: true,
        obj: { newcode: newCode },
        showLoading: false,
      });
      if (res.data.success) {
        setAddOpen(false);
        setNewCode("");
        getLangs();
        showToast(lang?.wt_addedSuccess || "Language added successfully");
      }
    } catch {
      showToast(lang?.wt_errorAdd || "Failed to add language", "error");
    } finally {
      setLoading(false);
    }
  }

  async function deleteLang(code) {
    if (
      !window.confirm(
        lang?.wt_confirmDelete ||
          "Are you sure you want to delete this language?",
      )
    )
      return;
    setLoading(true);
    try {
      const res = await hitAxios({
        path: "/api/web/del-one-translation",
        post: true,
        admin: true,
        obj: { code },
        showLoading: false,
      });
      if (res.data.success) {
        getLangs();
        showToast(lang?.wt_deletedSuccess || "Language deleted successfully");
      }
    } catch {
      showToast(lang?.wt_errorDelete || "Failed to delete language", "error");
    } finally {
      setLoading(false);
    }
  }

  async function saveLang() {
    setSaving(true);
    const obj = {};
    editLang.forEach((item) => {
      obj[item.var] = item.name;
    });
    try {
      const res = await hitAxios({
        path: "/api/web/update-one-translation",
        post: true,
        admin: true,
        obj: { code: langCode, updatedjson: obj },
        showLoading: false,
      });
      if (res.data.success) {
        setUnsaved(false);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 3000);
        showToast(lang?.wt_savedSuccess || "Translation saved successfully");
      }
    } catch {
      showToast(lang?.wt_errorSave || "Failed to save translation", "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Search ──
  const debouncedSearch = useCallback(
    debounce((val) => {
      const filtered = editLang.filter(
        (item) =>
          item.var.toLowerCase().includes(val.toLowerCase()) ||
          String(item.name).toLowerCase().includes(val.toLowerCase()),
      );
      setFilteredLang(filtered);
      setPagination((p) => ({
        ...p,
        page: 1,
        total: filtered.length,
        pages: Math.ceil(filtered.length / p.limit),
      }));
    }, 280),
    [editLang],
  );

  const onSearch = (e) => {
    setSearch(e.target.value);
    debouncedSearch(e.target.value);
  };

  // ── Sort ──
  const toggleSort = () => {
    const next = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(next);
    setFilteredLang((prev) =>
      [...prev].sort((a, b) =>
        next === "asc"
          ? a.var.localeCompare(b.var)
          : b.var.localeCompare(a.var),
      ),
    );
  };

  // ── Edit field ──
  const onFieldChange = (varKey, value) => {
    setEditLang((prev) =>
      prev.map((item) =>
        item.var === varKey ? { ...item, name: value } : item,
      ),
    );
    setFilteredLang((prev) =>
      prev.map((item) =>
        item.var === varKey ? { ...item, name: value } : item,
      ),
    );
    setUnsaved(true);
  };

  // ── Pagination ──
  const pageItems = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filteredLang.slice(start, start + pagination.limit);
  }, [filteredLang, pagination.page, pagination.limit]);

  const handleCloseEdit = () => {
    if (
      unsaved &&
      !window.confirm(
        lang?.wt_unsavedWarning || "You have unsaved changes. Close anyway?",
      )
    )
      return;
    setEditOpen(false);
    setUnsaved(false);
  };

  // ── Auto-save ──
  const debouncedSave = useCallback(
    debounce(() => {
      if (unsaved) saveLang();
    }, 4000),
    [editLang, unsaved],
  );
  useEffect(() => {
    if (unsaved) debouncedSave();
    return () => debouncedSave.cancel();
  }, [unsaved, debouncedSave]);

  useEffect(() => {
    getLangs();
  }, []);

  // ─────────────────────────────────────────────
  return (
    <Box>
      <PageHeader
        title={lang?.webTranslation || "Web Translation"}
        subtitle={
          lang?.webTranslationSub ||
          "Manage your site translation for multi language"
        }
        icon={Translate}
        primaryAction={
          <Button
            startIcon={<Add />}
            size="large"
            onClick={() => setAddOpen(true)}
            variant="contained"
          >
            {lang?.wt_addNew || "Add Language"}
          </Button>
        }
      />

      {/* ── Language list ── */}
      {loading && langs.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : langs.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: `${config.card.borderRadius}px`,
          }}
        >
          <Language
            sx={{ fontSize: "2.5rem", color: "text.disabled", mb: 1 }}
          />
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {lang?.wt_noLanguages || "No languages yet"}
          </Typography>
          <Box
            component="button"
            onClick={() => setAddOpen(true)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.7,
              px: 2,
              py: 1,
              borderRadius: "50px",
              border: "none",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              cursor: "pointer",
              fontFamily: config.font_family,
              fontSize: "0.82rem",
              fontWeight: config.font_weight_semibold,
              transition: "opacity 0.2s ease",
              "&:hover": { opacity: 0.85 },
            }}
          >
            <Add sx={{ fontSize: "1rem" }} />
            {lang?.wt_addNew || "Add Language"}
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {langs.map((file) => {
            const code = file.replace(".json", "");
            return (
              <Box
                key={code}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                  p: 2.5,
                  borderRadius: `${config.card.borderRadius}px`,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  transition: "box-shadow 0.25s ease, transform 0.25s ease",
                  "&:hover": {
                    boxShadow: 4,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                {/* Left */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: `${config.card.borderRadius / 2}px`,
                      bgcolor: "primary.main",
                      opacity: 0.12,
                      position: "absolute",
                    }}
                  />
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: `${config.card.borderRadius / 2}px`,
                      border: "1px solid",
                      borderColor: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      position: "relative",
                    }}
                  >
                    <Language
                      sx={{ fontSize: "1.2rem", color: "primary.main" }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={config.font_weight_bold}
                      sx={{ fontFamily: config.font_family, lineHeight: 1.3 }}
                    >
                      {code}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontFamily: config.font_family }}
                    >
                      {lang?.wt_langCode || "Language Code"} · .json
                    </Typography>
                  </Box>
                </Box>

                {/* Right: actions */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Box
                    component="button"
                    onClick={() => getOneLang(code)}
                    disabled={loading}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.6,
                      px: 1.8,
                      py: 0.8,
                      borderRadius: "50px",
                      border: "1px solid",
                      borderColor: "primary.main",
                      bgcolor: "transparent",
                      color: "primary.main",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.45 : 1,
                      fontFamily: config.font_family,
                      fontSize: "0.78rem",
                      fontWeight: config.font_weight_semibold,
                      transition: "all 0.2s ease",
                      "&:hover:not(:disabled)": { opacity: 0.75 },
                    }}
                  >
                    <Edit sx={{ fontSize: "0.85rem" }} />
                    {lang?.wt_edit || "Edit"}
                  </Box>

                  <Box
                    component="button"
                    onClick={() => deleteLang(code)}
                    disabled={loading}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.6,
                      px: 1.8,
                      py: 0.8,
                      borderRadius: "50px",
                      border: "1px solid",
                      borderColor: "error.main",
                      bgcolor: "transparent",
                      color: "error.main",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.45 : 1,
                      fontFamily: config.font_family,
                      fontSize: "0.78rem",
                      fontWeight: config.font_weight_semibold,
                      transition: "all 0.2s ease",
                      "&:hover:not(:disabled)": { opacity: 0.75 },
                    }}
                  >
                    <Delete sx={{ fontSize: "0.85rem" }} />
                    {lang?.wt_delete || "Delete"}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ══════════════════════════════════════════
          ADD LANGUAGE — CommonDialog
      ══════════════════════════════════════════ */}
      <CommonDialog
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setNewCode("");
        }}
        title={lang?.wt_addNew || "Add New Language"}
        icon={Add}
        maxWidth="sm"
        fullWidth
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            pt: 1,
            mt: 2,
          }}
        >
          <TextField
            label={lang?.wt_langCodeLabel || "Language Code"}
            placeholder={lang?.wt_codePlaceholder || "e.g. en, fr, es, ar"}
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.replace(/\s/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && addLang()}
            helperText={
              lang?.wt_codeHelper ||
              "This will create a new JSON translation file."
            }
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Language color="primary" />
                </InputAdornment>
              ),
              sx: { borderRadius: `${config.card.borderRadius / 1.5}px` },
            }}
          />

          <Button startIcon={<Add />} variant="contained" onClick={addLang}>
            {lang?.wt_addNew || "Add Language"}
          </Button>
        </Box>
      </CommonDialog>

      {/* ══════════════════════════════════════════
          EDIT FULLSCREEN — CommonDialog
      ══════════════════════════════════════════ */}
      <CommonDialog
        open={editOpen}
        onClose={handleCloseEdit}
        title={`${lang?.wt_editing || "Editing"} — ${langCode}`}
        icon={Edit}
        maxWidth={false}
        fullWidth
        fullScreen
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              mt: 2,
            }}
          >
            {/* ── Toolbar ── */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1.5,
                pb: 2,
                mb: 2,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              {/* Left: entry count + saved chip */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredLang.length} {lang?.wt_entries || "entries"}
                </Typography>
                {savedFlash && (
                  <Chip
                    icon={<CheckCircleOutline />}
                    label={lang?.wt_saved || "Saved"}
                    color="success"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>

              {/* Right: sort + per-page + save */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                {/* Sort */}
                <Box
                  component="button"
                  onClick={toggleSort}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1.4,
                    py: 0.7,
                    borderRadius: "50px",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.default",
                    cursor: "pointer",
                    color: "text.secondary",
                    fontFamily: config.font_family,
                    fontSize: "0.75rem",
                    fontWeight: config.font_weight_medium,
                    "&:hover": { opacity: 0.75 },
                  }}
                >
                  {sortOrder === "asc" ? (
                    <KeyboardArrowUp sx={{ fontSize: "0.9rem" }} />
                  ) : (
                    <KeyboardArrowDown sx={{ fontSize: "0.9rem" }} />
                  )}
                  {sortOrder === "asc"
                    ? lang?.wt_sortAZ || "A–Z"
                    : lang?.wt_sortZA || "Z–A"}
                </Box>

                {/* Per-page pills */}
                {[10, 20, 50].map((n) => (
                  <Box
                    key={n}
                    component="button"
                    onClick={() =>
                      setPagination((p) => ({
                        ...p,
                        limit: n,
                        page: 1,
                        pages: Math.ceil(p.total / n),
                      }))
                    }
                    sx={{
                      px: 1.4,
                      py: 0.6,
                      borderRadius: "50px",
                      border: "1px solid",
                      borderColor:
                        pagination.limit === n ? "primary.main" : "divider",
                      bgcolor:
                        pagination.limit === n
                          ? "primary.main"
                          : "background.default",
                      color:
                        pagination.limit === n
                          ? "primary.contrastText"
                          : "text.secondary",
                      cursor: "pointer",
                      fontFamily: config.font_family,
                      fontSize: "0.72rem",
                      fontWeight:
                        pagination.limit === n
                          ? config.font_weight_semibold
                          : config.font_weight_regular,
                      transition: "all 0.2s ease",
                      "&:hover": { opacity: 0.75 },
                    }}
                  >
                    {n}
                  </Box>
                ))}

                {/* Save button */}
                <Box
                  component="button"
                  onClick={saveLang}
                  disabled={saving || !unsaved}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.7,
                    px: 2,
                    py: 0.9,
                    borderRadius: "50px",
                    border: "none",
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    cursor: saving || !unsaved ? "not-allowed" : "pointer",
                    opacity: saving || !unsaved ? 0.5 : 1,
                    fontFamily: config.font_family,
                    fontSize: "0.82rem",
                    fontWeight: config.font_weight_semibold,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  {saving ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <Save sx={{ fontSize: "0.9rem" }} />
                  )}
                  {saving
                    ? lang?.wt_saving || "Saving..."
                    : unsaved
                      ? lang?.wt_saveChanges || "Save Changes"
                      : lang?.wt_saved || "Saved"}
                </Box>
              </Box>
            </Box>

            {/* ── Search bar ── */}
            <TextField
              placeholder={lang?.wt_search || "Search keys or values…"}
              value={search}
              onChange={onSearch}
              size="small"
              fullWidth
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                sx: { borderRadius: "50px" },
              }}
            />

            {/* ── Count ── */}
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
              {lang?.wt_showing || "Showing"}{" "}
              {Math.min(
                (pagination.page - 1) * pagination.limit + 1,
                filteredLang.length,
              )}
              –
              {Math.min(
                pagination.page * pagination.limit,
                filteredLang.length,
              )}{" "}
              {lang?.wt_of || "of"} {filteredLang.length}{" "}
              {lang?.wt_items || "items"}
            </Typography>

            {/* ── Entries ── */}
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : pageItems.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography color="text.secondary">
                  {lang?.wt_noResults || "No matching keys found"}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  flex: 1,
                }}
              >
                {pageItems.map((item) => (
                  <Box
                    key={item.var}
                    sx={{
                      p: 2,
                      borderRadius: `${config.card.borderRadius}px`,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                      transition: "box-shadow 0.2s ease",
                      "&:hover": { boxShadow: 2 },
                    }}
                  >
                    {/* Key label */}
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{
                        fontFamily: config.font_family,
                        fontWeight: config.font_weight_semibold,
                        letterSpacing: "0.04em",
                        display: "block",
                        mb: 0.8,
                      }}
                    >
                      {item.var}
                    </Typography>

                    {/* Value field */}
                    <TextField
                      value={item.name}
                      onChange={(e) => onFieldChange(item.var, e.target.value)}
                      fullWidth
                      size="small"
                      multiline={String(item.name).length > 80}
                      rows={
                        String(item.name).length > 160
                          ? 4
                          : String(item.name).length > 80
                            ? 2
                            : 1
                      }
                      InputProps={{
                        sx: {
                          borderRadius: `${config.card.borderRadius / 1.5}px`,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}

            {/* ── Pagination ── */}
            {pagination.pages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  mt: 4,
                  pb: 4,
                  flexWrap: "wrap",
                }}
              >
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                  (p) => (
                    <Box
                      key={p}
                      component="button"
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: p }))
                      }
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        border: "1px solid",
                        borderColor:
                          p === pagination.page ? "primary.main" : "divider",
                        bgcolor:
                          p === pagination.page
                            ? "primary.main"
                            : "background.default",
                        color:
                          p === pagination.page
                            ? "primary.contrastText"
                            : "text.secondary",
                        fontFamily: config.font_family,
                        fontSize: "0.75rem",
                        fontWeight: config.font_weight_semibold,
                        transition: "all 0.2s ease",
                        "&:hover": { opacity: 0.75 },
                      }}
                    >
                      {p}
                    </Box>
                  ),
                )}
              </Box>
            )}

            {/* ── Floating save ── */}
            {unsaved && (
              <Box
                sx={{
                  position: "sticky",
                  bottom: 16,
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: 2,
                  animation: "slideUp 0.3s ease",
                  "@keyframes slideUp": {
                    from: { opacity: 0, transform: "translateY(12px)" },
                    to: { opacity: 1, transform: "translateY(0)" },
                  },
                }}
              >
                <Box
                  component="button"
                  onClick={saveLang}
                  disabled={saving}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.8,
                    px: 2.5,
                    py: 1.2,
                    borderRadius: "50px",
                    border: "none",
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                    fontFamily: config.font_family,
                    fontSize: "0.85rem",
                    fontWeight: config.font_weight_semibold,
                    boxShadow: 4,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  {saving ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Save sx={{ fontSize: "1rem" }} />
                  )}
                  {saving
                    ? lang?.wt_saving || "Saving..."
                    : lang?.wt_saveChanges || "Save Changes"}
                </Box>
              </Box>
            )}
          </Box>
        </Container>
      </CommonDialog>

      {/* ══════════════════════════════════════════
          TOAST
      ══════════════════════════════════════════ */}
      {toast.open && (
        <Box
          onClick={() => setToast((t) => ({ ...t, open: false }))}
          sx={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1400,
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 2.5,
            py: 1.2,
            borderRadius: "50px",
            bgcolor:
              toast.type === "error"
                ? "error.main"
                : toast.type === "warning"
                  ? "warning.main"
                  : "success.main",
            color: "common.white",
            boxShadow: 6,
            cursor: "pointer",
            animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            "@keyframes toastIn": {
              from: {
                opacity: 0,
                transform: "translateX(-50%) translateY(12px) scale(0.95)",
              },
              to: {
                opacity: 1,
                transform: "translateX(-50%) translateY(0) scale(1)",
              },
            },
          }}
        >
          <Typography
            sx={{
              fontSize: "0.8rem",
              fontFamily: config.font_family,
              fontWeight: config.font_weight_medium,
              color: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {toast.msg}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default WebTranslation;
