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
  useTheme,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  LockOutlined,
  Visibility,
  VisibilityOff,
  CheckCircleOutline,
  ErrorOutline,
  LightMode,
  DarkMode,
} from "@mui/icons-material";
import { useLocation, useHistory } from "react-router-dom";
import { GlobalContext } from "../context/GlobalContext";
import { useThemeData } from "../context/ThemeContext";
import { TranslateContext } from "../context/TranslateContext";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const PasswordRecovery = () => {
  const { lang } = React.useContext(TranslateContext);
  const query = useQuery();
  const token = query.get("token");
  const history = useHistory();
  const theme = useTheme();
  const { hitAxios } = React.useContext(GlobalContext);
  const { themeConfig, mode, toggleColorMode } = useThemeData();

  const [state, setState] = useState({
    password: "",
    confirmPassword: "",
  });
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
      path: "/api/user/reset_password",
      post: true,
      admin: false,
      obj: { token, password: state.password },
    });
    setResult(res.data);
    setLoading(false);
  }

  // ── No token in URL ──────────────────────────────────────────────────────
  if (!token) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="background.default"
        p={3}
      >
        <Box textAlign="center" maxWidth={400}>
          <ErrorOutline sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            {lang?.invalidResetLink || "Invalid Reset Link"}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {lang?.invalidResetLinkDesc ||
              "This password reset link is missing or invalid. Please request a new one from the login page."}
          </Typography>
          <Button variant="contained" onClick={() => history.push("/")}>
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
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      {/* ── Left Brand Panel ──────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: { xs: "0 0 200px", md: 1 },
          background:
            themeConfig?.gradient_secondary ||
            `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 50%, ${theme.palette.primary.main} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background: `radial-gradient(circle, ${theme.palette.primary.main}22 0%, transparent 70%)`,
            animation: "rotateBg 20s linear infinite",
          },
          "@keyframes rotateBg": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" },
          },
        }}
      >
        <Box
          sx={{ position: "relative", zIndex: 1, textAlign: "center", px: 4 }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: 3,
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
              border: "2px solid rgba(255,255,255,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <LockOutlined sx={{ color: "white", fontSize: 36 }} />
          </Box>
          <Typography
            variant="h4"
            sx={{ color: "white", fontWeight: 300, letterSpacing: 2 }}
          >
            {lang?.newPasswordBrandTitle || "New Password"}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "rgba(255,255,255,0.7)", mt: 1 }}
          >
            {lang?.newPasswordBrandSub || "Secure your account"}
          </Typography>
        </Box>
      </Box>

      {/* ── Right Form Panel ──────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: { xs: 1, md: 1 },
          bgcolor: "background.default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, sm: 4, md: 6 },
          position: "relative",
        }}
      >
        {/* Theme Toggle */}
        <IconButton
          onClick={toggleColorMode}
          sx={{
            position: "absolute",
            top: { xs: 16, md: 24 },
            right: { xs: 16, md: 24 },
            bgcolor: "background.paper",
            border: `1px solid ${theme.palette.divider}`,
            "&:hover": { transform: "scale(1.05)" },
            transition: "all 0.2s ease",
          }}
        >
          {mode === "dark" ? (
            <LightMode sx={{ color: "warning.main" }} />
          ) : (
            <DarkMode sx={{ color: "primary.main" }} />
          )}
        </IconButton>

        <Box sx={{ width: "100%", maxWidth: 440 }}>
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
                {lang?.passwordResetSuccessDesc ||
                  "Your password has been updated successfully. You can now log in with your new password."}
              </Typography>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => history.push("/")}
                sx={{ fontWeight: 600 }}
              >
                {lang?.backToLogin || "Back to Login"}
              </Button>
            </Box>
          ) : (
            <>
              {/* ── Title ── */}
              <Typography
                variant="h4"
                fontWeight={400}
                mb={1}
                fontSize={{ xs: "1.75rem", md: "2.125rem" }}
              >
                {lang?.setNewPassword || "Set new password"}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={4}>
                {lang?.setNewPasswordDesc ||
                  "Choose a strong password to protect your account."}
              </Typography>

              {/* ── Error Alert ── */}
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

                {/* ── Password Rules ── */}
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

                {/* ── Submit ── */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleReset}
                  disabled={!allRulesPassed || loading}
                  sx={{ fontWeight: 600, py: 1.5 }}
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
                  size="small"
                  onClick={() => history.push("/")}
                  sx={{ color: "text.secondary" }}
                >
                  {lang?.backToLogin || "Back to Login"}
                </Button>
              </Stack>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default PasswordRecovery;
