import {
  AddOutlined,
  SlowMotionVideo,
  CheckCircleOutlined,
  PersonOutlined,
  ArrowForwardOutlined,
  ArrowBackOutlined,
  Search,
  ExpandMore,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Grid,
  Typography,
  alpha,
  useTheme,
  Avatar,
  Stack,
  Stepper,
  Step,
  StepLabel,
  TextField,
  InputAdornment,
  LinearProgress,
} from "@mui/material";
import React from "react";
import CommonDialog from "../../../common/CommonDialog";
import ReelCard from "./ReelCard";
import InfluencerCard from "./InfluencerCard";

const AddNew = ({ lang = {}, inf = [], hitAxios, getContent }) => {
  const [state, setState] = React.useState({
    dialog: false,
    step: 0,
    selectedVideo: null,
    selectedInfluencer: null,
    hoveredId: null,
    playingVideoId: null,
    searchQuery: "",
    videos: [],
    loading: false,
    loadingMore: false,
    pagination: {
      page: 1,
      limit: 12,
      hasMore: false,
      total: 0,
    },
  });

  const theme = useTheme();

  const steps = [
    lang.selectVideo || "Select Video",
    lang.selectInfluencer || "Select Influencer",
  ];

  // Fetch videos
  async function handleGetVideos(page = 1, search = "", loadMore = false) {
    if (loadMore) {
      setState((prev) => ({ ...prev, loadingMore: true }));
    } else {
      setState((prev) => ({ ...prev, loading: true }));
    }

    try {
      const res = await hitAxios({
        path: `/api/user/get_t_video?page=${page}&limit=12&search=${search}`,
        post: false,
        admin: false,
        showLoading: false,
      });

      if (res.data.success) {
        setState((prev) => ({
          ...prev,
          videos: loadMore ? [...prev.videos, ...res.data.data] : res.data.data,
          pagination: {
            page: res.data.pagination.page,
            limit: res.data.pagination.limit,
            hasMore: res.data.pagination.hasMore,
            total: res.data.pagination.total,
          },
          loading: false,
          loadingMore: false,
        }));
      }
    } catch (error) {
      console.error(error);
      setState((prev) => ({ ...prev, loading: false, loadingMore: false }));
    }
  }

  // Load videos when dialog opens
  React.useEffect(() => {
    if (state.dialog && state.step === 0 && state.videos.length === 0) {
      handleGetVideos(1, "");
    }
  }, [state.dialog, state.step]);

  // Handle search with debounce
  React.useEffect(() => {
    if (state.dialog && state.step === 0) {
      const timer = setTimeout(() => {
        handleGetVideos(1, state.searchQuery);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [state.searchQuery]);

  const handleSelectVideo = (video) => {
    setState({
      ...state,
      selectedVideo: state.selectedVideo?.id === video.id ? null : video,
    });
  };

  const handleSelectInfluencer = (influencer) => {
    setState({
      ...state,
      selectedInfluencer:
        state.selectedInfluencer?.id === influencer.id ? null : influencer,
    });
  };

  const handlePlayToggle = (video) => {
    setState({
      ...state,
      playingVideoId: state.playingVideoId === video.id ? null : video.id,
    });
  };

  const handleLoadMore = () => {
    handleGetVideos(state.pagination.page + 1, state.searchQuery, true);
  };

  const handleNext = () => {
    if (state.step === 0 && state.selectedVideo) {
      setState({ ...state, step: 1, playingVideoId: null });
    }
  };

  const handleBack = () => {
    setState({ ...state, step: 0 });
  };

  async function handleConfirm(params) {
    const res = await hitAxios({
      path: "/api/content/add_new",
      post: true,
      admin: false,
      obj: {
        model: state.selectedInfluencer,
        ref_video: state.selectedVideo,
      },
    });
    if (res.data.success) {
      await getContent();
      handleClose();
    }
  }

  const handleClose = () => {
    setState({
      dialog: false,
      step: 0,
      selectedVideo: null,
      selectedInfluencer: null,
      hoveredId: null,
      playingVideoId: null,
      searchQuery: "",
      videos: [],
      loading: false,
      loadingMore: false,
      pagination: {
        page: 1,
        limit: 12,
        hasMore: false,
        total: 0,
      },
    });
  };

  return (
    <div>
      <Button
        size="large"
        onClick={() => setState({ ...state, dialog: true })}
        startIcon={<AddOutlined />}
        variant="contained"
      >
        {lang.addNew || "Add New"}
      </Button>

      <CommonDialog
        title={
          state.step === 0
            ? lang.selectSampleVideo || "Select Sample Reel"
            : lang.selectInfluencer || "Select Influencer"
        }
        open={state.dialog}
        onClose={handleClose}
        icon={state.step === 0 ? SlowMotionVideo : PersonOutlined}
      >
        <Box sx={{ mt: 2 }}>
          {/* Stepper */}
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={state.step}>
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    sx={{
                      "& .MuiStepLabel-label": {
                        fontWeight: state.step === index ? 700 : 500,
                        fontSize: "0.9rem",
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Step 0: Select Video */}
          {state.step === 0 && (
            <>
              {/* Info Banner */}
              <Box
                sx={{
                  mb: 3,
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
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                      color: theme.palette.primary.main,
                      width: 48,
                      height: 48,
                    }}
                  >
                    <SlowMotionVideo />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        mb: 0.5,
                      }}
                    >
                      {lang.chooseYourReel || "Choose Your Perfect Reel"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.5,
                        fontSize: "0.85rem",
                      }}
                    >
                      {lang.selectVideoDescription ||
                        "Click to play • Click checkbox to select • Only one can play at a time"}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Search Bar */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={lang.searchVideos || "Search videos..."}
                  value={state.searchQuery}
                  onChange={(e) =>
                    setState({ ...state, searchQuery: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>

              {/* Total Count */}
              {state.pagination.total > 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {lang.showing || "Showing"} {state.videos.length}{" "}
                  {lang.of || "of"} {state.pagination.total}{" "}
                  {lang.videos || "videos"}
                </Typography>
              )}

              {/* Loading Progress */}
              {state.loading && (
                <Box sx={{ width: "100%", mb: 3 }}>
                  <LinearProgress />
                </Box>
              )}

              {/* Video Grid */}
              {!state.loading && state.videos.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 8,
                    color: "text.secondary",
                  }}
                >
                  <Typography variant="h6">
                    {state.searchQuery
                      ? lang.noVideosFound || "No videos found"
                      : lang.noVideos || "No videos yet"}
                  </Typography>
                </Box>
              ) : (
                <>
                  <Grid container spacing={2.5}>
                    {state.videos.map((video) => (
                      <Grid item xs={6} sm={4} md={4} key={video.id}>
                        <ReelCard
                          video={video}
                          isSelected={state.selectedVideo?.id === video.id}
                          onSelect={() => handleSelectVideo(video)}
                          onPlayToggle={handlePlayToggle}
                          isPlaying={state.playingVideoId === video.id}
                          onHover={(hovered) =>
                            setState({
                              ...state,
                              hoveredId: hovered ? video.id : null,
                            })
                          }
                          isHovered={state.hoveredId === video.id}
                        />
                      </Grid>
                    ))}
                  </Grid>

                  {/* Load More Button */}
                  {state.pagination.hasMore && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        mt: 3,
                        gap: 2,
                      }}
                    >
                      {state.loadingMore && (
                        <Box sx={{ width: "100%", maxWidth: 400 }}>
                          <LinearProgress />
                        </Box>
                      )}
                      <Button
                        variant="outlined"
                        size="medium"
                        onClick={handleLoadMore}
                        disabled={state.loadingMore}
                        endIcon={<ExpandMore />}
                        sx={{
                          px: 3,
                          py: 1,
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        {state.loadingMore
                          ? lang.loading || "Loading..."
                          : lang.loadMore || "Load More"}
                      </Button>
                    </Box>
                  )}
                </>
              )}

              {/* Selected Info */}
              {state.selectedVideo && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    animation: "slideIn 0.3s ease",
                    "@keyframes slideIn": {
                      "0%": {
                        transform: "translateY(10px)",
                        opacity: 0,
                      },
                      "100%": {
                        transform: "translateY(0)",
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <CheckCircleOutlined
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: 28,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                      }}
                    >
                      {lang.selected || "Selected"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {state.selectedVideo.des}
                    </Typography>
                  </Box>
                </Box>
              )}
            </>
          )}

          {/* Step 1: Select Influencer */}
          {state.step === 1 && (
            <>
              {/* Info Banner */}
              <Box
                sx={{
                  mb: 3,
                  p: 2.5,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.1,
                  )} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`,
                  border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.info.main})`,
                  },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.success.main, 0.2),
                      color: theme.palette.success.main,
                      width: 48,
                      height: 48,
                    }}
                  >
                    <PersonOutlined />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        mb: 0.5,
                      }}
                    >
                      {lang.chooseInfluencer || "Choose Your Influencer"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.5,
                        fontSize: "0.85rem",
                      }}
                    >
                      {lang.selectInfluencerDescription ||
                        "Select the influencer to feature in your reel"}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Influencer Grid */}
              <Grid container spacing={2.5}>
                {inf.map((influencer) => (
                  <Grid item xs={6} sm={4} md={3} key={influencer.id}>
                    <InfluencerCard
                      influencer={influencer}
                      isSelected={
                        state.selectedInfluencer?.id === influencer.id
                      }
                      onSelect={() => handleSelectInfluencer(influencer)}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Selected Info */}
              {state.selectedInfluencer && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    animation: "slideIn 0.3s ease",
                    "@keyframes slideIn": {
                      "0%": {
                        transform: "translateY(10px)",
                        opacity: 0,
                      },
                      "100%": {
                        transform: "translateY(0)",
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <CheckCircleOutlined
                    sx={{
                      color: theme.palette.success.main,
                      fontSize: 28,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.success.main,
                      }}
                    >
                      {lang.selected || "Selected"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {state.selectedInfluencer.name}
                    </Typography>
                  </Box>
                </Box>
              )}
            </>
          )}

          {/* Action Buttons */}
          <Box
            sx={{
              mt: 4,
              display: "flex",
              gap: 2,
              justifyContent: "space-between",
            }}
          >
            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: 2,
              }}
            >
              {lang.cancel || "Cancel"}
            </Button>

            <Box sx={{ display: "flex", gap: 2 }}>
              {state.step === 1 && (
                <Button
                  onClick={handleBack}
                  variant="outlined"
                  startIcon={<ArrowBackOutlined />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                  }}
                >
                  {lang.back || "Back"}
                </Button>
              )}

              {state.step === 0 ? (
                <Button
                  onClick={handleNext}
                  variant="contained"
                  disabled={!state.selectedVideo}
                  endIcon={<ArrowForwardOutlined />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    minWidth: 140,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: state.selectedVideo
                      ? `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
                      : "none",
                    "&:hover": {
                      boxShadow: state.selectedVideo
                        ? `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`
                        : "none",
                    },
                  }}
                >
                  {lang.next || "Next"}
                </Button>
              ) : (
                <Button
                  onClick={handleConfirm}
                  variant="contained"
                  disabled={!state.selectedInfluencer}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    minWidth: 140,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: state.selectedInfluencer
                      ? `0 4px 14px ${alpha(theme.palette.success.main, 0.4)}`
                      : "none",
                    "&:hover": {
                      boxShadow: state.selectedInfluencer
                        ? `0 6px 20px ${alpha(theme.palette.success.main, 0.5)}`
                        : "none",
                    },
                  }}
                >
                  {lang.confirm || "Confirm Selection"}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </CommonDialog>
    </div>
  );
};

export default AddNew;
