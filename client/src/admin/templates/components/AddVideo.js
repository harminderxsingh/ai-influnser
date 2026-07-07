import { LibraryAdd, CloudUpload, VideoLibrary } from "@mui/icons-material";
import {
  Button,
  TextField,
  Autocomplete,
  Box,
  LinearProgress,
  Typography,
  Stack,
  Paper,
  Chip,
  alpha,
} from "@mui/material";
import React, { useState } from "react";
import CommonDialog from "../../../common/CommonDialog";

const AddVideo = ({ lang, handleGetCate, hitAxios, cate, handleGetVideos }) => {
  const [open, setOpen] = useState(false);
  const [selectedCate, setSelectedCate] = useState(null);
  const [des, setDes] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    if (!uploading) {
      setOpen(false);
      setSelectedCate(null);
      setDes("");
      setVideoFile(null);
      setUploadProgress(0);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
    } else {
      alert("Please select a valid video file");
    }
  };

  const handleSubmit = async () => {
    if (!selectedCate || !des || !videoFile) {
      alert("Please fill all fields and select a video");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("cate_id", selectedCate.id);
    formData.append("des", des);
    formData.append("video", videoFile);

    try {
      const res = await hitAxios({
        path: "/api/admin/add_t_video",
        admin: true,
        post: true,
        obj: formData,
        showLoading: false,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(percentCompleted);
        },
      });

      if (res.data.success) {
        handleClose();
        await handleGetCate();
        handleGetVideos();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <>
      <Button
        startIcon={<LibraryAdd />}
        variant="contained"
        size="large"
        onClick={handleOpen}
      >
        {lang.addVideo || "Add Video"}
      </Button>

      <CommonDialog
        open={open}
        onClose={handleClose}
        title={lang.addVideo || "Add Video"}
        icon={LibraryAdd}
        maxWidth="sm"
        fullWidth
      >
        <Stack mt={2} spacing={3}>
          {/* Category Selection */}
          <Autocomplete
            size="small"
            options={cate || []}
            getOptionLabel={(option) => option.name}
            value={selectedCate}
            onChange={(e, newValue) => setSelectedCate(newValue)}
            disabled={uploading}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: option.color,
                    mr: 1.5,
                  }}
                />
                {option.name}
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang.selectCategory || "Select Category"}
                required
              />
            )}
          />

          {/* Description */}
          <TextField
            size="small"
            label={lang.description || "Description"}
            placeholder={
              lang.enterDescription || "Enter a brief description..."
            }
            multiline
            rows={3}
            value={des}
            onChange={(e) => setDes(e.target.value)}
            disabled={uploading}
            required
            fullWidth
          />

          {/* Video Upload */}
          <Box
            component="label"
            sx={{
              display: "block",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            <input
              type="file"
              hidden
              accept="video/*"
              onChange={handleVideoChange}
              disabled={uploading}
            />
            <Paper
              elevation={0}
              sx={{
                border: "2px dashed",
                borderColor: videoFile ? "success.main" : "divider",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
                bgcolor: (theme) =>
                  videoFile
                    ? alpha(theme.palette.success.main, 0.05)
                    : alpha(theme.palette.primary.main, 0.02),
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: videoFile ? "success.main" : "primary.main",
                  bgcolor: (theme) =>
                    videoFile
                      ? alpha(theme.palette.success.main, 0.08)
                      : alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              {videoFile ? (
                <Stack spacing={1.5} alignItems="center">
                  <VideoLibrary sx={{ fontSize: 40, color: "success.main" }} />
                  <Typography variant="body2" fontWeight={500}>
                    {videoFile.name}
                  </Typography>
                  <Chip
                    label={formatFileSize(videoFile.size)}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Stack>
              ) : (
                <Stack spacing={1.5} alignItems="center">
                  <CloudUpload sx={{ fontSize: 40, color: "primary.main" }} />
                  <Typography variant="body2" color="text.secondary">
                    {lang.clickToUpload || "Click to upload video"}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    MP4, MOV, AVI, WebM
                  </Typography>
                </Stack>
              )}
            </Paper>
          </Box>

          {/* Upload Progress */}
          {uploading && (
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {lang.uploading || "Uploading..."}
                </Typography>
                <Typography variant="body2" fontWeight={600} color="primary">
                  {uploadProgress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            variant="contained"
            fullWidth
            size="large"
            disabled={uploading || !selectedCate || !des || !videoFile}
            startIcon={<CloudUpload />}
          >
            {uploading
              ? lang.uploading || "Uploading..."
              : lang.uploadVideo || "Upload Video"}
          </Button>
        </Stack>
      </CommonDialog>
    </>
  );
};

export default AddVideo;
