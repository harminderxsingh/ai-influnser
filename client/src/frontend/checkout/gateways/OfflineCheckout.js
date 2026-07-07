import React from "react";
import {
  Box,
  Button,
  Collapse,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  ReceiptLongOutlined,
  KeyboardArrowDownOutlined,
  KeyboardArrowUpOutlined,
} from "@mui/icons-material";

const OfflineCheckout = ({ plan, currency, html, paying, setPaying, lang }) => {
  const theme = useTheme();
  const isOpen = paying === "offline";

  const toggle = () => setPaying(isOpen ? "" : "offline");

  return (
    <Box
      sx={{
        border: `1px solid ${isOpen ? theme.palette.primary.main : theme.palette.divider}`,
        borderRadius: 2,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      {/* ── TRIGGER BUTTON ── */}
      <Button
        fullWidth
        onClick={toggle}
        disableRipple={false}
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 0,
          bgcolor: isOpen
            ? alpha(theme.palette.primary.main, 0.06)
            : "transparent",
          color: "text.primary",
          textTransform: "none",
          "&:hover": {
            bgcolor: alpha(theme.palette.primary.main, 0.06),
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <ReceiptLongOutlined
            fontSize="small"
            sx={{ color: isOpen ? "primary.main" : "text.secondary" }}
          />
          <Typography variant="body2" fontWeight={600}>
            {lang?.offlinePayment || "Offline Payment"}
          </Typography>
        </Box>
        {isOpen ? (
          <KeyboardArrowUpOutlined
            fontSize="small"
            sx={{ color: "text.secondary" }}
          />
        ) : (
          <KeyboardArrowDownOutlined
            fontSize="small"
            sx={{ color: "text.secondary" }}
          />
        )}
      </Button>

      {/* ── EXPANDED CONTENT ── */}
      <Collapse in={isOpen}>
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: "background.paper",
          }}
        >
          {/* ── AMOUNT REMINDER ── */}
          <Box
            sx={{
              mb: 2,
              px: 2,
              py: 1.2,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {lang?.amountToPay || "Amount to Pay"}
            </Typography>
            <Typography variant="body2" fontWeight={700} color="primary">
              {currency.symbol}
              {(parseFloat(plan.price) * currency.rate).toFixed(2)}{" "}
              {currency.code.toUpperCase()}
            </Typography>
          </Box>

          {/* ── ADMIN HTML INSTRUCTIONS ── */}
          <Box
            sx={{
              fontSize: 14,
              lineHeight: 1.7,
              color: theme.palette.text.primary,
              "& a": { color: theme.palette.primary.main },
              "& strong": { color: theme.palette.text.primary },
              "& p": { margin: "0 0 8px" },
              "& table": { width: "100%", borderCollapse: "collapse" },
              "& td": { padding: "4px 0" },
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </Box>
      </Collapse>
    </Box>
  );
};

export default OfflineCheckout;
