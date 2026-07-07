// components/support/admin/QueCard.jsx
import React from "react";
import {
  AccessTimeOutlined,
  AdminPanelSettingsOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ExpandMoreOutlined,
  HourglassEmptyOutlined,
  PersonOutlined,
  ReplyOutlined,
} from "@mui/icons-material";
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Fade,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

const QueCard = ({ item, lang, theme, onReply, onDelete }) => {
  const [expanded, setExpanded] = React.useState(false);
  const hasReply = !!item.ans;

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: `1px solid ${
          hasReply
            ? alpha(theme.palette.success.main, 0.25)
            : alpha(theme.palette.warning.main, 0.35)
        }`,
        overflow: "hidden",
        transition: "all 0.3s ease",
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setExpanded((p) => !p)}
        sx={{
          px: 2,
          py: 1.5,
          cursor: "pointer",
          bgcolor: hasReply
            ? alpha(theme.palette.success.main, 0.02)
            : alpha(theme.palette.warning.main, 0.03),
          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
              }}
            >
              <PersonOutlined sx={{ fontSize: 20 }} />
            </Avatar>
            <Box>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  maxWidth: { xs: 180, sm: 320, md: 440 },
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.que}
              </Typography>
              <Stack
                direction="row"
                spacing={0.8}
                alignItems="center"
                sx={{ mt: 0.3 }}
              >
                <AccessTimeOutlined
                  sx={{ fontSize: 11, color: "text.disabled" }}
                />
                <Typography variant="caption" color="text.disabled">
                  {new Date(item.created_at).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  ·
                </Typography>
                <Typography
                  variant="caption"
                  color="text.disabled"
                  fontWeight={600}
                >
                  ID #{item.id}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={
                hasReply ? (
                  <CheckCircleOutlined sx={{ fontSize: "14px !important" }} />
                ) : (
                  <HourglassEmptyOutlined
                    sx={{ fontSize: "14px !important" }}
                  />
                )
              }
              label={
                hasReply
                  ? lang?.replied || "Replied"
                  : lang?.pending || "Pending"
              }
              size="small"
              color={hasReply ? "success" : "warning"}
              sx={{ fontWeight: 700, fontSize: "0.62rem" }}
            />

            <Tooltip title={lang?.deleteQue || "Delete"}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                sx={{
                  color: "text.disabled",
                  "&:hover": {
                    color: "error.main",
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <DeleteOutlined sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>

            <ExpandMoreOutlined
              sx={{
                fontSize: 18,
                color: "text.secondary",
                transition: "transform 0.3s ease",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </Stack>
        </Stack>
      </Box>

      {/* Expanded thread */}
      <Fade in={expanded}>
        <Box sx={{ display: expanded ? "block" : "none" }}>
          <Divider />
          <Box
            sx={{
              p: 2,
              bgcolor: alpha(theme.palette.background.default, 0.5),
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {/* User bubble — right */}
            <Stack direction="row" justifyContent="flex-end">
              <Stack
                alignItems="flex-end"
                spacing={0.5}
                sx={{ maxWidth: "80%" }}
              >
                <Box
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    borderRadius: 2.5,
                    borderBottomRightRadius: 0,
                    px: 2,
                    py: 1.2,
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                    {item.que}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="caption" color="text.disabled">
                    {lang?.user || "User"}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    ·
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {new Date(item.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Stack>
              </Stack>
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  ml: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: "primary.main",
                  alignSelf: "flex-end",
                }}
              >
                <PersonOutlined sx={{ fontSize: 14 }} />
              </Avatar>
            </Stack>

            {/* Admin reply bubble — left */}
            {hasReply && (
              <Stack direction="row" alignItems="flex-end" spacing={1}>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: alpha(theme.palette.success.main, 0.12),
                    color: "success.main",
                  }}
                >
                  <AdminPanelSettingsOutlined sx={{ fontSize: 14 }} />
                </Avatar>
                <Stack spacing={0.5} sx={{ maxWidth: "80%" }}>
                  <Box
                    sx={{
                      bgcolor: alpha(theme.palette.success.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      borderRadius: 2.5,
                      borderBottomLeftRadius: 0,
                      px: 2,
                      py: 1.2,
                    }}
                  >
                    <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                      {item.ans}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography
                      variant="caption"
                      color="success.main"
                      fontWeight={700}
                    >
                      {lang?.supportTeam || "Support Team"}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      ·
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {new Date(item.updated_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            )}

            {/* No reply yet */}
            {!hasReply && (
              <Stack direction="row" spacing={0.8} alignItems="center">
                <AccessTimeOutlined
                  sx={{ fontSize: 13, color: "text.disabled" }}
                />
                <Typography
                  variant="caption"
                  color="text.disabled"
                  fontStyle="italic"
                >
                  {lang?.noReplyYet || "No reply sent yet"}
                </Typography>
              </Stack>
            )}

            {/* Reply / Edit button */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
              <Button
                size="small"
                variant={hasReply ? "outlined" : "contained"}
                color={hasReply ? "inherit" : "primary"}
                startIcon={<ReplyOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onReply(item);
                }}
                sx={{ borderRadius: 2, fontWeight: 700, fontSize: "0.72rem" }}
              >
                {hasReply
                  ? lang?.editReply || "Edit Reply"
                  : lang?.replyNow || "Reply Now"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Card>
  );
};

export default QueCard;
