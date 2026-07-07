import React, { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Card,
  Chip,
  IconButton,
  Fade,
  Stack,
  Button,
  useTheme,
  alpha,
} from "@mui/material";
import {
  DeleteOutlined,
  HourglassEmptyOutlined,
  ErrorOutlineOutlined,
  PlayCircleOutlineOutlined,
  DownloadOutlined,
  CalendarTodayOutlined,
  MicOutlined,
  LanguageOutlined,
} from "@mui/icons-material";
import CommonDialog from "../../../common/CommonDialog";

// ── Format relative time ──────────────────────────────────────
function formatDate(dateString) {
  const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}

// ── Single video card ─────────────────────────────────────────
const TalkingVideoCard = ({ item, onDelete, onClick, lang }) => {
  const theme = useTheme();
  const [hovered, setHovered] = React.useState(false);

  const modelData = (() => {
    try {
      return typeof item.model === "string"
        ? JSON.parse(item.model)
        : item.model || {};
    } catch {
      return {};
    }
  })();

  const isProcessing = item.status === "processing";
  const isError = item.status === "error";
  const isDone = item.status === "active" && item.generated_video;
  const thumbSrc = item.video_thumbnail
    ? `/media/${item.video_thumbnail}`
    : modelData.photo_url
      ? `/media/${modelData.photo_url}`
      : null;

  return (
    <Card
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => isDone && onClick(item)}
      sx={{
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
        height: 320,
        border: `1px solid ${theme.palette.divider}`,
        cursor: isDone ? "pointer" : "default",
        transition: "transform 0.2s",
        "&:hover": {
          transform: isDone ? "translateY(-4px)" : "none",
          borderColor: isDone
            ? theme.palette.primary.main
            : theme.palette.divider,
        },
      }}
    >
      {/* Processing */}
      {isProcessing && (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          {thumbSrc && (
            <Box
              component="img"
              src={thumbSrc}
              alt=""
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
                opacity: 0.25,
              }}
            />
          )}
          <HourglassEmptyOutlined
            color="warning"
            sx={{
              fontSize: 48,
              zIndex: 1,
              animation: "pulse 2s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.4 },
              },
            }}
          />
          <Typography
            variant="subtitle2"
            color="warning.main"
            fontWeight={700}
            zIndex={1}
          >
            {lang?.processing || "Processing"}
          </Typography>
          <Typography variant="caption" color="text.secondary" zIndex={1}>
            {lang?.pleaseWait || "Please wait..."}
          </Typography>
        </Box>
      )}

      {/* Error */}
      {isError && (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            gap: 1,
          }}
        >
          <ErrorOutlineOutlined color="error" sx={{ fontSize: 48 }} />
          <Typography
            variant="subtitle2"
            color="error.main"
            fontWeight={700}
            textAlign="center"
          >
            {lang?.generationFailed || "Generation Failed"}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
          >
            {item.error_message || lang?.unknownError || "Unknown error"}
          </Typography>
        </Box>
      )}

      {/* Done */}
      {isDone && (
        <>
          {thumbSrc ? (
            <Box
              component="img"
              src={thumbSrc}
              alt={modelData.name}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
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
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              }}
            >
              <PlayCircleOutlineOutlined
                sx={{ fontSize: 64, color: "primary.main", opacity: 0.5 }}
              />
            </Box>
          )}

          {/* Play overlay on hover */}
          <Fade in={hovered}>
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(0,0,0,0.4)",
              }}
            >
              <PlayCircleOutlineOutlined
                sx={{ fontSize: 56, color: "white" }}
              />
            </Box>
          </Fade>

          {/* Bottom info */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
              p: 1.5,
            }}
          >
            <Typography
              variant="subtitle2"
              color="white"
              fontWeight={700}
              noWrap
            >
              {modelData.name}
            </Typography>
            <Stack
              direction="row"
              gap={0.5}
              alignItems="center"
              flexWrap="wrap"
            >
              <Chip
                icon={<LanguageOutlined sx={{ fontSize: "10px !important" }} />}
                label={item.lang}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.6rem",
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "white",
                  "& .MuiChip-icon": { color: "white" },
                }}
              />
              <Chip
                icon={<MicOutlined sx={{ fontSize: "10px !important" }} />}
                label={item.voice?.split("-").slice(-1)[0] || item.voice}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.6rem",
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "white",
                  "& .MuiChip-icon": { color: "white" },
                }}
              />
              <Typography
                variant="caption"
                color="white"
                sx={{ opacity: 0.8, fontSize: "0.6rem", ml: "auto" }}
              >
                {formatDate(item.created_at)}
              </Typography>
            </Stack>
          </Box>

          <Chip
            label={lang?.active || "Active"}
            size="small"
            color="success"
            sx={{ position: "absolute", top: 8, left: 8 }}
          />
        </>
      )}

      {/* Delete button */}
      <Fade in={hovered || isProcessing || isError}>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          size="small"
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 3,
            bgcolor: "background.paper",
            "&:hover": { bgcolor: "error.main", color: "white" },
          }}
        >
          <DeleteOutlined fontSize="small" />
        </IconButton>
      </Fade>
    </Card>
  );
};

