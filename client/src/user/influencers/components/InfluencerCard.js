import React, { useState } from "react";
import {
  Card,
  CardMedia,
  Box,
  Typography,
  Chip,
  IconButton,
  Fade,
  Modal,
  Backdrop,
  Skeleton,
  CircularProgress,
  useTheme,
} from "@mui/material";
import {
  DeleteOutlined,
  ZoomInOutlined,
  CloseOutlined,
  AutoAwesome,
} from "@mui/icons-material";

const InfluencerCard = ({ influencer, onDelete, lang }) => {
  const theme = useTheme();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isActive = influencer?.status === "active";
  const isProcessing =
    influencer?.status === "processing" ||
    influencer?.status === "submitting";
  const hasPhoto = !!influencer?.photo_url;
  const canOpenLightbox = isActive && hasPhoto;

  const handleImageClick = () => {
    if (canOpenLightbox) setLightboxOpen(true);
  };

  return (
    <>
      <Card
        sx={{
          position: "relative",
          borderRadius: 2,
          overflow: "hidden",
          border: `1px solid ${theme.palette.divider}`,
          transition: "transform 0.2s",
          height: 320,
          "&:hover": {
            transform: "translateY(-4px)",
            borderColor: theme.palette.primary.main,
          },
        }}
      >
        {/* ── Image / Skeleton ── */}
        {hasPhoto ? (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              position: "relative",
              cursor: canOpenLightbox ? "zoom-in" : "default",
              ...(canOpenLightbox && {
                "&:hover .zoom-hint": { opacity: 1 },
              }),
            }}
            onClick={handleImageClick}
          >
            <CardMedia
              component="img"
              height="100%"
              image={influencer.photo_url}
              alt={influencer.name}
              sx={{
                objectFit: "cover",
                height: "100%",
                width: "100%",
                // 👇 This is the only change — anchors to top so face is always visible
                objectPosition: influencer.photo_focus ?? "center 15%",
              }}
            />

            {/* Zoom hint overlay */}
            {canOpenLightbox && (
              <Box
                className="zoom-hint"
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(0,0,0,0.35)",
                  opacity: 0,
                  transition: "opacity 0.25s ease",
                }}
              >
                <ZoomInOutlined sx={{ color: "white", fontSize: 48 }} />
              </Box>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              position: "relative",
              bgcolor: "grey.900",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              px: 2,
            }}
          >
            {isProcessing ? (
              <>
                <CircularProgress size={36} thickness={4} />
                <AutoAwesome sx={{ color: "warning.main", fontSize: 22 }} />
                <Typography
                  variant="body2"
                  color="warning.main"
                  fontWeight={700}
                  textAlign="center"
                >
                  {lang?.processing || "Processing"}…
                </Typography>
                <Typography
                  variant="caption"
                  color="grey.400"
                  textAlign="center"
                >
                  {lang?.generatingCharacter ||
                    "AI is generating your character"}
                </Typography>
              </>
            ) : (
              <Skeleton
                sx={{ bgcolor: "grey.800", position: "absolute", inset: 0 }}
                variant="rectangular"
                width="100%"
                height="100%"
              />
            )}
          </Box>
        )}

        {/* ── Gradient + Info Overlay ── */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
            p: 2,
            pointerEvents: "none",
          }}
        >
          <Typography variant="h6" color="white" fontWeight={700} noWrap>
            {influencer.name}
          </Typography>
          <Typography
            variant="body2"
            color="white"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              opacity: 0.9,
            }}
          >
            {influencer.description}
          </Typography>
        </Box>

        {/* ── Delete Button ── */}
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onDelete(influencer.id);
          }}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 2,
            "&:hover": { bgcolor: "error.main", color: "white" },
          }}
          size="small"
        >
          <DeleteOutlined fontSize="small" />
        </IconButton>

        {/* ── Status Chip ── */}
        {influencer.status && (
          <Chip
            label={
              isActive
                ? lang?.active || "Active"
                : isProcessing
                  ? lang?.processing || "Processing"
                  : influencer.status
            }
            size="small"
            color={isActive ? "success" : isProcessing ? "warning" : "default"}
            sx={{ position: "absolute", top: 8, left: 8, zIndex: 2 }}
          />
        )}
      </Card>

      {/* ─── Lightbox Modal ───────────────────────────────────── */}
      <Modal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 300,
            sx: { bgcolor: "rgba(0,0,0,0.92)" },
          },
        }}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Fade in={lightboxOpen} timeout={300}>
          <Box
            sx={{
              position: "relative",
              outline: "none",
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: 24,
            }}
          >
            {/* Close Button */}
            <IconButton
              onClick={() => setLightboxOpen(false)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 10,
                bgcolor: "rgba(0,0,0,0.55)",
                color: "white",
                "&:hover": { bgcolor: "error.main" },
              }}
            >
              <CloseOutlined />
            </IconButton>

            {/* Full-size Image — always show full photo in lightbox */}
            <Box
              component="img"
              src={influencer.photo_url}
              alt={influencer.name}
              sx={{
                display: "block",
                maxWidth: "90vw",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: 2,
              }}
            />

            {/* Caption Bar */}
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                px: 2,
                py: 1.5,
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
              }}
            >
              <Typography variant="subtitle1" color="white" fontWeight={700}>
                {influencer.name}
              </Typography>
              {influencer.description && (
                <Typography
                  variant="caption"
                  color="white"
                  sx={{ opacity: 0.85 }}
                >
                  {influencer.description}
                </Typography>
              )}
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

export default InfluencerCard;
