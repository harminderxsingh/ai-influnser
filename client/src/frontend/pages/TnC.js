import React from "react";
import { GlobalContext } from "../../context/GlobalContext";
import Header from "../components/Header";
import FooterComp from "../components/FooterComp";
import {
  Box,
  Container,
  Typography,
  Skeleton,
  useTheme,
  alpha,
} from "@mui/material";
import { GavelOutlined } from "@mui/icons-material";
import { useCustomTheme } from "../../utils/useCustomTheme";
import { TranslateContext } from "../../context/TranslateContext";

const TnC = () => {
  const { lang } = React.useContext(TranslateContext);
  const [page, setPage] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const { hitAxios } = React.useContext(GlobalContext);
  const theme = useTheme();
  const { config, isDark } = useCustomTheme();

  const textPrimary = isDark
    ? config.text_primary_dark
    : config.text_primary_light;
  const textSecondary = isDark
    ? config.text_secondary_dark
    : config.text_secondary_light;
  const borderColor = isDark ? config.border_dark : config.border_light;

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await hitAxios({
        path: "/api/web/get_pages_html",
        post: false,
        admin: false,
      });
      if (cancelled) return;
      if (res?.data?.success) {
        setPage(res.data.data?.tnc_html || null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      minHeight="100vh"
      bgcolor="background.default"
      display="flex"
      flexDirection="column"
    >
      <Header />

      {/* ── fixed AppBar offset ── */}
      <Box sx={{ height: `${config.appBar.height}px` }} />

      {/* ── Hero Banner ── */}
      <Box
        sx={{
          borderBottom: `1px solid ${borderColor}`,
          background: isDark
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%)`,
          py: { xs: 5, md: 7 },
        }}
      >
        <Container maxWidth="md">
          <Box display="flex" alignItems="center" gap={2} mb={1.5}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: `${config.box.defaultBorderRadius}px`,
                background: isDark
                  ? config.gradient_primary_dark
                  : config.gradient_primary_light,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <GavelOutlined
                sx={{ fontSize: 20, color: isDark ? "#000" : "#fff" }}
              />
            </Box>
            <Typography
              variant="h4"
              fontWeight={config.font_weight_bold || 700}
              color={textPrimary}
              fontFamily={config.font_family}
              sx={{ fontSize: { xs: 22, md: 28 }, letterSpacing: "-0.5px" }}
            >
              {lang?.tnc || "Terms & Conditions"}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color={textSecondary}
            fontFamily={config.font_family}
            maxWidth={500}
            lineHeight={1.7}
          >
            {lang?.tncSubtitle ||
              "Please read our terms and conditions carefully before using our services."}
          </Typography>
        </Container>
      </Box>

      {/* ── Content ── */}
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 7 }, flex: 1 }}>
        <Box
          sx={{
            bgcolor: "background.paper",
            border: `1px solid ${borderColor}`,
            borderRadius: `${config.box.defaultBorderRadius}px`,
            p: { xs: 3, md: 6 },
            minHeight: 300,
          }}
        >
          {loading ? (
            <Box>
              {[...Array(3)].map((_, i) => (
                <Box key={i} mb={4}>
                  <Skeleton
                    variant="text"
                    width="45%"
                    height={28}
                    sx={{ mb: 1.5, borderRadius: 1 }}
                  />
                  {[...Array(4)].map((_, j) => (
                    <Skeleton
                      key={j}
                      variant="text"
                      width={j === 3 ? "65%" : "100%"}
                      height={18}
                      sx={{ mb: 1, borderRadius: 1 }}
                    />
                  ))}
                </Box>
              ))}
            </Box>
          ) : page ? (
            <Box
              sx={{
                color: textPrimary,
                fontFamily: config.font_family,
                lineHeight: 1.9,
                fontSize: { xs: 14, md: 15 },
                "& h1, & h2, & h3, & h4": {
                  fontFamily: config.font_family,
                  fontWeight: config.font_weight_bold || 700,
                  color: textPrimary,
                  lineHeight: 1.4,
                  mt: 4,
                  mb: 1.5,
                },
                "& h1": { fontSize: { xs: 22, md: 26 } },
                "& h2": { fontSize: { xs: 18, md: 21 } },
                "& h3": { fontSize: { xs: 15, md: 17 } },
                "& p": {
                  mb: 2,
                  color: textSecondary,
                  fontFamily: config.font_family,
                },
                "& ul, & ol": { pl: 3, mb: 2 },
                "& li": {
                  mb: 0.75,
                  color: textSecondary,
                  fontFamily: config.font_family,
                },
                "& a": {
                  color: theme.palette.primary.main,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                },
                "& strong, & b": {
                  color: textPrimary,
                  fontWeight: config.font_weight_semibold || 600,
                },
                "& blockquote": {
                  borderLeft: `3px solid ${theme.palette.primary.main}`,
                  pl: 2,
                  ml: 0,
                  my: 2.5,
                  color: textSecondary,
                  fontStyle: "italic",
                },
                "& hr": {
                  border: "none",
                  borderTop: `1px solid ${borderColor}`,
                  my: 3,
                },
                "& table": {
                  width: "100%",
                  borderCollapse: "collapse",
                  mb: 2,
                  fontFamily: config.font_family,
                },
                "& th, & td": {
                  border: `1px solid ${borderColor}`,
                  p: 1.5,
                  textAlign: "left",
                  fontSize: 13,
                  color: textSecondary,
                },
                "& th": {
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  fontWeight: config.font_weight_semibold || 600,
                  color: textPrimary,
                },
              }}
              dangerouslySetInnerHTML={{ __html: page }}
            />
          ) : (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={10}
              gap={2}
            >
              <GavelOutlined
                sx={{
                  fontSize: 52,
                  color: alpha(theme.palette.text.secondary, 0.15),
                }}
              />
              <Typography
                variant="body2"
                color={textSecondary}
                fontFamily={config.font_family}
                fontWeight={500}
              >
                {lang?.tncEmpty ||
                  "Terms & Conditions content has not been added yet."}
              </Typography>
            </Box>
          )}
        </Box>
      </Container>

      <FooterComp />
    </Box>
  );
};

export default TnC;
