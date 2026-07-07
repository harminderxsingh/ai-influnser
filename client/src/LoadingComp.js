import React from "react";
import { Box, Typography, keyframes, useTheme } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { TranslateContext } from "./context/TranslateContext";

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05);
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

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
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
      }}
    >
      {/* Animated Background Circles */}
      <Box
        sx={{
          position: "absolute",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.palette.primary.main}15 0%, transparent 70%)`,
          animation: `${pulse} 3s ease-in-out infinite`,
        }}
      />

      <Box
        sx={{
          position: "absolute",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.palette.secondary.main}15 0%, transparent 70%)`,
          animation: `${pulse} 2s ease-in-out infinite`,
          animationDelay: "0.5s",
        }}
      />

      {/* Main Loading Content */}
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
        {/* Rotating Icon Container */}
        <Box
          sx={{
            position: "relative",
            width: 120,
            height: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Outer Ring */}
          <Box
            sx={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              border: `3px solid ${theme.palette.primary.main}30`,
              borderTopColor: theme.palette.primary.main,
              animation: `${rotate} 1.5s linear infinite`,
            }}
          />

          {/* Inner Circle */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: `${float} 3s ease-in-out infinite`,
              boxShadow: `0 8px 32px ${theme.palette.primary.main}40`,
            }}
          >
            <AutoAwesomeIcon
              sx={{
                fontSize: 40,
                color: theme.palette.primary.contrastText,
                animation: `${pulse} 2s ease-in-out infinite`,
              }}
            />
          </Box>
        </Box>

        {/* Loading Text */}
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              mb: 1,
            }}
          >
            {lang?.appName}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              animation: `${pulse} 2s ease-in-out infinite`,
            }}
          >
            {lang?.ibitMagic}
          </Typography>
        </Box>

        {/* Animated Dots */}
        <Box sx={{ display: "flex", gap: 1 }}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "primary.main",
                animation: `${pulse} 1.5s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Bottom Shimmer Effect */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
          backgroundSize: "1000px 100%",
          animation: `${shimmer} 2s infinite`,
        }}
      />
    </Box>
  );
};

export default LoadingComp;
