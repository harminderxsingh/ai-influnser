import React from "react";
import { Button, CircularProgress } from "@mui/material";
import { GlobalContext } from "../../../context/GlobalContext";
import { TranslateContext } from "../../../context/TranslateContext";

const PayPalComp = ({
  plan,
  productType = "plan",
  paying,
  setPaying,
}) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const { lang } = React.useContext(TranslateContext);

  const isLoading = paying === "paypal";

  async function handlePayPal() {
    setPaying("paypal");
    const res = await hitAxios({
      path: "/api/payment/paypal/create-order",
      admin: false,
      post: true,
      obj:
        productType === "credit_package"
          ? { product_type: productType, package_id: plan.id }
          : { plan_id: plan.id },
    });
    if (res.data.success) {
      window.location.href = res.data.url; // redirect to PayPal hosted page
    } else {
      setPaying("");
    }
  }

  return (
    <Button
      fullWidth
      variant="outlined"
      size="large"
      disabled={!!paying}
      onClick={handlePayPal}
      startIcon={
        isLoading ? (
          <CircularProgress size={18} color="inherit" />
        ) : (
          <span style={{ fontSize: "1.1rem" }}>🅿️</span>
        )
      }
      sx={{
        justifyContent: "flex-start",
        borderRadius: 2,
        fontWeight: 600,
        textTransform: "none",
        fontSize: "0.95rem",
        py: 1.2,
      }}
    >
      {isLoading
        ? lang?.redirecting || "Redirecting..."
        : lang?.payWith_paypal || "Pay with PayPal"}
    </Button>
  );
};

export default PayPalComp;
