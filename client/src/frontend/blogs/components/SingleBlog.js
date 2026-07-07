import {
  AccessTimeOutlined,
  ArrowBackOutlined,
  CalendarTodayOutlined,
  ImageOutlined,
} from "@mui/icons-material";
import {
  alpha,
  Box,
  Chip,
  Container,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import moment from "moment";
import React from "react";

const SingleBlog = ({ blog, theme, lang, thumbUrl, statusColor, readTime }) => {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* ── Hero ── */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: { xs: 260, sm: 380, md: 480 },
          overflow: "hidden",
          bgcolor: alpha(theme.palette.primary.main, 0.08),
        }}
      >
        {thumbUrl(blog.thumbnail) ? (
          <Box
            component="img"
            src={thumbUrl(blog.thumbnail)}
            alt={blog.title}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ImageOutlined sx={{ fontSize: 80, color: "text.disabled" }} />
          </Box>
        )}

        {/* Dark gradient overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.72) 100%)",
          }}
        />

        {/* Back button */}
        <Tooltip title={lang?.backToBlogs || "Back to Blogs"}>
          <IconButton
            onClick={() => (window.location.href = "/blogs")}
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              bgcolor: alpha("#fff", 0.15),
              backdropFilter: "blur(8px)",
              color: "#fff",
              "&:hover": { bgcolor: alpha("#fff", 0.28) },
            }}
          >
            <ArrowBackOutlined />
          </IconButton>
        </Tooltip>

        {/* Hero title overlay */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            px: { xs: 2, md: 6 },
            py: 3,
          }}
        >
          <Container maxWidth="md" disableGutters>
            <Stack direction="row" spacing={1} mb={1.5} flexWrap="wrap">
              <Chip
                label={blog.status}
                size="small"
                color={statusColor(blog.status)}
                sx={{ fontWeight: 700 }}
              />
            </Stack>
            <Typography
              variant="h3"
              fontWeight={800}
              lineHeight={1.25}
              sx={{
                color: "#fff",
                textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                fontSize: { xs: "1.6rem", sm: "2rem", md: "2.4rem" },
              }}
            >
              {blog.title}
            </Typography>
          </Container>
        </Box>
      </Box>

      {/* ── Content ── */}
      <Container maxWidth="md" sx={{ py: 5 }}>
        {/* Meta bar */}
        <Stack
          direction="row"
          spacing={3}
          alignItems="center"
          flexWrap="wrap"
          mb={3}
          pb={3}
          sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          <Stack direction="row" spacing={0.6} alignItems="center">
            <CalendarTodayOutlined
              sx={{ fontSize: 15, color: "text.disabled" }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={500}
            >
              {moment(blog.createdAt).format("MMM DD, YYYY")}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.6} alignItems="center">
            <AccessTimeOutlined sx={{ fontSize: 15, color: "text.disabled" }} />
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={500}
            >
              {readTime(blog.content)} {lang?.minRead || "min read"}
            </Typography>
          </Stack>
        </Stack>

        {/* Excerpt */}
        {blog.excerpt && (
          <Typography
            variant="h6"
            color="text.secondary"
            fontWeight={400}
            mb={4}
            lineHeight={1.7}
            sx={{
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              pl: 2,
              fontStyle: "italic",
            }}
          >
            {blog.excerpt}
          </Typography>
        )}

        {/* HTML Body */}
        <Box
          sx={{
            "& h1,& h2,& h3,& h4,& h5,& h6": {
              fontWeight: 700,
              mt: 4,
              mb: 1.5,
              lineHeight: 1.3,
              color: "text.primary",
            },
            "& h1": { fontSize: "2rem" },
            "& h2": {
              fontSize: "1.55rem",
              borderBottom: `1px solid ${theme.palette.divider}`,
              pb: 1,
            },
            "& h3": { fontSize: "1.25rem" },
            "& p": {
              mb: 2,
              lineHeight: 1.85,
              color: "text.secondary",
              fontSize: "1.02rem",
            },
            "& a": {
              color: "primary.main",
              textDecoration: "underline",
              "&:hover": { opacity: 0.8 },
            },
            "& ul,& ol": {
              pl: 3,
              mb: 2,
              "& li": { mb: 0.6, lineHeight: 1.8, color: "text.secondary" },
            },
            "& blockquote": {
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              pl: 2.5,
              ml: 0,
              my: 3,
              color: "text.secondary",
              fontStyle: "italic",
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              borderRadius: "0 8px 8px 0",
              py: 1,
            },
            "& pre": {
              bgcolor: alpha(theme.palette.common.black, 0.06),
              borderRadius: 2,
              p: 2.5,
              overflowX: "auto",
              my: 2,
              border: `1px solid ${theme.palette.divider}`,
            },
            "& code": {
              fontFamily: "'Fira Code','Courier New',monospace",
              fontSize: "0.875rem",
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              px: 0.8,
              py: 0.2,
              borderRadius: 1,
            },
            "& pre code": {
              bgcolor: "transparent",
              px: 0,
              py: 0,
            },
            "& img": {
              maxWidth: "100%",
              borderRadius: 2,
              my: 2,
              display: "block",
            },
            "& table": {
              width: "100%",
              borderCollapse: "collapse",
              mb: 3,
              "& th,& td": {
                border: `1px solid ${theme.palette.divider}`,
                px: 2,
                py: 1.2,
                textAlign: "left",
                fontSize: "0.9rem",
              },
              "& th": {
                bgcolor: alpha(theme.palette.primary.main, 0.07),
                fontWeight: 700,
              },
              "& tr:nth-of-type(even) td": {
                bgcolor: alpha(theme.palette.divider, 0.2),
              },
            },
            "& hr": {
              border: "none",
              borderTop: `1px solid ${theme.palette.divider}`,
              my: 4,
            },
          }}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Footer */}
        <Divider sx={{ mt: 6, mb: 3 }} />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
          <Typography variant="caption" color="text.disabled">
            {lang?.publishedOn || "Published on"}{" "}
            {moment(blog.createdAt).format("MMMM DD, YYYY")}
          </Typography>
          <Chip
            icon={<ArrowBackOutlined sx={{ fontSize: "14px !important" }} />}
            label={lang?.backToBlogs || "Back to Blogs"}
            size="small"
            onClick={() => (window.location.href = "/blogs")}
            sx={{ cursor: "pointer" }}
          />
        </Stack>
      </Container>
    </Box>
  );
};

export default SingleBlog;
