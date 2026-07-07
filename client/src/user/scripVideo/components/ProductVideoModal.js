import React from "react";
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Stack,
  Divider,
  IconButton,
  Fade,
  alpha,
  useTheme,
} from "@mui/material";
import {
  HourglassEmptyOutlined,
  ErrorOutlineOutlined,
  DownloadOutlined,
  ShoppingBagOutlined,
  PersonOutlined,
  ImageOutlined,
  PlayArrowOutlined,
  PauseOutlined,
  VolumeUpOutlined,
  VolumeOffOutlined,
} from "@mui/icons-material";
import CommonDialog from "../../../common/CommonDialog";

const ProductVideoModal = ({ item, open, onClose, lang }) => {
  const theme = useTheme();
  const modelData = JSON.parse(item?.model || "{}");
  const otherData = JSON.parse(item?.other || "{}");

  const videoRef = React.useRef(null);
  const [videoIsPlaying, setVideoIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoIsPlaying) {
        videoRef.current.pause();
        setVideoIsPlaying(false);
      } else {
        videoRef.current.play();
        setVideoIsPlaying(true);
      }
    }
  };

  const handleMuteToggle = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoIsPlaying) {
        videoRef.current.pause();
        setVideoIsPlaying(false);
      } else {
        videoRef.current.play();
        setVideoIsPlaying(true);
      }
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    if (item?.generated_video) {
      const link = document.createElement("a");
      link.href = `/media/${item.generated_video}`;
      link.download = `product-video-${item.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!item) return null;

  const isProcessing = item.status === "processing";
  const isError = item.status === "failed" || item.status === "error";
  const isCompleted =
    (item.status === "completed" || item.status === "active") &&
    item.generated_video;

  const productPhotoUrl = item.ref_photo ? `/media/${item.ref_photo}` : null;
  const modelPhotoUrl = modelData.photo_url
    ? `/media/${modelData.photo_url}`
    : null;

  const aspectRatio = otherData.aspect_ratio || "9:16";

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={modelData.name || lang?.unknownModel || "Product Video"}
      icon={ShoppingBagOutlined}
      maxWidth="sm"
      fullWidth
    >
      {/* ── TOP META ROW ── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={2}
        sx={{ mb: 2, mt: 2 }}
      >
        <Stack direction="row" spacing={2.5} alignItems="center">
          {modelPhotoUrl && (
            <Stack alignItems="center" spacing={0.5}>
              <Avatar
                src={modelPhotoUrl}
                alt={modelData.name}
                sx={{
                  width: 64,
                  height: 64,
                  border: 2,
                  borderColor: "primary.main",
                }}
              />
              <Stack direction="row" spacing={0.5} alignItems="center">
                <PersonOutlined sx={{ fontSize: 12, color: "text.disabled" }} />
                <Typography variant="caption" color="text.secondary">
                  {modelData.name || lang?.model || "Model"}
                </Typography>
              </Stack>
            </Stack>
          )}
          {productPhotoUrl && (
            <Stack alignItems="center" spacing={0.5}>
              <Avatar
                src={productPhotoUrl}
                alt="Product"
                sx={{
                  width: 64,
                  height: 64,
                  border: 2,
                  borderColor: "secondary.main",
                }}
              />
              <Stack direction="row" spacing={0.5} alignItems="center">
                <ImageOutlined sx={{ fontSize: 12, color: "text.disabled" }} />
                <Typography variant="caption" color="text.secondary">
                  {lang?.product || "Product"}
                </Typography>
              </Stack>
            </Stack>
          )}
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            label={`${lang?.aspectRatio || "Aspect Ratio"}: ${aspectRatio}`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={item.status}
            size="small"
            color={isCompleted ? "success" : isProcessing ? "warning" : "error"}
          />
          <Chip
            label={new Date(item.created_at).toLocaleString()}
            size="small"
            variant="outlined"
          />
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* ── PROCESSING STATE ── */}
      {isProcessing && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 8,
            bgcolor: "background.default",
            borderRadius: 2,
          }}
        >
          <HourglassEmptyOutlined
            color="warning"
            sx={{
              fontSize: 64,
              mb: 2,
              animation: "pulse 2s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.5 },
              },
            }}
          />
          <Typography variant="h6" color="warning.main" fontWeight={700}>
            {lang?.statusProcessing || "Processing"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {lang?.generatingVideo || "Your video is being generated..."}
          </Typography>
        </Box>
      )}

      {/* ── ERROR STATE ── */}
      {isError && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 8,
            bgcolor: "background.default",
            borderRadius: 2,
          }}
        >
          <ErrorOutlineOutlined color="error" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h6" color="error.main" fontWeight={700}>
            {lang?.statusFailed || "Generation Failed"}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ mt: 1, maxWidth: 400 }}
          >
            {item.error_message ||
              lang?.unknownError ||
              "An error occurred during video generation"}
          </Typography>
        </Box>
      )}

      {/* ── COMPLETED: Cinematic Video Player ── */}
      {isCompleted && (
        <Box
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleVideoClick}
          sx={{
            position: "relative",
            borderRadius: 3,
            overflow: "hidden",
            cursor: "pointer",
            height: aspectRatio === "9:16" ? 480 : 360,
            bgcolor:
              theme.palette.mode === "dark" ? theme.palette.grey[900] : "#000",
            boxShadow: `0 16px 48px ${alpha("#000000", 0.4)}`,
          }}
        >
          {/* Video */}
          <video
            ref={videoRef}
            src={`/media/${item.generated_video}`}
            poster={
              item.video_thumbnail
                ? `/media/${item.video_thumbnail}`
                : undefined
            }
            muted={isMuted}
            loop
            playsInline
            onPlay={() => setVideoIsPlaying(true)}
            onPause={() => setVideoIsPlaying(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              transform:
                isHovered && !videoIsPlaying ? "scale(1.03)" : "scale(1)",
            }}
          />

          {/* Gradient overlay */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to bottom,
                ${alpha("#000000", 0.45)} 0%,
                transparent 25%,
                transparent 60%,
                ${alpha("#000000", 0.85)} 100%)`,
              opacity: isHovered || videoIsPlaying ? 1 : 0.6,
              transition: "opacity 0.4s ease",
              zIndex: 1,
            }}
          />

          {/* Play button */}
          <Fade in={!videoIsPlaying}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 2,
                pointerEvents: "none",
              }}
            >
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  borderRadius: "50%",
                  width: 72,
                  height: 72,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 12px 32px ${alpha(theme.palette.info.main, 0.55)}`,
                  border: "3px solid #FFFFFF",
                  backdropFilter: "blur(10px)",
                }}
              >
                <PlayArrowOutlined
                  sx={{ fontSize: 44, color: "#FFFFFF", ml: 0.5 }}
                />
              </Box>
            </Box>
          </Fade>

          {/* Bottom controls bar */}
          <Fade in={videoIsPlaying || isHovered}>
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                p: 2,
                zIndex: 3,
                background: `linear-gradient(to top, ${alpha("#000000", 0.75)} 0%, transparent 100%)`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "#FFFFFF",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    textShadow: `0 2px 8px ${alpha("#000000", 0.7)}`,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    flex: 1,
                    mr: 2,
                  }}
                >
                  {item.prompt || ""}
                </Typography>

                <Stack direction="row" spacing={1}>
                  <IconButton
                    onClick={handlePlayPause}
                    size="small"
                    sx={{
                      color: "#FFFFFF",
                      bgcolor: alpha("#FFFFFF", 0.2),
                      backdropFilter: "blur(10px)",
                      "&:hover": { bgcolor: alpha("#FFFFFF", 0.35) },
                    }}
                  >
                    {videoIsPlaying ? <PauseOutlined /> : <PlayArrowOutlined />}
                  </IconButton>

                  <IconButton
                    onClick={handleMuteToggle}
                    size="small"
                    sx={{
                      color: "#FFFFFF",
                      bgcolor: alpha("#FFFFFF", 0.2),
                      backdropFilter: "blur(10px)",
                      "&:hover": { bgcolor: alpha("#FFFFFF", 0.35) },
                    }}
                  >
                    {isMuted ? <VolumeOffOutlined /> : <VolumeUpOutlined />}
                  </IconButton>

                  <IconButton
                    onClick={handleDownload}
                    size="small"
                    sx={{
                      color: "#FFFFFF",
                      bgcolor: alpha(theme.palette.primary.main, 0.7),
                      backdropFilter: "blur(10px)",
                      "&:hover": { bgcolor: theme.palette.primary.main },
                    }}
                  >
                    <DownloadOutlined />
                  </IconButton>
                </Stack>
              </Stack>
            </Box>
          </Fade>
        </Box>
      )}

      {/* Prompt quote for non-completed states */}
      {!isCompleted && item.prompt && (
        <Box sx={{ mt: 2 }}>
          <Typography
            component="blockquote"
            variant="body2"
            color="text.secondary"
            sx={{
              borderLeft: "3px solid",
              borderColor: "primary.light",
              pl: 1.5,
              m: 0,
              fontStyle: "italic",
            }}
          >
            {item.prompt}
          </Typography>
        </Box>
      )}
    </CommonDialog>
  );
};

export default ProductVideoModal;
