import React from "react";
import {
  Box,
  CircularProgress,
  Container,
  Stack,
  Typography,
  Chip,
} from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { GlobalContext } from "../context/GlobalContext";
import { TranslateContext } from "../context/TranslateContext";
import { useCustomTheme } from "../utils/useCustomTheme";
import NotFoundPage from "./NotFoundPage";
import Header from "./components/Header";
import Hero from "./components/Hero";
import WordsToWorlds from "./components/WordsToWorlds";
import FloatingBadge from "./components/FloatingBadge";
import ModelCard from "./components/ModelCard";
import TestimonialCard from "./components/TestimonialCard";
import FaqComp from "./components/FaqComp";
import FooterComp from "./components/FooterComp";

function parseEmbed(embedHtml = "") {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = embedHtml;
  const forge = wrapper.querySelector(".forgeContainer");
  const script = wrapper.querySelector("script[src]");

  return {
    attrs: forge
      ? Array.from(forge.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {})
      : {},
    scriptSrc: script?.getAttribute("src") || "",
  };
}

function normalizePagePath(pathname) {
  const raw = String(pathname || "").replace(/^\/+|\/+$/g, "");
  if (!raw || raw === "launchpad") return "";
  if (raw.startsWith("launchpad/")) return raw.slice("launchpad/".length);
  return raw;
}

function scrollToOffer() {
  const el = document.getElementById("pricing");
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 96;
  window.scrollTo({ top, behavior: "smooth" });
}

const OfferSection = ({ settings, embedRef }) => {
  const { lang } = React.useContext(TranslateContext);
  const { config, isDark } = useCustomTheme();
  const plan = settings?.plan;
  const productName =
    settings?.product_name || plan?.title || lang?.launchpadOfferTitle || "Special Offer";

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
  const chipBg = isDark
    ? config.chip?.backgroundColor_dark
    : config.chip?.backgroundColor_light;
  const chipColor = isDark ? config.chip?.color_dark : config.chip?.color_light;

  const features = [
    plan?.credits != null
      ? `${plan.credits} ${lang?.pricing_aiCredits || "AI Credits"}`
      : null,
    plan?.max_characters != null
      ? `${plan.max_characters} ${lang?.pricing_aiModels || "AI Models"}`
      : null,
    lang?.pricing_lifetimeAccess || "Lifetime plan access",
    lang?.launchpadInstantAccess || "Instant access after purchase",
    lang?.launchpadEmailLogin || "Login details emailed automatically",
  ].filter(Boolean);

  return (
    <Box
      id="pricing"
      sx={{
        py: { xs: 8, md: 12 },
        background: bgDefault,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Container maxWidth="md">
        <Stack alignItems="center" spacing={2} textAlign="center" mb={5}>
          <Chip
            icon={
              <AutoAwesomeIcon
                sx={{ fontSize: "14px !important", color: `${chipColor} !important` }}
              />
            }
            label={lang?.launchpadExclusive || "Exclusive Launchpad Offer"}
            sx={{
              background: chipBg,
              border: `1px solid ${borderColor}`,
              color: chipColor,
              fontWeight: config.chip?.fontWeight || 500,
              fontSize: config.chip?.fontSize || "0.75rem",
              fontFamily: config.font_family,
              borderRadius: `${config.chip?.borderRadius || 6}px`,
              height: config.chip?.height || 28,
            }}
          />
          <Typography
            component="h2"
            sx={{
              fontSize: { xs: "1.75rem", md: "2.5rem" },
              fontWeight: config.font_weight_bold || 700,
              color: textPrimary,
              fontFamily: config.font_family,
              letterSpacing: "-0.5px",
              lineHeight: 1.2,
            }}
          >
            {productName}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: "0.95rem", md: "1.05rem" },
              color: textSecondary,
              fontFamily: config.font_family,
              maxWidth: 520,
              lineHeight: 1.7,
            }}
          >
            {lang?.launchpadOfferSub ||
              "Get full access instantly. Complete your purchase below and your account will be ready to use."}
          </Typography>
        </Stack>

        <Box
          sx={{
            borderRadius: `${config.card?.borderRadius || 12}px`,
            border: `1.5px solid ${accentColor || borderColor}`,
            background: bgPaper,
            p: { xs: 3, md: 4 },
            boxShadow: isDark
              ? "0 24px 60px rgba(0,0,0,0.45)"
              : "0 24px 60px rgba(0,0,0,0.08)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={4}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Box flex={1}>
              {plan?.title && (
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: accentColor || textSecondary,
                    mb: 1,
                    fontFamily: config.font_family,
                  }}
                >
                  {plan.title}
                </Typography>
              )}
              {(plan?.price != null || plan?.price_strike != null) && (
                <Stack direction="row" spacing={1.5} alignItems="baseline" mb={2.5}>
                  {plan?.price_strike != null &&
                    String(plan.price_strike) !== "" &&
                    Number(plan.price_strike) > Number(plan.price || 0) && (
                      <Typography
                        sx={{
                          fontSize: "1.25rem",
                          color: textSecondary,
                          textDecoration: "line-through",
                          fontFamily: config.font_family,
                        }}
                      >
                        ${plan.price_strike}
                      </Typography>
                    )}
                  {plan?.price != null && (
                    <Typography
                      sx={{
                        fontSize: { xs: "2.25rem", md: "2.75rem" },
                        fontWeight: 700,
                        color: textPrimary,
                        fontFamily: config.font_family,
                        lineHeight: 1,
                      }}
                    >
                      ${plan.price}
                    </Typography>
                  )}
                </Stack>
              )}

              <Stack spacing={1.25}>
                {features.map((feature) => (
                  <Stack key={feature} direction="row" spacing={1.25} alignItems="center">
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.05)",
                        flexShrink: 0,
                      }}
                    >
                      <CheckRoundedIcon
                        sx={{ fontSize: 14, color: accentColor || textPrimary }}
                      />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: "0.9rem",
                        color: textPrimary,
                        fontFamily: config.font_family,
                      }}
                    >
                      {feature}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 120,
                p: { xs: 2, md: 3 },
                borderRadius: `${(config.card?.borderRadius || 12) - 2}px`,
                border: `1px dashed ${borderColor}`,
                background: isDark
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(0,0,0,0.015)",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  color: textSecondary,
                  mb: 2,
                  fontFamily: config.font_family,
                  textAlign: "center",
                }}
              >
                {lang?.launchpadCheckoutHint || "Secure checkout — click below to get started"}
              </Typography>
              <Box
                ref={embedRef}
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  "& .forgeContainer, & iframe, & button, & a": {
                    maxWidth: "100%",
                  },
                }}
              />
            </Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

