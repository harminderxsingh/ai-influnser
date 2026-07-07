import React from "react";
import {
  Box,
  Typography,
  Avatar,
  Grid,
  Skeleton,
  Chip,
  Stack,
  Button,
  Tooltip,
  IconButton,
  Alert,
  Divider,
} from "@mui/material";
import {
  Refresh,
  OpenInNew,
  FavoriteBorder,
  ChatBubbleOutline,
  Share,
  Visibility,
  PlayCircleOutline,
} from "@mui/icons-material";
import { GlobalContext } from "../../../context/GlobalContext";

const ttGradient =
  "linear-gradient(135deg, #010101 0%, #69C9D0 50%, #EE1D52 100%)";

const TiktokProfileViewer = ({ accountId, lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);

  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [profile, setProfile] = React.useState(null);
  const [videos, setVideos] = React.useState([]);
  const [cursor, setCursor] = React.useState(null);
  const [hasMore, setHasMore] = React.useState(false);
  const [error, setError] = React.useState("");

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    const res = await hitAxios({
      path: `/api/tiktok/profile/${accountId}`,
      post: false,
      admin: false,
    });
    if (res?.data?.success) {
      setProfile(res.data.profile);
      setVideos(res.data.videos || []);
      setCursor(res.data.cursor || null);
      setHasMore(res.data.hasMore || false);
    } else {
      setError(res?.data?.msg || lang?.fetchFailed || "Failed to load profile");
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchProfile();
  }, [accountId]);

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    const res = await hitAxios({
      path: `/api/tiktok/profile/${accountId}/videos`,
      post: true,
      admin: false,
      obj: { cursor },
    });
    if (res?.data?.success) {
      setVideos((prev) => [...prev, ...(res.data.videos || [])]);
      setCursor(res.data.cursor || null);
      setHasMore(res.data.hasMore || false);
    }
    setLoadingMore(false);
  };

  const formatCount = (n) => {
    if (!n && n !== 0) return "—";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
  };

  const formatDuration = (s) => {
    if (!s) return "";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  // ── Loading ──
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Skeleton variant="circular" width={72} height={72} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="40%" height={24} />
            <Skeleton width="25%" height={18} sx={{ mt: 0.5 }} />
            <Skeleton width="60%" height={16} sx={{ mt: 0.5 }} />
          </Box>
        </Stack>
        <Grid container spacing={1.5}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Skeleton
                variant="rectangular"
                sx={{ borderRadius: 2, aspectRatio: "9/16" }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={fetchProfile} startIcon={<Refresh />}>
              {lang?.retry || "Retry"}
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!profile) return null;

  return (
    <Box sx={{ p: 3 }}>
      {/* ── Profile Header ── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2.5}
        alignItems={{ xs: "center", sm: "flex-start" }}
        sx={{ mb: 3 }}
      >
        {/* Avatar */}
        <Box
          sx={{
            p: "3px",
            borderRadius: "50%",
            background: ttGradient,
            flexShrink: 0,
          }}
        >
          <Avatar
            src={profile.avatar_url}
            sx={{
              width: 72,
              height: 72,
              border: "3px solid",
              borderColor: "background.paper",
            }}
          />
        </Box>

        {/* Info */}
        <Box sx={{ flex: 1 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <Typography variant="h6" fontWeight={700}>
              {profile.display_name}
            </Typography>
            {profile.username && (
              <Typography variant="body2" color="text.secondary">
                @{profile.username}
              </Typography>
            )}
            <Chip
              label={lang?.connected || "Connected"}
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontSize: "0.65rem", height: 20 }}
            />
          </Stack>

          {/* Stats */}
          <Stack direction="row" spacing={3} sx={{ mt: 1.5 }} flexWrap="wrap">
            {[
              {
                label: lang?.ttVideos || "Videos",
                value: formatCount(profile.video_count),
              },
              {
                label: lang?.followers || "Followers",
                value: formatCount(profile.follower_count),
              },
              {
                label: lang?.ttFollowing || "Following",
                value: formatCount(profile.following_count),
              },
              {
                label: lang?.ttLikes || "Likes",
                value: formatCount(profile.likes_count),
              },
            ].map((stat) => (
              <Box key={stat.label} sx={{ textAlign: "center" }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Refresh */}
        <Tooltip title={lang?.refresh || "Refresh"}>
          <IconButton onClick={fetchProfile} size="small">
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider sx={{ mb: 2.5 }} />

      {/* ── Video count label ── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
      >
        <Typography
          variant="caption"
          color="text.disabled"
          fontWeight={700}
          sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
        >
          {videos.length} {lang?.ttVideoItems || "videos"}
        </Typography>
      </Stack>

      {/* ── Video Grid ── */}
      {videos.length === 0 ? (
        <Box
          sx={{
            py: 6,
            textAlign: "center",
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Typography color="text.secondary">
            {lang?.ttNoVideos || "No videos found"}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={1.5}>
          {videos.map((video) => (
            <Grid item xs={6} sm={4} md={3} key={video.id}>
              <TiktokVideoCard
                video={video}
                lang={lang}
                formatCount={formatCount}
                formatDuration={formatDuration}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Load More ── */}
      {hasMore && (
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Button
            variant="outlined"
            onClick={loadMore}
            disabled={loadingMore}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {loadingMore
              ? lang?.loading || "Loading…"
              : lang?.loadMore || "Load More"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

// ── Individual Video Card ─────────────────────────────────────────────────────
const TiktokVideoCard = ({ video, lang, formatCount, formatDuration }) => {
  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
        aspectRatio: "9/16",
        bgcolor: "action.hover",
        cursor: "pointer",
        "&:hover .tt-overlay": { opacity: 1 },
        "&:hover img": { transform: "scale(1.04)" },
      }}
    >
      {/* Thumbnail */}
      <Box
        component="img"
        src={video.cover_image_url}
        alt={video.title || ""}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "transform 0.25s ease",
          display: "block",
        }}
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />

      {/* Play badge */}
      <Box
        sx={{
          position: "absolute",
          top: 6,
          left: 6,
          bgcolor: "rgba(0,0,0,0.55)",
          borderRadius: 1,
          px: 0.6,
          py: 0.2,
          display: "flex",
          alignItems: "center",
          gap: 0.4,
        }}
      >
        <PlayCircleOutline sx={{ color: "#fff", fontSize: 12 }} />
        <Typography
          sx={{ color: "#fff", fontSize: "0.58rem", fontWeight: 700 }}
        >
          {lang?.ttVideo || "VIDEO"}
        </Typography>
      </Box>

      {/* Duration badge */}
      {video.duration > 0 && (
        <Box
          sx={{
            position: "absolute",
            bottom: 6,
            right: 6,
            bgcolor: "rgba(0,0,0,0.6)",
            borderRadius: 1,
            px: 0.6,
            py: 0.15,
          }}
        >
          <Typography
            sx={{ color: "#fff", fontSize: "0.6rem", fontWeight: 600 }}
          >
            {formatDuration(video.duration)}
          </Typography>
        </Box>
      )}

      {/* Hover Overlay */}
      <Box
        className="tt-overlay"
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(0,0,0,0.6)",
          opacity: 0,
          transition: "opacity 0.2s",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          p: 1,
        }}
      >
        {/* Stats */}
        <Stack
          direction="row"
          spacing={1.5}
          justifyContent="center"
          flexWrap="wrap"
        >
          <Stack direction="row" spacing={0.3} alignItems="center">
            <Visibility sx={{ color: "#fff", fontSize: 12 }} />
            <Typography sx={{ color: "#fff", fontSize: "0.65rem" }}>
              {formatCount(video.view_count)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.3} alignItems="center">
            <FavoriteBorder sx={{ color: "#EE1D52", fontSize: 12 }} />
            <Typography sx={{ color: "#fff", fontSize: "0.65rem" }}>
              {formatCount(video.like_count)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.3} alignItems="center">
            <ChatBubbleOutline sx={{ color: "#69C9D0", fontSize: 12 }} />
            <Typography sx={{ color: "#fff", fontSize: "0.65rem" }}>
              {formatCount(video.comment_count)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.3} alignItems="center">
            <Share sx={{ color: "#fff", fontSize: 12 }} />
            <Typography sx={{ color: "#fff", fontSize: "0.65rem" }}>
              {formatCount(video.share_count)}
            </Typography>
          </Stack>
        </Stack>

        {/* Title */}
        {(video.title || video.video_description) && (
          <Typography
            sx={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "0.62rem",
              textAlign: "center",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              px: 0.5,
            }}
          >
            {video.title || video.video_description}
          </Typography>
        )}

        {/* Open on TikTok */}
        <Tooltip title={lang?.ttOpenOnTiktok || "Open on TikTok"}>
          <IconButton
            size="small"
            onClick={() => window.open(video.share_url, "_blank")}
            sx={{
              bgcolor: "rgba(255,255,255,0.15)",
              color: "#fff",
              "&:hover": { bgcolor: "rgba(238,29,82,0.5)" },
              width: 30,
              height: 30,
            }}
          >
            <OpenInNew sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default TiktokProfileViewer;
