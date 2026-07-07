import {
  CalendarTodayOutlined,
  DeleteOutlined,
  ErrorOutlineOutlined,
  HourglassEmptyOutlined,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardMedia,
  Chip,
  Fade,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";
import React from "react";

const GalleryCard = ({ item, onDelete, onClick, lang }) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = React.useState(false);

  const modelData = JSON.parse(item.model);

  const getPhotoUrl = () => {
    if (item.generated_photo) {
      return `/media/${item.generated_photo}`;
    }
    return modelData.photo_url ? `/media/${modelData.photo_url}` : null;
  };

  const photoUrl = getPhotoUrl();
  const isProcessing = item.status === "processing" && !item.generated_photo;
  const isError = item.status === "error";
  const hasPhoto = photoUrl !== null;

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
        cursor: hasPhoto && !isProcessing && !isError ? "pointer" : "default",
        transition: "transform 0.2s",
        border: `1px solid ${theme.palette.divider}`,
        height: 320,
        "&:hover": {
          transform:
            hasPhoto && !isProcessing && !isError ? "translateY(-4px)" : "none",
          borderColor:
            hasPhoto && !isProcessing && !isError
              ? theme.palette.primary.main
              : theme.palette.divider,
        },
      }}
    >
      {/* Processing State */}
      {isProcessing && (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
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
            {lang.processing || "Processing"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {lang.pleaseWait || "Please wait..."}
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {isError && (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
          }}
        >
          <ErrorOutlineOutlined
            color="error"
            sx={{
              fontSize: 48,
              mb: 2,
            }}
          />
          <Typography
            variant="subtitle1"
            color="error.main"
            fontWeight={700}
            textAlign="center"
          >
            {lang.generationFailed || "Generation Failed"}
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

      {/* Active State - Show Photo */}
      {!isProcessing && !isError && hasPhoto && (
        <>
          <CardMedia
            component="img"
            height="100%"
            image={photoUrl}
            alt={modelData.name}
            sx={{ objectFit: "cover", objectPosition: "top" }}
          />

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
              {modelData.name}
            </Typography>
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

          {/* Status Chip */}
          {item.status === "active" && (
            <Chip
              label="Active"
              size="small"
              color="success"
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
              }}
            />
          )}
        </>
      )}

      {/* Delete Button - Always visible on all types */}
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

export default GalleryCard;
