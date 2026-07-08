import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ArticleIcon from "@mui/icons-material/Article";
import { GlobalContext } from "../../context/GlobalContext";
import { useCustomTheme } from "../../utils/useCustomTheme";
import moment from "moment";

// ─────────────────────────────────────────────
const BlogCard = ({ blog }) => {
  const { config, isDark } = useCustomTheme();

  const bgPaper = isDark
    ? config.background_paper_dark
    : config.background_paper_light;
  const textPrimary = isDark
    ? config.text_primary_dark
    : config.text_primary_light;
  const textSecondary = isDark
    ? config.text_secondary_dark
    : config.text_secondary_light;
  const borderColor = isDark ? config.border_dark : config.border_light;
  const accentColor = isDark
    ? config.text_accent_dark
    : config.text_accent_light;
  const btnBg = isDark
    ? config.button.contained.backgroundColor_dark
    : config.button.contained.backgroundColor_light;
  const btnColor = isDark
    ? config.button.contained.color_dark
    : config.button.contained.color_light;

  const thumbnailUrl = blog.thumbnail ? `/media/${blog.thumbnail}` : null;

  return (
    <Box
      onClick={() => (window.location.href = `/blogs/${blog.slug}`)}
      sx={{
        flexShrink: 0,
        width: { xs: "80vw", sm: 320, md: 340 },
        borderRadius: `${config.card.borderRadius}px`,
        border: `1px solid ${borderColor}`,
        background: bgPaper,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        boxShadow: isDark
          ? "0 8px 32px rgba(0,0,0,0.35)"
          : "0 8px 32px rgba(0,0,0,0.06)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: isDark
            ? "0 24px 60px rgba(0,0,0,0.6)"
            : "0 24px 60px rgba(0,0,0,0.13)",
        },
        "&:hover .blog-arrow": {
          opacity: 1,
          transform: "translateX(4px)",
        },
      }}
    >
      {/* ── Thumbnail ── */}
      <Box
        sx={{
          width: "100%",
          height: 190,
          background: thumbnailUrl
            ? `url(${thumbnailUrl}) center/cover no-repeat`
            : isDark
              ? `${accentColor || btnBg}18`
              : `${accentColor || btnBg}10`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {!thumbnailUrl && (
          <ArticleIcon
            sx={{ fontSize: "3rem", color: accentColor || btnBg, opacity: 0.3 }}
          />
        )}

        {/* Status badge */}
        <Box
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            background:
              blog.status === "published"
                ? "#10B981"
                : isDark
                  ? "#374151"
                  : "#E5E7EB",
            borderRadius: "50px",
            px: 1.2,
            py: 0.3,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: blog.status === "published" ? "#fff" : textSecondary,
              fontFamily: config.font_family,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            {blog.status}
          </Typography>
        </Box>
      </Box>

      {/* ── Body ── */}
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: 1.5,
        }}
      >
        {/* Meta row */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
            <CalendarTodayIcon
              sx={{ fontSize: "0.65rem", color: textSecondary, opacity: 0.6 }}
            />
            <Typography
              sx={{
                fontSize: "0.68rem",
                color: textSecondary,
                fontFamily: config.font_family,
                opacity: 0.6,
              }}
            >
              {moment(blog.createdAt).format("MMM DD, YYYY")}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
            <VisibilityIcon
              sx={{ fontSize: "0.65rem", color: textSecondary, opacity: 0.6 }}
            />
            <Typography
              sx={{
                fontSize: "0.68rem",
                color: textSecondary,
                fontFamily: config.font_family,
                opacity: 0.6,
              }}
            >
              {blog.views} views
            </Typography>
          </Box>
        </Box>

        {/* Title */}
        <Typography
          sx={{
            fontSize: "0.95rem",
            fontWeight: config.font_weight_bold,
            color: textPrimary,
            fontFamily: config.font_family,
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {blog.title}
        </Typography>

        {/* Excerpt */}
        <Typography
          sx={{
            fontSize: "0.8rem",
            color: textSecondary,
            fontFamily: config.font_family,
            lineHeight: 1.7,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            flex: 1,
          }}
        >
          {blog.excerpt}
        </Typography>

        {/* Read more */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mt: 0.5,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.78rem",
              fontWeight: config.font_weight_semibold,
              color: accentColor || btnBg,
              fontFamily: config.font_family,
            }}
          >
            Read more
          </Typography>
          <ArrowForwardIcon
            className="blog-arrow"
            sx={{
              fontSize: "0.78rem",
              color: accentColor || btnBg,
              opacity: 0,
              transition: "opacity 0.25s ease, transform 0.25s ease",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────
const BlogComp = () => {
  const [blogs, setBlogs] = React.useState([]);
  const { hitAxios } = React.useContext(GlobalContext);
  const { config, isDark } = useCustomTheme();
  const sliderRef = React.useRef(null);

  const bgDefault = isDark
    ? config.background_default_dark
    : config.background_default_light;
  const textPrimary = isDark
    ? config.text_primary_dark
    : config.text_primary_light;
  const textSecondary = isDark
    ? config.text_secondary_dark
    : config.text_secondary_light;
  const borderColor = isDark ? config.border_dark : config.border_light;
  const accentColor = isDark
    ? config.text_accent_dark
    : config.text_accent_light;
  const btnBg = isDark
    ? config.button.contained.backgroundColor_dark
    : config.button.contained.backgroundColor_light;
  const btnColor = isDark
    ? config.button.contained.color_dark
    : config.button.contained.color_light;

  async function getBlogs() {
    const res = await hitAxios({
      path: "/api/blogs/get_all",
      post: false,
      admin: false,
      showLoading: false,
    });
    if (res?.data?.success) {
      setBlogs(res.data.data);
    }
  }

  React.useEffect(() => {
    getBlogs();
  }, []);

  const scroll = (dir) => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({
      left: dir === "left" ? -380 : 380,
      behavior: "smooth",
    });
  };

  if (!blogs.length) return null;

  return (
    <Box
      sx={{
        background: bgDefault,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: { xs: 3, md: 8, lg: 12 },
        py: { xs: 8, md: 10 },
        overflow: "hidden",
      }}
    >
      {/* ── Header row ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          width: "100%",
          maxWidth: "1100px",
          mb: 5,
          gap: 2,
        }}
      >
        {/* Left: badge + title */}
        <Box>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              border: `1px solid ${borderColor}`,
              borderRadius: "50px",
              px: 1.5,
              py: 0.5,
              mb: 1.5,
            }}
          >
            <ArticleIcon
              sx={{
                fontSize: "0.75rem",
                color: accentColor || btnBg,
                filter: `drop-shadow(0 0 4px ${accentColor || btnBg})`,
              }}
            />
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: config.font_weight_semibold,
                color: textSecondary,
                fontFamily: config.font_family,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Blog
            </Typography>
          </Box>

          <Typography
            component="h2"
            sx={{
              fontSize: { xs: "1.8rem", md: "2.4rem" },
              fontWeight: config.font_weight_bold,
              color: textPrimary,
              fontFamily: config.font_family,
              lineHeight: 1.15,
              letterSpacing: "-1px",
            }}
          >
            Latest{" "}
            <Box component="span" sx={{ color: accentColor || textSecondary }}>
              articles.
            </Box>
          </Typography>
        </Box>

        {/* Right: nav arrows */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Box
            onClick={() => scroll("left")}
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: `1px solid ${borderColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                background: accentColor || btnBg,
                borderColor: "transparent",
                "& svg": { color: btnColor },
              },
            }}
          >
            <ArrowBackIosNewIcon
              sx={{ fontSize: "0.85rem", color: textSecondary }}
            />
          </Box>
          <Box
            onClick={() => scroll("right")}
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: `1px solid ${borderColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                background: accentColor || btnBg,
                borderColor: "transparent",
                "& svg": { color: btnColor },
              },
            }}
          >
            <ArrowForwardIosIcon
              sx={{ fontSize: "0.85rem", color: textSecondary }}
            />
          </Box>
        </Box>
      </Box>

      {/* ── Horizontal slider ── */}
      <Box
        ref={sliderRef}
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 2.5,
          width: "100%",
          maxWidth: "1100px",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          pb: 2,
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
          "& > *": {
            scrollSnapAlign: "start",
          },
        }}
      >
        {blogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} />
        ))}
      </Box>
    </Box>
  );
};

export default BlogComp;
