import React from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Paper,
  Checkbox,
  IconButton,
  Stack,
  alpha,
  useTheme,
  useMediaQuery,
  Snackbar,
} from "@mui/material";
import {
  ExpandMore,
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  SmartToy,
  KeyOutlined,
  LinkOutlined,
  TuneOutlined,
  CheckCircleOutline,
} from "@mui/icons-material";
import { GlobalContext } from "../../context/GlobalContext";
import CommonDialog from "../../common/CommonDialog";
import PageHeader from "../../common/PageHeader";

// ─────────────────────────────────────────
const FEATURES = [
  { key: "txt2img", label: "Text to Image" },
  { key: "img2img", label: "Image to Image" },
  { key: "reel", label: "Reel Maker" },
  { key: "showcase", label: "Product Showcase" },
  { key: "talking", label: "Talking Video" },
  { key: "txt2txt", label: "Text to Text (Content Writer)" },
];

const TXT2TXT_DEFAULTS = {
  txt2txt_job_id_path: "choices[0].message.content",
  txt2txt_state_path: "",
  txt2txt_success_state: "",
  txt2txt_failed_state: "",
  txt2txt_result_path: "choices[0].message.content",
  txt2txt_status_method: "GET",
  txt2txt_create_method: "POST",
  txt2txt_auth_type: "bearer",
  txt2txt_auth_header_key: "Authorization",
  txt2txt_auth_header_prefix: "Bearer",
};

const TALKING_DEFAULTS = {
  talking_job_id_path: "jobId",
  talking_state_path: "status",
  talking_success_state: "done",
  talking_failed_state: "failed",
  talking_result_path: "resultUrl",
  talking_status_method: "GET",
  talking_create_method: "POST",
  talking_auth_type: "bearer",
  talking_auth_header_key: "Authorization",
  talking_auth_header_prefix: "Bearer",
};

const defaultFeature = (key) => ({
  [`${key}_enabled`]: false,
  [`${key}_base_url`]: "",
  [`${key}_api_key`]: "",
  [`${key}_auth_type`]: "bearer",
  [`${key}_auth_header_key`]: "Authorization",
  [`${key}_auth_header_prefix`]: "Bearer",
  [`${key}_auth_body_key`]: "",
  [`${key}_auth_query_key`]: "",
  [`${key}_create_endpoint`]: "",
  [`${key}_create_method`]: "POST",
  [`${key}_create_payload`]: "",
  [`${key}_job_id_path`]: "data.taskId",
  [`${key}_status_endpoint`]: "",
  [`${key}_status_method`]: "GET",
  [`${key}_state_path`]: "data.state",
  [`${key}_success_state`]: "success",
  [`${key}_failed_state`]: "fail",
  [`${key}_result_path`]: "data.resultJson.resultUrls[0]",
});

const defaultForm = {
  name: "",
  provider_key: "",
  is_default: false,
  ...FEATURES.reduce((acc, f) => ({ ...acc, ...defaultFeature(f.key) }), {}),
  ...TALKING_DEFAULTS,
  ...TXT2TXT_DEFAULTS,
};

