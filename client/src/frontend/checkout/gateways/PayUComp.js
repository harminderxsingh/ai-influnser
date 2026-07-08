import React from "react";
import { Button, CircularProgress } from "@mui/material";
import { GlobalContext } from "../../../context/GlobalContext";
import { TranslateContext } from "../../../context/TranslateContext";
import { withCountry } from "../../../utils/currency";

const PayUComp = ({
  plan,
  productType = "plan",
  paying,
  setPaying,
}) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const { lang } = React.useContext(TranslateContext);

  const isLoading = paying === "payu";

  function submitPayUForm(url, fields) {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;
    form.style.display = "none";

    Object.entries(fields || {}).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value == null ? "" : String(value);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }

  async function handlePayU() {
    setPaying("payu");
    const res = await hitAxios({
      path: "/api/payment/payu/create-order",
      admin: false,
      post: true,
      obj: withCountry(
        productType === "credit_package"
          ? { product_type: productType, package_id: plan.id }
          : { plan_id: plan.id },
      ),
    });

    if (res?.data?.success && res.data.url && res.data.fields) {
      submitPayUForm(res.data.url, res.data.fields);
      return;
    }
    setPaying("");
  }

  return (
    <Button
      fullWidth
      variant="outlined"
      size="large"
      disabled={!!paying}
      onClick={handlePayU}
      startIcon={
        isLoading ? (
          <CircularProgress size={18} color="inherit" />
        ) : (
          <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>PU</span>
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
        : lang?.payWith_payu || "Pay with PayU"}
    </Button>
  );
};

export default PayUComp;
