import React from "react";
import PageHeader from "../../common/PageHeader";
import {
  ChatBubbleOutline,
  SendRounded,
  DeleteOutline,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { GlobalContext } from "../../context/GlobalContext";

const MAX_CHARS = 500;

const photoSrc = (photo) => {
  if (!photo) return "";
  if (String(photo).startsWith("http") || String(photo).startsWith("data:")) {
    return photo;
  }
  return `/media/${photo}`;
};

const TalkingVideo = ({ lang }) => {
  const theme = useTheme();
  const { hitAxios } = React.useContext(GlobalContext);

  const [inf, setInf] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [loadingChat, setLoadingChat] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success",
  });
  const chatEndRef = React.useRef(null);
  const sendLockRef = React.useRef(false);

  const activeInfluencers = React.useMemo(
    () => (inf || []).filter((m) => m.status === "active" && m.photo_url),
    [inf],
  );

  const getInfluencers = React.useCallback(async () => {
    const res = await hitAxios({
      path: "/api/inf/get_models",
      post: false,
      admin: false,
      showLoading: false,
      showSnackbar: false,
    });
    if (res?.data?.success) {
      const list = res.data.data || [];
      setInf(list);
      setSelected((prev) => {
        if (prev) {
          const fresh = list.find((m) => m.id === prev.id);
          return fresh || prev;
        }
        return list.find((m) => m.status === "active" && m.photo_url) || null;
      });
    }
  }, [hitAxios]);

  const loadChat = React.useCallback(
    async (influencerId) => {
      if (!influencerId) {
        setMessages([]);
        return;
      }
      setLoadingChat(true);
      try {
        const res = await hitAxios({
          path: `/api/inf-chat/messages?influencer_id=${influencerId}`,
          post: false,
          admin: false,
          showLoading: false,
          showSnackbar: false,
        });
        if (res?.data?.success) {
          setMessages(res.data.data || []);
        } else {
          setMessages([]);
        }
      } finally {
        setLoadingChat(false);
      }
    },
    [hitAxios],
  );

  React.useEffect(() => {
    getInfluencers();
  }, [getInfluencers]);

  React.useEffect(() => {
    if (selected?.id) loadChat(selected.id);
    else setMessages([]);
  }, [selected?.id, loadChat]);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending, selected?.id]);

  async function handleSend() {
    if (sendLockRef.current || sending) return;
    const text = message.trim();
    if (!selected?.id) {
      setSnackbar({
        open: true,
        message: lang?.selectInfluencerFirst || "Select an influencer first",
        severity: "error",
      });
      return;
    }
    if (!text) return;
    if (text.length > MAX_CHARS) {
      setSnackbar({
        open: true,
        message:
          lang?.chatTooLong ||
          `Keep it under ${MAX_CHARS} characters`,
        severity: "error",
      });
      return;
    }

    sendLockRef.current = true;
    setSending(true);
    const optimisticUser = {
      id: `tmp_${Date.now()}`,
      role: "user",
      message: text,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setMessage("");

    try {
      const res = await hitAxios({
        path: "/api/inf-chat/send",
        post: true,
        admin: false,
        showLoading: false,
        showSnackbar: false,
        obj: {
          influencer_id: selected.id,
          message: text,
        },
      });

      if (res?.data?.success) {
        const assistant = res.data.data?.assistant;
        setMessages((prev) => {
          const withoutOptimistic = prev.filter((m) => !m._optimistic);
          return [
            ...withoutOptimistic,
            { role: "user", message: text },
            assistant || {
              role: "assistant",
              message: res.data.data?.assistant?.message || "",
            },
          ];
        });
      } else {
        setMessages((prev) => prev.filter((m) => !m._optimistic));
        setMessage(text);
        setSnackbar({
          open: true,
          message: res?.data?.msg || "Could not send message",
          severity: "error",
        });
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => !m._optimistic));
      setMessage(text);
      setSnackbar({
        open: true,
        message: err?.message || "Chat failed",
        severity: "error",
      });
    } finally {
      sendLockRef.current = false;
      setSending(false);
    }
  }

  async function handleClear() {
    if (!selected?.id) return;
    const res = await hitAxios({
      path: "/api/inf-chat/clear",
      post: true,
      admin: false,
      showLoading: false,
      showSnackbar: false,
      obj: { influencer_id: selected.id },
    });
    if (res?.data?.success) {
      setMessages([]);
      setSnackbar({
        open: true,
        message: lang?.chatCleared || "Chat cleared",
        severity: "success",
      });
    }
  }

  return (
    <div>
      <PageHeader
        icon={ChatBubbleOutline}
        title={lang?.influencerChat || "Chat"}
        subtitle={
          lang?.influencerChatSub ||
          "Talk with your influencer in real time — text replies, no video wait"
        }
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
          gap: 2,
          mb: 3,
          minHeight: { md: 560 },
        }}
      >
        {/* Influencer picker */}
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            maxHeight: { md: 640 },
            overflow: "auto",
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
            {lang?.yourInfluencers || "Your influencers"}
          </Typography>
          {activeInfluencers.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {lang?.noActiveInfluencers ||
                "Create an active influencer first, then chat here."}
            </Typography>
          ) : (
            <Stack spacing={1}>
              {activeInfluencers.map((m) => {
                const active = selected?.id === m.id;
                return (
                  <Box
                    key={m.id}
                    onClick={() => setSelected(m)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.2,
                      p: 1,
                      borderRadius: 2,
                      cursor: "pointer",
                      border: `1px solid ${
                        active
                          ? theme.palette.primary.main
                          : theme.palette.divider
                      }`,
                      bgcolor: active
                        ? alpha(theme.palette.primary.main, 0.08)
                        : "transparent",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                      },
                    }}
                  >
                    <Avatar src={photoSrc(m.photo_url)} alt={m.name} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        noWrap
                      >
                        {m.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {lang?.tapToChat || "Tap to chat"}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>

        {/* Chat panel */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            minHeight: 520,
            maxHeight: { md: 640 },
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {selected ? (
              <>
                <Avatar
                  src={photoSrc(selected.photo_url)}
                  alt={selected.name}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap>
                    {selected.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lang?.onlineChat || "Text chat · instant replies"}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={handleClear}
                  title={lang?.clearChat || "Clear chat"}
                  disabled={!messages.length}
                >
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {lang?.selectInfluencerFirst || "Select an influencer to start"}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              background: `linear-gradient(180deg, ${alpha(
                theme.palette.primary.main,
                0.03,
              )} 0%, transparent 40%)`,
            }}
          >
            {!selected ? null : loadingChat ? (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircularProgress size={28} />
              </Box>
            ) : messages.length === 0 && !sending ? (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  opacity: 0.85,
                }}
              >
                <Avatar
                  src={photoSrc(selected.photo_url)}
                  sx={{ width: 72, height: 72 }}
                />
                <Typography variant="subtitle1" fontWeight={700}>
                  {selected.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  maxWidth={280}
                >
                  {lang?.chatEmptyHint ||
                    "Say hi — they reply in character, instantly (no video)."}
                </Typography>
              </Box>
            ) : (
              messages.map((m, idx) => {
                const isUser = m.role === "user";
                return (
                  <Box
                    key={m.id || `${m.role}_${idx}`}
                    sx={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                      gap: 1,
                      alignItems: "flex-end",
                    }}
                  >
                    {!isUser && (
                      <Avatar
                        src={photoSrc(selected.photo_url)}
                        sx={{ width: 28, height: 28 }}
                      />
                    )}
                    <Box
                      sx={{
                        maxWidth: "78%",
                        px: 1.5,
                        py: 1,
                        borderRadius: 2.5,
                        borderBottomRightRadius: isUser ? 0.5 : 2.5,
                        borderBottomLeftRadius: isUser ? 2.5 : 0.5,
                        bgcolor: isUser
                          ? theme.palette.primary.main
                          : alpha(theme.palette.text.primary, 0.06),
                        color: isUser
                          ? theme.palette.primary.contrastText
                          : theme.palette.text.primary,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                      >
                        {m.message}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            )}

            {sending && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  pl: 0.5,
                }}
              >
                <Avatar
                  src={photoSrc(selected?.photo_url)}
                  sx={{ width: 28, height: 28 }}
                />
                <Box
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.text.primary, 0.06),
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <CircularProgress size={14} />
                  <Typography variant="caption" color="text.secondary">
                    {lang?.typing || "Typing…"}
                  </Typography>
                </Box>
              </Box>
            )}
            <div ref={chatEndRef} />
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <TextField
              fullWidth
              size="small"
              disabled={!selected || sending}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                lang?.chatPlaceholder || "Type a message…"
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      color="primary"
                      onClick={handleSend}
                      disabled={!selected || sending || !message.trim()}
                    >
                      {sending ? (
                        <CircularProgress size={20} />
                      ) : (
                        <SendRounded />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default TalkingVideo;