const LaunchpadPage = () => {
  const { hitAxios } = React.useContext(GlobalContext);
  const { lang } = React.useContext(TranslateContext);
  const embedRef = React.useRef(null);
  const [loading, setLoading] = React.useState(true);
  const [settings, setSettings] = React.useState(null);
  const [web, setWeb] = React.useState({});
  const pagePath = normalizePagePath(window.location.pathname);

  React.useEffect(() => {
    (async () => {
      try {
        const [launchpadRes, webRes] = await Promise.all([
          hitAxios({
            path: `/api/launchpad/public-settings?path=${encodeURIComponent(pagePath)}`,
            admin: false,
            post: false,
            showLoading: false,
            showSnackbar: false,
          }),
          hitAxios({
            path: "/api/web/get_web_public",
            admin: false,
            post: false,
            showLoading: false,
            showSnackbar: false,
          }),
        ]);
        if (launchpadRes?.data?.success) setSettings(launchpadRes.data.data);
        if (webRes?.data?.success) setWeb(webRes.data.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [hitAxios, pagePath]);

  React.useEffect(() => {
    if (!settings?.active || !settings?.embed_html || !embedRef.current) {
      return undefined;
    }

    const { attrs, scriptSrc } = parseEmbed(settings.embed_html);
    embedRef.current.innerHTML = "";

    const forgeDiv = document.createElement("div");
    Object.entries(attrs).forEach(([key, value]) => {
      forgeDiv.setAttribute(key, value);
    });
    if (!forgeDiv.className) forgeDiv.className = "forgeContainer";
    embedRef.current.appendChild(forgeDiv);

    if (!scriptSrc) return undefined;

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
      if (embedRef.current) embedRef.current.innerHTML = "";
    };
  }, [settings]);

  if (loading) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!settings?.active || !settings?.embed_html) {
    return <NotFoundPage />;
  }

  const productName = settings.product_name || settings.plan?.title || "";

  return (
    <div>
      <Header web={web} />

      <section id="overview">
        <Hero
          lang={lang}
          web={web}
          onPrimaryClick={scrollToOffer}
          primaryLabel={lang?.launchpadCtaGetAccess || "Get Access"}
          headlineAccent={productName || undefined}
        />
      </section>

      <section id="features">
        <WordsToWorlds lang={lang} web={web} />
      </section>

      <FloatingBadge lang={lang} web={web} />
      <ModelCard lang={lang} web={web} />

      <OfferSection settings={settings} embedRef={embedRef} />

      <TestimonialCard lang={lang} web={web} />

      <section id="faq">
        <FaqComp lang={lang} web={web} />
      </section>

      <FooterComp web={web} />
    </div>
  );
};

export default LaunchpadPage;
