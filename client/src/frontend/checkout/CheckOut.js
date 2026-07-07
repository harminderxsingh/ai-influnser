import React from "react";
import { TranslateContext } from "../../context/TranslateContext";
import { GlobalContext } from "../../context/GlobalContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useLocation, useParams, useRouteMatch } from "react-router-dom";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { CreditCardOutlined, StarOutlined } from "@mui/icons-material";
import Header from "../components/Header";
import FooterComp from "../components/FooterComp";

import StripeComp from "./gateways/StripeComp";
import PayPalComp from "./gateways/PayPalComp";
import RazorpayComp from "./gateways/RazorpayComp";
import PaystackComp from "./gateways/PaystackComp";
import MercadoPagoComp from "./gateways/MercadoPagoComp";
import Free from "./gateways/Free";
import OfflineCheckout from "./gateways/OfflineCheckout"; // ← new

// ── maps gateway key → component ─────────────────────────────────────────────
const GATEWAY_COMPONENTS = {
  stripe: StripeComp,
  paypal: PayPalComp,
  razorpay: RazorpayComp,
  paystack: PaystackComp,
  mercadopago: MercadoPagoComp,
  free: Free,
};

const CheckOut = () => {
  const { lang } = React.useContext(TranslateContext);
  const { hitAxios } = React.useContext(GlobalContext);
  const { currency, formatPrice, convertPrice, country } = useCurrency();
  const { id } = useParams();
  const location = useLocation();
  const creditMatch = useRouteMatch("/checkout/credits/:id");
  const productType = creditMatch ? "credit_package" : "plan";
  const initialBilling = new URLSearchParams(location.search).get("billing");
  const [billingInterval, setBillingInterval] = React.useState(
    initialBilling === "yearly" ? "yearly" : "monthly",
  );
  const theme = useTheme();

  const hitAxiosRef = React.useRef(hitAxios);

  const [plan, setPlan] = React.useState(null);
  const [gateways, setGateways] = React.useState({});
  const [offlineHtml, setOfflineHtml] = React.useState(""); // ← new
  const [offlineActive, setOfflineActive] = React.useState(false); // ← new
  const [paying, setPaying] = React.useState("");
  const [done, setDone] = React.useState(false);

  // ── fetch once when id is available ──────────────────────────────────────
  React.useEffect(() => {
    if (!id || done) return;
    setDone(true);

    (async () => {
      const [planRes, gwRes, offlineRes] = await Promise.all([
        hitAxiosRef.current({
          path:
            productType === "credit_package"
              ? "/api/credit-package/get_by_id"
              : "/api/plan/get_plan_by_id",
          admin: false,
          post: true,
          obj: { id },
        }),
        hitAxiosRef.current({
          path: "/api/payment/active-gateways",
          admin: false,
          post: false,
        }),
        hitAxiosRef.current({
          // ← new
          path: "/api/payment/offline-details",
          admin: false,
          post: false,
        }),
      ]);

      if (planRes?.data?.success) {
        setPlan({ ...planRes.data.data, product_type: productType });
      }
      if (gwRes?.data?.success) setGateways(gwRes.data.data);
      if (offlineRes?.data?.success) {
        // ← new
        setOfflineHtml(offlineRes.data.html || "");
        setOfflineActive(!!offlineRes.data.active);
      }
    })();
  }, [id, done, productType]);

  // ── only show gateways that are active AND have a component ready ─────────
  const activeGateways = Object.entries(gateways).filter(
    ([key, val]) => val.active && GATEWAY_COMPONENTS[key],
  );

  // ── currency conversion ───────────────────────────────────────────────────
  const selectedPrice =
    productType === "plan"
      ? billingInterval === "yearly"
        ? plan?.yearly_price || plan?.price
        : plan?.monthly_price || plan?.price
      : plan?.price;

  const purchaseMode =
    productType === "plan" && Number(plan?.recurring_enabled ?? 1) === 1
      ? "subscription"
      : "payment";

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
        {!plan?.id ? (
          <Box />
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
                    {lang?.priceIn || "Price in"} {currency.code.toUpperCase()}
                    {currency.rate !== 1 &&
                      ` · 1 USD = ${currency.rate} ${currency.code.toUpperCase()}`}
                  </Typography>

                  {productType === "plan" && purchaseMode === "subscription" && (
                    <Stack direction="row" spacing={1}>
                      {[
                        { key: "monthly", label: lang?.monthly || "Monthly" },
                        { key: "yearly", label: lang?.yearly || "Yearly" },
                      ].map((item) => (
                        <Chip
                          key={item.key}
                          label={item.label}
                          color={
                            billingInterval === item.key ? "primary" : "default"
                          }
                          variant={
                            billingInterval === item.key ? "filled" : "outlined"
                          }
                          onClick={() => setBillingInterval(item.key)}
                          sx={{ fontWeight: 700 }}
                        />
                      ))}
                    </Stack>
                  )}

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
                            value: `${plan.expiry_days} ${lang?.days || "days"}`,
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

                  {activeGateways.length === 0 &&
                    !(productType === "plan" && offlineActive) && (
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
                            purchaseMode={purchaseMode}
                            billingInterval={billingInterval}
                            gwData={gwData}
                            currency={currency}
                            country={country}
                            paying={paying}
                            setPaying={setPaying}
                          />
                        );
                      })}

                      {/* ── OFFLINE PAYMENT ── */}
                      {productType === "plan" && offlineActive && offlineHtml && (
                        <OfflineCheckout
                          plan={plan}
                          currency={currency}
                          html={offlineHtml}
                          paying={paying}
                          setPaying={setPaying}
                          lang={lang}
                        />
                      )}
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