// ── GOOGLE AI — one provider; models per feature (Gemini / Imagen / Veo) ─────
const GOOGLE_PREFILL = {
  ...defaultForm,
  name: "Google AI",
  provider_key: "google",
  is_default: true,

  // Text-to-Text → Gemini
  txt2txt_enabled: true,
  txt2txt_base_url: "https://generativelanguage.googleapis.com",
  txt2txt_api_key: "",
  txt2txt_auth_type: "custom_header",
  txt2txt_auth_header_key: "x-goog-api-key",
  txt2txt_auth_header_prefix: "",
  txt2txt_create_endpoint:
    "/v1beta/models/gemini-2.0-flash:generateContent",
  txt2txt_create_method: "POST",
  txt2txt_create_payload: JSON.stringify(
    { model: "gemini-2.0-flash" },
    null,
    2,
  ),
  txt2txt_job_id_path: "candidates[0].content.parts[0].text",
  txt2txt_status_endpoint: "",
  txt2txt_status_method: "GET",
  txt2txt_state_path: "",
  txt2txt_success_state: "",
  txt2txt_failed_state: "",
  txt2txt_result_path: "candidates[0].content.parts[0].text",

  // Text-to-Image → Imagen (Google paid billing required; prefer Grok for free/credits)
  txt2img_enabled: false,
  txt2img_base_url: "https://generativelanguage.googleapis.com",
  txt2img_api_key: "",
  txt2img_auth_type: "custom_header",
  txt2img_auth_header_key: "x-goog-api-key",
  txt2img_auth_header_prefix: "",
  txt2img_create_endpoint: "/v1beta/models/imagen-4.0-fast-generate-001:predict",
  txt2img_create_method: "POST",
  txt2img_create_payload: JSON.stringify(
    {
      instances: [{ prompt: "{{prompt}}" }],
      parameters: { sampleCount: 1, aspectRatio: "9:16" },
    },
    null,
    2,
  ),
  txt2img_job_id_path: "predictions[0].bytesBase64Encoded",
  txt2img_status_endpoint: "",
  txt2img_status_method: "GET",
  txt2img_state_path: "",
  txt2img_success_state: "",
  txt2img_failed_state: "",
  txt2img_result_path: "@b64data(predictions[0].bytesBase64Encoded)",

  // Image-to-Image → Imagen (paid only)
  img2img_enabled: false,
  img2img_base_url: "https://generativelanguage.googleapis.com",
  img2img_api_key: "",
  img2img_auth_type: "custom_header",
  img2img_auth_header_key: "x-goog-api-key",
  img2img_auth_header_prefix: "",
  img2img_create_endpoint:
    "/v1beta/models/imagen-3.0-capability-001:predict",
  img2img_create_method: "POST",
  img2img_create_payload: JSON.stringify(
    {
      instances: [
        {
          prompt: "{{prompt}}",
          referenceImages: [
            {
              referenceType: "REFERENCE_TYPE_SUBJECT",
              referenceId: 1,
              referenceImage: {
                bytesBase64Encoded: "@url_to_b64:{{reference_url}}",
              },
            },
          ],
        },
      ],
      parameters: { sampleCount: 1, aspectRatio: "9:16" },
    },
    null,
    2,
  ),
  img2img_job_id_path: "predictions[0].bytesBase64Encoded",
  img2img_status_endpoint: "",
  img2img_status_method: "GET",
  img2img_state_path: "",
  img2img_success_state: "",
  img2img_failed_state: "",
  img2img_result_path: "@b64data(predictions[0].bytesBase64Encoded)",

  // Reel / Showcase / Talking → Veo
  reel_enabled: true,
  reel_base_url: "https://generativelanguage.googleapis.com",
  reel_api_key: "",
  reel_auth_type: "custom_header",
  reel_auth_header_key: "x-goog-api-key",
  reel_auth_header_prefix: "",
  reel_create_endpoint:
    "/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning",
  reel_create_method: "POST",
  reel_create_payload: JSON.stringify(
    {
      instances: [
        {
          prompt:
            "The character is performing the action from the reference video, cinematic motion, natural movement",
          image: {
            bytesBase64Encoded: "@url_to_b64:{{character_image_url}}",
            mimeType: "image/jpeg",
          },
        },
      ],
      parameters: {
        aspectRatio: "9:16",
        durationSeconds: 8,
        personGeneration: "allow_adult",
      },
    },
    null,
    2,
  ),
  reel_job_id_path: "name",
  reel_status_endpoint: "/v1beta/{{taskId}}",
  reel_status_method: "GET",
  reel_state_path: "done",
  reel_success_state: "true",
  reel_failed_state: "error",
  reel_result_path:
    "response.generateVideoResponse.generatedSamples[0].video.uri",

  showcase_enabled: true,
  showcase_base_url: "https://generativelanguage.googleapis.com",
  showcase_api_key: "",
  showcase_auth_type: "custom_header",
  showcase_auth_header_key: "x-goog-api-key",
  showcase_auth_header_prefix: "",
  showcase_create_endpoint:
    "/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning",
  showcase_create_method: "POST",
  showcase_create_payload: JSON.stringify(
    {
      instances: [
        {
          prompt: "{{text}}",
          image: {
            bytesBase64Encoded: "@url_to_b64:{{image_url_1}}",
            mimeType: "image/jpeg",
          },
          lastFrame: {
            bytesBase64Encoded: "@url_to_b64:{{image_url_2}}",
            mimeType: "image/jpeg",
          },
        },
      ],
      parameters: {
        aspectRatio: "{{aspect_ratio}}",
        durationSeconds: 8,
        personGeneration: "allow_adult",
      },
    },
    null,
    2,
  ),
  showcase_job_id_path: "name",
  showcase_status_endpoint: "/v1beta/{{taskId}}",
  showcase_status_method: "GET",
  showcase_state_path: "done",
  showcase_success_state: "true",
  showcase_failed_state: "error",
  showcase_result_path:
    "response.generateVideoResponse.generatedSamples[0].video.uri",

  talking_enabled: true,
  talking_base_url: "https://generativelanguage.googleapis.com",
  talking_api_key: "",
  talking_auth_type: "custom_header",
  talking_auth_header_key: "x-goog-api-key",
  talking_auth_header_prefix: "",
  talking_create_endpoint:
    "/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning",
  talking_create_method: "POST",
  talking_create_payload: JSON.stringify(
    {
      instances: [
        {
          prompt:
            'The person in the image talks directly to the camera and says: "{{text}}". Natural lip movement, clear speech, realistic talking-head, cinematic lighting, {{aspectRatio}} vertical framing.',
          image: {
            bytesBase64Encoded: "@url_to_b64:{{imageUrl}}",
            mimeType: "image/jpeg",
          },
        },
      ],
      parameters: {
        aspectRatio: "{{aspectRatio}}",
        durationSeconds: 8,
        personGeneration: "allow_adult",
      },
    },
    null,
    2,
  ),
  talking_job_id_path: "name",
  talking_status_endpoint: "/v1beta/{{taskId}}",
  talking_status_method: "GET",
  talking_state_path: "done",
  talking_success_state: "true",
  talking_failed_state: "error",
  talking_result_path:
    "response.generateVideoResponse.generatedSamples[0].video.uri",
};

