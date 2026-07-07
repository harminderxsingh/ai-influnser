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
  Download,
  PlayCircleOutline,
  ImageOutlined,
  Refresh,
  OpenInNew,
  FavoriteBorder,
  ChatBubbleOutline,
} from "@mui/icons-material";
import { GlobalContext } from "../../../context/GlobalContext";

const igGradient =
  "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)";

const ProfileViewer = ({ accountId, lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);

  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [profile, setProfile] = React.useState(null);
  const [media, setMedia] = React.useState([]);
  const [paging, setPaging] = React.useState(null);
  const [error, setError] = React.useState("");
  const [filter, setFilter] = React.useState("ALL"); // ALL | IMAGE | VIDEO | REEL
  const [downloading, setDownloading] = React.useState(null);
  const [loaded, setLoaded] = React.useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    const res = await hitAxios({
      path: `/api/insta/profile/${accountId}`,
      post: false,
      admin: false,
    });
    if (res?.data?.success) {
      setProfile(res.data.profile);
      setMedia(res.data.media || []);
      setPaging(res.data.paging || null);
      setLoaded(true);
    } else {
      setError(res?.data?.msg || lang?.fetchFailed || "Failed to load profile");
    }
    setLoading(false);
  };

  // Load on mount
  React.useEffect(() => {
    fetchProfile();
  }, [accountId]);

  const loadMore = async () => {
    if (!paging?.cursors?.after) return;
    setLoadingMore(true);
    const res = await hitAxios({
      path: `/api/insta/profile/${accountId}/media?cursor=${paging.cursors.after}`,
      post: false,
      admin: false,
    });
    if (res?.data?.success) {
      setMedia((prev) => [...prev, ...(res.data.media || [])]);
      setPaging(res.data.paging || null);
    }
    setLoadingMore(false);
  };

  const handleDownload = async (item) => {
    const url = item.media_url || item.thumbnail_url;
    if (!url) return;
    setDownloading(item.id);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const ext = item.media_type === "VIDEO" ? "mp4" : "jpg";
      const fileName = `instagram_${item.id}.${ext}`;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // fallback: open in new tab
      window.open(url, "_blank");
    }
    setDownloading(null);
  };

  const filteredMedia = media.filter((m) => {
    if (filter === "ALL") return true;
    if (filter === "REEL") return m.media_type === "VIDEO";
    return m.media_type === filter;
  });

  // ── Loading Skeletons ──
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Profile skeleton */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Skeleton variant="circular" width={72} height={72} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="40%" height={24} />
            <Skeleton width="25%" height={18} sx={{ mt: 0.5 }} />
            <Skeleton width="60%" height={16} sx={{ mt: 0.5 }} />
          </Box>
        </Stack>
        <Grid container spacing={1.5}>
          {Array.from({ length: 9 }).map((_, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Skeleton
                variant="rectangular"
                sx={{ borderRadius: 2, aspectRatio: "1/1" }}
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

  if (!loaded) return null;

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
            background: igGradient,
            flexShrink: 0,
          }}
        >
          <Avatar
            src={profile?.profile_picture_url}
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
              {profile?.name || profile?.username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              @{profile?.username}
            </Typography>
            <Chip
              label={lang?.connected || "Connected"}
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontSize: "0.65rem", height: 20 }}
            />
          </Stack>

          {/* Stats */}
          <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {profile?.media_count ?? "—"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {lang?.posts || "Posts"}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {profile?.followers_count ?? "—"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {lang?.followers || "Followers"}
              </Typography>
            </Box>
          </Stack>

          {/* Bio */}
          {profile?.biography && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, maxWidth: 420 }}
            >
              {profile.biography}
            </Typography>
          )}

          {/* Website */}
          {profile?.website && (
            <Button
              size="small"
              href={profile.website}
              target="_blank"
              endIcon={<OpenInNew sx={{ fontSize: 12 }} />}
              sx={{ textTransform: "none", p: 0, mt: 0.5, fontSize: "0.78rem" }}
            >
              {profile.website}
            </Button>
          )}
        </Box>

        {/* Refresh */}
        <Tooltip title={lang?.refresh || "Refresh"}>
          <IconButton onClick={fetchProfile} size="small">
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* ── Filter Tabs ── */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
        {["ALL", "IMAGE", "VIDEO", "REEL"].map((f) => (
          <Chip
            key={f}
            label={
              f === "ALL"
                ? lang?.filterAll || "All"
                : f === "IMAGE"
                  ? lang?.filterImages || "Images"
                  : f === "VIDEO"
                    ? lang?.filterReels || "Reels / Videos"
                    : lang?.filterReels || "Reels"
            }
            onClick={() => setFilter(f)}
            variant={filter === f ? "filled" : "outlined"}
            color={filter === f ? "primary" : "default"}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        ))}
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ alignSelf: "center", ml: "auto" }}
        >
          {filteredMedia.length} {lang?.items || "items"}
        </Typography>
      </Stack>

      {/* ── Media Grid ── */}
      {filteredMedia.length === 0 ? (
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
            {lang?.noMediaFound || "No media found"}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={1.5}>
          {filteredMedia.map((item) => (
            <Grid item xs={6} sm={4} md={3} key={item.id}>
              <MediaCard
                item={item}
                lang={lang}
                downloading={downloading === item.id}
                onDownload={() => handleDownload(item)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Load More ── */}
      {paging?.cursors?.after && (
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

// ── Individual Media Card ──────────────────────────────────────────────────────
const MediaCard = ({ item, lang, downloading, onDownload }) => {
  const isVideo = item.media_type === "VIDEO";
  const thumb = item.thumbnail_url || item.media_url;

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
        aspectRatio: "1/1",
        bgcolor: "action.hover",
        cursor: "pointer",
        "&:hover .media-overlay": { opacity: 1 },
        "&:hover img": { transform: "scale(1.04)" },
      }}
    >
      {/* Thumbnail */}
      <Box
        component="img"
        src={thumb}
        alt={item.caption || ""}
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

      {/* Video icon badge */}
      {isVideo && (
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
          <PlayCircleOutline sx={{ color: "#fff", fontSize: 13 }} />
          <Typography
            sx={{ color: "#fff", fontSize: "0.6rem", fontWeight: 700 }}
          >
            {lang?.reel || "REEL"}
          </Typography>
        </Box>
      )}

      {/* Hover Overlay */}
      <Box
        className="media-overlay"
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(0,0,0,0.52)",
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
        <Stack direction="row" spacing={1.5} justifyContent="center">
          {item.like_count !== undefined && (
            <Stack direction="row" spacing={0.4} alignItems="center">
              <FavoriteBorder sx={{ color: "#fff", fontSize: 13 }} />
              <Typography sx={{ color: "#fff", fontSize: "0.7rem" }}>
                {item.like_count}
              </Typography>
            </Stack>
          )}
          {item.comments_count !== undefined && (
            <Stack direction="row" spacing={0.4} alignItems="center">
              <ChatBubbleOutline sx={{ color: "#fff", fontSize: 13 }} />
              <Typography sx={{ color: "#fff", fontSize: "0.7rem" }}>
                {item.comments_count}
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* Caption */}
        {item.caption && (
          <Typography
            sx={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "0.65rem",
              textAlign: "center",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              px: 0.5,
            }}
          >
            {item.caption}
          </Typography>
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={0.75}>
          <Tooltip title={lang?.download || "Download"}>
            <IconButton
              size="small"
              onClick={onDownload}
              disabled={downloading}
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                width: 30,
                height: 30,
              }}
            >
              <Download sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title={lang?.openOnInstagram || "Open on Instagram"}>
            <IconButton
              size="small"
              onClick={() => window.open(item.permalink, "_blank")}
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                width: 30,
                height: 30,
              }}
            >
              <OpenInNew sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
};

export default ProfileViewer;
