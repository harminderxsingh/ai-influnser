import React from "react";
import {
  Box,
  Typography,
  alpha,
  useTheme,
  Grid,
  IconButton,
  Button,
} from "@mui/material";
import {
  ErrorOutlineOutlined,
  HourglassEmptyOutlined,
  PlayArrowOutlined,
  VolumeUpOutlined,
  VolumeOffOutlined,
  PauseOutlined,
  DownloadOutlined,
} from "@mui/icons-material";

const StyledVideoPlayer = ({ videoSrc }) => {
  const theme = useTheme();
  const videoRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "#000000",
        boxShadow: `0 12px 40px ${alpha("#000000", 0.3)}`,
      }}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        style={{
          width: "100%",
          height: "auto",
          maxHeight: "60vh",
          display: "block",
        }}
        onClick={handlePlayPause}
      />

      {/* Play Button Overlay */}
      {!isPlaying && (
        <Box
          onClick={handlePlayPause}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            cursor: "pointer",
          }}
        >
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.secondary.dark} 100%)`,
              borderRadius: "50%",
              width: 70,
              height: 70,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 12px 32px ${alpha(theme.palette.info.main, 0.5)}`,
              border: `3px solid #FFFFFF`,
              transition: "transform 0.3s ease",
              "&:hover": {
                transform: "scale(1.1)",
              },
            }}
          >
            <PlayArrowOutlined
              sx={{
                fontSize: 42,
                color: "#FFFFFF",
                ml: 0.5,
              }}
            />
          </Box>
        </Box>
      )}

      {/* Controls */}
      {isPlaying && (
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            right: 16,
            display: "flex",
            gap: 1,
          }}
        >
          <IconButton
            onClick={handlePlayPause}
            size="small"
            sx={{
              color: "#FFFFFF",
              bgcolor: alpha("#FFFFFF", 0.2),
              backdropFilter: "blur(10px)",
              "&:hover": {
                bgcolor: alpha("#FFFFFF", 0.3),
              },
            }}
          >
            <PauseOutlined />
          </IconButton>
          <IconButton
            onClick={handleMuteToggle}
            size="small"
            sx={{
              color: "#FFFFFF",
              bgcolor: alpha("#FFFFFF", 0.2),
              backdropFilter: "blur(10px)",
              "&:hover": {
                bgcolor: alpha("#FFFFFF", 0.3),
              },
            }}
          >
            {isMuted ? <VolumeOffOutlined /> : <VolumeUpOutlined />}
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

const VideoModalContent = ({ item, lang }) => {
  const theme = useTheme();

  if (!item) return null;

  const modelData = JSON.parse(item.model);
  const refVideo = JSON.parse(item.ref_video);

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isProcessing = item.status === "processing";
  const isError = item.status === "error";

  // ── Download handler ──
  const handleDownload = async () => {
    const url = `/media/${item.generated_video}`;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = item.generated_video; // uses the filename from the server
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Processing State */}
      {isProcessing && (
        <Box
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.warning.main, 0.1),
            border: `2px solid ${alpha(theme.palette.warning.main, 0.3)}`,
            textAlign: "center",
            mb: 3,
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
          <Typography
            variant="h6"
            color="warning.main"
            fontWeight={700}
            gutterBottom
          >
            {lang.processing || "Processing"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {lang.videoBeingGenerated ||
              "Your video is being generated. This may take a few minutes."}
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {isError && (
        <Box
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.error.main, 0.1),
            border: `2px solid ${alpha(theme.palette.error.main, 0.3)}`,
            textAlign: "center",
            mb: 3,
          }}
        >
          <ErrorOutlineOutlined color="error" sx={{ fontSize: 64, mb: 2 }} />
          <Typography
            variant="h6"
            color="error.main"
            fontWeight={700}
            gutterBottom
          >
            {lang.generationFailed || "Generation Failed"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {item.error_message ||
              lang.unknownError ||
              "Unknown error occurred"}
          </Typography>
        </Box>
      )}

      {/* ── Generated Video + Download Button ── */}
      {item.generated_video && (
        <Box sx={{ mb: 3 }}>
          <StyledVideoPlayer videoSrc={`/media/${item.generated_video}`} />

          {/* Download Button */}
          <Button
            onClick={handleDownload}
            variant="contained"
            startIcon={<DownloadOutlined />}
            fullWidth
            sx={{ mt: 2 }}
          >
            {lang.downloadVideo || "Download Video"}
          </Button>
        </Box>
      )}

      {/* Reference Video */}
      {!item.generated_video && refVideo.video && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ mb: 2, fontWeight: 700, color: theme.palette.text.primary }}
          >
            {lang.referenceVideo || "Reference Video"}
          </Typography>
          <StyledVideoPlayer videoSrc={`/media/${refVideo.video}`} />
        </Box>
      )}

      {/* Info Grid — unchanged */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 2,
              borderRadius: 2,
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.05)
                  : alpha("#000000", 0.03),
              border: `1px solid ${
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.1)
                  : alpha("#000000", 0.08)
              }`,
              transition: "all 0.3s ease",
              "&:hover": {
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.08)
                    : alpha("#000000", 0.05),
                transform: "translateY(-2px)",
              },
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: 0.5,
                }}
              >
                {lang.model || "Model"}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, mt: 0.5, fontSize: "0.85rem" }}
              >
                {modelData.name}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 2,
              borderRadius: 2,
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.05)
                  : alpha("#000000", 0.03),
              border: `1px solid ${
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.1)
                  : alpha("#000000", 0.08)
              }`,
              transition: "all 0.3s ease",
              "&:hover": {
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.08)
                    : alpha("#000000", 0.05),
                transform: "translateY(-2px)",
              },
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: 0.5,
                }}
              >
                {lang.category || "Category"}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, mt: 0.5, fontSize: "0.85rem" }}
              >
                {refVideo.category_name}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.1,
              )} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
              border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              },
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 1, color: theme.palette.text.primary }}
            >
              {lang.description || "Description"}
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.7, color: theme.palette.text.secondary }}
            >
              {refVideo.des}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 2,
              borderRadius: 2,
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.05)
                  : alpha("#000000", 0.03),
              border: `1px solid ${
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.1)
                  : alpha("#000000", 0.08)
              }`,
              transition: "all 0.3s ease",
              "&:hover": {
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.08)
                    : alpha("#000000", 0.05),
                transform: "translateY(-2px)",
              },
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: 0.5,
                }}
              >
                {lang.created || "Created"}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, mt: 0.5, fontSize: "0.85rem" }}
              >
                {formatFullDate(item.created_at)}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 2,
              borderRadius: 2,
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.05)
                  : alpha("#000000", 0.03),
              border: `1px solid ${
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.1)
                  : alpha("#000000", 0.08)
              }`,
              transition: "all 0.3s ease",
              "&:hover": {
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.08)
                    : alpha("#000000", 0.05),
                transform: "translateY(-2px)",
              },
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: 0.5,
                }}
              >
                {lang.status || "Status"}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, mt: 0.5, fontSize: "0.85rem" }}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VideoModalContent;
