import React from "react";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Alert,
  Stack,
  Switch,
  TextField,
  Typography,
  alpha,
  useTheme,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Unsubscribe,
  DnsOutlined,
  EmailOutlined,
  LockOutlined,
  SendOutlined,
  SaveOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
} from "@mui/icons-material";
import { GlobalContext } from "../../context/GlobalContext";
import PageHeader from "../../common/PageHeader";

const SectionCard = ({ icon: Icon, title, children }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.4,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: alpha(theme.palette.primary.main, 0.06),
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {Icon && <Icon fontSize="small" sx={{ color: "primary.main" }} />}
        <Typography
          variant="caption"
          fontWeight={700}
          letterSpacing={1}
          textTransform="uppercase"
          color="primary"
        >
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Box>
  );
};

const defaultForm = {
  smtp_host: "",
  smtp_port: "587",
  smtp_security: "tls",
  smtp_auth: true,
  smtp_username: "",
  smtp_email: "",
  smtp_password: "",
  smtp_from: "",
};

const EmailSettings = ({ lang }) => {
  const theme = useTheme();
  const { hitAxios } = React.useContext(GlobalContext);

  const [form, setForm] = React.useState(defaultForm);
  const [testEmail, setTestEmail] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [showPass, setShowPass] = React.useState(false);
  const [snack, setSnack] = React.useState({
    open: false,
    msg: "",
    severity: "success",
  });

  const showSnack = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });
  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  React.useEffect(() => {
    fetchSmtp();
  }, []);

  async function fetchSmtp() {
    const res = await hitAxios({
      path: "/api/admin/get_smtp",
      post: false,
      admin: true,
    });
    if (res?.data?.success && res.data.data) {
      const d = res.data.data;
      setForm({
        smtp_host: d.smtp_host || "",
        smtp_port: d.smtp_port || "587",
        smtp_security: d.smtp_security || "tls",
        smtp_auth: d.smtp_auth === 1 || d.smtp_auth === true,
        smtp_username: d.smtp_username || "",
        smtp_email: d.smtp_email || "",
        smtp_password: d.smtp_password || "",
        smtp_from: d.smtp_from || "",
      });
    }
  }

  async function handleSave() {
    setSaving(true);
    const res = await hitAxios({
      path: "/api/admin/smtp_add",
      post: true,
      admin: true,
      obj: form,
    });
    setSaving(false);
    showSnack(
      res?.data?.msg ||
        (res?.data?.success
          ? "SMTP configuration saved"
          : "Something went wrong"),
      res?.data?.success ? "success" : "error",
    );
  }

  async function handleTest() {
    if (!testEmail) {
      return showSnack(
        lang?.enterTestEmail || "Enter a recipient email to send the test to",
        "warning",
      );
    }
    setTesting(true);
    const res = await hitAxios({
      path: "/api/admin/smtp_test",
      post: true,
      admin: true,
      obj: { to: testEmail },
    });
    setTesting(false);
    showSnack(
      res?.data?.msg ||
        (res?.data?.success ? "Test email sent!" : "Something went wrong"),
      res?.data?.success ? "success" : "error",
    );
  }

  function handleSecurityChange(val) {
    set("smtp_security", val);
    if (val === "ssl") set("smtp_port", "465");
    else if (val === "tls") set("smtp_port", "587");
    else set("smtp_port", "25");
  }

  return (
    <Box>
      <PageHeader
        title={lang?.emailSettings || "Email Settings"}
        subtitle={lang?.emailSetSub || "Manage SMTP configuration"}
        icon={Unsubscribe}
        primaryAction={
          <Button
            size="large"
            variant="contained"
            startIcon={
              saving ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SaveOutlined />
              )
            }
            onClick={handleSave}
            disabled={saving || testing}
          >
            {saving
              ? lang?.saving || "Saving..."
              : lang?.saveConfig || "Save Configuration"}
          </Button>
        }
      />

      <Grid container spacing={3}>
        {/* ── LEFT COLUMN ── */}
        <Grid item xs={12} lg={6}>
          <Stack spacing={3}>
            {/* SERVER CONFIG */}
            <SectionCard
              icon={DnsOutlined}
              title={lang?.serverConfig || "Server Configuration"}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label={lang?.smtpHost || "SMTP Host"}
                    placeholder="smtp.gmail.com"
                    value={form.smtp_host}
                    onChange={(e) => set("smtp_host", e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DnsOutlined
                            fontSize="small"
                            sx={{ color: "text.disabled" }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>
                      {lang?.security || "Security Protocol"}
                    </InputLabel>
                    <Select
                      label={lang?.security || "Security Protocol"}
                      value={form.smtp_security}
                      onChange={(e) => handleSecurityChange(e.target.value)}
                    >
                      <MenuItem value="tls">TLS (Recommended)</MenuItem>
                      <MenuItem value="ssl">SSL</MenuItem>
                      <MenuItem value="none">None</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label={lang?.smtpPort || "Port"}
                    placeholder="587"
                    value={form.smtp_port}
                    onChange={(e) => set("smtp_port", e.target.value)}
                    helperText={
                      form.smtp_security === "ssl"
                        ? "SSL typically uses 465"
                        : form.smtp_security === "tls"
                          ? "TLS typically uses 587"
                          : "No encryption uses 25"
                    }
                  />
                </Grid>

                {/* Port quick-select chips */}
                <Grid item xs={12}>
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      alignSelf="center"
                    >
                      {lang?.quickPort || "Quick select:"}
                    </Typography>
                    {["25", "465", "587", "2525"].map((p) => (
                      <Box
                        key={p}
                        onClick={() => set("smtp_port", p)}
                        sx={{
                          px: 1.5,
                          py: 0.3,
                          borderRadius: 1,
                          cursor: "pointer",
                          border: `1px solid ${form.smtp_port === p ? theme.palette.primary.main : theme.palette.divider}`,
                          bgcolor:
                            form.smtp_port === p
                              ? alpha(theme.palette.primary.main, 0.1)
                              : "transparent",
                          color:
                            form.smtp_port === p
                              ? "primary.main"
                              : "text.secondary",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          transition: "all 0.15s",
                          "&:hover": {
                            borderColor: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.06),
                          },
                        }}
                      >
                        {p}
                      </Box>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </SectionCard>

            {/* AUTH */}
            <SectionCard
              icon={LockOutlined}
              title={lang?.authConfig || "Authentication"}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.smtp_auth}
                        onChange={(e) => set("smtp_auth", e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2" fontWeight={500}>
                        {lang?.requireAuth || "Require Authentication"}
                      </Typography>
                    }
                  />
                </Grid>

                {form.smtp_auth && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label={lang?.smtpUsername || "Username"}
                        placeholder="your@email.com"
                        value={form.smtp_username}
                        onChange={(e) => set("smtp_username", e.target.value)}
                        helperText={
                          lang?.usernameHelper ||
                          "Leave empty to use Sender Email as username"
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailOutlined
                                fontSize="small"
                                sx={{ color: "text.disabled" }}
                              />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label={lang?.smtpPassword || "Password / App Password"}
                        type={showPass ? "text" : "password"}
                        value={form.smtp_password}
                        onChange={(e) => set("smtp_password", e.target.value)}
                        helperText={
                          lang?.passwordHelper ||
                          "For Gmail use an App Password instead of your account password"
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlined
                                fontSize="small"
                                sx={{ color: "text.disabled" }}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => setShowPass((p) => !p)}
                                edge="end"
                              >
                                {showPass ? (
                                  <VisibilityOffOutlined fontSize="small" />
                                ) : (
                                  <VisibilityOutlined fontSize="small" />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </SectionCard>
          </Stack>
        </Grid>

        {/* ── RIGHT COLUMN ── */}
        <Grid item xs={12} lg={6}>
          <Stack spacing={3}>
            {/* SENDER */}
            <SectionCard
              icon={EmailOutlined}
              title={lang?.senderConfig || "Sender"}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label={lang?.senderEmail || "Sender Email"}
                    placeholder="noreply@yourdomain.com"
                    value={form.smtp_email}
                    onChange={(e) => set("smtp_email", e.target.value)}
                    helperText={
                      lang?.senderEmailHelper ||
                      "The email address emails will be sent from"
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined
                            fontSize="small"
                            sx={{ color: "text.disabled" }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label={lang?.fromName || "From Name (Display Name)"}
                    placeholder="My App"
                    value={form.smtp_from}
                    onChange={(e) => set("smtp_from", e.target.value)}
                    helperText={
                      form.smtp_from && form.smtp_email
                        ? `Preview: "${form.smtp_from}" <${form.smtp_email}>`
                        : lang?.fromNameHelper ||
                          "Shown as the sender name in email clients"
                    }
                  />
                </Grid>
              </Grid>
            </SectionCard>

            {/* SEND TEST EMAIL */}
            <SectionCard
              icon={SendOutlined}
              title={lang?.sendTest || "Send Test Email"}
            >
              <Stack spacing={2}>
                <Typography variant="caption" color="text.secondary">
                  {lang?.sendTestHint ||
                    "Save your configuration first, then send a test to verify everything works."}
                </Typography>
                <Stack direction="column" spacing={1.5} alignItems="flex-end">
                  <TextField
                    fullWidth
                    size="small"
                    label={lang?.testRecipient || "Recipient Email"}
                    placeholder="you@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SendOutlined
                            fontSize="small"
                            sx={{ color: "text.disabled" }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleTest}
                    disabled={testing || saving}
                    sx={{ whiteSpace: "nowrap", minWidth: 110 }}
                    startIcon={
                      testing ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <SendOutlined />
                      )
                    }
                  >
                    {testing
                      ? lang?.sending || "Sending..."
                      : lang?.send || "Send"}
                  </Button>
                </Stack>
              </Stack>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>

      {/* SNACKBAR */}
      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnack}
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmailSettings;
