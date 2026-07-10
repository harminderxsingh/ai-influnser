import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  Stack,
  Skeleton,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  EmailOutlined,
  Visibility,
  VisibilityOff,
  LockOutlined,
  LightMode,
  DarkMode,
  PlayCircleOutline,
} from "@mui/icons-material";
import { TranslateContext } from "../../context/TranslateContext";
import { useThemeData } from "../../context/ThemeContext";
import { GlobalContext } from "../../context/GlobalContext";
import { useHistory } from "react-router-dom/cjs/react-router-dom";
import ForgotPassword from "./ForgotPassword";

// ── Demo credentials ────────────────────────────────────────────────────────
const DEMO_EMAIL = "user@user.com";
const DEMO_PASSWORD = "password";

const UserLogin = () => {
  const { lang } = React.useContext(TranslateContext);
  const [web, setWeb] = React.useState(null);
  const history = useHistory();
  const { hitAxios } = React.useContext(GlobalContext);
  const { themeConfig, mode, toggleColorMode } = useThemeData();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [showPassword, setShowPassword] = useState(false);
  const [demoFlash, setDemoFlash] = useState(false);
  const [state, setState] = React.useState({
    email: "",
    password: "",
    referral_code: "",
  });

  // ── Auto-fill demo credentials ───────────────────────────────────────────
  const handleDemoFill = () => {
    setState({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    setDemoFlash(true);
    setTimeout(() => setDemoFlash(false), 1200);
  };

  async function handleGetWeb() {
    const res = await hitAxios({
      path: "/api/web/get_web_public",
      post: false,
      admin: false,
    });
    if (res.data.success) setWeb(res.data.data);
  }

  React.useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    const storedRef = localStorage.getItem("referral_code");
    const referral_code = (ref || storedRef || "").trim().toUpperCase();
    if (referral_code) {
      localStorage.setItem("referral_code", referral_code);
      setState((prev) => ({ ...prev, referral_code }));
    }
  }, []);

  async function hanelgLogin() {
    const res = await hitAxios({
      path: "/api/user/login",
      admin: false,
      post: true,
      obj: state,
    });
    if (res?.data?.emailVerificationRequired) {
      const verifyEmail = res.data.email || state.email;
      history.push(`/verify-email?email=${encodeURIComponent(verifyEmail)}`);
      return;
    }

    if (res.data.success && res.data.token) {
      localStorage.setItem(
        process.env.REACT_APP_TOKEN + "_user",
        res.data.token,
      );
      history.push("/user");
    }
  }

  React.useEffect(() => {
    handleGetWeb();
  }, []);

  const siteName = web?.site_name || "My App";
  const logoUrl = web?.site_logo ? `/media/${web.site_logo}` : null;
  const metaTitle = web?.meta_title || siteName;

  React.useEffect(() => {
    if (metaTitle) document.title = metaTitle;
  }, [metaTitle]);

  // ── Shared flash sx helper ───────────────────────────────────────────────
  const flashSx = demoFlash
    ? {
        "& .MuiOutlinedInput-root": {
          transition: "box-shadow 0.3s ease",
          boxShadow: `0 0 0 3px ${theme.palette.primary.main}44`,
        },
      }
    : {};

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      {/* ── Left Side — Brand Panel ─────────────────────────────────────────── */}
      <Box
        sx={{
          flex: { xs: "0 0 220px", md: 1 },
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
          sx={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            px: { xs: 3, md: 6 },
          }}
        >
          {/* ── Logo ── */}
          {web === null ? (
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              alignItems="center"
              mb={2}
            >
              <Skeleton
                variant="rounded"
                width={isMobile ? 40 : 56}
                height={isMobile ? 40 : 56}
                sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
              />
              <Skeleton
                variant="text"
                width={120}
                height={isMobile ? 32 : 48}
                sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
              />
            </Stack>
          ) : logoUrl ? (
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              alignItems="center"
              mb={2}
            >
              <Box
                component="img"
                src={logoUrl}
                alt={siteName}
                sx={{
                  width: { xs: 40, md: 56 },
                  height: { xs: 40, md: 56 },
                  objectFit: "contain",
                  borderRadius: 2,
                  filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.3))",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <Box
                sx={{
                  display: "none",
                  width: { xs: 40, md: 56 },
                  height: { xs: 40, md: 56 },
                  background: "rgba(255,255,255,0.25)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 2,
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid rgba(255,255,255,0.4)",
                }}
              >
                <Typography
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: { xs: "1.2rem", md: "1.5rem" },
                  }}
                >
                  {siteName.charAt(0).toUpperCase()}
                </Typography>
              </Box>
              <Typography
                variant={isMobile ? "h5" : "h3"}
                sx={{
                  color: "white",
                  fontWeight: 300,
                  letterSpacing: 2,
                  textShadow: "0 2px 12px rgba(0,0,0,0.2)",
                }}
              >
                {siteName}
              </Typography>
            </Stack>
          ) : (
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              alignItems="center"
              mb={2}
            >
              <Box
                sx={{
                  width: { xs: 40, md: 56 },
                  height: { xs: 40, md: 56 },
                  background: "rgba(255,255,255,0.25)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid rgba(255,255,255,0.4)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                }}
              >
                <Typography
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: { xs: "1.2rem", md: "1.5rem" },
                  }}
                >
                  {siteName.charAt(0).toUpperCase()}
                </Typography>
              </Box>
              <Typography
                variant={isMobile ? "h5" : "h3"}
                sx={{
                  color: "white",
                  fontWeight: 300,
                  letterSpacing: 2,
                  textShadow: "0 2px 12px rgba(0,0,0,0.2)",
                }}
              >
                {siteName}
              </Typography>
            </Stack>
          )}

          {/* ── Tagline (desktop only) ── */}
          {!isMobile && (
            <Box>
              {web === null ? (
                <Skeleton
                  variant="text"
                  width={200}
                  sx={{ bgcolor: "rgba(255,255,255,0.2)", mx: "auto", mt: 1 }}
                />
              ) : (
                <Typography
                  variant="body1"
                  sx={{
                    color: "rgba(255,255,255,0.75)",
                    fontWeight: 300,
                    letterSpacing: 0.5,
                    mt: 1,
                  }}
                >
                  {lang.brandTagline || "Create. Innovate. Inspire."}
                </Typography>
              )}
              {[
                { size: 120, top: "10%", left: "5%", opacity: 0.06 },
                { size: 80, top: "70%", left: "15%", opacity: 0.08 },
                { size: 60, top: "40%", right: "8%", opacity: 0.07 },
                { size: 200, bottom: "-5%", right: "-5%", opacity: 0.04 },
              ].map((circle, i) => (
                <Box
                  key={i}
                  sx={{
                    position: "absolute",
                    width: circle.size,
                    height: circle.size,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    top: circle.top,
                    left: circle.left,
                    right: circle.right,
                    bottom: circle.bottom,
                    opacity: circle.opacity,
                    pointerEvents: "none",
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Right Side — Login Form ──────────────────────────────────────────── */}
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
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            "&:hover": {
              bgcolor: "background.paper",
              transform: "scale(1.05)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            },
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
          {/* ── Greeting ── */}
          <Box mb={4}>
            {web === null ? (
              <>
                <Skeleton variant="text" width="80%" height={48} />
                <Skeleton
                  variant="text"
                  width="50%"
                  height={24}
                  sx={{ mt: 1 }}
                />
              </>
            ) : (
              <>
                <Typography
                  variant="h4"
                  color="text.primary"
                  fontWeight={400}
                  fontSize={{ xs: "1.75rem", md: "2.125rem" }}
                  gutterBottom
                >
                  {lang.welcomeBack || "Welcome back"} 👋
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {lang.loginTo || "Sign in to continue to"}{" "}
                  <Box
                    component="span"
                    sx={{ color: "primary.main", fontWeight: 600 }}
                  >
                    {siteName}
                  </Box>
                </Typography>
              </>
            )}
          </Box>

          {/* ── Email & Password ── */}
          <Stack spacing={2.5}>
            <TextField
              value={state.email}
              onChange={(e) => setState({ ...state, email: e.target.value })}
              fullWidth
              placeholder={lang.email || "Email"}
              type="email"
              onKeyDown={(e) => e.key === "Enter" && hanelgLogin()}
              sx={flashSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              value={state.password}
              onChange={(e) => setState({ ...state, password: e.target.value })}
              fullWidth
              placeholder={lang.password || "Password"}
              type={showPassword ? "text" : "password"}
              onKeyDown={(e) => e.key === "Enter" && hanelgLogin()}
              sx={flashSx}
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

            <TextField
              value={state.referral_code}
              onChange={(e) =>
                setState({
                  ...state,
                  referral_code: e.target.value.toUpperCase(),
                })
              }
              fullWidth
              placeholder={lang.referralCode || "Referral code (optional)"}
              onKeyDown={(e) => e.key === "Enter" && hanelgLogin()}
              helperText={
                state.referral_code
                  ? lang.referralCodeApplied || "Referral code will be applied on signup"
                  : ""
              }
            />

            {/* ── Sign In Button ── */}
            <Button
              onClick={hanelgLogin}
              fullWidth
              variant="contained"
              size="large"
              sx={{ py: 1.5, fontWeight: 600 }}
            >
              {lang.continueWithEmail || "Continue with email"}
            </Button>
          </Stack>

          <ForgotPassword lang={lang} />

          {/* ── Terms ── */}
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            display="block"
            mt={4}
            fontSize="0.75rem"
            lineHeight={1.6}
          >
            {lang.byContinuing || "By continuing, you agree to our"}{" "}
            <Box
              onClick={() => window.open("/terms-and-conditions")}
              component="span"
              sx={{
                color: "primary.main",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {lang.termsOfService || "Terms of Service"}
            </Box>{" "}
            {lang.and || "and"}{" "}
            <Box
              onClick={() => window.open("/privacy-policy")}
              component="span"
              sx={{
                color: "primary.main",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {lang.privacyPolicy || "Privacy Policy"}
            </Box>
          </Typography>

          {/* ── Powered by footer ── */}
          {web?.site_name && (
            <Typography
              variant="caption"
              color="text.disabled"
              textAlign="center"
              display="block"
              mt={3}
              fontSize="0.7rem"
            >
              © {new Date().getFullYear()} {web.site_name}.{" "}
              {lang.copyrightText || "All rights reserved."}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default UserLogin;
