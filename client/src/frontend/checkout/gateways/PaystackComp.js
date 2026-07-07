import React from "react";
import { Button, CircularProgress } from "@mui/material";
import { GlobalContext } from "../../../context/GlobalContext";
import { TranslateContext } from "../../../context/TranslateContext";

import { withCountry } from "../../../utils/currency";

const PaystackComp = ({
  plan,
  productType = "plan",
  purchaseMode = "payment",
  billingInterval = "monthly",
  country,
  paying,
  setPaying,
}) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const { lang } = React.useContext(TranslateContext);

  const isLoading = paying === "paystack";

  async function handlePaystack() {
    setPaying("paystack");
    const res = await hitAxios({
      path:
        purchaseMode === "subscription"
          ? "/api/payment/paystack/create-subscription"
          : "/api/payment/paystack/create-order",
      admin: false,
      post: true,
      obj: withCountry(
        purchaseMode === "subscription"
          ? { plan_id: plan.id, billing_interval: billingInterval, country }
          : productType === "credit_package"
            ? { product_type: productType, package_id: plan.id, country }
            : { plan_id: plan.id, country },
      ),
    });
    if (res.data.success) {
      window.location.href = res.data.url; // redirect to Paystack hosted page
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
      onClick={handlePaystack}
      startIcon={
        isLoading ? (
          <CircularProgress size={18} color="inherit" />
        ) : (
          <span style={{ fontSize: "1.1rem" }}>🟩</span>
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
        : lang?.payWith_paystack || "Pay with Paystack"}
    </Button>
  );
};

export default PaystackComp;
