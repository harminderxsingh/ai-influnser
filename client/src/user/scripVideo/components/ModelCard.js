// addNewProduct/ModelCard.js
import React from "react";
import {
  Box,
  Card,
  Typography,
  alpha,
  useTheme,
  Chip,
  CardMedia,
} from "@mui/material";
import { CheckCircleOutlined } from "@mui/icons-material";

const ModelCard = ({ model, isSelected, onSelect }) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      sx={{
        position: "relative",
        borderRadius: 3,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        border: `3px solid ${
          isSelected ? theme.palette.success.main : "transparent"
        }`,
        boxShadow: isSelected
          ? `0 12px 40px ${alpha(theme.palette.success.main, 0.4)}`
          : `0 8px 24px ${alpha("#000000", 0.12)}`,
        transform: isSelected ? "scale(1.02)" : "scale(1)",
        "&:hover": {
          transform: isSelected ? "scale(1.02)" : "translateY(-8px)",
          boxShadow: `0 16px 48px ${alpha(
            isSelected ? theme.palette.success.main : "#000000",
            0.25,
          )}`,
          "& .model-image": {
            transform: "scale(1.1)",
          },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          paddingTop: "125%",
          overflow: "hidden",
          bgcolor: theme.palette.grey[200],
        }}
      >
        <CardMedia
          component="img"
          image={`/media/${model.photo_url}`}
          alt={model.name}
          className="model-image"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(to bottom, ${alpha(
              "#000000",
              0.6,
            )} 0%, transparent 30%, transparent 60%, ${alpha(
              "#000000",
              0.8,
            )} 100%)`,
            opacity: isHovered || isSelected ? 1 : 0.7,
            transition: "opacity 0.4s ease",
          }}
        />

        {/* Status Badge */}
        <Box
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 3,
          }}
        >
          <Chip
            label={model.status === "active" ? "Active" : "Processing"}
            size="small"
            sx={{
              bgcolor:
                model.status === "active"
                  ? alpha(theme.palette.success.main, 0.95)
                  : alpha(theme.palette.warning.main, 0.95),
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "0.65rem",
              height: 24,
              backdropFilter: "blur(10px)",
              boxShadow: `0 4px 12px ${alpha(
                model.status === "active"
                  ? theme.palette.success.main
                  : theme.palette.warning.main,
                0.4,
              )}`,
            }}
          />
        </Box>

        {/* Select Checkbox */}
        <Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 3,
            ...(isSelected && {
              animation: "popIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
              "@keyframes popIn": {
                "0%": { transform: "scale(0) rotate(-180deg)", opacity: 0 },
                "100%": { transform: "scale(1) rotate(0deg)", opacity: 1 },
              },
            }),
          }}
        >
          <Box
            sx={{
              bgcolor: isSelected
                ? alpha(theme.palette.success.main, 0.95)
                : alpha("#FFFFFF", 0.3),
              borderRadius: "50%",
              width: isSelected ? 48 : 40,
              height: isSelected ? 48 : 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isSelected
                ? `0 6px 20px ${alpha(theme.palette.success.main, 0.5)}`
                : `0 4px 12px ${alpha("#000000", 0.3)}`,
              border: `${isSelected ? 3 : 2}px solid #FFFFFF`,
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.1)",
              },
            }}
          >
            <CheckCircleOutlined
              sx={{
                fontSize: isSelected ? 28 : 24,
                color: "#FFFFFF",
              }}
            />
          </Box>
        </Box>

        {/* Bottom Info */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            zIndex: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "1rem",
              textShadow: `0 2px 8px ${alpha("#000000", 0.6)}`,
            }}
          >
            {model.name}
          </Typography>
          {model.description && (
            <Typography
              variant="body2"
              sx={{
                color: "#FFFFFF",
                fontSize: "0.8rem",
                textShadow: `0 2px 8px ${alpha("#000000", 0.6)}`,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {model.description}
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  );
};

export default ModelCard;
