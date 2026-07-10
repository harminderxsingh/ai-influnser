import React from "react";
import { TranslateContext } from "../../context/TranslateContext";
import { GlobalContext } from "../../context/GlobalContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useParams, useRouteMatch } from "react-router-dom";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
  Alert,
  alpha,
  useTheme,
} from "@mui/material";
import { CreditCardOutlined, StarOutlined } from "@mui/icons-material";
import Header from "../components/Header";
import FooterComp from "../components/FooterComp";

import PayPalComp from "./gateways/PayPalComp";
import RazorpayComp from "./gateways/RazorpayComp";
import Free from "./gateways/Free";

// ── maps gateway key → component ─────────────────────────────────────────────
const GATEWAY_COMPONENTS = {
  paypal: PayPalComp,
  razorpay: RazorpayComp,
  free: Free,
};

const CheckOut = () => {
  const { lang } = React.useContext(TranslateContext);
  const { hitAxios } = React.useContext(GlobalContext);
  const { currency, convertPrice } = useCurrency();
  const { id } = useParams();
  const creditMatch = useRouteMatch("/checkout/credits/:id");
  const productType = creditMatch ? "credit_package" : "plan";
  const theme = useTheme();

  const hitAxiosRef = React.useRef(hitAxios);

  const [plan, setPlan] = React.useState(null);
  const [gateways, setGateways] = React.useState({});
  const [paying, setPaying] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [loadingCheckout, setLoadingCheckout] = React.useState(true);
  const [checkoutError, setCheckoutError] = React.useState("");

  // ── fetch once when id is available ──────────────────────────────────────
  React.useEffect(() => {
    if (!id || done) return;
    setDone(true);

    (async () => {
      setLoadingCheckout(true);
      setCheckoutError("");
      try {
        const [planRes, gwRes] = await Promise.all([
          hitAxiosRef.current({
            path:
              productType === "credit_package"
                ? "/api/credit-package/get_by_id"
                : "/api/plan/get_plan_by_id",
            admin: false,
            post: true,
            obj: { id },
            showLoading: false,
          }),
          hitAxiosRef.current({
            path: "/api/payment/active-gateways",
            admin: false,
            post: false,
            showLoading: false,
          }),
        ]);

        if (planRes?.data?.success) {
          setPlan({ ...planRes.data.data, product_type: productType });
        } else {
          setCheckoutError(
            planRes?.data?.msg || lang?.checkoutLoadFailed || "Unable to load checkout details.",
          );
        }
        if (gwRes?.data?.success) setGateways(gwRes.data.data);
      } finally {
        setLoadingCheckout(false);
      }
    })();
  }, [id, done, productType, lang]);

  // ── only show gateways that are active AND have a component ready ─────────
  const activeGateways = Object.entries(gateways).filter(([key, val]) => {
    if (!val.active || !GATEWAY_COMPONENTS[key]) return false;
    if (currency.country !== "IN" && key === "razorpay") {
      return false;
    }
    return true;
  });

  // ── currency conversion ───────────────────────────────────────────────────
  const selectedPrice = plan?.price;

  const localPrice = plan ? convertPrice(selectedPrice || 0) : 0;

  const localPriceStrike = plan?.price_strike
    ? convertPrice(plan.price_strike)
    : null;

  const discount = localPriceStrike
    ? Math.round(((localPriceStrike - localPrice) / localPriceStrike) * 100)
    : null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Header />
      <Box sx={{ height: { xs: 56, md: 64 } }} />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          p: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {loadingCheckout ? (
          <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary">
              {lang?.loadingCheckout || "Loading checkout..."}
            </Typography>
          </Stack>
        ) : !plan?.id ? (
          <Alert severity="error" sx={{ width: "100%", maxWidth: 480 }}>
            {checkoutError ||
              lang?.checkoutLoadFailed ||
              "Unable to load checkout details."}
          </Alert>
        ) : (
          <Box
            sx={{
              width: "100%",
              maxWidth: 480,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              overflow: "hidden",
              bgcolor: "background.paper",
            }}
          >
            {/* ── CARD HEADER ── */}
            <Box
              sx={{
                px: 3,
                py: 2.5,
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <CreditCardOutlined sx={{ color: "primary.main" }} />
              <Typography fontWeight={700} variant="subtitle1">
                {lang?.checkout || "Checkout"}
              </Typography>
              {plan.popular === 1 && (
                <Chip
                  icon={<StarOutlined fontSize="inherit" />}
                  label={lang?.popular || "Popular"}
                  size="small"
                  color="primary"
                  sx={{ ml: "auto", fontWeight: 700, fontSize: "0.7rem" }}
                />
              )}
            </Box>

            <Box p={3}>
              <Stack spacing={3}>
                {/* ── PURCHASE SUMMARY ── */}
                <Stack spacing={1.5}>
                  <Typography variant="h5" fontWeight={800}>
                    {plan.title}
                  </Typography>

                  {/* price row */}
                  <Stack
                    direction="row"
                    alignItems="baseline"
                    gap={1.5}
                    flexWrap="wrap"
                  >
                    <Typography variant="h4" fontWeight={800} color="primary">
                      {currency.symbol}
                      {localPrice}
                    </Typography>

                    {localPriceStrike && (
                      <Typography
                        variant="body1"
                        color="text.disabled"
                        sx={{ textDecoration: "line-through" }}
                      >
                        {currency.symbol}
                        {localPriceStrike}
                      </Typography>
                    )}

                    {discount && (
                      <Chip
                        label={`${discount}% OFF`}
                        size="small"
                        color="success"
                        sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                      />
                    )}
                  </Stack>

                  {/* currency info */}
                  <Typography variant="caption" color="text.disabled">
                    {lang?.priceIn || "Price in"} {currency.code}
                  </Typography>

                  <Divider />

                  {[
                    {
                      label: lang?.credits || "Credits",
                      value: Number(plan.credits).toLocaleString(),
                    },
                    ...(productType === "credit_package"
                      ? [
                          {
                            label: lang?.type || "Type",
                            value: lang?.creditTopUp || "Credit Top-up",
                          },
                        ]
                      : [
                          {
                            label: lang?.maxChars || "Max Characters",
                            value: Number(plan.max_characters).toLocaleString(),
                          },
                          {
                            label: lang?.validity || "Validity",
                            value: lang?.lifetime || "Lifetime",
                          },
                        ]),
                  ].map(({ label, value }) => (
                    <Stack
                      key={label}
                      direction="row"
                      justifyContent="space-between"
                    >
                      <Typography variant="body2" color="text.secondary">
                        {label}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {value}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                <Divider />

                {/* ── PAYMENT METHODS ── */}
                <Stack spacing={1.5}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    letterSpacing={1}
                    textTransform="uppercase"
                    color="text.secondary"
                  >
                    {lang?.selectPayment || "Select Payment Method"}
                  </Typography>

                  {activeGateways.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {lang?.noGateways ||
                        "No payment methods available at the moment."}
                    </Typography>
                  )}

                  {productType === "plan" && plan?.price < 1 ? (
                    <Free
                      plan={plan}
                      currency={currency}
                      paying={paying}
                      setPaying={setPaying}
                      lang={lang}
                    />
                  ) : (
                    <>
                      {activeGateways.map(([key, gwData]) => {
                        const GatewayComp = GATEWAY_COMPONENTS[key];
                        return (
                          <GatewayComp
                            key={key}
                            plan={plan}
                            productType={productType}
                            gwData={gwData}
                            currency={currency}
                            paying={paying}
                            setPaying={setPaying}
                          />
                        );
                      })}
                    </>
                  )}
                </Stack>
              </Stack>
            </Box>
          </Box>
        )}
      </Box>

      <FooterComp />
    </Box>
  );
};

export default CheckOut;
