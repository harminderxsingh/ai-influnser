import React from "react";
import { Box, Typography } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import StarIcon from "@mui/icons-material/Star";
import CheckIcon from "@mui/icons-material/Check";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { GlobalContext } from "../../context/GlobalContext";
import { useCurrency } from "../../context/CurrencyContext";
import { TranslateContext } from "../../context/TranslateContext";
import { useCustomTheme } from "../../utils/useCustomTheme";
import moment from "moment";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { buildLoginPath, isUserLoggedIn } from "../../utils/authRedirect";

// ─────────────────────────────────────────────
const buildFeatures = (plan, lang) => [
  `${plan.credits} ${lang?.pricing_aiCredits || "AI Credits"}`,
  `${plan.max_characters} ${lang?.pricing_aiModels || "AI Models"}`,
  lang?.pricing_lifetimeAccess || "Lifetime plan access",
];

// ─────────────────────────────────────────────
const PricingCard = ({ plan, history, formatPrice }) => {
  const { lang } = React.useContext(TranslateContext);
  const { config, isDark } = useCustomTheme();

  const goCheckout = () => {
    const checkoutPath = `/checkout/${plan.id}`;
    if (isUserLoggedIn()) {
      history.push(checkoutPath);
      return;
    }
    history.push(buildLoginPath(checkoutPath));
  };

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
  const displayPrice = plan.price;
  const isFree = parseFloat(displayPrice) === 0;
  const features = buildFeatures(plan, lang);
  const expiryLabel = lang?.lifetime || "Lifetime";
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
        width: { xs: 280, sm: 300, md: isPopular ? 310 : 290 },
        minHeight: 460,
        flexShrink: 0,
        scrollSnapAlign: "start",
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
              {lang?.oneTime || "one-time"}
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
        onClick={goCheckout}
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
  const { hitAxios } = React.useContext(GlobalContext);
  const { formatPrice } = useCurrency();
  const { lang } = React.useContext(TranslateContext);
  const { config, isDark } = useCustomTheme();
  const sliderRef = React.useRef(null);

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
  const btnColor = isDark
    ? config.button.contained.color_dark
    : config.button.contained.color_light;

  async function getPlans() {
    const res = await hitAxios({
      path: "/api/plan/get_all",
      post: false,
      admin: false,
      showLoading: false,
    });
    if (res?.data?.success) {
      const sorted = [...res.data.data].sort(
        (a, b) => parseFloat(a.price) - parseFloat(b.price),
      );
      setPlans(sorted);
    }
  }

  React.useEffect(() => {
    getPlans();
  }, []);

  const scroll = (dir) => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

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
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "flex-end" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          width: "100%",
          maxWidth: "1100px",
          mb: 5,
          gap: 2.5,
        }}
      >
        <Box sx={{ textAlign: { xs: "center", sm: "left" }, maxWidth: 560 }}>
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

        {plans.length > 1 && (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignSelf: { xs: "center", sm: "flex-end" },
            }}
          >
            <Box
              onClick={() => scroll("left")}
              sx={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: `1px solid ${borderColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  background: accentColor || btnBg,
                  borderColor: "transparent",
                  "& svg": { color: btnColor },
                },
              }}
            >
              <ArrowBackIosNewIcon
                sx={{ fontSize: "0.85rem", color: textSecondary }}
              />
            </Box>
            <Box
              onClick={() => scroll("right")}
              sx={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: `1px solid ${borderColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  background: accentColor || btnBg,
                  borderColor: "transparent",
                  "& svg": { color: btnColor },
                },
              }}
            >
              <ArrowForwardIosIcon
                sx={{ fontSize: "0.85rem", color: textSecondary }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* ── Cards slider ── */}
      <Box
        ref={sliderRef}
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          gap: 2.5,
          width: "100%",
          maxWidth: "1100px",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          pt: 2,
          pb: 2,
          px: 0.5,
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        {plans.map((plan) => (
          <PricingCard
            history={history}
            key={plan.id}
            plan={plan}
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
          "All plans include lifetime access to the AI studio. Buy extra credits whenever you need more."}
      </Typography>
    </Box>
  );
};

export default Pricing;
