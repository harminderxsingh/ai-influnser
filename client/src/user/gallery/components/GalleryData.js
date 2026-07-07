import React, { useState } from "react";
import {
  Box,
  Typography,
  alpha,
  useTheme,
  Grid,
  Button,
  Stack,
  Avatar,
  CircularProgress,
} from "@mui/material";
import {
  CalendarTodayOutlined,
  AutoAwesomeOutlined,
  DownloadOutlined,
  ImageOutlined,
  CheckCircleOutlineOutlined,
  PersonAddOutlined,
} from "@mui/icons-material";
import CommonDialog from "../../../common/CommonDialog";
import GalleryCard from "./GalleryCard";

const PhotoModalContent = ({ item, photoUrl, lang, hitAxios }) => {
  const theme = useTheme();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  if (!item) return null;

  const modelData = JSON.parse(item.model);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = photoUrl;
    link.download = `${modelData.name}_${item.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportAsInfluencer = async () => {
    setImporting(true);
    try {
      const res = await hitAxios({
        path: "/api/inf/import_from_gallery",
        post: true,
        admin: false,
        obj: {
          gallery_id: item.id,
          name: modelData.name,
          description:
            modelData.description ||
            `Imported from gallery — ${modelData.name}`,
          generated_photo: item.generated_photo,
          photo_url: modelData.photo_url,
        },
      });
      if (res.data.success) {
        setImported(true);
      } else {
        alert(res.data.msg || "Import failed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setImporting(false);
    }
  };

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

  return (
    <Box sx={{ mt: 2 }}>
      {/* Image Container */}
      <Box
        sx={{
          position: "relative",
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: "#000000",
          boxShadow: `0 12px 40px ${alpha("#000000", 0.3)}`,
          mb: 3,
        }}
      >
        <img
          src={photoUrl}
          alt={modelData.name}
          style={{
            width: "100%",
            height: "auto",
            maxHeight: "60vh",
            objectFit: "contain",
            display: "block",
          }}
        />

        {/* Image Overlay Info */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            p: 2,
            background: `linear-gradient(to bottom, ${alpha(
              "#000000",
              0.6,
            )} 0%, transparent 100%)`,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              src={photoUrl}
              alt={modelData.name}
              sx={{
                width: 40,
                height: 40,
                border: `3px solid #FFFFFF`,
              }}
            >
              {modelData.name?.[0]}
            </Avatar>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  color: "#FFFFFF",
                  fontWeight: 700,
                  textShadow: `0 2px 8px ${alpha("#000000", 0.6)}`,
                }}
              >
                {modelData.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  textShadow: `0 2px 8px ${alpha("#000000", 0.6)}`,
                }}
              >
                <AutoAwesomeOutlined sx={{ fontSize: 12 }} />
                AI Generated
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Prompt Section */}
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
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.2),
              borderRadius: 2,
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AutoAwesomeOutlined
              sx={{
                fontSize: 24,
                color: theme.palette.primary.main,
              }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 1,
                color: theme.palette.text.primary,
              }}
            >
              {lang.prompt || "Prompt"}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                lineHeight: 1.7,
                color: theme.palette.text.secondary,
              }}
            >
              {item.prompt}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Meta Information Grid */}
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
            <Box
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                borderRadius: 2,
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarTodayOutlined
                sx={{
                  fontSize: 24,
                  color: theme.palette.primary.main,
                }}
              />
            </Box>
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
            <Box
              sx={{
                bgcolor: alpha(theme.palette.success.main, 0.15),
                borderRadius: 2,
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircleOutlineOutlined
                sx={{
                  fontSize: 24,
                  color: theme.palette.success.main,
                }}
              />
            </Box>
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

      {/* Action Buttons */}
      <Stack spacing={1.5}>
        {/* Download Button */}
        <Button
          onClick={handleDownload}
          variant="contained"
          fullWidth
          size="large"
          startIcon={<DownloadOutlined />}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            py: 1.5,
            borderRadius: 2,
            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
            "&:hover": {
              boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
            },
          }}
        >
          {lang.downloadImage || "Download Image"}
        </Button>

        {/* ✅ Import as Influencer Button */}
        <Button
          onClick={handleImportAsInfluencer}
          variant="outlined"
          fullWidth
          size="large"
          disabled={importing || imported}
          startIcon={
            importing ? (
              <CircularProgress size={18} color="inherit" />
            ) : imported ? (
              <CheckCircleOutlineOutlined />
            ) : (
              <PersonAddOutlined />
            )
          }
          sx={{
            textTransform: "none",
            fontWeight: 700,
            py: 1.5,
            borderRadius: 2,
            borderWidth: 2,
            color: imported
              ? theme.palette.success.main
              : theme.palette.secondary.main,
            borderColor: imported
              ? theme.palette.success.main
              : theme.palette.secondary.main,
            "&:hover": {
              borderWidth: 2,
              borderColor: imported
                ? theme.palette.success.main
                : theme.palette.secondary.main,
              bgcolor: imported
                ? alpha(theme.palette.success.main, 0.08)
                : alpha(theme.palette.secondary.main, 0.08),
            },
            "&.Mui-disabled": {
              borderWidth: 2,
              borderColor: imported
                ? theme.palette.success.main
                : alpha(theme.palette.secondary.main, 0.4),
              color: imported
                ? theme.palette.success.main
                : alpha(theme.palette.secondary.main, 0.4),
            },
          }}
        >
          {importing
            ? lang.importing || "Importing..."
            : imported
              ? lang.importedAsInfluencer || "✓ Imported as Influencer!"
              : lang.importAsInfluencer || "Import as Influencer"}
        </Button>
      </Stack>
    </Box>
  );
};

const GalleryData = ({ lang, gal, hitAxios, getGallery }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleDelete(id) {
    if (window.confirm(lang.aus)) {
      const res = await hitAxios({
        path: "/api/gallery/del_one",
        post: true,
        admin: false,
        obj: { id },
      });
      if (res.data.success) {
        getGallery();
      }
    }
  }

  const handleCardClick = (item) => {
    if (
      item.status === "active" &&
      (item.generated_photo || JSON.parse(item.model).photo_url)
    ) {
      setSelectedItem(item);
      setModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const getPhotoUrl = (item) => {
    if (item.generated_photo) {
      return `/media/${item.generated_photo}`;
    }
    const modelData = JSON.parse(item.model);
    return modelData.photo_url ? `/media/${modelData.photo_url}` : null;
  };

  return (
    <>
      <Grid container spacing={2}>
        {[...gal]?.reverse().map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <GalleryCard
              item={item}
              onDelete={handleDelete}
              onClick={() => handleCardClick(item)}
              lang={lang}
            />
          </Grid>
        ))}
      </Grid>

      {/* Photo Modal */}
      <CommonDialog
        title={
          selectedItem
            ? JSON.parse(selectedItem.model).name
            : lang.viewImage || "View Image"
        }
        open={modalOpen}
        onClose={handleCloseModal}
        icon={ImageOutlined}
        maxWidth="sm"
      >
        {selectedItem && (
          <PhotoModalContent
            item={selectedItem}
            photoUrl={getPhotoUrl(selectedItem)}
            lang={lang}
            hitAxios={hitAxios} // 👈 pass hitAxios down
          />
        )}
      </CommonDialog>
    </>
  );
};

export default GalleryData;
