import React from "react";
import { useLocation, useHistory } from "react-router-dom";
import { GlobalContext } from "../../context/GlobalContext";
import { TranslateContext } from "../../context/TranslateContext";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";
import { ErrorOutlined } from "@mui/icons-material";
import ThankYouPage from "../ThankYouPage";

const CheckoutSuccess = () => {
  const { hitAxios } = React.useContext(GlobalContext);
  const { lang } = React.useContext(TranslateContext);
  const location = useLocation();
  const history = useHistory();
  const theme = useTheme();

  const [status, setStatus] = React.useState("verifying");
  const [msg, setMsg] = React.useState("");
  const [successProductType, setSuccessProductType] = React.useState("");

  const searchParams = new URLSearchParams(location.search);
  const gateway = searchParams.get("gateway");
  const order_id = searchParams.get("token");
  const verified = searchParams.get("verified");
  const product_type = searchParams.get("product_type");

  React.useEffect(() => {
    const cancelled =
      searchParams.get("cancelled") === "true" ||
      searchParams.get("cancel") === "true";

    if (cancelled) {
      setStatus("error");
      setMsg(lang?.paymentCancelled || "Payment was cancelled.");
      return;
    }

    if (gateway === "razorpay" && verified === "1") {
      setSuccessProductType(product_type || "");
      setStatus("success");
      setMsg(
        product_type === "credit_package"
          ? "Credits added successfully!"
          : "Plan activated!",
      );
    } else if (gateway === "paypal" && order_id) {
      verifyPayPal(order_id);
    } else if (verified === "1" || searchParams.get("free") === "1") {
      setSuccessProductType(product_type || "plan");
      setStatus("success");
      setMsg(lang?.planActivated || "Your plan has been activated successfully.");
    } else {
      setStatus("error");
      setMsg("Unknown payment gateway or missing session.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleVerificationResponse(res) {
    if (res.data.success) {
      setSuccessProductType(res.data.product_type || "");
      setStatus("success");
      setMsg(res.data.msg || "Purchase completed!");
    } else {
      setStatus("error");
      setMsg(res.data.msg || "Verification failed.");
    }
  }

  async function verifyPayPal(orderId) {
    const res = await hitAxios({
      path: "/api/payment/paypal/verify-order",
      admin: false,
      post: true,
      obj: { order_id: orderId },
    });
    handleVerificationResponse(res);
  }

  if (status === "success") {
    return <ThankYouPage productType={successProductType || product_type} />;
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="background.default"
      p={3}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          p: 4,
          bgcolor: "background.paper",
          textAlign: "center",
        }}
      >
        {status === "verifying" && (
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography color="text.secondary">
              {lang?.verifyingPayment || "Verifying your payment..."}
            </Typography>
          </Stack>
        )}

        {status === "error" && (
          <Stack spacing={2} alignItems="center">
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                bgcolor: alpha(theme.palette.error.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ErrorOutlined sx={{ fontSize: 40, color: "error.main" }} />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              {lang?.paymentFailed || "Something went wrong"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {msg}
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
              <Button
                variant="outlined"
                onClick={() => history.goBack()}
                sx={{ borderRadius: 2 }}
              >
                {lang?.tryAgain || "Try Again"}
              </Button>
              <Button
                variant="contained"
                onClick={() => history.push("/contact")}
                sx={{ borderRadius: 2 }}
              >
                {lang?.tyContactSupport || "Contact Support"}
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default CheckoutSuccess;
