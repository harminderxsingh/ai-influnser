import React, { useState } from "react";
import {
  Card,
  CardMedia,
  Box,
  Typography,
  Chip,
  IconButton,
  Fade,
  useTheme,
  Grid,
} from "@mui/material";
import {
  DeleteOutlined,
  ErrorOutlineOutlined,
  HourglassEmptyOutlined,
  CalendarTodayOutlined,
  PlayCircleOutlineOutlined,
  VideoLibraryOutlined,
} from "@mui/icons-material";
import CommonDialog from "../../../common/CommonDialog";
import VideoModalContent from "./VideoModalContent";

const VideoCard = ({ item, onDelete, onClick, lang }) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const modelData = JSON.parse(item.model);
  const refVideo = JSON.parse(item.ref_video);

  const getThumbnailUrl = () => {
    if (item.video_thumbnail) {
      return `/media/${item.video_thumbnail}`;
    }
    if (refVideo.video_thumbnail) {
      return `/media/${refVideo.video_thumbnail}`;
    }
    return modelData.photo_url ? `/media/${modelData.photo_url}` : null;
  };

  const thumbnailUrl = getThumbnailUrl();
  const isProcessing = item.status === "processing";
  const isError = item.status === "error";
  const isActive = item.status === "active" && item.generated_video;

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
            {lang.generatingVideo || "Generating video..."}
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

      {/* Active State - Show Thumbnail */}
      {!isProcessing && !isError && thumbnailUrl && (
        <>
          <CardMedia
            component="img"
            height="100%"
            image={thumbnailUrl}
            alt={modelData.name}
            sx={{ objectFit: "cover" }}
          />

          {/* Play Icon Overlay */}
          {isActive && (
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
          )}

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
              sx={{ opacity: 0.9 }}
              noWrap
            >
              {refVideo.category_name}
            </Typography>
            <Typography
              variant="caption"
              color="white"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                opacity: 0.9,
                mt: 0.5,
              }}
            >
              <CalendarTodayOutlined sx={{ fontSize: 12 }} />
              {formatDate(item.created_at)}
            </Typography>
          </Box>

          {/* Status Chip */}
          {isActive && (
            <Chip
              label="Ready"
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

const ListContent = ({ content, lang, hitAxios, getContent }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleDelete(id) {
    if (window.confirm(lang.aus)) {
      const res = await hitAxios({
        path: "/api/content/del_one",
        post: true,
        admin: false,
        obj: { id },
      });
      if (res.data.success) {
        getContent();
      }
    }
  }

  const handleCardClick = (item) => {
    // Now all cards can be opened
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <>
      <Grid container spacing={2}>
        {[...content]?.reverse().map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <VideoCard
              item={item}
              onDelete={handleDelete}
              onClick={() => handleCardClick(item)}
              lang={lang}
            />
          </Grid>
        ))}
      </Grid>

      {/* Video Modal */}
      <CommonDialog
        title={
          selectedItem
            ? JSON.parse(selectedItem.model).name
            : lang.viewVideo || "View Video"
        }
        open={modalOpen}
        onClose={handleCloseModal}
        icon={VideoLibraryOutlined}
        maxWidth="sm"
      >
        {selectedItem && <VideoModalContent item={selectedItem} lang={lang} />}
      </CommonDialog>
    </>
  );
};

export default ListContent;
