import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Button,
  Collapse,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Delete,
  Instagram,
  VideoLibrary,
  Image,
  Schedule,
  Send,
  ExpandMore,
  ExpandLess,
  ErrorOutline,
  CheckCircleOutline,
  HourglassEmpty,
  Refresh,
} from "@mui/icons-material";
import PageHeader from "../../common/PageHeader";
import TikTokIcon from "../../common/TikTokIcon";
import { GlobalContext } from "../../context/GlobalContext";
import moment from "moment-timezone";
import { TranslateContext } from "../../context/TranslateContext";

function PostRow({ post, onDelete, theme, lang }) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    pending: {
      color: "warning",
      icon: HourglassEmpty,
      label: lang?.statusPending || "Pending",
    },
    posted: {
      color: "success",
      icon: CheckCircleOutline,
      label: lang?.statusPosted || "Posted",
    },
    failed: {
      color: "error",
      icon: ErrorOutline,
      label: lang?.statusFailed || "Failed",
    },
  };

  const cfg = statusConfig[post.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          px: 3,
          py: 2,
          cursor: "pointer",
          transition: "background 0.15s",
          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
        }}
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Media icon */}
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 1.5,
            bgcolor: "grey.100",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {post.media_type === "VIDEO" ? (
            <VideoLibrary sx={{ color: "grey.500", fontSize: 22 }} />
          ) : (
            <Image sx={{ color: "grey.500", fontSize: 22 }} />
          )}
        </Box>

        {/* Platform + caption */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={0.8}
            alignItems="center"
            sx={{ mb: 0.3 }}
          >
            {post.platform === "instagram" ? (
              <Instagram sx={{ fontSize: 15, color: "#E1306C" }} />
            ) : (
              <TikTokIcon sx={{ fontSize: 15 }} />
            )}
            <Typography variant="body2" fontWeight={600} noWrap>
              {post.caption || `(${lang?.noCaption || "no caption"})`}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {post.post_now
              ? `${lang?.posted || "Posted"}: ${moment(post.createdAt).fromNow()}`
              : `${lang?.scheduled || "Scheduled"}: ${
                  post.scheduled_at_utc
                    ? moment
                        .utc(post.scheduled_at_utc)
                        .tz(post.timezone || "UTC")
                        .format("MMM D, YYYY h:mm A")
                    : "—"
                }`}
          </Typography>
        </Box>

        {/* Status chip */}
        <Chip
          icon={<StatusIcon style={{ fontSize: 14 }} />}
          label={cfg.label}
          size="small"
          color={cfg.color}
          sx={{ fontWeight: 600 }}
        />

        {/* Delete (pending only) */}
        {post.status === "pending" && (
          <Tooltip title={lang?.cancelScheduledPost || "Cancel scheduled post"}>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(post.id);
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {post.status !== "pending" && (
          <Tooltip title={lang?.cancelScheduledPost || "Delete post"}>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(post.id);
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {expanded ? (
          <ExpandLess fontSize="small" />
        ) : (
          <ExpandMore fontSize="small" />
        )}
      </Stack>

      {/* Expanded details */}
      <Collapse in={expanded}>
        <Box
          sx={{
            mx: 3,
            mb: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(
              post.status === "failed"
                ? theme.palette.error.main
                : post.status === "posted"
                  ? theme.palette.success.main
                  : theme.palette.warning.main,
              0.06,
            ),
            border: "1px solid",
            borderColor:
              post.status === "failed"
                ? "error.light"
                : post.status === "posted"
                  ? "success.light"
                  : "warning.light",
          }}
        >
          <Stack spacing={1.2}>
            {/* Platform */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ width: 110, flexShrink: 0 }}
              >
                {lang?.platform || "Platform"}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                {post.platform === "instagram" ? (
                  <Instagram sx={{ fontSize: 14, color: "#E1306C" }} />
                ) : (
                  <TikTokIcon sx={{ fontSize: 14 }} />
                )}
                <Typography variant="caption" fontWeight={600}>
                  {post.platform}
                </Typography>
              </Stack>
            </Stack>

            {/* Media type */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ width: 110, flexShrink: 0 }}
              >
                {lang?.mediaType || "Media Type"}
              </Typography>
              <Chip
                label={post.media_type}
                size="small"
                color="primary"
                sx={{ fontSize: 11 }}
              />
            </Stack>

            {/* Source */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ width: 110, flexShrink: 0 }}
              >
                {lang?.source || "Source"}
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                {post.source_type?.toUpperCase()} #{post.source_id}
              </Typography>
            </Stack>

            {/* Caption */}
            {post.caption && (
              <Stack direction="row" spacing={1}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ width: 110, flexShrink: 0 }}
                >
                  {lang?.caption || "Caption"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {post.caption}
                </Typography>
              </Stack>
            )}

            {/* Hashtags */}
            {post.hashtags && (
              <Stack direction="row" spacing={1}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ width: 110, flexShrink: 0 }}
                >
                  {lang?.hashtags || "Hashtags"}
                </Typography>
                <Typography
                  variant="caption"
                  color="primary.main"
                  fontWeight={600}
                >
                  {post.hashtags}
                </Typography>
              </Stack>
            )}

            {/* Timing */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ width: 110, flexShrink: 0 }}
              >
                {post.post_now
                  ? lang?.postedAt || "Posted At"
                  : lang?.scheduledAt || "Scheduled At"}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                {post.post_now ? (
                  <Send sx={{ fontSize: 13, color: "success.main" }} />
                ) : (
                  <Schedule sx={{ fontSize: 13, color: "warning.main" }} />
                )}
                <Typography variant="caption" fontWeight={600}>
                  {post.post_now
                    ? moment(post.posted_at || post.createdAt).format(
                        "MMM D, YYYY h:mm A",
                      )
                    : post.scheduled_at_utc
                      ? moment
                          .utc(post.scheduled_at_utc)
                          .tz(post.timezone || "UTC")
                          .format("MMM D, YYYY h:mm A z")
                      : "—"}
                </Typography>
              </Stack>
            </Stack>

            {/* Platform post ID */}
            {post.platform_post_id && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ width: 110, flexShrink: 0 }}
                >
                  {lang?.postId || "Post ID"}
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  sx={{ fontFamily: "monospace" }}
                >
                  {post.platform_post_id}
                </Typography>
              </Stack>
            )}

            {/* Error */}
            {post.status === "failed" && post.error_message && (
              <Box
                sx={{
                  mt: 0.5,
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                  border: "1px solid",
                  borderColor: "error.light",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <ErrorOutline
                    sx={{
                      fontSize: 16,
                      color: "error.main",
                      mt: 0.1,
                      flexShrink: 0,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="error.main"
                      display="block"
                      sx={{ mb: 0.3 }}
                    >
                      {lang?.errorDetails || "Error Details"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="error.dark"
                      sx={{ wordBreak: "break-word" }}
                    >
                      {post.error_message}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}

const SocialPublishHistory = () => {
  const theme = useTheme();
  const { hitAxios } = useContext(GlobalContext);
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { lang } = React.useContext(TranslateContext);

  async function fetchMyPosts() {
    setLoading(true);
    const res = await hitAxios({
      path: "/api/social-publishing/my_posts",
      post: false,
      admin: false,
    });
    if (res?.data?.success) setMyPosts(res.data.posts);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (window.confirm(lang?.aus || "Are you sure?")) {
      await hitAxios({
        path: `/api/social-publishing/delete_post/`,
        post: true,
        admin: false,
        obj: {
          id,
        },
      });
      fetchMyPosts();
    }
  }

  useEffect(() => {
    fetchMyPosts();
  }, []);

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
      <PageHeader
        title={lang?.myPosts || "My Posts"}
        subtitle={
          lang?.myPostsSubtitle ||
          "History of all your published and scheduled posts"
        }
        icon={Schedule}
        primaryAction={
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchMyPosts}
            disabled={loading}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {lang?.refresh || "Refresh"}
          </Button>
        }
      />
      <CardContent sx={{ p: 0 }}>
        {myPosts.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary">
              {lang?.noPostsYet || "No posts yet"}
            </Typography>
          </Box>
        ) : (
          myPosts.map((post, idx) => (
            <Box key={post.id}>
              <PostRow
                post={post}
                onDelete={handleDelete}
                theme={theme}
                lang={lang}
              />
              {idx < myPosts.length - 1 && <Divider />}
            </Box>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default SocialPublishHistory;
