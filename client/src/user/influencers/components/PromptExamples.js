import React from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Chip,
  IconButton,
  Divider,
  Stack,
  alpha,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  AutoAwesomeOutlined,
  ContentCopyOutlined,
  PersonOutlined,
  TuneOutlined,
} from "@mui/icons-material";
import { GlobalContext } from "../../../context/GlobalContext";

const TYPE_CONFIG = {
  new: { label: "New Influencer", color: "#8B5CF6", icon: PersonOutlined },
  variation: { label: "Variation", color: "#3B82F6", icon: TuneOutlined },
};

const PromptExamples = ({
  lang,
  name,
  description,
  creationType,
  prompt,
  onPromptChange,
}) => {
  const [prompts, setPrompts] = React.useState([]);
  const [filterType, setFilterType] = React.useState("new");
  const [recommendations, setRecommendations] = React.useState([]);
  const [recommendationLoading, setRecommendationLoading] =
    React.useState(false);
  const [recommendationError, setRecommendationError] = React.useState("");
  const [recommendationCredits, setRecommendationCredits] =
    React.useState(null);
  const { hitAxios } = React.useContext(GlobalContext);
  const theme = useTheme();

  const getPrompt = React.useCallback(async () => {
    const res = await hitAxios({
      path: "/api/admin/get_prompt_t",
      post: false,
      admin: false,
    });
    if (res?.data?.success) setPrompts(res.data.data);
  }, [hitAxios]);

  const filtered = prompts.filter((p) => p.type === filterType);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  async function generateRecommendations() {
    if (recommendationLoading) return;

    setRecommendationLoading(true);
    setRecommendationError("");

    try {
      const res = await hitAxios({
        path: "/api/prompt-recommendation/generate",
        post: true,
        admin: false,
        showLoading: false,
        obj: {
          type: "influencer",
          context: {
            name,
            description,
            creationType,
            promptSeed: prompt,
          },
        },
      });

      if (res?.data?.success) {
        setRecommendations(res.data.prompts || []);
        setRecommendationCredits(res.data.credits);
      } else {
        setRecommendationError(
          res?.data?.msg || "Could not generate prompt ideas",
        );
      }
    } catch (err) {
      setRecommendationError("Could not generate prompt ideas");
    } finally {
      setRecommendationLoading(false);
    }
  }

  React.useEffect(() => {
    getPrompt();
  }, [getPrompt]);

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: alpha(theme.palette.primary.main, 0.02),
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Header + Textarea */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <AutoAwesomeOutlined
          sx={{ color: theme.palette.primary.main, mr: 1 }}
        />
        <Typography variant="subtitle2" fontWeight={600}>
          {lang?.aiGenerationPrompt || "AI Generation Prompt"}
        </Typography>
      </Box>

      <TextField
        fullWidth
        multiline
        rows={5}
        placeholder={
          lang?.describeCharacterPrompt ||
          "Describe the character you want to generate in detail..."
        }
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        sx={{
          mb: 3,
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            bgcolor: theme.palette.background.paper,
          },
        }}
      />

      <Divider sx={{ my: 3 }} />

      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.secondary.main, 0.06),
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          gap={1.5}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              {lang?.recommendedPrompts || "Recommended Prompt Ideas"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {lang?.recommendedInfluencerPromptsDesc ||
                "Generate ready-to-use prompts from the character name and description."}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={
              recommendationLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <AutoAwesomeOutlined />
              )
            }
            disabled={recommendationLoading}
            onClick={generateRecommendations}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {recommendationLoading
              ? lang?.generating || "Generating..."
              : lang?.generateIdeas || "Generate Ideas"}
          </Button>
        </Stack>

        {recommendationError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {recommendationError}
          </Alert>
        )}

        {recommendations.length > 0 && (
          <Stack spacing={1.25} sx={{ mt: 2 }}>
            {recommendationCredits !== null && (
              <Typography variant="caption" color="text.secondary">
                {lang?.creditsUsed || "Credits used"}: {recommendationCredits}
              </Typography>
            )}
            {recommendations.map((item, index) => (
              <Paper
                key={`${item.title}-${index}`}
                onClick={() => onPromptChange(item.prompt)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  cursor: "pointer",
                  border: `1px solid ${theme.palette.divider}`,
                  "&:hover": {
                    borderColor: theme.palette.secondary.main,
                    bgcolor: alpha(theme.palette.secondary.main, 0.04),
                  },
                }}
              >
                <Typography variant="caption" fontWeight={800}>
                  {item.title || `${lang?.idea || "Idea"} ${index + 1}`}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {item.prompt}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      {/* Section title + Type toggle */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          {lang?.professionalExamples || "💡 Professional Examples"}
        </Typography>

        <ToggleButtonGroup
          value={filterType}
          exclusive
          size="small"
          onChange={(_, val) => val && setFilterType(val)}
        >
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <ToggleButton
              key={key}
              value={key}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.72rem",
                px: 1.5,
                py: 0.5,
                "&.Mui-selected": {
                  bgcolor: alpha(cfg.color, 0.12),
                  color: cfg.color,
                  borderColor: alpha(cfg.color, 0.4),
                },
              }}
            >
              <cfg.icon sx={{ fontSize: 14, mr: 0.6 }} />
              {cfg.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {/* Dynamic Prompt Cards */}
      {filtered.length === 0 ? (
        <Typography
          variant="body2"
          color="text.disabled"
          textAlign="center"
          py={3}
        >
          {lang?.noTemplates || "No templates available"}
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {filtered.map((item) => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.new;
            return (
              <Paper
                key={item.id}
                onClick={() => onPromptChange(item.prompt)}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  cursor: "pointer",
                  border: `1px solid ${theme.palette.divider}`,
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: alpha(cfg.color, 0.5),
                    bgcolor: alpha(cfg.color, 0.03),
                    transform: "translateY(-1px)",
                    boxShadow: `0 4px 16px ${alpha(cfg.color, 0.1)}`,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Chip
                    size="small"
                    label={`#${item.id}`}
                    sx={{
                      height: 20,
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      bgcolor: alpha(cfg.color, 0.1),
                      color: cfg.color,
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(item.prompt);
                    }}
                    sx={{
                      color: "text.disabled",
                      "&:hover": {
                        color: cfg.color,
                        bgcolor: alpha(cfg.color, 0.08),
                      },
                    }}
                  >
                    <ContentCopyOutlined sx={{ fontSize: 15 }} />
                  </IconButton>
                </Box>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.7,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {item.prompt}
                </Typography>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Pro Tips */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.info.main, 0.08),
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
        }}
      >
        <Typography
          variant="caption"
          fontWeight={700}
          color="info.main"
          display="block"
          gutterBottom
        >
          {lang?.proTips || "💡 Pro Tips for Better Results:"}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          component="div"
          sx={{ lineHeight: 1.8, whiteSpace: "pre-line" }}
        >
          {lang?.proTipsDesc ||
            '• Include "Full body shot" or "Head to toe" for complete figure\n• Specify age, build, height for accurate generation\n• Describe clothing, pose, and background details\n• Add "8K resolution, photorealistic" for quality\n• Mention lighting: "studio lighting", "natural light", etc.'}
        </Typography>
      </Box>
    </Box>
  );
};

export default PromptExamples;
