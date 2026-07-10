import React from "react";
import { Box, Typography, keyframes, useTheme } from "@mui/material";
import { TranslateContext } from "./context/TranslateContext";

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: translateY(0);
  }
  50% {
    opacity: 0.35;
    transform: translateY(-6px);
  }
`;

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const LoadingComp = () => {
  const theme = useTheme();
  const { lang } = React.useContext(TranslateContext);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: 76,
            height: 76,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              border: `2px solid ${theme.palette.divider}`,
              borderTopColor: theme.palette.text.primary,
              animation: `${rotate} 0.9s linear infinite`,
            }}
          />
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              bgcolor: "background.paper",
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
        </Box>

        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color: "text.primary",
              mb: 1,
            }}
          >
            {lang?.appName || "Loading"}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            {lang?.ibitMagic || lang?.loading || "Please wait..."}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "text.primary",
                animation: `${pulse} 1.5s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default LoadingComp;
