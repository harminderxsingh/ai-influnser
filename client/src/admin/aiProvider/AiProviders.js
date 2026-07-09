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
];

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
};

const USEVELIX_PREFILL = {
  ...defaultForm,
  name: "Usevelix",
  provider_key: "usevelix",
  is_default: false,

  // ── TEXT TO IMAGE ──
  txt2img_enabled: true,
  txt2img_base_url: "https://usevelix.com",
  txt2img_api_key: "",
  txt2img_auth_type: "bearer",
  txt2img_auth_header_key: "Authorization",
  txt2img_auth_header_prefix: "Bearer",
  txt2img_create_endpoint: "/api/v1/generate/text-to-image",
  txt2img_create_method: "POST",
  txt2img_create_payload: JSON.stringify({ prompt: "{{prompt}}" }, null, 2),
  txt2img_job_id_path: "jobId",
  txt2img_status_endpoint: "/api/v1/jobs/{{taskId}}",
  txt2img_status_method: "GET",
  txt2img_state_path: "status",
  txt2img_success_state: "done",
  txt2img_failed_state: "failed",
  txt2img_result_path: "resultUrl",

  // ── IMAGE TO IMAGE ──
  img2img_enabled: true,
  img2img_base_url: "https://usevelix.com",
  img2img_api_key: "",
  img2img_auth_type: "bearer",
  img2img_auth_header_key: "Authorization",
  img2img_auth_header_prefix: "Bearer",
  img2img_create_endpoint: "/api/v1/generate/smart-edit",
  img2img_create_method: "POST",
  img2img_create_payload: JSON.stringify(
    { imageUrl: "{{reference_url}}", prompt: "{{prompt}}" },
    null,
    2,
  ),
  img2img_job_id_path: "jobId",
  img2img_status_endpoint: "/api/v1/jobs/{{taskId}}",
  img2img_status_method: "GET",
  img2img_state_path: "status",
  img2img_success_state: "done",
  img2img_failed_state: "failed",
  img2img_result_path: "resultUrl",

  // ── REEL MAKER ──
  reel_enabled: true,
  reel_base_url: "https://usevelix.com",
  reel_api_key: "",
  reel_auth_type: "bearer",
  reel_auth_header_key: "Authorization",
  reel_auth_header_prefix: "Bearer",
  reel_create_endpoint: "/api/v1/generate/motion-video",
  reel_create_method: "POST",
  reel_create_payload: JSON.stringify(
    {
      imageUrl: "{{character_image_url}}",
      videoUrl: "{{reference_video_url}}",
      aspectRatio: "9:16",
    },
    null,
    2,
  ),
  reel_job_id_path: "jobId",
  reel_status_endpoint: "/api/v1/jobs/{{taskId}}",
  reel_status_method: "GET",
  reel_state_path: "status",
  reel_success_state: "done",
  reel_failed_state: "failed",
  reel_result_path: "resultUrl",

  // ── PRODUCT SHOWCASE ──
  showcase_enabled: true,
  showcase_base_url: "https://usevelix.com",
  showcase_api_key: "",
  showcase_auth_type: "bearer",
  showcase_auth_header_key: "Authorization",
  showcase_auth_header_prefix: "Bearer",
  showcase_create_endpoint: "/api/v1/generate/first-last-frame-video",
  showcase_create_method: "POST",
  showcase_create_payload: JSON.stringify(
    {
      firstFrameUrl: "{{image_url_1}}",
      lastFrameUrl: "{{image_url_2}}",
      prompt: "{{text}}",
    },
    null,
    2,
  ),
  showcase_job_id_path: "jobId",
  showcase_status_endpoint: "/api/v1/jobs/{{taskId}}",
  showcase_status_method: "GET",
  showcase_state_path: "status",
  showcase_success_state: "done",
  showcase_failed_state: "failed",
  showcase_result_path: "resultUrl",

  // ── TALKING VIDEO ──
  talking_enabled: true,
  talking_base_url: "https://usevelix.com",
  talking_api_key: "",
  talking_auth_type: "bearer",
  talking_auth_header_key: "Authorization",
  talking_auth_header_prefix: "Bearer",
  talking_create_endpoint: "/api/v1/generate/talking-video",
  talking_create_method: "POST",
  talking_create_payload: JSON.stringify(
    {
      imageUrl: "{{imageUrl}}",
      text: "{{text}}",
      voice: "{{voice}}",
      lang: "{{lang}}",
      gender: "{{gender}}",
      voiceStyle: "{{voiceStyle}}",
      projectStyle: "{{projectStyle}}",
      aspectRatio: "{{aspectRatio}}",
      characterStyle: "{{characterStyle}}",
    },
    null,
    2,
  ),
  talking_job_id_path: "jobId",
  talking_status_endpoint: "/api/v1/jobs/{{taskId}}",
  talking_status_method: "GET",
  talking_state_path: "status",
  talking_success_state: "done",
  talking_failed_state: "failed",
  talking_result_path: "resultUrl",
};

