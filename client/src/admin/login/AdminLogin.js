import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  alpha,
  useTheme,
  Divider,
  Chip,
  Tooltip,
} from "@mui/material";
import React, { useState } from "react";
import { TranslateContext } from "../../context/TranslateContext";
import { GlobalContext } from "../../context/GlobalContext";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import VerifiedUserOutlined from "@mui/icons-material/VerifiedUserOutlined";
import HttpsOutlined from "@mui/icons-material/HttpsOutlined";
import PlayCircleOutline from "@mui/icons-material/PlayCircleOutline";
import { useHistory } from "react-router-dom/cjs/react-router-dom";
import ForgetPassAdmin from "./ForgetPassAdmin";

// ── Demo credentials ─────────────────────────────────────────────────────────
const DEMO_EMAIL = "admin@admin.com";
const DEMO_PASSWORD = "password";

const AdminLogin = () => {
  const theme = useTheme();
  const history = useHistory();
  const { lang } = React.useContext(TranslateContext);
  const [showPassword, setShowPassword] = useState(false);
  const { hitAxios } = React.useContext(GlobalContext);
  const [state, setState] = React.useState({ email: "", password: "" });
  const [demoFlash, setDemoFlash] = useState(false);

  // ── Auto-fill handler ────────────────────────────────────────────────────
  const handleDemoFill = () => {
    setState({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    setDemoFlash(true);
    setTimeout(() => setDemoFlash(false), 1200);
  };

  async function handleLogin() {
    const res = await hitAxios({
      path: "/api/admin/login",
      post: true,
      obj: state,
    });
    if (res.data.success) {
      localStorage.setItem(
        process.env.REACT_APP_TOKEN + "_admin",
        res.data.token,
      );
      history.push("/admin");
    }
  }

  const TRUST_BADGES = [
    {
      icon: <ShieldOutlined sx={{ fontSize: 14 }} />,
      label: lang.secureLogin || "Secure Login",
    },
    {
      icon: <VerifiedUserOutlined sx={{ fontSize: 14 }} />,
      label: lang.adminOnly || "Admin Only",
    },
    {
      icon: <HttpsOutlined sx={{ fontSize: 14 }} />,
      label: lang.encryptedSession || "Encrypted Session",
    },
  ];

  // ── Shared glow sx applied to both TextFields when demo fills ────────────
  const flashSx = demoFlash
    ? {
        "& .MuiOutlinedInput-root": {
          transition: "box-shadow 0.3s ease",
          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.25)}`,
        },
      }
    : {};

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        position: "relative",
        overflow: "hidden",
        p: 2,
      }}
    >
      {/* ── BG glow top-left ── */}
      <Box
        sx={{
          position: "absolute",
          top: "-15%",
          left: "-10%",
          width: "50%",
          height: "60%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* ── BG glow bottom-right ── */}
      <Box
        sx={{
          position: "absolute",
          bottom: "-15%",
          right: "-10%",
          width: "45%",
          height: "55%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* ── Grid pattern ── */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${alpha(theme.palette.divider, 0.6)} 1px, transparent 1px),
            linear-gradient(90deg, ${alpha(theme.palette.divider, 0.6)} 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="xs" sx={{ position: "relative", zIndex: 2 }}>
        {/* ══════════════════════════════
            CARD
        ══════════════════════════════ */}
        <Box
          sx={{
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: alpha(theme.palette.background.paper, 0.85),
            backdropFilter: "blur(20px)",
            overflow: "hidden",
            boxShadow: `0 24px 80px ${alpha("#000", 0.08)}`,
          }}
        >
          {/* ── Top accent bar ── */}
          <Box
            sx={{
              height: 4,
              background: `linear-gradient(90deg,
                ${theme.palette.primary.main} 0%,
                ${theme.palette.secondary.main} 100%)`,
            }}
          />

          <Box sx={{ px: { xs: 3, sm: 4.5 }, pt: 4.5, pb: 4 }}>
            {/* ── Icon + heading ── */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
              {/* Outer ring */}
              <Box
                sx={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  border: "1.5px solid",
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2.5,
                  position: "relative",
                }}
              >
                {/* Inner filled circle */}
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg,
                      ${theme.palette.info.main} 0%,
                      ${theme.palette.secondary.main} 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.35)}`,
                  }}
                >
                  <AdminPanelSettingsOutlined
                    sx={{ fontSize: 28, color: "#fff" }}
                  />
                </Box>

                {/* Pulse ring */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: -6,
                    borderRadius: "50%",
                    border: "1px solid",
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                  }}
                />
              </Box>

              <Typography
                variant="h5"
                fontWeight={800}
                color="text.primary"
                sx={{ mb: 0.5, letterSpacing: "-0.3px" }}
              >
                {lang.adminLogin || "Admin Login"}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.85rem" }}
              >
                {lang.adminLoginSubtitle ||
                  "Sign in to access the admin dashboard"}
              </Typography>
            </Box>

            {/* ── Trust badges ── */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                mb: 3.5,
                px: 1,
                py: 1.2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.success.main, 0.05),
                border: "1px solid",
                borderColor: alpha(theme.palette.success.main, 0.15),
              }}
            >
              {TRUST_BADGES.map((b, i) => (
                <React.Fragment key={b.label}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                    <Box sx={{ color: "success.main", display: "flex" }}>
                      {b.icon}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: "success.main",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {b.label}
                    </Typography>
                  </Box>
                  {i < TRUST_BADGES.length - 1 && (
                    <Box
                      sx={{
                        width: 3,
                        height: 3,
                        borderRadius: "50%",
                        bgcolor: alpha(theme.palette.success.main, 0.3),
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </Box>

            {/* ── Form ── */}
            <Stack spacing={2}>
              {/* Email */}
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{
                    mb: 0.8,
                    display: "block",
                    fontSize: "0.72rem",
                    letterSpacing: 0.3,
                  }}
                >
                  {lang.emailLabel || "EMAIL ADDRESS"}
                </Typography>
                <TextField
                  value={state.email}
                  onChange={(e) =>
                    setState({ ...state, email: e.target.value })
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  fullWidth
                  placeholder={lang.emailPlaceholder || "Enter admin email"}
                  type="email"
                  size="small"
                  sx={flashSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined
                          sx={{ fontSize: 18, color: "text.disabled" }}
                        />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontSize: "0.9rem",
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                    },
                  }}
                />
              </Box>

              {/* Password */}
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{
                    mb: 0.8,
                    display: "block",
                    fontSize: "0.72rem",
                    letterSpacing: 0.3,
                  }}
                >
                  {lang.passwordLabel || "PASSWORD"}
                </Typography>
                <TextField
                  fullWidth
                  onChange={(e) =>
                    setState({ ...state, password: e.target.value })
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  value={state.password}
                  placeholder={
                    lang.passwordPlaceholder || "Enter your password"
                  }
                  type={showPassword ? "text" : "password"}
                  size="small"
                  sx={flashSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined
                          sx={{ fontSize: 18, color: "text.disabled" }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          sx={{ color: "text.disabled" }}
                        >
                          {showPassword ? (
                            <VisibilityOff sx={{ fontSize: 18 }} />
                          ) : (
                            <Visibility sx={{ fontSize: 18 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontSize: "0.9rem",
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                    },
                  }}
                />
              </Box>

              {/* Sign in button */}
              <Button
                onClick={handleLogin}
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  mt: 0.5,
                  py: 1.3,
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  borderRadius: 2.5,
                  textTransform: "none",
                  background: `linear-gradient(135deg,
                    ${theme.palette.primary.main} 0%,
                    ${theme.palette.secondary.main} 100%)`,
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
                  "&:hover": {
                    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.45)}`,
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                {lang.signIn || "Sign In"}
              </Button>

              {/* Divider */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  py: 0.5,
                }}
              >
                <Divider sx={{ flex: 1 }} />
                <Typography
                  variant="caption"
                  color="text.disabled"
                  fontWeight={600}
                >
                  {lang.orText || "OR"}
                </Typography>
                <Divider sx={{ flex: 1 }} />
              </Box>

              {/* Forgot password */}
              <ForgetPassAdmin />
            </Stack>
          </Box>
        </Box>

        {/* ── Footer ── */}
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{
            display: "block",
            textAlign: "center",
            mt: 3,
            fontSize: "0.72rem",
          }}
        >
          {lang.copyrightText ||
            `© ${new Date().getFullYear()} AI Influencer. All rights reserved.`}
        </Typography>
      </Container>
    </Box>
  );
};

export default AdminLogin;