// ── xAI GROK — full stack alternate (text + images + video + talking) ────────
const XAI_PREFILL = {
  ...defaultForm,
  name: "xAI Grok Imagine",
  provider_key: "xai_grok",
  is_default: false,

  txt2txt_enabled: true,
  txt2txt_base_url: "https://api.x.ai",
  txt2txt_api_key: "",
  txt2txt_auth_type: "bearer",
  txt2txt_auth_header_key: "Authorization",
  txt2txt_auth_header_prefix: "Bearer",
  txt2txt_create_endpoint: "/v1/chat/completions",
  txt2txt_create_method: "POST",
  txt2txt_create_payload: JSON.stringify(
    {
      model: "grok-3-mini",
      messages: [{ role: "user", content: "{{prompt}}" }],
    },
    null,
    2,
  ),
  txt2txt_job_id_path: "choices[0].message.content",
  txt2txt_status_endpoint: "",
  txt2txt_status_method: "GET",
  txt2txt_state_path: "",
  txt2txt_success_state: "",
  txt2txt_failed_state: "",
  txt2txt_result_path: "choices[0].message.content",

  txt2img_enabled: true,
  txt2img_base_url: "https://api.x.ai",
  txt2img_api_key: "",
  txt2img_auth_type: "bearer",
  txt2img_auth_header_key: "Authorization",
  txt2img_auth_header_prefix: "Bearer",
  txt2img_create_endpoint: "/v1/images/generations",
  txt2img_create_method: "POST",
  txt2img_create_payload: JSON.stringify(
    {
      model: "grok-imagine-image",
      prompt: "{{prompt}}",
      aspect_ratio: "9:16",
      n: 1,
    },
    null,
    2,
  ),
  txt2img_job_id_path: "data[0].url",
  txt2img_status_endpoint: "",
  txt2img_status_method: "GET",
  txt2img_state_path: "",
  txt2img_success_state: "",
  txt2img_failed_state: "",
  txt2img_result_path: "data[0].url",

  img2img_enabled: true,
  img2img_base_url: "https://api.x.ai",
  img2img_api_key: "",
  img2img_auth_type: "bearer",
  img2img_auth_header_key: "Authorization",
  img2img_auth_header_prefix: "Bearer",
  img2img_create_endpoint: "/v1/images/edits",
  img2img_create_method: "POST",
  img2img_create_payload: JSON.stringify(
    {
      model: "grok-imagine-image",
      prompt: "{{prompt}}",
      image: { url: "{{reference_url}}", type: "image_url" },
      n: 1,
    },
    null,
    2,
  ),
  img2img_job_id_path: "data[0].url",
  img2img_status_endpoint: "",
  img2img_status_method: "GET",
  img2img_state_path: "",
  img2img_success_state: "",
  img2img_failed_state: "",
  img2img_result_path: "data[0].url",

  reel_enabled: true,
  reel_base_url: "https://api.x.ai",
  reel_api_key: "",
  reel_auth_type: "bearer",
  reel_auth_header_key: "Authorization",
  reel_auth_header_prefix: "Bearer",
  reel_create_endpoint: "/v1/videos/generations",
  reel_create_method: "POST",
  reel_create_payload: JSON.stringify(
    {
      model: "grok-imagine-video",
      prompt:
        "The character is performing the action from the reference video, natural cinematic motion",
      image: { url: "{{character_image_url}}" },
      duration: 8,
      aspect_ratio: "9:16",
      resolution: "720p",
    },
    null,
    2,
  ),
  reel_job_id_path: "request_id",
  reel_status_endpoint: "/v1/videos/{{taskId}}",
  reel_status_method: "GET",
  reel_state_path: "status",
  reel_success_state: "done",
  reel_failed_state: "failed",
  reel_result_path: "video.url",

  showcase_enabled: true,
  showcase_base_url: "https://api.x.ai",
  showcase_api_key: "",
  showcase_auth_type: "bearer",
  showcase_auth_header_key: "Authorization",
  showcase_auth_header_prefix: "Bearer",
  showcase_create_endpoint: "/v1/videos/generations",
  showcase_create_method: "POST",
  showcase_create_payload: JSON.stringify(
    {
      model: "grok-imagine-video",
      prompt: "{{text}}",
      image: { url: "{{image_url_1}}" },
      duration: 8,
      aspect_ratio: "{{aspect_ratio}}",
      resolution: "720p",
    },
    null,
    2,
  ),
  showcase_job_id_path: "request_id",
  showcase_status_endpoint: "/v1/videos/{{taskId}}",
  showcase_status_method: "GET",
  showcase_state_path: "status",
  showcase_success_state: "done",
  showcase_failed_state: "failed",
  showcase_result_path: "video.url",

  talking_enabled: true,
  talking_base_url: "https://api.x.ai",
  talking_api_key: "",
  talking_auth_type: "bearer",
  talking_auth_header_key: "Authorization",
  talking_auth_header_prefix: "Bearer",
  talking_create_endpoint: "/v1/videos/generations",
  talking_create_method: "POST",
  talking_create_payload: JSON.stringify(
    {
      model: "grok-imagine-video",
      prompt:
        'The person in the image talks directly to the camera and says: "{{text}}". Natural lip movement, clear speech, realistic talking-head, {{aspectRatio}} framing.',
      image: { url: "{{imageUrl}}" },
      duration: 5,
      aspect_ratio: "{{aspectRatio}}",
      resolution: "720p",
    },
    null,
    2,
  ),
  talking_job_id_path: "request_id",
  talking_status_endpoint: "/v1/videos/{{taskId}}",
  talking_status_method: "GET",
  talking_state_path: "status",
  talking_success_state: "done",
  talking_failed_state: "failed",
  talking_result_path: "video.url",
};

// ── D-ID — fast lip-sync / talking-head (photo + TTS), ~seconds ─────────────
const DID_PREFILL = {
  ...defaultForm,
  name: "D-ID Lip Sync",
  provider_key: "d_id",
  is_default: false,

  txt2txt_enabled: false,
  txt2img_enabled: false,
  img2img_enabled: false,
  reel_enabled: false,
  showcase_enabled: false,

  talking_enabled: true,
  talking_base_url: "https://api.d-id.com",
  talking_api_key: "",
  talking_auth_type: "basic",
  talking_auth_header_key: "Authorization",
  talking_auth_header_prefix: "",
  talking_create_endpoint: "/talks",
  talking_create_method: "POST",
  talking_create_payload: JSON.stringify(
    {
      source_url: "{{imageUrl}}",
      script: {
        type: "text",
        input: "{{text}}",
        provider: {
          type: "microsoft",
          voice_id: "{{voice}}",
        },
      },
      config: { stitch: true },
    },
    null,
    2,
  ),
  talking_job_id_path: "id",
  talking_status_endpoint: "/talks/{{taskId}}",
  talking_status_method: "GET",
  talking_state_path: "status",
  talking_success_state: "done",
  talking_failed_state: "error,rejected",
  talking_result_path: "result_url",
};


const SectionCard = ({ icon: Icon, title, children }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.2,
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: alpha(theme.palette.primary.main, 0.06),
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {Icon && (
          <Icon fontSize="small" sx={{ color: theme.palette.primary.main }} />
        )}
        <Typography
          variant="caption"
          fontWeight={700}
          letterSpacing={1}
          textTransform="uppercase"
          color="primary"
        >
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Box>
  );
};

