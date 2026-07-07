import React from "react";
import PageHeader from "../../common/PageHeader";
import { GlobalContext } from "../../context/GlobalContext";
import { Add, Instagram } from "@mui/icons-material";
import { Box, Button, Typography, Stack, Alert } from "@mui/material";
import AccountCard from "./components/AccountCard";
import ConnectPopup from "./components/ConnectPopup";

const igGradient =
  "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)";

const LinkInsta = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);

  const [accounts, setAccounts] = React.useState([]);
  const [connecting, setConnecting] = React.useState(false);
  const [popupUrl, setPopupUrl] = React.useState(null);
  const [error, setError] = React.useState("");

  const fetchAccounts = async () => {
    const res = await hitAxios({
      path: "/api/insta/accounts",
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
      path: "/api/insta/auth-url",
      post: false,
      admin: false,
    });
    if (res?.data?.success) {
      setPopupUrl(res.data.url);
    } else {
      setError(
        res?.data?.msg || lang?.errorConnecting || "Could not get auth URL",
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
      path: "/api/insta/delete-account",
      post: true,
      admin: false,
      obj: { id },
    });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <Box>
      {popupUrl && (
        <ConnectPopup url={popupUrl} onConnected={handleConnected} />
      )}

      <PageHeader
        icon={Instagram}
        title={lang?.linkInsta || "Instagram Accounts"}
        subtitle={
          lang?.linkInstaDes || "Connect your Instagram Business accounts"
        }
        primaryAction={
          <Button
            startIcon={<Add />}
            variant="contained"
            size="large"
            disabled={connecting}
            onClick={handleConnect}
            sx={{
              background: igGradient,
              "&:hover": { opacity: 0.88, background: igGradient },
              "&:disabled": { opacity: 0.5 },
            }}
          >
            {connecting
              ? lang?.connecting || "Connecting..."
              : lang?.add || "Add Account"}
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
            {/* Instagram gradient icon circle */}
            <Box
              sx={{
                width: 76,
                height: 76,
                borderRadius: "50%",
                background: igGradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(188,24,136,0.25)",
              }}
            >
              <Instagram sx={{ color: "#fff", fontSize: 38 }} />
            </Box>

            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "text.primary" }}
            >
              {lang?.noAccountsYet || "No accounts connected yet"}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                textAlign: "center",
                maxWidth: 360,
              }}
            >
              {lang?.noAccountsDes ||
                'Click "Add Account" to connect your Instagram Business account.'}
            </Typography>

            <Button
              startIcon={<Add />}
              variant="contained"
              onClick={handleConnect}
              disabled={connecting}
              sx={{
                background: igGradient,
                "&:hover": { opacity: 0.88, background: igGradient },
                "&:disabled": { opacity: 0.5 },
                mt: 1,
              }}
            >
              {lang?.add || "Add Account"}
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
              {lang?.accountsConnected || "account(s) connected"}
            </Typography>

            {accounts.map((account) => (
              <AccountCard
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

export default LinkInsta;
