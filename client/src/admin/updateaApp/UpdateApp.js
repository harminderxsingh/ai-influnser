import React from "react";
import { Box, Button, Typography, Paper, Chip } from "@mui/material";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

const UpdateApp = () => {
  const handleUpdate = () => {
    window.open(
      "https://envato-buyer.oneoftheprojects.com",
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <Box>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SystemUpdateAltIcon color="primary" fontSize="medium" />
          <Typography variant="subtitle1" fontWeight={600} color="text.primary">
            App Update
          </Typography>
        </Box>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ lineHeight: 1.5 }}
        >
          A new version is ready. Click below to update your app automatically.
        </Typography>

        {/* Update Button */}
        <Button
          variant="contained"
          color="primary"
          size="medium"
          fullWidth
          endIcon={<OpenInNewIcon fontSize="small" />}
          onClick={handleUpdate}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            py: 1,
            boxShadow: 2,
            "&:hover": {
              boxShadow: 4,
            },
          }}
        >
          Update Now
        </Button>

        {/* Footer note */}
        <Typography variant="caption" color="text.disabled">
          Opens in a new tab · Auto-install enabled
        </Typography>
      </Paper>
    </Box>
  );
};

export default UpdateApp;
