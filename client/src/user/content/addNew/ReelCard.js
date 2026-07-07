import React from "react";
import {
  Box,
  Card,
  Typography,
  alpha,
  useTheme,
  Chip,
  Stack,
  IconButton,
  Fade,
} from "@mui/material";
import {
  CheckCircleOutlined,
  PlayArrowOutlined,
  VolumeUpOutlined,
  VolumeOffOutlined,
  PauseOutlined,
} from "@mui/icons-material";

const ReelCard = ({
  video,
  isSelected,
  onSelect,
  onHover,
  isHovered,
  isPlaying,
  onPlayToggle,
}) => {
  const theme = useTheme();
  const videoRef = React.useRef(null);
  const [isMuted, setIsMuted] = React.useState(false);
  const [videoIsPlaying, setVideoIsPlaying] = React.useState(false);

  React.useEffect(() => {
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setVideoIsPlaying(true);
    } else if (!isPlaying && videoRef.current) {
      videoRef.current.pause();
      setVideoIsPlaying(false);
    }
  }, [isPlaying]);

  const handleCardClick = (e) => {
    if (!e.target.closest(".select-button")) {
      onPlayToggle(video);
    }
  };

  const handleSelectClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
  };

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

  return (
    <Card
      onMouseEnter={onHover}
      onMouseLeave={() => onHover(false)}
      onClick={handleCardClick}
      sx={{
        position: "relative",
        borderRadius: 3,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        border: `3px solid ${
          isSelected ? theme.palette.primary.main : "transparent"
        }`,
        boxShadow: isSelected
          ? `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`
          : `0 8px 24px ${alpha(theme.palette.common.black, 0.12)}`,
        bgcolor: theme.palette.background.paper,
        transform: isSelected ? "scale(1.02)" : "scale(1)",
        "&:hover": {
          transform: isSelected ? "scale(1.02)" : "translateY(-8px)",
          boxShadow: `0 16px 48px ${alpha(
            isSelected
              ? theme.palette.primary.main
              : theme.palette.common.black,
            0.25,
          )}`,
          "& .video-element": {
            transform: isPlaying ? "scale(1)" : "scale(1.05)",
          },
          "& .play-button": {
            opacity: 1,
          },
          "& .gradient-overlay": {
            opacity: 1,
          },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          paddingTop: "177.78%",
          overflow: "hidden",
          bgcolor:
            theme.palette.mode === "dark"
              ? theme.palette.grey[900]
              : theme.palette.grey[200],
        }}
      >
        <video
          ref={videoRef}
          className="video-element"
          src={`/media/${video.video}`}
          poster={`/media/${video.video_thumbnail}`}
          muted={isMuted}
          loop
          playsInline
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        <Box
          className="gradient-overlay"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(to bottom, 
              ${alpha("#000000", 0.6)} 0%, 
              transparent 20%, 
              transparent 60%, 
              ${alpha("#000000", 0.8)} 100%)`,
            opacity: isHovered || isSelected || isPlaying ? 1 : 0.7,
            transition: "opacity 0.4s ease",
            zIndex: 1,
          }}
        />

        {/* Category Chip */}
        {video.category_name && (
          <Box
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 3,
            }}
          >
            <Chip
              label={video.category_name}
              size="small"
              sx={{
                bgcolor: alpha(video.category_color || "#2196f3", 0.95),
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "0.65rem",
                height: 24,
                backdropFilter: "blur(10px)",
                boxShadow: `0 4px 12px ${alpha(
                  video.category_color || "#2196f3",
                  0.4,
                )}`,
                border: `1px solid ${alpha("#FFFFFF", 0.2)}`,
              }}
            />
          </Box>
        )}

        <Box
          className="select-button"
          onClick={handleSelectClick}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 3,
            ...(isSelected && {
              animation: "popIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
              "@keyframes popIn": {
                "0%": {
                  transform: "scale(0) rotate(-180deg)",
                  opacity: 0,
                },
                "100%": {
                  transform: "scale(1) rotate(0deg)",
                  opacity: 1,
                },
              },
            }),
          }}
        >
          <Box
            sx={{
              bgcolor: isSelected
                ? alpha(theme.palette.info.main, 0.95)
                : alpha("#FFFFFF", 0.3),
              borderRadius: "50%",
              width: isSelected ? 48 : 40,
              height: isSelected ? 48 : 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isSelected
                ? `0 6px 20px ${alpha(theme.palette.info.main, 0.5)}`
                : `0 4px 12px ${alpha("#000000", 0.3)}`,
              border: `${isSelected ? 3 : 2}px solid #FFFFFF`,
              backdropFilter: "blur(10px)",
              cursor: "pointer",
              transition: "all 0.3s ease",
              "&:hover": {
                bgcolor: isSelected
                  ? alpha(theme.palette.info.main, 0.95)
                  : alpha(theme.palette.info.main, 0.8),
                transform: "scale(1.1)",
              },
            }}
          >
            <CheckCircleOutlined
              sx={{
                fontSize: isSelected ? 28 : 24,
                color: "#FFFFFF",
              }}
            />
          </Box>
        </Box>

        {!videoIsPlaying && (
          <Fade in={!videoIsPlaying}>
            <Box
              className="play-button"
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 2,
                cursor: "pointer",
              }}
            >
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  borderRadius: "50%",
                  width: 70,
                  height: 70,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 12px 32px ${alpha(theme.palette.info.main, 0.5)}`,
                  border: `3px solid #FFFFFF`,
                  backdropFilter: "blur(10px)",
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
          </Fade>
        )}

        {isPlaying && (
          <Fade in={isPlaying}>
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                p: 2,
                zIndex: 3,
                background: `linear-gradient(to top, ${alpha(
                  "#000000",
                  0.7,
                )} 0%, transparent 100%)`,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-end"
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#FFFFFF",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textShadow: `0 2px 8px ${alpha("#000000", 0.6)}`,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {video.des}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
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
                    {videoIsPlaying ? <PauseOutlined /> : <PlayArrowOutlined />}
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
                </Stack>
              </Stack>
            </Box>
          </Fade>
        )}

        {!isPlaying && (
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              zIndex: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "0.9rem",
                textShadow: `0 2px 8px ${alpha("#000000", 0.6)}`,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {video.des}
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default ReelCard;
