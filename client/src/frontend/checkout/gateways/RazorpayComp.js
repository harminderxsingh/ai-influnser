import React from "react";
import { Button, CircularProgress } from "@mui/material";
import { GlobalContext } from "../../../context/GlobalContext";
import { TranslateContext } from "../../../context/TranslateContext";

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
  paying,
  setPaying,
}) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const { lang } = React.useContext(TranslateContext);

  const isLoading = paying === "razorpay";

  async function handleRazorpay() {
    setPaying("razorpay");

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("Failed to load Razorpay. Check your internet connection.");
      setPaying("");
      return;
    }

    const res = await hitAxios({
      path: "/api/payment/razorpay/create-order",
      admin: false,
      post: true,
      obj:
        productType === "credit_package"
          ? { product_type: productType, package_id: plan.id }
          : { plan_id: plan.id },
    });

    if (!res.data.success) {
      setPaying("");
      return;
    }

    const {
      orderId,
      amount,
      currency,
      keyId,
      plan: planMeta,
      isTestMode,
    } = res.data;

    if (isTestMode) {
      console.info(
        "Razorpay test mode: use test cards from Razorpay docs. USD currency requires international/multi-currency enabled on your Razorpay account.",
      );
    }

    const options = {
      key: keyId,
      amount,
      currency: currency || "USD",
      name: planMeta.title,
      description: planMeta.description,
      order_id: orderId,

      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
        emi: false,
        paylater: false,
      },

      config: {
        display: {
          preferences: {
            show_default_blocks: true,
          },
        },
      },

      handler: async function (response) {
        const verifyRes = await hitAxios({
          path: "/api/payment/razorpay/verify-order",
          admin: false,
          post: true,
          obj: {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            ...(productType === "credit_package"
              ? { product_type: productType, package_id: plan.id }
              : { plan_id: plan.id }),
          },
        });

        if (verifyRes.data.success) {
          window.location.href = `/checkout/success?gateway=razorpay&verified=1&product_type=${productType}`;
        } else {
          alert(verifyRes.data.msg || "Payment verification failed");
          setPaying("");
        }
      },

      modal: {
        ondismiss: function () {
          setPaying("");
        },
      },

      prefill: {
        name: "",
        email: "",
      },

      theme: {
        color: "#6366f1",
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", function (response) {
      const description = response.error?.description || "Payment failed";
      console.log("Razorpay payment failed:", response.error);
      alert(description);
      setPaying("");
    });

    rzp.open();
    setPaying("");
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
