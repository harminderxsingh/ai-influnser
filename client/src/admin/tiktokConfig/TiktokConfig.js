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
  AppRegistration,
  Key,
  Save,
  ContentCopy,
  Check,
  Webhook,
} from "@mui/icons-material";
import { GlobalContext } from "../../context/GlobalContext";
import TikTokIcon from "../../common/TikTokIcon";

const TiktokConfig = ({ lang }) => {
  const theme = useTheme();
  const { hitAxios, adminToken } = React.useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);
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
      path: "/api/web/update_tiktok_config",
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

  const webhookUrl = web?.tiktokWebhook || "";
  const webhookSecret = webhookUrl ? webhookUrl.split("/").pop() : "";
  const callbackUrl = web?.tiktokCallBack || "";

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
          icon={TikTokIcon}
          title={lang?.tiktokConfig}
          subtitle={lang?.tiktokConfigDes}
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
              {loading ? lang?.saving : lang?.tiktokConfigSave}
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
                  {lang?.tiktokWebhookTitle}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {lang?.tiktokWebhookHint}
                </Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={1.5}>
                {/* Webhook URL */}
                <CopyRow
                  label={lang?.tiktokWebhookUrl}
                  value={webhookUrl}
                  copied={copiedUrl}
                  onCopy={() => handleCopy(webhookUrl, setCopiedUrl)}
                  color="primary"
                />

                <Divider />

                {/* Verify Token / Secret */}
                <CopyRow
                  label={lang?.tiktokVerifyToken}
                  value={webhookSecret}
                  copied={copiedSecret}
                  onCopy={() => handleCopy(webhookSecret, setCopiedSecret)}
                  color="warning"
                />

                <Divider />

                {/* Callback URI */}
                <CopyRow
                  label={lang?.tiktokCallBackUrl}
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
              <TikTokIcon sx={{ color: "primary.main", fontSize: 22 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {lang?.tiktokAppCredentials}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {lang?.tiktokConfigPortalHint}
                </Typography>
              </Box>
            </Box>

            <CardContent
              sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}
            >
              <TextField
                fullWidth
                label={lang?.tiktokClientKey}
                placeholder={lang?.tiktokClientKeyPlaceholder}
                value={web?.tiktok_client_key || ""}
                onChange={(e) =>
                  setWeb((p) => ({ ...p, tiktok_client_key: e.target.value }))
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
                helperText={lang?.tiktokClientKeyHelper}
              />

              <TextField
                fullWidth
                label={lang?.tiktokClientSecret}
                placeholder={lang?.tiktokClientSecretPlaceholder}
                value={web?.tiktok_client_secret || ""}
                onChange={(e) =>
                  setWeb((p) => ({
                    ...p,
                    tiktok_client_secret: e.target.value,
                  }))
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Key sx={{ color: "warning.main", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                helperText={lang?.tiktokClientSecretHelper}
              />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </div>
  );
};

export default TiktokConfig;
