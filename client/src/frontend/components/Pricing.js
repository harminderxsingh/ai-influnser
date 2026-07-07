import React from "react";
import { Box, Typography } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import StarIcon from "@mui/icons-material/Star";
import CheckIcon from "@mui/icons-material/Check";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { GlobalContext } from "../../context/GlobalContext";
import { useCurrency } from "../../context/CurrencyContext";
import { TranslateContext } from "../../context/TranslateContext";
import { useCustomTheme } from "../../utils/useCustomTheme";
import moment from "moment";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

// ─────────────────────────────────────────────
const formatExpiry = (days, lang) => {
  const d = parseInt(days);
  const duration = moment.duration(d, "days");
  if (d >= 365) {
    const y = Math.round(duration.asYears());
    return `${y} ${y > 1 ? lang?.pricing_years || "years" : lang?.pricing_year || "year"}`;
  }
  if (d >= 30) {
    const m = Math.round(duration.asMonths());
    return `${m} ${m > 1 ? lang?.pricing_months || "months" : lang?.pricing_month || "month"}`;
  }
  return `${d} ${d > 1 ? lang?.pricing_days || "days" : lang?.pricing_day || "day"}`;
};

const buildFeatures = (plan, lang) => [
  `${plan.credits} ${lang?.pricing_aiCredits || "AI Credits"}`,
  `${plan.max_characters} ${lang?.pricing_aiModels || "AI Models"}`,
  `${lang?.pricing_accessFor || "Access for"} ${formatExpiry(plan.expiry_days, lang)}`,
];

