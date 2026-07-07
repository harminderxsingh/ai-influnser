import React from "react";
import {
  Box,
  Button,
  Grid,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Chip,
  alpha,
  useTheme,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  ContactMail,
  SaveOutlined,
  ContentCopyOutlined,
  PreviewOutlined,
  CodeOutlined,
} from "@mui/icons-material";
import PageHeader from "../../common/PageHeader";
import { GlobalContext } from "../../context/GlobalContext";

const TEMPLATE_VARS = {
  email_template_welcome: [
    { var: "{{user_email}}", label: "User Email" },
    { var: "{{date}}", label: "Date" },
    { var: "{{login_url}}", label: "Login URL" },
  ],
  // ── UPDATED ──────────────────────────────────────────
  email_template_pass_recovery: [
    { var: "{{user_email}}", label: "User Email" },
    { var: "{{reset_link}}", label: "Reset Link" }, // ← changed
    { var: "{{date}}", label: "Date" },
  ],
  // ─────────────────────────────────────────────────────
  email_template_usage_update: [
    { var: "{{user_email}}", label: "User Email" },
    { var: "{{task_name}}", label: "Task Name" },
    { var: "{{task_description}}", label: "Task Description" },
    { var: "{{task_status}}", label: "Task Status" },
    { var: "{{date_time}}", label: "Date & Time" },
  ],
  email_template_plan_activation: [
    { var: "{{user_email}}", label: "User Email" },
    { var: "{{plan_name}}", label: "Plan Name" },
    { var: "{{plan_expiry}}", label: "Plan Expiry Date" },
    { var: "{{plan_credits}}", label: "Plan Credits" },
    { var: "{{date}}", label: "Activation Date" },
  ],
};

const DEFAULT_TEMPLATES = {
  email_template_welcome: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
  <div style="background:#4f46e5;padding:28px 32px;">
    <h2 style="color:#fff;margin:0;font-size:22px;">👋 Welcome to Our Platform!</h2>
  </div>
  <div style="padding:28px 32px;background:#ffffff;">
    <p style="color:#374151;font-size:15px;margin:0 0 16px;">Hi there! Your account has been created successfully.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
      <tr style="background:#f9fafb;">
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;width:40%;">Email</td>
        <td style="padding:8px 12px;color:#111827;">{{user_email}}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;">Joined On</td>
        <td style="padding:8px 12px;color:#111827;">{{date}}</td>
      </tr>
    </table>
    <a href="{{login_url}}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">Go to Dashboard →</a>
  </div>
  <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e0e0e0;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">This email was sent automatically. Please do not reply.</p>
  </div>
</div>`,

  email_template_pass_recovery: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
  <div style="background:#dc2626;padding:28px 32px;">
    <h2 style="color:#fff;margin:0;font-size:22px;">🔐 Password Recovery</h2>
  </div>
  <div style="padding:28px 32px;background:#ffffff;">
    <p style="color:#374151;font-size:15px;margin:0 0 16px;">Your password has been reset. Here are your new credentials:</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
      <tr style="background:#f9fafb;">
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;width:40%;">Email</td>
        <td style="padding:8px 12px;color:#111827;">{{user_email}}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;">New Password</td>
        <td style="padding:8px 12px;color:#111827;font-family:monospace;font-weight:700;">{{new_password}}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;">Date</td>
        <td style="padding:8px 12px;color:#111827;">{{date}}</td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:13px;">Please change your password after logging in.</p>
  </div>
  <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e0e0e0;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">This email was sent automatically. Please do not reply.</p>
  </div>
</div>`,

  email_template_usage_update: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
  <div style="background:#0891b2;padding:28px 32px;">
    <h2 style="color:#fff;margin:0;font-size:22px;">📋 Task Update</h2>
  </div>
  <div style="padding:28px 32px;background:#ffffff;">
    <p style="color:#374151;font-size:15px;margin:0 0 16px;">Here is an update on your recent task activity.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
      <tr style="background:#f9fafb;">
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;width:40%;">Task</td>
        <td style="padding:8px 12px;color:#111827;">{{task_name}}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;">Description</td>
        <td style="padding:8px 12px;color:#111827;">{{task_description}}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;">Status</td>
        <td style="padding:8px 12px;color:#111827;">{{task_status}}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;">Date & Time</td>
        <td style="padding:8px 12px;color:#111827;">{{date_time}}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;">Account</td>
        <td style="padding:8px 12px;color:#111827;">{{user_email}}</td>
      </tr>
    </table>
  </div>
  <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e0e0e0;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">This email was sent automatically. Please do not reply.</p>
  </div>
</div>`,

  email_template_plan_activation: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
  <div style="background:#16a34a;padding:28px 32px;">
    <h2 style="color:#fff;margin:0;font-size:22px;">🚀 Plan Activated!</h2>
  </div>
  <div style="padding:28px 32px;background:#ffffff;">
    <p style="color:#374151;font-size:15px;margin:0 0 16px;">Your plan has been activated successfully.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
      <tr style="background:#f9fafb;">
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;width:40%;">Account</td>
        <td style="padding:8px 12px;color:#111827;">{{user_email}}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;">Plan</td>
        <td style="padding:8px 12px;color:#111827;font-weight:700;">{{plan_name}}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;">Credits</td>
        <td style="padding:8px 12px;color:#111827;">{{plan_credits}}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;">Expires On</td>
        <td style="padding:8px 12px;color:#111827;">{{plan_expiry}}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:8px 12px;color:#6b7280;font-weight:600;">Activated On</td>
        <td style="padding:8px 12px;color:#111827;">{{date}}</td>
      </tr>
    </table>
  </div>
  <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e0e0e0;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">This email was sent automatically. Please do not reply.</p>
  </div>
</div>`,
};

