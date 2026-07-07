import React from "react";
import { GlobalContext } from "../../context/GlobalContext";
import { TranslateContext } from "../../context/TranslateContext";
import { useParams } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Typography,
  Chip,
  Divider,
  Card,
  CardContent,
  Stack,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  CalendarTodayOutlined,
  AccessTimeOutlined,
  ImageOutlined,
  ArrowBackOutlined,
  TrendingUpOutlined,
} from "@mui/icons-material";
import moment from "moment";
import SingleBlog from "./components/SingleBlog";
import AllBlogs from "./components/AllBlogs";
import Header from "../components/Header";

// ─── Read time ────────────────────────────────────────────────────────────────
const readTime = (html = "") => {
  const text = html.replace(/<[^>]+>/g, "");
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

// ─── Safe thumbnail URL ───────────────────────────────────────────────────────
const thumbUrl = (t) => {
  if (!t) return null;
  if (t.startsWith("http") || t.startsWith("/media/")) return t;
  return `/media/${t}`;
};

// ─── Status chip color ────────────────────────────────────────────────────────
const statusColor = (s) =>
  s === "published" ? "success" : s === "archived" ? "default" : "warning";

// ─── Not Found ────────────────────────────────────────────────────────────────
const NotFound = ({ lang }) => (
  <Box
    sx={{
      minHeight: "70vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 1.5,
    }}
  >
    <Typography variant="h2" fontWeight={900} color="text.disabled">
      404
    </Typography>
    <Typography variant="h6" color="text.secondary" fontWeight={600}>
      {lang?.blogNotFound || "Blog post not found."}
    </Typography>
    <Chip
      label={lang?.backToBlogs || "Back to Blogs"}
      onClick={() => (window.location.href = "/blogs")}
      sx={{ cursor: "pointer", mt: 1 }}
    />
  </Box>
);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
const BlogView = () => {
  const { hitAxios } = React.useContext(GlobalContext);
  const { lang } = React.useContext(TranslateContext);
  const { slug } = useParams();
  const theme = useTheme();

  const [blogs, setBlogs] = React.useState([]);
  const [singleBlog, setSingleBlog] = React.useState(null);
  const [notFound, setNotFound] = React.useState(false);

  const handleSelect = (blogSlug) => {
    window.location.href = `/blogs/${blogSlug}`;
  };

  React.useEffect(() => {
    if (slug) fetchSingle(slug);
    else fetchAll();
  }, [slug]);

  async function fetchAll() {
    const res = await hitAxios({
      path: "/api/blogs/get_published",
      post: false,
      admin: false,
    });
    if (res?.data?.success) setBlogs(res.data.data);
  }

  async function fetchSingle(s) {
    const res = await hitAxios({
      path: `/api/blogs/get_by_slug/${s}`,
      post: false,
      admin: false,
    });
    if (res?.data?.success && res.data.data) {
      setSingleBlog(res.data.data);
    } else {
      setNotFound(true);
    }
  }

  if (notFound) return <NotFound lang={lang} />;

  return slug ? (
    singleBlog ? (
      <SingleBlog
        blog={singleBlog}
        theme={theme}
        lang={lang}
        thumbUrl={thumbUrl}
        statusColor={statusColor}
        readTime={readTime}
      />
    ) : null
  ) : (
    <AllBlogs
      blogs={blogs}
      theme={theme}
      onSelect={handleSelect}
      lang={lang}
      thumbUrl={thumbUrl}
      statusColor={statusColor}
      readTime={readTime}
    />
  );
};

export default BlogView;
