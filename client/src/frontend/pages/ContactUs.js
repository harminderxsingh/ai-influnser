import React from "react";
import { TranslateContext } from "../../context/TranslateContext";
import { GlobalContext } from "../../context/GlobalContext";
import Header from "../components/Header";
import FooterComp from "../components/FooterComp";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  useTheme,
  alpha,
  Grid,
  CircularProgress,
} from "@mui/material";
import {
  ContactMailOutlined,
  PersonOutlined,
  EmailOutlined,
  PhoneOutlined,
  MessageOutlined,
  SendOutlined,
} from "@mui/icons-material";
import { useCustomTheme } from "../../utils/useCustomTheme";

const ContactUs = () => {
  const { lang } = React.useContext(TranslateContext);
  const { hitAxios } = React.useContext(GlobalContext);
  const theme = useTheme();
  const { config, isDark } = useCustomTheme();

  const [state, setState] = React.useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = React.useState(false);

  const textPrimary = isDark
    ? config.text_primary_dark
    : config.text_primary_light;
  const textSecondary = isDark
    ? config.text_secondary_dark
    : config.text_secondary_light;
  const borderColor = isDark ? config.border_dark : config.border_light;

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: `${config.box.defaultBorderRadius}px`,
      fontFamily: config.font_family,
      fontSize: 14,
      color: textPrimary,
      "& fieldset": { borderColor },
      "&:hover fieldset": { borderColor: theme.palette.primary.main },
      "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
    },
    "& .MuiInputLabel-root": {
      fontFamily: config.font_family,
      fontSize: 14,
      color: textSecondary,
      "&.Mui-focused": { color: theme.palette.primary.main },
    },
    "& .MuiInputAdornment-root svg": {
      fontSize: 18,
      color: textSecondary,
    },
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const res = await hitAxios({
      path: "/api/web/fill_contact_us",
      post: true,
      admin: false,
      obj: state,
    });
    if (res.data.success) {
      setState({ name: "", email: "", phone: "", message: "" });
    }
    setLoading(false);
  }

  const isDisabled = !state.name || !state.email || !state.message || loading;

  return (
    <Box
      minHeight="100vh"
      bgcolor="background.default"
      display="flex"
      flexDirection="column"
    >
      <Header />

      {/* ── fixed AppBar offset ── */}
      <Box sx={{ height: `${config.appBar.height}px` }} />

      {/* ── Hero Banner ── */}
      <Box
        sx={{
          borderBottom: `1px solid ${borderColor}`,
          background: isDark
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%)`,
          py: { xs: 5, md: 7 },
        }}
      >
        <Container maxWidth="md">
          <Box display="flex" alignItems="center" gap={2} mb={1.5}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: `${config.box.defaultBorderRadius}px`,
                background: isDark
                  ? config.gradient_primary_dark
                  : config.gradient_primary_light,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ContactMailOutlined
                sx={{ fontSize: 20, color: isDark ? "#000" : "#fff" }}
              />
            </Box>
            <Typography
              variant="h4"
              fontWeight={config.font_weight_bold || 700}
              color={textPrimary}
              fontFamily={config.font_family}
              sx={{ fontSize: { xs: 22, md: 28 }, letterSpacing: "-0.5px" }}
            >
              {lang?.contactUs || "Contact Us"}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color={textSecondary}
            fontFamily={config.font_family}
            maxWidth={500}
            lineHeight={1.7}
          >
            {lang?.contactUsSubtitle ||
              "Have a question or need help? Fill out the form below and we'll get back to you shortly."}
          </Typography>
        </Container>
      </Box>

      {/* ── Form ── */}
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 7 }, flex: 1 }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            bgcolor: "background.paper",
            border: `1px solid ${borderColor}`,
            borderRadius: `${config.box.defaultBorderRadius}px`,
            p: { xs: 3, md: 6 },
          }}
        >
          <Grid container spacing={3}>
            {/* Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={lang?.yourName || "Your Name"}
                value={state.name}
                onChange={(e) => setState({ ...state, name: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <Box
                      component="span"
                      sx={{ mr: 1, display: "flex", alignItems: "center" }}
                    >
                      <PersonOutlined
                        sx={{ fontSize: 18, color: textSecondary }}
                      />
                    </Box>
                  ),
                }}
                sx={inputSx}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={lang?.yourEmail || "Your Email"}
                type="email"
                value={state.email}
                onChange={(e) => setState({ ...state, email: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <Box
                      component="span"
                      sx={{ mr: 1, display: "flex", alignItems: "center" }}
                    >
                      <EmailOutlined
                        sx={{ fontSize: 18, color: textSecondary }}
                      />
                    </Box>
                  ),
                }}
                sx={inputSx}
              />
            </Grid>

            {/* Phone */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={lang?.yourPhone || "Phone Number (optional)"}
                value={state.phone}
                onChange={(e) => setState({ ...state, phone: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <Box
                      component="span"
                      sx={{ mr: 1, display: "flex", alignItems: "center" }}
                    >
                      <PhoneOutlined
                        sx={{ fontSize: 18, color: textSecondary }}
                      />
                    </Box>
                  ),
                }}
                sx={inputSx}
              />
            </Grid>

            {/* Message */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={5}
                label={lang?.yourMessage || "Your Message"}
                value={state.message}
                onChange={(e) =>
                  setState({ ...state, message: e.target.value })
                }
                InputProps={{
                  startAdornment: (
                    <Box
                      component="span"
                      sx={{
                        mr: 1,
                        mt: 1.2,
                        display: "flex",
                        alignItems: "flex-start",
                      }}
                    >
                      <MessageOutlined
                        sx={{ fontSize: 18, color: textSecondary }}
                      />
                    </Box>
                  ),
                }}
                sx={inputSx}
              />
            </Grid>

            {/* Submit */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end">
                <Button
                  type="submit"
                  disabled={isDisabled}
                  variant="contained"
                  endIcon={
                    loading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <SendOutlined />
                    )
                  }
                  sx={{
                    px: 4,
                    py: 1.3,
                    borderRadius: `${config.box.defaultBorderRadius}px`,
                    fontFamily: config.font_family,
                    fontWeight: config.font_weight_semibold || 600,
                    fontSize: 14,
                    textTransform: "none",
                    background: isDark
                      ? config.gradient_primary_dark
                      : config.gradient_primary_light,
                    color: isDark ? "#000" : "#fff",
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
                    },
                    "&:disabled": {
                      opacity: 0.5,
                      color: isDark ? "#000" : "#fff",
                    },
                  }}
                >
                  {loading
                    ? lang?.sending || "Sending..."
                    : lang?.sendMessage || "Send Message"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>

      <FooterComp />
    </Box>
  );
};

export default ContactUs;
