import React from "react";
import PageHeader from "../../common/PageHeader";
import { GlobalContext } from "../../context/GlobalContext";
import {
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
  Chip,
  InputAdornment,
  Alert,
} from "@mui/material";
import {
  Google as GoogleIcon,
  Login as LoginIcon,
  Key,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";

const SocialLogin = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const [sData, setSData] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  async function getSocialLoginData() {
    const res = await hitAxios({
      path: "/api/web/get_social_login_admin",
      post: false,
      admin: true,
    });
    if (res.data.success) {
      setSData(res.data.data);
    }
  }

  async function handleUpdate() {
    setLoading(true);
    const res = await hitAxios({
      path: "/api/web/update_social_login_data",
      post: true,
      admin: true,
      obj: sData,
    });
    if (res.data.success) {
      setSData(res.data.data);
      getSocialLoginData();
    }
  }

  React.useEffect(() => {
    getSocialLoginData();
  }, []);

  return (
    <Box>
      <PageHeader
        title={lang?.socialLogin || "Social Login"}
        subtitle={
          lang?.socialLoginSub ||
          "Configure third-party login providers for faster authentication"
        }
        icon={LoginIcon}
        primaryAction={
          <Button
            onClick={handleUpdate}
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ fontWeight: 600, px: 3 }}
          >
            {lang?.saveChanges || "Save Changes"}
          </Button>
        }
      />

      <Stack spacing={3}>
        {/* ── Info Banner ─────────────────────────────────────────────────── */}
        <Alert severity="info" variant="outlined">
          {lang?.socialLoginInfo ||
            "Social login allows users to sign in using their existing accounts. Make sure to configure the correct OAuth credentials from each provider's developer console."}
        </Alert>

        {/* ── Google Login Card ────────────────────────────────────────────── */}
        <Card variant="outlined">
          <CardContent sx={{ p: 3 }}>
            {/* Card Header */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                {/* Google Icon Badge */}
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: "background.default",
                    border: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <GoogleIcon sx={{ color: "#4285F4", fontSize: 24 }} />
                </Box>

                <Box>
                  <Typography variant="h6" fontWeight={600} lineHeight={1.2}>
                    {lang?.googleLogin || "Google Login"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lang?.googleLoginDesc ||
                      "OAuth 2.0 — Google Identity Platform"}
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            {/* Client ID Field */}
            <Stack spacing={1}>
              <Typography variant="body2" fontWeight={500} color="text.primary">
                {lang?.googleClientId || "Google OAuth Client ID"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {lang?.googleClientIdDesc ||
                  'Get this from Google Cloud Console → APIs & Services → Credentials → "OAuth 2.0 Client IDs"'}
              </Typography>
              <TextField
                fullWidth
                value={sData?.google_login_id || ""}
                onChange={(e) =>
                  setSData({ ...sData, google_login_id: e.target.value })
                }
                placeholder="123456789012-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Key fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mt: 0.5 }}
              />
            </Stack>

            {/* How to get Client ID guide */}
            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: "action.hover",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="caption"
                fontWeight={600}
                color="text.secondary"
                display="block"
                mb={1}
              >
                📋{" "}
                {lang?.howToGetClientId || "How to get your Google Client ID:"}
              </Typography>
              <Stack spacing={0.5}>
                {[
                  lang?.googleStep1 || "1. Go to console.cloud.google.com",
                  lang?.googleStep2 || "2. Create or select a project",
                  lang?.googleStep3 ||
                    "3. Navigate to APIs & Services → Credentials",
                  lang?.googleStep4 ||
                    '4. Click "Create Credentials" → OAuth 2.0 Client ID',
                  lang?.googleStep5 ||
                    "5. Set Application type to Web application",
                  lang?.googleStep6 ||
                    "6. Add your domain to Authorized JavaScript origins",
                ].map((step, i) => (
                  <Typography
                    key={i}
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ lineHeight: 1.8 }}
                  >
                    {step}
                  </Typography>
                ))}
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default SocialLogin;
