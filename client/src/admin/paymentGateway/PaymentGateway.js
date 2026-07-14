import React from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Switch,
  Typography,
  Stack,
  Divider,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Snackbar,
  Alert,
  alpha,
  useTheme,
  MenuItem,
} from "@mui/material";
import {
  AddCard,
  SaveOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
  PaymentOutlined,
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

const MaskedField = ({ label, value, onChange, name, placeholder }) => {
  const [show, setShow] = React.useState(false);
  return (
    <TextField
      fullWidth
      size="small"
      label={label}
      placeholder={placeholder || ""}
      type={show ? "text" : "password"}
      value={value || ""}
      onChange={(e) => onChange(name, e.target.value)}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={() => setShow((p) => !p)}
              edge="end"
            >
              {show ? (
                <VisibilityOffOutlined fontSize="small" />
              ) : (
                <VisibilityOutlined fontSize="small" />
              )}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};

const PaymentGateway = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const [state, setState] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [snack, setSnack] = React.useState({
    open: false,
    msg: "",
    severity: "success",
  });

  const showSnack = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });
  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));
  const set = (key, value) => setState((prev) => ({ ...prev, [key]: value }));

  async function handleGet() {
    setLoading(true);
    const res = await hitAxios({
      path: "/api/payment/get",
      post: false,
      admin: true,
    });
    if (res.data.success) {
      setState(res.data.data || {});
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const res = await hitAxios({
      path: "/api/payment/post",
      post: true,
      admin: true,
      obj: state,
    });
    setSaving(false);
    showSnack(
      res?.data?.msg ||
        (res?.data?.success
          ? lang?.savedSuccess || "Gateways saved successfully"
          : lang?.saveFailed || "Something went wrong"),
      res?.data?.success ? "success" : "error",
    );
  }

  React.useEffect(() => {
    handleGet();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={lang?.paymentGateway || "Payment Gateways"}
        subtitle={
          lang?.paymentGatewaySub || "Manage gateways to accept payments"
        }
        icon={AddCard}
        primaryAction={
          <Button
            size="large"
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SaveOutlined />
              )
            }
          >
            {saving
              ? lang?.saving || "Saving..."
              : lang?.saveGateways || "Save Gateways"}
          </Button>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <SectionCard
            icon={PaymentOutlined}
            title={lang?.razorpay || "Razorpay"}
          >
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={state?.rz_active === 1}
                    onChange={(e) =>
                      set("rz_active", e.target.checked ? 1 : 0)
                    }
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={500}>
                    {lang?.enableGateway || "Enable Gateway"}
                  </Typography>
                }
              />
              <Divider />
              <TextField
                fullWidth
                size="small"
                label={lang?.razorpayKeyId || "Key ID"}
                placeholder="rzp_live_..."
                value={state?.rz_id || ""}
                onChange={(e) => set("rz_id", e.target.value)}
              />
              <MaskedField
                label={lang?.razorpayKeySecret || "Key Secret"}
                placeholder="Your Razorpay secret"
                value={state?.rz_key}
                onChange={set}
                name="rz_key"
              />
              <Typography variant="caption" color="text.secondary">
                {lang?.razorpayIntlHint ||
                  "Domestic: UPI / cards / netbanking. International: enable International Cards + PayPal in Razorpay Dashboard → Payment Methods."}
              </Typography>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Stack spacing={3}>
            <SectionCard
              icon={PaymentOutlined}
              title={lang?.paypal || "PayPal"}
            >
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  {lang?.paypalViaRazorpayHint ||
                    "For international payments, enable PayPal inside your Razorpay Dashboard (Payment Methods). Checkout uses Razorpay only — this standalone PayPal section is optional and hidden when Razorpay is active."}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state?.paypal_active === 1}
                      onChange={(e) =>
                        set("paypal_active", e.target.checked ? 1 : 0)
                      }
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight={500}>
                      {lang?.enableStandalonePaypal ||
                        "Enable standalone PayPal (legacy)"}
                    </Typography>
                  }
                />
                <Divider />
                <TextField
                  select
                  fullWidth
                  size="small"
                  label={lang?.paypalMode || "Mode"}
                  helperText={
                    lang?.paypalModeHint ||
                    "Use sandbox credentials for testing and live credentials for production"
                  }
                  value={state?.paypal_mode || "live"}
                  onChange={(e) =>
                    set(
                      "paypal_mode",
                      e.target.value === "live" ? "live" : "sandbox",
                    )
                  }
                >
                  <MenuItem value="sandbox">
                    {lang?.sandbox || "Sandbox"}
                  </MenuItem>
                  <MenuItem value="live">{lang?.live || "Live"}</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  size="small"
                  label={lang?.paypalClientId || "Client ID"}
                  placeholder="AX..."
                  value={state?.pay_paypal_id || ""}
                  onChange={(e) => set("pay_paypal_id", e.target.value)}
                />
                <MaskedField
                  label={lang?.paypalClientSecret || "Client Secret"}
                  placeholder="Your PayPal secret"
                  value={state?.pay_paypal_key}
                  onChange={set}
                  name="pay_paypal_key"
                />
              </Stack>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnack}
          severity={snack.severity}
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaymentGateway;
