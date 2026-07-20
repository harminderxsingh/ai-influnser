import React from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  CheckCircleOutlined,
  DashboardOutlined,
  LoginOutlined,
  SupportAgentOutlined,
  AutoAwesomeOutlined,
  MailOutline,
  ArrowForward,
} from "@mui/icons-material";
import Header from "./components/Header";
import FooterComp from "./components/FooterComp";
import { GlobalContext } from "../context/GlobalContext";
import { TranslateContext } from "../context/TranslateContext";
import { useCustomTheme } from "../utils/useCustomTheme";
import { isUserLoggedIn } from "../utils/authRedirect";

const StepItem = ({ step, title, body, textPrimary, textSecondary, borderColor, accent }) => (
  <Box
    sx={{
      display: "flex",
      gap: 2,
      alignItems: "flex-start",
      p: { xs: 2, md: 2.5 },
      borderRadius: 2,
      border: `1px solid ${borderColor}`,
      bgcolor: "background.paper",
    }}
  >
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: alpha(accent, 0.12),
        color: accent,
        fontWeight: 700,
        fontSize: "0.9rem",
      }}
    >
      {step}
    </Box>
    <Box>
      <Typography
        sx={{ fontWeight: 700, color: textPrimary, mb: 0.5, fontSize: "1rem" }}
      >
        {title}
      </Typography>
      <Typography sx={{ color: textSecondary, fontSize: "0.9rem", lineHeight: 1.6 }}>
        {body}
      </Typography>
    </Box>
  </Box>
);

