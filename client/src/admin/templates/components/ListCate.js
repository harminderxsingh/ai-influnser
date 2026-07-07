import { DeleteOutline, EditOutlined } from "@mui/icons-material";
import {
  Box,
  Chip,
  Stack,
  Typography,
  useTheme,
  alpha,
  IconButton,
} from "@mui/material";
import React from "react";

const ListCate = ({ hitAxios, lang, cate, handleGetCate }) => {
  const theme = useTheme();

  async function delCategory(cateId) {
    if (window.confirm(lang.aus || "Are you sure?")) {
      const res = await hitAxios({
        path: "/api/admin/del_t_cate",
        admin: true,
        post: true,
        obj: { cateId },
      });
      if (res.data.success) {
        await handleGetCate();
      }
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      {cate?.map((i, key) => {
        return (
          <Box
            key={key}
            sx={{
              borderRadius: 2,
              p: 1,
              border: 1,
              borderColor: theme.palette.divider,
              bgcolor: theme.palette.background.paper,
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: i.color,
                boxShadow: `0 4px 12px ${alpha(i.color, 0.15)}`,
                transform: "translateY(-2px)",
              },
            }}
          >
            <Stack alignItems={"center"} direction={"row"} spacing={1.5}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: i.color,
                  boxShadow: `0 0 0 3px ${alpha(i.color, 0.15)}`,
                }}
              />
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  color: theme.palette.text.primary,
                }}
              >
                {i.name}
              </Typography>

              <IconButton
                size="small"
                onClick={() => delCategory(i.id)}
                sx={{
                  ml: 1,
                  color: theme.palette.text.secondary,
                  "&:hover": {
                    color: theme.palette.error.main,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                  },
                }}
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
};

export default ListCate;
