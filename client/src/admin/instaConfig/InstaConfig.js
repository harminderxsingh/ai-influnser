import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  InputAdornment,
  Stack,
  Divider,
  alpha,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";
import PageHeader from "../../common/PageHeader";
import {
  Instagram,
  AppRegistration,
  Key,
  Link,
  Save,
  ContentCopy,
  Check,
  Webhook,
  CallbackOutlined,
} from "@mui/icons-material";
import { GlobalContext } from "../../context/GlobalContext";

const InstaConfig = ({ lang }) => {
  const theme = useTheme();
  const { hitAxios, adminToken } = React.useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false); // ← new
  const [web, setWeb] = useState({});

  async function getWebPvt() {
    const res = await hitAxios({
      path: "/api/web/get_web_pvt",
      post: false,
      admin: true,
      token_user: adminToken,
    });
    if (res.data.success) {
      setWeb(res.data?.data || {});
    }
  }

  async function handleSave() {
    setLoading(true);
    await hitAxios({
      path: "/api/web/update_insta_config",
      post: true,
      admin: true,
      token_user: adminToken,
      obj: web,
    });
    setLoading(false);
  }

  function handleCopy(value, setter) {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  const webhookUrl = web?.instaWebhook || "";
  const webhookSecret = webhookUrl ? webhookUrl.split("/").pop() : "";
  const callbackUrl = web?.instaCallBack || ""; // ← new

  React.useEffect(() => {
    getWebPvt();
  }, []);

  const CopyRow = ({ label, value, copied, onCopy, color = "primary" }) => (
    <Box>
      <Typography
        variant="caption"
        fontWeight={600}
        color="text.secondary"
        sx={{ mb: 0.5, display: "block" }}
      >
        {label}
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: 1.5,
          py: 1,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.background.default, 0.6),
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontFamily: "monospace",
            wordBreak: "break-all",
            flex: 1,
            fontSize: 12,
            color: value ? "text.primary" : "text.disabled",
          }}
        >
          {value || "—"}
        </Typography>
        <Button
          size="small"
          variant={copied ? "outlined" : "contained"}
          color={copied ? "success" : color}
          startIcon={copied ? <Check /> : <ContentCopy />}
          disabled={!value}
          onClick={onCopy}
          sx={{
            borderRadius: 2,
            flexShrink: 0,
            textTransform: "none",
            minWidth: 90,
          }}
        >
          {copied ? lang?.copied : lang?.copy}
        </Button>
      </Stack>
    </Box>
  );

  return (
    <div>
      <Box>
        <PageHeader
          icon={Instagram}
          title={lang?.instaConfig}
          subtitle={lang?.instaConfigDes}
          primaryAction={
            <Button
              onClick={handleSave}
              disabled={loading}
              variant="contained"
              size="large"
              startIcon={<Save />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 4,
                boxShadow: `0 4px 14px ${theme.palette.primary.main}40`,
                "&:hover": {
                  boxShadow: `0 6px 20px ${theme.palette.primary.main}60`,
                },
              }}
            >
              {loading ? lang?.saving : lang?.instaConfigSave}
            </Button>
          }
        />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* ── Webhook Card ── */}
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}18, ${theme.palette.primary.main}08)`,
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Webhook sx={{ color: "success.main", fontSize: 22 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {lang?.instaWebhookTitle}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {lang?.instaWebhookHint}
                </Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={1.5}>
                {/* Webhook URL */}
                <CopyRow
                  label={lang?.instaWebhookUrl}
                  value={webhookUrl}
                  copied={copiedUrl}
                  onCopy={() => handleCopy(webhookUrl, setCopiedUrl)}
                  color="primary"
                />

                <Divider />

                {/* Verify Token / Secret */}
                <CopyRow
                  label={lang?.instaVerifyToken}
                  value={webhookSecret}
                  copied={copiedSecret}
                  onCopy={() => handleCopy(webhookSecret, setCopiedSecret)}
                  color="warning"
                />

                <Divider />

                {/* ── Callback URI ── */}
                <CopyRow
                  label={lang?.instaCallBackUrl}
                  value={callbackUrl}
                  copied={copiedCallback}
                  onCopy={() => handleCopy(callbackUrl, setCopiedCallback)}
                  color="secondary"
                />
              </Stack>
            </CardContent>
          </Card>

          {/* ── Credentials Card ── */}
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                background: `linear-gradient(135deg, ${theme.palette.error.main}18, ${theme.palette.error.main}12)`,
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Instagram sx={{ color: "primary.main", fontSize: 22 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {lang?.instaAppCredentials}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {lang?.instaConfigPortalHint}
                </Typography>
              </Box>
            </Box>
            <CardContent
              sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}
            >
              <TextField
                fullWidth
                label={lang?.instaAppId}
                placeholder={lang?.instaAppIdPlaceholder}
                value={web?.insta_app_id || ""}
                onChange={(e) =>
                  setWeb((p) => ({ ...p, insta_app_id: e.target.value }))
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AppRegistration
                        sx={{ color: "primary.main", fontSize: 20 }}
                      />
                    </InputAdornment>
                  ),
                }}
                helperText={lang?.instaAppIdHelper}
              />

              <TextField
                fullWidth
                label={lang?.instaAppSecret}
                placeholder={lang?.instaAppSecretPlaceholder}
                value={web?.insta_app_secret || ""}
                onChange={(e) =>
                  setWeb((p) => ({ ...p, insta_app_secret: e.target.value }))
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Key sx={{ color: "warning.main", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                helperText={lang?.instaAppSecretHelper}
              />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </div>
  );
};

export default InstaConfig;
