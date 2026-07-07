import React, { useState } from "react";
import axios from "axios";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  Paper,
  Stack,
  Tooltip,
  Snackbar,
  CssBaseline,
} from "@mui/material";
import {
  VpnKey as VpnKeyIcon,
  Visibility,
  VisibilityOff,
  Shield as ShieldIcon,
  WhatsApp as WhatsAppIcon,
  ContactPhone as ContactPhoneIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from "@mui/icons-material";

const SUPPORT_PHONE = "+918430088300";
const WHATSAPP_NUMBER = "918430088300";

// ── Standalone dark theme — no dependency on ThemeDataProvider ──
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0F172A",
      paper: "#1E293B",
    },
    text: {
      primary: "#F9FAFB",
      secondary: "#CBD5E1",
      disabled: "#64748B",
    },
    divider: "#334155",
    action: {
      hover: "rgba(255,255,255,0.05)",
      disabledBackground: "rgba(255,255,255,0.08)",
      disabled: "rgba(255,255,255,0.3)",
    },
  },
  typography: {
    fontFamily:
      '"Inter", "Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  shape: {
    borderRadius: 10,
  },
});

const LicenseRequired = () => {
  const [state, setState] = useState({
    licenseKey: "",
    name: "NA",
    email: "email@email.com",
    mobile: "1234567890",
  });
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPPORT_PHONE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveContact = () => {
    const vcf = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "FN:App Support",
      "ORG:Support Team;",
      `TEL;TYPE=CELL:${SUPPORT_PHONE}`,
      "END:VCARD",
    ].join("\n");
    const blob = new Blob([vcf], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "support-contact.vcf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!state.licenseKey.trim()) {
      setError("Please enter your purchase code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/api/web/verify_license`,
        state,
      );
      setSnackbar({
        open: true,
        message: res.data.msg || "License activated!",
        severity: res.data.success ? "success" : "error",
      });
      if (res.data.success) {
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setError(res.data.msg || "Activation failed.");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        "Activation failed. Please check your code.";
      setError(msg);
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          p: 3,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── Blob top-left ── */}
        <Box
          sx={{
            position: "absolute",
            top: -160,
            left: -160,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* ── Blob bottom-right ── */}
        <Box
          sx={{
            position: "absolute",
            bottom: -120,
            right: -120,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* ── Card ── */}
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 440,
            p: { xs: 3, sm: 4 },
            borderRadius: "16px",
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack spacing={2.5}>
            {/* ── Header ── */}
            <Stack alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: "14px",
                  bgcolor: "text.primary",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <VpnKeyIcon sx={{ fontSize: 26, color: "background.paper" }} />
              </Box>
              <Typography
                variant="h6"
                fontWeight={700}
                color="text.primary"
                textAlign="center"
                letterSpacing="-0.02em"
              >
                License Required
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                textAlign="center"
                lineHeight={1.6}
              >
                Enter your Envato purchase code to activate your application.
              </Typography>
            </Stack>

            <Divider />

            {/* ── Form ── */}
            <Box component="form" onSubmit={handleActivate} autoComplete="off">
              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  label="Purchase Code"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={state.licenseKey}
                  onChange={(e) => {
                    setState((prev) => ({
                      ...prev,
                      licenseKey: e.target.value,
                    }));
                    if (error) setError("");
                  }}
                  type={showCode ? "text" : "password"}
                  disabled={loading}
                  error={!!error}
                  size="small"
                  inputProps={{ spellCheck: false }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCode((v) => !v)}
                          edge="end"
                          tabIndex={-1}
                          size="small"
                          sx={{ color: "text.disabled" }}
                        >
                          {showCode ? (
                            <VisibilityOff sx={{ fontSize: 16 }} />
                          ) : (
                            <Visibility sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      fontSize: "0.875rem",
                    },
                  }}
                />

                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      borderRadius: "10px",
                      py: 0.5,
                      fontSize: "0.8125rem",
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || !state.licenseKey.trim()}
                  sx={{
                    py: 1.25,
                    borderRadius: "10px",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    textTransform: "none",
                    bgcolor: "text.primary",
                    color: "background.default",
                    "&:hover": {
                      bgcolor: "text.secondary",
                    },
                    "&.Mui-disabled": {
                      bgcolor: "action.disabledBackground",
                      color: "action.disabled",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  {loading ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        component="span"
                        sx={{
                          width: 14,
                          height: 14,
                          border: "2px solid rgba(0,0,0,0.3)",
                          borderTopColor: "#000",
                          borderRadius: "50%",
                          display: "inline-block",
                          animation: "spin 0.7s linear infinite",
                          "@keyframes spin": {
                            to: { transform: "rotate(360deg)" },
                          },
                        }}
                      />
                      <span>Activating…</span>
                    </Stack>
                  ) : (
                    "Activate License"
                  )}
                </Button>
              </Stack>
            </Box>

            <Divider>
              <Typography variant="caption" color="text.disabled">
                Support
              </Typography>
            </Divider>

            {/* ── WhatsApp Support ── */}
            <Box
              sx={{
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.default",
                p: 1.5,
              }}
            >
              <Stack spacing={1.5}>
                {/* ── Title row ── */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  <WhatsAppIcon sx={{ fontSize: 16, color: "#25D366" }} />
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="text.primary"
                  >
                    WhatsApp Support
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ ml: "auto !important" }}
                  >
                    Replies within an hour
                  </Typography>
                </Stack>

                {/* ── Copyable number ── */}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    color="text.primary"
                    sx={{ letterSpacing: "0.02em", fontSize: "0.8125rem" }}
                  >
                    {SUPPORT_PHONE}
                  </Typography>
                  <Tooltip
                    title={copied ? "Copied!" : "Copy number"}
                    arrow
                    placement="top"
                  >
                    <IconButton
                      size="small"
                      onClick={handleCopy}
                      sx={{
                        color: copied ? "#25D366" : "text.disabled",
                        transition: "color 0.2s",
                        p: 0.5,
                      }}
                    >
                      {copied ? (
                        <CheckIcon sx={{ fontSize: 14 }} />
                      ) : (
                        <CopyIcon sx={{ fontSize: 14 }} />
                      )}
                    </IconButton>
                  </Tooltip>
                </Stack>

                {/* ── Save Contact ── */}
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={
                    <ContactPhoneIcon sx={{ fontSize: "16px !important" }} />
                  }
                  onClick={handleSaveContact}
                  sx={{
                    borderRadius: "8px",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    textTransform: "none",
                    color: "text.secondary",
                    borderColor: "divider",
                    "&:hover": {
                      borderColor: "text.primary",
                      color: "text.primary",
                      bgcolor: "action.hover",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  Save Contact
                </Button>
              </Stack>
            </Box>

            {/* ── Footer note ── */}
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <ShieldIcon
                sx={{
                  fontSize: 13,
                  color: "text.disabled",
                  mt: "2px",
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                color="text.disabled"
                lineHeight={1.6}
                fontSize="0.75rem"
              >
                Each purchase code is tied to{" "}
                <Box
                  component="span"
                  sx={{ color: "text.secondary", fontWeight: 600 }}
                >
                  one domain
                </Box>
                . For multi-site use, purchase additional licenses from Envato.
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* ── Snackbar ── */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default LicenseRequired;
