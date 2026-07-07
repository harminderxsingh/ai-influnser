import React from "react";
import { Button, CircularProgress } from "@mui/material";
import { GlobalContext } from "../../../context/GlobalContext";
import { TranslateContext } from "../../../context/TranslateContext";
import { withCountry } from "../../../utils/currency";

// load Razorpay script once
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const RazorpayComp = ({
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

  const isLoading = paying === "razorpay";

  async function handleRazorpay() {
    setPaying("razorpay");

    // 1. load script
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("Failed to load Razorpay. Check your internet connection.");
      setPaying("");
      return;
    }

    // 2. create order on backend
    const res = await hitAxios({
      path:
        purchaseMode === "subscription"
          ? "/api/payment/razorpay/create-subscription"
          : "/api/payment/razorpay/create-order",
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

    if (!res.data.success) {
      setPaying("");
      return;
    }

    const {
      orderId,
      subscriptionId,
      amount,
      currency,
      keyId,
      plan: planMeta,
    } = res.data;

    // 3. open Razorpay modal
    const options = {
      key: keyId,
      amount: amount,
      currency: currency,
      name: planMeta.title,
      description: planMeta.description,
      ...(purchaseMode === "subscription"
        ? { subscription_id: subscriptionId }
        : { order_id: orderId }),

      handler: async function (response) {
        // 4. verify on backend after user pays
        const verifyRes = await hitAxios({
          path:
            purchaseMode === "subscription"
              ? "/api/payment/razorpay/verify-subscription"
              : "/api/payment/razorpay/verify-order",
          admin: false,
          post: true,
          obj:
            purchaseMode === "subscription"
              ? {
                  razorpay_subscription_id:
                    response.razorpay_subscription_id || subscriptionId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }
              : {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  ...(productType === "credit_package"
                    ? { product_type: productType, package_id: plan.id }
                    : { plan_id: plan.id }),
                },
        });

        if (verifyRes.data.success) {
          // redirect to success page
          window.location.href = `/checkout/success?gateway=razorpay&verified=1&product_type=${purchaseMode === "subscription" ? "plan_subscription" : productType}`;
        } else {
          alert(verifyRes.data.msg || "Payment verification failed");
          setPaying("");
        }
      },

      modal: {
        ondismiss: function () {
          setPaying(""); // user closed modal without paying
        },
      },

      prefill: {
        name: "",
        email: "",
      },

      theme: {
        color: "#6366f1", // matches your primary color — or pass as prop
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", function (response) {
      console.log("Razorpay payment failed:", response.error);
      alert(response.error?.description || "Payment failed");
      setPaying("");
    });

    rzp.open();
    setPaying(""); // reset after modal opens — modal handles its own state
  }

  return (
    <Button
      fullWidth
      variant="outlined"
      size="large"
      disabled={!!paying}
      onClick={handleRazorpay}
      startIcon={
        isLoading ? (
          <CircularProgress size={18} color="inherit" />
        ) : (
          <span style={{ fontSize: "1.1rem" }}>💰</span>
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
        ? lang?.loading || "Loading..."
        : lang?.payWith_razorpay || "Pay with Razorpay"}
    </Button>
  );
};

export default RazorpayComp;