// ─────────────────────────────────────────────
const PricingCard = ({ plan, history, billingInterval, formatPrice }) => {
  const { lang } = React.useContext(TranslateContext);
  const { config, isDark } = useCustomTheme();

  const bgDefault = isDark
    ? config.background_default_dark
    : config.background_default_light;
  const bgPaper = isDark
    ? config.background_paper_dark
    : config.background_paper_light;
  const textPrimary = isDark
    ? config.text_primary_dark
    : config.text_primary_light;
  const textSecondary = isDark
    ? config.text_secondary_dark
    : config.text_secondary_light;
  const borderColor = isDark ? config.border_dark : config.border_light;
  const accentColor = isDark
    ? config.text_accent_dark
    : config.text_accent_light;
  const btnBg = isDark
    ? config.button.contained.backgroundColor_dark
    : config.button.contained.backgroundColor_light;
  const btnColor = isDark
    ? config.button.contained.color_dark
    : config.button.contained.color_light;

  const isPopular = plan.popular === 1;
  const displayPrice =
    billingInterval === "yearly"
      ? plan.yearly_price || plan.price
      : plan.monthly_price || plan.price;
  const isFree = parseFloat(displayPrice) === 0;
  const features = buildFeatures(plan, lang);
  const expiryLabel = formatExpiry(plan.expiry_days, lang);
  const createdLabel = moment(plan.createdAt).format("MMM YYYY");

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: `${config.card.borderRadius}px`,
        border: `1.5px solid ${isPopular ? accentColor || btnBg : borderColor}`,
        background: isPopular
          ? isDark
            ? `linear-gradient(145deg, ${bgPaper} 0%, ${bgDefault} 100%)`
            : `linear-gradient(145deg, #fff 0%, #f8f8ff 100%)`
          : bgPaper,
        p: { xs: 3, md: 3.5 },
        display: "flex",
        flexDirection: "column",
        boxShadow: isPopular
          ? isDark
            ? `0 0 0 1px ${accentColor || btnBg}33, 0 24px 60px rgba(0,0,0,0.55)`
            : `0 0 0 1px ${accentColor || btnBg}22, 0 24px 60px rgba(0,0,0,0.12)`
          : isDark
            ? "0 8px 32px rgba(0,0,0,0.4)"
            : "0 8px 32px rgba(0,0,0,0.07)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: isDark
            ? "0 32px 80px rgba(0,0,0,0.7)"
            : "0 32px 80px rgba(0,0,0,0.15)",
        },
        width: { xs: "100%", md: isPopular ? 310 : 280 },
        flexShrink: 0,
      }}
    >
      {/* ── Popular badge ── */}
      {isPopular && (
        <Box
          sx={{
            position: "absolute",
            top: -13,
            left: "50%",
            transform: "translateX(-50%)",
            background: accentColor || btnBg,
            borderRadius: "50px",
            px: 2,
            py: 0.4,
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <StarIcon sx={{ fontSize: "0.65rem", color: btnColor }} />
          <Typography
            sx={{
              fontSize: "0.65rem",
              fontWeight: 700,
              color: btnColor,
              fontFamily: config.font_family,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {lang?.pricing_mostPopular || "Most Popular"}
          </Typography>
        </Box>
      )}

      {/* ── Title + since date ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 0.5,
        }}
      >
        <Typography
          sx={{
            fontSize: "1.05rem",
            fontWeight: config.font_weight_bold,
            color: textPrimary,
            fontFamily: config.font_family,
          }}
        >
          {plan.title}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.65rem",
            color: textSecondary,
            fontFamily: config.font_family,
            opacity: 0.5,
          }}
        >
          {lang?.pricing_since || "Since"} {createdLabel}
        </Typography>
      </Box>

      {/* ── Price ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 0.8,
          mt: 2,
          mb: 0.5,
        }}
      >
        {isFree ? (
          <Typography
            sx={{
              fontSize: "2.4rem",
              fontWeight: config.font_weight_bold,
              color: textPrimary,
              fontFamily: config.font_family,
              lineHeight: 1,
            }}
          >
            {lang?.pricing_free || "Free"}
          </Typography>
        ) : (
          <>
            <Typography
              sx={{
                fontSize: "2.4rem",
                fontWeight: config.font_weight_bold,
                color: textPrimary,
                fontFamily: config.font_family,
                lineHeight: 1,
              }}
            >
              {formatPrice(displayPrice)}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.8rem",
                color: textSecondary,
                fontFamily: config.font_family,
                mb: 0.5,
              }}
            >
              / {billingInterval === "yearly" ? lang?.year || "year" : lang?.month || "month"}
            </Typography>
          </>
        )}
      </Box>

      {/* ── Strike price ── */}
      {plan.price_strike && parseFloat(plan.price_strike) > 0 && (
        <Typography
          sx={{
            fontSize: "0.78rem",
            color: textSecondary,
            fontFamily: config.font_family,
            textDecoration: "line-through",
            mb: 2.5,
            opacity: 0.55,
          }}
        >
          {lang?.pricing_was || "Was"} {formatPrice(plan.price_strike)}
        </Typography>
      )}

      {/* ── Pills: Credits + Expiry + Max Models ── */}
      <Box sx={{ display: "flex", gap: 1, mt: 2, mb: 3, flexWrap: "wrap" }}>
        {/* Credits pill */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            px: 1.2,
            py: 0.45,
            borderRadius: "50px",
            border: `1px solid ${accentColor || btnBg}55`,
            background: isDark
              ? `${accentColor || btnBg}15`
              : `${accentColor || btnBg}10`,
          }}
        >
          <BoltIcon sx={{ fontSize: "0.8rem", color: accentColor || btnBg }} />
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: config.font_weight_semibold,
              color: accentColor || btnBg,
              fontFamily: config.font_family,
            }}
          >
            {plan.credits} {lang?.pricing_credits || "Credits"}
          </Typography>
        </Box>

        {/* Expiry pill */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            px: 1.2,
            py: 0.45,
            borderRadius: "50px",
            border: `1px solid ${borderColor}`,
            background: isDark ? config.glass_bg_dark : config.glass_bg_light,
          }}
        >
          <CalendarTodayIcon
            sx={{ fontSize: "0.8rem", color: textSecondary }}
          />
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: config.font_weight_medium,
              color: textSecondary,
              fontFamily: config.font_family,
            }}
          >
            {expiryLabel}
          </Typography>
        </Box>

        {/* Max Models pill */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            px: 1.2,
            py: 0.45,
            borderRadius: "50px",
            border: `1px solid ${borderColor}`,
            background: isDark ? config.glass_bg_dark : config.glass_bg_light,
          }}
        >
          <SmartToyIcon sx={{ fontSize: "0.8rem", color: textSecondary }} />
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: config.font_weight_medium,
              color: textSecondary,
              fontFamily: config.font_family,
            }}
          >
            {plan.max_characters} {lang?.pricing_models || "Models"}
          </Typography>
        </Box>
      </Box>

      {/* ── Divider ── */}
      <Box
        sx={{ height: "1px", background: borderColor, mb: 2.5, opacity: 0.5 }}
      />

      {/* ── Features list ── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.2,
          flex: 1,
          mb: 3,
        }}
      >
        {features.map((feat) => (
          <Box
            key={feat}
            sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
          >
            <Box
              sx={{
                mt: 0.15,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: isDark
                  ? `${accentColor || btnBg}22`
                  : `${accentColor || btnBg}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <CheckIcon
                sx={{ fontSize: "0.7rem", color: accentColor || btnBg }}
              />
            </Box>
            <Typography
              sx={{
                fontSize: "0.82rem",
                color: textSecondary,
                fontFamily: config.font_family,
                lineHeight: 1.5,
              }}
            >
              {feat}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ── CTA ── */}
      <Box
        onClick={() => history.push(`/checkout/${plan.id}?billing=${billingInterval}`)}
        component="a"
        sx={{
          width: "100%",
          py: 1.3,
          borderRadius: "50px",
          background: isPopular ? accentColor || btnBg : "transparent",
          border: `1.5px solid ${isPopular ? "transparent" : borderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          textDecoration: "none",
          transition: "all 0.25s ease",
          "&:hover": {
            background: accentColor || btnBg,
            borderColor: "transparent",
            transform: "scale(1.02)",
          },
          "&:hover .cta-text": { color: btnColor },
        }}
      >
        <Typography
          className="cta-text"
          sx={{
            fontSize: "0.85rem",
            fontWeight: config.font_weight_semibold,
            color: isPopular ? btnColor : textPrimary,
            fontFamily: config.font_family,
            transition: "color 0.25s ease",
          }}
        >
          {isFree
            ? `${lang?.pricing_ctaFree || "Start for Free"}`
            : `${lang?.pricing_ctaGet || "Get"} ${plan.title}`}{" "}
          →
        </Typography>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────
const Pricing = () => {
  const history = useHistory();
  const [plans, setPlans] = React.useState([]);
  const [billingInterval, setBillingInterval] = React.useState("monthly");
  const { hitAxios } = React.useContext(GlobalContext);
  const { formatPrice } = useCurrency();
  const { lang } = React.useContext(TranslateContext);
  const { config, isDark } = useCustomTheme();

  const bgDefault = isDark
    ? config.background_default_dark
    : config.background_default_light;
  const textPrimary = isDark
    ? config.text_primary_dark
    : config.text_primary_light;
  const textSecondary = isDark
    ? config.text_secondary_dark
    : config.text_secondary_light;
  const borderColor = isDark ? config.border_dark : config.border_light;
  const accentColor = isDark
    ? config.text_accent_dark
    : config.text_accent_light;
  const btnBg = isDark
    ? config.button.contained.backgroundColor_dark
    : config.button.contained.backgroundColor_light;

  async function getPlans() {
    const res = await hitAxios({
      path: "/api/plan/get_all",
      post: false,
      admin: false,
    });
    if (res.data.success) {
      const sorted = [...res.data.data].sort(
        (a, b) => parseFloat(a.price) - parseFloat(b.price),
      );
      setPlans(sorted);
    }
  }

  React.useEffect(() => {
    getPlans();
  }, []);

  return (
    <Box
      sx={{
        background: bgDefault,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: { xs: 3, md: 8, lg: 12 },
        py: { xs: 8, md: 10 },
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <Box sx={{ textAlign: "center", mb: 7, maxWidth: 560 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            border: `1px solid ${borderColor}`,
            borderRadius: "50px",
            px: 1.5,
            py: 0.5,
            mb: 2.5,
          }}
        >
          <FiberManualRecordIcon
            sx={{
              fontSize: "0.45rem",
              color: accentColor || btnBg,
              filter: `drop-shadow(0 0 4px ${accentColor || btnBg})`,
              animation: "pulse 2s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.4 },
              },
            }}
          />
          <Typography
            sx={{
              fontSize: "0.7rem",
              fontWeight: config.font_weight_semibold,
              color: textSecondary,
              fontFamily: config.font_family,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {lang?.pricing_badge || "Simple Pricing"}
          </Typography>
        </Box>

        <Typography
          component="h2"
          sx={{
            fontSize: { xs: "2rem", md: "2.8rem" },
            fontWeight: config.font_weight_bold,
            color: textPrimary,
            fontFamily: config.font_family,
            lineHeight: 1.15,
            letterSpacing: "-1px",
            mb: 1.5,
          }}
        >
          {lang?.pricing_headline1 || "One plan for every"}{" "}
          <Box component="span" sx={{ color: accentColor || textSecondary }}>
            {lang?.pricing_headlineAccent || "creator."}
          </Box>
        </Typography>

        <Typography
          sx={{
            fontSize: "1rem",
            color: textSecondary,
            fontFamily: config.font_family,
            lineHeight: 1.7,
          }}
        >
          {lang?.pricing_subheadline ||
            "Start free, scale when ready. No hidden fees — just credits that power your AI content."}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mb: 4 }}>
        {[
          { key: "monthly", label: lang?.monthly || "Monthly" },
          { key: "yearly", label: lang?.yearly || "Yearly" },
        ].map((item) => (
          <Box
            key={item.key}
            onClick={() => setBillingInterval(item.key)}
            sx={{
              px: 2.5,
              py: 0.8,
              borderRadius: "50px",
              cursor: "pointer",
              border: `1px solid ${
                billingInterval === item.key ? accentColor || btnBg : borderColor
              }`,
              color:
                billingInterval === item.key ? accentColor || btnBg : textSecondary,
              fontWeight: config.font_weight_semibold,
              fontFamily: config.font_family,
              fontSize: "0.85rem",
            }}
          >
            {item.label}
          </Box>
        ))}
      </Box>

      {/* ── Cards ── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "center", md: "flex-end" },
          justifyContent: "center",
          gap: { xs: 3, md: 2.5 },
          width: "100%",
          maxWidth: "960px",
        }}
      >
        {plans.map((plan) => (
          <PricingCard
            history={history}
            key={plan.id}
            plan={plan}
            billingInterval={billingInterval}
            formatPrice={formatPrice}
          />
        ))}
      </Box>

      {/* ── Footer note ── */}
      <Typography
        sx={{
          mt: 5,
          fontSize: "0.78rem",
          color: textSecondary,
          fontFamily: config.font_family,
          opacity: 0.6,
          textAlign: "center",
        }}
      >
        {lang?.pricing_footerNote ||
          "All plans include access to the AI studio. Credits are valid for the full plan duration."}
      </Typography>
    </Box>
  );
};

export default Pricing;
