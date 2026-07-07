import {
  CalendarTodayOutlined,
  CheckCircleOutlined,
  HourglassEmptyOutlined,
  DeleteOutlined,
  PlayCircleOutlineOutlined,
  ErrorOutlineOutlined,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardMedia,
  Chip,
  useTheme,
  Typography,
  IconButton,
  Fade,
} from "@mui/material";
import React from "react";

const ProductVideoCard = ({ item, onDelete, onClick, lang }) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = React.useState(false);

  const modelData = JSON.parse(item.model || "{}");
  const otherData = JSON.parse(item.other || "{}");

  const getThumbnailUrl = () => {
    if (item.video_thumbnail) return `/media/${item.video_thumbnail}`;
    if (item.ref_photo) return `/media/${item.ref_photo}`;
    return null;
  };

  const thumbnailUrl = getThumbnailUrl();
  const isProcessing = item.status === "processing";
  const isError = item.status === "failed" || item.status === "error";
  const isCompleted =
    (item.status === "completed" || item.status === "active") &&
    item.generated_video;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      sx={{
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.2s",
        border: `1px solid ${theme.palette.divider}`,
        height: 320,
        "&:hover": {
          transform: "translateY(-4px)",
          borderColor: theme.palette.primary.main,
        },
      }}
    >
      {/* ── PROCESSING STATE ── */}
      {isProcessing && (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: theme.palette.background.default,
          }}
        >
          <HourglassEmptyOutlined
            color="warning"
            sx={{
              fontSize: 48,
              mb: 2,
              animation: "pulse 2s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.5 },
              },
            }}
          />
          <Typography variant="subtitle1" color="warning.main" fontWeight={700}>
            {lang.statusProcessing || "Processing"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {lang.generatingVideo || "Generating video..."}
          </Typography>
        </Box>
      )}

      {/* ── ERROR STATE ── */}
      {isError && (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            bgcolor: theme.palette.background.default,
          }}
        >
          <ErrorOutlineOutlined color="error" sx={{ fontSize: 48, mb: 2 }} />
          <Typography
            variant="subtitle1"
            color="error.main"
            fontWeight={700}
            textAlign="center"
          >
            {lang.statusFailed || "Generation Failed"}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            sx={{ mt: 1 }}
          >
            {item.error_message ||
              lang.unknownError ||
              "Unknown error occurred"}
          </Typography>
        </Box>
      )}

      {/* ── COMPLETED WITH THUMBNAIL ── */}
      {!isProcessing && !isError && isCompleted && thumbnailUrl && (
        <>
          <CardMedia
            component="img"
            height="100%"
            image={thumbnailUrl}
            alt={modelData.name}
            sx={{ objectFit: "cover" }}
          />

          {/* Play Icon Overlay */}
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              opacity: isHovered ? 1 : 0.7,
              transition: "opacity 0.3s",
            }}
          >
            <PlayCircleOutlineOutlined
              sx={{
                fontSize: 64,
                color: "white",
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
              }}
            />
          </Box>

          {/* Gradient Overlay */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
              p: 2,
            }}
          >
            <Typography
              variant="subtitle2"
              color="white"
              fontWeight={700}
              noWrap
            >
              {modelData.name || lang.unknownModel || "Unknown Model"}
            </Typography>

            {item.prompt && (
              <Typography
                variant="caption"
                color="white"
                sx={{
                  opacity: 0.9,
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.prompt}
              </Typography>
            )}

            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}
            >
              <Chip
                label={otherData.aspect_ratio || "9:16"}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                  backdropFilter: "blur(10px)",
                }}
              />
              <Typography
                variant="caption"
                color="white"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  opacity: 0.9,
                }}
              >
                <CalendarTodayOutlined sx={{ fontSize: 12 }} />
                {formatDate(item.created_at)}
              </Typography>
            </Box>
          </Box>

          {/* Ready Chip */}
          <Chip
            icon={<CheckCircleOutlined sx={{ fontSize: 16 }} />}
            label={lang.statusCompleted || "Ready"}
            size="small"
            color="success"
            sx={{ position: "absolute", top: 8, left: 8, fontWeight: 600 }}
          />
        </>
      )}

      {/* ── COMPLETED BUT NO THUMBNAIL FALLBACK ── */}
      {!isProcessing && !isError && isCompleted && !thumbnailUrl && (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: theme.palette.background.default,
            p: 2,
          }}
        >
          <PlayCircleOutlineOutlined
            sx={{ fontSize: 56, mb: 2, color: theme.palette.primary.main }}
          />
          <Typography
            variant="subtitle2"
            color="text.primary"
            fontWeight={700}
            textAlign="center"
            noWrap
            sx={{ maxWidth: "100%" }}
          >
            {modelData.name || lang.unknownModel || "Unknown Model"}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
            {lang.statusCompleted || "Ready to play"}
          </Typography>
          <Chip
            icon={<CheckCircleOutlined sx={{ fontSize: 14 }} />}
            label={lang.statusCompleted || "Ready"}
            size="small"
            color="success"
            sx={{ mt: 1.5, fontWeight: 600 }}
          />
        </Box>
      )}

      {/* ── DELETE BUTTON ── */}
      <Fade in={isHovered || isProcessing || isError}>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            bgcolor: "background.paper",
            "&:hover": { bgcolor: "error.main", color: "white" },
          }}
          size="small"
        >
          <DeleteOutlined fontSize="small" />
        </IconButton>
      </Fade>
    </Card>
  );
};

export default ProductVideoCard;
