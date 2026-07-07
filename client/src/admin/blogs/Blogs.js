import React from "react";
import {
  Box,
  Button,
  Grid,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
  InputAdornment,
  IconButton,
  Chip,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Tooltip,
  Autocomplete,
} from "@mui/material";
import {
  ContentPaste,
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  ImageOutlined,
  TitleOutlined,
  LinkOutlined,
  CodeOutlined,
  NotesOutlined,
  LabelOutlined,
  ShareOutlined,
  SaveOutlined,
  OpenInNew,
} from "@mui/icons-material";
import { GlobalContext } from "../../context/GlobalContext";
import PageHeader from "../../common/PageHeader";
import CommonDialog from "../../common/CommonDialog";
import moment from "moment";

// ─── SectionCard (same as your EmailSettings) ────────────────────────────────
const SectionCard = ({ icon: Icon, title, children }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.4,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: alpha(theme.palette.primary.main, 0.06),
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {Icon && <Icon fontSize="small" sx={{ color: "primary.main" }} />}
        <Typography
          variant="caption"
          fontWeight={700}
          letterSpacing={1}
          textTransform="uppercase"
          color="primary"
        >
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Box>
  );
};

// ─── Status options ───────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

const initForm = {
  title: "",
  slug: "",
  thumbnail: "",
  content: "",
  excerpt: "",
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  og_image: "",
  status: "draft",
};