const ThankYouPage = ({
  productType: productTypeProp,
  embedded = false,
}) => {
  const history = useHistory();
  const location = useLocation();
  const theme = useTheme();
  const { hitAxios } = React.useContext(GlobalContext);
  const { lang } = React.useContext(TranslateContext);
  const { config, isDark } = useCustomTheme();
  const [web, setWeb] = React.useState({});

  const params = new URLSearchParams(location.search);
  const productType =
    productTypeProp || params.get("product_type") || params.get("type") || "plan";
  const isCredits = productType === "credit_package";

  React.useEffect(() => {
    (async () => {
      const res = await hitAxios({
        path: "/api/web/get_web_public",
        post: false,
        admin: false,
        showLoading: false,
      });
      if (res?.data?.success) setWeb(res.data.data || {});
    })();
  }, [hitAxios]);

  const textPrimary = isDark
    ? config.text_primary_dark
    : config.text_primary_light;
  const textSecondary = isDark
    ? config.text_secondary_dark
    : config.text_secondary_light;
  const borderColor = isDark ? config.border_dark : config.border_light;
  const accent = theme.palette.primary.main;
  const siteName = web?.site_name || lang?.appName || "My Avatar Lab";
  const loggedIn = isUserLoggedIn();

  const dashboardPath = isCredits ? "/user?page=buy-credits" : "/user";

  const goDashboard = () => {
    if (loggedIn) {
      history.push(dashboardPath);
      return;
    }
    history.push(`/user/login?redirect=${encodeURIComponent(dashboardPath)}`);
  };

  const steps = [
    {
      title: lang?.tyStep1Title || "Sign in to your account",
      body:
        lang?.tyStep1Body ||
        `Use the email you purchased with to log in at ${siteName}. If you already have a session open, go straight to your dashboard.`,
    },
    {
      title: lang?.tyStep2Title || "Open your dashboard",
      body:
        lang?.tyStep2Body ||
        (isCredits
          ? "Your credits are already added. From the dashboard you can check your balance and start creating."
          : "Your plan is active. From the dashboard you can create influencers, generate content, and manage your workspace."),
    },
    {
      title: lang?.tyStep3Title || "Start creating",
      body:
        lang?.tyStep3Body ||
        "Pick one workflow — influencer, reel, script video, or content writer — and ship your first piece. Keep it simple, then improve as you go.",
    },
  ];

  const unlocked = isCredits
    ? [
        lang?.tyUnlockCredits1 || "Extra AI credits added to your balance",
        lang?.tyUnlockCredits2 || "Keep generating without changing your plan",
        lang?.tyUnlockCredits3 || "Use credits across all studio tools",
      ]
    : [
        lang?.tyUnlock1 || "Full access to the AI creator studio",
        lang?.tyUnlock2 || "Create AI influencers and generate content",
        lang?.tyUnlock3 || "Script-to-video, talking video, and content writer tools",
        lang?.tyUnlock4 || "Gallery, publishing history, and usage tracking",
        lang?.tyUnlock5 || "Credits included with your plan",
      ];

  const content = (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 7 } }}>
      <Stack spacing={{ xs: 4, md: 5 }} alignItems="stretch">
        {/* Confirmation */}
        <Stack spacing={1.5} alignItems="center" textAlign="center">
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.6,
              borderRadius: 99,
              border: `1px solid ${alpha(theme.palette.success.main, 0.35)}`,
              bgcolor: alpha(theme.palette.success.main, 0.08),
              color: "success.main",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <CheckCircleOutlined sx={{ fontSize: 16 }} />
            {lang?.tyBadge || "Confirmation received"}
          </Box>

          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.85rem", md: "2.6rem" },
              lineHeight: 1.15,
              color: textPrimary,
              fontFamily: config.font_family,
              maxWidth: 640,
            }}
          >
            {lang?.tyWelcome || "Welcome to"} {siteName}
          </Typography>

          <Typography
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1.1rem", md: "1.35rem" },
              color: accent,
              fontFamily: config.font_family,
            }}
          >
            {isCredits
              ? lang?.tyAccessCredits || "Your credits are ready — you’re in."
              : lang?.tyAccessConfirmed ||
                "Your access is confirmed — you’re in."}
          </Typography>

          <Typography
            sx={{
              color: textSecondary,
              fontSize: "1rem",
              lineHeight: 1.7,
              maxWidth: 620,
            }}
          >
            {isCredits
              ? lang?.tyThanksCredits ||
                `Thank you for topping up your credits on ${siteName}. You can continue creating right away from your dashboard.`
              : lang?.tyThanks ||
                `Thank you for purchasing ${siteName}. You now have access to the AI creator studio — build influencers, generate reels, and ship content faster.`}
          </Typography>
        </Stack>

        {/* Unlocked */}
        <Box
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 3,
            border: `1px solid ${borderColor}`,
            bgcolor: "background.paper",
            backgroundImage: isDark
              ? `radial-gradient(ellipse at top, ${alpha(accent, 0.12)}, transparent 55%)`
              : `radial-gradient(ellipse at top, ${alpha(accent, 0.08)}, transparent 55%)`,
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "1.15rem",
              color: textPrimary,
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <AutoAwesomeOutlined sx={{ color: accent, fontSize: 22 }} />
            {lang?.tyUnlockedTitle || "Here’s what you just unlocked"}
          </Typography>
          <Stack spacing={1.2}>
            {unlocked.map((item) => (
              <Box
                key={item}
                sx={{ display: "flex", gap: 1.2, alignItems: "flex-start" }}
              >
                <CheckCircleOutlined
                  sx={{ fontSize: 18, color: "success.main", mt: "2px" }}
                />
                <Typography sx={{ color: textSecondary, fontSize: "0.95rem" }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Access steps */}
        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "1.15rem",
              color: textPrimary,
              mb: 0.75,
            }}
          >
            {lang?.tyHowToAccess || "How to access your account"}
          </Typography>
          <Typography sx={{ color: textSecondary, mb: 2.5, fontSize: "0.95rem" }}>
            {lang?.tyHowToAccessSub ||
              "Follow this simple order to get the best experience:"}
          </Typography>
          <Stack spacing={1.5}>
            {steps.map((s, i) => (
              <StepItem
                key={s.title}
                step={i + 1}
                title={s.title}
                body={s.body}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                borderColor={borderColor}
                accent={accent}
              />
            ))}
          </Stack>
        </Box>

        {/* CTAs */}
        <Box
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 3,
            border: `1px solid ${borderColor}`,
            bgcolor: alpha(accent, isDark ? 0.1 : 0.06),
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "1.15rem",
              color: textPrimary,
              mb: 1,
            }}
          >
            {lang?.tyAccessBelow || "Access your purchase below"}
          </Typography>
          <Typography sx={{ color: textSecondary, mb: 2.5, fontSize: "0.95rem" }}>
            {loggedIn
              ? lang?.tyAccessBelowLoggedIn ||
                "You’re signed in. Head to your dashboard to start creating."
              : lang?.tyAccessBelowLoggedOut ||
                "Sign in with the same email you used at checkout to open your dashboard."}
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              startIcon={
                loggedIn ? <DashboardOutlined /> : <LoginOutlined />
              }
              onClick={goDashboard}
              sx={{
                px: 3,
                py: 1.3,
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              {loggedIn
                ? lang?.goToDashboard || "Go to Dashboard"
                : lang?.tySignInDashboard || "Sign in to Dashboard"}
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<SupportAgentOutlined />}
              onClick={() => history.push("/contact")}
              sx={{
                px: 3,
                py: 1.3,
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              {lang?.tyContactSupport || "Contact Support"}
            </Button>
          </Stack>
        </Box>

        {/* Support */}
        <Box
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 3,
            border: `1px solid ${borderColor}`,
            bgcolor: "background.paper",
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "1.1rem",
              color: textPrimary,
              mb: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <MailOutline sx={{ fontSize: 20, color: accent }} />
            {lang?.tyNeedSupport || "Need support?"}
          </Typography>
          <Typography sx={{ color: textSecondary, fontSize: "0.95rem", mb: 1.5 }}>
            {lang?.tySupportBody ||
              "If you have any access issues or questions, reach out through our contact page. We typically respond within 24–48 hours."}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              variant="text"
              onClick={() => history.push("/contact")}
              sx={{ fontWeight: 700, textTransform: "none", justifyContent: "flex-start" }}
            >
              {lang?.contactUs || "Contact Us"} →
            </Button>
            {loggedIn && (
              <Button
                variant="text"
                onClick={() => history.push("/user?page=help")}
                sx={{ fontWeight: 700, textTransform: "none", justifyContent: "flex-start" }}
              >
                {lang?.tyOpenHelpDesk || "Open Help Desk"} →
              </Button>
            )}
          </Stack>
        </Box>

        {/* Reminder + final note */}
        <Box
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 2,
            border: `1px dashed ${borderColor}`,
            bgcolor: isDark ? alpha("#fff", 0.02) : alpha("#000", 0.015),
          }}
        >
          <Typography
            sx={{ fontWeight: 700, color: textPrimary, mb: 0.75, fontSize: "0.95rem" }}
          >
            {lang?.tyReminderTitle || "Quick reminder"}
          </Typography>
          <Typography sx={{ color: textSecondary, fontSize: "0.88rem", lineHeight: 1.65 }}>
            {lang?.tyReminderBody ||
              "Results depend on how you use the tools, your niche, and consistency. Start with one workflow, apply it, then improve."}
          </Typography>
        </Box>

        <Typography
          textAlign="center"
          sx={{ color: textSecondary, fontSize: "0.95rem", lineHeight: 1.7 }}
        >
          {lang?.tyFinalNote ||
            "The biggest mistake is collecting tools without implementing. Keep it simple. Start with one creation. Enjoy the studio."}
        </Typography>
      </Stack>
    </Container>
  );

  if (embedded) {
    return (
      <Box sx={{ minHeight: "70vh", bgcolor: "background.default" }}>
        {content}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Header web={web} />
      <Box sx={{ height: { xs: 56, md: 64 } }} />
      <Box sx={{ flex: 1 }}>{content}</Box>
      <FooterComp web={web} />
    </Box>
  );
};

export default ThankYouPage;
