import React from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  Checkbox,
  Stack,
  Button,
  Grid,
  LinearProgress,
} from "@mui/material";
import { Search, DeleteSweep, ExpandMore } from "@mui/icons-material";
import VideoCard from "./VideoCard";

const ListVideo = ({ hitAxios, lang, cate, handleGetCate, refreshVideos }) => {
  const [videos, setVideos] = React.useState([]);
  const [allVideos, setAllVideos] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedVideos, setSelectedVideos] = React.useState([]);
  const [playingVideoId, setPlayingVideoId] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 12,
    hasMore: false,
    total: 0,
  });

  // Fetch videos
  async function handleGetVid(page = 1, search = "", loadMore = false) {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await hitAxios({
        path: `/api/admin/get_t_video?page=${page}&limit=12&search=${search}`,
        post: false,
        admin: true,
        showLoading: false,
      });

      if (res.data.success) {
        if (loadMore) {
          setVideos((prev) => [...prev, ...res.data.data]);
        } else {
          setVideos(res.data.data);
        }

        if (search === "") {
          setAllVideos((prev) =>
            loadMore ? [...prev, ...res.data.data] : res.data.data,
          );
        }

        setPagination({
          page: res.data.pagination.page,
          limit: res.data.pagination.limit,
          hasMore: res.data.pagination.hasMore,
          total: res.data.pagination.total,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  React.useEffect(() => {
    handleGetVid(1, "");
  }, []);

  // Refresh videos when refreshVideos prop changes
  React.useEffect(() => {
    if (refreshVideos > 0) {
      handleGetVid(1, searchQuery);
    }
  }, [refreshVideos]);

  // Handle search with debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleGetVid(1, searchQuery);
      setSelectedVideos([]);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectVideo = (videoId) => {
    setSelectedVideos((prev) =>
      prev.includes(videoId)
        ? prev.filter((id) => id !== videoId)
        : [...prev, videoId],
    );
  };

  const handleSelectAll = () => {
    if (selectedVideos.length === videos.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(videos.map((v) => v.id));
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (window.confirm(lang.aus || "Are you sure?")) {
      const res = await hitAxios({
        path: "/api/admin/delete_t_video",
        post: true,
        admin: true,
        obj: { ids: [videoId] },
      });

      if (res.data.success) {
        handleGetVid(1, searchQuery);
        setSelectedVideos([]);
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedVideos.length === 0) return;

    if (
      !window.confirm(
        `${lang.confirmDeleteMultiple || "Are you sure you want to delete"} ${
          selectedVideos.length
        } ${lang.videos || "videos"}?`,
      )
    ) {
      return;
    }

    const res = await hitAxios({
      path: "/api/admin/delete_t_video",
      post: true,
      admin: true,
      obj: { ids: selectedVideos },
    });

    if (res.data.success) {
      handleGetVid(1, searchQuery);
      setSelectedVideos([]);
    }
  };

  const handlePlayToggle = (video) => {
    setPlayingVideoId(playingVideoId === video.id ? null : video.id);
  };

  const handleLoadMore = () => {
    handleGetVid(pagination.page + 1, searchQuery, true);
  };

  return (
    <Box>
      {/* Header with Search and Actions */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ mb: 3 }}
      >
        {/* Search */}
        <TextField
          size="small"
          placeholder={
            lang.searchVideos || "Search videos, category, caption..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        {/* Actions */}
        <Stack direction="row" spacing={2} alignItems="center">
          {selectedVideos.length > 0 && (
            <>
              <Typography variant="body2" color="text.secondary">
                {selectedVideos.length} {lang.selected || "selected"}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteSweep />}
                onClick={handleDeleteSelected}
              >
                {lang.deleteSelected || "Delete Selected"}
              </Button>
            </>
          )}
          <Checkbox
            checked={
              videos.length > 0 && selectedVideos.length === videos.length
            }
            indeterminate={
              selectedVideos.length > 0 && selectedVideos.length < videos.length
            }
            onChange={handleSelectAll}
          />
          <Typography variant="body2" color="text.secondary">
            {lang.selectAll || "Select All"}
          </Typography>
        </Stack>
      </Stack>

      {/* Total Count */}
      {pagination.total > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {lang.showing || "Showing"} {videos.length} {lang.of || "of"}{" "}
          {pagination.total} {lang.videos || "videos"}
        </Typography>
      )}

      {/* Loading Progress */}
      {loading && (
        <Box sx={{ width: "100%", mb: 3 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Video Grid */}
      {!loading && videos.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            color: "text.secondary",
          }}
        >
          <Typography variant="h6">
            {searchQuery
              ? lang.noVideosFound || "No videos found"
              : lang.noVideos || "No videos yet"}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {videos.map((video) => {
              const isSelected = selectedVideos.includes(video.id);

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={video.id}>
                  <VideoCard
                    video={video}
                    isSelected={isSelected}
                    onSelect={() => handleSelectVideo(video.id)}
                    onDelete={() => handleDeleteVideo(video.id)}
                    isPlaying={playingVideoId === video.id}
                    onPlayToggle={handlePlayToggle}
                  />
                </Grid>
              );
            })}
          </Grid>

          {/* Load More Button */}
          {pagination.hasMore && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mt: 4,
                gap: 2,
              }}
            >
              {loadingMore && (
                <Box sx={{ width: "100%", maxWidth: 400 }}>
                  <LinearProgress />
                </Box>
              )}
              <Button
                variant="outlined"
                size="large"
                onClick={handleLoadMore}
                disabled={loadingMore}
                endIcon={<ExpandMore />}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                {loadingMore
                  ? lang.loading || "Loading..."
                  : lang.loadMore || "Load More"}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ListVideo;