const Blogs = ({ lang }) => {
  const theme = useTheme();
  const { hitAxios } = React.useContext(GlobalContext);

  const [blogs, setBlogs] = React.useState([]);
  const [form, setForm] = React.useState(initForm);
  const [thumbnailFile, setThumbnailFile] = React.useState(null);
  const [thumbnailPreview, setThumbnailPreview] = React.useState("");
  const [state, setState] = React.useState({
    dialog: false,
    editMode: false,
    deleteDialog: false,
    selectedBlog: null,
  });

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // ─── Slug auto-generate ───────────────────────────────────────────────────
  const handleTitleChange = (value) => {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    setForm((prev) => ({ ...prev, title: value, slug }));
  };

  // ─── Thumbnail picker ─────────────────────────────────────────────────────
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const resetDialog = () => {
    setForm(initForm);
    setThumbnailFile(null);
    setThumbnailPreview("");
    setState((prev) => ({
      ...prev,
      dialog: false,
      editMode: false,
      selectedBlog: null,
    }));
  };

  // ─── GET all ──────────────────────────────────────────────────────────────
  async function getBlogs() {
    const res = await hitAxios({
      path: "/api/blogs/get_all",
      post: false,
      admin: true,
    });
    if (res.data.success) setBlogs(res.data.data);
  }

  // ─── POST add ─────────────────────────────────────────────────────────────
  async function handleSave() {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (thumbnailFile) fd.append("thumbnail", thumbnailFile);

    const res = await hitAxios({
      path: "/api/blogs/add_new",
      post: true,
      admin: true,
      obj: fd,
    });
    if (res.data.success) {
      resetDialog();
      getBlogs();
    }
  }

  // ─── POST update ──────────────────────────────────────────────────────────
  async function handleUpdate() {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (thumbnailFile) fd.append("thumbnail", thumbnailFile);

    const res = await hitAxios({
      path: "/api/blogs/update",
      post: true,
      admin: true,
      obj: fd,
    });
    if (res.data.success) {
      resetDialog();
      getBlogs();
    }
  }

  // ─── POST delete ──────────────────────────────────────────────────────────
  async function handleDelete() {
    const res = await hitAxios({
      path: "/api/blogs/delete",
      post: true,
      admin: true,
      obj: { id: state.selectedBlog?.id },
    });
    if (res.data.success) {
      setState((prev) => ({
        ...prev,
        deleteDialog: false,
        selectedBlog: null,
      }));
      getBlogs();
    }
  }

  // ─── Open edit ────────────────────────────────────────────────────────────
  const openEdit = (blog) => {
    setForm({
      id: blog.id,
      title: blog.title || "",
      slug: blog.slug || "",
      thumbnail: blog.thumbnail || "",
      content: blog.content || "",
      excerpt: blog.excerpt || "",
      meta_title: blog.meta_title || "",
      meta_description: blog.meta_description || "",
      meta_keywords: blog.meta_keywords || "",
      og_image: blog.og_image || "",
      status: blog.status || "draft",
    });
    setThumbnailPreview(blog.thumbnail || "");
    setThumbnailFile(null);
    setState((prev) => ({
      ...prev,
      dialog: true,
      editMode: true,
      selectedBlog: blog,
    }));
  };

  React.useEffect(() => {
    getBlogs();
  }, []);

  const statusColor = (s) =>
    s === "published" ? "success" : s === "archived" ? "default" : "warning";

  return (
    <Box>
      {/* ── Page Header ── */}
      <PageHeader
        title={lang?.blogs || "Blogs"}
        subtitle={lang?.blogsSub || "Manage blogs for your website"}
        icon={ContentPaste}
        primaryAction={
          <Button
            size="large"
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() =>
              setState((prev) => ({ ...prev, dialog: true, editMode: false }))
            }
          >
            {lang?.addNew || "Add New"}
          </Button>
        }
      />

      {/* ── Blog Cards ── */}
      <Grid container spacing={3} mt={0.5}>
        {blogs.length === 0 && (
          <Grid item xs={12}>
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                border: `1px dashed ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <ContentPaste
                sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
              />
              <Typography color="text.secondary">
                {lang?.noBlogsYet || "No blogs yet. Create your first one!"}
              </Typography>
            </Box>
          </Grid>
        )}

        {blogs.map((blog) => (
          <Grid item xs={12} sm={6} md={4} key={blog.id}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              {/* Thumbnail */}
              {blog.thumbnail ? (
                <CardMedia
                  component="img"
                  height="160"
                  image={`/media/${blog.thumbnail}`}
                  alt={blog.title}
                  sx={{ objectFit: "cover" }}
                />
              ) : (
                <Box
                  sx={{
                    height: 160,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <ImageOutlined
                    sx={{ fontSize: 40, color: "text.disabled" }}
                  />
                </Box>
              )}

              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Chip
                    label={blog.status}
                    size="small"
                    color={statusColor(blog.status)}
                  />
                  <Typography variant="caption" color="text.disabled">
                    {moment(blog.createdAt).fromNow()}
                  </Typography>
                </Box>

                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  noWrap
                  gutterBottom
                >
                  {blog.title || lang?.untitled || "Untitled"}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    minHeight: 40,
                  }}
                >
                  {blog.excerpt || lang?.noExcerpt || "No excerpt provided."}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.disabled"
                  mt={1}
                  display="block"
                  noWrap
                >
                  /{blog.slug}
                </Typography>
              </CardContent>

              <CardActions
                sx={{
                  justifyContent: "flex-end",
                  px: 2,
                  pb: 1.5,
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => window.open(`/blogs/${blog?.slug}`, "_blank")}
                >
                  <OpenInNew fontSize="small" />
                </IconButton>
                <Tooltip title={lang?.edit || "Edit"}>
                  <IconButton size="small" onClick={() => openEdit(blog)}>
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={lang?.delete || "Delete"}>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        deleteDialog: true,
                        selectedBlog: blog,
                      }))
                    }
                  >
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Add / Edit Dialog ── */}
      <CommonDialog
        open={state.dialog}
        onClose={resetDialog}
        title={
          state.editMode
            ? lang?.editBlog || "Edit Blog"
            : lang?.addNewBlog || "Add New Blog"
        }
        icon={state.editMode ? EditOutlined : AddOutlined}
        maxWidth="lg"
        fullWidth
      >
        <Grid sx={{ mt: 1 }} container spacing={3}>
          {/* ── LEFT ── */}
          <Grid item xs={12} lg={7}>
            <Stack spacing={3}>
              {/* Basic Info */}
              <SectionCard
                icon={TitleOutlined}
                title={lang?.basicInfo || "Basic Info"}
              >
                <Grid container spacing={2}>
                  {/* Thumbnail upload */}
                  <Grid item xs={12}>
                    <Box
                      onClick={() =>
                        document.getElementById("blog-thumb").click()
                      }
                      sx={{
                        border: `2px dashed ${theme.palette.divider}`,
                        borderRadius: 2,
                        minHeight: 130,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        overflow: "hidden",
                        transition: "border-color 0.2s",
                        "&:hover": { borderColor: "primary.main" },
                      }}
                    >
                      {thumbnailPreview ? (
                        <img
                          src={`/media/${thumbnailPreview}`}
                          alt="preview"
                          style={{
                            width: "100%",
                            maxHeight: 180,
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Stack alignItems="center" spacing={0.5}>
                          <ImageOutlined
                            sx={{ fontSize: 36, color: "text.disabled" }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {lang?.clickToUpload || "Click to upload thumbnail"}
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                    <input
                      id="blog-thumb"
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleThumbnailChange}
                    />
                  </Grid>

                  {/* Title */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label={lang?.blogTitle || "Title"}
                      value={form.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TitleOutlined
                              fontSize="small"
                              sx={{ color: "text.disabled" }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* Slug */}
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      size="small"
                      label={lang?.slug || "Slug"}
                      value={form.slug}
                      onChange={(e) => set("slug", e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LinkOutlined
                              fontSize="small"
                              sx={{ color: "text.disabled" }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* Status — Autocomplete */}
                  <Grid item xs={12} sm={4}>
                    <Autocomplete
                      size="small"
                      options={STATUS_OPTIONS}
                      getOptionLabel={(o) => o.label}
                      value={
                        STATUS_OPTIONS.find((o) => o.value === form.status) ||
                        null
                      }
                      onChange={(_, newVal) =>
                        set("status", newVal?.value || "draft")
                      }
                      disableClearable
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={lang?.status || "Status"}
                        />
                      )}
                    />
                  </Grid>

                  {/* Excerpt */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      label={lang?.excerpt || "Excerpt"}
                      value={form.excerpt}
                      onChange={(e) => set("excerpt", e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment
                            position="start"
                            sx={{ alignSelf: "flex-start", mt: 1 }}
                          >
                            <NotesOutlined
                              fontSize="small"
                              sx={{ color: "text.disabled" }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </SectionCard>

              {/* HTML Content */}
              <SectionCard
                icon={CodeOutlined}
                title={lang?.htmlContent || "HTML Content"}
              >
                <TextField
                  fullWidth
                  multiline
                  rows={16}
                  size="small"
                  label={lang?.htmlContent || "HTML Content"}
                  value={form.content}
                  onChange={(e) => set("content", e.target.value)}
                  placeholder="<h1>Your blog content here...</h1>"
                  inputProps={{
                    style: {
                      fontFamily: "'Fira Code', 'Courier New', monospace",
                      fontSize: 13,
                      lineHeight: 1.6,
                    },
                    spellCheck: false,
                    autoCorrect: "off",
                    autoCapitalize: "off",
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: alpha(theme.palette.common.black, 0.02),
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.disabled"
                  mt={0.5}
                  display="block"
                >
                  {lang?.htmlHint ||
                    "Raw HTML is supported. Use proper tags for formatting."}
                </Typography>
              </SectionCard>
            </Stack>
          </Grid>

          {/* ── RIGHT ── */}
          <Grid item xs={12} lg={5}>
            <Stack spacing={3}>
              {/* SEO / Meta */}
              <SectionCard
                icon={LabelOutlined}
                title={lang?.seoMeta || "SEO & Meta Tags"}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label={lang?.metaTitle || "Meta Title"}
                      value={form.meta_title}
                      onChange={(e) => set("meta_title", e.target.value)}
                      helperText={`${form.meta_title.length}/60 ${lang?.chars || "chars"}`}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TitleOutlined
                              fontSize="small"
                              sx={{ color: "text.disabled" }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      label={lang?.metaDescription || "Meta Description"}
                      value={form.meta_description}
                      onChange={(e) => set("meta_description", e.target.value)}
                      helperText={`${form.meta_description.length}/160 ${lang?.chars || "chars"}`}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label={lang?.metaKeywords || "Meta Keywords"}
                      placeholder="keyword1, keyword2, keyword3"
                      value={form.meta_keywords}
                      onChange={(e) => set("meta_keywords", e.target.value)}
                      helperText={lang?.keywordsHint || "Comma separated"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LabelOutlined
                              fontSize="small"
                              sx={{ color: "text.disabled" }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </SectionCard>

              {/* Social / OG */}
              <SectionCard
                icon={ShareOutlined}
                title={lang?.socialSharing || "Social Sharing"}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label={lang?.ogImage || "OG Image URL"}
                      placeholder="https://yourdomain.com/image.jpg"
                      value={form.og_image}
                      onChange={(e) => set("og_image", e.target.value)}
                      helperText={
                        lang?.ogImageHint ||
                        "Recommended: 1200×630px for social previews"
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ShareOutlined
                              fontSize="small"
                              sx={{ color: "text.disabled" }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* OG Preview box */}
                  {form.og_image && (
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1.5,
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={form.og_image}
                          alt="og preview"
                          style={{
                            width: "100%",
                            maxHeight: 120,
                            objectFit: "cover",
                          }}
                          onError={(e) => (e.target.style.display = "none")}
                        />
                        <Box
                          sx={{
                            px: 1.5,
                            py: 1,
                            bgcolor: alpha(theme.palette.divider, 0.3),
                          }}
                        >
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            noWrap
                            display="block"
                          >
                            {form.meta_title ||
                              form.title ||
                              lang?.blogTitle ||
                              "Title"}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            display="block"
                          >
                            {form.meta_description ||
                              form.excerpt ||
                              lang?.noDescription ||
                              "No description"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </SectionCard>

              {/* Save button inside dialog */}
              <Button
                fullWidth
                size="large"
                variant="contained"
                startIcon={<SaveOutlined />}
                onClick={state.editMode ? handleUpdate : handleSave}
              >
                {state.editMode
                  ? lang?.updateBlog || "Update Blog"
                  : lang?.saveBlog || "Save Blog"}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </CommonDialog>

      {/* ── Delete Confirm Dialog ── */}
      <CommonDialog
        open={state.deleteDialog}
        onClose={() =>
          setState((prev) => ({
            ...prev,
            deleteDialog: false,
            selectedBlog: null,
          }))
        }
        title={lang?.deleteBlog || "Delete Blog"}
        icon={DeleteOutlined}
        maxWidth="xs"
        fullWidth
      >
        <Stack sx={{ mt: 2 }} spacing={3}>
          <Typography variant="body2" color="text.secondary">
            {lang?.deleteBlogConfirm || `Are you sure you want to delete`}{" "}
            <strong>{state.selectedBlog?.title}</strong>?{" "}
            {lang?.cannotUndo || "This cannot be undone."}
          </Typography>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  deleteDialog: false,
                  selectedBlog: null,
                }))
              }
            >
              {lang?.cancel || "Cancel"}
            </Button>
            <Button variant="contained" color="error" onClick={handleDelete}>
              {lang?.delete || "Delete"}
            </Button>
          </Stack>
        </Stack>
      </CommonDialog>
    </Box>
  );
};

export default Blogs;
