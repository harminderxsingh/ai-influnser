import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Container,
} from "@mui/material";
import {
  LockOutlined,
  Visibility,
  VisibilityOff,
  CheckCircleOutline,
  ErrorOutline,
  AdminPanelSettings,
  ArrowBack,
} from "@mui/icons-material";
import { useLocation, useHistory } from "react-router-dom";
import { GlobalContext } from "../context/GlobalContext";
import { TranslateContext } from "../context/TranslateContext";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const AdminPasswordRecovery = () => {
  const queryParams = useQuery();
  const token = queryParams.get("token");
  const history = useHistory();
  const { hitAxios } = React.useContext(GlobalContext);
  const { lang } = React.useContext(TranslateContext);

  const [state, setState] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const passwordRules = [
    {
      label: lang?.ruleMin8 || "At least 8 characters",
      pass: state.password.length >= 8,
    },
    {
      label: lang?.ruleNumber || "Contains a number",
      pass: /\d/.test(state.password),
    },
    {
      label: lang?.ruleUppercase || "Contains uppercase letter",
      pass: /[A-Z]/.test(state.password),
    },
    {
      label: lang?.ruleMatch || "Passwords match",
      pass:
        state.password === state.confirmPassword &&
        state.confirmPassword.length > 0,
    },
  ];

  const allRulesPassed = passwordRules.every((r) => r.pass);

  async function handleReset() {
    if (!allRulesPassed) return;
    setLoading(true);
    const res = await hitAxios({
      path: "/api/admin/reset_password",
      post: true,
      admin: false,
      obj: { token, password: state.password },
    });
    setResult(res.data);
    setLoading(false);
  }

  // ── Invalid / missing token ──────────────────────────────────────────────
  if (!token) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #0A0A0F 0%, #1A1A24 100%)"
              : "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)",
        }}
        p={3}
      >
        <Box textAlign="center" maxWidth={400}>
          <ErrorOutline sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            {lang?.invalidResetLink || "Invalid Reset Link"}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {lang?.invalidResetLinkDesc ||
              "This reset link is missing or invalid. Please request a new one."}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => history.push("/admin/login")}
            sx={{
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            }}
          >
            {lang?.backToLogin || "Back to Login"}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #0A0A0F 0%, #1A1A24 100%)"
            : "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(26, 26, 36, 0.8)"
                : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            border: (theme) =>
              `1px solid ${
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)"
              }`,
          }}
        >
          {/* ── Success State ── */}
          {result?.success ? (
            <Box textAlign="center">
              <CheckCircleOutline
                sx={{ fontSize: 72, color: "success.main", mb: 2 }}
              />
              <Typography variant="h5" fontWeight={600} gutterBottom>
                {lang?.passwordResetSuccess || "Password Reset!"}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={4}>
                {lang?.adminPasswordResetSuccessDesc ||
                  "Your admin password has been updated. You can now log in with your new password."}
              </Typography>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => history.push("/admin/login")}
                sx={{
                  fontWeight: 600,
                  background:
                    "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                }}
              >
                {lang?.backToLogin || "Back to Login"}
              </Button>
            </Box>
          ) : (
            <>
              {/* Header */}
              <Box sx={{ mb: 4, textAlign: "center" }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                  }}
                >
                  <AdminPanelSettings sx={{ fontSize: 40, color: "#fff" }} />
                </Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {lang?.setNewPassword || "Set New Password"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {lang?.setNewPasswordDesc ||
                    "Choose a strong password to protect your admin account."}
                </Typography>
              </Box>

              {/* Error */}
              {result && !result.success && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {result.msg}
                </Alert>
              )}

              <Stack spacing={2.5}>
                {/* New Password */}
                <TextField
                  fullWidth
                  label={lang?.newPassword || "New Password"}
                  type={showPassword ? "text" : "password"}
                  value={state.password}
                  onChange={(e) =>
                    setState({ ...state, password: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Confirm Password */}
                <TextField
                  fullWidth
                  label={lang?.confirmPassword || "Confirm Password"}
                  type={showConfirm ? "text" : "password"}
                  value={state.confirmPassword}
                  onChange={(e) =>
                    setState({ ...state, confirmPassword: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirm(!showConfirm)}
                          edge="end"
                          size="small"
                        >
                          {showConfirm ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Rules */}
                {state.password.length > 0 && (
                  <Box
                    sx={{
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
                      {lang?.passwordRequirements || "Password requirements"}
                    </Typography>
                    <Stack spacing={0.5}>
                      {passwordRules.map((rule, i) => (
                        <Stack
                          key={i}
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: rule.pass
                                ? "success.main"
                                : "text.disabled",
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            variant="caption"
                            color={
                              rule.pass ? "success.main" : "text.secondary"
                            }
                          >
                            {rule.label}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Submit */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleReset}
                  disabled={!allRulesPassed || loading}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    background:
                      "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)",
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    lang?.resetPassword || "Reset Password"
                  )}
                </Button>

                <Divider />

                <Button
                  fullWidth
                  variant="text"
                  startIcon={<ArrowBack />}
                  onClick={() => history.push("/admin/login")}
                  sx={{ color: "text.secondary" }}
                >
                  {lang?.backToLogin || "Back to Login"}
                </Button>
              </Stack>
            </>
          )}
        </Paper>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", mt: 3 }}
        >
          {lang?.copyrightText || "© 2026 AI Influencer. All rights reserved."}
        </Typography>
      </Container>
    </Box>
  );
};

export default AdminPasswordRecovery;
