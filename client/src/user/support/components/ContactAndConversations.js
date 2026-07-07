// components/support/ContactAndConversations.jsx
import React from "react";
import {
  AddCommentOutlined,
  ChatOutlined,
  EmailOutlined,
  WhatsApp,
} from "@mui/icons-material";
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import ConversationCard from "./ConversationCard";

const getContactCards = (lang) => [
  {
    icon: EmailOutlined,
    title: lang?.contactEmailTitle || "Email Support",
    description: lang?.contactEmailDesc || "We reply within 24 hours",
    value: lang?.contactEmailValue || "support@yourapp.com",
    color: "primary",
  },
  {
    icon: WhatsApp,
    title: lang?.contactWhatsappTitle || "WhatsApp",
    description: lang?.contactWhatsappDesc || "Mon–Fri, 9am–6pm",
    value: lang?.contactWhatsappValue || "+1 234 567 890",
    color: "success",
  },
];

const ContactAndConversations = ({ lang, conversations, onOpenDialog }) => {
  const theme = useTheme();
  const CONTACT_CARDS = getContactCards(lang);
  const pendingCount = conversations.filter((c) => !c.ans).length;

  return (
    <Stack>
      {/* Contact Cards */}
      <Grid container spacing={2}>
        {CONTACT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Grid item xs={12} sm={6} key={card.title}>
              <Card
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette[card.color].main, 0.2)}`,
                  bgcolor: alpha(theme.palette[card.color].main, 0.04),
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: `0 8px 24px ${alpha(theme.palette[card.color].main, 0.2)}`,
                    border: `1px solid ${alpha(theme.palette[card.color].main, 0.4)}`,
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette[card.color].main, 0.12),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1.5,
                    }}
                  >
                    <Icon
                      sx={{
                        color: theme.palette[card.color].main,
                        fontSize: 22,
                      }}
                    />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {card.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 0.5 }}
                  >
                    {card.description}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{ color: theme.palette[card.color].main }}
                  >
                    {card.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Conversations */}
      <Card
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.06)}`,
          mt: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChatOutlined sx={{ color: "info.main", fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {lang?.myConversations || "My Conversations"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {lang?.myConversationsSub ||
                    "Your message history with our support team"}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              {pendingCount > 0 && (
                <Chip
                  label={`${pendingCount} ${lang?.pendingSuffix || "pending"}`}
                  size="small"
                  color="warning"
                  sx={{ fontWeight: 700, fontSize: "0.65rem" }}
                />
              )}
              <Chip
                label={`${conversations.length} ${lang?.totalSuffix || "total"}`}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: "0.65rem" }}
              />
            </Stack>
          </Stack>

          {/* Empty state */}
          {conversations.length === 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 5,
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: alpha(theme.palette.text.secondary, 0.06),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChatOutlined sx={{ fontSize: 28, color: "text.disabled" }} />
              </Box>
              <Typography
                variant="body2"
                color="text.disabled"
                fontWeight={600}
              >
                {lang?.noMessages || "No messages yet"}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {lang?.noMessagesSub ||
                  "Your conversations will appear here once you send a message"}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddCommentOutlined />}
                onClick={onOpenDialog}
                sx={{ mt: 1, borderRadius: 2, fontWeight: 700 }}
              >
                {lang?.sendFirstMessage || "Send Your First Message"}
              </Button>
            </Box>
          )}

          {/* List */}
          <Stack spacing={1.5}>
            {conversations.map((convo) => (
              <ConversationCard
                key={convo.id}
                convo={convo}
                lang={lang}
                theme={theme}
              />
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default ContactAndConversations;
