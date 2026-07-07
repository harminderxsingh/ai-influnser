import {
  CalendarTodayOutlined,
  ImageOutlined,
  TrendingUpOutlined,
  AccessTimeOutlined,
  ArrowForwardOutlined,
  HomeOutlined,
  DarkModeOutlined,
  LightModeOutlined,
} from "@mui/icons-material";
import {
  Chip,
  Container,
  Stack,
  Typography,
  Box,
  alpha,
  Grid,
  Button,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import moment from "moment";
import React from "react";
import { useCustomTheme } from "../../../utils/useCustomTheme";

const AllBlogs = ({
  blogs,
  theme,
  onSelect,
  lang,
  statusColor,
  readTime,
  thumbUrl,
}) => {
  const muiTheme = useTheme();
  const { toggleColorMode, isDark } = useCustomTheme();
  const [featured, second, ...rest] = blogs;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* ══════════════════════════════════════════
          TOP NAV BAR — Home + Theme toggle
      ══════════════════════════════════════════ */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(12px)",
          bgcolor: alpha(muiTheme.palette.background.default, 0.8),
          borderBottom: `1px solid ${muiTheme.palette.divider}`,
          px: { xs: 2, md: 4 },
          py: 1.2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Home button */}
        <Button
          startIcon={<HomeOutlined />}
          onClick={() => (window.location.href = "/")}
          size="small"
          sx={{
            color: "text.secondary",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: 2,
            px: 1.5,
            "&:hover": {
              bgcolor: "action.hover",
              color: "text.primary",
            },
          }}
        >
          {lang?.backToHome || "Home"}
        </Button>

        {/* Blog brand center */}
        <Typography
          variant="subtitle2"
          fontWeight={800}
          letterSpacing={1}
          textTransform="uppercase"
          color="text.primary"
          sx={{ opacity: 0.6 }}
        >
          {lang?.blogHeading || "Blog"}
        </Typography>

        {/* Theme toggle */}
        <Tooltip
          title={
            isDark
              ? lang?.lightMode || "Light Mode"
              : lang?.darkMode || "Dark Mode"
          }
        >
          <IconButton
            onClick={toggleColorMode}
            size="small"
            sx={{
              color: "text.secondary",
              bgcolor: "action.hover",
              borderRadius: 2,
              "&:hover": {
                bgcolor: "action.selected",
                color: "primary.main",
              },
            }}
          >
            {isDark ? (
              <LightModeOutlined fontSize="small" />
            ) : (
              <DarkModeOutlined fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* ══════════════════════════════════════════
          HERO HEADER
      ══════════════════════════════════════════ */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          py: { xs: 7, md: 11 },
          px: 2,
          textAlign: "center",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 50% 0%, ${alpha(muiTheme.palette.primary.main, 0.14)} 0%, transparent 70%)`,
          },
        }}
      >
        {/* Blob 1 */}
        <Box
          sx={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: alpha(muiTheme.palette.primary.main, 0.07),
            filter: "blur(80px)",
            top: -120,
            left: "10%",
            pointerEvents: "none",
          }}
        />
        {/* Blob 2 */}
        <Box
          sx={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: alpha(muiTheme.palette.primary.light, 0.07),
            filter: "blur(60px)",
            top: -60,
            right: "8%",
            pointerEvents: "none",
          }}
        />

        <Stack alignItems="center" spacing={2} sx={{ position: "relative" }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.8,
              px: 1.8,
              py: 0.6,
              borderRadius: 10,
              border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.3)}`,
              bgcolor: alpha(muiTheme.palette.primary.main, 0.07),
            }}
          >
            <TrendingUpOutlined sx={{ fontSize: 14, color: "primary.main" }} />
            <Typography
              variant="caption"
              fontWeight={700}
              color="primary"
              letterSpacing={1}
              textTransform="uppercase"
            >
              {lang?.latestPosts || "Latest Posts"}
            </Typography>
          </Box>

          <Typography
            variant="h2"
            fontWeight={900}
            sx={{
              fontSize: { xs: "2.2rem", md: "3.4rem" },
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "text.primary",
            }}
          >
            {lang?.blogHeading || "Our Blog"}
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 440, lineHeight: 1.7 }}
          >
            {lang?.blogSubheading ||
              "Thoughts, stories and ideas from our team."}
          </Typography>
        </Stack>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 10 }}>
        {/* ── Empty state ── */}
        {blogs.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 12,
              borderRadius: 4,
              bgcolor: alpha(muiTheme.palette.primary.main, 0.03),
              border: `1px dashed ${alpha(muiTheme.palette.primary.main, 0.2)}`,
            }}
          >
            <ImageOutlined
              sx={{ fontSize: 56, color: "text.disabled", mb: 2 }}
            />
            <Typography variant="h6" fontWeight={700} color="text.secondary">
              {lang?.noPosts || "No posts yet."}
            </Typography>
            <Typography variant="body2" color="text.disabled" mt={0.5}>
              {lang?.checkBackSoon || "Check back soon!"}
            </Typography>
          </Box>
        )}

        {/* ══════════════════════════════════════════
            FEATURED — cinematic full-width card
        ══════════════════════════════════════════ */}
        {featured && (
          <Box
            onClick={() => onSelect(featured.slug)}
            sx={{
              position: "relative",
              borderRadius: 4,
              overflow: "hidden",
              cursor: "pointer",
              mb: 6,
              minHeight: { xs: 340, md: 480 },
              display: "flex",
              alignItems: "flex-end",
              boxShadow: `0 24px 64px ${alpha(muiTheme.palette.common.black, 0.18)}`,
              "&:hover .blog-hero-img": {
                transform: "scale(1.04)",
              },
              "&:hover .blog-hero-btn": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                borderColor: "primary.main",
              },
            }}
          >
            {/* BG image */}
            <Box
              className="blog-hero-img"
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage: thumbUrl(featured.thumbnail)
                  ? `url(${thumbUrl(featured.thumbnail)})`
                  : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
                transition: "transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
              }}
            >
              {!thumbUrl(featured.thumbnail) && (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ImageOutlined
                    sx={{ fontSize: 80, color: "text.disabled" }}
                  />
                </Box>
              )}
            </Box>

            {/* Gradient overlay — uses theme black token */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to top, ${alpha(muiTheme.palette.common.black, 0.88)} 0%, ${alpha(muiTheme.palette.common.black, 0.35)} 50%, transparent 100%)`,
              }}
            />

            {/* Content */}
            <Box
              sx={{ position: "relative", p: { xs: 3, md: 5 }, width: "100%" }}
            >
              <Stack direction="row" spacing={1} mb={2}>
                <Chip
                  label={lang?.featured || "Featured"}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
                <Chip
                  label={featured.status}
                  size="small"
                  color={statusColor(featured.status)}
                  sx={{ fontWeight: 600 }}
                />
              </Stack>

              <Typography
                variant="h4"
                fontWeight={900}
                sx={{
                  color: muiTheme.palette.common.white,
                  maxWidth: 680,
                  lineHeight: 1.25,
                  letterSpacing: "-0.02em",
                  mb: 1.5,
                  fontSize: { xs: "1.5rem", md: "2rem" },
                }}
              >
                {featured.title}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: alpha(muiTheme.palette.common.white, 0.72),
                  maxWidth: 560,
                  mb: 3,
                  lineHeight: 1.7,
                  display: { xs: "none", sm: "-webkit-box" },
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {featured.excerpt || ""}
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Stack direction="row" spacing={2.5}>
                  <Stack direction="row" spacing={0.6} alignItems="center">
                    <CalendarTodayOutlined
                      sx={{
                        fontSize: 13,
                        color: alpha(muiTheme.palette.common.white, 0.6),
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: alpha(muiTheme.palette.common.white, 0.7) }}
                    >
                      {moment(featured.createdAt).format("MMM DD, YYYY")}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.6} alignItems="center">
                    <AccessTimeOutlined
                      sx={{
                        fontSize: 13,
                        color: alpha(muiTheme.palette.common.white, 0.6),
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: alpha(muiTheme.palette.common.white, 0.7) }}
                    >
                      {readTime(featured.content)} {lang?.minRead || "min read"}
                    </Typography>
                  </Stack>
                </Stack>

                <Button
                  className="blog-hero-btn"
                  size="small"
                  endIcon={<ArrowForwardOutlined />}
                  sx={{
                    color: muiTheme.palette.common.white,
                    border: `1px solid ${alpha(muiTheme.palette.common.white, 0.4)}`,
                    borderRadius: 10,
                    px: 2,
                    py: 0.6,
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "none",
                    backdropFilter: "blur(8px)",
                    bgcolor: alpha(muiTheme.palette.common.white, 0.1),
                    transition: "all 0.2s",
                  }}
                >
                  {lang?.readMore || "Read Article"}
                </Button>
              </Stack>
            </Box>
          </Box>
        )}

        {/* ══════════════════════════════════════════
            SECOND POST — horizontal highlight
        ══════════════════════════════════════════ */}
        {second && (
          <Box
            onClick={() => onSelect(second.slug)}
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              borderRadius: 3,
              overflow: "hidden",
              cursor: "pointer",
              mb: 6,
              bgcolor: "background.paper",
              border: `1px solid ${muiTheme.palette.divider}`,
              transition: "all 0.25s",
              "&:hover": {
                border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.4)}`,
                boxShadow: `0 8px 32px ${alpha(muiTheme.palette.primary.main, 0.1)}`,
                "& .second-img": { transform: "scale(1.04)" },
                "& .second-arrow": { transform: "translateX(4px)" },
              },
            }}
          >
            {/* Image */}
            <Box
              sx={{
                width: { xs: "100%", md: "44%" },
                minHeight: { xs: 200, md: 260 },
                overflow: "hidden",
                flexShrink: 0,
                bgcolor: alpha(muiTheme.palette.primary.main, 0.06),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {thumbUrl(second.thumbnail) ? (
                <Box
                  className="second-img"
                  component="img"
                  src={thumbUrl(second.thumbnail)}
                  alt={second.title}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.5s ease",
                  }}
                />
              ) : (
                <ImageOutlined sx={{ fontSize: 52, color: "text.disabled" }} />
              )}
            </Box>

            {/* Content */}
            <Box
              sx={{
                flex: 1,
                p: { xs: 3, md: 4 },
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Stack direction="row" spacing={1} mb={2}>
                <Chip
                  label={second.status}
                  size="small"
                  color={statusColor(second.status)}
                />
              </Stack>

              <Typography
                variant="h5"
                fontWeight={800}
                lineHeight={1.3}
                letterSpacing="-0.02em"
                mb={1.5}
                color="text.primary"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {second.title}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                lineHeight={1.75}
                mb={3}
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {second.excerpt || ""}
              </Typography>

              <Stack direction="row" spacing={2.5} alignItems="center">
                <Stack direction="row" spacing={0.6} alignItems="center">
                  <CalendarTodayOutlined
                    sx={{ fontSize: 13, color: "text.disabled" }}
                  />
                  <Typography variant="caption" color="text.disabled">
                    {moment(second.createdAt).format("MMM DD, YYYY")}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.6} alignItems="center">
                  <AccessTimeOutlined
                    sx={{ fontSize: 13, color: "text.disabled" }}
                  />
                  <Typography variant="caption" color="text.disabled">
                    {readTime(second.content)} {lang?.minRead || "min read"}
                  </Typography>
                </Stack>
                <Box sx={{ flex: 1 }} />
                <ArrowForwardOutlined
                  className="second-arrow"
                  sx={{
                    fontSize: 18,
                    color: "primary.main",
                    transition: "transform 0.2s",
                  }}
                />
              </Stack>
            </Box>
          </Box>
        )}

        {/* ══════════════════════════════════════════
            REST — borderless editorial grid
        ══════════════════════════════════════════ */}
        {rest.length > 0 && (
          <>
            <Typography
              variant="overline"
              fontWeight={700}
              color="text.disabled"
              letterSpacing={2}
              display="block"
              mb={3}
            >
              {lang?.morePosts || "More Posts"}
            </Typography>

            <Grid container spacing={4}>
              {rest.map((blog) => (
                <Grid item xs={12} sm={6} md={4} key={blog.id}>
                  <Box
                    onClick={() => onSelect(blog.slug)}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      cursor: "pointer",
                      borderRadius: 3,
                      overflow: "hidden",
                      transition: "all 0.22s",
                      "&:hover .grid-img": { transform: "scale(1.05)" },
                      "&:hover .grid-title": { color: "primary.main" },
                      "&:hover .grid-arrow": {
                        opacity: 1,
                        transform: "translateX(3px)",
                      },
                    }}
                  >
                    {/* Thumbnail */}
                    <Box
                      sx={{
                        height: 200,
                        borderRadius: 2.5,
                        overflow: "hidden",
                        bgcolor: alpha(muiTheme.palette.primary.main, 0.06),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2,
                        flexShrink: 0,
                      }}
                    >
                      {thumbUrl(blog.thumbnail) ? (
                        <Box
                          className="grid-img"
                          component="img"
                          src={thumbUrl(blog.thumbnail)}
                          alt={blog.title}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.4s ease",
                          }}
                        />
                      ) : (
                        <ImageOutlined
                          sx={{ fontSize: 40, color: "text.disabled" }}
                        />
                      )}
                    </Box>

                    {/* Meta row */}
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mb={1}
                    >
                      <Chip
                        label={blog.status}
                        size="small"
                        color={statusColor(blog.status)}
                        sx={{ height: 20, fontSize: "0.68rem" }}
                      />
                      <Typography variant="caption" color="text.disabled">
                        {moment(blog.createdAt).fromNow()}
                      </Typography>
                    </Stack>

                    {/* Title */}
                    <Typography
                      className="grid-title"
                      variant="subtitle1"
                      fontWeight={700}
                      lineHeight={1.35}
                      letterSpacing="-0.01em"
                      mb={0.8}
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        transition: "color 0.2s",
                        color: "text.primary",
                      }}
                    >
                      {blog.title}
                    </Typography>

                    {/* Excerpt */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      lineHeight={1.65}
                      mb={1.5}
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        flexGrow: 1,
                      }}
                    >
                      {blog.excerpt || ""}
                    </Typography>

                    {/* Footer */}
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Stack direction="row" spacing={0.4} alignItems="center">
                        <AccessTimeOutlined
                          sx={{ fontSize: 12, color: "text.disabled" }}
                        />
                        <Typography variant="caption" color="text.disabled">
                          {readTime(blog.content)} {lang?.minRead || "min read"}
                        </Typography>
                      </Stack>
                      <Box sx={{ flex: 1 }} />
                      <ArrowForwardOutlined
                        className="grid-arrow"
                        sx={{
                          fontSize: 15,
                          color: "primary.main",
                          opacity: 0,
                          transition: "opacity 0.2s, transform 0.2s",
                        }}
                      />
                    </Stack>

                    {/* Bottom divider line */}
                    <Box
                      sx={{
                        mt: 2,
                        height: "1px",
                        bgcolor: "divider",
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
};

export default AllBlogs;