// ─────────────────────────────────────────
// PER-FEATURE AUTH MINI SECTION
// ─────────────────────────────────────────
const FeatureAuth = ({ featKey, form, set, lang, editMode = false }) => {
  const theme = useTheme();
  const authType = form[`${featKey}_auth_type`] || "bearer";
  const prefix = form[`${featKey}_auth_header_prefix`] || "";
  const headerKey = form[`${featKey}_auth_header_key`] || "X-API-Key";

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={8}>
        <TextField
          fullWidth
          size="small"
          label={lang?.baseUrl || "Base URL"}
          placeholder="https://generativelanguage.googleapis.com"
          value={form[`${featKey}_base_url`] || ""}
          onChange={(e) => set(`${featKey}_base_url`, e.target.value)}
          InputProps={{
            startAdornment: (
              <LinkOutlined
                fontSize="small"
                sx={{ mr: 1, color: "text.disabled" }}
              />
            ),
          }}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label={lang?.apiKey || "API Key"}
          placeholder={
            editMode
              ? lang?.apiKeyUpdatePlaceholder || "Paste new key to update"
              : "YOUR_API_KEY"
          }
          value={form[`${featKey}_api_key`] || ""}
          onChange={(e) => set(`${featKey}_api_key`, e.target.value)}
          helperText={
            editMode
              ? lang?.apiKeyUpdateHint ||
                "Leave as-is to keep current key, or paste a new one"
              : undefined
          }
          InputProps={{
            startAdornment: (
              <KeyOutlined
                fontSize="small"
                sx={{ mr: 1, color: "text.disabled" }}
              />
            ),
          }}
        />
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth size="small">
          <InputLabel>{lang?.authType || "Auth Type"}</InputLabel>
          <Select
            label={lang?.authType || "Auth Type"}
            value={authType}
            onChange={(e) => set(`${featKey}_auth_type`, e.target.value)}
          >
            <MenuItem value="bearer">
              Bearer Token — Authorization: Bearer xxx
            </MenuItem>
            <MenuItem value="basic">
              Basic Auth — Authorization: Basic base64(key)
            </MenuItem>
            <MenuItem value="custom_header">
              Custom Header — e.g. X-API-Key: xxx
            </MenuItem>
            <MenuItem value="body">
              Body Field — api_key inside request body
            </MenuItem>
            <MenuItem value="query_param">
              Query Param — ?key=xxx in URL
            </MenuItem>
            <MenuItem value="none">
              None — no API key (free public endpoints)
            </MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {authType === "bearer" && (
        <Grid item xs={12}>
          <Box
            sx={{
              px: 2,
              py: 1,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.success.main, 0.07),
              border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <CheckCircleOutline
              fontSize="small"
              sx={{ color: "success.main" }}
            />
            <Typography variant="caption" color="success.dark">
              Will send:{" "}
              <Box component="code" sx={{ fontSize: "0.75rem" }}>
                Authorization: Bearer API_KEY
              </Box>
            </Typography>
          </Box>
        </Grid>
      )}

      {authType === "custom_header" && (
        <>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Header Key"
              placeholder="X-API-Key"
              value={form[`${featKey}_auth_header_key`] || ""}
              onChange={(e) =>
                set(`${featKey}_auth_header_key`, e.target.value)
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Value Prefix (empty if none)"
              placeholder="Token"
              value={form[`${featKey}_auth_header_prefix`] || ""}
              onChange={(e) =>
                set(`${featKey}_auth_header_prefix`, e.target.value)
              }
            />
          </Grid>
          <Grid item xs={12}>
            <Alert
              severity="info"
              variant="outlined"
              sx={{ borderRadius: 1.5 }}
            >
              Preview:{" "}
              <code>
                {headerKey}: {prefix ? `${prefix} ` : ""}API_KEY
              </code>
            </Alert>
          </Grid>
        </>
      )}

      {authType === "body" && (
        <>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Body Field Name"
              placeholder="api_key"
              value={form[`${featKey}_auth_body_key`] || ""}
              onChange={(e) => set(`${featKey}_auth_body_key`, e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Alert
              severity="info"
              variant="outlined"
              sx={{ borderRadius: 1.5 }}
            >
              Payload will include:{" "}
              <code>{`{ "${form[`${featKey}_auth_body_key`] || "api_key"}": "API_KEY", ...rest }`}</code>
            </Alert>
          </Grid>
        </>
      )}

      {authType === "query_param" && (
        <>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Query Param Key"
              placeholder="key"
              value={form[`${featKey}_auth_query_key`] || ""}
              onChange={(e) => set(`${featKey}_auth_query_key`, e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Alert
              severity="info"
              variant="outlined"
              sx={{ borderRadius: 1.5 }}
            >
              Preview:{" "}
              <code>
                /endpoint?{form[`${featKey}_auth_query_key`] || "key"}=API_KEY
              </code>
            </Alert>
          </Grid>
        </>
      )}
    </Grid>
  );
};

// ─────────────────────────────────────────
// FEATURE BLOCK
// ─────────────────────────────────────────
const FeatureBlock = ({ feat, form, set, lang, editMode = false }) => {
  const theme = useTheme();
  const enabledKey = `${feat.key}_enabled`;
  const isEnabled = !!form[enabledKey];

  return (
    <Accordion
      variant="outlined"
      sx={{
        mb: 1,
        borderRadius: "10px !important",
        "&:before": { display: "none" },
        border: `1px solid ${isEnabled ? alpha(theme.palette.primary.main, 0.4) : theme.palette.divider}`,
        transition: "border-color 0.2s",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          borderRadius: 2,
          bgcolor: isEnabled
            ? alpha(theme.palette.primary.main, 0.05)
            : "transparent",
          transition: "background-color 0.2s",
          minHeight: 52,
        }}
      >
        <FormControlLabel
          onClick={(e) => e.stopPropagation()}
          control={
            <Switch
              checked={isEnabled}
              onChange={(e) => set(enabledKey, e.target.checked)}
              size="small"
              color="primary"
            />
          }
          label={
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="subtitle2" fontWeight={600}>
                {feat.label}
              </Typography>
              {isEnabled && (
                <Chip
                  label={lang?.enabled || "Enabled"}
                  size="small"
                  color="primary"
                  sx={{ height: 18, fontSize: "0.65rem" }}
                />
              )}
            </Stack>
          }
        />
      </AccordionSummary>

      {isEnabled && (
        <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
          <Grid sx={{ mt: 0.5 }} container spacing={2}>
            {/* ── CONNECTION & AUTH ── */}
            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" gap={1} mb={1}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    bgcolor: "info.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="white"
                    fontWeight={700}
                    lineHeight={1}
                  >
                    🔗
                  </Typography>
                </Box>
                <Typography
                  variant="overline"
                  fontWeight={700}
                  color="text.secondary"
                >
                  {lang?.connectionAuth || "Connection & Auth"}
                </Typography>
              </Stack>
              <FeatureAuth
                featKey={feat.key}
                form={form}
                set={set}
                lang={lang}
                editMode={editMode}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* ── PLACEHOLDER HINT ── */}
            <Grid item xs={12}>
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.info.main, 0.07),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.25)}`,
                }}
              >
                <Typography variant="caption" color="info.main">
                  Use <Box component="strong">{"{{variable}}"}</Box>{" "}
                  placeholders — e.g.{" "}
                  <Box component="code" sx={{ fontSize: "0.75rem" }}>
                    {"{{prompt}}"}
                  </Box>
                  ,{" "}
                  <Box component="code" sx={{ fontSize: "0.75rem" }}>
                    {"{{taskId}}"}
                  </Box>{" "}
                  · Result path also supports{" "}
                  <Box component="code" sx={{ fontSize: "0.75rem" }}>
                    {"JSON.stringify(data.response).resultUrls[0]"}
                  </Box>
                </Typography>
              </Box>
            </Grid>

            {/* ── STEP 1: CREATE JOB ── */}
            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="primary.contrastText"
                    fontWeight={700}
                    lineHeight={1}
                  >
                    1
                  </Typography>
                </Box>
                <Typography
                  variant="overline"
                  fontWeight={700}
                  color="text.secondary"
                >
                  {lang?.step1CreateJob || "Create Job Request"}
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>{lang?.method || "Method"}</InputLabel>
                <Select
                  label={lang?.method || "Method"}
                  value={form[`${feat.key}_create_method`] || "POST"}
                  onChange={(e) =>
                    set(`${feat.key}_create_method`, e.target.value)
                  }
                >
                  <MenuItem value="POST">POST</MenuItem>
                  <MenuItem value="GET">GET</MenuItem>
                  <MenuItem value="PUT">PUT</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={9}>
              <TextField
                fullWidth
                size="small"
                label={lang?.createEndpoint || "Create Endpoint"}
                placeholder="/api/v1/jobs/createTask"
                value={form[`${feat.key}_create_endpoint`] || ""}
                onChange={(e) =>
                  set(`${feat.key}_create_endpoint`, e.target.value)
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={5}
                label={lang?.requestPayload || "Request Payload (JSON)"}
                value={form[`${feat.key}_create_payload`] || ""}
                onChange={(e) =>
                  set(`${feat.key}_create_payload`, e.target.value)
                }
                inputProps={{
                  style: { fontFamily: "monospace", fontSize: "0.8rem" },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: alpha(theme.palette.grey[500], 0.04),
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label={lang?.jobIdPath || "Job ID Path"}
                placeholder="data.taskId"
                value={form[`${feat.key}_job_id_path`] || ""}
                onChange={(e) => set(`${feat.key}_job_id_path`, e.target.value)}
                helperText={
                  lang?.jobIdPathHelper ||
                  "Dot-notation path to extract job ID from create response"
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* ── STEP 2: POLL STATUS ── */}
            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    bgcolor: "secondary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="secondary.contrastText"
                    fontWeight={700}
                    lineHeight={1}
                  >
                    2
                  </Typography>
                </Box>
                <Typography
                  variant="overline"
                  fontWeight={700}
                  color="text.secondary"
                >
                  {lang?.step2PollStatus || "Poll Job Status"}
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>{lang?.method || "Method"}</InputLabel>
                <Select
                  label={lang?.method || "Method"}
                  value={form[`${feat.key}_status_method`] || "GET"}
                  onChange={(e) =>
                    set(`${feat.key}_status_method`, e.target.value)
                  }
                >
                  <MenuItem value="GET">GET</MenuItem>
                  <MenuItem value="POST">POST</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={9}>
              <TextField
                fullWidth
                size="small"
                label={lang?.statusEndpoint || "Status Endpoint"}
                placeholder="/api/v1/jobs/recordInfo?taskId={{taskId}}"
                value={form[`${feat.key}_status_endpoint`] || ""}
                onChange={(e) =>
                  set(`${feat.key}_status_endpoint`, e.target.value)
                }
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label={lang?.statePath || "State Path"}
                placeholder="data.state"
                value={form[`${feat.key}_state_path`] || ""}
                onChange={(e) => set(`${feat.key}_state_path`, e.target.value)}
                helperText={
                  lang?.statePathHelper ||
                  "Path to job state in status response"
                }
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label={lang?.successState || "Success State Value"}
                placeholder="success"
                value={form[`${feat.key}_success_state`] || ""}
                onChange={(e) =>
                  set(`${feat.key}_success_state`, e.target.value)
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": { borderColor: "success.main" },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label={lang?.failedState || "Failed State Value"}
                placeholder="fail"
                value={form[`${feat.key}_failed_state`] || ""}
                onChange={(e) =>
                  set(`${feat.key}_failed_state`, e.target.value)
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": { borderColor: "error.main" },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label={lang?.resultPath || "Result Media URL Path"}
                placeholder="data.resultJson.resultUrls[0]"
                value={form[`${feat.key}_result_path`] || ""}
                onChange={(e) => set(`${feat.key}_result_path`, e.target.value)}
                helperText={
                  lang?.resultPathHelper ||
                  'Dot-path e.g. "data.outputs[0]", or "@fetch(/path/{{taskId}}).images[0].url"'
                }
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      )}
    </Accordion>
  );
};

// ─────────────────────────────────────────
// PROVIDER CARD (mobile)
// ─────────────────────────────────────────
const ProviderCard = ({ p, lang, theme, onEdit, onDelete, onToggle, onSwitch }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      borderRadius: 2,
      transition: "box-shadow 0.2s",
      "&:hover": { boxShadow: 2 },
    }}
  >
    <Stack
      direction="row"
      alignItems="flex-start"
      justifyContent="space-between"
      mb={1}
    >
      <Stack direction="row" alignItems="center" gap={1}>
        <Box
          sx={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            bgcolor: p.is_active === 1 ? "success.main" : "text.disabled",
            flexShrink: 0,
            mt: 0.3,
          }}
        />
        <Box>
          <Typography variant="subtitle2" fontWeight={700} lineHeight={1.3}>
            {p.name}
          </Typography>
          <Box
            component="code"
            sx={{
              fontSize: "0.7rem",
              px: 0.8,
              py: 0.15,
              borderRadius: 0.8,
              bgcolor: alpha(theme.palette.grey[500], 0.12),
              color: "text.secondary",
            }}
          >
            {p.provider_key}
          </Box>
        </Box>
      </Stack>
      <Stack direction="row" gap={0.5}>
        {!(p.is_default === 1 && p.is_active === 1) && (
          <IconButton
            size="small"
            onClick={() => onSwitch(p.id)}
            title={lang?.useThisProvider || "Use this provider"}
            sx={{
              color: "success.main",
              bgcolor: alpha(theme.palette.success.main, 0.08),
              "&:hover": { bgcolor: alpha(theme.palette.success.main, 0.16) },
            }}
          >
            <CheckCircleOutline sx={{ fontSize: 16 }} />
          </IconButton>
        )}
        <IconButton
          size="small"
          onClick={() => onEdit(p)}
          sx={{
            color: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.16) },
          }}
        >
          <EditOutlined sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onDelete(p.id)}
          sx={{
            color: "error.main",
            bgcolor: alpha(theme.palette.error.main, 0.08),
            "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.16) },
          }}
        >
          <DeleteOutlined sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>
    </Stack>

    <Divider sx={{ my: 1 }} />

    <Stack spacing={0.8}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="caption"
          color="text.disabled"
          fontWeight={600}
          textTransform="uppercase"
          letterSpacing={0.5}
        >
          {lang?.features || "Features"}
        </Typography>
        <Box display="flex" gap={0.4} flexWrap="wrap" justifyContent="flex-end">
          {FEATURES.map((f) =>
            p[`${f.key}_enabled`] === 1 ? (
              <Chip
                key={f.key}
                label={f.label}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: "0.6rem", height: 18 }}
              />
            ) : null,
          )}
        </Box>
      </Stack>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="caption"
          color="text.disabled"
          fontWeight={600}
          textTransform="uppercase"
          letterSpacing={0.5}
        >
          {lang?.status || "Status"}
        </Typography>
        <Stack direction="row" alignItems="center" gap={1}>
          {p.is_default === 1 && (
            <Chip
              label={lang?.default || "Default"}
              size="small"
              color="warning"
              sx={{ fontWeight: 700, fontSize: "0.65rem", height: 20 }}
            />
          )}
          <Switch
            checked={p.is_active === 1}
            onChange={(e) => onToggle(p.id, e.target.checked)}
            size="small"
            color="success"
          />
        </Stack>
      </Stack>
    </Stack>
  </Paper>
);

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
const AiProviders = ({ lang }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { hitAxios } = React.useContext(GlobalContext);

  const [providers, setProviders] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [state, setState] = React.useState({ dialog: false, editMode: false });
  const [form, setForm] = React.useState(defaultForm);
  const [snack, setSnack] = React.useState({
    open: false,
    msg: "",
    severity: "error",
  });

  const showSnack = (msg, severity = "error") =>
    setSnack({ open: true, msg, severity });
  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  React.useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    const res = await hitAxios({
      path: "/api/ai/get_providers",
      post: false,
      admin: true,
    });
    if (res.data.success) setProviders(res.data.data);
  }

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleOpenDialog(provider = null) {
    if (provider) {
      const mapped = { ...defaultForm };
      Object.keys(defaultForm).forEach((k) => {
        if (provider[k] !== undefined && provider[k] !== null) {
          if (k.includes("_create_payload")) {
            if (typeof provider[k] === "object") {
              mapped[k] = JSON.stringify(provider[k], null, 2);
            } else if (typeof provider[k] === "string") {
              try {
                mapped[k] = JSON.stringify(JSON.parse(provider[k]), null, 2);
              } catch {
                mapped[k] = provider[k];
              }
            }
          } else {
            mapped[k] = provider[k];
          }
        }
      });
      mapped.id = provider.id;
      setForm(mapped);
      setState({ dialog: true, editMode: true });
    } else {
      setForm(defaultForm);
      setState({ dialog: true, editMode: false });
    }
  }

  function handleCloseDialog() {
    setState({ dialog: false, editMode: false });
  }

  async function handleSave() {
    for (const feat of FEATURES) {
      const pk = `${feat.key}_create_payload`;
      if (form[`${feat.key}_enabled`] && form[pk]) {
        try {
          JSON.parse(form[pk]);
        } catch {
          showSnack(
            `${lang?.invalidJson || "Invalid JSON in"} ${feat.label} payload`,
          );
          return;
        }
      }
    }

    setLoading(true);
    const payload = { ...form };
    delete payload._bulk_api_key;
    delete payload._id_locked;
    FEATURES.forEach((feat) => {
      const pk = `${feat.key}_create_payload`;
      if (payload[pk]) {
        try {
          payload[pk] = JSON.parse(payload[pk]);
        } catch {
          payload[pk] = null;
        }
      }
    });

    const path = state.editMode
      ? "/api/ai/update_provider"
      : "/api/ai/add_provider";
    const res = await hitAxios({ path, post: true, admin: true, obj: payload });
    setLoading(false);

    if (res.data.success) {
      showSnack(
        state.editMode
          ? lang?.providerUpdated || "Provider updated successfully"
          : lang?.providerAdded || "Provider added successfully",
        "success",
      );
      handleCloseDialog();
      fetchProviders();
    } else {
      showSnack(
        res.data.msg || lang?.somethingWentWrong || "Something went wrong",
      );
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(lang?.confirmDelete || "Delete this provider?")) return;
    const res = await hitAxios({
      path: "/api/ai/delete_provider",
      post: true,
      admin: true,
      obj: { id },
    });
    if (res.data.success) {
      showSnack(lang?.providerDeleted || "Provider deleted", "success");
      fetchProviders();
    } else {
      showSnack(
        res.data.msg || lang?.somethingWentWrong || "Something went wrong",
      );
    }
  }

  async function handleToggle(id, is_active) {
    const res = await hitAxios({
      path: "/api/ai/toggle_provider",
      post: true,
      admin: true,
      obj: { id, is_active },
    });
    if (!res.data.success)
      showSnack(
        res.data.msg || lang?.somethingWentWrong || "Something went wrong",
      );
    fetchProviders();
  }

  async function handleSwitch(id) {
    const res = await hitAxios({
      path: "/api/ai/switch_provider",
      post: true,
      admin: true,
      obj: { id },
    });
    if (res.data.success) {
      showSnack(
        res.data.msg ||
          lang?.providerSwitched ||
          "Provider switched successfully",
        "success",
      );
      fetchProviders();
    } else {
      showSnack(
        res.data.msg || lang?.somethingWentWrong || "Something went wrong",
      );
    }
  }

  return (
    <Box>
      <PageHeader
        title={lang?.aiProviders || "AI Providers"}
        subtitle={lang?.aiProvidersSubtitle || "Manage your AI provider APIs"}
        icon={SmartToy}
        primaryAction={
          <Button
            size="large"
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => handleOpenDialog()}
          >
            {lang?.addNew || "Add New"}
          </Button>
        }
      />

      {/* ── DESKTOP TABLE ── */}
      {!isMobile && (
        <Paper
          variant="outlined"
          sx={{ borderRadius: 2, overflow: "hidden", mt: 2 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}
              >
                {[
                  "Name",
                  "Key",
                  "Features",
                  "Default",
                  "Active",
                  "Actions",
                ].map((h) => (
                  <TableCell key={h}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      textTransform="uppercase"
                      letterSpacing={0.5}
                      color="text.secondary"
                    >
                      {h}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {providers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Stack alignItems="center" gap={1}>
                      <SmartToy sx={{ fontSize: 40, color: "text.disabled" }} />
                      <Typography variant="body2" color="text.secondary">
                        {lang?.noProviders ||
                          "No providers yet. Click Add New to get started."}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                providers.map((p) => (
                  <TableRow
                    key={p.id}
                    sx={{
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                      },
                      transition: "background-color 0.15s",
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor:
                              p.is_active === 1
                                ? "success.main"
                                : "text.disabled",
                          }}
                        />
                        <Typography variant="body2" fontWeight={600}>
                          {p.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Box
                        component="code"
                        sx={{
                          px: 1,
                          py: 0.3,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.grey[500], 0.1),
                          fontSize: "0.75rem",
                        }}
                      >
                        {p.provider_key}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {FEATURES.map((f) =>
                          p[`${f.key}_enabled`] === 1 ? (
                            <Chip
                              key={f.key}
                              label={f.label}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontSize: "0.65rem", height: 20 }}
                            />
                          ) : null,
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {p.is_default === 1 ? (
                        <Chip
                          label={lang?.default || "Default"}
                          size="small"
                          color="warning"
                          sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={p.is_active === 1}
                        onChange={(e) => handleToggle(p.id, e.target.checked)}
                        size="small"
                        color="success"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" gap={0.5}>
                        {!(p.is_default === 1 && p.is_active === 1) && (
                          <IconButton
                            size="small"
                            onClick={() => handleSwitch(p.id)}
                            title={lang?.useThisProvider || "Use this provider"}
                            sx={{
                              color: "success.main",
                              bgcolor: alpha(theme.palette.success.main, 0.08),
                              "&:hover": {
                                bgcolor: alpha(
                                  theme.palette.success.main,
                                  0.16,
                                ),
                              },
                            }}
                          >
                            <CheckCircleOutline fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(p)}
                          sx={{
                            color: "primary.main",
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            "&:hover": {
                              bgcolor: alpha(theme.palette.primary.main, 0.16),
                            },
                          }}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(p.id)}
                          sx={{
                            color: "error.main",
                            bgcolor: alpha(theme.palette.error.main, 0.08),
                            "&:hover": {
                              bgcolor: alpha(theme.palette.error.main, 0.16),
                            },
                          }}
                        >
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* ── MOBILE CARDS ── */}
      {isMobile && (
        <Box mt={2}>
          {providers.length === 0 ? (
            <Paper variant="outlined" sx={{ borderRadius: 2, py: 6 }}>
              <Stack alignItems="center" gap={1}>
                <SmartToy sx={{ fontSize: 40, color: "text.disabled" }} />
                <Typography variant="body2" color="text.secondary">
                  {lang?.noProviders ||
                    "No providers yet. Click Add New to get started."}
                </Typography>
              </Stack>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {providers.map((p) => (
                <ProviderCard
                  key={p.id}
                  p={p}
                  lang={lang}
                  theme={theme}
                  onEdit={handleOpenDialog}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  onSwitch={handleSwitch}
                />
              ))}
            </Stack>
          )}
        </Box>
      )}

      {/* ── DIALOG ── */}
      <CommonDialog
        open={state.dialog}
        onClose={handleCloseDialog}
        title={
          state.editMode
            ? lang?.editProvider || "Edit Provider"
            : lang?.addProvider || "Add New Provider"
        }
        icon={state.editMode ? EditOutlined : AddOutlined}
        maxWidth="md"
        fullWidth
      >
        <Grid sx={{ mt: 1 }} container spacing={2.5}>
          {/* PREFILL BANNER */}
          {!state.editMode && (
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px dashed ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.03),
                  width: "100%",
                }}
              >
                {/* Title row */}
                <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="text.primary"
                  >
                    ⚡ {lang?.quickPrefill || "Quick Prefill"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    —{" "}
                    {lang?.quickPrefillHint ||
                      "Load all fields for a known provider, then replace the API key."}
                  </Typography>
                </Stack>

                {/* Prefill buttons row */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  gap={1.5}
                  alignItems="stretch"
                  mb={1.5}
                  flexWrap="wrap"
                >
                  {/* Google AI — one entry, models per feature */}
                  <Box
                    sx={{
                      flex: "1 1 220px",
                      p: 1.5,
                      borderRadius: 1.5,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.35)}`,
                      bgcolor: alpha(theme.palette.success.main, 0.04),
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="success.main"
                    >
                      Google AI
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lang?.googleDesc ||
                        "Gemini text + Veo video. Images: enable Imagen only on paid Google, or use Grok"}
                    </Typography>
                    <Stack
                      direction="row"
                      gap={1}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        color="success"
                        fullWidth
                        onClick={() =>
                          setForm((prev) => ({
                            ...GOOGLE_PREFILL,
                            id: prev.id,
                            _id_locked: true,
                            _bulk_api_key: prev._bulk_api_key || "",
                          }))
                        }
                        sx={{ fontWeight: 700, flex: 1 }}
                      >
                        {lang?.prefillGoogle || "Prefill Google AI"}
                      </Button>
                      <Button
                        component="a"
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        variant="outlined"
                        color="success"
                        sx={{ whiteSpace: "nowrap", fontSize: "0.72rem" }}
                      >
                        {lang?.getGoogleKey || "Get API Key ↗"}
                      </Button>
                    </Stack>
                  </Box>

                  {/* xAI Grok */}
                  <Box
                    sx={{
                      flex: "1 1 220px",
                      p: 1.5,
                      borderRadius: 1.5,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.35)}`,
                      bgcolor: alpha(theme.palette.secondary.main, 0.04),
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="secondary.main"
                    >
                      xAI Grok
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lang?.xaiDesc ||
                        "Full stack — text, images, reel, showcase, talking (alternate to Google)"}
                    </Typography>
                    <Stack
                      direction="row"
                      gap={1}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        color="secondary"
                        fullWidth
                        onClick={() =>
                          setForm((prev) => ({
                            ...XAI_PREFILL,
                            id: prev.id,
                            _id_locked: true,
                            _bulk_api_key: prev._bulk_api_key || "",
                          }))
                        }
                        sx={{ fontWeight: 700, flex: 1 }}
                      >
                        {lang?.prefillXai || "Prefill xAI Grok"}
                      </Button>
                      <Button
                        component="a"
                        href="https://console.x.ai/"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        variant="outlined"
                        color="secondary"
                        sx={{ whiteSpace: "nowrap", fontSize: "0.72rem" }}
                      >
                        {lang?.getXaiKey || "Get API Key ↗"}
                      </Button>
                    </Stack>
                  </Box>

                  {/* D-ID Lip Sync */}
                  <Box
                    sx={{
                      flex: "1 1 220px",
                      p: 1.5,
                      borderRadius: 1.5,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.35)}`,
                      bgcolor: alpha(theme.palette.info.main, 0.04),
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="info.main"
                    >
                      D-ID Lip Sync
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lang?.didDesc ||
                        "Fast talking video — photo + TTS lip-sync in seconds (not full AI video gen)"}
                    </Typography>
                    <Stack
                      direction="row"
                      gap={1}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        color="info"
                        fullWidth
                        onClick={() =>
                          setForm((prev) => ({
                            ...DID_PREFILL,
                            id: prev.id,
                            _id_locked: true,
                            _bulk_api_key: prev._bulk_api_key || "",
                          }))
                        }
                        sx={{ fontWeight: 700, flex: 1 }}
                      >
                        {lang?.prefillDid || "Prefill D-ID"}
                      </Button>
                      <Button
                        component="a"
                        href="https://studio.d-id.com/account-settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        variant="outlined"
                        color="info"
                        sx={{ whiteSpace: "nowrap", fontSize: "0.72rem" }}
                      >
                        {lang?.getDidKey || "Get API Key ↗"}
                      </Button>
                    </Stack>
                  </Box>
                </Stack>

                <Typography variant="caption" color="text.disabled">
                  💡{" "}
                  {lang?.prefillNote ||
                    "For fast Talking Video, enable D-ID Lip Sync (paste username:password key). Grok/Veo are slower full video gens."}
                </Typography>
              </Box>
            </Grid>
          )}

          {/* PROVIDER INFO */}
          <Grid item xs={12}>
            <SectionCard
              icon={TuneOutlined}
              title={lang?.providerInfo || "Provider Info"}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label={lang?.providerName || "Provider Name"}
                    placeholder="Google AI"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((prev) => {
                        const next = { ...prev, name };
                        // Auto-fill Internal ID from name only when adding & not from prefill lock
                        if (!state.editMode && !prev._id_locked) {
                          next.provider_key = name
                            .toLowerCase()
                            .trim()
                            .replace(/[^a-z0-9]+/g, "_")
                            .replace(/^_+|_+$/g, "")
                            .slice(0, 40);
                        }
                        return next;
                      });
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label={
                      lang?.providerKey || "Internal ID (not your API key)"
                    }
                    placeholder="google"
                    value={form.provider_key}
                    disabled={state.editMode}
                    helperText={
                      state.editMode
                        ? lang?.cannotChangeKey ||
                          "Fixed after creation — this is only a database ID"
                        : lang?.providerKeyHint ||
                          "Auto-filled short ID for the database (e.g. google). Your secret API key goes in Update API Keys / feature fields — never here."
                    }
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      // Looks like a secret API key pasted in the wrong field → move it
                      if (
                        raw.length > 24 ||
                        /^(xai-|sk-|AIza|Bearer\s)/i.test(raw)
                      ) {
                        setForm((prev) => ({
                          ...prev,
                          _bulk_api_key: raw,
                          _id_locked: true,
                        }));
                        showSnack(
                          lang?.apiKeyWrongField ||
                            "Moved to API Key field. Internal ID stays a short slug (use Prefill Google / Gemini).",
                          "info",
                        );
                        return;
                      }
                      setForm((prev) => ({
                        ...prev,
                        _id_locked: true,
                        provider_key: raw
                          .toLowerCase()
                          .replace(/[^a-z0-9_]+/g, "_")
                          .replace(/^_+|_+$/g, ""),
                      }));
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!form.is_default}
                        onChange={(e) => set("is_default", e.target.checked)}
                        color="warning"
                      />
                    }
                    label={
                      <Typography variant="body2" fontWeight={500}>
                        {lang?.setAsDefault || "Set as Default Provider"}
                      </Typography>
                    }
                  />
                </Grid>
              </Grid>
            </SectionCard>
          </Grid>

          {/* API KEYS — add + edit */}
          <Grid item xs={12}>
            <SectionCard
              icon={KeyOutlined}
              title={
                state.editMode
                  ? lang?.updateApiKeys || "Update API Keys"
                  : lang?.setApiKeys || "Set API Key (secret)"
              }
            >
              <Alert
                severity="warning"
                variant="outlined"
                sx={{ mb: 2, borderRadius: 1.5 }}
              >
                {state.editMode
                  ? lang?.updateApiKeysHint ||
                    "Paste your secret API key here (xai-… / AIza…), Apply to enabled, then Update. Leave empty to keep the current key. Never put this in Internal ID."
                  : lang?.setApiKeysHint ||
                    "Paste your secret API key here once → Apply to enabled. Internal ID above is only a short slug (xai_grok) — not this secret."}
              </Alert>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ sm: "flex-start" }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label={lang?.newApiKey || "API Key (secret)"}
                  placeholder="xai-... / AIza... / sk-..."
                  value={form._bulk_api_key || ""}
                  onChange={(e) => set("_bulk_api_key", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <KeyOutlined
                        fontSize="small"
                        sx={{ mr: 1, color: "text.disabled" }}
                      />
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ whiteSpace: "nowrap", minWidth: 180, height: 40 }}
                  disabled={!String(form._bulk_api_key || "").trim()}
                  onClick={() => {
                    const key = String(form._bulk_api_key || "").trim();
                    if (!key) return;
                    setForm((prev) => {
                      const next = { ...prev, _bulk_api_key: "" };
                      FEATURES.forEach((feat) => {
                        if (prev[`${feat.key}_enabled`]) {
                          next[`${feat.key}_api_key`] = key;
                        }
                      });
                      return next;
                    });
                    showSnack(
                      state.editMode
                        ? lang?.apiKeysApplied ||
                            "API key applied to all enabled features — click Update to save"
                        : lang?.apiKeysAppliedAdd ||
                            "API key applied to all enabled features — click Add to save",
                      "success",
                    );
                  }}
                >
                  {lang?.applyToEnabled || "Apply to enabled"}
                </Button>
              </Stack>
            </SectionCard>
          </Grid>

          {/* FEATURES */}
          <Grid item xs={12}>
            <SectionCard
              icon={SmartToy}
              title={lang?.featuresConfig || "Features Configuration"}
            >
              <Alert
                severity="info"
                variant="outlined"
                sx={{ mb: 2, borderRadius: 1.5 }}
              >
                {lang?.featuresHint ||
                  "Each feature has its own Base URL, API Key and Auth — so you can mix providers per feature freely."}
              </Alert>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {FEATURES.map((feat) => (
                  <FeatureBlock
                    key={feat.key}
                    feat={feat}
                    form={form}
                    set={set}
                    lang={lang}
                    editMode={state.editMode}
                  />
                ))}
              </Box>
            </SectionCard>
          </Grid>

          {/* SAVE */}
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                onClick={handleCloseDialog}
                color="inherit"
                variant="outlined"
                fullWidth={isMobile}
              >
                {lang?.cancel || "Cancel"}
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={loading}
                startIcon={state.editMode ? <EditOutlined /> : <AddOutlined />}
                sx={{ minWidth: 160 }}
                fullWidth={isMobile}
              >
                {loading
                  ? lang?.saving || "Saving..."
                  : state.editMode
                    ? lang?.updateProvider || "Update Provider"
                    : lang?.addProvider || "Add Provider"}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </CommonDialog>

      {/* ── SNACKBAR ── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnack}
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AiProviders;
