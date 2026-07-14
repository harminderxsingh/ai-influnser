import React from "react";
import PageHeader from "../../common/PageHeader";
import {
  AutoAwesome,
  ContentCopy,
  DeleteOutline,
  TipsAndUpdatesOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { GlobalContext } from "../../context/GlobalContext";

const TONES = ["engaging", "professional", "friendly", "luxury", "witty", "urgent"];
const LANGUAGES = ["English", "Hindi", "Spanish", "French", "Arabic", "Portuguese"];

const TextContentWriter = ({ lang }) => {
  const theme = useTheme();
  const { hitAxios } = React.useContext(GlobalContext);

  const [types, setTypes] = React.useState([]);
  const [creditFee, setCreditFee] = React.useState(3);
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState("");

  const [contentType, setContentType] = React.useState("caption");
  const [topic, setTopic] = React.useState("");
  const [tone, setTone] = React.useState("engaging");
  const [language, setLanguage] = React.useState("English");
  const [extra, setExtra] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [usedProvider, setUsedProvider] = React.useState("");

  const activeType = types.find((t) => t.id === contentType) || types[0];

  async function loadMeta() {
    const res = await hitAxios({
      path: "/api/text-content/suggestions",
      post: false,
      admin: false,
      showLoading: false,
    });
    if (res?.data?.success) {
      setTypes(res.data.data || []);
      setCreditFee(res.data.credits || 3);
      if (res.data.data?.[0]?.id) setContentType(res.data.data[0].id);
    }
  }

  async function loadHistory() {
    const res = await hitAxios({
      path: "/api/text-content/get_all",
      post: false,
      admin: false,
      showLoading: false,
    });
    if (res?.data?.success) setHistory(res.data.data || []);
  }

  React.useEffect(() => {
    loadMeta();
    loadHistory();
  }, []);

  async function handleGenerate() {
    if (!topic.trim()) {
      setError(lang?.enterTopic || "Please enter your topic or words");
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await hitAxios({
        path: "/api/text-content/generate",
        post: true,
        admin: false,
        obj: { topic, contentType, tone, language, extra },
      });
      if (res?.data?.success) {
        setResult(res.data.data?.content || "");
        setUsedProvider(res.data.data?.provider || "");
        loadHistory();
      } else {
        setError(res?.data?.msg || lang?.somethingWentWrong || "Generation failed");
      }
    } catch {
      setError(lang?.somethingWentWrong || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(lang?.confirmDelete || "Delete this item?")) return;
    await hitAxios({
      path: "/api/text-content/delete",
      post: true,
      admin: false,
      obj: { id },
    });
    loadHistory();
    if (result) setResult("");
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <Box>
      <PageHeader
        icon={AutoAwesome}
        title={lang?.textContentWriter || "Content Writer"}
        subtitle={
          lang?.textContentWriterSub ||
          "Type your idea, pick a suggested prompt, and generate ready-to-use text content"
        }
      />

      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        {lang?.textProviderNote ||
          "Uses Google AI (Gemini) for text. Images use Imagen on the same provider. Credits still apply."}
      </Alert>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Paper
            variant="outlined"
            sx={{ p: 2.5, borderRadius: 2, height: "100%" }}
          >
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
              {lang?.contentType || "Content type"}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} mb={2.5}>
              {types.map((t) => (
                <Chip
                  key={t.id}
                  label={t.label}
                  clickable
                  color={contentType === t.id ? "primary" : "default"}
                  variant={contentType === t.id ? "filled" : "outlined"}
                  onClick={() => setContentType(t.id)}
                />
              ))}
            </Stack>

            <Stack direction="row" alignItems="center" gap={1} mb={1}>
              <TipsAndUpdatesOutlined fontSize="small" color="warning" />
              <Typography variant="subtitle2" fontWeight={700}>
                {lang?.suggestedPrompts || "Suggested prompts"}
              </Typography>
            </Stack>
            <Stack gap={1} mb={2.5}>
              {(activeType?.suggestions || []).map((s) => (
                <Box
                  key={s}
                  onClick={() => setTopic(s)}
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 1.5,
                    cursor: "pointer",
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor:
                      topic === s
                        ? alpha(theme.palette.primary.main, 0.08)
                        : "transparent",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                    },
                  }}
                >
                  <Typography variant="body2">{s}</Typography>
                </Box>
              ))}
            </Stack>

            <TextField
              fullWidth
              multiline
              minRows={4}
              label={lang?.yourWords || "Your topic / words"}
              placeholder={
                lang?.yourWordsPlaceholder ||
                "Write your idea in your own words, or tap a suggestion above…"
              }
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>{lang?.tone || "Tone"}</InputLabel>
                  <Select
                    label={lang?.tone || "Tone"}
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                  >
                    {TONES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>{lang?.language || "Language"}</InputLabel>
                  <Select
                    label={lang?.language || "Language"}
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    {LANGUAGES.map((l) => (
                      <MenuItem key={l} value={l}>
                        {l}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              size="small"
              multiline
              minRows={2}
              label={lang?.extraNotes || "Extra notes (optional)"}
              placeholder={
                lang?.extraNotesPlaceholder ||
                "Brand name, audience, length, must-include phrases…"
              }
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              sx={{ mb: 2 }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <AutoAwesome />
                )
              }
              onClick={handleGenerate}
            >
              {loading
                ? lang?.generating || "Generating…"
                : `${lang?.generateContent || "Generate content"} (${creditFee} ${lang?.credits || "credits"})`}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper
            variant="outlined"
            sx={{ p: 2.5, borderRadius: 2, minHeight: 280, mb: 2.5 }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              mb={1.5}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  {lang?.generatedContent || "Generated content"}
                </Typography>
                {usedProvider && (
                  <Typography variant="caption" color="text.secondary">
                    {lang?.viaProvider || "via"} {usedProvider}
                  </Typography>
                )}
              </Box>
              {result && (
                <Tooltip title={copied ? lang?.copied || "Copied!" : lang?.copy || "Copy"}>
                  <IconButton size="small" onClick={() => copyText(result)}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            {result ? (
              <Typography
                variant="body2"
                sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}
              >
                {result}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {lang?.generatedContentEmpty ||
                  "Your generated text will appear here."}
              </Typography>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
              {lang?.recentContent || "Recent generations"}
            </Typography>
            {history.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {lang?.noTextContentYet || "No content yet — generate your first one."}
              </Typography>
            ) : (
              <Stack divider={<Divider />} spacing={1.5}>
                {history.slice(0, 12).map((item) => (
                  <Box key={item.id}>
                    <Stack
                      direction="row"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      gap={1}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Chip
                          size="small"
                          label={item.content_type}
                          sx={{ mb: 0.5, height: 22, fontSize: "0.7rem" }}
                        />
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          noWrap
                          title={item.topic}
                        >
                          {item.topic}
                        </Typography>
                        {item.status === "success" && item.result && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              mt: 0.5,
                            }}
                          >
                            {item.result}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        {item.result && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              setResult(item.result);
                              setTopic(item.topic || "");
                              setContentType(item.content_type || "caption");
                            }}
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(item.id)}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TextContentWriter;
