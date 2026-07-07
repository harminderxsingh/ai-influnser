import React from "react";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Stack,
  Button,
  Collapse,
  Divider,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import TiktokProfileViewer from "./TiktokProfileViewer";

const ttGradient =
  "linear-gradient(135deg, #010101 0%, #69C9D0 50%, #EE1D52 100%)";

const TiktokAccountCard = ({ account, lang, onDelete }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* ── Main Row ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          px: 2,
          py: 1.2,
        }}
      >
        {/* LEFT — Avatar + Name */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.2}
          sx={{ flex: "1 1 180px", minWidth: 0 }}
        >
          <Box
            sx={{
              p: "2px",
              borderRadius: "50%",
              background: ttGradient,
              flexShrink: 0,
            }}
          >
            <Avatar
              src={account.avatar_url}
              sx={{
                width: 36,
                height: 36,
                border: "2px solid",
                borderColor: "background.paper",
              }}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.4}>
              <Typography
                noWrap
                sx={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "text.primary",
                }}
              >
                {account.display_name || account.username}
              </Typography>
              <CheckCircleIcon
                sx={{ fontSize: 12, color: "success.main", flexShrink: 0 }}
              />
            </Stack>
            {account.username && (
              <Typography
                noWrap
                sx={{ fontSize: "0.72rem", color: "text.secondary" }}
              >
                @{account.username}
              </Typography>
            )}
          </Box>
        </Stack>

        {/* RIGHT — Meta + Actions */}
        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          justifyContent="flex-end"
          spacing={1}
          flexShrink={0}
        >
          {/* Open ID chip */}
          <Chip
            label={`ID: ${account.open_id?.slice(0, 12)}…`}
            size="small"
            sx={{
              fontFamily: "monospace",
              fontSize: "0.6rem",
              bgcolor: "action.hover",
              color: "text.secondary",
              height: 20,
              display: { xs: "none", sm: "flex" },
            }}
          />

          {/* Connected chip */}
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: "0.65rem !important" }} />}
            label={lang?.connected || "Connected"}
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontSize: "0.65rem", fontWeight: 700, height: 20 }}
          />

          {/* Date */}
          <Typography
            sx={{
              fontSize: "0.7rem",
              color: "text.disabled",
              display: { xs: "none", md: "block" },
            }}
          >
            {new Date(account.connected_at).toLocaleDateString()}
          </Typography>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* View Profile */}
          <Button
            size="small"
            variant={open ? "contained" : "outlined"}
            onClick={() => setOpen((p) => !p)}
            endIcon={
              open ? (
                <ExpandLess sx={{ fontSize: 14 }} />
              ) : (
                <ExpandMore sx={{ fontSize: 14 }} />
              )
            }
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontSize: "0.72rem",
              px: 1.2,
              py: 0.4,
              whiteSpace: "nowrap",
              ...(open && {
                background: ttGradient,
                border: "none",
                color: "#fff",
                "&:hover": { opacity: 0.88, background: ttGradient },
              }),
            }}
          >
            {open
              ? lang?.hideProfile || "Hide"
              : lang?.viewProfile || "View Profile"}
          </Button>

          {/* Delete */}
          <Tooltip title={lang?.disconnect || "Disconnect"}>
            <IconButton
              size="small"
              color="error"
              sx={{ p: 0.5 }}
              onClick={() => {
                if (window.confirm(lang?.areYouSure || "Are you sure?")) {
                  onDelete(account?.id);
                }
              }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── Profile Viewer ── */}
      <Collapse in={open} unmountOnExit>
        <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
          <TiktokProfileViewer accountId={account.id} lang={lang} />
        </Box>
      </Collapse>
    </Box>
  );
};

export default TiktokAccountCard;
