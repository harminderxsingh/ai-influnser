import React from "react";
import {
  AccessTimeOutlined,
  AdminPanelSettingsOutlined,
  ExpandMoreOutlined,
  PersonOutlined,
} from "@mui/icons-material";
import {
  alpha,
  Avatar,
  Box,
  Card,
  Chip,
  Divider,
  Fade,
  Stack,
  Typography,
} from "@mui/material";

const ConversationCard = ({ convo, lang, theme }) => {
  const [expanded, setExpanded] = React.useState(false);
  const hasReply = !!convo.ans;

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: `1px solid ${
          hasReply
            ? alpha(theme.palette.success.main, 0.25)
            : theme.palette.divider
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
          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.03) },
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
                width: 36,
                height: 36,
                bgcolor: hasReply
                  ? alpha(theme.palette.success.main, 0.12)
                  : alpha(theme.palette.primary.main, 0.1),
                color: hasReply ? "success.main" : "primary.main",
              }}
            >
              {hasReply ? (
                <AdminPanelSettingsOutlined sx={{ fontSize: 18 }} />
              ) : (
                <PersonOutlined sx={{ fontSize: 18 }} />
              )}
            </Avatar>
            <Box>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  maxWidth: 260,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {convo.que}
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
                  {new Date(convo.created_at).toLocaleString()}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {hasReply && (
              <Chip
                label={lang?.supportTeam || "Support Team"}
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontSize: "0.6rem", height: 20, fontWeight: 700 }}
              />
            )}
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

      {/* Expanded chat thread */}
      <Fade in={expanded}>
        <Box sx={{ display: expanded ? "block" : "none" }}>
          <Divider />
          <Box
            sx={{
              p: 2,
              bgcolor: alpha(theme.palette.background.default, 0.4),
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
                    {convo.que}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="caption" color="text.disabled">
                    {lang?.you || "You"}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    ·
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {new Date(convo.created_at).toLocaleTimeString([], {
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
                      {convo.ans}
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
                      {new Date(convo.updated_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            )}

            {/* Awaiting reply */}
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
                  {lang?.awaitingReply || "Awaiting reply from support team..."}
                </Typography>
              </Stack>
            )}
          </Box>
        </Box>
      </Fade>
    </Card>
  );
};

export default ConversationCard;
