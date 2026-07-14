import React, { useState } from "react";
import { Box, Typography, useTheme, Grid } from "@mui/material";
import { ShoppingBagOutlined } from "@mui/icons-material";
import ProductVideoCard from "./ProductVideoCard";
import ProductVideoModal from "./ProductVideoModal";

const ProductContentList = ({ hitAxios, lang, fetchContents, contents }) => {
  const theme = useTheme();
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleDelete = async (id) => {
    if (
      window.confirm(
        lang.deleteDialogMessage ||
          "Are you sure you want to delete this product video?",
      )
    ) {
      const res = await hitAxios({
        path: "/api/content/del_one_product_content",
        post: true,
        admin: false,
        obj: { id },
        showLoading: false,
      });
      if (res.data.success) {
        fetchContents();
      }
    }
  };

  const handleCardClick = (item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  if (contents.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
        <ShoppingBagOutlined
          sx={{ fontSize: 80, color: theme.palette.text.disabled, mb: 2 }}
        />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {lang.noVideosTitle || "No Product Videos Yet"}
        </Typography>
        <Typography variant="body2" color="text.disabled">
          {lang.noVideosSubtitle || "Create your first product showcase video"}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={2}>
        {contents?.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <ProductVideoCard
              item={item}
              onDelete={handleDelete}
              onClick={() => handleCardClick(item)}
              lang={lang}
            />
          </Grid>
        ))}
      </Grid>

      <ProductVideoModal
        item={selectedItem}
        open={modalOpen}
        onClose={handleCloseModal}
        lang={lang}
      />
    </>
  );
};

export default ProductContentList;
