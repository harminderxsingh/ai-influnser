import React from "react";
import {
  Box,
  IconButton,
  Typography,
  Stack,
  Skeleton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { LightMode, DarkMode } from "@mui/icons-material";
import { TranslateContext } from "../../context/TranslateContext";
import { useThemeData } from "../../context/ThemeContext";
import { GlobalContext } from "../../context/GlobalContext";

const AuthLayout = ({ children, maxWidth = 440 }) => {
  const { lang } = React.useContext(TranslateContext);
  const { hitAxios } = React.useContext(GlobalContext);
  const { themeConfig, mode, toggleColorMode } = useThemeData();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [web, setWeb] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      const res = await hitAxios({
        path: "/api/web/get_web_public",
        post: false,
        admin: false,
        showLoading: false,
        showSnackbar: false,
      });
      if (res?.data?.success) setWeb(res.data.data);
    })();
  }, [hitAxios]);

  const siteName = web?.site_name || "My App";
  const logoUrl = web?.site_logo ? `/media/${web.site_logo}` : null;
  const metaTitle = web?.meta_title || siteName;

  React.useEffect(() => {
    if (metaTitle) document.title = metaTitle;
  }, [metaTitle]);

  const BrandMark = () => (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="center"
      alignItems="center"
      mb={2}
    >
      {web === null ? (
        <>
          <Skeleton
            variant="rounded"
            width={isMobile ? 40 : 56}
            height={isMobile ? 40 : 56}
            sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
          />
          <Skeleton
            variant="text"
            width={120}
            height={isMobile ? 32 : 48}
            sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
          />
        </>
      ) : (
        <>
          {logoUrl ? (
            <Box
              component="img"
              src={logoUrl}
              alt={siteName}
              sx={{
                width: { xs: 40, md: 56 },
                height: { xs: 40, md: 56 },
                objectFit: "contain",
                borderRadius: 2,
                filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.3))",
              }}
            />
          ) : (
            <Box
              sx={{
                width: { xs: 40, md: 56 },
                height: { xs: 40, md: 56 },
                background: "rgba(255,255,255,0.25)",
                backdropFilter: "blur(8px)",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid rgba(255,255,255,0.4)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              }}
            >
              <Typography
                sx={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: { xs: "1.2rem", md: "1.5rem" },
                }}
              >
                {siteName.charAt(0).toUpperCase()}
              </Typography>
            </Box>
          )}
          <Typography
            variant={isMobile ? "h5" : "h3"}
            sx={{
              color: "white",
              fontWeight: 300,
              letterSpacing: 2,
              textShadow: "0 2px 12px rgba(0,0,0,0.2)",
            }}
          >
            {siteName}
          </Typography>
        </>
      )}
    </Stack>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      <Box
        sx={{
          flex: { xs: "0 0 220px", md: 1 },
          background:
            themeConfig?.gradient_secondary ||
            `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 50%, ${theme.palette.primary.main} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background: `radial-gradient(circle, ${theme.palette.primary.main}22 0%, transparent 70%)`,
            animation: "rotateBg 20s linear infinite",
          },
          "@keyframes rotateBg": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" },
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            px: { xs: 3, md: 6 },
          }}
        >
          <BrandMark />
          {!isMobile && (
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255,255,255,0.75)",
                fontWeight: 300,
                letterSpacing: 0.5,
                mt: 1,
              }}
            >
              {lang?.brandTagline || "Create. Innovate. Inspire."}
            </Typography>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          flex: { xs: 1, md: 1 },
          bgcolor: "background.default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, sm: 4, md: 6 },
          position: "relative",
        }}
      >
        <IconButton
          onClick={toggleColorMode}
          sx={{
            position: "absolute",
            top: { xs: 16, md: 24 },
            right: { xs: 16, md: 24 },
            bgcolor: "background.paper",
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            "&:hover": {
              bgcolor: "background.paper",
              transform: "scale(1.05)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            },
            transition: "all 0.2s ease",
          }}
        >
          {mode === "dark" ? (
            <LightMode sx={{ color: "warning.main" }} />
          ) : (
            <DarkMode sx={{ color: "primary.main" }} />
          )}
        </IconButton>

        <Box sx={{ width: "100%", maxWidth }}>
          {typeof children === "function"
            ? children({ web, siteName, lang })
            : children}

          {web?.site_name && (
            <Typography
              variant="caption"
              color="text.disabled"
              textAlign="center"
              display="block"
              mt={3}
              fontSize="0.7rem"
            >
              © {new Date().getFullYear()} {web.site_name}.{" "}
              {lang?.copyrightText || "All rights reserved."}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AuthLayout;