// ── KIE PREFILL ──────────────────────────────────────────────────────────────
const KIE_PREFILL = {
  ...defaultForm,
  name: "Kie.ai",
  provider_key: "kie_ai",
  is_default: true,

  // ── TEXT TO IMAGE ──
  txt2img_enabled: true,
  txt2img_base_url: "https://api.kie.ai",
  txt2img_api_key: "",
  txt2img_auth_type: "bearer",
  txt2img_auth_header_key: "Authorization",
  txt2img_auth_header_prefix: "Bearer",
  txt2img_create_endpoint: "/api/v1/jobs/createTask",
  txt2img_create_method: "POST",
  txt2img_create_payload: JSON.stringify(
    {
      model: "flux-2/pro-text-to-image",
      input: { prompt: "{{prompt}}", aspect_ratio: "9:16", resolution: "1K" },
    },
    null,
    2,
  ),
  txt2img_job_id_path: "data.taskId",
  txt2img_status_endpoint: "/api/v1/jobs/recordInfo?taskId={{taskId}}",
  txt2img_status_method: "GET",
  txt2img_state_path: "data.state",
  txt2img_success_state: "success",
  txt2img_failed_state: "fail",
  txt2img_result_path: "data.resultJson.resultUrls[0]",

  // ── IMAGE TO IMAGE ──
  img2img_enabled: true,
  img2img_base_url: "https://api.kie.ai",
  img2img_api_key: "",
  img2img_auth_type: "bearer",
  img2img_auth_header_key: "Authorization",
  img2img_auth_header_prefix: "Bearer",
  img2img_create_endpoint: "/api/v1/jobs/createTask",
  img2img_create_method: "POST",
  img2img_create_payload: JSON.stringify(
    {
      model: "flux-2/pro-image-to-image",
      input: {
        input_urls: ["{{reference_url}}"],
        prompt: "{{prompt}}",
        aspect_ratio: "9:16",
        resolution: "1K",
      },
    },
    null,
    2,
  ),
  img2img_job_id_path: "data.taskId",
  img2img_status_endpoint: "/api/v1/jobs/recordInfo?taskId={{taskId}}",
  img2img_status_method: "GET",
  img2img_state_path: "data.state",
  img2img_success_state: "success",
  img2img_failed_state: "fail",
  img2img_result_path: "data.resultJson.resultUrls[0]",

  // ── REEL ──
  reel_enabled: true,
  reel_base_url: "https://api.kie.ai",
  reel_api_key: "",
  reel_auth_type: "bearer",
  reel_auth_header_key: "Authorization",
  reel_auth_header_prefix: "Bearer",
  reel_create_endpoint: "/api/v1/jobs/createTask",
  reel_create_method: "POST",
  reel_create_payload: JSON.stringify(
    {
      model: "kling-2.6/motion-control",
      input: {
        prompt:
          "The character is performing the action from the reference video",
        input_urls: ["{{character_image_url}}"],
        video_urls: ["{{reference_video_url}}"],
        character_orientation: "video",
        mode: "720p",
      },
    },
    null,
    2,
  ),
  reel_job_id_path: "data.taskId",
  reel_status_endpoint: "/api/v1/jobs/recordInfo?taskId={{taskId}}",
  reel_status_method: "GET",
  reel_state_path: "data.state",
  reel_success_state: "success",
  reel_failed_state: "fail",
  reel_result_path: "data.resultJson.resultUrls[0]",

  // ── PRODUCT SHOWCASE (veo) ──
  showcase_enabled: true,
  showcase_base_url: "https://api.kie.ai",
  showcase_api_key: "",
  showcase_auth_type: "bearer",
  showcase_auth_header_key: "Authorization",
  showcase_auth_header_prefix: "Bearer",
  showcase_auth_body_key: "",
  showcase_auth_query_key: "",
  showcase_create_endpoint: "/api/v1/veo/generate",
  showcase_create_method: "POST",
  showcase_create_payload: JSON.stringify(
    {
      prompt: "{{text}}",
      imageUrls: ["{{image_url_1}}", "{{image_url_2}}"],
      model: "veo3_fast",
      generationType: "{{generation_type}}",
      aspect_ratio: "{{aspect_ratio}}",
      enableTranslation: true,
    },
    null,
    2,
  ),
  showcase_job_id_path: "data.taskId",
  showcase_status_endpoint: "/api/v1/veo/record-info?taskId={{taskId}}",
  showcase_status_method: "GET",
  showcase_state_path: "data.successFlag",
  showcase_success_state: "1",
  showcase_failed_state: "0",
  // supports both plain path AND JSON.stringify() syntax:
  showcase_result_path: "data.response.resultUrls[0]",
};