const TABS = (lang) => [
  { key: "email_template_welcome", label: lang?.tabWelcome || "Welcome" },
  {
    key: "email_template_pass_recovery",
    label: lang?.tabPassRecovery || "Password Reset",
  },
  {
    key: "email_template_usage_update",
    label: lang?.tabUsageUpdate || "Usage Update",
  },
  {
    key: "email_template_plan_activation",
    label: lang?.tabPlanActivation || "Plan Activation",
  },
];

const EmailTemplates = ({ lang }) => {
  const theme = useTheme();
  const { hitAxios } = React.useContext(GlobalContext);

  const [activeTab, setActiveTab] = React.useState(0);
  const [templates, setTemplates] = React.useState({
    email_template_welcome: "",
    email_template_pass_recovery: "",
    email_template_usage_update: "",
    email_template_plan_activation: "",
  });
  const [preview, setPreview] = React.useState(false);

  const tabs = TABS(lang);
  const activeKey = tabs[activeTab].key;
  const hasContent = Boolean(templates[activeKey]);

  React.useEffect(() => {
    setPreview(false);
  }, [activeTab]);
  React.useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    const res = await hitAxios({
      path: "/api/admin/get_email_templates",
      post: false,
      admin: true,
    });
    if (res?.data?.success && res.data.data) {
      const d = res.data.data;
      setTemplates({
        email_template_welcome: d.email_template_welcome || "",
        email_template_pass_recovery: d.email_template_pass_recovery || "",
        email_template_usage_update: d.email_template_usage_update || "",
        email_template_plan_activation: d.email_template_plan_activation || "",
      });
    }
  }

  async function handleSave() {
    await hitAxios({
      path: "/api/admin/save_email_templates",
      post: true,
      admin: true,
      obj: templates,
    });
  }

  function insertVar(variable) {
    const textarea = document.getElementById("template-editor");
    if (!textarea) {
      setTemplates((p) => ({ ...p, [activeKey]: p[activeKey] + variable }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = templates[activeKey];
    const next = val.substring(0, start) + variable + val.substring(end);
    setTemplates((p) => ({ ...p, [activeKey]: next }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + variable.length,
        start + variable.length,
      );
    }, 0);
  }

  return (
    <Box>
      <PageHeader
        title={lang?.emailTemplates || "Email Templates"}
        subtitle={
          lang?.emailTemplatesSub ||
          "Manage and customize your transactional email templates"
        }
        icon={ContactMail}
        primaryAction={
          <Button
            variant="contained"
            size="large"
            startIcon={<SaveOutlined />}
            onClick={handleSave}
          >
            {lang?.saveTemplates || "Save Templates"}
          </Button>
        }
      />

      {/* TABS */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((t) => (
            <Tab
              key={t.key}
              label={t.label}
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
          ))}
        </Tabs>
      </Box>

      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        {/* ── LEFT: EDITOR ── */}
        <Grid item xs={12} lg={8}>
          <Box
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            {/* Toolbar */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                px: 2,
                py: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack direction="row" alignItems="center" gap={1}>
                <CodeOutlined
                  fontSize="small"
                  sx={{ color: "text.disabled" }}
                />
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                >
                  {lang?.htmlEditor || "HTML Editor"}
                </Typography>
              </Stack>

              <Stack direction="row" gap={1} alignItems="center">
                {!hasContent && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      setTemplates((p) => ({
                        ...p,
                        [activeKey]: DEFAULT_TEMPLATES[activeKey],
                      }))
                    }
                    sx={{ textTransform: "none", fontSize: "0.75rem" }}
                  >
                    {lang?.importDefault || "Import Default"}
                  </Button>
                )}

                {hasContent && (
                  <Tooltip
                    title={lang?.resetTooltip || "Reset to default template"}
                  >
                    <Button
                      size="small"
                      variant="text"
                      color="warning"
                      onClick={() =>
                        setTemplates((p) => ({
                          ...p,
                          [activeKey]: DEFAULT_TEMPLATES[activeKey],
                        }))
                      }
                      sx={{ textTransform: "none", fontSize: "0.75rem" }}
                    >
                      {lang?.reset || "Reset"}
                    </Button>
                  </Tooltip>
                )}

                <Tooltip
                  title={
                    preview
                      ? lang?.showEditor || "Show editor"
                      : lang?.previewHtml || "Preview HTML"
                  }
                >
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => setPreview((p) => !p)}
                      disabled={!hasContent}
                    >
                      <PreviewOutlined
                        fontSize="small"
                        sx={{
                          color: preview ? "primary.main" : "text.disabled",
                        }}
                      />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>

            {/* Editor or Preview */}
            {preview && hasContent ? (
              <Box
                sx={{ p: 2, minHeight: 460, bgcolor: "#fff", overflow: "auto" }}
                dangerouslySetInnerHTML={{ __html: templates[activeKey] }}
              />
            ) : (
              <TextField
                id="template-editor"
                multiline
                fullWidth
                rows={20}
                placeholder={
                  lang?.noTemplateYet ||
                  `No template set yet.\nClick "Import Default" to load a starter or write your own HTML here.`
                }
                value={templates[activeKey]}
                onChange={(e) =>
                  setTemplates((p) => ({ ...p, [activeKey]: e.target.value }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 0,
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    "& fieldset": { border: "none" },
                  },
                }}
              />
            )}
          </Box>
        </Grid>

        {/* ── RIGHT: VARIABLES ── */}
        <Grid item xs={12} lg={4}>
          <Box
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              overflow: "hidden",
              position: { lg: "sticky" },
              top: { lg: 80 },
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.2,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                letterSpacing={1}
                textTransform="uppercase"
                color="primary"
              >
                {lang?.availableVariables || "Available Variables"}
              </Typography>
            </Box>

            <Box sx={{ p: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={1.5}
              >
                {lang?.variableInsertHint ||
                  "Click a variable to insert it at your cursor position."}
              </Typography>

              <Stack direction="row" flexWrap="wrap" gap={1}>
                {TEMPLATE_VARS[activeKey].map(({ var: v, label }) => (
                  <Tooltip
                    key={v}
                    title={`${lang?.insertTooltip || "Insert"} ${v}`}
                  >
                    <Chip
                      label={label}
                      size="small"
                      onClick={() => insertVar(v)}
                      onDelete={() => navigator.clipboard.writeText(v)}
                      deleteIcon={
                        <Tooltip
                          title={lang?.copyTooltip || "Copy to clipboard"}
                        >
                          <ContentCopyOutlined
                            sx={{ fontSize: "13px !important" }}
                          />
                        </Tooltip>
                      }
                      sx={{
                        fontFamily: "monospace",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: "primary.main",
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        "& .MuiChip-deleteIcon": {
                          color: alpha(theme.palette.primary.main, 0.5),
                        },
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.15),
                        },
                      }}
                    />
                  </Tooltip>
                ))}
              </Stack>

              <Box
                sx={{
                  mt: 2.5,
                  p: 1.5,
                  bgcolor: alpha(theme.palette.warning.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  borderRadius: 1.5,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  fontWeight={600}
                  mb={0.5}
                >
                  💡 {lang?.howItWorksTitle || "How it works"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {lang?.howItWorksBody ||
                    `Variables like {{user_email}} are replaced with real values when the email is sent. Use the exact variable name including the double curly braces.`}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmailTemplates;
