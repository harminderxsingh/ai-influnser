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
} from "@mui/material";
import {
  AddCard,
  SaveOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
  PaymentOutlined,
  CreditCardOutlined,
  AccountBalanceWalletOutlined,
  ReceiptLongOutlined,
} from "@mui/icons-material";
import { GlobalContext } from "../../context/GlobalContext";
import PageHeader from "../../common/PageHeader";

// ── Reusable SectionCard ────────────────────────────────────────────────────
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

// ── Masked secret field ─────────────────────────────────────────────────────
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

// ── Main Component ──────────────────────────────────────────────────────────
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
      {/* ── PAGE HEADER ── */}
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
        {/* ── LEFT COLUMN ── */}
        <Grid item xs={12} lg={6}>
          <Stack spacing={3}>
            {/* STRIPE */}
            <SectionCard
              icon={CreditCardOutlined}
              title={lang?.stripe || "Stripe"}
            >
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state?.stripe_active === 1}
                      onChange={(e) =>
                        set("stripe_active", e.target.checked ? 1 : 0)
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
                  label={lang?.stripePublishableKey || "Publishable Key"}
                  placeholder="pk_live_..."
                  value={state?.pay_stripe_id || ""}
                  onChange={(e) => set("pay_stripe_id", e.target.value)}
                />
                <MaskedField
                  label={lang?.stripeSecretKey || "Secret Key"}
                  placeholder="sk_live_..."
                  value={state?.pay_stripe_key}
                  onChange={set}
                  name="pay_stripe_key"
                />
              </Stack>
            </SectionCard>

            {/* RAZORPAY */}
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
              </Stack>
            </SectionCard>

            {/* MERCADO PAGO */}
            <SectionCard
              icon={AccountBalanceWalletOutlined}
              title={lang?.mercadopago || "Mercado Pago"}
            >
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state?.mercadopago_active === 1}
                      onChange={(e) =>
                        set("mercadopago_active", e.target.checked ? 1 : 0)
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
                  label={lang?.mercadopagoPublicKey || "Public Key"}
                  placeholder="APP_USR-..."
                  value={state?.pay_mercadopago_public_key || ""}
                  onChange={(e) =>
                    set("pay_mercadopago_public_key", e.target.value)
                  }
                />
                <MaskedField
                  label={lang?.mercadopagoAccessToken || "Access Token"}
                  placeholder="APP_USR-..."
                  value={state?.pay_mercadopago_access_token}
                  onChange={set}
                  name="pay_mercadopago_access_token"
                />
              </Stack>
            </SectionCard>
          </Stack>
        </Grid>

        {/* ── RIGHT COLUMN ── */}
        <Grid item xs={12} lg={6}>
          <Stack spacing={3}>
            {/* PAYPAL */}
            <SectionCard
              icon={PaymentOutlined}
              title={lang?.paypal || "PayPal"}
            >
              <Stack spacing={2}>
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
                      {lang?.enableGateway || "Enable Gateway"}
                    </Typography>
                  }
                />
                <Divider />
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

            {/* PAYSTACK */}
            <SectionCard
              icon={CreditCardOutlined}
              title={lang?.paystack || "Paystack"}
            >
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state?.paystack_active === 1}
                      onChange={(e) =>
                        set("paystack_active", e.target.checked ? 1 : 0)
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
                  label={lang?.paystackPublicKey || "Public Key"}
                  placeholder="pk_live_..."
                  value={state?.pay_paystack_id || ""}
                  onChange={(e) => set("pay_paystack_id", e.target.value)}
                />
                <MaskedField
                  label={lang?.paystackSecretKey || "Secret Key"}
                  placeholder="sk_live_..."
                  value={state?.pay_paystack_key}
                  onChange={set}
                  name="pay_paystack_key"
                />
              </Stack>
            </SectionCard>

            {/* ── OFFLINE PAYMENT ── */}
            <SectionCard
              icon={ReceiptLongOutlined}
              title={lang?.offlinePayment || "Offline Payment"}
            >
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state?.offline_payment_active === 1}
                      onChange={(e) =>
                        set("offline_payment_active", e.target.checked ? 1 : 0)
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
                <Typography variant="caption" color="text.secondary">
                  {lang?.offlinePaymentHtmlHint ||
                    "Enter the HTML instructions shown to users when they choose offline payment (e.g. bank details, UPI ID, instructions)."}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  size="small"
                  label={
                    lang?.offlinePaymentHtml || "Payment Instructions (HTML)"
                  }
                  placeholder="<p>Please transfer to bank account: <strong>XXXX-XXXX</strong></p>"
                  value={state?.offline_payment_html || ""}
                  onChange={(e) => set("offline_payment_html", e.target.value)}
                  inputProps={{
                    style: { fontFamily: "monospace", fontSize: 12 },
                  }}
                />
              </Stack>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentGateway;