// ─────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────
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
const FeatureAuth = ({ featKey, form, set, lang }) => {
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
          placeholder="https://api.kie.ai"
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
          value={form[`${featKey}_api_key`] || ""}
          onChange={(e) => set(`${featKey}_api_key`, e.target.value)}
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
            <MenuItem value="custom_header">
              Custom Header — e.g. X-API-Key: xxx
            </MenuItem>
            <MenuItem value="body">
              Body Field — api_key inside request body
            </MenuItem>
            <MenuItem value="query_param">
              Query Param — ?key=xxx in URL
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
const FeatureBlock = ({ feat, form, set, lang }) => {
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
                  'Dot-path e.g. "data.response.resultUrls[0]" or "JSON.stringify(data.response).resultUrls[0]" for encoded nodes'
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
const ProviderCard = ({ p, lang, theme, onEdit, onDelete, onToggle }) => (
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
                >
                  {/* Usevelix — prioritised */}
                  <Box
                    sx={{
                      flex: 1,
                      p: 1.5,
                      borderRadius: 1.5,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="primary.main"
                      >
                        Usevelix
                      </Typography>
                      <Chip
                        label={lang?.recommended || "Recommended"}
                        size="small"
                        color="primary"
                        sx={{ fontSize: "0.6rem", height: 18 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {lang?.usevelixDesc ||
                        "Text-to-Image, Image-to-Image, Reel Maker & Product showcase & Talking Video"}
                    </Typography>
                    <Stack
                      direction="row"
                      gap={1}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        fullWidth
                        onClick={() =>
                          setForm((prev) => ({
                            ...USEVELIX_PREFILL,
                            id: prev.id,
                          }))
                        }
                        sx={{ fontWeight: 700, flex: 1 }}
                      >
                        ⚡ {lang?.prefillUsevelix || "Prefill Usevelix"}
                      </Button>
                      <Button
                        component="a"
                        href="https://usevelix.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ whiteSpace: "nowrap", fontSize: "0.72rem" }}
                      >
                        {lang?.getUsevelixKey || "Get API Key ↗"}
                      </Button>
                    </Stack>
                  </Box>

                  {/* Kie.ai */}
                  <Box
                    sx={{
                      flex: 1,
                      p: 1.5,
                      borderRadius: 1.5,
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
                      bgcolor: alpha(theme.palette.warning.main, 0.04),
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="warning.main"
                    >
                      Kie.ai
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lang?.kieDesc ||
                        "Text-to-Image, Image-to-Image, Reel Maker & Short product showcase"}
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
                        color="warning"
                        fullWidth
                        onClick={() =>
                          setForm((prev) => ({ ...KIE_PREFILL, id: prev.id }))
                        }
                        sx={{ fontWeight: 700, flex: 1 }}
                      >
                        {lang?.prefillKie || "Prefill Kie.ai"}
                      </Button>
                      <Button
                        component="a"
                        href="https://kie.ai?ref=b1ffffca8ec596f4f351df51d5f14cde"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        variant="outlined"
                        color="warning"
                        sx={{ whiteSpace: "nowrap", fontSize: "0.72rem" }}
                      >
                        {lang?.getKieKey || "Get API Key ↗"}
                      </Button>
                    </Stack>
                  </Box>
                </Stack>

                <Typography variant="caption" color="text.disabled">
                  💡{" "}
                  {lang?.prefillNote ||
                    "All fields are pre-configured — just enter your API key in each feature section."}
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
                    placeholder="Kie.ai"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label={lang?.providerKey || "Provider Key"}
                    placeholder="kie_ai"
                    value={form.provider_key}
                    disabled={state.editMode}
                    helperText={
                      state.editMode
                        ? lang?.cannotChangeKey ||
                          "Cannot change after creation"
                        : ""
                    }
                    onChange={(e) =>
                      set(
                        "provider_key",
                        e.target.value.toLowerCase().replace(/\s+/g, "_"),
                      )
                    }
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
