import React from "react";
import PageHeader from "../../common/PageHeader";
import { GlobalContext } from "../../context/GlobalContext";
import { Add } from "@mui/icons-material";
import { Box, Button, Typography, Stack, Alert } from "@mui/material";
import TiktokAccountCard from "./components/TiktokAccountCard";
import TiktokConnectPopup from "./components/TiktokConnectPopup";

// TikTok brand gradient
const ttGradient =
  "linear-gradient(135deg, #010101 0%, #69C9D0 50%, #EE1D52 100%)";

// TikTok logo SVG icon
const TiktokIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);

const LinkTiktok = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);

  const [accounts, setAccounts] = React.useState([]);
  const [connecting, setConnecting] = React.useState(false);
  const [popupUrl, setPopupUrl] = React.useState(null);
  const [error, setError] = React.useState("");

  const fetchAccounts = async () => {
    const res = await hitAxios({
      path: "/api/tiktok/accounts",
      post: false,
      admin: false,
    });
    if (res?.data?.success) {
      setAccounts(res.data.accounts || []);
    }
  };

  React.useEffect(() => {
    fetchAccounts();
  }, []);

  const handleConnect = async () => {
    setError("");
    setConnecting(true);
    const res = await hitAxios({
      path: "/api/tiktok/auth-url",
      post: false,
      admin: false,
    });
    if (res?.data?.success) {
      setPopupUrl(res.data.url);
    } else {
      setError(
        res?.data?.msg || lang?.ttErrorConnecting || "Could not get auth URL",
      );
      setConnecting(false);
    }
  };

  const handleConnected = () => {
    setPopupUrl(null);
    setConnecting(false);
    fetchAccounts();
  };

  const handleDelete = async (id) => {
    await hitAxios({
      path: "/api/tiktok/delete-account",
      post: true,
      admin: false,
      obj: { id },
    });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <Box>
      {popupUrl && (
        <TiktokConnectPopup url={popupUrl} onConnected={handleConnected} />
      )}

      <PageHeader
        icon={() => <TiktokIcon />}
        title={lang?.linkTiktok || "TikTok Accounts"}
        subtitle={lang?.linkTiktokDes || "Connect your TikTok accounts"}
        primaryAction={
          <Button
            startIcon={<Add />}
            variant="contained"
            size="large"
            disabled={connecting}
            onClick={handleConnect}
            sx={{
              background: ttGradient,
              "&:hover": { opacity: 0.88, background: ttGradient },
              "&:disabled": { opacity: 0.5 },
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            {connecting
              ? lang?.connecting || "Connecting..."
              : lang?.ttAddAccount || "Add Account"}
          </Button>
        }
      />

      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {accounts.length === 0 ? (
          /* ── Empty State ── */
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 10,
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 76,
                height: 76,
                borderRadius: "50%",
                background: ttGradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(238,29,82,0.25)",
              }}
            >
              <TiktokIcon size={36} color="#fff" />
            </Box>

            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "text.primary" }}
            >
              {lang?.ttNoAccountsYet || "No TikTok accounts connected yet"}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                textAlign: "center",
                maxWidth: 360,
              }}
            >
              {lang?.ttNoAccountsDes ||
                'Click "Add Account" to connect your TikTok account and start managing content.'}
            </Typography>

            <Button
              startIcon={<Add />}
              variant="contained"
              onClick={handleConnect}
              disabled={connecting}
              sx={{
                background: ttGradient,
                "&:hover": { opacity: 0.88, background: ttGradient },
                "&:disabled": { opacity: 0.5 },
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                mt: 1,
              }}
            >
              {lang?.ttAddAccount || "Add Account"}
            </Button>
          </Box>
        ) : (
          <Stack gap={1.5}>
            <Typography
              variant="caption"
              sx={{
                color: "text.disabled",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {accounts.length}{" "}
              {lang?.ttAccountsConnected || "account(s) connected"}
            </Typography>

            {accounts.map((account) => (
              <TiktokAccountCard
                key={account.id}
                account={account}
                onDelete={handleDelete}
                lang={lang}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default LinkTiktok;