// ── Video detail modal content ────────────────────────────────
const VideoModalContent = ({ item, lang }) => {
  const theme = useTheme();

  const modelData = (() => {
    try {
      return typeof item.model === "string"
        ? JSON.parse(item.model)
        : item.model || {};
    } catch {
      return {};
    }
  })();

  const videoSrc = `/media/${item.generated_video}`;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = videoSrc;
    a.download = `talking_video_${item.id}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Box sx={{ mt: 1 }}>
      {/* Video player */}
      <Box
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "#000",
          mb: 2,
          boxShadow: `0 8px 32px ${alpha("#000", 0.3)}`,
        }}
      >
        <video
          src={videoSrc}
          controls
          autoPlay
          style={{ width: "100%", maxHeight: "55vh", display: "block" }}
        />
      </Box>

      {/* Meta */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          {
            icon: <LanguageOutlined />,
            label: lang?.language || "Language",
            value: item.lang,
            color: "primary",
          },
          {
            icon: <MicOutlined />,
            label: lang?.voice || "Voice",
            value: item.voice,
            color: "secondary",
          },
          {
            icon: <CalendarTodayOutlined />,
            label: lang?.created || "Created",
            value: new Date(item.created_at).toLocaleDateString(),
            color: "info",
          },
        ].map((meta) => (
          <Grid item xs={12} sm={4} key={meta.label}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  color: `${meta.color}.main`,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {meta.icon}
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  fontWeight={600}
                  sx={{
                    textTransform: "uppercase",
                    fontSize: "0.65rem",
                    letterSpacing: 0.5,
                  }}
                >
                  {meta.label}
                </Typography>
                <Typography variant="caption" fontWeight={700}>
                  {meta.value}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Script */}
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          border: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.15),
          mb: 2,
        }}
      >
        <Typography
          variant="caption"
          fontWeight={700}
          color="primary"
          display="block"
          mb={0.75}
          sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
        >
          {lang?.script || "Script"}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.7 }}
        >
          {item.text}
        </Typography>
      </Box>

      {/* Download */}
      <Button
        fullWidth
        variant="contained"
        size="large"
        startIcon={<DownloadOutlined />}
        onClick={handleDownload}
        sx={{ borderRadius: 2, fontWeight: 700, py: 1.5 }}
      >
        {lang?.downloadVideo || "Download Video"}
      </Button>
    </Box>
  );
};

// ── Main data component ───────────────────────────────────────
const TalkingVideoData = ({ videos, getVideos, hitAxios, lang }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleDelete(id) {
    if (!window.confirm(lang?.aus || "Are you sure?")) return;
    const res = await hitAxios({
      path: "/api/talking/del_one",
      post: true,
      admin: false,
      obj: { id },
    });
    if (res?.data?.success) getVideos();
  }

  function handleCardClick(item) {
    setSelectedItem(item);
    setModalOpen(true);
  }

  return (
    <>
      {videos.length === 0 ? (
        <Box
          sx={{
            py: 10,
            textAlign: "center",
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 3,
            mt: 3,
          }}
        >
          <PlayCircleOutlineOutlined
            sx={{ fontSize: 56, color: "text.disabled", mb: 1 }}
          />
          <Typography variant="body1" color="text.secondary" fontWeight={600}>
            {lang?.noTalkingVideos || "No talking videos yet"}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {lang?.noTalkingVideosHint ||
              "Click Add New to generate your first talking video"}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2} mt={0.5}>
          {videos.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <TalkingVideoCard
                item={item}
                onDelete={handleDelete}
                onClick={handleCardClick}
                lang={lang}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <CommonDialog
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedItem(null);
        }}
        title={
          selectedItem
            ? (() => {
                try {
                  return (
                    (typeof selectedItem.model === "string"
                      ? JSON.parse(selectedItem.model)
                      : selectedItem.model
                    )?.name ||
                    lang?.talkingVideo ||
                    "Talking Video"
                  );
                } catch {
                  return lang?.talkingVideo || "Talking Video";
                }
              })()
            : lang?.talkingVideo || "Talking Video"
        }
        icon={PlayCircleOutlineOutlined}
        maxWidth="sm"
      >
        {selectedItem && <VideoModalContent item={selectedItem} lang={lang} />}
      </CommonDialog>
    </>
  );
};

export default TalkingVideoData;
