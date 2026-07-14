import React from "react";
import PageHeader from "../../common/PageHeader";
import BookFlipViewer from "./BookFlipViewer";
import {
  AutoStories,
  DeleteOutline,
  Download,
  MenuBook,
  Close,
  EditOutlined,
  VisibilityOutlined,
  SaveOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { GlobalContext } from "../../context/GlobalContext";
import { jsPDF } from "jspdf";

const TONES = ["engaging", "warm", "dramatic", "simple", "inspirational", "professional"];
const LANGUAGES = ["English", "Hindi", "Spanish", "French", "Arabic", "Portuguese"];

function parsePages(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeDraftPages(pages) {
  return parsePages(pages).map((p, i) => ({
    page: Number(p.page) || i + 1,
    heading: p.heading || `Page ${i + 1}`,
    content: typeof p.content === "string" ? p.content : "",
  }));
}

const Books = ({ lang }) => {
  const theme = useTheme();
  const { hitAxios } = React.useContext(GlobalContext);

  const [meta, setMeta] = React.useState({
    genres: ["Fiction"],
    minPages: 5,
    maxPages: 20,
    creditsPerPage: 2,
  });
  const [books, setBooks] = React.useState([]);
  const [error, setError] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [authorName, setAuthorName] = React.useState("");
  const [genre, setGenre] = React.useState("Fiction");
  const [pageCount, setPageCount] = React.useState(8);
  const [tone, setTone] = React.useState("engaging");
  const [language, setLanguage] = React.useState("English");
  const [synopsis, setSynopsis] = React.useState("");

  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [activeBook, setActiveBook] = React.useState(null);
  const [loadingBook, setLoadingBook] = React.useState(false);
  const [viewMode, setViewMode] = React.useState("preview"); // preview | edit
  const [draftTitle, setDraftTitle] = React.useState("");
  const [draftAuthor, setDraftAuthor] = React.useState("");
  const [draftPages, setDraftPages] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState("");

  const minPages = meta.minPages || 5;
  const maxPages = meta.maxPages || 20;
  const totalCredits = (meta.creditsPerPage || 2) * pageCount;

  function syncDraftFromBook(book) {
    if (!book) {
      setDraftTitle("");
      setDraftAuthor("");
      setDraftPages([]);
      return;
    }
    setDraftTitle(book.title || "");
    setDraftAuthor(book.author_name || "");
    setDraftPages(normalizeDraftPages(book.pages));
  }

  async function loadMeta() {
    const res = await hitAxios({
      path: "/api/books/meta",
      post: false,
      admin: false,
      showLoading: false,
    });
    if (res?.data?.success) {
      const d = res.data.data;
      setMeta(d);
      setGenre(d.genres?.[0] || "Fiction");
      setPageCount(d.minPages || 5);
    }
  }

  async function loadBooks() {
    const res = await hitAxios({
      path: "/api/books/get_all",
      post: false,
      admin: false,
      showLoading: false,
    });
    if (res?.data?.success) setBooks(res.data.data || []);
  }

  React.useEffect(() => {
    loadMeta();
    loadBooks();
  }, []);

  // Poll processing books
  React.useEffect(() => {
    const hasProcessing = books.some((b) => b.status === "processing");
    if (!hasProcessing) return undefined;
    const t = setInterval(loadBooks, 4000);
    return () => clearInterval(t);
  }, [books]);

  // Refresh open viewer while processing
  React.useEffect(() => {
    if (!viewerOpen || !activeBook?.id) return undefined;
    if (activeBook.status !== "processing") return undefined;
    const t = setInterval(async () => {
      const res = await hitAxios({
        path: `/api/books/get_one/${activeBook.id}`,
        post: false,
        admin: false,
        showLoading: false,
      });
      if (res?.data?.success) {
        const book = res.data.data;
        setActiveBook(book);
        if (book.status === "success") {
          syncDraftFromBook(book);
          loadBooks();
        } else if (book.status !== "processing") {
          loadBooks();
        }
      }
    }, 3500);
    return () => clearInterval(t);
  }, [viewerOpen, activeBook?.id, activeBook?.status]);

  function clampPageCount(value) {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n)) return minPages;
    return Math.max(minPages, Math.min(maxPages, n));
  }

  async function handleCreate() {
    setError("");
    if (!title.trim() || !synopsis.trim()) {
      setError(lang?.bookFormRequired || "Please fill title and story idea");
      return;
    }
    setCreating(true);
    try {
      const res = await hitAxios({
        path: "/api/books/create",
        post: true,
        admin: false,
        obj: {
          title,
          authorName: authorName || "Anonymous",
          genre,
          pageCount: clampPageCount(pageCount),
          tone,
          language,
          synopsis,
        },
      });
      if (res?.data?.success) {
        setTitle("");
        setSynopsis("");
        await loadBooks();
        openBook(res.data.data.id);
      } else {
        setError(res?.data?.msg || lang?.somethingWentWrong || "Failed");
      }
    } catch {
      setError(lang?.somethingWentWrong || "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function openBook(id) {
    setLoadingBook(true);
    setViewerOpen(true);
    setViewMode("preview");
    setSaveMsg("");
    try {
      const res = await hitAxios({
        path: `/api/books/get_one/${id}`,
        post: false,
        admin: false,
        showLoading: false,
      });
      if (res?.data?.success) {
        setActiveBook(res.data.data);
        syncDraftFromBook(res.data.data);
      } else {
        setActiveBook(null);
        syncDraftFromBook(null);
      }
    } finally {
      setLoadingBook(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(lang?.confirmDelete || "Delete this book?")) return;
    await hitAxios({
      path: "/api/books/delete",
      post: true,
      admin: false,
      obj: { id },
    });
    if (activeBook?.id === id) {
      setViewerOpen(false);
      setActiveBook(null);
    }
    loadBooks();
  }

  function updateDraftPage(index, field, value) {
    setDraftPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
    setSaveMsg("");
  }

  async function handleSaveEdits() {
    if (!activeBook?.id) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await hitAxios({
        path: "/api/books/update",
        post: true,
        admin: false,
        obj: {
          id: activeBook.id,
          title: draftTitle,
          authorName: draftAuthor,
          genre: activeBook.genre,
          synopsis: activeBook.synopsis,
          pages: draftPages,
        },
      });
      if (res?.data?.success) {
        const book = res.data.data;
        setActiveBook(book);
        syncDraftFromBook(book);
        setSaveMsg(lang?.bookSaved || "Book saved");
        setViewMode("preview");
        loadBooks();
      } else {
        setSaveMsg(res?.data?.msg || lang?.somethingWentWrong || "Failed");
      }
    } catch {
      setSaveMsg(lang?.somethingWentWrong || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function downloadTxt(book) {
    const pages = parsePages(book.pages);
    const body = [
      book.title,
      `${lang?.byAuthor || "by"} ${book.author_name || "Anonymous"}`,
      `${book.genre || ""} · ${book.language || ""}`,
      "",
      book.synopsis || "",
      "",
      ...pages.flatMap((p) => [
        `--- ${p.heading || `${lang?.page || "Page"} ${p.page}`} ---`,
        p.content || "",
        "",
      ]),
    ].join("\n");

    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(book.title || "book").replace(/[^\w\-]+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function mediaUrl(file) {
    if (!file) return null;
    const raw = String(file).trim();
    if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
    if (raw.startsWith("/")) return raw;
    return `/media/${raw}`;
  }

  async function loadImageDataUrl(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load cover image");
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function downloadPdf(book) {
    const pages = parsePages(book.pages);
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    const maxWidth = pageW - margin * 2;
    const pageBg = [255, 253, 248];
    const headingColor = [93, 64, 55];
    const textColor = [44, 24, 16];

    // ── Cover page (same AI design as preview) ──
    const coverUrl = mediaUrl(book.cover_image);
    let coverDrawn = false;
    if (coverUrl) {
      try {
        const dataUrl = await loadImageDataUrl(coverUrl);
        const format = String(dataUrl).includes("image/png") ? "PNG" : "JPEG";
        doc.addImage(dataUrl, format, 0, 0, pageW, pageH, undefined, "FAST");
        // Soft title band matching preview overlay
        doc.setFillColor(20, 12, 8);
        doc.rect(0, pageH - 160, pageW, 160, "F");
        doc.setTextColor(251, 233, 231);
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.text(String(book.genre || "Book").toUpperCase(), margin, pageH - 110);
        doc.setFont("times", "bold");
        doc.setFontSize(26);
        const titleLines = doc.splitTextToSize(String(book.title || ""), maxWidth);
        doc.text(titleLines, margin, pageH - 80);
        doc.setFont("times", "normal");
        doc.setFontSize(13);
        doc.text(
          `${lang?.byAuthor || "by"} ${book.author_name || "Anonymous"}`,
          margin,
          pageH - 40,
        );
        coverDrawn = true;
      } catch (err) {
        console.warn("PDF cover image failed, using fallback:", err);
      }
    }

    if (!coverDrawn) {
      doc.setFillColor(62, 39, 35);
      doc.rect(0, 0, pageW, pageH, "F");
      doc.setTextColor(251, 233, 231);
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.text(String(book.genre || "Book").toUpperCase(), margin, 80);
      doc.setFont("times", "bold");
      doc.setFontSize(28);
      doc.text(
        doc.splitTextToSize(String(book.title || ""), maxWidth),
        margin,
        pageH / 2 - 40,
      );
      doc.setFont("times", "normal");
      doc.setFontSize(14);
      doc.text(
        `${lang?.byAuthor || "by"} ${book.author_name || "Anonymous"}`,
        margin,
        pageH / 2 + 30,
      );
    }

    // ── Content pages (cream paper look like preview) ──
    pages.forEach((p) => {
      doc.addPage();
      doc.setFillColor(...pageBg);
      doc.rect(0, 0, pageW, pageH, "F");

      let y = margin;
      const write = (text, opts = {}) => {
        const lines = doc.splitTextToSize(String(text || ""), maxWidth);
        for (const line of lines) {
          if (y > pageH - margin) {
            doc.addPage();
            doc.setFillColor(...pageBg);
            doc.rect(0, 0, pageW, pageH, "F");
            y = margin;
            if (opts.color) doc.setTextColor(...opts.color);
            if (opts.font) doc.setFont(opts.font[0], opts.font[1]);
            if (opts.size) doc.setFontSize(opts.size);
          }
          doc.text(line, margin, y);
          y += opts.lineHeight || 16;
        }
        y += opts.after || 8;
      };

      doc.setTextColor(...headingColor);
      doc.setFont("times", "bold");
      doc.setFontSize(16);
      write(p.heading || `${lang?.page || "Page"} ${p.page}`, {
        lineHeight: 22,
        after: 14,
        color: headingColor,
        font: ["times", "bold"],
        size: 16,
      });

      doc.setTextColor(...textColor);
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      write(p.content || "", {
        lineHeight: 17,
        after: 4,
        color: textColor,
        font: ["times", "normal"],
        size: 12,
      });

      doc.setTextColor(141, 110, 99);
      doc.setFontSize(10);
      doc.text(
        `${p.page || ""} / ${pages.length}`,
        pageW / 2,
        pageH - 28,
        { align: "center" },
      );
    });

    doc.save(`${(book.title || "book").replace(/[^\w\-]+/g, "_")}.pdf`);
  }

  const previewBook = activeBook
    ? {
        ...activeBook,
        title: draftTitle || activeBook.title,
        author_name: draftAuthor || activeBook.author_name,
        pages: draftPages.length ? draftPages : parsePages(activeBook.pages),
      }
    : null;

  return (
    <Box>
      <PageHeader
        icon={AutoStories}
        title={lang?.bookWriter || "Book Writer"}
        subtitle={
          lang?.bookWriterSub ||
          "Tell us your idea, choose pages, then read your book with page-turn view and download it"
        }
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={2}>
              {lang?.createYourBook || "Create your book"}
            </Typography>

            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label={lang?.bookTitle || "Book title"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={lang?.bookTitlePh || "e.g. The Midnight Garden"}
              />
              <TextField
                fullWidth
                size="small"
                label={lang?.authorName || "Author name"}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={lang?.authorNamePh || "Your name"}
              />

              <FormControl fullWidth size="small">
                <InputLabel>{lang?.genre || "Genre"}</InputLabel>
                <Select
                  label={lang?.genre || "Genre"}
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                >
                  {(meta.genres || []).map((g) => (
                    <MenuItem key={g} value={g}>
                      {g}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                type="number"
                label={lang?.howManyPages || "How many pages?"}
                value={pageCount}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setPageCount("");
                    return;
                  }
                  setPageCount(clampPageCount(raw));
                }}
                onBlur={() => setPageCount((v) => clampPageCount(v))}
                inputProps={{
                  min: minPages,
                  max: maxPages,
                  step: 1,
                }}
                helperText={`${lang?.bookCreditsHint || "Credits"}: ${
                  Number.isFinite(Number(pageCount)) ? totalCredits : "—"
                } (${meta.creditsPerPage}/page) · ${minPages}–${maxPages}`}
              />

              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{lang?.tone || "Tone"}</InputLabel>
                    <Select
                      label={lang?.tone || "Tone"}
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                    >
                      {TONES.map((t) => (
                        <MenuItem key={t} value={t}>
                          {t}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{lang?.language || "Language"}</InputLabel>
                    <Select
                      label={lang?.language || "Language"}
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      {LANGUAGES.map((l) => (
                        <MenuItem key={l} value={l}>
                          {l}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                multiline
                minRows={4}
                label={lang?.bookIdea || "What is the book about?"}
                placeholder={
                  lang?.bookIdeaPh ||
                  "Describe the story, characters, lesson, or topic in your own words…"
                }
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
              />

              {error && <Alert severity="error">{error}</Alert>}

              <Button
                variant="contained"
                size="large"
                disabled={creating}
                startIcon={
                  creating ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <AutoStories />
                  )
                }
                onClick={handleCreate}
              >
                {creating
                  ? lang?.writingBook || "Writing your book…"
                  : `${lang?.writeBook || "Write book"} (${
                      Number.isFinite(Number(pageCount)) ? totalCredits : "—"
                    } ${lang?.credits || "credits"})`}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
              {lang?.myBooks || "My books"}
            </Typography>
            {books.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {lang?.noBooksYet ||
                  "No books yet — create your first one on the left."}
              </Typography>
            ) : (
              <Stack divider={<Divider />} spacing={1.5}>
                {books.map((b) => (
                  <Stack
                    key={b.id}
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ sm: "center" }}
                    justifyContent="space-between"
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                      {b.cover_image ? (
                        <Box
                          component="img"
                          src={mediaUrl(b.cover_image)}
                          alt=""
                          sx={{
                            width: 44,
                            height: 60,
                            objectFit: "cover",
                            borderRadius: 1,
                            flexShrink: 0,
                            boxShadow: 1,
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 44,
                            height: 60,
                            borderRadius: 1,
                            flexShrink: 0,
                            bgcolor: "action.hover",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MenuBook fontSize="small" color="action" />
                        </Box>
                      )}
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" gap={1} alignItems="center" mb={0.5}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {b.title}
                        </Typography>
                        <Chip
                          size="small"
                          label={b.status}
                          color={
                            b.status === "success"
                              ? "success"
                              : b.status === "processing"
                                ? "warning"
                                : "error"
                          }
                          sx={{ height: 22, fontSize: "0.7rem" }}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {b.genre} · {b.page_count} {lang?.pages || "pages"} ·{" "}
                        {b.author_name}
                      </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<MenuBook />}
                        onClick={() => openBook(b.id)}
                      >
                        {lang?.readBook || "Read"}
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(b.id)}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.98),
          },
        }}
      >
        <DialogTitle sx={{ pr: 6 }}>
          <Typography variant="h6" fontWeight={700}>
            {draftTitle || activeBook?.title || lang?.bookWriter || "Book"}
          </Typography>
          <IconButton
            onClick={() => setViewerOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingBook ? (
            <Stack alignItems="center" py={6}>
              <CircularProgress />
            </Stack>
          ) : !activeBook ? (
            <Alert severity="error">
              {lang?.bookNotFound || "Book not found"}
            </Alert>
          ) : activeBook.status === "processing" ? (
            <Stack alignItems="center" spacing={2} py={4}>
              <CircularProgress />
              <Typography>
                {lang?.writingBook || "Writing your book…"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {lang?.writingBookHint ||
                  "Pages are being generated. This can take a few minutes."}
              </Typography>
            </Stack>
          ) : activeBook.status === "error" ? (
            <Alert severity="error">
              {activeBook.error_msg || lang?.somethingWentWrong || "Failed"}
            </Alert>
          ) : (
            <Stack spacing={2.5}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ sm: "center" }}
                justifyContent="space-between"
              >
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={viewMode}
                  onChange={(_, v) => v && setViewMode(v)}
                >
                  <ToggleButton value="preview">
                    <VisibilityOutlined sx={{ mr: 0.75, fontSize: 18 }} />
                    {lang?.previewBook || "Preview"}
                  </ToggleButton>
                  <ToggleButton value="edit">
                    <EditOutlined sx={{ mr: 0.75, fontSize: 18 }} />
                    {lang?.editBook || "Edit"}
                  </ToggleButton>
                </ToggleButtonGroup>

                {viewMode === "edit" && (
                  <Button
                    variant="contained"
                    size="small"
                    disabled={saving}
                    startIcon={
                      saving ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <SaveOutlined />
                      )
                    }
                    onClick={handleSaveEdits}
                  >
                    {saving
                      ? lang?.savingBook || "Saving…"
                      : lang?.saveBookEdits || "Save changes"}
                  </Button>
                )}
              </Stack>

              {saveMsg && (
                <Alert
                  severity={
                    saveMsg === (lang?.bookSaved || "Book saved")
                      ? "success"
                      : "error"
                  }
                  onClose={() => setSaveMsg("")}
                >
                  {saveMsg}
                </Alert>
              )}

              {viewMode === "preview" ? (
                <Stack spacing={2.5} alignItems="center">
                  <BookFlipViewer
                    title={previewBook.title}
                    authorName={previewBook.author_name}
                    genre={previewBook.genre}
                    pages={previewBook.pages}
                    coverImage={previewBook.cover_image}
                    lang={lang}
                    autoIntro
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={() => downloadPdf(previewBook)}
                    >
                      {lang?.downloadPdf || "Download PDF"}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => downloadTxt(previewBook)}
                    >
                      {lang?.downloadTxt || "Download TXT"}
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Typography variant="caption" color="text.secondary">
                    {lang?.editBookHint ||
                      "Edit any page — preview updates live. Save when you are done."}
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label={lang?.bookTitle || "Book title"}
                        value={draftTitle}
                        onChange={(e) => {
                          setDraftTitle(e.target.value);
                          setSaveMsg("");
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label={lang?.authorName || "Author name"}
                        value={draftAuthor}
                        onChange={(e) => {
                          setDraftAuthor(e.target.value);
                          setSaveMsg("");
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Divider />

                  {draftPages.map((p, idx) => (
                    <Paper
                      key={`page-${p.page}-${idx}`}
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 2 }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="text.secondary"
                        mb={1}
                        display="block"
                      >
                        {lang?.page || "Page"} {p.page}
                      </Typography>
                      <Stack spacing={1.5}>
                        <TextField
                          fullWidth
                          size="small"
                          label={lang?.pageHeading || "Page heading"}
                          value={p.heading}
                          onChange={(e) =>
                            updateDraftPage(idx, "heading", e.target.value)
                          }
                        />
                        <TextField
                          fullWidth
                          multiline
                          minRows={5}
                          label={lang?.pageContent || "Page content"}
                          value={p.content}
                          onChange={(e) =>
                            updateDraftPage(idx, "content", e.target.value)
                          }
                        />
                      </Stack>
                    </Paper>
                  ))}

                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Button
                      variant="outlined"
                      onClick={() => setViewMode("preview")}
                    >
                      {lang?.previewBook || "Preview"}
                    </Button>
                    <Button
                      variant="contained"
                      disabled={saving}
                      startIcon={
                        saving ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <SaveOutlined />
                        )
                      }
                      onClick={handleSaveEdits}
                    >
                      {saving
                        ? lang?.savingBook || "Saving…"
                        : lang?.saveBookEdits || "Save changes"}
                    </Button>
                  </Stack>
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Books;
